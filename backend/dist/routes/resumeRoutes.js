"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const resumeController_1 = require("../controllers/resumeController");
const router = express_1.default.Router();
// NOTE: Ensure an 'uploads' folder exists in your project root
const upload = (0, multer_1.default)({
    dest: "uploads/"
});
router.post("/:jobId", auth_1.authenticate, // 1. Authenticate FIRST
upload.array("resumes", 10), // 2. Parse files SECOND
resumeController_1.uploadResume);
exports.default = router;
