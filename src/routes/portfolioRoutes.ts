import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  createPortfolio,
  getPortfolioPage,
} from "../controllers/portfolioController";
import fs from "fs";

const router = Router();
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * Expected multipart/form-data:
 * - profileImage: single
 * - projectImages: multiple (order should match projects array)
 * - fields: name, about, qualification, experience, projects (JSON string), linkedin, github, template
 */
router.post(
  "/",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "projectImages", maxCount: 10 },
  ]),
  createPortfolio
);

// public portfolio page
router.get("/:slug", getPortfolioPage);

export default router;
