import express from "express";
import cors from "cors";
import path from "path";
import portfolioRoutes from "./routes/portfolioRoutes";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// views
app.set("views", path.join(__dirname));
app.set("view engine", "ejs");

app.use("/api/portfolios", portfolioRoutes);

// root
app.get("/", (req, res) => res.send("Portfolio backend running"));

export default app;
