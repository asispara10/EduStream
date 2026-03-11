import { Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";
import { getIO } from "../socket.ts";
import { getNepalISOString } from "../utils/date.ts";

export const createComment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { parentId, parentType, content } = req.body;

  if (!parentId || !parentType || !content) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const createdAt = getNepalISOString();
  const result = db.prepare(
    "INSERT INTO comments (parent_id, parent_type, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(parentId, parentType, req.user.id, content, createdAt);

  const comment = {
    id: result.lastInsertRowid,
    parent_id: parentId,
    parent_type: parentType,
    user_id: req.user.id,
    user_name: req.user.name,
    user_avatar: req.user.avatar,
    content,
    created_at: createdAt,
  };

  // Get classId to emit to the right room
  let classId: number | null = null;
  if (parentType === 'announcement') {
    const announcement = db.prepare("SELECT class_id FROM announcements WHERE id = ?").get(parentId);
    if (announcement) classId = announcement.class_id;
  } else if (parentType === 'assignment') {
    const assignment = db.prepare("SELECT class_id FROM assignments WHERE id = ?").get(parentId);
    if (assignment) classId = assignment.class_id;
  }

  if (classId) {
    getIO().to(`class_${classId}`).emit("new-comment", comment);
  }

  res.status(201).json({
    success: true,
    comment,
  });
});
