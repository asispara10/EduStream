import { Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";

export const getContext = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.body;

  if (!classId) {
    return res.status(400).json({ message: "Class ID is required" });
  }

  // Fetch some context about the class
  const classroom: any = db.prepare("SELECT name, description FROM classes WHERE id = ?").get(classId);
  const materials = db.prepare("SELECT title FROM materials WHERE class_id = ? LIMIT 5").all(classId);
  const assignments = db.prepare("SELECT title, instructions FROM assignments WHERE class_id = ? LIMIT 3").all(classId);

  const context = `
    Classroom: ${classroom?.name}
    Description: ${classroom?.description}
    Materials: ${materials.map((m: any) => m.title).join(", ")}
    Recent Assignments: ${assignments.map((a: any) => `${a.title}: ${a.instructions}`).join("; ")}
  `;

  res.status(200).json({ success: true, context });
});
