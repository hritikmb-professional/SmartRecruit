import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import Interview from "../models/Interview"
import Candidate from "../models/Candidate"
import Job from "../models/Job"
import { getAvailableSlots, createInterviewEvent } from "../services/googleCalendar"
import { sendEmail } from "../services/emailservice"
import InterviewSlot from "../models/InterviewSlot"

export const getSlots = async (req: AuthRequest, res: Response) => {
  try {
    const { dateISO, durationMinutes, calendarId, timeZone } = req.query as any
    if (!dateISO || !durationMinutes) {
      return res.status(400).json({ message: "dateISO and durationMinutes required" })
    }

    const slots = await getAvailableSlots({
      dateISO,
      durationMinutes: Number(durationMinutes),
      calendarId,
      timeZone
    })

    return res.json(slots)
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch slots", error: String(err) })
  }
}

export const scheduleInterview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const { candidateId, jobId, interviewerEmail, startISO, endISO, timeZone } = req.body
    if (!candidateId || !jobId || !interviewerEmail || !startISO || !endISO) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const candidate = await Candidate.findById(candidateId)
    const job = await Job.findById(jobId)
    if (!candidate || !job) {
      return res.status(404).json({ message: "Candidate or job not found" })
    }

    const { eventId, hangoutLink } = await createInterviewEvent({
      summary: `Interview: ${job.title} - ${candidate.name}`,
      description: `Interview for ${job.title} with ${candidate.name}`,
      startISO,
      endISO,
      timeZone,
      attendees: [
        { email: interviewerEmail },
        { email: candidate.email }
      ]
    })

    const interview = await Interview.create({
      candidate: candidate._id,
      job: job._id,
      organizer: req.userId,
      interviewerEmail,
      candidateEmail: candidate.email,
      start: new Date(startISO),
      end: new Date(endISO),
      timeZone: timeZone || "UTC",
      googleEventId: eventId,
      status: "scheduled"
    })

    // Optional: send confirmation email
    if (candidate.email) {
      await sendEmail({
        to: candidate.email,
        subject: `Interview scheduled for ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Interview Scheduled</h2>
            <p>Dear ${candidate.name},</p>
            <p>Your interview for <strong>${job.title}</strong> has been scheduled.</p>
            <p><strong>Start:</strong> ${new Date(startISO).toLocaleString()}</p>
            <p><strong>End:</strong> ${new Date(endISO).toLocaleString()}</p>
            ${hangoutLink ? `<p><strong>Meeting Link:</strong> <a href="${hangoutLink}">${hangoutLink}</a></p>` : ""}
            <p>You will also receive a calendar invite.</p>
            <br/>
            <p>Best regards,<br/>SmartRecruit Team</p>
          </div>
        `
      })
    }

    return res.status(201).json({ interview, hangoutLink })
  } catch (err) {
    return res.status(500).json({ message: "Failed to schedule interview", error: String(err) })
  }
}

export const listInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.query as any
    const filter: any = {}
    if (jobId) filter.job = jobId
    const interviews = await Interview.find(filter).sort({ start: 1 })
    return res.json(interviews)
  } catch (err) {
    return res.status(500).json({ message: "Failed to list interviews", error: String(err) })
  }
}

export const getInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const interview = await Interview.findById(id)
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" })
    }
    return res.json(interview)
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch interview", error: String(err) })
  }
}

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const { id } = req.params
    const { rating, comments } = req.body
    const interview = await Interview.findById(id)
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" })
    }
    interview.feedback = {
      rating,
      comments,
      submittedBy: req.userId as any,
      submittedAt: new Date()
    }
    interview.status = "completed"
    await interview.save()
    return res.json({ message: "Feedback submitted", interview })
  } catch (err) {
    return res.status(500).json({ message: "Failed to submit feedback", error: String(err) })
  }
}

