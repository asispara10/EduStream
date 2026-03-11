import { Request, Response } from "express";
import db from "../db.ts";

export const uploadProfile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = (req as any).user.id;
    const profileImageUrl = `/uploads/profiles/${req.file.filename}`;

    // Update both avatar and profileImage for compatibility
    db.prepare("UPDATE users SET avatar = ?, profileImage = ? WHERE id = ?").run(profileImageUrl, profileImageUrl, userId);

    res.json({ 
      message: "Profile image uploaded successfully",
      profileImage: profileImageUrl 
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload profile image" });
  }
};
