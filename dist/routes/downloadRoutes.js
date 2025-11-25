"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const portfolio_1 = __importDefault(require("../models/portfolio"));
const router = express_1.default.Router();
router.get("/download/:slug/resume", async (req, res) => {
    try {
        const { slug } = req.params;
        const portfolio = await portfolio_1.default.findOne({ slug }).lean();
        if (!portfolio) {
            return res.status(404).send("Portfolio not found");
        }
        const resumeUrl = portfolio.resumeUrl; // e.g. "/uploads/1234-resume.pdf"
        if (!resumeUrl)
            return res.status(404).send("Resume not found");
        if (!portfolio.resumeUrl) {
            return res.status(404).send("Resume not found");
        }
        // resumeUrl should look like "/uploads/17323623-resume.pdf"
        // const resumePath = path.join(__dirname, "..", "..", portfolio.resumeUrl);
        // const filePath = path.join(
        //   __dirname,
        //   "..",
        //   "..",
        //   portfolio.resumeUrl.replace(/^\//, "")
        // );
        const filename = path_1.default.basename(resumeUrl); // "1234-resume.pdf"
        const resumePath = path_1.default.join(process.cwd(), "uploads", filename);
        return res.download(resumePath, `${portfolio.name?.replace(/\s+/g, "_") || "resume"}.pdf`, (err) => {
            if (err) {
                if (err.code === "ENOENT")
                    return res.status(404).send("File not found");
                return res.status(500).send("Download error");
            }
        });
    }
    catch (err) {
        console.error("Resume download error:", err);
        res.status(500).send("Server error");
    }
});
exports.default = router;
