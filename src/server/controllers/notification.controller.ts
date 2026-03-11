import { Request, Response } from "express";
import db from "../db.ts";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(userId);

    res.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(id, userId);

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId);

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

import { sendNotification } from "../socket.ts";

// Helper function to create notifications
export const createNotification = (userId: number, type: string, title: string, message: string, classId?: number) => {
  try {
    // Check user preferences
    const user = db.prepare(`
      SELECT 
        notif_comments_on_posts, 
        notif_mentions, 
        notif_private_comments, 
        notif_teacher_posts, 
        notif_teacher_announcements,
        notif_new_assignments,
        notif_returned_work, 
        notif_invitations, 
        notif_due_reminders, 
        notif_late_submissions, 
        notif_resubmissions, 
        notif_co_teach, 
        notif_scheduled_posts 
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) return;

    // Map type to preference column
    let preferenceKey = "";
    if (type === 'announcement') preferenceKey = "notif_teacher_announcements";
    else if (type === 'assignment') preferenceKey = "notif_new_assignments";
    else if (type === 'holiday') preferenceKey = "notif_invitations"; // Or something else
    else if (type === 'deadline') preferenceKey = "notif_due_reminders";
    else if (type === 'grade') preferenceKey = "notif_returned_work";

    if (preferenceKey && user[preferenceKey] === 0) {
      console.log(`Notification of type ${type} suppressed for user ${userId} due to preference ${preferenceKey}`);
      return;
    }

    const result = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, class_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, type, title, message, classId || null);

    const newNotification = {
      id: result.lastInsertRowid,
      user_id: userId,
      type,
      title,
      message,
      class_id: classId || null,
      read: 0,
      created_at: new Date().toISOString()
    };

    sendNotification(userId, newNotification);
  } catch (error) {
    console.error("Create notification error:", error);
  }
};
