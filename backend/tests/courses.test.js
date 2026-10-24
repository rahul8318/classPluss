const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('ClassPulse Course & Enrollment Management API', () => {
  let teacherToken;
  let studentToken;
  let createdCourseId;
  let courseCode;

  beforeAll(async () => {
    // Register Teacher
    const tRes = await request(app).post('/api/auth/register').send({
      name: 'Professor Alan Turing',
      email: 'turing@classpulse.edu',
      password: 'SecurePassword123!',
      role: 'teacher',
    });
    teacherToken = tRes.body.data.token;

    // Register Student
    const sRes = await request(app).post('/api/auth/register').send({
      name: 'Grace Hopper',
      email: 'grace@classpulse.edu',
      password: 'SecurePassword123!',
      role: 'student',
    });
    studentToken = sRes.body.data.token;
  });

  it('teacher should create a new course with auto-generated course code', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Distributed Systems & Cloud Computing',
        description: 'Advanced distributed architectural patterns and microservices.',
        subject: 'Computer Science',
        level: 'Graduate',
        term: 'Fall 2026',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.course.title).toBe('Distributed Systems & Cloud Computing');
    expect(res.body.data.course.code).toMatch(/^CP-\d+/);

    createdCourseId = res.body.data.course._id;
    courseCode = res.body.data.course.code;
  });

  it('student should NOT be permitted to create a course (Server Role Enforcement)', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Student Course',
      })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  it('student should enroll in course using valid invite code', async () => {
    const res = await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code: courseCode })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.enrollment.status).toBe('active');
  });

  it('should prevent duplicate active enrollment for same student in course', async () => {
    const res = await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code: courseCode })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('should retrieve course details with student count and stats', async () => {
    const res = await request(app)
      .get(`/api/courses/${createdCourseId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.studentCount).toBe(1);
  });

  it('should retrieve student roster for course', async () => {
    const res = await request(app)
      .get(`/api/courses/${createdCourseId}/students`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.students.length).toBe(1);
    expect(res.body.data.students[0].student.name).toBe('Grace Hopper');
  });
});
