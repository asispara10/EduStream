import { Response, NextFunction } from "express";
import db from "../db.ts";
import { AuthRequest } from "./auth.middleware.ts";

export const autoMarkAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'student') {
      return next();
    }

    const { id: classId } = req.params;
    if (!classId) return next();

    const studentId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentMonth = today.substring(0, 7); // YYYY-MM

    // 1. Check if monthly record exists
    let monthlyRecord = db.prepare(`
      SELECT id, total_days_present FROM monthly_attendance 
      WHERE student_id = ? AND class_id = ? AND month = ?
    `).get(studentId, classId, currentMonth);

    if (!monthlyRecord) {
      const result = db.prepare(`
        INSERT INTO monthly_attendance (student_id, class_id, month, total_days_present)
        VALUES (?, ?, ?, 0)
      `).run(studentId, classId, currentMonth);
      monthlyRecord = { id: result.lastInsertRowid, total_days_present: 0 };
    }

    // 2. Check if daily record exists for today
    const dailyRecord = db.prepare(`
      SELECT id FROM daily_attendance_records 
      WHERE monthly_attendance_id = ? AND date = ?
    `).get(monthlyRecord.id, today);

    if (!dailyRecord) {
      // Mark as present for today
      db.prepare(`
        INSERT INTO daily_attendance_records (monthly_attendance_id, date, present)
        VALUES (?, ?, 1)
      `).run(monthlyRecord.id, today);

      // Increment total days present
      db.prepare(`
        UPDATE monthly_attendance 
        SET total_days_present = total_days_present + 1 
        WHERE id = ?
      `).run(monthlyRecord.id);
      
      console.log(`Attendance marked for student ${studentId} in class ${classId} for ${today}`);
    }

    next();
  } catch (error) {
    console.error("Auto attendance error:", error);
    next(); // Don't block the request if attendance fails
  }
};
