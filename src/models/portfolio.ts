// src/models/portfolio.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IProject {
  title?: string;
  description?: string;
  imageUrl?: string;
  github?: string;
  live?: string;
}

export interface IPortfolio extends Document {
  name: string;
  about?: string;
  email?: string;
  qualification?: string;
  profileImageUrl?: string;
  resumeUrl?: string;
  resumePath?: string;
  projects: IProject[];
  linkedin?: string;
  github?:
    | {
        heatmap?: string;
        streak?: string;
        langs?: string;
      }
    | string;
  template?: string;
  slug?: string;
  role?: string;
  quote?: string;
  footer?: string;
  logoUrl?: string;
  interests: string[];
  skills: string[];
  contacts: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    github: { type: String, default: "" },
    live: { type: String, default: "" },
  },
  { _id: false }
);

const PortfolioSchema = new Schema<IPortfolio>(
  {
    name: { type: String, required: true },
    about: { type: String, default: "" },
    email: { type: String, default: "" },
    qualification: { type: String, default: "" },
    profileImageUrl: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    resumePath: { type: String, default: "" },
    projects: { type: [ProjectSchema], default: [] },
    linkedin: { type: String, default: "" },
    github: { type: Schema.Types.Mixed, default: {} }, // can be object or string
    template: { type: String, default: "template1" },
    slug: { type: String, index: true, unique: true },
    role: { type: String, default: "" },
    quote: { type: String, default: "" },
    footer: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    interests: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    contacts: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Prevent model overwrite upon hot reload in dev
const Portfolio =
  (mongoose.models.Portfolio as mongoose.Model<IPortfolio>) ||
  mongoose.model<IPortfolio>("Portfolio", PortfolioSchema);

export default Portfolio;
