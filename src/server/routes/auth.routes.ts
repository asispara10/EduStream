import { Router } from "express";
import { register, login, logout, getMe, updateProfile, updatePassword, updateNotifications } from "../controllers/auth.controller.ts";
import { protect } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);
router.put("/notifications", protect, updateNotifications);

export default router;
