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
    const resumeUrl = portfolio.resumeUrl; // e.g. "/uploads/1234-resume.pdf"
    if (!resumeUrl) return res.status(404).send("Resume not found");
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
    const filename = path.basename(resumeUrl); // "1234-resume.pdf"
    const resumePath = path.join(
      __dirname,
      "..",
      portfolio.resumeUrl.replace(/^\//, "")
    );

    return res.download(resumePath, `${portfolio.name}_resume.pdf`, (err) => {
      if (err) {
        console.error("downloadResume error:", err);
        return res.status(404).send("File not found");
      }
    });
  } catch (err) {
    console.error("Resume download error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
