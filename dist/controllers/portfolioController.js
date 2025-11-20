"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContact = exports.getPortfolioPage = exports.createPortfolio = void 0;
const portfolio_1 = __importDefault(require("../models/portfolio"));
const slugify_1 = require("../utils/slugify");
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const contacts_1 = require("../models/contacts");
const UPLOAD_DIR = path_1.default.join(__dirname, "..", "uploads");
const createPortfolio = async (req, res) => {
    try {
        // fields in body (some can be JSON strings)
        const { name, about, email, qualification, experience, projects, linkedin, github, template, } = req.body;
        if (!name)
            return res.status(400).json({ error: "Name is required" });
        // handle profile image
        let profileImageUrl = "";
        if (req.files && req.files.profileImage) {
            const file = req.files.profileImage[0];
            profileImageUrl = `/uploads/${file.filename}`;
        }
        // handle project images: multer uses 'projectImages' array aligned with projects JSON
        let projectsArray = [];
        if (projects) {
            // projects can be sent as JSON string
            projectsArray =
                typeof projects === "string" ? JSON.parse(projects) : projects;
        }
        let resumeUrl = "";
        if (req.files && req.files.resume) {
            const file = req.files.resume[0];
            resumeUrl = `/uploads/${file.filename}`;
        }
        // If images uploaded for projects, attach their urls in order
        if (req.files && req.files.projectImages) {
            const uploaded = req.files.projectImages;
            // Map uploaded to projectsArray by index
            for (let i = 0; i < uploaded.length; i++) {
                const file = uploaded[i];
                if (!projectsArray[i])
                    projectsArray[i] = {};
                projectsArray[i].imageUrl = `/uploads/${file.filename}`;
            }
        }
        const slug = (0, slugify_1.makeSlug)(name);
        const portfolio = new portfolio_1.default({
            name,
            about,
            qualification,
            profileImageUrl,
            experience,
            resumeUrl,
            projects: projectsArray,
            linkedin,
            github,
            template: template || "template1",
            slug,
        });
        await portfolio.save();
        const publicUrl = `${process.env.BASE_URL || "http://localhost:4000"}/${slug}`;
        return res.json({ message: "Portfolio created", slug, publicUrl });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};
exports.createPortfolio = createPortfolio;
const getPortfolioPage = async (req, res) => {
    try {
        const slug = req.params.slug;
        const portfolio = await portfolio_1.default.findOne({ slug }).lean();
        if (!portfolio)
            return res.status(404).send("Portfolio not found");
        // render chosen template (EJS files in src/templates)
        return res.render(portfolio.template, {
            ...portfolio, // flatten object
            resumeUrl: portfolio.resumeUrl || "",
            profileImageUrl: portfolio.profileImageUrl || "",
            role: portfolio.role || "Fullstack Developer",
            quote: portfolio.quote || "I am noting but i can do everything",
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
};
exports.getPortfolioPage = getPortfolioPage;
const submitContact = async (req, res) => {
    try {
        const { slug } = req.params;
        const { name, email, message } = req.body;
        const portfolio = await portfolio_1.default.findOne({ slug });
        if (!portfolio)
            return res.status(404).send("Portfolio not found");
        await contacts_1.Contact.create({
            portfolioId: portfolio._id,
            name,
            email,
            message,
        });
        // email setup
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const emailHTML = `
      <h2>New Portfolio Message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/> ${message}</p>

      <h3>Portfolio Summary</h3>
      <pre>${JSON.stringify(portfolio, null, 2)}</pre>
    `;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: portfolio.email, // VALID NOW
            subject: "New Message From Your Portfolio",
            html: emailHTML,
        });
        res.send("Message sent successfully!");
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Email error");
    }
};
exports.submitContact = submitContact;
