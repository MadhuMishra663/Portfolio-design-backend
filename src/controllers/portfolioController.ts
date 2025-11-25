// src/controllers/portfolioController.ts
import { Request, Response } from "express";
import Portfolio, { IPortfolio, IProject } from "../models/portfolio";
import { makeSlug } from "../utils/slugify";
import path from "path";
import nodemailer from "nodemailer";
import { Contact } from "../models/contacts";
import util from "util";

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const BASE =
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

/**
 * Safely parse a field that may be:
 *  - an array already
 *  - a JSON string of an array
 *  - a comma-separated string
 * Returns an array of strings (possibly empty).
 */
function parseStringArrayField(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v : String(v)))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed))
        return parsed.map((v) => String(v)).filter(Boolean);
    } catch {
      // not JSON — fall back to CSV
    }
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(value)];
}

/**
 * POST /api/portfolios
 * Expects multipart/form-data with fields and optional files:
 *  - profileImage (single)
 *  - resume (single)
 *  - projectImages (multiple)
 *
 * NOTE: ensure your route uses multer upload.fields([...]) with 'resume' included.
 */
export const createPortfolio = async (req: Request, res: Response) => {
  try {
    console.log(
      "FILES RECEIVED:",
      util.inspect(req.files, { depth: 4, colors: true })
    );

    const {
      name,
      about,
      email,
      qualification,
      experience,
      projects,
      linkedin,
      github,
      template,
      interests,
      skills,
      contacts,
      role,
      quote,
      footer,
      logoUrl,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    // multer-style typing for req.files
    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;

    // profile image
    let profileImageUrl = "";
    if (files?.profileImage?.length) {
      profileImageUrl = `/uploads/${files.profileImage[0].filename}`;
    }

    // parse projects - may be stringified JSON or an array already
    let projectsArray: IProject[] = [];
    if (projects) {
      projectsArray =
        typeof projects === "string" ? JSON.parse(projects) : projects;
    }

    // resume
    let resumeUrl = "";
    if (files && files.resume && files.resume.length > 0) {
      resumeUrl = `/uploads/${files.resume[0].filename}`;
    }

    // attach uploaded project images (map by index)
    if (files?.projectImages?.length) {
      const uploaded = files.projectImages;
      for (let i = 0; i < uploaded.length; i++) {
        const file = uploaded[i];
        if (!projectsArray[i]) projectsArray[i] = {} as IProject;
        projectsArray[i].imageUrl = `/uploads/${file.filename}`;
      }
    }

    // interests / skills / contacts normalization
    const parsedInterests = parseStringArrayField(interests);
    const parsedSkills = parseStringArrayField(skills);
    const parsedContacts = parseStringArrayField(contacts);

    const slug = makeSlug(name);

    // build payload
    const payload: Partial<IPortfolio> = {
      name,
      about,
      email,
      qualification,
      profileImageUrl,
      resumeUrl,
      projects: projectsArray,
      linkedin,
      github,
      template: template || "template1",
      slug,
      role: role ?? "",
      quote: quote ?? "",
      footer: footer ?? "",
      logoUrl: logoUrl ?? "",
      interests: parsedInterests,
      skills: parsedSkills,
      contacts: parsedContacts,
    };

    const portfolio = new Portfolio(payload);
    await portfolio.save();

    const publicUrl = `${BASE}/${slug}`;
    return res.json({ message: "Portfolio created", slug, publicUrl });
  } catch (err) {
    console.error("createPortfolio error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /:slug
 * Renders EJS template for the portfolio (template files in src/templates).
 * Ensure you configured `app.set('views', path.join(__dirname, 'templates'))`
 * and `app.set('view engine', 'ejs')` in your app bootstrap.
 */
export const getPortfolioPage = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const portfolio = (await Portfolio.findOne({ slug }).lean()) as
      | (IPortfolio & { createdAt?: Date; updatedAt?: Date })
      | null;

    if (!portfolio) return res.status(404).send("Portfolio not found");

    // Normalize arrays
    const interests = Array.isArray(portfolio.interests)
      ? portfolio.interests
      : parseStringArrayField((portfolio as any).interests);
    const skills = Array.isArray(portfolio.skills)
      ? portfolio.skills
      : parseStringArrayField((portfolio as any).skills);
    const contacts = Array.isArray(portfolio.contacts)
      ? portfolio.contacts
      : parseStringArrayField((portfolio as any).contacts);

    const githubData =
      typeof portfolio.github === "object" && portfolio.github !== null
        ? portfolio.github
        : { heatmap: "", streak: "", langs: "" };

    // build absolute resume URL for template (or empty string)
    const resumePublicUrl = portfolio.resumeUrl
      ? `${BASE}${portfolio.resumeUrl}`
      : "";
    const downloadUrl = `${BASE}/api/portfolios/download/${slug}/resume`;

    return res.render(portfolio.template ?? "template1", {
      ...portfolio,
      interests,
      skills,
      contacts,
      resumeUrl: portfolio.resumeUrl ? `${BASE}${portfolio.resumeUrl}` : "",
      downloadUrl,
      profileImageUrl: portfolio.profileImageUrl || "",
      role: portfolio.role || "Fullstack Developer",
      quote: portfolio.quote || "I am nothing but I can do everything",
      footer:
        portfolio.footer ?? `© ${new Date().getFullYear()} Portfolio designer`,
      logoUrl: portfolio.logoUrl ?? "",
      github: githubData,
    });
  } catch (err) {
    console.error("getPortfolioPage error:", err);
    return res.status(500).send("Server error");
  }
};

/**
 * Optional: force-download resume route
 * GET /download/:slug/resume
 * This sends the resume file with proper Content-Disposition to force download.
 * Make sure this route is registered after your controllers in your router.
 */
export const downloadResume = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const portfolio = await Portfolio.findOne({ slug }).lean();
    if (!portfolio || !portfolio.resumeUrl)
      return res.status(404).send("Resume not found");

    // resumeUrl is like "/uploads/<filename>"
    const resumePath = path.join(__dirname, "..", portfolio.resumeUrl);
    const fileName = `${portfolio.name?.replace(/\s+/g, "_") || "resume"}.pdf`;

    return res.download(resumePath, fileName, (err) => {
      if (err) {
        console.error("downloadResume error:", err);
        // If file not found, send 404
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          return res.status(404).send("File not found");
        }
        return res.status(500).send("Download error");
      }
    });
  } catch (err) {
    console.error("downloadResume error:", err);
    return res.status(500).send("Server error");
  }
};

/**
 * Contact submit: keep behaviour but with safer email fallback.
 */
export const submitContact = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { name, email, message } = req.body;

    const portfolioDoc = await Portfolio.findOne({ slug });
    if (!portfolioDoc) return res.status(404).send("Portfolio not found");

    await Contact.create({
      portfolioId: portfolioDoc._id,
      name,
      email,
      message,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const emailHTML = `
      <h2>New Portfolio Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/> ${message}</p>

      <h3>Portfolio Summary</h3>
      <pre>${JSON.stringify(portfolioDoc, null, 2)}</pre>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: (portfolioDoc as any).email || process.env.EMAIL_USER,
      subject: "New Message From Your Portfolio",
      html: emailHTML,
    });

    res.send("Message sent successfully!");
  } catch (err) {
    console.error("submitContact error:", err);
    res.status(500).send("Email error");
  }
};
