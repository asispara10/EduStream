import { Router } from "express";
import { createGlobalPost, getGlobalPosts, createClassPost, getClassPosts, reactToPost, commentOnPost, deletePost, getLinkPreview } from "../controllers/post.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";
import { upload } from "../middleware/upload.middleware.ts";

const router = Router();

// Global Stream
router.post("/global-stream/post", protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), createGlobalPost);
router.get("/global-stream/posts", protect, getGlobalPosts);

// Class Stream
router.post("/class/:classId/post", protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), createClassPost);
router.get("/class/:classId/posts", protect, getClassPosts);

// Common
router.get("/stream/link-preview", protect, getLinkPreview);
router.post("/stream/:postId/react", protect, reactToPost);
router.post("/stream/:postId/comment", protect, commentOnPost);
router.delete("/stream/:postId", protect, deletePost);

export default router;
