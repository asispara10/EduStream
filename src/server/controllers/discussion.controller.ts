import { Request, Response } from 'express';
import db from '../db.ts';
import { getNepalISOString } from '../utils/date.ts';

export const getDiscussions = (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const discussions = db.prepare(`
      SELECT d.*, u.name as author_name, u.avatar as author_avatar, u.profileImage as author_profileImage,
             (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as reply_count
      FROM discussions d
      JOIN users u ON d.user_id = u.id
      WHERE d.class_id = ?
      ORDER BY d.created_at DESC
    `).all(classId);
    res.json({ discussions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDiscussion = (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { title, content } = req.body;
    const userId = (req as any).user.id;
    const createdAt = getNepalISOString();

    const result = db.prepare(`
      INSERT INTO discussions (class_id, user_id, title, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(classId, userId, title, content, createdAt);

    const newDiscussion = db.prepare(`
      SELECT d.*, u.name as author_name, u.avatar as author_avatar, u.profileImage as author_profileImage,
             0 as reply_count
      FROM discussions d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ message: 'Discussion created', discussion: newDiscussion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDiscussionReplies = (req: Request, res: Response) => {
  try {
    const { discussionId } = req.params;
    const replies = db.prepare(`
      SELECT r.*, u.name as author_name, u.avatar as author_avatar, u.profileImage as author_profileImage
      FROM discussion_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.discussion_id = ?
      ORDER BY r.created_at ASC
    `).all(discussionId);
    res.json({ replies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDiscussionReply = (req: Request, res: Response) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.id;
    const createdAt = getNepalISOString();

    const result = db.prepare(`
      INSERT INTO discussion_replies (discussion_id, user_id, content, created_at)
      VALUES (?, ?, ?, ?)
    `).run(discussionId, userId, content, createdAt);

    const newReply = db.prepare(`
      SELECT r.*, u.name as author_name, u.avatar as author_avatar, u.profileImage as author_profileImage
      FROM discussion_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ message: 'Reply added', reply: newReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
