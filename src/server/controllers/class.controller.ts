import { Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";
import crypto from "crypto";

export const createClass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, subject, section, description, meetingLink } = req.body;
  const teacherId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: "Class name is required" });
  }

  const code = crypto.randomBytes(3).toString("hex").toUpperCase();

  const result = db.prepare(
    "INSERT INTO classes (name, subject, section, description, code, teacher_id, meeting_link) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(name, subject, section, description, code, teacherId, meetingLink);

  res.status(201).json({
    success: true,
    class: { id: result.lastInsertRowid, name, subject, section, description, code, meetingLink },
  });
});

export const joinClass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  const studentId = req.user.id;

  if (!code) {
    return res.status(400).json({ message: "Class code is required" });
  }

  const classroom: any = db.prepare("SELECT id FROM classes WHERE code = ?").get(code);
  if (!classroom) {
    return res.status(404).json({ message: "Invalid class code" });
  }

  const existingEnrollment = db.prepare(
    "SELECT * FROM enrollments WHERE user_id = ? AND class_id = ?"
  ).get(studentId, classroom.id);

  if (existingEnrollment) {
    return res.status(400).json({ message: "You are already enrolled in this class" });
  }

  db.prepare("INSERT INTO enrollments (user_id, class_id) VALUES (?, ?)").run(studentId, classroom.id);

  res.status(200).json({ success: true, message: "Joined class successfully" });
});

export const getMyClasses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  let classes;

  if (req.user.role === "teacher") {
    classes = db.prepare(`
      SELECT c.*, u.name as teacher_name,
      (SELECT title FROM assignments WHERE class_id = c.id AND deadline > DATETIME('now') ORDER BY deadline ASC LIMIT 1) as upcoming_assignment
      FROM classes c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.teacher_id = ?
    `).all(userId);
  } else {
    classes = db.prepare(`
      SELECT c.*, u.name as teacher_name,
      (SELECT title FROM assignments WHERE class_id = c.id AND deadline > DATETIME('now') ORDER BY deadline ASC LIMIT 1) as upcoming_assignment
      FROM classes c
      JOIN enrollments e ON c.id = e.class_id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.user_id = ?
    `).all(userId);
  }

  res.status(200).json({ success: true, classes });
});

export const getClassDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  const classroom: any = db.prepare("SELECT * FROM classes WHERE id = ?").get(id);
  if (!classroom) {
    return res.status(404).json({ message: "Class not found" });
  }

  // Check if user is part of the class
  if (req.user.role === "teacher") {
    if (classroom.teacher_id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
  } else {
    const enrollment = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND class_id = ?").get(userId, id);
    if (!enrollment) {
      return res.status(403).json({ message: "Access denied" });
    }
  }

  const students = db.prepare(`
    SELECT u.id, u.name, u.email FROM users u
    JOIN enrollments e ON u.id = e.user_id
    WHERE e.class_id = ?
  `).all(id);

  res.status(200).json({ success: true, class: classroom, students });
});

export const deleteClass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const teacherId = req.user.id;

  const result = db.prepare("DELETE FROM classes WHERE id = ? AND teacher_id = ?").run(id, teacherId);

  if (result.changes === 0) {
    return res.status(404).json({ message: "Class not found or unauthorized" });
  }

  res.status(200).json({ success: true, message: "Class deleted successfully" });
});

export const getAllMaterials = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  // Fetch materials for the class, sorted by latest upload first
  const materials = db.prepare(`
    SELECT * FROM materials 
    WHERE class_id = ? 
    ORDER BY created_at DESC
  `).all(id);

  res.status(200).json({ success: true, materials });
});
