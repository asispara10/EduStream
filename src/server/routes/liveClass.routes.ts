import { Router } from "express";
import { 
  startLiveClass, 
  endLiveClass, 
  getActiveLiveClass, 
  getLiveClassParticipants, 
  removeParticipant,
  getLiveChatMessages,
  pinChatMessage,
  getActiveLiveClassesAll
} from "../controllers/liveClass.controller.ts";
import { protect, restrictTo } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/start", protect, restrictTo("teacher"), startLiveClass);
router.put("/:id/end", protect, restrictTo("teacher", "admin"), endLiveClass);
router.get("/active/all", protect, getActiveLiveClassesAll);
router.get("/active/:classId", protect, getActiveLiveClass);
router.get("/:id/participants", protect, getLiveClassParticipants);
router.delete("/:id/participants/:userId", protect, restrictTo("teacher"), removeParticipant);
router.get("/:id/chat", protect, getLiveChatMessages);
router.put("/:id/chat/:messageId/pin", protect, restrictTo("teacher"), pinChatMessage);

export default router;
