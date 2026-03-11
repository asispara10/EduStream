import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import multer from "multer";

// Load environment variables
dotenv.config();

const upload = multer({
  dest: "uploads/stream/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

import authRoutes from "./src/server/routes/auth.routes.ts";
import classRoutes from "./src/server/routes/class.routes.ts";
import materialRoutes from "./src/server/routes/material.routes.ts";
import assignmentRoutes from "./src/server/routes/assignment.routes.ts";
import attendanceRoutes from "./src/server/routes/attendance.routes.ts";
import announcementRoutes from "./src/server/routes/announcement.routes.ts";
import commentRoutes from "./src/server/routes/comment.routes.ts";
import aiRoutes from "./src/server/routes/ai.routes.ts";
import userRoutes from "./src/server/routes/user.routes.ts";
import notificationRoutes from "./src/server/routes/notification.routes.ts";
import searchRoutes from "./src/server/routes/search.routes.ts";
import liveClassRoutes from "./src/server/routes/liveClass.routes.ts";
import discussionRoutes from "./src/server/routes/discussion.routes.ts";
import postRoutes from "./src/server/routes/post.routes.ts";
import { errorHandler } from "./src/server/middleware/error.middleware.ts";

import { createServer } from "http";
import { initSocket } from "./src/server/socket.ts";

async function startServer() {
  console.log("Starting EduStream server...");
  const app = express();
  const httpServer = createServer(app);
  const io = initSocket(httpServer);
  const PORT = 3000;

  // Security & Utility Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for Vite development
  }));
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(morgan("dev", { skip: (req, res) => res.statusCode < 400 }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/classes", classRoutes);
  app.use("/api/materials", materialRoutes);
  app.use("/api/assignments", assignmentRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api", announcementRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/live-class", liveClassRoutes);
  app.use("/api/discussions", discussionRoutes);
  app.use("/api", postRoutes);

  // Serve static files from uploads folder
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Using Vite middleware in development mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  // Error handling middleware
  app.use(errorHandler);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
