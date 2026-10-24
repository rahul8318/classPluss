const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('ClassPulse Assignments, Submissions & Grading Workflow', () => {
  let teacherToken;
  let studentToken;
  let courseId;
  let assignmentId;
  let submissionId;

  beforeAll(async () => {
    // Register Teacher & Student
    const tRes = await request(app).post('/api/auth/register').send({
      name: 'Dr. Ada Lovelace',
      email: 'ada@classpulse.edu',
      password: 'Password123!',
      role: 'teacher',
    });
    teacherToken = tRes.body.data.token;

    const sRes = await request(app).post('/api/auth/register').send({
      name: 'Charles Babbage',
      email: 'charles@classpulse.edu',
      password: 'Password123!',
      role: 'student',
    });
    studentToken = sRes.body.data.token;

    // Create course and enroll student
    const cRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Algorithmic Computation' });
    courseId = cRes.body.data.course._id;
    const code = cRes.body.data.course.code;

    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code });
  });

  it('teacher should create an assignment with due date, marks, and rubric', async () => {
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post(`/api/courses/${courseId}/assignments`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Analytical Engine Architecture Plan',
        description: 'Design the storage and computational control flow.',
        dueDate,
        totalMarks: 50,
        allowedSubmissionTypes: ['file', 'text'],
        rubric: [
          { criterion: 'Control Flow Architecture', maxPoints: 30, description: 'Evaluation of gears and punch cards' },
          { criterion: 'Documentation Clarity', maxPoints: 20, description: 'Notation and explanations' },
        ],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.assignment.title).toBe('Analytical Engine Architecture Plan');
    expect(res.body.data.assignment.rubric.length).toBe(2);

    assignmentId = res.body.data.assignment._id;
  });

  it('student should submit assignment and receive a timestamped receipt', async () => {
    const res = await request(app)
      .post(`/api/assignments/${assignmentId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        submissionType: 'text',
        content: 'Proposed analytical mechanism using circular card sequences and storage mills.',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.receipt.receiptCode).toMatch(/^REC-/);
    expect(res.body.data.submission.status).toBe('submitted');

    submissionId = res.body.data.submission._id;
  });

  it('teacher should grade the submission with marks and written feedback', async () => {
    const res = await request(app)
      .post(`/api/submissions/${submissionId}/grade`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        marksObtained: 46,
        feedbackText: 'Exceptional architectural breakdown and foresight on conditional branching.',
        rubricScores: [
          { criterion: 'Control Flow Architecture', pointsAwarded: 28, maxPoints: 30, comment: 'Flawless design' },
          { criterion: 'Documentation Clarity', pointsAwarded: 18, maxPoints: 20, comment: 'Well written' },
        ],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.grade.marksObtained).toBe(46);
    expect(res.body.data.grade.percentage).toBe(92);
  });

  it('student should be able to view their published grades and rubric feedback', async () => {
    const res = await request(app)
      .get(`/api/courses/${courseId}/my-grades`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.grades.length).toBe(1);
    expect(res.body.data.grades[0].marksObtained).toBe(46);
    expect(res.body.data.grades[0].feedbackText).toContain('Exceptional');
  });
});
