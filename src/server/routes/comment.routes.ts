import { Router } from "express";
import { createComment } from "../controllers/comment.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";

const router = Router();

router.use(protect);

router.post("/", createComment);

export default router;
