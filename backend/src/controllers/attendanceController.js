const { v4: uuidv4 } = require('uuid');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceCode = require('../models/AttendanceCode');
const Enrollment = require('../models/Enrollment');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const AuditService = require('../services/auditService');

// Helper to format date string YYYY-MM-DD
const getTodayDateString = () => new Date().toISOString().split('T')[0];

exports.getCourseAttendance = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const records = await AttendanceRecord.find({ courseId })
      .populate('records.studentId', 'name email avatar')
      .populate('createdBy', 'name')
      .sort({ classDate: -1 });

    return ApiResponse.success(res, { attendanceRecords: records });
  } catch (error) {
    next(error);
  }
};

exports.recordAttendance = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const { classDate, records, title, isConfirmed } = req.body;

    const targetDate = classDate || getTodayDateString();

    let attendance = await AttendanceRecord.findOne({ courseId, classDate: targetDate });

    if (attendance) {
      if (title) attendance.title = title;
      if (records) attendance.records = records;
      if (isConfirmed !== undefined) attendance.isConfirmed = isConfirmed;
      await attendance.save();
    } else {
      attendance = await AttendanceRecord.create({
        courseId,
        classDate: targetDate,
        title: title || `Class Session - ${targetDate}`,
        records: records || [],
        createdBy: req.user.id,
        isConfirmed: isConfirmed !== undefined ? isConfirmed : true,
      });
    }

    await AuditService.log({
      userId: req.user.id,
      action: 'ATTENDANCE_RECORDED',
      entityType: 'AttendanceRecord',
      entityId: attendance._id,
      details: { courseId, classDate: targetDate, totalRecorded: attendance.records.length },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { attendance }, 'Attendance recorded successfully');
  } catch (error) {
    next(error);
  }
};

