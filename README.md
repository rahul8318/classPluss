# ClassPulse

> **ClassPulse**: A teacher-focused interactive classroom and AI-powered learning platform.

This repository contains the architecture, specifications, and the complete MERN backend for the **ClassPulse Learning Workspace**.

---

## 🏛️ Project Architecture & Scope Separation

ClassPulse combines a live classroom interaction product (inspired by Wooclap) with a separate persistent learning workspace for courses, assignments, assessments, attendance, documents, and AI-supported study.

1. **Part 1: MERN Backend (Learning Workspace)** — Located in [`/backend`](./backend)
   - Node.js, Express.js, MongoDB, Mongoose
   - User authentication (JWT, bcrypt) & role-based authorization (`teacher`, `student`, `admin`)
   - Course creation, invite codes, module hierarchy, and student rosters
   - Course materials management (PDF, DOCX, PPTX uploads, text extraction)
   - Assignments, submissions, late policies, timestamped receipts (`REC-XXXX`), and rubric grading
   - Question banks and AI-powered question generation (Bloom's Taxonomy levels)
   - Quizzes & assessments with automatic objective grading (MCQs, True/False)
   - Attendance management (manual rosters, time-limited QR/Code check-ins, reports)
   - AI Study Assistant with Grounded RAG (256-dim embeddings, vector retrieval, source citations, honest fallback)
   - 28 automated tests passing across 6 test suites with Jest and Supertest
   - OpenAPI / Swagger documentation (`/api/docs`)

2. **Part 2: Spring Boot Backend (Live Classroom)**
   - Java & Spring Boot, PostgreSQL, Redis, WebSockets
   - Live room sessions, session-code/QR joining
   - Live quizzes, polls, word clouds, brainstorming, prioritization, timers, random student picker

3. **Part 3: Frontend Client (Learning Workspace & Live Classroom Hub)** — Located in [`/frontend`](./frontend)
   - React 18, Vite 5, Tailwind CSS, Lucide Icons, React Router v6
   - Modern, responsive teacher and student portal
   - Dual-backend connection architecture (MERN REST API + Spring Boot REST/WS)
   - Complete Course Workspace: Modules, Document indexing, Assignments with receipt preview, Assessments, Attendance with timer codes, AI Study Assistant with citations, and Live Classroom launcher

---

## 🚀 Getting Started

### 1. MERN Backend

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Seed sample data (Demo courses, users, lecture notes, vector embeddings, quizzes)
npm run seed

# Run local development server (Port 5000)
npm run dev

# Run automated tests (28 tests across 6 suites)
npm test
```

- API Base: `http://localhost:5000/api`
- Interactive Swagger Docs: `http://localhost:5000/api/docs`
- Spring Boot Integration Spec: [`backend/docs/SPRING_BOOT_INTEGRATION_SPEC.md`](./backend/docs/SPRING_BOOT_INTEGRATION_SPEC.md)

#### Demo Credentials
- **Teacher**: `jane.smith@classpulse.edu` / `Password123!`
- **Student**: `alex.j@classpulse.edu` / `Password123!`

### 2. React Frontend

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run Vite development server (Port 5173)
npm run dev

# Build for production
npm run build
```

- Frontend URL: `http://localhost:5173`
- Pre-configured demo teacher and student accounts available directly on the Login screen!

---

## 📄 Architecture Specification Document

The full 15-page architecture and system specification is included in:
- [`ClassPulse_Complete_Project_Architecture_and_Features.pdf`](./ClassPulse_Complete_Project_Architecture_and_Features.pdf)
