"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const portfolioController_1 = require("../controllers/portfolioController");
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const uploadDir = path_1.default.join(__dirname, "..", "uploads");
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir);
// configure multer
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
});
const upload = (0, multer_1.default)({ storage });
/**
 * Expected multipart/form-data:
 * - profileImage: single
 * - projectImages: multiple (order should match projects array)
 * - fields: name, about, qualification, experience, projects (JSON string), linkedin, github, template
 */
router.post("/", upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "projectImages", maxCount: 10 },
]), portfolioController_1.createPortfolio);
// public portfolio page
// router.get("/:slug", getPortfolioPage);
exports.default = router;
