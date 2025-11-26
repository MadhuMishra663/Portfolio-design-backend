// // import { Router } from "express";
// // import multer from "multer";
// // import path from "path";
// // import fs from "fs";

// // import {
// //   createPortfolio,
// //   downloadResume,
// //   getPortfolioPage,
// // } from "../controllers/portfolioController";

// // const router = Router();

// // // ----------------------
// // // FIX 1 — Correct upload directory
// // // Save inside PROJECT ROOT → "/uploads"
// // const uploadDir = path.join(process.cwd(), "uploads");

// // if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// // // ----------------------
// // // Multer storage
// // // ----------------------
// // const storage = multer.diskStorage({
// //   destination: path.join(process.cwd(), "uploads"),
// //   filename: (req, file, cb) => {
// //     const ext = path.extname(file.originalname);
// //     cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
// //   },
// // });

// // const upload = multer({ storage });
// // router.get("/download/:slug/resume", downloadResume);

// // // ----------------------
// // // Routes
// // // ----------------------
// // router.post(
// //   "/",
// //   upload.fields([
// //     { name: "profileImage", maxCount: 1 },
// //     { name: "resume", maxCount: 1 },
// //     { name: "projectImages", maxCount: 20 },
// //   ]),
// //   createPortfolio
// // );

// // // router.get("/:slug", getPortfolioPage);

// // export default router;

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
// // UPLOAD DIRECTORY
// // ----------------------
// const uploadDir = path.join(process.cwd(), "uploads");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// // ----------------------
// // MULTER STORAGE + FILTER
// // ----------------------
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
//   },
// });

// // Allow images + PDF
// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     const allowed = [
//       "image/jpeg",
//       "image/png",
//       "image/webp",
//       "application/pdf",
//     ];

//     if (!allowed.includes(file.mimetype)) {
//       return cb(new Error("Unsupported file type") as any, false);
//     }
//     cb(null, true);
//   },
//   limits: { fileSize: 100 * 1024 * 1024 },
// });

// // ----------------------
// // DOWNLOAD RESUME ROUTE
// // ----------------------
// // router.get("/download/:slug/resume", downloadResume);

// // ----------------------
// // UPLOAD ROUTE
// // ----------------------
// router.post(
//   "/",
//   upload.fields([
//     { name: "profileImage", maxCount: 1 },
//     { name: "resume", maxCount: 1 }, // PDF uploaded here
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
import Portfolio from "../models/portfolio";

import {
  createPortfolio,
  getPortfolioPage,
} from "../controllers/portfolioController";

const router = Router();

// ----------------------
// UPLOAD DIRECTORY
// ----------------------
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ----------------------
// MULTER STORAGE
// ----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

// allow images + PDFs
const upload = multer({
  storage,
  // fileFilter: allow any image/* and pdf (and octet-stream -> .pdf fallback)
  fileFilter: (req, file, cb) => {
    try {
      const mimetype = file.mimetype || "";
      // allow all image types
      if (mimetype.startsWith("image/")) return cb(null, true);

      // allow PDFs
      if (mimetype === "application/pdf") return cb(null, true);

      // fallback: some pickers return application/octet-stream for PDF files
      const ext = path.extname(file.originalname).toLowerCase();
      if (mimetype === "application/octet-stream" && ext === ".pdf") {
        return cb(null, true);
      }

      console.warn("Multer rejected file:", file.originalname, file.mimetype);
      return cb(null, false);
    } catch (err) {
      console.error("fileFilter error:", err);
      return cb(null, false);
    }
  },

  limits: { fileSize: 100 * 1024 * 1024 },
});

// ----------------------
// 🚀 DOWNLOAD RESUME
// ----------------------
router.get("/download/:slug/resume", async (req, res) => {
  try {
    const { slug } = req.params;

    const portfolio = await Portfolio.findOne({ slug });
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    if (!portfolio.resumePath) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const resumePath = path.resolve(portfolio.resumePath);
    console.log("▶ Sending resume:", resumePath);

    res.download(resumePath, `${portfolio.name}_resume.pdf`, (err) => {
      if (err) {
        console.error("❌ Resume download error:", err);
        return res.status(404).send("Resume file not found");
      }
    });
  } catch (err) {
    console.error("Resume download failed:", err);
    res.status(500).send("Server error");
  }
});

// ----------------------
// UPLOAD ROUTE
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

export default router;
