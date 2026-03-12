"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const interviewController_1 = require("../controllers/interviewController");
const router = express_1.default.Router();
router.get("/slots", auth_1.authenticate, interviewController_1.getSlots);
router.post("/slots/generate", auth_1.authenticate, interviewController_1.generateSlots);
router.get("/slots/open", auth_1.authenticate, interviewController_1.listOpenSlots);
router.post("/slots/:id/book", auth_1.authenticate, interviewController_1.bookSlot);
router.get("/", auth_1.authenticate, interviewController_1.listInterviews);
router.get("/:id", auth_1.authenticate, interviewController_1.getInterview);
router.post("/", auth_1.authenticate, interviewController_1.scheduleInterview);
router.post("/:id/feedback", auth_1.authenticate, interviewController_1.submitFeedback);
exports.default = router;
