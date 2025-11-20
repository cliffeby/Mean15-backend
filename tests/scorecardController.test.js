jest.setTimeout(20000);
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Scorecard = require('../models/Scorecard');

describe('Scorecard API', () => {
  let scorecardId;
  let token;

  beforeAll(async () => {
    const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b_test';
    await mongoose.connect(testUri, {});

    // Authenticate as admin and get JWT token
    const adminEmail = 'admin@example.com';
    const adminPassword = 'adminpass';
    try {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    } catch (err) {
      console.log('Admin registration error (expected if already exists):', err.message);
    }
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

  it('should get all scorecards', async () => {
    const res = await request(app)
      .get('/api/scorecards')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    if (Array.isArray(res.body)) {
      expect(Array.isArray(res.body)).toBe(true);
    } else if (Array.isArray(res.body.scorecards)) {
      expect(Array.isArray(res.body.scorecards)).toBe(true);
    } else {
      throw new Error('Response does not contain an array of scorecards');
    }
  }, 30000);

  it('should create a new scorecard', async () => {
    const scorecardData = {
      name: 'Test Scorecard',
      date: new Date().toISOString(),
      user: 'user1',
      scores: [],
    };
    const res = await request(app)
      .post('/api/scorecards')
      .set('Authorization', `Bearer ${token}`)
      .send(scorecardData);
    expect(res.statusCode).toBe(201);
    if (res.body.scorecard && res.body.scorecard.name) {
      expect(res.body.scorecard.name).toBe('Test Scorecard');
      scorecardId = res.body.scorecard._id;
    } else if (res.body.name) {
      expect(res.body.name).toBe('Test Scorecard');
      scorecardId = res.body._id;
    } else {
      throw new Error('Response does not contain scorecard name');
    }
  }, 30000);

  it('should get a scorecard by ID', async () => {
    const res = await request(app)
      .get(`/api/scorecards/${scorecardId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    if (res.body.scorecard && res.body.scorecard._id) {
      expect(res.body.scorecard._id).toBe(scorecardId);
    } else if (res.body._id) {
      expect(res.body._id).toBe(scorecardId);
    } else {
      throw new Error('Response does not contain scorecard _id');
    }
  }, 30000);

  it('should update a scorecard', async () => {
    const res = await request(app)
      .put(`/api/scorecards/${scorecardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Scorecard' });
    expect(res.statusCode).toBe(200);
    if (res.body.scorecard && res.body.scorecard.name) {
      expect(res.body.scorecard.name).toBe('Updated Scorecard');
    } else if (res.body.name) {
      expect(res.body.name).toBe('Updated Scorecard');
    } else {
      throw new Error('Response does not contain updated scorecard name');
    }
  }, 30000);

  it('should delete a scorecard', async () => {
    const res = await request(app)
      .delete(`/api/scorecards/${scorecardId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    if (res.body.success !== undefined) {
      expect(res.body.success).toBe(true);
    } else if (res.body.scorecard && res.body.scorecard._id) {
      expect(res.body.scorecard._id).toBe(scorecardId);
    } else {
      throw new Error('Response does not contain success or deleted scorecard');
    }
  }, 30000);
});
