"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeResumeWithLLM = void 0;
const generative_ai_1 = require("@google/generative-ai");
const githubVerifier_1 = require("./githubVerifier");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
});
/**
 * Safely extract JSON from LLM output
 */
const extractJSON = (text) => {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error("No JSON object found in LLM response");
    }
    return JSON.parse(match[0]);
};
const analyzeResumeWithLLM = async (resumeText, jobDescription) => {
    const prompt = `
You are an AI recruitment assistant with expertise in candidate evaluation.

IMPORTANT RULES:
- Respond with ONLY valid JSON
- Do NOT include markdown
- Do NOT include explanations
- Do NOT include text outside JSON

JSON schema:
{
  "name": string,
  "email": string,
  "phone": string,
  "skills": string[],
  "matchedSkills": string[],
  "missingSkills": string[],
  "matchScore": number,
  "summary": string,
  "experience": string,
  "education": string[],
  "scoreBreakdown": {
    "skillsMatch": number,
    "experienceRelevance": number,
    "educationMatch": number,
    "projectRelevance": number,
    "overallExperience": number
  }
}

SCORING PROTOCOL (Each category out of 20 points):

1. skillsMatch (20 points):
   - Count required skills vs matched skills
   - 20 points: 90-100% skills matched
   - 15 points: 70-89% skills matched
   - 10 points: 50-69% skills matched
   - 5 points: 30-49% skills matched
   - 0 points: <30% skills matched

2. experienceRelevance (20 points):
   - How relevant is their work experience to this specific job?
   - 20 points: Highly relevant experience (same role/industry)
   - 15 points: Moderately relevant (similar role or industry)
   - 10 points: Somewhat relevant (transferable skills)
   - 5 points: Limited relevance
   - 0 points: No relevant experience

3. educationMatch (20 points):
   - Does education meet job requirements?
   - 20 points: Exceeds requirements (advanced degree in relevant field)
   - 15 points: Meets requirements exactly
   - 10 points: Meets minimum requirements
   - 5 points: Partially meets requirements
   - 0 points: Does not meet requirements

4. projectRelevance (20 points):
   - Are their projects/work samples relevant to this job?
   - 20 points: Multiple highly relevant projects
   - 15 points: Some relevant projects
   - 10 points: Tangentially related projects
   - 5 points: Generic projects
   - 0 points: No projects or irrelevant

5. overallExperience (20 points):
   - Total years of experience and career progression
   - 20 points: 7+ years with clear progression
   - 15 points: 5-7 years with good progression
   - 10 points: 3-5 years
   - 5 points: 1-3 years
   - 0 points: <1 year or no progression

matchScore = (skillsMatch + experienceRelevance + educationMatch + projectRelevance + overallExperience)
This gives a total score out of 100.

Field descriptions:
- name: Candidate's full name
- email: Candidate's email address
- phone: Candidate's phone number
- skills: All skills mentioned in the resume
- matchedSkills: Skills from resume that match the job requirements
- missingSkills: Required skills from job that candidate lacks
- matchScore: Total score out of 100 (sum of all scoreBreakdown values)
- summary: 2-3 sentence summary explaining the candidate's fit and key strengths/weaknesses
- experience: Text summary of work experience (include job titles, companies, and years)
- education: Array of education entries (e.g., ["Bachelor of Science in Computer Science, MIT, 2018"])
- scoreBreakdown: Object containing individual scores for each evaluation category

Resume:
"""${resumeText}"""

Job Description:
"""${jobDescription}"""
`;
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    let analysisResult;
    try {
        analysisResult = extractJSON(rawText);
    }
    catch (err) {
        console.error("RAW LLM OUTPUT:\n", rawText);
        throw new Error("LLM returned invalid JSON");
    }
    // Perform GitHub verification
    try {
        const githubVerification = await (0, githubVerifier_1.verifyGitHub)(resumeText);
        if (githubVerification.githubFound) {
            analysisResult.githubVerification = {
                githubFound: true,
                githubUrl: githubVerification.githubUrl,
                contributionBonus: githubVerification.contributionBonus,
                verificationScore: githubVerification.verificationScore,
                projectsVerified: githubVerification.projectsVerified,
                topRepos: githubVerification.topRepos,
                topLanguages: githubVerification.topLanguages,
                totals: githubVerification.totals,
                lastActiveAt: githubVerification.lastActiveAt,
                activitySummary: githubVerification.activitySummary
            };
            // Add GitHub bonus to match score
            analysisResult.matchScore = Math.min(100, analysisResult.matchScore + githubVerification.contributionBonus);
        }
    }
    catch (err) {
        console.error("GitHub verification failed:", err);
        // Continue without GitHub data
    }
    return analysisResult;
};
exports.analyzeResumeWithLLM = analyzeResumeWithLLM;
