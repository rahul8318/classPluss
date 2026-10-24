const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('ClassPulse Assessments & Auto-Grading API', () => {
  let teacherToken;
  let studentToken;
  let courseId;
  let assessmentId;
  let attemptId;

  beforeAll(async () => {
    const tRes = await request(app).post('/api/auth/register').send({
      name: 'Professor Claude Shannon',
      email: 'shannon@classpulse.edu',
      password: 'Password123!',
      role: 'teacher',
    });
    teacherToken = tRes.body.data.token;

    const sRes = await request(app).post('/api/auth/register').send({
      name: 'John von Neumann',
      email: 'john@classpulse.edu',
      password: 'Password123!',
      role: 'student',
    });
    studentToken = sRes.body.data.token;

    const cRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Information Theory' });
    courseId = cRes.body.data.course._id;
    const code = cRes.body.data.course.code;

    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code });
  });

  it('teacher should create a quiz with objective MCQ and True/False questions', async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/assessments`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Information Entropy & Redundancy Quiz',
        durationMinutes: 15,
        maxAttempts: 2,
        releaseSettings: {
          showScoreImmediately: true,
          showFeedbackImmediately: true,
          showCorrectAnswers: true,
        },
        questions: [
          {
            text: 'What is the fundamental unit of information in digital communications?',
            questionType: 'mcq',
            options: [
              { id: 'opt_1', text: 'Bit (binary digit)', isCorrect: true },
              { id: 'opt_2', text: 'Baud', isCorrect: false },
              { id: 'opt_3', text: 'Packet', isCorrect: false },
            ],
            answerKey: 'opt_1',
            points: 2,
          },
          {
            text: 'True or False: Lossless compression preserves exact original data without corruption.',
            questionType: 'true_false',
            options: [
              { id: 'opt_true', text: 'True', isCorrect: true },
              { id: 'opt_false', text: 'False', isCorrect: false },
            ],
            answerKey: 'opt_true',
            points: 1,
          },
        ],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.assessment.totalMarks).toBe(3);
    assessmentId = res.body.data.assessment._id;
  });

  it('student should start an assessment attempt and see questions without answer keys', async () => {
    const res = await request(app)
      .post(`/api/assessments/${assessmentId}/start`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.attemptId).toBeDefined();
    expect(res.body.data.questions.length).toBe(2);
    // Ensure answer key and isCorrect are not exposed
    expect(res.body.data.questions[0].answerKey).toBeUndefined();
    expect(res.body.data.questions[0].options[0].isCorrect).toBeUndefined();

    attemptId = res.body.data.attemptId;
  });

  it('student submits answers and system automatically grades objective questions', async () => {
    const qRes = await request(app)
      .get(`/api/courses/${courseId}/assessments`)
      .set('Authorization', `Bearer ${studentToken}`);
    const q1Id = qRes.body.data.assessments[0].questions[0]._id;
    const q2Id = qRes.body.data.assessments[0].questions[1]._id;

    const res = await request(app)
      .post(`/api/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [
          { questionId: q1Id, selectedOptionId: 'opt_1' }, // Correct (2 points)
          { questionId: q2Id, selectedOptionId: 'opt_true' }, // Correct (1 point)
        ],
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBe(3);
    expect(res.body.data.totalPossibleScore).toBe(3);
    expect(res.body.data.percentage).toBe(100);
    expect(res.body.data.status).toBe('graded');
  });

  it('teacher should view assessment analytics and pass rate metrics', async () => {
    const res = await request(app)
      .get(`/api/assessments/${assessmentId}/results`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.analytics.totalAttempts).toBe(1);
    expect(res.body.data.analytics.averageScore).toBe(100);
    expect(res.body.data.questionStats.length).toBe(2);
  });
});