exports.updateStudentAttendance = async (req, res, next) => {
  try {
    const { recordId, studentId } = req.params;
    const { status, notes } = req.body;

    const attendance = await AttendanceRecord.findById(recordId);
    if (!attendance) {
      return next(ApiError.notFound('Attendance record not found'));
    }

    let studentEntry = attendance.records.find(r => r.studentId.toString() === studentId);

    if (studentEntry) {
      const prevStatus = studentEntry.status;
      studentEntry.status = status || studentEntry.status;
      studentEntry.editedBy = req.user.id;
      if (notes !== undefined) studentEntry.notes = notes;

      await AuditService.log({
        userId: req.user.id,
        action: 'ATTENDANCE_OVERRIDE',
        entityType: 'AttendanceRecord',
        entityId: attendance._id,
        details: { studentId, prevStatus, newStatus: studentEntry.status },
        ipAddress: req.ip,
      });
    } else {
      attendance.records.push({
        studentId,
        status: status || 'present',
        source: 'manual',
        editedBy: req.user.id,
        notes: notes || '',
      });
    }

    await attendance.save();
    return ApiResponse.success(res, { attendance }, 'Student attendance updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.generateSessionCode = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const { durationMinutes = 15 } = req.body;

    const classDate = getTodayDateString();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrToken = uuidv4();
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Deactivate previous active codes for this course
    await AttendanceCode.updateMany({ courseId, isActive: true }, { isActive: false });

    const attendanceCode = await AttendanceCode.create({
      courseId,
      classDate,
      code,
      qrToken,
      expiresAt,
      isActive: true,
      createdBy: req.user.id,
    });

    return ApiResponse.created(
      res,
      {
        code: attendanceCode.code,
        qrToken: attendanceCode.qrToken,
        expiresAt: attendanceCode.expiresAt,
        durationMinutes,
      },
      'Time-limited attendance check-in code generated'
    );
  } catch (error) {
    next(error);
  }
};

exports.studentCheckIn = async (req, res, next) => {
  try {
    const { code, qrToken } = req.body;
    const studentId = req.user.id;

    if (!code && !qrToken) {
      return next(ApiError.badRequest('Attendance code or QR token is required'));
    }

    const query = { isActive: true, expiresAt: { $gt: new Date() } };
    if (code) query.code = code.toUpperCase().trim();
    if (qrToken) query.qrToken = qrToken;

    const validCode = await AttendanceCode.findOne(query);
    if (!validCode) {
      return next(ApiError.badRequest('Invalid or expired attendance check-in code/token'));
    }

    const courseId = validCode.courseId;
    const classDate = validCode.classDate;

    // Verify student is enrolled in this course
    const enrollment = await Enrollment.findOne({ courseId, studentId, status: 'active' });
    if (!enrollment) {
      return next(ApiError.forbidden('You are not enrolled in this course'));
    }

    // Get or create today's attendance record
    let attendance = await AttendanceRecord.findOne({ courseId, classDate });
    if (!attendance) {
      attendance = await AttendanceRecord.create({
        courseId,
        classDate,
        title: `Class Session - ${classDate}`,
        records: [],
        createdBy: validCode.createdBy,
        isConfirmed: true,
      });
    }

    // Prevent duplicate check-in
    const alreadyCheckedIn = attendance.records.some(r => r.studentId.toString() === studentId);
    if (alreadyCheckedIn) {
      return next(ApiError.conflict('You have already checked in for today\'s class session'));
    }

    attendance.records.push({
      studentId,
      status: 'present',
      checkInTime: new Date(),
      source: 'code',
    });

    await attendance.save();

    await AuditService.log({
      userId: studentId,
      action: 'STUDENT_CHECKIN',
      entityType: 'AttendanceRecord',
      entityId: attendance._id,
      details: { courseId, classDate, source: 'code' },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { checkInTime: new Date(), status: 'present' }, 'Attendance marked successfully');
  } catch (error) {
    next(error);
  }
};

exports.importFromSpringBoot = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const { sessionId, sessionDate, participants } = req.body;

    if (!participants || !Array.isArray(participants)) {
      return next(ApiError.badRequest('Participants array is required from live session'));
    }

    const targetDate = sessionDate || getTodayDateString();

    let attendance = await AttendanceRecord.findOne({ courseId, classDate: targetDate });
    if (!attendance) {
      attendance = await AttendanceRecord.create({
        courseId,
        classDate: targetDate,
        title: `Live Session Attendance - ${targetDate}`,
        records: [],
        createdBy: req.user.id,
        isConfirmed: false, // Teacher must review and confirm
      });
    }

    let importedCount = 0;
    for (const p of participants) {
      const studentId = p.studentId || p.userId;
      if (!studentId) continue;

      const existing = attendance.records.find(r => r.studentId.toString() === String(studentId));
      if (!existing) {
        attendance.records.push({
          studentId,
          status: 'present',
          checkInTime: p.joinedAt ? new Date(p.joinedAt) : new Date(),
          source: 'spring_boot_session',
          notes: `Imported from Spring Boot Live Session: ${sessionId || 'N/A'}`,
        });
        importedCount++;
      }
    }

    await attendance.save();

    await AuditService.log({
      userId: req.user.id,
      action: 'SPRING_BOOT_ATTENDANCE_IMPORTED',
      entityType: 'AttendanceRecord',
      entityId: attendance._id,
      details: { sessionId, importedCount },
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      {
        attendance,
        importedCount,
        note: 'Attendance imported from Spring Boot live session and is pending teacher review/confirmation.',
      },
      'Live session attendance imported successfully'
    );
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;

    const enrollments = await Enrollment.find({ courseId, status: 'active' }).populate('studentId', 'name email avatar');
    const attendanceRecords = await AttendanceRecord.find({ courseId }).sort({ classDate: 1 });

    const totalClasses = attendanceRecords.length;

    const report = enrollments.map(e => {
      const student = e.studentId;
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      for (const record of attendanceRecords) {
        const entry = record.records.find(r => r.studentId.toString() === student._id.toString());
        if (entry) {
          if (entry.status === 'present') presentCount++;
          else if (entry.status === 'late') lateCount++;
          else if (entry.status === 'absent') absentCount++;
          else if (entry.status === 'excused') excusedCount++;
        } else {
          absentCount++;
        }
      }

      // Late counts as 0.75 attendance
      const effectivePresent = presentCount + lateCount * 0.75 + excusedCount;
      const attendancePercentage = totalClasses > 0 ? Math.round((effectivePresent / totalClasses) * 100 * 10) / 10 : 100;

      return {
        student,
        stats: {
          totalClasses,
          presentCount,
          lateCount,
          absentCount,
          excusedCount,
          attendancePercentage,
          isLowAttendance: attendancePercentage < 75,
        },
      };
    });

    return ApiResponse.success(res, { totalClasses, report });
  } catch (error) {
    next(error);
  }
};
