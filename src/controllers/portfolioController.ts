import { Request, Response } from "express";
import Portfolio from "../models/portfolio";
import { makeSlug } from "../utils/slugify";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

export const createPortfolio = async (req: Request, res: Response) => {
  try {
    // fields in body (some can be JSON strings)
    const {
      name,
      about,
      qualification,
      experience,
      projects,
      linkedin,
      github,
      template,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    // handle profile image
    let profileImageUrl = "";
    if (req.files && (req.files as any).profileImage) {
      const file = (req.files as any).profileImage[0];
      profileImageUrl = `/uploads/${file.filename}`;
    }

    // handle project images: multer uses 'projectImages' array aligned with projects JSON
    let projectsArray = [];
    if (projects) {
      // projects can be sent as JSON string
      projectsArray =
        typeof projects === "string" ? JSON.parse(projects) : projects;
    }

    // If images uploaded for projects, attach their urls in order
    if (req.files && (req.files as any).projectImages) {
      const uploaded = (req.files as any).projectImages;
      // Map uploaded to projectsArray by index
      for (let i = 0; i < uploaded.length; i++) {
        const file = uploaded[i];
        if (!projectsArray[i]) projectsArray[i] = {};
        projectsArray[i].imageUrl = `/uploads/${file.filename}`;
      }
    }

    const slug = makeSlug(name);
    const portfolio = new Portfolio({
      name,
      about,
      qualification,
      profileImageUrl,
      experience,
      projects: projectsArray,
      linkedin,
      github,
      template: template || "template1",
      slug,
    });

    await portfolio.save();
    const publicUrl = `${
      process.env.BASE_URL || "http://localhost:4000"
    }/${slug}`;
    return res.json({ message: "Portfolio created", slug, publicUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getPortfolioPage = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const portfolio = await Portfolio.findOne({ slug }).lean();
    if (!portfolio) return res.status(404).send("Portfolio not found");

    // render chosen template (EJS files in src/templates)
    return res.render(`templates/${portfolio.template}`, { portfolio });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
};
