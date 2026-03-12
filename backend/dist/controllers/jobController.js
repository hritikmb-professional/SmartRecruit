"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeRecruitment = exports.getRankedCandidates = exports.getMyJobs = exports.createJob = void 0;
const Job_1 = __importDefault(require("../models/Job"));
const Candidate_1 = __importDefault(require("../models/Candidate"));
const emailservice_1 = require("../services/emailservice");
/**
 * Create a new job
 */
const createJob = async (req, res) => {
    try {
        console.log("📥 CREATE JOB HIT");
        console.log("🧑 USER ID:", req.userId);
        console.log("📦 BODY:", req.body);
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const job = await Job_1.default.create({
            title: req.body.title,
            description: req.body.description,
            createdBy: req.userId
        });
        console.log("✅ JOB SAVED:", job._id);
        return res.status(201).json(job);
    }
    catch (err) {
        console.error("❌ CREATE JOB ERROR:", err);
        return res.status(500).json({
            message: "Create job failed",
            error: String(err)
        });
    }
};
exports.createJob = createJob;
/**
 * Get jobs created by logged-in recruiter
 */
const getMyJobs = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const jobs = await Job_1.default.find({ createdBy: req.userId })
            .sort({ createdAt: -1 });
        return res.status(200).json(jobs);
    }
    catch (err) {
        return res.status(500).json({
            message: "Failed to fetch jobs",
            error: String(err)
        });
    }
};
exports.getMyJobs = getMyJobs;
/**
 * Get ranked candidates for a job
 */
const getRankedCandidates = async (req, res) => {
    try {
        const { jobId } = req.params;
        const candidates = await Candidate_1.default.find({ job: jobId })
            .sort({ matchScore: -1 });
        return res.status(200).json(candidates);
    }
    catch (err) {
        return res.status(500).json({
            message: "Failed to fetch candidates",
            error: String(err)
        });
    }
};
exports.getRankedCandidates = getRankedCandidates;
/**
 * Complete recruitment - send status emails to all candidates
 */
const completeRecruitment = async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Get the job
        const job = await Job_1.default.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        // Get all candidates for this job
        const candidates = await Candidate_1.default.find({ job: jobId });
        if (candidates.length === 0) {
            return res.status(400).json({ message: "No candidates found for this job" });
        }
        // Send emails to candidates (excluding 'applied' status)
        const emailPromises = candidates
            .filter(c => c.status && c.status !== "applied" && c.email)
            .map(async (candidate) => {
            try {
                await (0, emailservice_1.sendRecruitmentStatusEmail)(candidate.name, candidate.email, job.title, candidate.status);
                return { success: true, email: candidate.email, name: candidate.name };
            }
            catch (err) {
                console.error(`Failed to send email to ${candidate.email}:`, err);
                return { success: false, email: candidate.email, name: candidate.name, error: String(err) };
            }
        });
        const results = await Promise.all(emailPromises);
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        return res.status(200).json({
            message: "Recruitment completed",
            totalCandidates: candidates.length,
            emailsSent: successCount,
            emailsFailed: failCount,
            results
        });
    }
    catch (err) {
        console.error("COMPLETE RECRUITMENT ERROR:", err);
        return res.status(500).json({
            message: "Failed to complete recruitment",
            error: String(err)
        });
    }
};
exports.completeRecruitment = completeRecruitment;
