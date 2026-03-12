"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    console.log("🔐 AUTH MIDDLEWARE HIT");
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log("❌ NO AUTH HEADER");
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        console.log("❌ NO TOKEN");
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        console.log("✅ AUTH SUCCESS", req.userId);
        next();
    }
    catch (err) {
        console.log("❌ AUTH FAILED", err);
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.authenticate = authenticate;
