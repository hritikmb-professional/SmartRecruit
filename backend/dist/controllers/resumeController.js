"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResume = void 0;
const Candidate_1 = __importDefault(require("../models/Candidate"));
const Job_1 = __importDefault(require("../models/Job"));
const resumeParser_1 = require("../services/resumeParser");
const llmResumeAnalyzer_1 = require("../services/llmResumeAnalyzer");
const uploadResume = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        if (!req.files || !req.files.length) {
            return res.status(400).json({ message: "Resume file is required" });
        }
        const job = await Job_1.default.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        const files = req.files;
        const createdCandidates = [];
        const updatedCandidates = [];
        for (const file of files) {
            const resumeText = await (0, resumeParser_1.parseResume)(file.path, file.mimetype);
            const llmResult = await (0, llmResumeAnalyzer_1.analyzeResumeWithLLM)(resumeText, job.description);
            // matchScore should already be 0-100 from the new scoring system
            const normalizedScore = Math.round(llmResult.matchScore);
            const existingCandidate = llmResult.email
                ? await Candidate_1.default.findOne({
                    job: jobId,
                    email: llmResult.email
                })
                : null;
            if (existingCandidate) {
                existingCandidate.skills = llmResult.skills || [];
                existingCandidate.matchedSkills = llmResult.matchedSkills || [];
                existingCandidate.missingSkills = llmResult.missingSkills || [];
                existingCandidate.summary = llmResult.summary || "";
                existingCandidate.experience = llmResult.experience || "";
                existingCandidate.education = llmResult.education || [];
                existingCandidate.matchScore = normalizedScore;
                existingCandidate.scoreBreakdown = llmResult.scoreBreakdown || {
                    skillsMatch: 0,
                    experienceRelevance: 0,
                    educationMatch: 0,
                    projectRelevance: 0,
                    overallExperience: 0
                };
                existingCandidate.githubVerification = llmResult.githubVerification;
                existingCandidate.resumeText = resumeText;
                existingCandidate.resumePath = file.path;
                await existingCandidate.save();
                updatedCandidates.push(existingCandidate);
                continue;
            }
            const candidate = await Candidate_1.default.create({
                name: llmResult.name || "Unknown",
                email: llmResult.email || "",
                phone: llmResult.phone || "",
                skills: llmResult.skills || [],
                matchedSkills: llmResult.matchedSkills || [],
                missingSkills: llmResult.missingSkills || [],
                summary: llmResult.summary || "",
                experience: llmResult.experience || "",
                education: llmResult.education || [],
                resumeText,
                resumePath: file.path,
                matchScore: normalizedScore,
                scoreBreakdown: llmResult.scoreBreakdown || {
                    skillsMatch: 0,
                    experienceRelevance: 0,
                    educationMatch: 0,
                    projectRelevance: 0,
                    overallExperience: 0
                },
                githubVerification: llmResult.githubVerification,
                job: jobId
            });
            createdCandidates.push(candidate);
        }
        return res.status(201).json({
            message: "Resume processing completed",
            created: createdCandidates.length,
            updated: updatedCandidates.length
        });
    }
    catch (err) {
        console.error("UPLOAD RESUME ERROR:", err);
        return res.status(500).json({
            message: "Failed to upload resume",
            error: String(err)
        });
    }
};
exports.uploadResume = uploadResume;
