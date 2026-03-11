import { Router } from "express";
import { createAnnouncement, getAnnouncements, deleteAnnouncement, createReply, deleteReply, getReplies } from "../controllers/announcement.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";
import { upload } from "../middleware/upload.middleware.ts";

const router = Router();

router.post("/class/:classId/announcement", protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }, { name: 'document', maxCount: 1 }]), createAnnouncement);
router.get("/class/:classId/announcements", protect, getAnnouncements);
router.delete("/announcement/:announcementId", protect, deleteAnnouncement);
router.post("/announcement/:announcementId/reply", protect, createReply);
router.get("/announcement/:announcementId/replies", protect, getReplies);
router.delete("/reply/:replyId", protect, deleteReply);

export default router;
