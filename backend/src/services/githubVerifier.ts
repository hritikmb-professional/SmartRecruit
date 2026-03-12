import axios from "axios"

interface GitHubProfile {
  username: string
  publicRepos: number
  followers: number
  following: number
  contributions: number
  bio: string | null
}

interface GitHubRepo {
  name: string
  description: string | null
  language: string | null
  stars: number
  forks: number
}

interface VerificationResult {
  githubFound: boolean
  githubUrl?: string
  profile?: GitHubProfile
  repos?: GitHubRepo[]
  topRepos?: GitHubRepo[]
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
  projectsVerified: string[]
  projectsNotFound: string[]
  contributionBonus: number
  verificationScore: number
}

/**
 * Extract GitHub URL from resume text
 */
export const extractGitHubUrl = (resumeText: string): string | null => {
  // Log first 500 chars to debug
  console.log("📄 Resume text sample:", resumeText.substring(0, 500))
  
  // Match various GitHub URL formats - more flexible patterns
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-_]+)/gi,
    /(?:https?:\/\/)?(?:www\.)?github\.io\/([a-zA-Z0-9-_]+)/gi,
    /(?:https?:\/\/)?git\.io\/([a-zA-Z0-9-_]+)/gi,
    /github:\s*([a-zA-Z0-9-_]+)/gi,
    /github\s+(?:profile|username|id|handle):\s*([a-zA-Z0-9-_]+)/gi,
    /github\.com\/([a-zA-Z0-9-_]+)(?:\/|\s|$)/gi,
    /@([a-zA-Z0-9-_]+)\s+(?:on\s+)?github/gi
  ]

  for (const pattern of patterns) {
    const match = resumeText.match(pattern)
    if (match) {
      // Extract username from match
      let username = ""
      
      // Try to extract the captured group
      const execMatch = pattern.exec(resumeText)
      if (execMatch && execMatch[1]) {
        username = execMatch[1]
      } else if (match[0]) {
        // Fallback: extract from full match
        const urlMatch = match[0].match(/([a-zA-Z0-9-_]+)/)
        if (urlMatch) {
          username = urlMatch[1]
        }
      }
      
      // Filter out common false positives
      const invalidUsernames = ['github', 'www', 'http', 'https', 'com', 'profile', 'username', 'id', 'handle']
      if (username && !invalidUsernames.includes(username.toLowerCase()) && username.length > 2) {
        console.log("✅ GitHub username found:", username)
        return `https://github.com/${username}`
      }
    }
  }

  console.log("❌ No GitHub URL found in resume")
  console.log("💡 Tip: Make sure resume contains 'github.com/username' or similar format")
  return null
}

/**
 * Fetch GitHub profile data
 */
const fetchGitHubProfile = async (username: string): Promise<GitHubProfile | null> => {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Add GitHub token if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `token ${process.env.GITHUB_TOKEN}`
        })
      }
    })

    const data = response.data

    return {
      username: data.login,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
      contributions: data.public_repos, // Approximate - actual contributions require GraphQL
      bio: data.bio
    }
  } catch (error) {
    console.error(`Failed to fetch GitHub profile for ${username}:`, error)
    return null
  }
}

/**
 * Fetch user's repositories
 */
const fetchGitHubRepos = async (username: string): Promise<GitHubRepo[]> => {
  try {
    const response = await axios.get(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    )

    return response.data.map((repo: any) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count
    }))
  } catch (error) {
    console.error(`Failed to fetch repos for ${username}:`, error)
    return []
  }
}

/**
 * Fetch recent public activity for a user
 */
const fetchUserEvents = async (username: string) => {
  try {
    const response = await axios.get(
      `https://api.github.com/users/${username}/events/public?per_page=100`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    )
    return response.data as any[]
  } catch (error) {
    console.error(`Failed to fetch events for ${username}:`, error)
    return []
  }
}

/**
 * Summarize languages from repos
 */
