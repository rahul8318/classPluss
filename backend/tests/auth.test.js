const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('ClassPulse Authentication & Authorization API', () => {
  const teacherPayload = {
    name: 'Dr. Jane Smith',
    email: 'jane.smith@classpulse.edu',
    password: 'Password123!',
    role: 'teacher',
  };

  const studentPayload = {
    name: 'Alex Johnson',
    email: 'alex.j@classpulse.edu',
    password: 'Password123!',
    role: 'student',
  };

  it('should register a new teacher successfully with token and hashed password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(teacherPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(teacherPayload.email);
    expect(res.body.data.user.role).toBe('teacher');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeDefined();
  });

  it('should register a new student successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(studentPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(teacherPayload)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('should login an existing user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: teacherPayload.email,
        password: teacherPayload.password,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(teacherPayload.email);
  });

  it('should reject login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: teacherPayload.email,
        password: 'wrong_password_123',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('should retrieve authenticated user profile with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: teacherPayload.email,
        password: teacherPayload.password,
      });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe(teacherPayload.name);
  });
});
