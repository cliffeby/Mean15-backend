const request = require('supertest');
const app = require('../app');

async function run() {
  try {
    console.log('Starting HCap smoke test...');
    // Ensure admin user exists and get token
    const adminEmail = 'admin@example.com';
    const adminPassword = 'adminpass';
    try {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
    } catch (e) {
      // ignore
    }
    const login = await request(app).post('/api/auth/login').send({ email: adminEmail, password: adminPassword });
    const token = login.body.token;
    if (!token) throw new Error('Failed to obtain admin token for smoke test');

    // GET list
    const listRes = await request(app).get('/api/hcaps').set('Authorization', `Bearer ${token}`);
    console.log('GET /api/hcaps status:', listRes.status);

    // POST create
    const createRes = await request(app)
      .post('/api/hcaps')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Smoke HCap', postedScore: 77 });
    console.log('POST /api/hcaps status:', createRes.status, 'id:', createRes.body.hcap && createRes.body.hcap._id);

    // Cleanup
    if (createRes.body.hcap && createRes.body.hcap._id) {
      const del = await request(app)
        .delete(`/api/hcaps/${createRes.body.hcap._id}`)
        .set('Authorization', `Bearer ${token}`);
      console.log('DELETE smoke HCap status:', del.status);
    }

    console.log('HCap smoke test completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(2);
  }
}

run();
