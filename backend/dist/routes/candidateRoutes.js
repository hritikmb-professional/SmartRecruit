"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const candidateController_1 = require("../controllers/candidateController");
const candidateController_2 = require("../controllers/candidateController");
const router = express_1.default.Router();
// ALWAYS put specific routes FIRST
router.get("/compare", auth_1.authenticate, candidateController_2.getCandidatesByIds);
// Then dynamic routes
router.get("/:candidateId", auth_1.authenticate, candidateController_2.getCandidateById);
router.patch("/:candidateId/status", auth_1.authenticate, candidateController_1.updateCandidateStatus);
exports.default = router;
