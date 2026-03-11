import { Response } from "express";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";
import { createNotification } from "./notification.controller.ts";
import { getIO } from "../socket.ts";

export const startLiveClass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.body;
  const teacherId = req.user.id;

  // Check if user is teacher of the class
  const classInfo = db.prepare("SELECT * FROM classes WHERE id = ? AND teacher_id = ?").get(classId, teacherId);
  if (!classInfo) {
    return res.status(403).json({ message: "Only the teacher can start a live class" });
  }

  // Check if there's already an active live class
  const activeClass = db.prepare("SELECT id FROM live_classes WHERE class_id = ? AND is_live = 1").get(classId);
  if (activeClass) {
    return res.status(400).json({ message: "A live class is already active for this classroom" });
  }

  const result = db.prepare(
    "INSERT INTO live_classes (class_id, teacher_id) VALUES (?, ?)"
  ).run(classId, teacherId);

  const liveClassId = result.lastInsertRowid;

  // Notify students
  const students = db.prepare("SELECT user_id FROM enrollments WHERE class_id = ?").all(classId);
  students.forEach((student: any) => {
    createNotification(
      student.user_id,
      'announcement', // Using announcement type as proxy for live class start
      `Live Class Started: ${classInfo.name}`,
      "Your teacher has started a live session. Join now!",
      classId
    );
  });

  // Emit socket event
  const io = getIO();
  io.to(`class_${classId}`).emit("live-class-started", {
    liveClassId,
    classId,
    teacherId,
    className: classInfo.name
  });

  res.status(201).json({
    success: true,
    liveClass: { id: liveClassId, classId, teacherId, isLive: true }
  });
});

export const endLiveClass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  let liveClass;
  if (userRole === "admin") {
    liveClass = db.prepare("SELECT * FROM live_classes WHERE id = ?").get(Number(id));
  } else {
    liveClass = db.prepare("SELECT * FROM live_classes WHERE id = ? AND teacher_id = ?").get(Number(id), userId);
  }

  if (!liveClass) {
    return res.status(403).json({ message: "Unauthorized to end this live class" });
  }

  db.prepare("UPDATE live_classes SET is_live = 0, ended_at = CURRENT_TIMESTAMP WHERE id = ?").run(Number(id));

  // Emit socket event
  const io = getIO();
  io.to(`live_class_${id}`).emit("live-class-ended", { liveClassId: Number(id) });

  res.status(200).json({ success: true, message: "Live class ended" });
});

export const getActiveLiveClass = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const liveClass = db.prepare(`
    SELECT lc.*, u.name as teacher_name, u.avatar as teacher_avatar
    FROM live_classes lc
    JOIN users u ON lc.teacher_id = u.id
    WHERE lc.class_id = ? AND lc.is_live = 1
  `).get(classId);

  if (!liveClass) {
    return res.status(200).json({ success: true, liveClass: null });
  }

  // Check if user is removed
  const removed = db.prepare("SELECT * FROM live_class_removed_users WHERE live_class_id = ? AND user_id = ?").get(liveClass.id, req.user.id);
  if (removed) {
    return res.status(403).json({ message: "You have been removed from this live class" });
  }

  res.status(200).json({ success: true, liveClass });
});

export const getLiveClassParticipants = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const participants = db.prepare(`
    SELECT u.id, u.name, u.avatar, u.profileImage
    FROM live_class_participants lcp
    JOIN users u ON lcp.user_id = u.id
    WHERE lcp.live_class_id = ?
  `).all(id);

  res.status(200).json({ success: true, participants });
});

export const removeParticipant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, userId } = req.params;
  const teacherId = req.user.id;

  const liveClass = db.prepare("SELECT * FROM live_classes WHERE id = ? AND teacher_id = ?").get(id, teacherId);
  if (!liveClass) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  db.prepare("DELETE FROM live_class_participants WHERE live_class_id = ? AND user_id = ?").run(id, userId);
  db.prepare("INSERT OR IGNORE INTO live_class_removed_users (live_class_id, user_id) VALUES (?, ?)").run(id, userId);

  // Emit socket event to force disconnect the user
  const io = getIO();
  io.to(`live_class_${id}`).emit("participant-removed", { userId: parseInt(userId) });

  res.status(200).json({ success: true, message: "Participant removed" });
});

export const getLiveChatMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const messages = db.prepare(`
    SELECT lcm.*, u.name as user_name, u.avatar as user_avatar
    FROM live_chat_messages lcm
    JOIN users u ON lcm.user_id = u.id
    WHERE lcm.live_class_id = ?
    ORDER BY lcm.created_at ASC
  `).all(id);

  res.status(200).json({ success: true, messages });
});

export const pinChatMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, messageId } = req.params;
  const teacherId = req.user.id;

  const liveClass = db.prepare("SELECT * FROM live_classes WHERE id = ? AND teacher_id = ?").get(id, teacherId);
  if (!liveClass) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  // Unpin all messages for this class first
  db.prepare("UPDATE live_chat_messages SET is_pinned = 0 WHERE live_class_id = ?").run(id);
  // Pin the selected message
  db.prepare("UPDATE live_chat_messages SET is_pinned = 1 WHERE id = ? AND live_class_id = ?").run(messageId, id);

  const pinnedMessage = db.prepare(`
    SELECT lcm.*, u.name as user_name
    FROM live_chat_messages lcm
    JOIN users u ON lcm.user_id = u.id
    WHERE lcm.id = ?
  `).get(messageId);

  // Emit socket event
  const io = getIO();
  io.to(`live_class_${id}`).emit("message-pinned", { pinnedMessage });

  res.status(200).json({ success: true, pinnedMessage });
});

export const getActiveLiveClassesAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const activeClasses = db.prepare("SELECT class_id FROM live_classes WHERE is_live = 1").all();
  res.status(200).json({ success: true, activeClasses });
});
