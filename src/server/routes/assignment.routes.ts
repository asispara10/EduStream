import { Router } from "express";
import { 
  createAssignment, 
  getAssignmentsByClass, 
  submitAssignment, 
  getSubmissions, 
  gradeSubmission, 
  getAllAssignments, 
  getUpcomingAssignments, 
  getSubmissionHistory,
  getPendingAssignments
} from "../controllers/assignment.controller.ts";
import { protect, restrictTo } from "../middleware/auth.middleware.ts";

const router = Router();

router.use(protect);

router.get("/all", getAllAssignments);
router.get("/upcoming", getUpcomingAssignments);
router.get("/pending/:classId", getPendingAssignments);
router.get("/:classId", getAssignmentsByClass);
router.post("/", restrictTo("teacher"), createAssignment);
router.post("/submit", restrictTo("student"), submitAssignment);
router.get("/history/:assignmentId", restrictTo("student"), getSubmissionHistory);
router.get("/submissions/:assignmentId", restrictTo("teacher"), getSubmissions);
router.patch("/grade/:id", restrictTo("teacher"), gradeSubmission);

export default router;
