import { Response } from "express"
import Job from "../models/Job"
import { AuthRequest } from "../middleware/auth"
import Candidate from "../models/Candidate"
import { sendRecruitmentStatusEmail } from "../services/emailservice"


/**
 * Create a new job
 */
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    console.log("📥 CREATE JOB HIT")
    console.log("🧑 USER ID:", req.userId)
    console.log("📦 BODY:", req.body)

    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const job = await Job.create({
      title: req.body.title,
      description: req.body.description,
      createdBy: req.userId
    })

    console.log("✅ JOB SAVED:", job._id)

    return res.status(201).json(job)
  } catch (err) {
    console.error("❌ CREATE JOB ERROR:", err)
    return res.status(500).json({
      message: "Create job failed",
      error: String(err)
    })
  }
}

/**
 * Get jobs created by logged-in recruiter
 */
export const getMyJobs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const jobs = await Job.find({ createdBy: req.userId })
      .sort({ createdAt: -1 })

    return res.status(200).json(jobs)
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch jobs",
      error: String(err)
    })
  }
}

/**
 * Get ranked candidates for a job
 */
export const getRankedCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params

    const candidates = await Candidate.find({ job: jobId })
      .sort({ matchScore: -1 })

    return res.status(200).json(candidates)
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch candidates",
      error: String(err)
    })
  }
}

/**
 * Complete recruitment - send status emails to all candidates
 */
export const completeRecruitment = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params

    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    // Get the job
    const job = await Job.findById(jobId)
    if (!job) {
      return res.status(404).json({ message: "Job not found" })
    }

    // Get all candidates for this job
    const candidates = await Candidate.find({ job: jobId })

    if (candidates.length === 0) {
      return res.status(400).json({ message: "No candidates found for this job" })
    }

    // Send emails to candidates (excluding 'applied' status)
    const emailPromises = candidates
      .filter(c => c.status && c.status !== "applied" && c.email)
      .map(async (candidate) => {
        try {
          await sendRecruitmentStatusEmail(
            candidate.name,
            candidate.email,
            job.title,
            candidate.status
          )
          return { success: true, email: candidate.email, name: candidate.name }
        } catch (err) {
          console.error(`Failed to send email to ${candidate.email}:`, err)
          return { success: false, email: candidate.email, name: candidate.name, error: String(err) }
        }
      })

    const results = await Promise.all(emailPromises)
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return res.status(200).json({
      message: "Recruitment completed",
      totalCandidates: candidates.length,
      emailsSent: successCount,
      emailsFailed: failCount,
      results
    })
  } catch (err) {
    console.error("COMPLETE RECRUITMENT ERROR:", err)
    return res.status(500).json({
      message: "Failed to complete recruitment",
      error: String(err)
    })
  }
}