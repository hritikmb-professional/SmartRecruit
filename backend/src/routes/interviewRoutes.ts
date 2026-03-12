import express from "express"
import { authenticate } from "../middleware/auth"
import {
  getSlots,
  scheduleInterview,
  listInterviews,
  getInterview,
  submitFeedback,
  generateSlots,
  listOpenSlots,
  bookSlot
} from "../controllers/interviewController"

const router = express.Router()

router.get("/slots", authenticate, getSlots)
router.post("/slots/generate", authenticate, generateSlots)
router.get("/slots/open", authenticate, listOpenSlots)
router.post("/slots/:id/book", authenticate, bookSlot)
router.get("/", authenticate, listInterviews)
router.get("/:id", authenticate, getInterview)
router.post("/", authenticate, scheduleInterview)
router.post("/:id/feedback", authenticate, submitFeedback)

export default router
