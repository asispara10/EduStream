import { Response } from "express";
import axios from "axios";
import db from "../db.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";
import { AuthRequest } from "../middleware/auth.middleware.ts";
import { getIO } from "../socket.ts";
import { getNepalISOString } from "../utils/date.ts";
import { createNotification } from "./notification.controller.ts";

// --- Global Stream ---
export const createGlobalPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { text_content, link_url } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  
  let imageUrl = null;
  let videoUrl = null;

  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files['image'] && files['image'][0]) imageUrl = `/uploads/images/${files['image'][0].filename}`;
    if (files['video'] && files['video'][0]) videoUrl = `/uploads/videos/${files['video'][0].filename}`;
  }

  const createdAt = getNepalISOString();
  let mediaType = 'none';
  if (imageUrl) mediaType = 'image';
  else if (videoUrl) mediaType = 'video';
  else if (link_url) mediaType = 'link';

  const result = db.prepare(
    "INSERT INTO posts (class_id, user_id, user_role, post_type, text_content, media_type, image_url, video_url, link_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(null, userId, userRole, 'GLOBAL_STREAM', text_content || null, mediaType, imageUrl, videoUrl, link_url || null, createdAt);

  const post = {
    post_id: Number(result.lastInsertRowid),
    class_id: null,
    user_id: userId,
    user_role: userRole,
    post_type: 'GLOBAL_STREAM',
    author_name: req.user.name,
    author_avatar: req.user.avatar,
    text_content,
    media_type: mediaType,
    image_url: imageUrl,
    video_url: videoUrl,
    link_url: link_url || null,
    created_at: createdAt,
    reactions: [],
    comments: []
  };

  getIO().emit("stream:new-global-post", post);
  res.status(201).json({ success: true, post });
});

export const getGlobalPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const posts = db.prepare(`
    SELECT p.*, u.name as author_name, u.avatar as author_avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.post_type = 'GLOBAL_STREAM'
    ORDER BY p.created_at DESC
  `).all();

  const postsWithData = posts.map((p: any) => {
    const reactions = db.prepare("SELECT * FROM post_reactions WHERE post_id = ?").all(p.post_id);
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(p.post_id);
    return { ...p, reactions, comments };
  });

  res.status(200).json({ success: true, posts: postsWithData });
});

// --- Class Stream ---
export const createClassPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const { text_content, link_url } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Validation: Check enrollment/ownership
  if (userRole === 'student') {
    const enrollment = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND class_id = ?").get(userId, classId);
    if (!enrollment) return res.status(403).json({ message: "Not enrolled in this class" });
  } else {
    const classInfo = db.prepare("SELECT teacher_id FROM classes WHERE id = ?").get(classId);
    if (!classInfo || classInfo.teacher_id !== userId) return res.status(403).json({ message: "Not the teacher of this class" });
  }
  
  let imageUrl = null;
  let videoUrl = null;

  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files['image'] && files['image'][0]) imageUrl = `/uploads/images/${files['image'][0].filename}`;
    if (files['video'] && files['video'][0]) videoUrl = `/uploads/videos/${files['video'][0].filename}`;
  }

  const createdAt = getNepalISOString();
  let mediaType = 'none';
  if (imageUrl) mediaType = 'image';
  else if (videoUrl) mediaType = 'video';
  else if (link_url) mediaType = 'link';

  const result = db.prepare(
    "INSERT INTO posts (class_id, user_id, user_role, post_type, text_content, media_type, image_url, video_url, link_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(classId, userId, userRole, 'CLASS_STREAM', text_content || null, mediaType, imageUrl, videoUrl, link_url || null, createdAt);

  const post = {
    post_id: Number(result.lastInsertRowid),
    class_id: parseInt(classId),
    user_id: userId,
    user_role: userRole,
    post_type: 'CLASS_STREAM',
    author_name: req.user.name,
    author_avatar: req.user.avatar,
    text_content,
    media_type: mediaType,
    image_url: imageUrl,
    video_url: videoUrl,
    link_url: link_url || null,
    created_at: createdAt,
    reactions: [],
    comments: []
  };

  getIO().to(`class_${classId}`).emit("stream:new-post", post);
  res.status(201).json({ success: true, post });
});

