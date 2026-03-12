"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jobController_1 = require("../controllers/jobController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Create a job
router.post("/", auth_1.authenticate, jobController_1.createJob);
// Get jobs created by logged-in recruiter
router.get("/", auth_1.authenticate, jobController_1.getMyJobs);
// Get ranked candidates for a job
router.get("/:jobId/candidates", auth_1.authenticate, jobController_1.getRankedCandidates);
// Complete recruitment - send status emails to all candidates
router.post("/:jobId/complete", auth_1.authenticate, jobController_1.completeRecruitment);
exports.default = router;
