// import { Router } from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// import {
//   createPortfolio,
//   downloadResume,
//   getPortfolioPage,
// } from "../controllers/portfolioController";

// const router = Router();

// // ----------------------
// // FIX 1 — Correct upload directory
// // Save inside PROJECT ROOT → "/uploads"
// const uploadDir = path.join(process.cwd(), "uploads");

// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// // ----------------------
// // Multer storage
// // ----------------------
// const storage = multer.diskStorage({
//   destination: path.join(process.cwd(), "uploads"),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
//   },
// });

// const upload = multer({ storage });
// router.get("/download/:slug/resume", downloadResume);

// // ----------------------
// // Routes
// // ----------------------
// router.post(
//   "/",
//   upload.fields([
//     { name: "profileImage", maxCount: 1 },
//     { name: "resume", maxCount: 1 },
//     { name: "projectImages", maxCount: 20 },
//   ]),
//   createPortfolio
// );

// // router.get("/:slug", getPortfolioPage);

// export default router;

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  createPortfolio,
  downloadResume,
  getPortfolioPage,
} from "../controllers/portfolioController";

const router = Router();

// ----------------------
// UPLOAD DIRECTORY
// ----------------------
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ----------------------
// MULTER STORAGE + FILTER
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

// Allow images + PDF
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type") as any, false);
    }
    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 },
});

// ----------------------
// DOWNLOAD RESUME ROUTE
// ----------------------
router.get("/download/:slug/resume", downloadResume);

// ----------------------
// UPLOAD ROUTE
// ----------------------
router.post(
  "/",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "resume", maxCount: 1 }, // PDF uploaded here
    { name: "projectImages", maxCount: 20 },
  ]),
  createPortfolio
);

// router.get("/:slug", getPortfolioPage);

export default router;
