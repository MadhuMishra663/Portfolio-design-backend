"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const portfolioRoutes_1 = __importDefault(require("./routes/portfolioRoutes"));
const portfolioController_1 = require("./controllers/portfolioController");
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const downloadRoutes_1 = __importDefault(require("./routes/downloadRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes_1.default);
// Serve uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", downloadRoutes_1.default);
// SET CORRECT VIEWS FOLDER
app.set("views", path_1.default.join(__dirname, "templates"));
app.set("view engine", "ejs");
// PUBLIC ROUTE – MUST BE BEFORE /api
app.get("/:slug", portfolioController_1.getPortfolioPage);
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.post("/portfolio/:slug/contact", portfolioController_1.submitContact);
// API ROUTES
app.use("/api/portfolios", portfolioRoutes_1.default);
// Root
app.get("/", (req, res) => res.send("Portfolio backend running"));
exports.default = app;
