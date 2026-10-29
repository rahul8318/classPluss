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

  it('anti-proxy guard detects device collision when two students use the same physical device', async () => {
    // Register second student
    const s2Res = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@classpulse.edu',
      password: 'Password123!',
      role: 'student',
    });
    const student2Token = s2Res.body.data.token;

    // Enroll in course
    const courseRes = await request(app)
      .get(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ code: courseRes.body.data.course.code });

    // Check in with the same X-Device-Id as Knuth or duplicate IP
    const checkInRes = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${student2Token}`)
      .set('X-Device-Id', 'device_library_pc_001')
      .send({ code: checkInCode })
      .expect(200);

    // Because Knuth was recorded on the same test IP, Ada's check-in triggers anti-proxy warning
    expect(checkInRes.body.success).toBe(true);
    expect(checkInRes.body.data.isProxyWarning).toBe(true);
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
    expect(res.body.data.report.length).toBe(2);
    expect(res.body.data.report[0].stats.presentCount).toBeGreaterThan(0);
    expect(res.body.data.report[0].stats.attendancePercentage).toBe(100);
  });

  it('teacher should retrieve session attendance roster and modify student status with notes', async () => {
    const recordsRes = await request(app)
      .get(`/api/courses/${courseId}/attendance`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    const recordId = recordsRes.body.data.attendanceRecords[0]._id;

    // Retrieve session details
    const sessionRes = await request(app)
      .get(`/api/courses/${courseId}/attendance/${recordId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(sessionRes.body.success).toBe(true);
    expect(sessionRes.body.data.roster.length).toBeGreaterThan(0);

    // Modify student status to 'excused' with doctor note
    const updateRes = await request(app)
      .put(`/api/attendance/${recordId}/students/${studentId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status: 'excused', notes: 'Excused: Verified doctor appointment' })
      .expect(200);

    expect(updateRes.body.success).toBe(true);
    const updatedEntry = updateRes.body.data.attendance.records.find(
      r => (r.studentId._id ? r.studentId._id.toString() : r.studentId.toString()) === studentId.toString()
    );
    expect(updatedEntry.status).toBe('excused');
    expect(updatedEntry.notes).toBe('Excused: Verified doctor appointment');
  });

  it('student must be strictly prohibited from modifying attendance records (anti-tamper)', async () => {
    const recordsRes = await request(app)
      .get(`/api/courses/${courseId}/attendance`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    const recordId = recordsRes.body.data.attendanceRecords[0]._id;

    // Student attempts to modify attendance status
    const res = await request(app)
      .put(`/api/attendance/${recordId}/students/${studentId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'present' })
      .expect(403);

    expect(res.body.success).toBe(false);
  });
});
