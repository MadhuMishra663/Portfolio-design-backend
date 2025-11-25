"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.signup = void 0;
const users_1 = __importDefault(require("../models/users"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("[SIGNUP] req.body:", req.body);
        if (!name || !email || !password)
            return res.status(400).json({ error: "All fields are required" });
        const existing = await users_1.default.findOne({ email });
        if (existing)
            return res.status(400).json({ error: "Email already registered" });
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const user = new users_1.default({ name, email, password: hashed });
        await user.save();
        return res.json({ message: "Signup successful" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "Email and password required" });
        const user = await users_1.default.findOne({ email });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match)
            return res.status(400).json({ error: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};
exports.login = login;
