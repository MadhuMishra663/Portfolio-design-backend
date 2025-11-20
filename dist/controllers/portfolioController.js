"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortfolioPage = exports.createPortfolio = void 0;
const portfolio_1 = __importDefault(require("../models/portfolio"));
const slugify_1 = require("../utils/slugify");
const path_1 = __importDefault(require("path"));
const UPLOAD_DIR = path_1.default.join(__dirname, "..", "uploads");
const createPortfolio = async (req, res) => {
    try {
        // fields in body (some can be JSON strings)
        const { name, about, qualification, experience, projects, linkedin, github, template, } = req.body;
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
        return res.render(`templates/${portfolio.template}`, { portfolio });
    }
    catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
};
exports.getPortfolioPage = getPortfolioPage;
