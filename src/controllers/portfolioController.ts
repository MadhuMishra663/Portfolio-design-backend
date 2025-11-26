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
    console.log("FILES KEYS:", Object.keys(req.files || {}));
    console.log(
      "PROFILE IMAGE FILE:",
      util.inspect((req.files as any)?.profileImage?.[0], { depth: 2 })
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

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;

    // -----------------------------
    // PROFILE IMAGE
    // -----------------------------
    let profileImageUrl = "";
    if (files?.profileImage?.length) {
      profileImageUrl = `/uploads/${files.profileImage[0].filename}`;
    }

    // -----------------------------
    // PARSE PROJECTS
    // -----------------------------
    let projectsArray: IProject[] = [];
    if (projects) {
      projectsArray =
        typeof projects === "string" ? JSON.parse(projects) : projects;
    }

    // -----------------------------
    // RESUME FILE
    // -----------------------------
    // resume
    let resumeUrl = "";
    let resumePath = "";

    if (files?.resume?.length) {
      const file = files.resume[0];

      resumeUrl = `/uploads/${file.filename}`;
      resumePath = path.join(process.cwd(), "uploads", file.filename);
    }

    // -----------------------------
    // PROJECT IMAGES
    // -----------------------------
    if (files?.projectImages?.length) {
      const uploaded = files.projectImages;
      for (let i = 0; i < uploaded.length; i++) {
        if (!projectsArray[i]) projectsArray[i] = {} as IProject;

        projectsArray[i].imageUrl = `/uploads/${uploaded[i].filename}`;
      }
    }

    // -----------------------------
    // NORMALIZE ARRAYS
    // -----------------------------
    const parsedInterests = parseStringArrayField(interests);
    const parsedSkills = parseStringArrayField(skills);
    const parsedContacts = parseStringArrayField(contacts);

    const slug = makeSlug(name);

    // -----------------------------
    // BUILD PAYLOAD (NOW WITH resumePath)
    // -----------------------------
    const payload: Partial<IPortfolio> = {
      name,
      about,
      email,
      qualification,
      profileImageUrl,

      resumeUrl,
      resumePath,

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
// export const getPortfolioPage = async (req: Request, res: Response) => {
//   try {
//     const slug = req.params.slug;
//     const portfolio = (await Portfolio.findOne({ slug }).lean()) as
//       | (IPortfolio & { createdAt?: Date; updatedAt?: Date })
//       | null;

//     if (!portfolio) return res.status(404).send("Portfolio not found");

//     // Normalize arrays
//     const interests = Array.isArray(portfolio.interests)
//       ? portfolio.interests
//       : parseStringArrayField((portfolio as any).interests);
//     const skills = Array.isArray(portfolio.skills)
//       ? portfolio.skills
//       : parseStringArrayField((portfolio as any).skills);
//     const contacts = Array.isArray(portfolio.contacts)
//       ? portfolio.contacts
//       : parseStringArrayField((portfolio as any).contacts);

//     const githubData =
//       typeof portfolio.github === "object" && portfolio.github !== null
//         ? portfolio.github
//         : { heatmap: "", streak: "", langs: "" };

//     // build absolute resume URL for template (or empty string)
//     const resumePublicUrl = portfolio.resumeUrl
//       ? `${BASE}${portfolio.resumeUrl}`
//       : "";
//     const downloadUrl = `${BASE}/api/portfolios/download/${slug}/resume`;

//     return res.render(portfolio.template ?? "template1", {
//       ...portfolio,
//       interests,
//       skills,
//       contacts,
//       resumeUrl: portfolio.resumeUrl ? `${BASE}${portfolio.resumeUrl}` : "",
//       downloadUrl,
//       profileImageUrl: portfolio.profileImageUrl || "",
//       role: portfolio.role || "Fullstack Developer",
//       quote: portfolio.quote || "I am nothing but I can do everything",
//       footer:
//         portfolio.footer ?? `© ${new Date().getFullYear()} Portfolio designer`,
//       logoUrl: portfolio.logoUrl ?? "",
//       github: githubData,
//     });
//   } catch (err) {
//     console.error("getPortfolioPage error:", err);
//     return res.status(500).send("Server error");
//   }
// };

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

    // Build absolute public URLs for files (if present)
    const resumePublicUrl = portfolio.resumeUrl
      ? `${BASE}${portfolio.resumeUrl}`
      : "";
    const profilePublicUrl = portfolio.profileImageUrl
      ? `${BASE}${portfolio.profileImageUrl}`
      : "";

    // Ensure projects have full URLs for imageUrl (and keep other fields)
    const projectsWithUrls = (portfolio.projects || []).map((proj: any) => ({
      ...proj,
      imageUrl: proj.imageUrl ? `${BASE}${proj.imageUrl}` : "",
    }));

    const downloadUrl = `${BASE}/api/portfolios/download/${slug}/resume`;

    return res.render(portfolio.template ?? "template1", {
      ...portfolio,
      interests,
      skills,
      contacts,
      resumeUrl: resumePublicUrl,
      downloadUrl,
      profileImageUrl: profilePublicUrl,
      projects: projectsWithUrls,
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
// safer downloadResume - use resumePath if present
export const downloadResume = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const portfolio = await Portfolio.findOne({ slug }).lean();
    if (!portfolio || !portfolio.resumeUrl)
      return res.status(404).send("Resume not found");

    // Prefer resumePath if stored (absolute path pointing to file on disk)
    let resumePath = (portfolio as any).resumePath as string | undefined;

    if (resumePath) {
      // Ensure it's absolute
      resumePath = path.resolve(resumePath);
    } else {
      // Fallback — build path relative to project root
      resumePath = path.join(
        process.cwd(),
        portfolio.resumeUrl.replace(/^\//, "")
      );
    }

    const fileName = `${(portfolio.name || "resume").replace(/\s+/g, "_")}.pdf`;

    return res.download(resumePath, fileName, (err) => {
      if (err) {
        console.error("downloadResume error:", err);
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

    // 1. Find portfolio owner
    const portfolioDoc = await Portfolio.findOne({ slug }).lean();
    if (!portfolioDoc) return res.status(404).send("Portfolio not found");

    // 2. Save message in DB
    await Contact.create({
      portfolioId: portfolioDoc._id,
      name,
      email,
      message,
    });

    // 3. Owner email (the login person's email)
    const ownerEmail = portfolioDoc.email;
    if (!ownerEmail) {
      return res.status(500).send("Portfolio owner email not found.");
    }

    // 4. Email sender config
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 5. Email content
    const emailHTML = `
      <h2>New Portfolio Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `;

    // 6. Send email to portfolio owner
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: ownerEmail, // **THIS IS THE IMPORTANT PART**
      subject: "New Message From Your Portfolio",
      html: emailHTML,
    });

    return res.send("Message sent successfully!");
  } catch (err) {
    console.error("submitContact error:", err);
    return res.status(500).send("Email error");
  }
};
