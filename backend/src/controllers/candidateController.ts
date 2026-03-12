import { Request, Response } from "express"
import Candidate from "../models/Candidate"

/**
 * GET /api/candidates/:candidateId
 * Used by CandidateDetails page
 */
export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params

    const candidate = await Candidate.findById(candidateId)

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" })
    }

    return res.json(candidate)
  } catch (err) {
    console.error("GET CANDIDATE ERROR:", err)
    return res.status(500).json({
      message: "Failed to fetch candidate",
      error: String(err)
    })
  }
}


/**
 * GET /api/candidates/compare?ids=id1,id2,id3
 * Used by CompareCandidates page
 */
export const getCandidatesByIds = async (req: Request, res: Response) => {
  try {
    const idsParam = req.query.ids as string

    if (!idsParam) {
      return res.status(400).json({ message: "Candidate ids are required" })
    }

    const ids = idsParam.split(",")

    if (ids.length < 2) {
      return res.status(400).json({
        message: "Select at least 2 candidates to compare"
      })
    }

    const candidates = await Candidate.find({
      _id: { $in: ids }
    })

    return res.json(candidates)
  } catch (err) {
    console.error("COMPARE CANDIDATES ERROR:", err)
    return res.status(500).json({
      message: "Failed to compare candidates",
      error: String(err)
    })
  }
}


export const updateCandidateStatus = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params
    const { status } = req.body

    const allowed = ["applied", "promote_to_oa", "promote_to_hr", "rejected"]
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const candidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { status },
      { new: true }
    )

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" })
    }

    res.json(candidate)
  } catch (err: any) {
    console.error("UPDATE CANDIDATE STATUS ERROR:", err)
    const message =
      err?.name === "CastError"
        ? "Invalid candidate ID"
        : err?.message || "Failed to update status"
    res.status(500).json({ message })
  }
}