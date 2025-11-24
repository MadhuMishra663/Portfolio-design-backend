import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  createPortfolio,
  getPortfolioPage,
} from "../controllers/portfolioController";

const router = Router();

// ----------------------
// FIX 1 — Correct upload directory
// Save inside PROJECT ROOT → "/uploads"
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ----------------------
// Multer storage
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({ storage });

// ----------------------
// Routes
// ----------------------
router.post(
  "/",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "projectImages", maxCount: 20 },
  ]),
  createPortfolio
);

// router.get("/:slug", getPortfolioPage);

export default router;
