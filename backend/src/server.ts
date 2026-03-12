console.log("🔥 THIS server.ts FILE IS RUNNING")
import dotenv from "dotenv"
dotenv.config()
import jobRoutes from "./routes/jobRoutes"
import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import path from "path"
import resumeRoutes from "./routes/resumeRoutes"
import candidateRoutes from "./routes/candidateRoutes"
import authRoutes from "./routes/authRoutes"
import interviewRoutes from "./routes/interviewRoutes"
import { initInterviewReminders } from "./services/interviewReminder"


const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))
app.use(express.urlencoded({ extended: true }))
app.use("/uploads", express.static("uploads"))

app.use("/api/candidates", candidateRoutes)
app.get("/debug", (_req, res) => {
  res.json({ message: "direct route works" })
})


// 🔴 THIS MUST BE HERE (BEFORE ANY ROUTES)
app.use("/api/auth", authRoutes)
app.use("/api/jobs", jobRoutes)
app.use("/api/resumes", resumeRoutes)
app.use("/api/interviews", interviewRoutes)

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "SmartRecruit backend running" })
})

mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log("MongoDB connected")
    initInterviewReminders()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection failed", err)
    process.exit(1)
  })
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("GLOBAL ERROR HANDLER:", err)
  res.status(500).json({
    message: err.message || "Internal Server Error"
  })
})

