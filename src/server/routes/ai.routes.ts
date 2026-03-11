import { Router } from "express";
import { getContext } from "../controllers/ai.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";

const router = Router();

router.use(protect);

router.post("/context", getContext);

export default router;
