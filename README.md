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

3. **Part 3: Frontend Integration**
   - React + Vite client connecting to both independent backends

---

## 🚀 Getting Started with the MERN Backend

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run local development server
npm run dev

# Run automated tests
npm test
```

- API Base: `http://localhost:5000/api`
- Interactive Swagger Docs: `http://localhost:5000/api/docs`
- Spring Boot Integration Spec: [`backend/docs/SPRING_BOOT_INTEGRATION_SPEC.md`](./backend/docs/SPRING_BOOT_INTEGRATION_SPEC.md)

---

## 📄 Architecture Specification Document

The full 15-page architecture and system specification is included in:
- [`ClassPulse_Complete_Project_Architecture_and_Features.pdf`](./ClassPulse_Complete_Project_Architecture_and_Features.pdf)
