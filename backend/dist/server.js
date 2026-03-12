"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("🔥 THIS server.ts FILE IS RUNNING");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jobRoutes_1 = __importDefault(require("./routes/jobRoutes"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const candidateRoutes_1 = __importDefault(require("./routes/candidateRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const interviewRoutes_1 = __importDefault(require("./routes/interviewRoutes"));
const interviewReminder_1 = require("./services/interviewReminder");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "..", "uploads")));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static("uploads"));
app.use("/api/candidates", candidateRoutes_1.default);
app.get("/debug", (_req, res) => {
    res.json({ message: "direct route works" });
});
// 🔴 THIS MUST BE HERE (BEFORE ANY ROUTES)
app.use("/api/auth", authRoutes_1.default);
app.use("/api/jobs", jobRoutes_1.default);
app.use("/api/resumes", resumeRoutes_1.default);
app.use("/api/interviews", interviewRoutes_1.default);
// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "OK", message: "SmartRecruit backend running" });
});
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => {
    console.log("MongoDB connected");
    (0, interviewReminder_1.initInterviewReminders)();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error("MongoDB connection failed", err);
    process.exit(1);
});
app.use((err, _req, res, _next) => {
    console.error("GLOBAL ERROR HANDLER:", err);
    res.status(500).json({
        message: err.message || "Internal Server Error"
    });
});
