import mongoose, { Schema } from "mongoose";

const ContactSchema = new Schema({
  portfolioId: String,
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

export const Contact = mongoose.model("contact", ContactSchema);
