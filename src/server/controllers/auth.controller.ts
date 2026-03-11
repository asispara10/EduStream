import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import db from "../db.ts";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.ts";
import { asyncHandler } from "../middleware/error.middleware.ts";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existingUser) {
    return res.status(400).json({ message: "User with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const result = db.prepare(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)"
  ).run(name, email, hashedPassword, role);

  const user = { id: result.lastInsertRowid, name, email, role };
  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    user,
    accessToken,
    refreshToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(404).json({ message: "Account not found" });
  }
  
  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

export const logout = (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const getMe = asyncHandler(async (req: any, res: Response) => {
  const user = db.prepare("SELECT id, name, email, role, avatar, notif_comments_on_posts, notif_mentions, notif_private_comments, notif_teacher_posts, notif_teacher_announcements, notif_new_assignments, notif_returned_work, notif_invitations, notif_due_reminders, notif_late_submissions, notif_resubmissions, notif_co_teach, notif_scheduled_posts FROM users WHERE id = ?").get(req.user.id);
  res.status(200).json({ success: true, user });
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const { name, avatar } = req.body;
  db.prepare("UPDATE users SET name = ?, avatar = ? WHERE id = ?").run(name, avatar, req.user.id);
  const user = db.prepare("SELECT id, name, email, role, avatar FROM users WHERE id = ?").get(req.user.id);
  res.status(200).json({ success: true, user });
});

export const updatePassword = asyncHandler(async (req: any, res: Response) => {
  const { current, new: newPass } = req.body;
  const user: any = db.prepare("SELECT password FROM users WHERE id = ?").get(req.user.id);
  if (!(await bcrypt.compare(current, user.password))) {
    return res.status(401).json({ message: "Invalid current password" });
  }
  const hashedPassword = await bcrypt.hash(newPass, 12);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.user.id);
  res.status(200).json({ success: true, message: "Password updated" });
});

export const updateNotifications = asyncHandler(async (req: any, res: Response) => {
  const settings = req.body;
  const keys = Object.keys(settings);
  if (keys.length === 0) return res.status(400).json({ message: "No settings provided" });
  
  const key = keys[0];
  const value = settings[key];
  db.prepare(`UPDATE users SET ${key} = ? WHERE id = ?`).run(value, req.user.id);
  res.status(200).json({ success: true });
});
