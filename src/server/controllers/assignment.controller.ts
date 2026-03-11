import { Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";

import { getIO } from "../socket.ts";
import { createNotification } from "./notification.controller.ts";

export const createAssignment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId, title, instructions, deadline, totalMarks, attachments } = req.body;

  const result = db.prepare(
    "INSERT INTO assignments (class_id, title, instructions, deadline, total_marks, attachments) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(classId, title, instructions, deadline, totalMarks || 100, attachments ? JSON.stringify(attachments) : null);

  const assignment = {
    id: result.lastInsertRowid,
    class_id: classId,
    title,
    instructions,
    deadline,
    total_marks: totalMarks || 100,
    attachments: attachments || [],
    created_at: new Date().toISOString()
  };

  getIO().to(`class_${classId}`).emit("new-assignment", assignment);

  // Trigger notifications for all students in the class
  const students = db.prepare("SELECT user_id FROM enrollments WHERE class_id = ?").all(classId);
  const className = db.prepare("SELECT name FROM classes WHERE id = ?").get(classId)?.name || "Class";

  students.forEach((student: any) => {
    createNotification(
      student.user_id,
      'assignment',
      `New Assignment: ${title}`,
      `Due: ${new Date(deadline).toLocaleDateString()} in ${className}`,
      classId
    );
  });

  res.status(201).json({
    success: true,
    assignment,
  });
});

export const getAssignmentsByClass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const assignments = db.prepare(`
    SELECT a.*, c.name as class_name 
    FROM assignments a 
    JOIN classes c ON a.class_id = c.id 
    WHERE a.class_id = ? 
    ORDER BY a.deadline ASC
  `).all(classId);

  // Attach comments
  const assignmentsWithComments = assignments.map((a: any) => {
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.parent_id = ? AND c.parent_type = 'assignment'
      ORDER BY c.created_at ASC
    `).all(a.id);

    // Parse attachments
    if (a.attachments) {
      try {
        a.attachments = JSON.parse(a.attachments);
      } catch (e) {
        a.attachments = [];
      }
    } else {
      a.attachments = [];
    }

    return { ...a, comments };
  });

  res.status(200).json({ success: true, assignments: assignmentsWithComments });
});

export const getAllAssignments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const assignments = db.prepare(`
    SELECT a.*, c.name as class_name
    FROM assignments a
    JOIN classes c ON a.class_id = c.id
    WHERE a.class_id IN (
      SELECT class_id FROM enrollments WHERE user_id = ?
      UNION
      SELECT id FROM classes WHERE teacher_id = ?
    )
    ORDER BY a.created_at DESC
  `).all(req.user.id, req.user.id);

  const assignmentsWithComments = assignments.map((a: any) => {
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.parent_id = ? AND c.parent_type = 'assignment'
      ORDER BY c.created_at ASC
    `).all(a.id);

    // Parse attachments
    if (a.attachments) {
      try {
        a.attachments = JSON.parse(a.attachments);
      } catch (e) {
        a.attachments = [];
      }
    } else {
      a.attachments = [];
    }

    return { ...a, comments };
  });

  res.status(200).json({ success: true, assignments: assignmentsWithComments });
});

export const getUpcomingAssignments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const assignments = db.prepare(`
    SELECT a.*, c.name as class_name
    FROM assignments a
    JOIN classes c ON a.class_id = c.id
    WHERE a.class_id IN (
      SELECT class_id FROM enrollments WHERE user_id = ?
      UNION
      SELECT id FROM classes WHERE teacher_id = ?
    )
    AND a.deadline > DATETIME('now')
    ORDER BY a.deadline ASC
  `).all(req.user.id, req.user.id);

  res.status(200).json({ success: true, assignments });
});

export const submitAssignment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { assignmentId, content, submittedFile } = req.body;
  const studentId = req.user.id;

  // Get current attempt number
  const lastAttempt = db.prepare("SELECT MAX(attempt_number) as last_attempt FROM submissions WHERE assignment_id = ? AND student_id = ?").get(assignmentId, studentId);
  const nextAttempt = (lastAttempt?.last_attempt || 0) + 1;

  const result = db.prepare(
    "INSERT INTO submissions (assignment_id, student_id, content, submitted_file, attempt_number) VALUES (?, ?, ?, ?, ?)"
  ).run(assignmentId, studentId, content, submittedFile, nextAttempt);

  res.status(201).json({ success: true, submissionId: result.lastInsertRowid, attemptNumber: nextAttempt });
});

export const getSubmissionHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { assignmentId } = req.params;
  const studentId = req.user.id;

  const history = db.prepare(`
    SELECT * FROM submissions 
    WHERE assignment_id = ? AND student_id = ?
    ORDER BY attempt_number DESC
  `).all(assignmentId, studentId);

  res.status(200).json({ success: true, history });
});

export const getSubmissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { assignmentId } = req.params;
  const submissions = db.prepare(`
    SELECT s.*, u.name as student_name FROM submissions s
    JOIN users u ON s.student_id = u.id
    WHERE s.assignment_id = ?
  `).all(assignmentId);
  res.status(200).json({ success: true, submissions });
});

export const gradeSubmission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { grade, feedback } = req.body;

  db.prepare("UPDATE submissions SET grade = ?, feedback = ? WHERE id = ?").run(grade, feedback, id);

  // Trigger notification for the student
  const submission: any = db.prepare(`
    SELECT s.student_id, a.title, a.class_id, c.name as class_name
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN classes c ON a.class_id = c.id
    WHERE s.id = ?
  `).get(id);

  if (submission) {
    createNotification(
      submission.student_id,
      'grade',
      `Assignment Graded: ${submission.title}`,
      `Your work in ${submission.class_name} has been graded. Grade: ${grade}`,
      submission.class_id
    );
  }

  res.status(200).json({ success: true, message: "Graded successfully" });
});

export const getPendingAssignments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const studentId = req.user.id;

  const assignments = db.prepare(`
    SELECT a.*, c.name as class_name 
    FROM assignments a 
    JOIN classes c ON a.class_id = c.id 
    WHERE a.class_id = ? 
    AND a.id NOT IN (
      SELECT assignment_id FROM submissions WHERE student_id = ?
    )
    AND a.deadline > DATETIME('now')
    ORDER BY a.deadline ASC
  `).all(classId, studentId);

  res.status(200).json({ success: true, assignments });
});
