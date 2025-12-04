// backend/tests/scoreController.test.js
// Jest test suite for Score Controller

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Score = require('../models/Score');
const dotenv = require('dotenv');
dotenv.config();


  let scoreId;
  let token;

describe('Score Controller', () => {


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

  describe('GET /api/scores', () => {
    it('should return all scores', async () => {
      // Arrange: create test scores
      await Score.create([{ score: 10 }, { score: 20 }]);
      // Act
      const res = await request(app)
      .get('/api/scores')
      .set('Authorization', `Bearer ${token}`);
      // Assert
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.scores)).toBe(true);
      console.log('Scores returned:', res.body.scores);
    //   expect(res.body.scores.length).toBe(2);
    });
  });

  describe('POST /api/scores', () => {
    it('should create a new score', async () => {
      const scoreData = { score: 42 };
      const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${token}`)
      .send(scoreData);
      expect(res.statusCode).toBe(201);
      expect(res.body.score.score).toBe(42);
    });
  });

  describe('PUT /api/scores/:id', () => {
    it('should update a score', async () => {
      // First, create a score to update
      const created = await Score.create({ score: 55 });
      scoreId = created._id;
      // Act: update the score
      const res = await request(app)
        .put(`/api/scores/${scoreId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 99 });
      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.score.score).toBe(99);
    });
  });

  describe('DELETE /api/scores/:id', () => {
    it('should delete a score', async () => {
      // First, create a score to delete
      const created = await Score.create({ score: 77 });
      scoreId = created._id;
      // Act: delete the score
      const res = await request(app)
        .delete(`/api/scores/${scoreId}`)
        .set('Authorization', `Bearer ${token}`);
      // Assert
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('lastDatePlayed update', () => {
    it('should update member.lastDatePlayed when a score is created', async () => {
      // Create a test member
      const Member = require('../models/Member');
      const member = await Member.create({ firstName: 'Test', lastName: 'Player' });
      const testDate = '2025-12-03';
      // Create a score for this member with datePlayed
      const scoreData = {
        score: 88,
        memberId: member._id,
        datePlayed: testDate
      };
      const res = await request(app)
        .post('/api/scores')
        .set('Authorization', `Bearer ${token}`)
        .send(scoreData);
      expect(res.statusCode).toBe(201);
      // Fetch the member again
      const updatedMember = await Member.findById(member._id);
      // Compare only the date portion
      const actualDate = new Date(updatedMember.lastDatePlayed).toISOString().slice(0, 10);
      expect(actualDate).toBe(testDate);
    });
  });
});
