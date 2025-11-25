"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const portfolioController_1 = require("../controllers/portfolioController");
const router = (0, express_1.Router)();
// ----------------------
// FIX 1 — Correct upload directory
// Save inside PROJECT ROOT → "/uploads"
const uploadDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir);
// ----------------------
// Multer storage
// ----------------------
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
});
const upload = (0, multer_1.default)({ storage });
router.get("/download/:slug/resume", portfolioController_1.downloadResume);
// ----------------------
// Routes
// ----------------------
router.post("/", upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "projectImages", maxCount: 20 },
]), portfolioController_1.createPortfolio);
// router.get("/:slug", getPortfolioPage);
exports.default = router;
