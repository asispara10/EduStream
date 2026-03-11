import { Router } from "express";
import { uploadProfile } from "../controllers/user.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";
import { upload } from "../utils/upload.ts";

const router = Router();

router.put("/upload-profile", protect, upload.single('profileImage'), uploadProfile);

export default router;
