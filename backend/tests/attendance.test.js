const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('ClassPulse Attendance Management & Spring Boot Sync API', () => {
  let teacherToken;
  let studentToken;
  let studentId;
  let courseId;
  let checkInCode;

  beforeAll(async () => {
    const tRes = await request(app).post('/api/auth/register').send({
      name: 'Professor Barbara Liskov',
      email: 'barbara@classpulse.edu',
      password: 'Password123!',
      role: 'teacher',
    });
    teacherToken = tRes.body.data.token;

    const sRes = await request(app).post('/api/auth/register').send({
      name: 'Donald Knuth',
      email: 'knuth@classpulse.edu',
      password: 'Password123!',
      role: 'student',
    });
    studentToken = sRes.body.data.token;
    studentId = sRes.body.data.user._id || sRes.body.data.user.id;

    const cRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Data Abstraction & Hierarchy' });
    courseId = cRes.body.data.course._id;
    const code = cRes.body.data.course.code;

    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code });
  });

  it('teacher should generate a time-limited 6-character check-in code and QR token', async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/attendance/session-code`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ durationMinutes: 20 })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toHaveLength(6);
    expect(res.body.data.qrToken).toBeDefined();

    checkInCode = res.body.data.code;
  });

  it('student should check in using the valid time-limited code', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code: checkInCode })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('present');
  });

  it('student cannot check in more than once for the same class session', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code: checkInCode })
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('teacher should import live session participants from Spring Boot backend', async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/attendance/import-live-session`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        sessionId: 'sb-live-98214',
        sessionDate: '2026-10-25',
        participants: [
          { studentId: studentId, joinedAt: new Date().toISOString() },
        ],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.importedCount).toBe(1);
    expect(res.body.data.attendance.isConfirmed).toBe(false); // Teacher confirmation required
  });

  it('teacher should retrieve attendance report with attendance percentage', async () => {
    const res = await request(app)
      .get(`/api/courses/${courseId}/attendance/report`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.report.length).toBe(1);
    expect(res.body.data.report[0].stats.presentCount).toBeGreaterThan(0);
    expect(res.body.data.report[0].stats.attendancePercentage).toBe(100);
  });
});
