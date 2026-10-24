const request = require('supertest');
const app = require('../src/app');
const DocumentChunk = require('../src/models/DocumentChunk');
const Resource = require('../src/models/Resource');
const EmbeddingService = require('../src/services/embeddingService');
require('./setup');

describe('ClassPulse AI Question Generation & Grounded RAG Study Assistant', () => {
  let teacherToken;
  let studentToken;
  let courseId;
  let resourceId;

  beforeAll(async () => {
    const tRes = await request(app).post('/api/auth/register').send({
      name: 'Dr. Geoffrey Hinton',
      email: 'hinton@classpulse.edu',
      password: 'Password123!',
      role: 'teacher',
    });
    teacherToken = tRes.body.data.token;

    const sRes = await request(app).post('/api/auth/register').send({
      name: 'Yann LeCun',
      email: 'yann@classpulse.edu',
      password: 'Password123!',
      role: 'student',
    });
    studentToken = sRes.body.data.token;

    const cRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Deep Learning & Neural Architectures' });
    courseId = cRes.body.data.course._id;
    const code = cRes.body.data.course.code;

    await request(app)
      .post('/api/courses/enroll')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ code });

    // Seed a course resource and document chunks
    const resource = await Resource.create({
      courseId,
      title: 'Backpropagation & Gradient Descent Fundamentals',
      resourceType: 'notes',
      fileName: 'lecture_notes_week2.pdf',
      textContent: 'Backpropagation computes the gradient of the loss function with respect to the weights of the neural network using the chain rule. Gradient descent then updates the weights in the opposite direction of the gradient to minimize error.',
      uploadedBy: tRes.body.data.user._id,
      processingStatus: 'completed',
    });
    resourceId = resource._id;

    const embedding1 = await EmbeddingService.generateEmbedding(
      'Backpropagation computes the gradient of the loss function with respect to weights using the chain rule.'
    );

    await DocumentChunk.create({
      courseId,
      resourceId,
      text: 'Backpropagation computes the gradient of the loss function with respect to weights of the neural network using the chain rule. This enables multi-layer perceptron training.',
      chunkIndex: 0,
      pageNumber: 3,
      heading: 'Gradient Computation via Chain Rule',
      embedding: embedding1,
    });
  });

  it('teacher should generate AI questions with structured schema and Bloom levels', async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/questions/generate`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        topic: 'Backpropagation',
        difficulty: 'medium',
        count: 3,
        bloomLevel: 'Apply',
        questionTypes: ['mcq', 'true_false', 'short_answer'],
        saveToQuestionBank: true,
        questionBankTitle: 'Auto-Generated Backpropagation Bank',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.questions.length).toBe(3);
    expect(res.body.data.questions[0].isAiGenerated).toBe(true);
    expect(res.body.data.questionBank).toBeDefined();
    expect(res.body.data.meta.isDraft).toBe(true);
  });

  it('student should ask RAG question and receive grounded answer with source citations', async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/study-chat`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        question: 'How does backpropagation compute the gradient of the loss function?',
        level: 'standard',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBeDefined();
    expect(res.body.data.sources.length).toBeGreaterThan(0);
    expect(res.body.data.sources[0].pageNumber).toBe(3);
    expect(res.body.data.sources[0].fileName).toBe('lecture_notes_week2.pdf');
    expect(res.body.data.isFallback).toBe(false);
  });

  it('RAG Study Assistant should return honest fallback when course material does not contain the answer', async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/study-chat`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        question: 'What is the recipe for baking French sourdough bread with wild yeast?',
        level: 'standard',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.isFallback).toBe(true);
    expect(res.body.data.answer).toContain('The course sources do not provide enough information');
    expect(res.body.data.sources).toHaveLength(0);
  });
});
