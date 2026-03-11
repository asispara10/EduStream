import { Request, Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";

export const getAttendanceHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  if (role === 'teacher') {
    // Teachers can view all students' attendance
    const students = db.prepare(`
      SELECT u.id, u.name, u.avatar, u.profileImage 
      FROM users u
      JOIN enrollments e ON u.id = e.user_id
      WHERE e.class_id = ?
    `).all(classId);

    const attendanceData = students.map((student: any) => {
      const monthlyRecords = db.prepare(`
        SELECT * FROM monthly_attendance 
        WHERE student_id = ? AND class_id = ?
        ORDER BY month DESC
      `).all(student.id, classId);

      const recordsWithDaily = monthlyRecords.map((month: any) => {
        const dailyRecords = db.prepare(`
          SELECT date, present FROM daily_attendance_records 
          WHERE monthly_attendance_id = ?
          ORDER BY date ASC
        `).all(month.id);
        return { ...month, dailyRecords };
      });

      return { student, attendance: recordsWithDaily };
    });

    res.json({ attendance: attendanceData });
  } else {
    // Students can only view their own attendance
    const monthlyRecords = db.prepare(`
      SELECT * FROM monthly_attendance 
      WHERE student_id = ? AND class_id = ?
      ORDER BY month DESC
    `).all(userId, classId);

    const recordsWithDaily = monthlyRecords.map((month: any) => {
      const dailyRecords = db.prepare(`
        SELECT date, present FROM daily_attendance_records 
        WHERE monthly_attendance_id = ?
        ORDER BY date ASC
      `).all(month.id);
      return { ...month, dailyRecords };
    });

    res.json({ attendance: recordsWithDaily });
  }
});
