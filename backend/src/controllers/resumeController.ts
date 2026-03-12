import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import Candidate from "../models/Candidate"
import Job from "../models/Job"
import { parseResume } from "../services/resumeParser"
import { analyzeResumeWithLLM } from "../services/llmResumeAnalyzer"

export const uploadResume = async (req: AuthRequest, res: Response) => {
  try {
    const jobId = req.params.jobId

    if (!req.files || !(req.files as Express.Multer.File[]).length) {
      return res.status(400).json({ message: "Resume file is required" })
    }

    const job = await Job.findById(jobId)
    if (!job) {
      return res.status(404).json({ message: "Job not found" })
    }

    const files = req.files as Express.Multer.File[]
    const createdCandidates = []
    const updatedCandidates = []

    for (const file of files) {
      const resumeText = await parseResume(file.path, file.mimetype)

      const llmResult = await analyzeResumeWithLLM(
        resumeText,
        job.description
      )

      // matchScore should already be 0-100 from the new scoring system
      const normalizedScore = Math.round(llmResult.matchScore)

      const existingCandidate = llmResult.email
        ? await Candidate.findOne({
            job: jobId,
            email: llmResult.email
          })
        : null

      if (existingCandidate) {
        existingCandidate.skills = llmResult.skills || []
        existingCandidate.matchedSkills = llmResult.matchedSkills || []
        existingCandidate.missingSkills = llmResult.missingSkills || []
        existingCandidate.summary = llmResult.summary || ""
        existingCandidate.experience = llmResult.experience || ""
        existingCandidate.education = llmResult.education || []
        existingCandidate.matchScore = normalizedScore
        existingCandidate.scoreBreakdown = llmResult.scoreBreakdown || {
          skillsMatch: 0,
          experienceRelevance: 0,
          educationMatch: 0,
          projectRelevance: 0,
          overallExperience: 0
        }
        existingCandidate.githubVerification = llmResult.githubVerification
        existingCandidate.resumeText = resumeText
        existingCandidate.resumePath = file.path

        await existingCandidate.save()
        updatedCandidates.push(existingCandidate)
        continue
      }

      const candidate = await Candidate.create({
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
      })

      createdCandidates.push(candidate)
    }

    return res.status(201).json({
      message: "Resume processing completed",
      created: createdCandidates.length,
      updated: updatedCandidates.length
    })
  } catch (err) {
    console.error("UPLOAD RESUME ERROR:", err)
    return res.status(500).json({
      message: "Failed to upload resume",
      error: String(err)
    })
  }
}