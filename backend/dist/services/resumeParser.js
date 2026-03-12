"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = void 0;
const fs_1 = __importDefault(require("fs"));
const mammoth_1 = __importDefault(require("mammoth"));
// pdf-parse stable CommonJS usage
const pdfParse = require("pdf-parse");
const parseResume = async (filePath, mimeType) => {
    const buffer = fs_1.default.readFileSync(filePath);
    if (mimeType === "application/pdf") {
        const data = await pdfParse(buffer);
        return data.text;
    }
    if (mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth_1.default.extractRawText({ buffer });
        return result.value;
    }
    throw new Error("Unsupported file format");
};
exports.parseResume = parseResume;
