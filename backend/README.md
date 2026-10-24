# ClassPulse — Learning Workspace MERN Backend

> **ClassPulse**: A Teacher-Focused Interactive Classroom and AI-Powered Learning Platform.

This is **Part 1 (MERN Backend)** of the ClassPulse project. It provides persistent course management, assignments, assessments with auto-grading, student attendance registers, AI question generation, and a grounded RAG-based AI Study Assistant.

---

## 1. Responsibilities & Architecture Boundary

- **MERN Backend (This Service)**:
  - Node.js & Express.js REST API
  - MongoDB with Mongoose ODM
  - Authentication (JWT with bcrypt) & Role-Based Authorization (`teacher`, `student`, `admin`)
  - Course Creation, Invite Codes, and Student Roster Management
  - Course Modules and Document Resource Management (PDF, DOCX, PPTX)
  - Assignment Distribution, Deadlines, Late Policies, Submissions & Timestamped Receipts
  - Rubric-based Grading & Course Gradebook Matrix
  - Question Banks & AI-Powered Question Generation (Bloom Taxonomy levels)
  - Student Assessments & Automated Objective Grading (MCQ, True/False)
  - Course Attendance Register (Manual marking, time-limited QR/Code check-in, percentage reports)
  - AI Study Assistant with Grounded RAG (semantic chunking, vector embeddings, course-isolated retrieval, page-level citations, honest fallback)
  - Spring Boot Integration Handshake & Audit Trails
