const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const HCap = require('../models/HCap');
const dotenv = require('dotenv');
dotenv.config();

let hcapId;
let token;

describe('HCap Controller', () => {
  beforeAll(async () => {
    // Ensure JWT secret is available for test token signing
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_tests';
    const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b_test';
    await mongoose.connect(testUri, {});

    const adminEmail = 'admin@example.com';
    const adminPassword = 'adminpass';
    try {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    } catch (err) {
      // ignore if exists
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    if (!res.body.token) throw new Error('Failed to get admin token');
    token = res.body.token;
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET /api/hcaps should return array', async () => {
    const res = await request(app).get('/api/hcaps').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.hcaps)).toBe(true);
  });

  it('POST /api/hcaps should create HCap', async () => {
    const data = { name: 'Test HCap', postedScore: 80 };
    const res = await request(app)
      .post('/api/hcaps')
      .set('Authorization', `Bearer ${token}`)
      .send(data);
    expect(res.statusCode).toBe(201);
    expect(res.body.hcap.postedScore).toBe(80);
    hcapId = res.body.hcap._id;
  });

  it('PUT /api/hcaps/:id should update HCap', async () => {
    const res = await request(app)
      .put(`/api/hcaps/${hcapId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ postedScore: 85 });
    expect(res.statusCode).toBe(200);
    expect(res.body.hcap.postedScore).toBe(85);
  });

  it('DELETE /api/hcaps/:id should delete HCap', async () => {
    const res = await request(app)
      .delete(`/api/hcaps/${hcapId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should update member.lastDatePlayed when creating HCap with memberId', async () => {
    const Member = require('../models/Member');
    const member = await Member.create({ firstName: 'HC', lastName: 'Tester' });
    const testDate = '2025-12-04';
    const res = await request(app)
      .post('/api/hcaps')
      .set('Authorization', `Bearer ${token}`)
      .send({ memberId: member._id, postedScore: 90, datePlayed: testDate });
    expect(res.statusCode).toBe(201);
    const updated = await Member.findById(member._id);
    const actual = new Date(updated.lastDatePlayed).toISOString().slice(0, 10);
    expect(actual).toBe(testDate);
  });

  it('POST /api/hcaps should populate user and username when userId provided', async () => {
    const User = require('../models/User');
    let testUser = await User.findOne({ email: 'createhcap@example.com' });
    if (!testUser) {
      testUser = await User.create({ name: 'CreateHCapUser', email: 'createhcap@example.com', password: 'pass1234' });
    }

    const res = await request(app)
      .post('/api/hcaps')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: testUser._id, postedScore: 75 });

    expect(res.statusCode).toBe(201);
    const created = res.body.hcap;
    expect(created).toBeDefined();
    // Controller should populate `user` from User.name and mirror to `username`
    expect(created.user).toBe(testUser.name);
    expect(created.username).toBe(testUser.name);
  });
});
