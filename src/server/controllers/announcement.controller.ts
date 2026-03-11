import { Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";
import { getIO } from "../socket.ts";

export const createAnnouncement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const { title, content, link } = req.body;
  const userId = req.user.id;
  const classIdInt = parseInt(classId, 10);

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: "Only teachers can create announcements" });
  }

  const attachments: any[] = [];
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (files?.image?.[0]) {
    attachments.push({ type: 'image', fileUrl: `/uploads/images/${files.image[0].filename}`, fileName: files.image[0].originalname });
  }
  if (files?.video?.[0]) {
    attachments.push({ type: 'video', fileUrl: `/uploads/videos/${files.video[0].filename}`, fileName: files.video[0].originalname });
  }
  if (files?.document?.[0]) {
    attachments.push({ type: 'pdf', fileUrl: `/uploads/documents/${files.document[0].filename}`, fileName: files.document[0].originalname });
  }
  if (link) {
    attachments.push({ type: 'link', fileUrl: link, fileName: link });
  }

  const attachmentsJson = JSON.stringify(attachments);

  const result = db.prepare(
    "INSERT INTO announcements (class_id, user_id, title, content, attachments, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(classIdInt, userId, title, content, attachmentsJson, new Date().toISOString());

  const announcement = {
    id: Number(result.lastInsertRowid),
    class_id: classIdInt,
    user_id: userId,
    title,
    content,
    attachments: attachments,
    created_at: new Date().toISOString(),
    replies: [],
    author_name: req.user.name,
    author_avatar: req.user.avatar
  };

  getIO().to(`class_${classIdInt}`).emit("new-announcement", announcement);
  res.status(201).json({ success: true, announcement });
});

export const getAnnouncements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const classIdInt = parseInt(classId, 10);
  
  const announcements = db.prepare(`
    SELECT a.*, u.name as author_name, u.avatar as author_avatar
    FROM announcements a
    JOIN users u ON a.user_id = u.id
    WHERE a.class_id = ?
    ORDER BY a.created_at DESC
  `).all(classIdInt);

  const announcementsWithReplies = announcements.map((a: any) => {
    const replies = db.prepare(`
      SELECT r.*, u.name as user_name, u.avatar as user_avatar
      FROM comments r
      JOIN users u ON r.user_id = u.id
      WHERE r.parent_id = ? AND r.parent_type = 'announcement'
      ORDER BY r.created_at ASC
    `).all(a.id);
    
    let parsedAttachments = [];
    if (a.attachments) {
      try {
        parsedAttachments = JSON.parse(a.attachments);
      } catch (e) {}
    }

    return { ...a, replies, attachments: parsedAttachments };
  });

  res.status(200).json({ success: true, announcements: announcementsWithReplies });
});

export const getReplies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { announcementId } = req.params;
  const announcementIdInt = parseInt(announcementId, 10);

  const replies = db.prepare(`
    SELECT r.*, u.name as user_name, u.avatar as user_avatar
    FROM comments r
    JOIN users u ON r.user_id = u.id
    WHERE r.parent_id = ? AND r.parent_type = 'announcement'
    ORDER BY r.created_at ASC
  `).all(announcementIdInt);

  res.status(200).json({ success: true, replies });
});

export const deleteAnnouncement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { announcementId } = req.params;
  const announcementIdInt = parseInt(announcementId, 10);
  const userId = req.user.id;

  const announcement = db.prepare("SELECT * FROM announcements WHERE id = ?").get(announcementIdInt);
  if (!announcement) return res.status(404).json({ message: "Announcement not found" });
  
  if (announcement.user_id !== userId) return res.status(403).json({ message: "Unauthorized" });

  db.prepare("DELETE FROM announcements WHERE id = ?").run(announcementIdInt);
  db.prepare("DELETE FROM comments WHERE parent_id = ? AND parent_type = 'announcement'").run(announcementIdInt);

  res.status(200).json({ success: true });
});

export const createReply = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { announcementId } = req.params;
  const announcementIdInt = parseInt(announcementId, 10);
  const { content } = req.body;
  const userId = req.user.id;

  const result = db.prepare(
    "INSERT INTO comments (parent_type, parent_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run('announcement', announcementIdInt, userId, content, new Date().toISOString());

  const reply = {
    id: Number(result.lastInsertRowid),
    parent_id: announcementIdInt,
    user_id: userId,
    content,
    created_at: new Date().toISOString(),
    user_name: req.user.name,
    user_avatar: req.user.avatar
  };

  res.status(201).json({ success: true, reply });
});

export const deleteReply = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { replyId } = req.params;
  const replyIdInt = parseInt(replyId, 10);
  const userId = req.user.id;

  const reply = db.prepare("SELECT * FROM comments WHERE id = ?").get(replyIdInt);
  if (!reply) return res.status(404).json({ message: "Reply not found" });

  if (reply.user_id !== userId && req.user.role !== 'teacher') return res.status(403).json({ message: "Unauthorized" });

  db.prepare("DELETE FROM comments WHERE id = ?").run(replyIdInt);
  res.status(200).json({ success: true });
});
