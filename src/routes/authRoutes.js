import express from "express";
import { auth } from "../config/auth.js";
import { toNodeHandler } from "better-auth/node";
import validate from "../middleware/validationMiddleware.js";
import { registerSchema, loginSchema } from "../validations/auth.schema.js";
import { protect } from "../middleware/authMiddleware.js";
import { getMe } from "../controllers/authController.js";

const router = express.Router();

// 1) Input Validations for Better Auth signup and login endpoints
router.post("/sign-up/email", validate(registerSchema));
router.post("/sign-in/email", validate(loginSchema));

// 2) Custom Profile Endpoint
router.get("/me", protect, getMe);

// 3) Better Auth default route handler
router.use(toNodeHandler(auth));

export default router;