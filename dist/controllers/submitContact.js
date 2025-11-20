"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContact = void 0;
const contacts_1 = require("../models/contacts");
const portfolio_1 = __importDefault(require("../models/portfolio"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const submitContact = async (req, res) => {
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
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    const emailHTML = `
    <h2>New Message From Portfolio Visitor</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>

    <hr />

    <h3>Portfolio Summary</h3>
    <pre>${JSON.stringify(portfolio, null, 2)}</pre>
  `;
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: portfolio.email, // send to portfolio owner
        subject: "New Portfolio Message",
        html: emailHTML,
    });
    res.send("Message sent successfully!");
};
exports.submitContact = submitContact;
