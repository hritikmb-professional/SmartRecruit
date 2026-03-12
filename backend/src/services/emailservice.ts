import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  const transporter = createTransporter()

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  }

  await transporter.sendMail(mailOptions)
}

export const sendRecruitmentStatusEmail = async (
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  status: string
) => {
  const statusTemplates: Record<string, { subject: string; message: string }> = {
    promote_to_oa: {
      subject: `Congratulations! You've been promoted to Online Assessment - ${jobTitle}`,
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Congratulations ${candidateName}!</h2>
          <p>We are pleased to inform you that you have been promoted to the <strong>Online Assessment Round</strong> for the position of <strong>${jobTitle}</strong>.</p>
          <p>Our recruitment team will reach out to you shortly with the assessment link and further instructions.</p>
          <p>Please keep an eye on your email for the next steps.</p>
          <br>
          <p>Best regards,<br>SmartRecruit Team</p>
        </div>
      `
    },
    promote_to_hr: {
      subject: `Congratulations! You've been promoted to HR Round - ${jobTitle}`,
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Congratulations ${candidateName}!</h2>
          <p>We are pleased to inform you that you have been promoted to the <strong>HR Round</strong> for the position of <strong>${jobTitle}</strong>.</p>
          <p>Our HR team will contact you shortly to schedule your interview.</p>
          <p>Please keep an eye on your email and phone for further communication.</p>
          <br>
          <p>Best regards,<br>SmartRecruit Team</p>
        </div>
      `
    },
    rejected: {
      subject: `Update on your application for ${jobTitle}`,
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Thank you for your interest, ${candidateName}</h2>
          <p>Thank you for taking the time to apply for the position of <strong>${jobTitle}</strong>.</p>
          <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
          <p>We encourage you to apply for future openings that match your skills and experience.</p>
          <p>We wish you all the best in your job search.</p>
          <br>
          <p>Best regards,<br>SmartRecruit Team</p>
        </div>
      `
    }
  }

  const template = statusTemplates[status]
  if (!template) {
    throw new Error(`Invalid status: ${status}`)
  }

  await sendEmail({
    to: candidateEmail,
    subject: template.subject,
    html: template.message
  })
}