export const generateSlots = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const {
      startDateISO,
      endDateISO,
      durationMinutes,
      calendarId,
      timeZone,
      workStartHour = 9,
      workEndHour = 17
    } = req.body
    if (!startDateISO || !endDateISO || !durationMinutes) {
      return res.status(400).json({ message: "Missing required fields" })
    }
    const startDate = new Date(startDateISO)
    const endDate = new Date(endDateISO)
    let created = 0
    for (
      let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      d <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      d.setDate(d.getDate() + 1)
    ) {
      const slots = await getAvailableSlots({
        dateISO: d.toISOString(),
        durationMinutes,
        calendarId,
        timeZone,
        workStartHour,
        workEndHour
      })
      for (const s of slots) {
        try {
          await InterviewSlot.create({
            organizer: req.userId,
            calendarId,
            start: new Date(s.start),
            end: new Date(s.end),
            timeZone: timeZone || "UTC",
            status: "open"
          })
          created++
        } catch {}
      }
    }
    return res.status(201).json({ created })
  } catch (err) {
    return res.status(500).json({ message: "Failed to generate slots", error: String(err) })
  }
}

export const listOpenSlots = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const { dateISO } = req.query as any
    const filter: any = { organizer: req.userId, status: "open" }
    if (dateISO) {
      const day = new Date(dateISO)
      const dayStart = new Date(day); dayStart.setHours(0,0,0,0)
      const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999)
      filter.start = { $gte: dayStart, $lte: dayEnd }
    }
    const slots = await InterviewSlot.find(filter).sort({ start: 1 })
    return res.json(slots.map(s => ({ id: s._id, start: s.start, end: s.end, timeZone: s.timeZone })))
  } catch (err) {
    return res.status(500).json({ message: "Failed to list slots", error: String(err) })
  }
}

export const bookSlot = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const { id } = req.params
    const { candidateId, jobId, interviewerEmail } = req.body
    if (!candidateId || !jobId || !interviewerEmail) {
      return res.status(400).json({ message: "Missing required fields" })
    }
    const slot = await InterviewSlot.findOneAndUpdate(
      { _id: id, status: "open" },
      { $set: { status: "reserved" } },
      { new: true }
    )
    if (!slot) {
      return res.status(409).json({ message: "Slot not available" })
    }
    const candidate = await Candidate.findById(candidateId)
    const job = await Job.findById(jobId)
    if (!candidate || !job) {
      return res.status(404).json({ message: "Candidate or job not found" })
    }
    const { eventId, hangoutLink } = await createInterviewEvent({
      summary: `Interview: ${job.title} - ${candidate.name}`,
      description: `Interview for ${job.title} with ${candidate.name}`,
      startISO: slot.start.toISOString(),
      endISO: slot.end.toISOString(),
      timeZone: slot.timeZone,
      attendees: [{ email: interviewerEmail }, { email: candidate.email }]
    })
    const interview = await Interview.create({
      candidate: candidate._id,
      job: job._id,
      organizer: req.userId,
      interviewerEmail,
      candidateEmail: candidate.email,
      start: slot.start,
      end: slot.end,
      timeZone: slot.timeZone,
      googleEventId: eventId,
      status: "scheduled"
    })
    slot.interview = interview._id
    slot.job = job._id
    slot.candidate = candidate._id
    await slot.save()
    if (candidate.email) {
      await sendEmail({
        to: candidate.email,
        subject: `Interview scheduled for ${job.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Interview Scheduled</h2>
            <p>Dear ${candidate.name},</p>
            <p>Your interview for <strong>${job.title}</strong> has been scheduled.</p>
            <p><strong>Start:</strong> ${slot.start.toLocaleString()}</p>
            <p><strong>End:</strong> ${slot.end.toLocaleString()}</p>
            ${hangoutLink ? `<p><strong>Meeting Link:</strong> <a href="${hangoutLink}">${hangoutLink}</a></p>` : ""}
            <p>You will also receive a calendar invite.</p>
            <br/>
            <p>Best regards,<br/>SmartRecruit Team</p>
          </div>
        `
      })
    }
    return res.status(201).json({ interview, slotId: slot._id, hangoutLink })
  } catch (err) {
    return res.status(500).json({ message: "Failed to book slot", error: String(err) })
  }
}
