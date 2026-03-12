"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const CandidateSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ""
    },
    phone: {
        type: String,
        default: ""
    },
    skills: {
        type: [String],
        default: []
    },
    matchedSkills: {
        type: [String],
        default: []
    },
    missingSkills: {
        type: [String],
        default: []
    },
    summary: {
        type: String,
        default: ""
    },
    experience: {
        type: String,
        default: ""
    },
    education: {
        type: [String],
        default: []
    },
    resumeText: {
        type: String,
        required: true
    },
    resumePath: {
        type: String,
        required: true
    },
    matchScore: {
        type: Number,
        default: 0
    },
    scoreBreakdown: {
        type: {
            skillsMatch: { type: Number, default: 0 },
            experienceRelevance: { type: Number, default: 0 },
            educationMatch: { type: Number, default: 0 },
            projectRelevance: { type: Number, default: 0 },
            overallExperience: { type: Number, default: 0 }
        },
        default: {
            skillsMatch: 0,
            experienceRelevance: 0,
            educationMatch: 0,
            projectRelevance: 0,
            overallExperience: 0
        }
    },
    githubVerification: {
        type: {
            githubFound: { type: Boolean, default: false },
            githubUrl: { type: String },
            contributionBonus: { type: Number, default: 0 },
            verificationScore: { type: Number, default: 0 },
            projectsVerified: { type: [String], default: [] },
            topRepos: {
                type: [
                    {
                        name: { type: String },
                        description: { type: String },
                        language: { type: String },
                        stars: { type: Number },
                        forks: { type: Number }
                    }
                ],
                default: []
            },
            topLanguages: {
                type: [
                    {
                        language: { type: String },
                        percentage: { type: Number }
                    }
                ],
                default: []
            },
            totals: {
                type: {
                    stars: { type: Number, default: 0 },
                    forks: { type: Number, default: 0 }
                },
                default: undefined
            },
            lastActiveAt: { type: String },
            activitySummary: {
                type: {
                    prOpened: { type: Number, default: 0 },
                    prMerged: { type: Number, default: 0 },
                    issuesOpened: { type: Number, default: 0 },
                    commits: { type: Number, default: 0 },
                    repositoriesContributedTo: { type: Number, default: 0 }
                },
                default: undefined
            }
        },
        required: false
    },
    status: {
        type: String,
        enum: ["applied", "promote_to_oa", "promote_to_hr", "rejected"],
        default: "applied"
    },
    job: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
exports.default = mongoose_1.default.model("Candidate", CandidateSchema);
