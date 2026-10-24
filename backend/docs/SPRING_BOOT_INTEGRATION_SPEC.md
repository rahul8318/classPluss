# ClassPulse: Spring Boot & MERN Backend Integration Contract Specification

This document defines the strict integration contract, security boundary, and API handshake between the **MERN Learning Workspace Backend** (Node.js/Express/MongoDB) and the **Spring Boot Live Classroom Backend** (Java/Spring Boot/PostgreSQL/WebSocket).

---

## 1. Core Architectural Boundary & Principles

1. **Independent Deployability**: Each backend runs as an isolated service with its own persistent store.
2. **Strict Database Isolation**:
   - The Spring Boot service **must NEVER connect directly to MongoDB**.
   - The MERN service **must NEVER connect directly to PostgreSQL or Redis**.
3. **Cross-Service References via External IDs**:
   - The Spring Boot backend stores `courseId` and `teacherId` as external identifier strings.
   - The MERN backend stores `sessionId` as an external reference string for attendance imports.
4. **Data Ownership Table**:

| Domain Data | Authoritative Owner | Persistent Store | External Reference Format |
|---|---|---|---|
| User Identity & Auth Token | Shared Identity / MERN Auth | MongoDB (`User`) | JWT token with `sub: userId` |
| Courses & Enrollments | MERN Backend | MongoDB (`Course`, `Enrollment`) | `courseId` (MongoDB ObjectId) |
| Course Materials & Files | MERN Backend | Private Storage / MongoDB (`Resource`) | `resourceId` |
| Assignments & Submissions | MERN Backend | MongoDB (`Assignment`, `Submission`) | `assignmentId`, `submissionId` |
| Persistent Gradebook | MERN Backend | MongoDB (`GradeFeedback`) | `gradeId` |
| Official Course Attendance | MERN Backend | MongoDB (`AttendanceRecord`) | `attendanceRecordId` |
| Question Banks & RAG AI | MERN Backend | MongoDB (`QuestionBank`, `DocumentChunk`) | `questionBankId` |
| Live Room Lifecycle | Spring Boot Backend | PostgreSQL (`live_sessions`) | `sessionId`, `sessionCode` |
| Real-time Questions & Polls | Spring Boot Backend | PostgreSQL (`live_activities`) | `activityId` |
| Live Participant Presence | Spring Boot Backend | Redis / PostgreSQL | `participantId`, WebSocket session |
| Live Answers & Aggregates | Spring Boot Backend | PostgreSQL (`live_responses`) | `responseId` |

---

## 2. Shared Authentication & JWT Contract

Both backends accept the same JWT bearer token passed in the `Authorization: Bearer <token>` HTTP header and WebSocket connection query/stomp header.

### 2.1 Token Algorithm & Signature
- **Algorithm**: `HS256` (or RS256 for asymmetric deployment)
- **Shared Secret Key**: Configured via `JWT_SECRET` in both `.env` and `application.yml`
- **Issuer (`iss`)**: `classpulse-auth-service`
- **Audience (`aud`)**: `classpulse-clients`

### 2.2 Standard Payload Claims
```json
{
  "sub": "671a8bc43d1290fe34521011",
  "id": "671a8bc43d1290fe34521011",
  "email": "teacher@classpulse.edu",
  "role": "teacher",
  "name": "Dr. Jane Smith",
  "iss": "classpulse-auth-service",
  "aud": "classpulse-clients",
  "iat": 1729800000,
  "exp": 1730404800
}
```

### 2.3 Role Taxonomy
- `teacher`: Allowed to create courses, assignments, live sessions, launch live questions, and grade work.
- `student`: Allowed to enroll in courses, view resources, submit work, take quizzes, and join live rooms.
- `admin`: Elevated system privileges.

---

## 3. Dedicated Service Handshake Endpoints (MERN Backend)

The MERN backend provides the following endpoints for the Spring Boot backend:

### 3.1 Token Verification Endpoint
- **URL**: `GET /api/integration/verify-token`
- **Header**: `Authorization: Bearer <jwt_token>`
- **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isValid": true,
    "user": {
      "userId": "671a8bc43d1290fe34521011",
      "email": "teacher@classpulse.edu",
      "name": "Dr. Jane Smith",
      "role": "teacher"
    }
  }
}
```

### 3.2 Participant Eligibility Check
Spring Boot can verify if a student or teacher has permission to join a live room tied to a course:
- **URL**: `GET /api/integration/courses/:courseId/verify-participant?userId=<userId>`
- **Response (Enrolled Student)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isEligible": true,
    "roleInCourse": "student",
    "courseTitle": "Distributed Systems"
  }
}
```
- **Response (Not Enrolled)**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isEligible": false,
    "roleInCourse": "none",
    "reason": "Student is not enrolled in this course"
  }
}
```

### 3.3 Live Session Attendance Synchronization
When a teacher ends a live session in Spring Boot, Spring Boot can push the participant list to propose official attendance in MERN:
- **URL**: `POST /api/integration/sessions/:sessionId/sync-attendance`
- **Request Body**:
```json
{
  "courseId": "671a8bc43d1290fe34521011",
  "teacherId": "671a8123ef4567bc89012345",
  "sessionDate": "2026-10-25",
  "participants": [
    {
      "userId": "671a8a99ff1234aa56789012",
      "joinedAt": "2026-10-25T10:05:00.000Z"
    }
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "synced": true,
    "attendanceRecordId": "671a99881122334455667788",
    "addedCount": 1
  },
  "message": "Live session attendance synced to course register"
}
```

---

## 4. Expected Spring Boot Endpoints for Phase 3 Frontend Integration

When the friend provides the Spring Boot backend, the frontend will connect to:

1. `POST /api/live-sessions`
   - Teacher creates a live room.
   - Body: `{ courseId, title, anonymousMode, activities }`
   - Response: `{ sessionId, joinCode, qrUrl, status }`
2. `POST /api/live-sessions/{code}/join`
   - Student joins with a code or QR token.
   - Response: `{ participantId, sessionId, currentActivity }`
3. `WebSocket /ws-classroom`
   - STOMP/WebSocket channel for real-time live activities, timer countdowns, vote charts, word clouds, and responses.
4. `GET /api/live-sessions/{sessionId}/results`
   - Retrieves final aggregate scores or vote tallies.
