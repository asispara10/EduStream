import { Router } from "express";
import { createClass, joinClass, getMyClasses, getClassDetails, deleteClass, getAllMaterials } from "../controllers/class.controller.ts";
import { protect, restrictTo } from "../middleware/auth.middleware.ts";
import { autoMarkAttendance } from "../middleware/attendance.middleware.ts";

const router = Router();

router.use(protect);

router.get("/", getMyClasses);
router.post("/", restrictTo("teacher"), createClass);
router.post("/join", restrictTo("student"), joinClass);
router.get("/:id", autoMarkAttendance, getClassDetails);
router.get("/:id/all-materials", getAllMaterials);
router.delete("/:id", restrictTo("teacher"), deleteClass);

export default router;
