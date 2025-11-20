"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const portfolioRoutes_1 = __importDefault(require("./routes/portfolioRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// serve uploads
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "uploads")));
// views
app.set("views", path_1.default.join(__dirname));
app.set("view engine", "ejs");
app.use("/api/portfolios", portfolioRoutes_1.default);
// root
app.get("/", (req, res) => res.send("Portfolio backend running"));
exports.default = app;
