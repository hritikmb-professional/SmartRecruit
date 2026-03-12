"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initInterviewReminders = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Interview_1 = __importDefault(require("../models/Interview"));
const emailservice_1 = require("./emailservice");
const initInterviewReminders = () => {
    // Daily at 09:00 send reminders for interviews in next 24 hours
    node_cron_1.default.schedule("0 9 * * *", async () => {
        const now = new Date();
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const upcoming = await Interview_1.default.find({
            start: { $gte: now, $lte: next24h },
            status: "scheduled",
            reminderSent: false
        });
        for (const interview of upcoming) {
            try {
                const startStr = interview.start.toLocaleString();
                const endStr = interview.end.toLocaleString();
                if (interview.candidateEmail) {
                    await (0, emailservice_1.sendEmail)({
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
                    });
                }
                if (interview.interviewerEmail) {
                    await (0, emailservice_1.sendEmail)({
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
                    });
                }
                interview.reminderSent = true;
                await interview.save();
            }
            catch (err) {
                console.error("Failed to send reminder", err);
            }
        }
    });
};
exports.initInterviewReminders = initInterviewReminders;
