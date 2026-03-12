import mongoose, { Schema, Document } from "mongoose"

export interface IInterview extends Document {
  candidate: mongoose.Types.ObjectId
  job: mongoose.Types.ObjectId
  organizer: mongoose.Types.ObjectId
  interviewerEmail: string
  candidateEmail: string
  start: Date
  end: Date
  timeZone: string
  googleEventId?: string
  status: "scheduled" | "completed" | "canceled"
  reminderSent: boolean
  feedback?: {
    rating?: number
    comments?: string
    submittedBy?: mongoose.Types.ObjectId
    submittedAt?: Date
  }
  createdAt: Date
}

const InterviewSchema = new Schema<IInterview>({
  candidate: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
  job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  interviewerEmail: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  timeZone: { type: String, default: "UTC" },
  googleEventId: { type: String },
  status: {
    type: String,
    enum: ["scheduled", "completed", "canceled"],
    default: "scheduled"
  },
  reminderSent: { type: Boolean, default: false },
  feedback: {
    type: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String },
      submittedBy: { type: Schema.Types.ObjectId, ref: "User" },
      submittedAt: { type: Date }
    },
    required: false
  },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model<IInterview>("Interview", InterviewSchema)

