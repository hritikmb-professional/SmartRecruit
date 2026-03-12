import mongoose, { Schema, Document } from "mongoose"

export interface IInterviewSlot extends Document {
  organizer: mongoose.Types.ObjectId
  calendarId?: string
  start: Date
  end: Date
  timeZone: string
  status: "open" | "reserved" | "canceled"
  interview?: mongoose.Types.ObjectId
  job?: mongoose.Types.ObjectId
  candidate?: mongoose.Types.ObjectId
  createdAt: Date
}

const InterviewSlotSchema = new Schema<IInterviewSlot>({
  organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  calendarId: { type: String },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  timeZone: { type: String, default: "UTC" },
  status: {
    type: String,
    enum: ["open", "reserved", "canceled"],
    default: "open"
  },
  interview: { type: Schema.Types.ObjectId, ref: "Interview" },
  job: { type: Schema.Types.ObjectId, ref: "Job" },
  candidate: { type: Schema.Types.ObjectId, ref: "Candidate" },
  createdAt: { type: Date, default: Date.now }
})

InterviewSlotSchema.index({ organizer: 1, start: 1, end: 1 }, { unique: true })

export default mongoose.model<IInterviewSlot>("InterviewSlot", InterviewSlotSchema)

