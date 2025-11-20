"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.DB_URL || "mongodb://localhost:27017/portfolio_db";
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log("MongoDB connected");
    app_1.default.listen(PORT, () => console.log(`Server started on port ${PORT}`));
})
    .catch((err) => {
    console.error("MongoDB connection error", err);
});
