import { Router } from "express";
import { globalSearch } from "../controllers/search.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/", protect, globalSearch);

export default router;
