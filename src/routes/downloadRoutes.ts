import express from "express";
import path from "path";
import Portfolio from "../models/portfolio";

const router = express.Router();

router.get("/download/:slug/resume", async (req, res) => {
  try {
    const { slug } = req.params;

    const portfolio = await Portfolio.findOne({ slug }).lean();
    if (!portfolio) {
      return res.status(404).send("Portfolio not found");
    }

    if (!portfolio.resumeUrl) {
      return res.status(404).send("Resume not found");
    }

    // resumeUrl should look like "/uploads/17323623-resume.pdf"
    const resumePath = path.join(__dirname, "..", "..", portfolio.resumeUrl);
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      portfolio.resumeUrl.replace(/^\//, "")
    );

    return res.download(filePath);
  } catch (err) {
    console.error("Resume download error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
