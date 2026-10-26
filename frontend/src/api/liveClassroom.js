const SPRING_BOOT_BASE = import.meta.env.VITE_SPRING_BOOT_API_URL || 'http://localhost:8080/api';

export const liveClassroomApi = {
  // Verifies participant eligibility with MERN backend before entering Spring Boot live session
  verifyCourseParticipant: async (courseId, userId) => {
    const token = localStorage.getItem('classpulse_token');
    const res = await fetch(`/api/integration/courses/${courseId}/verify-participant?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  // Calls Spring Boot backend to create or launch live room
  createLiveSession: async (sessionPayload) => {
    const token = localStorage.getItem('classpulse_token');
    try {
      const res = await fetch(`${SPRING_BOOT_BASE}/live-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionPayload),
      });
      return await res.json();
    } catch (err) {
      // In development when Spring Boot is not yet launched by friend, provide graceful fallback
      console.warn('Spring Boot service not reachable:', err);
      return {
        success: false,
        isMockReady: true,
        message: 'Spring Boot live classroom service is currently offline. Ensure friend’s backend is running on port 8080.',
      };
    }
  },

  // Student joins live room via 6-digit code or QR URL
  joinLiveSession: async (roomCode) => {
    const token = localStorage.getItem('classpulse_token');
    try {
      const res = await fetch(`${SPRING_BOOT_BASE}/live-sessions/${roomCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('Spring Boot service not reachable:', err);
      return {
        success: false,
        message: 'Live classroom service is currently connecting to Spring Boot at port 8080.',
      };
    }
  },
};