- **Spring Boot Backend (Friend's Service)**:
  - Live Classroom Sessions (Wooclap-style)
  - Real-time WebSockets, Live Quizzes/Polls, Word Clouds, Prioritization, Timers, Random Picker

---

## 2. Tech Stack

- **Runtime**: Node.js `v22.x`
- **Framework**: Express `v4.x`
- **Database**: MongoDB with Mongoose
- **Security**: Helmet, CORS, JWT (`jsonwebtoken`), bcryptjs
- **Document Processing**: `pdf-parse`, `mammoth`, `multer`
- **AI & RAG Engine**: Vector Embedding service + Cosine similarity retrieval + Grounded citation engine
- **Documentation**: Swagger UI & OpenAPI 3.0 (`swagger-ui-express`, `swagger-jsdoc`)
- **Testing**: Jest `v29.x` & Supertest `v7.x`

---

## 3. Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                # MongoDB connection & lifecycle
│   │   ├── env.js               # Validated environment configuration
│   │   └── swagger.js           # Swagger OpenAPI specification
│   ├── models/
│   │   ├── User.js              # User identity & JWT generation
│   │   ├── Course.js            # Course metadata & invite codes
│   │   ├── Enrollment.js        # Student-course enrollments
│   │   ├── CourseModule.js      # Topics & modules
│   │   ├── Resource.js          # Course documents & links
│   │   ├── DocumentChunk.js     # Text chunks & vector embeddings
│   │   ├── Assignment.js        # Assignments & rubrics
│   │   ├── Submission.js        # Student submissions & receipt codes
│   │   ├── GradeFeedback.js     # Marks & rubric grading
│   │   ├── QuestionBank.js      # Questions & question banks
│   │   ├── Assessment.js        # Quizzes & availability windows
│   │   ├── AssessmentAttempt.js # Student attempts & auto-grading scores
│   │   ├── AttendanceRecord.js  # Course attendance register
│   │   ├── AttendanceCode.js    # Time-limited check-in codes & QR tokens
│   │   ├── StudyChatSession.js  # AI chat history & source citations
│   │   ├── Notification.js      # Student & teacher notifications
│   │   └── AuditEvent.js        # Security & integrity audit trail
│   ├── middlewares/
│   │   ├── auth.js              # JWT authentication & role-based authorization
│   │   ├── courseAccess.js      # Server-side course ownership & enrollment checks
│   │   ├── validate.js          # Zod schema validation
│   │   ├── upload.js            # Secure file upload handler
│   │   └── errorHandler.js      # Centralized error handler
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── moduleController.js
│   │   ├── resourceController.js
│   │   ├── assignmentController.js
│   │   ├── submissionController.js
│   │   ├── gradeController.js
│   │   ├── questionBankController.js
│   │   ├── assessmentController.js
│   │   ├── attendanceController.js
│   │   ├── aiController.js
│   │   ├── notificationController.js
│   │   └── integrationController.js
│   ├── services/
│   │   ├── documentParser.js    # PDF & DOCX text extraction & chunking
│   │   ├── embeddingService.js  # 256-dim semantic embeddings
│   │   ├── vectorSearchService.js # Course-isolated cosine similarity search
│   │   ├── aiService.js         # Grounded RAG orchestrator & honest fallback
│   │   ├── questionGenService.js# AI Question Bank generation
│   │   ├── autoGradeService.js  # Objective auto-grading engine
│   │   └── auditService.js      # Audit trail logger
│   ├── routes/                  # Express route modules & index aggregator
│   ├── utils/                   # ApiResponse, ApiError, logger
│   ├── app.js                   # Express application configuration
│   └── server.js                # Server entry point
├── tests/                       # Automated test suites (28 passing tests)
├── uploads/                     # Upload directory for PDFs, DOCX, and student files
├── docs/
│   └── SPRING_BOOT_INTEGRATION_SPEC.md # API contract specification for Spring Boot
├── .env.example
├── package.json
└── README.md
```

---

## 4. Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance running locally on `localhost:27017` or a MongoDB Atlas URI

### Installation
```bash
cd d:\ClassPulse\backend
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port for Express backend |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_URI` | `mongodb://localhost:27017/classpulse_learning_workspace` | MongoDB database URI |
| `MONGODB_TEST_URI` | `mongodb://localhost:27017/classpulse_test` | Test database URI |
| `JWT_SECRET` | `classpulse_super_secret_jwt_key_...` | Shared secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed frontend origin |
| `UPLOAD_DIR` | `uploads` | Local upload directory |
| `MAX_FILE_SIZE_MB` | `25` | Maximum upload file size in megabytes |
| `SPRING_BOOT_API_URL` | `http://localhost:8080` | URL of Spring Boot Live Classroom |

### Running the Server
```bash
# Start in development mode with nodemon
npm run dev

# Start in production mode
npm start
```
- API Base: `http://localhost:5000/api`
- Interactive Swagger Documentation: `http://localhost:5000/api/docs`
- Health check: `http://localhost:5000/api/health`

### Running Automated Tests
```bash
npm test
```
The test suite runs with Jest and Supertest in band against local MongoDB, verifying:
- Authentication & JWT generation
- Course creation, invite codes, and roster enforcement
- Assignment submissions, late policies, and rubric grading
- Quiz creation, student attempts, and auto-grading
- Attendance check-in codes, Spring Boot sync, and percentage calculations
- Document chunking, AI question generation, RAG citations, and honest fallback.

---

## 5. Summary of Main API Endpoints

### Authentication
- `POST /api/auth/register`: Register new user (`teacher`, `student`, `admin`)
- `POST /api/auth/login`: Authenticate and obtain JWT Bearer token
- `GET /api/auth/me`: Retrieve authenticated user profile
- `PUT /api/auth/profile`: Update user profile details

### Courses & Roster
- `GET /api/courses`: List current user's courses (taught or enrolled)
- `POST /api/courses`: Create new course (Teacher only; auto-generates `CP-XXXX` join code)
- `POST /api/courses/enroll`: Enroll in course via invite code (Student only)
- `GET /api/courses/:id`: Get course details and statistics
- `PUT /api/courses/:id`: Update course information (Teacher only)
- `DELETE /api/courses/:id`: Archive course (Teacher only)
- `GET /api/courses/:id/students`: View student roster
- `DELETE /api/courses/:id/students/:studentId`: Remove student from course

### Modules & Resources
- `POST /api/courses/:courseId/modules`: Create topic/module
- `GET /api/courses/:courseId/modules`: List modules and attached resources
- `POST /api/courses/:courseId/resources`: Upload resource (PDF, DOCX, PPTX)
- `GET /api/courses/:courseId/resources`: List resources
- `POST /api/resources/:resourceId/process`: Trigger text extraction & RAG chunk indexing

### Assignments, Submissions & Grading
- `POST /api/courses/:courseId/assignments`: Create assignment with due date and rubrics
- `GET /api/courses/:courseId/assignments`: List assignments with student status
- `POST /api/assignments/:assignmentId/submissions`: Submit work (receives `receiptCode`)
- `GET /api/assignments/:assignmentId/submissions`: List submissions (Teacher)
- `GET /api/assignments/:assignmentId/submissions/my`: View own submission (Student)
- `POST /api/submissions/:submissionId/grade`: Record marks, rubrics, and feedback
- `GET /api/courses/:courseId/gradebook`: Full course gradebook matrix (Teacher)
- `GET /api/courses/:courseId/my-grades`: View personal grades and feedback (Student)

### Question Banks & AI Question Generation
- `POST /api/courses/:courseId/question-banks`: Create question bank
- `GET /api/courses/:courseId/question-banks`: List question banks
- `POST /api/courses/:courseId/questions/generate`: Generate draft questions via AI from topic or uploaded resource (supports MCQ, True/False, Short Answer, Open-ended with Bloom levels)

### Assessments & Auto-Grading
- `POST /api/courses/:courseId/assessments`: Create quiz from question bank or custom items
- `GET /api/courses/:courseId/assessments`: List course assessments
- `POST /api/assessments/:assessmentId/start`: Start attempt (sanitized question view)
- `POST /api/attempts/:attemptId/submit`: Submit answers; triggers automatic objective grading
- `GET /api/assessments/:assessmentId/results`: Teacher analytics and per-question pass rates

### Attendance Management
- `GET /api/courses/:courseId/attendance`: Official course attendance register
- `POST /api/courses/:courseId/attendance`: Teacher marks or confirms session attendance
- `POST /api/courses/:courseId/attendance/session-code`: Generate time-limited QR/check-in code
- `POST /api/attendance/check-in`: Student check-in using valid code
- `POST /api/courses/:courseId/attendance/import-live-session`: Propose attendance from Spring Boot live session
- `GET /api/courses/:courseId/attendance/report`: Attendance percentages and low-attendance alerts

### RAG AI Study Assistant
- `POST /api/courses/:courseId/study-chat`: Ask question grounded in course documents (returns answer + page citations or honest fallback)
- `GET /api/courses/:courseId/study-chat/history`: Conversation history
- `DELETE /api/study-chat/:sessionId`: Reset study chat session

### Spring Boot Cross-Service Integration
- `GET /api/integration/verify-token`: Verifies shared JWT and extracts user profile
- `GET /api/integration/courses/:courseId/verify-participant`: Verifies if student/teacher can join course live session
- `POST /api/integration/sessions/:sessionId/sync-attendance`: Syncs live session participant roster into MERN attendance
- `GET /api/integration/contract`: Machine-readable contract specification
