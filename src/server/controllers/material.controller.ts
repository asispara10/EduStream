import { Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";

import { getIO } from "../socket.ts";

export const addMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId, title, description, contentType, url } = req.body;

  if (!classId || !title || !contentType || !url) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const result = db.prepare(
    "INSERT INTO materials (class_id, title, description, content_type, url) VALUES (?, ?, ?, ?, ?)"
  ).run(classId, title, description, contentType, url);

  const material = {
    id: result.lastInsertRowid,
    class_id: classId,
    title,
    description,
    content_type: contentType,
    url,
    created_at: new Date().toISOString()
  };

  getIO().to(`class_${classId}`).emit("new-material", material);

  res.status(201).json({
    success: true,
    material,
  });
});

export const getMaterialsByClass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const materials = db.prepare("SELECT * FROM materials WHERE class_id = ? ORDER BY created_at DESC").all(classId);
  res.status(200).json({ success: true, materials });
});

export const deleteMaterial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.prepare("DELETE FROM materials WHERE id = ?").run(id);
  res.status(200).json({ success: true, message: "Material deleted successfully" });
});
