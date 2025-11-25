"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContact = exports.downloadResume = exports.getPortfolioPage = exports.createPortfolio = void 0;
const portfolio_1 = __importDefault(require("../models/portfolio"));
const slugify_1 = require("../utils/slugify");
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const contacts_1 = require("../models/contacts");
const UPLOAD_DIR = path_1.default.join(__dirname, "..", "uploads");
const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
/**
 * Safely parse a field that may be:
 *  - an array already
 *  - a JSON string of an array
 *  - a comma-separated string
 * Returns an array of strings (possibly empty).
 */
function parseStringArrayField(value) {
    if (!value)
        return [];
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
        }
        catch {
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
const createPortfolio = async (req, res) => {
    try {
        console.log("FILES RECEIVED:", req.files);
        console.log("BODY RECEIVED:", req.body);
        const { name, about, email, qualification, experience, projects, linkedin, github, template, interests, skills, contacts, role, quote, footer, logoUrl, } = req.body;
        if (!name)
            return res.status(400).json({ error: "Name is required" });
        // multer-style typing for req.files
        const files = req.files;
        // profile image
        let profileImageUrl = "";
        if (files?.profileImage?.length) {
            profileImageUrl = `/uploads/${files.profileImage[0].filename}`;
        }
        // parse projects - may be stringified JSON or an array already
        let projectsArray = [];
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
                if (!projectsArray[i])
                    projectsArray[i] = {};
                projectsArray[i].imageUrl = `/uploads/${file.filename}`;
            }
        }
        // interests / skills / contacts normalization
        const parsedInterests = parseStringArrayField(interests);
        const parsedSkills = parseStringArrayField(skills);
        const parsedContacts = parseStringArrayField(contacts);
        const slug = (0, slugify_1.makeSlug)(name);
        // build payload
        const payload = {
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
        const portfolio = new portfolio_1.default(payload);
        await portfolio.save();
        const publicUrl = `${BASE}/${slug}`;
        return res.json({ message: "Portfolio created", slug, publicUrl });
    }
    catch (err) {
        console.error("createPortfolio error:", err);
        return res.status(500).json({ error: "Server error" });
    }
};
exports.createPortfolio = createPortfolio;
/**
 * GET /:slug
 * Renders EJS template for the portfolio (template files in src/templates).
 * Ensure you configured `app.set('views', path.join(__dirname, 'templates'))`
 * and `app.set('view engine', 'ejs')` in your app bootstrap.
 */
const getPortfolioPage = async (req, res) => {
    try {
        const slug = req.params.slug;
        const portfolio = (await portfolio_1.default.findOne({ slug }).lean());
        if (!portfolio)
            return res.status(404).send("Portfolio not found");
        // Normalize arrays
        const interests = Array.isArray(portfolio.interests)
            ? portfolio.interests
            : parseStringArrayField(portfolio.interests);
        const skills = Array.isArray(portfolio.skills)
            ? portfolio.skills
            : parseStringArrayField(portfolio.skills);
        const contacts = Array.isArray(portfolio.contacts)
            ? portfolio.contacts
            : parseStringArrayField(portfolio.contacts);
        const githubData = typeof portfolio.github === "object" && portfolio.github !== null
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
            resumeUrl: resumePublicUrl,
            downloadUrl,
            profileImageUrl: portfolio.profileImageUrl || "",
            role: portfolio.role || "Fullstack Developer",
            quote: portfolio.quote || "I am nothing but I can do everything",
            footer: portfolio.footer ?? `© ${new Date().getFullYear()} Portfolio designer`,
            logoUrl: portfolio.logoUrl ?? "",
            github: githubData,
        });
    }
    catch (err) {
        console.error("getPortfolioPage error:", err);
        return res.status(500).send("Server error");
    }
};
exports.getPortfolioPage = getPortfolioPage;
/**
 * Optional: force-download resume route
 * GET /download/:slug/resume
 * This sends the resume file with proper Content-Disposition to force download.
 * Make sure this route is registered after your controllers in your router.
 */
const downloadResume = async (req, res) => {
    try {
        const slug = req.params.slug;
        const portfolio = await portfolio_1.default.findOne({ slug }).lean();
        if (!portfolio || !portfolio.resumeUrl)
            return res.status(404).send("Resume not found");
        // resumeUrl is like "/uploads/<filename>"
        const resumePath = path_1.default.join(__dirname, "..", portfolio.resumeUrl);
        const fileName = `${portfolio.name?.replace(/\s+/g, "_") || "resume"}.pdf`;
        return res.download(resumePath, fileName, (err) => {
            if (err) {
                console.error("downloadResume error:", err);
                // If file not found, send 404
                if (err.code === "ENOENT") {
                    return res.status(404).send("File not found");
                }
                return res.status(500).send("Download error");
            }
        });
    }
    catch (err) {
        console.error("downloadResume error:", err);
        return res.status(500).send("Server error");
    }
};
exports.downloadResume = downloadResume;
/**
 * Contact submit: keep behaviour but with safer email fallback.
 */
const submitContact = async (req, res) => {
    try {
        const { slug } = req.params;
        const { name, email, message } = req.body;
        const portfolioDoc = await portfolio_1.default.findOne({ slug });
        if (!portfolioDoc)
            return res.status(404).send("Portfolio not found");
        await contacts_1.Contact.create({
            portfolioId: portfolioDoc._id,
            name,
            email,
            message,
        });
        const transporter = nodemailer_1.default.createTransport({
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
            to: portfolioDoc.email || process.env.EMAIL_USER,
            subject: "New Message From Your Portfolio",
            html: emailHTML,
        });
        res.send("Message sent successfully!");
    }
    catch (err) {
        console.error("submitContact error:", err);
        res.status(500).send("Email error");
    }
};
exports.submitContact = submitContact;
