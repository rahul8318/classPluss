const mongoose = require('mongoose');
const config = require('../config/env');
const EmbeddingService = require('../services/embeddingService');

// Models
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseModule = require('../models/CourseModule');
const Resource = require('../models/Resource');
const DocumentChunk = require('../models/DocumentChunk');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const GradeFeedback = require('../models/GradeFeedback');
const QuestionBank = require('../models/QuestionBank');
const Assessment = require('../models/Assessment');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceCode = require('../models/AttendanceCode');

async function seedDatabase() {
  console.log('🌱 Starting ClassPulse database seeder...');
  
  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to primary MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    if (config.mongodbUri.includes('mongodb+srv://')) {
      console.warn('⚠️ Could not reach MongoDB Atlas (IP 152.58.152.117 may need whitelisting in Atlas Network Access).');
      console.warn('🔄 Falling back to local MongoDB: mongodb://localhost:27017/classpulse_learning_workspace');
      await mongoose.connect('mongodb://localhost:27017/classpulse_learning_workspace');
      console.log('Connected to local MongoDB database:', mongoose.connection.name);
    } else {
      throw err;
    }
  }

  const todayDate = new Date().toISOString().split('T')[0];

  // 1. Clear existing collections for demo data to be idempotent
  await Promise.all([
    User.deleteMany({ email: { $in: ['jane.smith@classpulse.edu', 'alex.j@classpulse.edu', 'sara.c@classpulse.edu'] } }),
    Course.deleteMany({ code: { $in: ['AI-401', 'DSA-201'] } }),
    Submission.deleteMany({ receiptCode: { $in: ['REC-AI401-001'] } }),
    AttendanceCode.deleteMany({ code: 'CP26AI' }),
    AttendanceRecord.deleteMany({ classDate: todayDate }),
  ]);

  // 2. Create Demo Users
  const teacher = await User.create({
    name: 'Dr. Jane Smith',
    email: 'jane.smith@classpulse.edu',
    password: 'Password123!',
    role: 'teacher',
    bio: 'Associate Professor of Computer Science specializing in Deep Learning & NLP',
  });

  const studentAlex = await User.create({
    name: 'Alex Johnson',
    email: 'alex.j@classpulse.edu',
    password: 'Password123!',
    role: 'student',
    bio: 'Junior CS Major passionate about Neural Networks and Distributed Systems',
  });

  const studentSara = await User.create({
    name: 'Sara Connor',
    email: 'sara.c@classpulse.edu',
    password: 'Password123!',
    role: 'student',
    bio: 'CS & Robotics Senior focusing on Autonomous Systems',
  });

  console.log('✓ Created Demo Users: Dr. Jane Smith (Teacher), Alex Johnson (Student), Sara Connor (Student)');

  // 3. Create Course 1: AI & Deep Learning
  const courseAI = await Course.create({
    title: 'CS 401: Artificial Intelligence & Deep Learning',
    description: 'Comprehensive graduate-level exploration of deep neural network architectures, backpropagation calculus, transformer attention mechanisms, and grounded retrieval-augmented generation (RAG).',
    subject: 'Computer Science',
    level: 'Advanced',
    term: 'Fall 2026',
    code: 'AI-401',
    teacherId: teacher._id,
  });

  // Create Course 2: Data Structures & Algorithms
  const courseDSA = await Course.create({
    title: 'CS 201: Data Structures & Algorithms',
    description: 'Core concepts in data structures including balanced binary search trees, hash maps, heaps, graph search algorithms (BFS/DFS, Dijkstra), and dynamic programming paradigms.',
    subject: 'Computer Science',
    level: 'Intermediate',
    term: 'Fall 2026',
    code: 'DSA-201',
    teacherId: teacher._id,
  });

  console.log('✓ Created Courses: AI-401 and DSA-201');

  // 4. Enroll Students
  await Enrollment.create([
    { courseId: courseAI._id, studentId: studentAlex._id, status: 'active', enrolledAt: new Date() },
    { courseId: courseAI._id, studentId: studentSara._id, status: 'active', enrolledAt: new Date() },
    { courseId: courseDSA._id, studentId: studentAlex._id, status: 'active', enrolledAt: new Date() },
  ]);

  // 5. Modules for AI Course
  const mod1 = await CourseModule.create({
    courseId: courseAI._id,
    title: 'Module 1: Foundations of Deep Neural Networks',
    description: 'Mathematical intuition behind gradient descent, perceptrons, activation functions, and computational graphs.',
    orderIndex: 0,
    isPublished: true,
  });

  const mod2 = await CourseModule.create({
    courseId: courseAI._id,
    title: 'Module 2: Transformers & Attention Mechanisms',
    description: 'Self-attention, multi-head attention, positional encoding, and retrieval-augmented generation.',
    orderIndex: 1,
    isPublished: true,
  });

  // 6. Resources & Knowledge Chunks for RAG Study Assistant
  const lectureText1 = `Gradient Descent and Backpropagation in Multi-Layer Perceptrons:
Gradient descent is an optimization algorithm used to minimize the loss function in neural networks by iteratively moving in the direction of steepest descent.
Backpropagation computes the gradient of the loss function with respect to each weight via the chain rule of calculus.
Key hyper-parameters include the learning rate (eta), which controls the step size taken in the weight space.
Common activation functions include ReLU (Rectified Linear Unit), Sigmoid, and Tanh. ReLU solves the vanishing gradient problem for positive inputs.`;

  const lectureText2 = `Attention Mechanisms and Transformer Architecture:
The Transformer architecture relies entirely on self-attention mechanisms without recurrent or convolutional layers.
The scaled dot-product attention computes Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V, where Q is the Query matrix, K is the Key matrix, and V is the Value matrix.
Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.
Retrieval-Augmented Generation (RAG) pairs dense semantic embeddings with parametric language models to provide grounded, hallucination-free answers with verifiable source citations.`;

  const res1 = await Resource.create({
    courseId: courseAI._id,
    moduleId: mod1._id,
    title: 'Lecture 1: Gradient Descent & Backpropagation Notes',
    description: 'Core theoretical derivations for neural loss surfaces and backpropagation equations.',
    resourceType: 'notes',
    textContent: lectureText1,
    pageCount: 1,
    chunkCount: 1,
    processingStatus: 'completed',
    isPublished: true,
    uploadedBy: teacher._id,
  });

  const res2 = await Resource.create({
    courseId: courseAI._id,
    moduleId: mod2._id,
    title: 'Lecture 2: Transformer Architecture & Attention Papers',
    description: 'Overview of Self-Attention, Multi-Head Attention, and RAG architectures.',
    resourceType: 'notes',
    textContent: lectureText2,
    pageCount: 1,
    chunkCount: 1,
    processingStatus: 'completed',
    isPublished: true,
    uploadedBy: teacher._id,
  });

  // Generate 256-dimensional embeddings for RAG retrieval
  const emb1 = await EmbeddingService.generateEmbedding(lectureText1);
  const emb2 = await EmbeddingService.generateEmbedding(lectureText2);

  await DocumentChunk.create([
    {
      resourceId: res1._id,
      courseId: courseAI._id,
      chunkIndex: 0,
      text: lectureText1,
      pageNumber: 1,
      heading: 'Gradient Descent & Backpropagation',
      embedding: emb1,
      metadata: { tokenCount: 95 },
    },
    {
      resourceId: res2._id,
      courseId: courseAI._id,
      chunkIndex: 0,
      text: lectureText2,
      pageNumber: 1,
      heading: 'Transformer Self-Attention & RAG',
      embedding: emb2,
      metadata: { tokenCount: 105 },
    },
  ]);

  console.log('✓ Created Modules, Lecture Notes, and 256-dim RAG Vector Chunks');

  // 7. Assignments & Submissions
  const dueDatePast = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const dueDateFuture = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const assign1 = await Assignment.create({
    courseId: courseAI._id,
    title: 'Lab 1: Vectorized Backpropagation Implementation',
    description: 'Implement forward propagation, cross-entropy loss, and vectorized backpropagation in NumPy without using auto-diff frameworks.',
    instructions: 'Submit either your Python script or a detailed markdown writeup of the math and implementation.',
    dueDate: dueDatePast,
    totalMarks: 100,
    allowedSubmissionTypes: ['file', 'text'],
    lateSubmissionPolicy: 'allow',
    latePenaltyPercent: 5,
    isPublished: true,
    createdBy: teacher._id,
  });

  const assign2 = await Assignment.create({
    courseId: courseAI._id,
    title: 'Lab 2: Scaled Dot-Product Attention Implementation',
    description: 'Write a PyTorch module computing scaled dot-product attention and multi-head projection layers.',
    instructions: 'Validate tensor dimensions across batch size, sequence length, and head count.',
    dueDate: dueDateFuture,
    totalMarks: 100,
    allowedSubmissionTypes: ['file', 'text'],
    lateSubmissionPolicy: 'allow',
    latePenaltyPercent: 5,
    isPublished: true,
    createdBy: teacher._id,
  });

  // Graded submission for Alex in Lab 1
  const sub1 = await Submission.create({
    assignmentId: assign1._id,
    courseId: courseAI._id,
    studentId: studentAlex._id,
    submissionType: 'text',
    content: 'Completed vectorized backprop implementation with 99.2% accuracy on MNIST. Matrix dimensions verified for batch size B=64.',
    receiptCode: 'REC-AI401-001',
    isLate: false,
    status: 'graded',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  });

  await GradeFeedback.create({
    submissionId: sub1._id,
    assignmentId: assign1._id,
    courseId: courseAI._id,
    studentId: studentAlex._id,
    gradedBy: teacher._id,
    marksObtained: 96,
    totalMarks: 100,
    feedbackText: 'Superb implementation! Vectorization is clean, efficient, and numerical gradient check passes with tolerance 1e-7.',
    rubricScores: [
      { criterion: 'Vectorized Math', pointsAwarded: 30, maxPoints: 30, comment: 'Flawless matrix shapes' },
      { criterion: 'Gradient Verification', pointsAwarded: 38, maxPoints: 40, comment: 'Great tolerance' },
      { criterion: 'Code Quality', pointsAwarded: 28, maxPoints: 30, comment: 'Well commented' },
    ],
    status: 'published',
  });

  console.log('✓ Created Assignments, Student Submission, and Rubric Grade Feedback');

  // 8. Assessments & Quizzes
  await Assessment.create({
    courseId: courseAI._id,
    title: 'Midterm Quiz: Deep Learning & Attention Foundations',
    description: 'Test your understanding of gradient descent dynamics, activation functions, and transformer attention.',
    durationMinutes: 20,
    totalMarks: 30,
    isPublished: true,
    createdBy: teacher._id,
    questions: [
      {
        text: 'What is the primary role of the chain rule in neural network training?',
        questionType: 'mcq',
        options: [
          { id: 'opt1', text: 'To randomly initialize network weights', isCorrect: false },
          { id: 'opt2', text: 'To calculate gradients of the loss with respect to individual weights', isCorrect: true },
          { id: 'opt3', text: 'To normalize inputs between 0 and 1', isCorrect: false },
          { id: 'opt4', text: 'To prevent overfitting during validation', isCorrect: false },
        ],
        points: 10,
        explanation: 'Backpropagation relies on the chain rule of calculus to propagate errors backward from output to input layers.',
      },
      {
        text: 'The ReLU activation function completely eliminates the vanishing gradient problem for all negative input values.',
        questionType: 'true_false',
        options: [
          { id: 'opt_true', text: 'True', isCorrect: false },
          { id: 'opt_false', text: 'False', isCorrect: true },
        ],
        points: 10,
        explanation: 'ReLU has a zero derivative for negative inputs, which can cause neurons to become inactive (dying ReLU problem).',
      },
      {
        text: 'In the formula Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V, what is the purpose of dividing by sqrt(d_k)?',
        questionType: 'mcq',
        options: [
          { id: 'opt1', text: 'To speed up matrix multiplication hardware', isCorrect: false },
          { id: 'opt2', text: 'To prevent large dot products from pushing softmax into extremely small gradient regions', isCorrect: true },
          { id: 'opt3', text: 'To ensure the output dimensions match the input embeddings', isCorrect: false },
          { id: 'opt4', text: 'To compute the L2 distance between tokens', isCorrect: false },
        ],
        points: 10,
        explanation: 'For large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients.',
      },
    ],
  });

  console.log('✓ Created Assessment with auto-grading question schema');

  // 9. Question Bank
  await QuestionBank.create({
    courseId: courseAI._id,
    title: 'AI & Neural Networks Question Bank',
    description: 'Curated pool of assessment questions organized across Bloom taxonomy cognitive tiers.',
    createdBy: teacher._id,
    questions: [
      {
        type: 'mcq',
        bloomLevel: 'Understand',
        text: 'Explain why stochastic gradient descent (SGD) uses mini-batches instead of the entire dataset.',
        options: [
          { id: 'qb_opt1', text: 'Mini-batches provide a balance between computational efficiency and gradient noise reduction', isCorrect: true },
          { id: 'qb_opt2', text: 'Mini-batches eliminate the need for learning rates', isCorrect: false },
          { id: 'qb_opt3', text: 'Mini-batches only work on CPU architectures', isCorrect: false },
        ],
        marks: 5,
        explanation: 'Mini-batch SGD offers vectorization advantages on GPUs while smoothing gradient variance.',
      },
      {
        type: 'true_false',
        bloomLevel: 'Remember',
        text: 'RAG completely replaces the need for transformer attention layers.',
        options: [
          { id: 'qb_tf_true', text: 'True', isCorrect: false },
          { id: 'qb_tf_false', text: 'False', isCorrect: true },
        ],
        marks: 5,
        explanation: 'RAG augments transformer language models by providing retrieved context chunks.',
      },
    ],
  });

  // 10. Attendance Session Code
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await AttendanceCode.create({
    courseId: courseAI._id,
    classDate: todayDate,
    code: 'CP26AI',
    qrToken: 'CP-QR-AI401-2026',
    expiresAt,
    isActive: true,
    createdBy: teacher._id,
  });

  // Past attendance records
  await AttendanceRecord.create({
    courseId: courseAI._id,
    classDate: todayDate,
    title: 'Introduction to Backpropagation Calculus',
    createdBy: teacher._id,
    records: [
      { studentId: studentAlex._id, status: 'present', source: 'code', checkInTime: new Date() },
      { studentId: studentSara._id, status: 'present', source: 'code', checkInTime: new Date() },
    ],
  });

  console.log('✓ Created Active Attendance Check-in Code (CP26AI) and Past Session Records');

  console.log('\n🎉 ClassPulse Database Seed on MongoDB Atlas Completed Successfully!');
  console.log('----------------------------------------------------------------------');
  console.log('Teacher Credentials:  jane.smith@classpulse.edu  /  Password123!');
  console.log('Student Credentials:  alex.j@classpulse.edu      /  Password123!');
  console.log('Course Codes:         AI-401 & DSA-201');
  console.log('Active Check-In Code: CP26AI');
  console.log('----------------------------------------------------------------------\n');

  await mongoose.connection.close();
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Database seed error:', err);
  process.exit(1);
});