export const getClassPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { classId } = req.params;
  const userId = req.user.id;

  // Security check
  if (req.user.role === 'student') {
    const enrollment = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND class_id = ?").get(userId, classId);
    if (!enrollment) return res.status(403).json({ message: "Not enrolled" });
  } else {
    const classInfo = db.prepare("SELECT teacher_id FROM classes WHERE id = ?").get(classId);
    if (!classInfo || classInfo.teacher_id !== userId) return res.status(403).json({ message: "Not authorized" });
  }

  const posts = db.prepare(`
    SELECT p.*, u.name as author_name, u.avatar as author_avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.class_id = ? AND p.post_type = 'CLASS_STREAM'
    ORDER BY p.created_at DESC
  `).all(classId);

  const postsWithData = posts.map((p: any) => {
    const reactions = db.prepare("SELECT * FROM post_reactions WHERE post_id = ?").all(p.post_id);
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(p.post_id);
    return { ...p, reactions, comments };
  });

  res.status(200).json({ success: true, posts: postsWithData });
});

export const reactToPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const { type } = req.body;
  const userId = req.user.id;

  db.prepare(`
    INSERT INTO post_reactions (post_id, user_id, type)
    VALUES (?, ?, ?)
    ON CONFLICT(post_id, user_id) DO UPDATE SET type = ?
  `).run(postId, userId, type, type);

  const post = db.prepare("SELECT class_id, post_type FROM posts WHERE post_id = ?").get(postId);
  const reaction = { post_id: parseInt(postId), user_id: userId, type };
  
  if (post && post.post_type === 'CLASS_STREAM') {
    getIO().to(`class_${post.class_id}`).emit("new-reaction", reaction);
  } else {
    getIO().emit("new-global-reaction", reaction);
  }

  res.status(200).json({ success: true });
});

export const commentOnPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  const numericPostId = parseInt(postId);
  if (isNaN(numericPostId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  const createdAt = getNepalISOString();
  const result = db.prepare(
    "INSERT INTO post_comments (post_id, user_id, text, created_at) VALUES (?, ?, ?, ?)"
  ).run(numericPostId, userId, text, createdAt);

  const post = db.prepare("SELECT class_id, post_type FROM posts WHERE post_id = ?").get(numericPostId);
  const comment = {
    id: Number(result.lastInsertRowid),
    post_id: numericPostId,
    user_id: userId,
    user_name: req.user.name,
    user_avatar: req.user.avatar,
    text,
    created_at: createdAt
  };

  if (post && post.post_type === 'CLASS_STREAM') {
    getIO().to(`class_${post.class_id}`).emit("stream:new-comment", comment);
  } else {
    getIO().emit("stream:new-global-comment", comment);
  }

  res.status(201).json({ success: true, comment });
});

export const getLinkPreview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: "URL is required" });
  }

  try {
    // Basic sanitization/validation
    const targetUrl = new URL(url);
    
    // Check for YouTube
    if (targetUrl.hostname.includes('youtube.com') || targetUrl.hostname.includes('youtu.be')) {
      let videoId = '';
      if (targetUrl.hostname.includes('youtu.be')) {
        videoId = targetUrl.pathname.slice(1);
      } else {
        videoId = targetUrl.searchParams.get('v') || '';
      }
      
      if (videoId) {
        return res.json({
          title: "YouTube Video",
          description: url,
          image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          url,
          type: 'youtube'
        });
      }
    }

    // Check for Google Drive
    if (targetUrl.hostname.includes('drive.google.com')) {
      return res.json({
        title: "Google Drive File",
        description: "Shared via Google Drive",
        image: "https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_shared_drive_64.png",
        url,
        type: 'drive'
      });
    }

    const response = await axios.get(url, { 
      timeout: 3000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EduStreamBot/1.0)' }
    });
    const html = response.data;
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : url;
    
    const descriptionMatch = html.match(/<meta name="description" content="(.*?)"/i) || 
                             html.match(/<meta property="og:description" content="(.*?)"/i);
    const description = descriptionMatch ? descriptionMatch[1] : "";
    
    const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/i);
    const image = imageMatch ? imageMatch[1] : "";

    res.json({ title, description, image, url, type: 'website' });
  } catch (error) {
    res.json({ title: url, description: "", image: "", url, type: 'website' });
  }
});

export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  const userId = req.user.id;

  // Verify author or teacher
  const post = db.prepare("SELECT user_id, class_id FROM posts WHERE post_id = ?").get(postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  const classInfo = db.prepare("SELECT teacher_id FROM classes WHERE id = ?").get(post.class_id);

  if (post.user_id !== userId && classInfo.teacher_id !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  db.prepare("DELETE FROM posts WHERE post_id = ?").run(postId);
  
  getIO().to(`class_${post.class_id}`).emit("stream:post-deleted", { post_id: parseInt(postId), class_id: post.class_id });
  
  res.status(200).json({ success: true });
});
