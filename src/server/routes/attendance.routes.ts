import { Router } from "express";
import { getAttendanceHistory } from "../controllers/attendance.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";

const router = Router();

router.get("/:classId", protect, getAttendanceHistory);

export default router;
