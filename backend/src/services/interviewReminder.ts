import cron from "node-cron"
import Interview from "../models/Interview"
import { sendEmail } from "./emailservice"

export const initInterviewReminders = () => {
  // Daily at 09:00 send reminders for interviews in next 24 hours
  cron.schedule("0 9 * * *", async () => {
    const now = new Date()
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const upcoming = await Interview.find({
      start: { $gte: now, $lte: next24h },
      status: "scheduled",
      reminderSent: false
    })

    for (const interview of upcoming) {
      try {
        const startStr = interview.start.toLocaleString()
        const endStr = interview.end.toLocaleString()

        if (interview.candidateEmail) {
          await sendEmail({
            to: interview.candidateEmail,
            subject: "Upcoming Interview Reminder",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Reminder</h2>
                <p>Your interview is scheduled:</p>
                <p><strong>Start:</strong> ${startStr}</p>
                <p><strong>End:</strong> ${endStr}</p>
                <p>Please ensure you're prepared and join on time.</p>
                <br/>
                <p>Best,<br/>SmartRecruit Team</p>
              </div>
            `
          })
        }
        if (interview.interviewerEmail) {
          await sendEmail({
            to: interview.interviewerEmail,
            subject: "Upcoming Interview Reminder",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Reminder</h2>
                <p>You have an upcoming interview:</p>
                <p><strong>Start:</strong> ${startStr}</p>
                <p><strong>End:</strong> ${endStr}</p>
                <p>Please ensure you're available and prepared.</p>
                <br/>
                <p>Best,<br/>SmartRecruit Team</p>
              </div>
            `
          })
        }
        interview.reminderSent = true
        await interview.save()
      } catch (err) {
        console.error("Failed to send reminder", err)
      }
    }
  })
}

