import mongoose, { Schema, Document } from "mongoose"

export interface ICandidate extends Document {
  name: string
  email: string
  phone: string
  skills: string[]
  matchedSkills: string[]
  missingSkills: string[]
  summary: string
  experience: string
  education: string[]
  resumeText: string
  resumePath: string
  matchScore: number
  scoreBreakdown: {
    skillsMatch: number
    experienceRelevance: number
    educationMatch: number
    projectRelevance: number
    overallExperience: number
  }
  githubVerification?: {
    githubFound: boolean
    githubUrl?: string
    contributionBonus: number
    verificationScore: number
    projectsVerified: string[]
    topRepos?: {
      name: string
      description: string | null
      language: string | null
      stars: number
      forks: number
    }[]
    topLanguages?: { language: string; percentage: number }[]
    totals?: { stars: number; forks: number }
    lastActiveAt?: string | null
    activitySummary?: {
      prOpened: number
      prMerged: number
      issuesOpened: number
      commits: number
      repositoriesContributedTo: number
    }
  }
  status: string
  job: mongoose.Types.ObjectId
  createdAt: Date
}

const CandidateSchema = new Schema<ICandidate>({
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
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model<ICandidate>("Candidate", CandidateSchema)
