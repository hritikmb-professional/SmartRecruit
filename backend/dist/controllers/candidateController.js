"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCandidateStatus = exports.getCandidatesByIds = exports.getCandidateById = void 0;
const Candidate_1 = __importDefault(require("../models/Candidate"));
/**
 * GET /api/candidates/:candidateId
 * Used by CandidateDetails page
 */
const getCandidateById = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const candidate = await Candidate_1.default.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }
        return res.json(candidate);
    }
    catch (err) {
        console.error("GET CANDIDATE ERROR:", err);
        return res.status(500).json({
            message: "Failed to fetch candidate",
            error: String(err)
        });
    }
};
exports.getCandidateById = getCandidateById;
/**
 * GET /api/candidates/compare?ids=id1,id2,id3
 * Used by CompareCandidates page
 */
const getCandidatesByIds = async (req, res) => {
    try {
        const idsParam = req.query.ids;
        if (!idsParam) {
            return res.status(400).json({ message: "Candidate ids are required" });
        }
        const ids = idsParam.split(",");
        if (ids.length < 2) {
            return res.status(400).json({
                message: "Select at least 2 candidates to compare"
            });
        }
        const candidates = await Candidate_1.default.find({
            _id: { $in: ids }
        });
        return res.json(candidates);
    }
    catch (err) {
        console.error("COMPARE CANDIDATES ERROR:", err);
        return res.status(500).json({
            message: "Failed to compare candidates",
            error: String(err)
        });
    }
};
exports.getCandidatesByIds = getCandidatesByIds;
const updateCandidateStatus = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const { status } = req.body;
        const allowed = ["applied", "promote_to_oa", "promote_to_hr", "rejected"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        const candidate = await Candidate_1.default.findByIdAndUpdate(candidateId, { status }, { new: true });
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found" });
        }
        res.json(candidate);
    }
    catch (err) {
        console.error("UPDATE CANDIDATE STATUS ERROR:", err);
        const message = err?.name === "CastError"
            ? "Invalid candidate ID"
            : err?.message || "Failed to update status";
        res.status(500).json({ message });
    }
};
exports.updateCandidateStatus = updateCandidateStatus;
