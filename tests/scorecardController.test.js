jest.setTimeout(5000);

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Scorecard = require('../models/Scorecard');

describe('Scorecard API', () => {
  let scorecardId;

  beforeAll(async () => {
    const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean15b_test';
    await mongoose.connect(testUri, {});
  }, 5000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should get all scorecards', async () => {
    const res = await request(app)
      .get('/api/scorecards')
      ;
    expect(res.statusCode).toBe(200);
    if (Array.isArray(res.body)) {
      expect(Array.isArray(res.body)).toBe(true);
    } else if (Array.isArray(res.body.scorecards)) {
      expect(Array.isArray(res.body.scorecards)).toBe(true);
    } else {
      throw new Error('Response does not contain an array of scorecards');
    }
  }, 5000);

  it('should create a new scorecard', async () => {
    const scorecardData = {
      course: 'Test Scorecard',
      date: new Date().toISOString(),
      user: 'user1',
      scores: [],
    };
    const res = await request(app)
      .post('/api/scorecards')
      
      .send(scorecardData);
    expect(res.statusCode).toBe(201);
    if (res.body.scorecard && res.body.scorecard.course) {
      expect(res.body.scorecard.course).toBe('Test Scorecard');
      scorecardId = res.body.scorecard._id;
    } else if (res.body.name) {
      expect(res.body.name).toBe('Test Scorecard');
      scorecardId = res.body._id;
    } else {
      throw new Error('Response does not contain scorecard name');
    }
  }, 5000);

  it('should get a scorecard by ID', async () => {
    const res = await request(app)
      .get(`/api/scorecards/${scorecardId}`)
      ;
    expect(res.statusCode).toBe(200);
    if (res.body.scorecard && res.body.scorecard._id) {
      expect(res.body.scorecard._id).toBe(scorecardId);
    } else if (res.body._id) {
      expect(res.body._id).toBe(scorecardId);
    } else {
      throw new Error('Response does not contain scorecard _id');
    }
  }, 5000);

  it('should update a scorecard', async () => {
    const res = await request(app)
      .put(`/api/scorecards/${scorecardId}`)
      
      .send({ course: 'Updated Scorecard' });
    expect(res.statusCode).toBe(200);
    if (res.body.scorecard && res.body.scorecard.course) {
      expect(res.body.scorecard.course).toBe('Updated Scorecard');
    } else if (res.body.course) {
      expect(res.body.course).toBe('Updated Scorecard');
    } else {
      throw new Error('Response does not contain updated scorecard course');
    }
  }, 5000);

  it('should delete a scorecard', async () => {
    const res = await request(app)
      .delete(`/api/scorecards/${scorecardId}`)
      ;
    expect(res.statusCode).toBe(200);
    if (res.body.success !== undefined) {
      expect(res.body.success).toBe(true);
    } else if (res.body.scorecard && res.body.scorecard._id) {
      expect(res.body.scorecard._id).toBe(scorecardId);
    } else {
      throw new Error('Response does not contain success or deleted scorecard');
    }
  }, 5000);
});
