import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure directories exist
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir("uploads/images/");
ensureDir("uploads/videos/");
ensureDir("uploads/documents/");
ensureDir("uploads/stream/");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, "uploads/videos/");
    } else if (file.mimetype.startsWith("image/")) {
      cb(null, "uploads/images/");
    } else if (file.mimetype === "application/pdf" || file.mimetype.includes("document") || file.mimetype.includes("presentation") || file.mimetype.includes("msword") || file.mimetype.includes("powerpoint")) {
      cb(null, "uploads/documents/");
    } else {
      cb(null, "uploads/stream/");
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for videos
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const allowedDocTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];

    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, GIF, WEBP images, MP4, WEBM, MOV videos, and PDF, DOC, PPT documents are allowed"));
    }
  },
});

