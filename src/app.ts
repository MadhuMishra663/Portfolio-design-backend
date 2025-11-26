import express from "express";
import cors from "cors";
import path from "path";
import portfolioRoutes from "./routes/portfolioRoutes";
import {
  getPortfolioPage,
  submitContact,
} from "./controllers/portfolioController";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import downloadRoutes from "./routes/downloadRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
// Serve uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", downloadRoutes);
// SET CORRECT VIEWS FOLDER
app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "ejs");
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    // optional: set cache headers in production
    maxAge: "1d",
  })
);

// PUBLIC ROUTE – MUST BE BEFORE /api

app.post("/portfolio/:slug/contact", submitContact);
// API ROUTES
app.use("/api/portfolios", portfolioRoutes);
app.get("/portfolio/:slug/download", (req, res) => {
  const filePath = path.join(__dirname, "uploads", "cv.pdf");
  res.download(filePath, "CV.pdf");
});
app.get("/:slug", getPortfolioPage);

// Root
app.get("/", (req, res) => res.send("Portfolio backend running"));

export default app;
