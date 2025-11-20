import mongoose, { Schema } from "mongoose";

const ProjectSchema = new Schema({
  title: String,
  description: String,
  imageUrl: String,
});

const PortfolioSchema = new Schema({
  name: { type: String, required: true },
  about: String,
  qualification: String,
  profileImageUrl: String,
  experience: String,
  projects: [ProjectSchema],
  linkedin: String,
  github: String,
  template: { type: String, default: "template1" },
  slug: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("portfolio", PortfolioSchema);
