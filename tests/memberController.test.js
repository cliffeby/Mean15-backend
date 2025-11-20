jest.setTimeout(20000); // Increase timeout for async operations
// Member Controller Tests (Jest)
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Member = require('../models/Member');

describe('Member API', () => {

  let memberId;
  let token;

  beforeAll(async () => {
    // Connect to test MongoDB
    const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b_test';
  await mongoose.connect(testUri, {});
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

    // Authenticate as admin and get JWT token
    const adminEmail = 'admin@example.com';
    const adminPassword = 'adminpass';
    // Try to register admin, but ignore error if already exists
    try {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    } catch (err) {
      // Ignore registration error (likely already exists)
      console.log('Admin registration error (expected if already exists):', err.message);
    }
    // Login as admin
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    if (!res.body.token) {
      throw new Error('Failed to obtain admin JWT token: ' + JSON.stringify(res.body));
    }
    token = res.body.token;
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should get all members', async () => {
    const res = await request(app)
      .get('/api/members')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    // Accept either array or object with array property
    if (Array.isArray(res.body)) {
      expect(Array.isArray(res.body)).toBe(true);
    } else if (Array.isArray(res.body.members)) {
      expect(Array.isArray(res.body.members)).toBe(true);
    } else {
      throw new Error('Response does not contain an array of members');
    }
  }, 30000);

    it('should create a new member', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Test', lastName: 'User', email: 'test@example.com', user: 'user1' });
    expect(res.statusCode).toBe(201);
    expect(res.body.member.firstName).toBe('Test');
    expect(res.body.member.fullName).toBe('Test User');
    memberId = res.body.member._id;
  }, 30000);



  it('should get a member by ID', async () => {
    
    const res = await request(app)
      .get(`/api/members/${memberId}`)
      .set('Authorization', `Bearer ${token}`);
    console.log('Get member by ID response:', res.body);
    expect(res.statusCode).toBe(200);
    // Accept either member._id or _id
    if (res.body.member && res.body.member._id) {
      expect(res.body.member._id).toBe(memberId);
    } else if (res.body._id) {
      expect(res.body._id).toBe(memberId);
    } else {
      throw new Error('Response does not contain member _id');
    }
  }, 30000);
  
    it('should create a member and set fullname/fullnameR', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Jane', lastName: 'Doe', email: 'janedoe@example.com', user: 'user2' });
        expect(res.statusCode).toBe(201);
      // Check fullname and fullnameR in response
      console.log('Create member response for fullname test:', res.body.member);
      expect(res.body.member.fullName).toBe('Jane Doe');
      expect(res.body.member.fullNameR).toBe('Doe, Jane');
      memberId = res.body.member._id;
    }, 30000);
  
   it('should get member and verify fullname/fullnameR', async () => {
    const res = await request(app)
      .get(`/api/members/${memberId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res).toBeDefined();
    expect(res.body).toBeDefined();
    console.log('Get member fullname response:', res.body);
    expect(res.statusCode).toBe(200);
      expect(res.body.member.fullName).toBe('Jane Doe');
      expect(res.body.member.fullNameR).toBe('Doe, Jane');
  }, 30000);

  it('should update a member', async () => {
    const res = await request(app)
      .put(`/api/members/${memberId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Updated' });
    expect(res.statusCode).toBe(200);
    expect(res.body.member.firstName).toBe('Updated');
  }, 30000);

  it('should delete a member', async () => {
    const res = await request(app)
      .delete(`/api/members/${memberId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  }, 30000);

    it('should reject USGAIndex above allowed max', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Invalid', lastName: 'Index', email: 'invalidusga2@example.com', user: 'user2', usgaIndex: 60 });
    console.log('USGAIndex above max response:', res.body);
    expect(res.statusCode).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/USGAIndex/i);
  }, 30000);

  it('should reject USGAIndex below allowed min', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Invalid', lastName: 'Index', email: 'invalidusga3@example.com', user: 'user2', usgaIndex: -15 });
    console.log('USGAIndex below min response:', res.body);
    expect(res.statusCode).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/USGAIndex/i);
  }, 30000);

  it('should reject non-numeric USGAIndex', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Invalid', lastName: 'Index', email: 'invalidusga4@example.com', user: 'user2', usgaIndex: 'abc' });
    console.log('USGAIndex non-numeric response:', res.body);
    expect(res.statusCode).toBe(400);
    expect(res.body.error || res.body.message).toMatch(/USGAIndex/i);
  }, 30000);

  it('should accept valid USGAIndex', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Valid', lastName: 'Index', email: 'validusga@example.com', user: 'user2', usgaIndex: 12.5 });
    console.log('USGAIndex valid response:', res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.member.usgaIndex).toBe(12.5);
  }, 30000);
  
});
