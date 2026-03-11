import { Router } from "express";
import { addMaterial, getMaterialsByClass, deleteMaterial } from "../controllers/material.controller.ts";
import { protect, restrictTo } from "../middleware/auth.middleware.ts";

const router = Router();

router.use(protect);

router.get("/:classId", getMaterialsByClass);
router.post("/", restrictTo("teacher"), addMaterial);
router.delete("/:id", restrictTo("teacher"), deleteMaterial);

export default router;
