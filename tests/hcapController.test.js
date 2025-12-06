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
});
