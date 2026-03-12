import express from "express"
import {
  createJob,
  getMyJobs,
  getRankedCandidates,
  completeRecruitment
} from "../controllers/jobController"
import { authenticate } from "../middleware/auth"

const router = express.Router()

// Create a job
router.post("/", authenticate, createJob)

// Get jobs created by logged-in recruiter
router.get("/", authenticate, getMyJobs)

// Get ranked candidates for a job
router.get("/:jobId/candidates", authenticate, getRankedCandidates)

// Complete recruitment - send status emails to all candidates
router.post("/:jobId/complete", authenticate, completeRecruitment)

export default router