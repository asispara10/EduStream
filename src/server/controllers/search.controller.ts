import { Request, Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";

export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    return res.json({ classes: [], assignments: [], announcements: [] });
  }

  const keyword = `%${q}%`;

  const classes = db.prepare(`
    SELECT id, name, subject, section FROM classes 
    WHERE name LIKE ? OR subject LIKE ? OR description LIKE ?
    LIMIT 5
  `).all(keyword, keyword, keyword);

  const assignments = db.prepare(`
    SELECT a.id, a.title, a.class_id, c.name as class_name 
    FROM assignments a
    JOIN classes c ON a.class_id = c.id
    WHERE a.title LIKE ? OR a.instructions LIKE ?
    LIMIT 5
  `).all(keyword, keyword);

  const announcements = db.prepare(`
    SELECT a.id, a.title, a.content, a.class_id, c.name as class_name 
    FROM announcements a
    JOIN classes c ON a.class_id = c.id
    WHERE a.title LIKE ? OR a.content LIKE ?
    LIMIT 5
  `).all(keyword, keyword);

  res.json({
    classes,
    assignments,
    announcements
  });
});
