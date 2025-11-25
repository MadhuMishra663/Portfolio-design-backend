"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/models/portfolio.ts
const mongoose_1 = __importStar(require("mongoose"));
const ProjectSchema = new mongoose_1.Schema({
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    github: { type: String, default: "" },
    live: { type: String, default: "" },
}, { _id: false });
const PortfolioSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    about: { type: String, default: "" },
    email: { type: String, default: "" },
    qualification: { type: String, default: "" },
    profileImageUrl: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    projects: { type: [ProjectSchema], default: [] },
    linkedin: { type: String, default: "" },
    github: { type: mongoose_1.Schema.Types.Mixed, default: {} }, // can be object or string
    template: { type: String, default: "template1" },
    slug: { type: String, index: true, unique: true },
    role: { type: String, default: "" },
    quote: { type: String, default: "" },
    footer: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    interests: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    contacts: { type: [String], default: [] },
}, { timestamps: true });
// Prevent model overwrite upon hot reload in dev
const Portfolio = mongoose_1.default.models.Portfolio ||
    mongoose_1.default.model("Portfolio", PortfolioSchema);
exports.default = Portfolio;