const summarizeLanguages = (repos: GitHubRepo[]): { language: string; percentage: number }[] => {
  const counts: Record<string, number> = {}
  let total = 0
  for (const r of repos) {
    if (r.language) {
      counts[r.language] = (counts[r.language] || 0) + 1
      total += 1
    }
  }
  const list = Object.entries(counts)
    .map(([language, count]) => ({
      language,
      percentage: total ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
  return list.slice(0, 5)
}

/**
 * Verify projects mentioned in resume exist in GitHub
 */
const verifyProjects = (
  resumeText: string,
  repos: GitHubRepo[]
): { verified: string[]; notFound: string[] } => {
  // Extract potential project names from resume
  const projectPatterns = [
    /project[s]?:?\s*([a-zA-Z0-9\s-]+)/gi,
    /built\s+([a-zA-Z0-9\s-]+)/gi,
    /developed\s+([a-zA-Z0-9\s-]+)/gi,
    /created\s+([a-zA-Z0-9\s-]+)/gi
  ]

  const potentialProjects = new Set<string>()

  for (const pattern of projectPatterns) {
    let match
    while ((match = pattern.exec(resumeText)) !== null) {
      const project = match[1].trim().toLowerCase()
      if (project.length > 3 && project.length < 50) {
        potentialProjects.add(project)
      }
    }
  }

  const repoNames = repos.map(r => r.name.toLowerCase())
  const verified: string[] = []
  const notFound: string[] = []

  for (const project of potentialProjects) {
    const found = repoNames.some(repoName => {
      // Fuzzy match - check if project name is in repo name or vice versa
      return (
        repoName.includes(project) ||
        project.includes(repoName) ||
        similarity(project, repoName) > 0.7
      )
    })

    if (found) {
      verified.push(project)
    } else {
      notFound.push(project)
    }
  }

  return { verified, notFound }
}

/**
 * Calculate string similarity (Dice coefficient)
 */
const similarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance
 */
const levenshteinDistance = (s1: string, s2: string): number => {
  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

/**
 * Calculate contribution bonus score
 */
const calculateContributionBonus = (profile: GitHubProfile): number => {
  const repos = profile.publicRepos

  if (repos >= 50) return 15 // Exceptional
  if (repos >= 30) return 12 // Very active
  if (repos >= 20) return 10 // Active
  if (repos >= 10) return 7 // Moderate
  if (repos >= 5) return 5 // Some activity

  return 0
}

/**
 * Calculate verification score based on GitHub activity
 */
const calculateVerificationScore = (
  profile: GitHubProfile,
  projectsVerified: number,
  projectsTotal: number
): number => {
  let score = 0

  // Repos contribution (0-10 points)
  if (profile.publicRepos >= 20) score += 10
  else if (profile.publicRepos >= 10) score += 7
  else if (profile.publicRepos >= 5) score += 5
  else score += 2

  // Project verification (0-10 points)
  if (projectsTotal > 0) {
    const verificationRate = projectsVerified / projectsTotal
    score += Math.round(verificationRate * 10)
  }

  return score // Total: 0-20 points
}

/**
 * Main verification function
 */
export const verifyGitHub = async (resumeText: string): Promise<VerificationResult> => {
  console.log("🔍 Starting GitHub verification...")
  
  // Extract GitHub URL
  const githubUrl = extractGitHubUrl(resumeText)

  if (!githubUrl) {
    console.log("⚠️ GitHub verification skipped - no URL found")
    return {
      githubFound: false,
      projectsVerified: [],
      projectsNotFound: [],
      contributionBonus: 0,
      verificationScore: 0
    }
  }

  // Extract username from URL
  const username = githubUrl.split("/").pop() || ""
  console.log("👤 Fetching GitHub profile for:", username)

  // Fetch profile and repos
  const profile = await fetchGitHubProfile(username)

  if (!profile) {
    console.log("❌ GitHub profile fetch failed")
    return {
      githubFound: true,
      githubUrl,
      projectsVerified: [],
      projectsNotFound: [],
      contributionBonus: 0,
      verificationScore: 0
    }
  }

  console.log("✅ GitHub profile fetched:", profile.username, "Repos:", profile.publicRepos)

  const repos = await fetchGitHubRepos(username)
  console.log("📦 Repos fetched:", repos.length)

  // Aggregate data
  const totals = {
    stars: repos.reduce((sum, r) => sum + (r.stars || 0), 0),
    forks: repos.reduce((sum, r) => sum + (r.forks || 0), 0)
  }
  const topRepos = [...repos].sort((a, b) => b.stars - a.stars).slice(0, 5)
  const topLanguages = summarizeLanguages(repos)

  // Recent activity
  const events = await fetchUserEvents(username)
  const lastActiveAt = events.length ? events[0].created_at || null : null
  const activitySummary = {
    prOpened: events.filter(e => e.type === "PullRequestEvent" && e.payload?.action === "opened").length,
    prMerged: events.filter(e => e.type === "PullRequestEvent" && e.payload?.action === "closed" && e.payload?.pull_request?.merged).length,
    issuesOpened: events.filter(e => e.type === "IssuesEvent" && e.payload?.action === "opened").length,
    commits: events
      .filter(e => e.type === "PushEvent")
      .reduce((sum, e) => sum + (Array.isArray(e.payload?.commits) ? e.payload.commits.length : 0), 0),
    repositoriesContributedTo: new Set(events.map(e => e.repo?.name).filter(Boolean)).size
  }

  // Verify projects
  const { verified, notFound } = verifyProjects(resumeText, repos)
  console.log("✓ Verified projects:", verified.length, verified)
  console.log("✗ Not found projects:", notFound.length, notFound)

  // Calculate bonuses
  const contributionBonus = calculateContributionBonus(profile)
  const verificationScore = calculateVerificationScore(profile, verified.length, verified.length + notFound.length)

  console.log("🎁 Contribution bonus:", contributionBonus)
  console.log("📊 Verification score:", verificationScore)

  return {
    githubFound: true,
    githubUrl,
    profile,
    repos: repos.slice(0, 10), // Return top 10 repos
    topRepos,
    topLanguages,
    totals,
    lastActiveAt,
    activitySummary,
    projectsVerified: verified,
    projectsNotFound: notFound,
    contributionBonus,
    verificationScore
  }
}
