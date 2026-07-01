/**
 * Rule-based career analysis engine.
 * All analysis is performed client-side using resume data already fetched from the API.
 * Designed so an LLM provider can be dropped in later by replacing individual functions.
 */

import type { ResumeDetail } from "@workspace/api-client-react";

// ─── Shared types ────────────────────────────────────────────────────────────

export type Severity = "high" | "medium" | "low";

export interface ResumeSuggestion {
  id: string;
  type: "grammar" | "content" | "structure" | "keywords" | "metrics" | "action-verbs" | "ats";
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
  field: string;
}

export interface JobMatchResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingTechSkills: string[];
  missingSoftSkills: string[];
  suggestions: string[];
  explanation: string;
  atsCompatibility: number;
}

export interface SkillRoadmapItem {
  skill: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  estimatedWeeks: number;
  resources: string;
}

export interface SkillGapResult {
  currentSkills: string[];
  missingSkills: string[];
  recommendedTech: string[];
  recommendedCerts: string[];
  suggestedProjects: string[];
  roadmap: SkillRoadmapItem[];
  careerReadinessScore: number;
  estimatedMonths: number;
}

export interface SectionStatus {
  name: string;
  completed: boolean;
  score: number;
}

export interface AnalyticsResult {
  atsScore: number;
  strengthScore: number;
  grammarScore: number;
  keywordScore: number;
  readabilityScore: number;
  formattingScore: number;
  professionalismScore: number;
  skillsCoverage: number;
  experienceStrength: number;
  educationCompleteness: number;
  completenessPercentage: number;
  wordCount: number;
  bulletCount: number;
  passiveVoiceCount: number;
  actionVerbPercentage: number;
  estimatedReadingTime: number;
  sectionStatus: SectionStatus[];
}

export interface ThemeRecommendation {
  templateId: number;
  templateName: string;
  confidence: number;
  reason: string;
  industry: string;
  isPrimary: boolean;
}

export type QuestionType = "hr" | "technical" | "project" | "behavioral" | "scenario";
export type Difficulty = "easy" | "medium" | "hard";

export interface InterviewQuestion {
  id: string;
  type: QuestionType;
  question: string;
  difficulty: Difficulty;
  sampleAnswer: string;
  keyPoints: string[];
  tips: string;
  commonMistakes: string;
}

export interface AnswerEvaluation {
  answerScore: number;
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  suggestions: string[];
  betterAnswer: string;
  followUpQuestions: string[];
}

export interface InterviewReport {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKnowledge: string[];
  suggestedTopics: string[];
  hiringReadiness: string;
  questionResults: { question: string; score: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEAK_VERBS = ["helped", "assisted", "worked on", "was responsible for", "participated in",
  "supported", "handled", "dealt with", "was involved in", "did", "made", "got", "had",
  "managed to", "tried to", "attempted to"];

const STRONG_VERBS = ["Developed", "Built", "Implemented", "Led", "Optimized", "Architected",
  "Engineered", "Designed", "Launched", "Delivered", "Achieved", "Improved", "Reduced",
  "Increased", "Automated", "Streamlined", "Established", "Spearheaded", "Transformed",
  "Deployed", "Integrated", "Migrated", "Resolved", "Accelerated", "Championed"];

const PASSIVE_PATTERNS = [/\bwas\s+\w+ed\b/gi, /\bwere\s+\w+ed\b/gi, /\bhas\s+been\s+\w+ed\b/gi,
  /\bhave\s+been\s+\w+ed\b/gi, /\bbeing\s+\w+ed\b/gi];

const TECH_KEYWORDS = ["javascript", "typescript", "python", "java", "c++", "c#", "ruby",
  "go", "rust", "swift", "kotlin", "react", "angular", "vue", "node", "express", "django",
  "flask", "spring", "laravel", "sql", "mysql", "postgresql", "mongodb", "redis", "aws",
  "azure", "gcp", "docker", "kubernetes", "git", "linux", "api", "rest", "graphql",
  "machine learning", "deep learning", "tensorflow", "pytorch", "data science", "pandas",
  "numpy", "figma", "photoshop", "illustrator", "html", "css", "tailwind", "bootstrap",
  "next.js", "nuxt", "gatsby", "webpack", "vite", "jest", "testing", "ci/cd", "devops",
  "agile", "scrum", "excel", "power bi", "tableau", "salesforce", "android", "ios", "flutter", "react native"];

const SOFT_KEYWORDS = ["communication", "teamwork", "leadership", "problem solving", "critical thinking",
  "time management", "adaptability", "creativity", "collaboration", "analytical", "detail-oriented",
  "organized", "motivated", "self-starter", "fast learner", "interpersonal", "presentation"];

const METRIC_PATTERNS = [/\d+%/, /\d+\s*\+?\s*(?:users?|students?|people|clients?|customers?)/i,
  /(?:increased|decreased|improved|reduced|saved|generated)\s+[\w\s]*\d+/i,
  /\$\d+/, /\d+x\s*(?:faster|improvement|growth)/i];

// Role to required skill mapping
const ROLE_SKILLS: Record<string, string[]> = {
  "Software Engineer": ["JavaScript", "React", "Node.js", "SQL", "Git", "REST API", "Data Structures", "Algorithms", "System Design"],
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Responsive Design", "Git", "REST API", "Testing"],
  "Backend Developer": ["Node.js", "Python", "Java", "SQL", "REST API", "Microservices", "Docker", "Git", "System Design"],
  "Full Stack Developer": ["JavaScript", "React", "Node.js", "SQL", "Git", "REST API", "TypeScript", "Docker", "Testing"],
  "Data Scientist": ["Python", "Machine Learning", "Statistics", "SQL", "Pandas", "NumPy", "TensorFlow", "Data Visualization", "Jupyter"],
  "Data Analyst": ["Python", "SQL", "Excel", "Power BI", "Tableau", "Statistics", "Data Visualization", "Pandas"],
  "UI/UX Designer": ["Figma", "Photoshop", "Illustrator", "User Research", "Wireframing", "Prototyping", "CSS", "Design Systems"],
  "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Terraform", "Ansible", "Git", "Jenkins", "Monitoring"],
  "Mobile Developer": ["React Native", "Flutter", "Android", "iOS", "Swift", "Kotlin", "REST API", "Git"],
  "Business Analyst": ["Excel", "SQL", "Power BI", "Tableau", "Requirements Analysis", "JIRA", "Agile", "Process Mapping"],
  "Machine Learning Engineer": ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Docker", "SQL", "Feature Engineering", "Model Deployment"],
};

const ROLE_CERTS: Record<string, string[]> = {
  "Software Engineer": ["AWS Certified Developer", "Google Cloud Associate", "Oracle Java Certification"],
  "Data Scientist": ["Google Data Analytics", "IBM Data Science", "Coursera ML Specialization"],
  "DevOps Engineer": ["AWS Solutions Architect", "CKA (Kubernetes)", "HashiCorp Terraform Associate"],
  "UI/UX Designer": ["Google UX Design Certificate", "Figma Advanced Design", "Nielsen Norman UX"],
  "Business Analyst": ["CBAP", "PMI-PBA", "Microsoft Power BI Certification"],
};

const ROLE_PROJECTS: Record<string, string[]> = {
  "Software Engineer": ["Build a RESTful API with authentication", "Create a full-stack e-commerce app", "Develop a real-time chat application"],
  "Data Scientist": ["Analyze a public dataset and publish findings", "Build a recommendation system", "Create a sentiment analysis model"],
  "Frontend Developer": ["Build a portfolio with animations", "Create a complex dashboard UI", "Contribute to an open-source UI library"],
  "DevOps Engineer": ["Set up a CI/CD pipeline on GitHub Actions", "Deploy a containerized app to Kubernetes", "Create infrastructure as code with Terraform"],
};

// Template → industry mapping
const TEMPLATE_META: Record<number, { name: string; industries: string[]; description: string }> = {
  1:  { name: "Minimal ATS Resume",    industries: ["tech", "general"],          description: "Clean, keyword-rich layout that passes ATS filters easily" },
  2:  { name: "Corporate Resume",      industries: ["business", "finance"],      description: "Formal two-column design ideal for corporate environments" },
  3:  { name: "Creative Designer",     industries: ["design", "creative", "marketing"], description: "Bold layout that showcases visual creativity" },
  4:  { name: "Executive Resume",      industries: ["management", "academic", "healthcare"], description: "Elegant classic style for senior or academic roles" },
  5:  { name: "Developer Resume",      industries: ["tech", "engineering"],      description: "Code-inspired dark header perfect for dev portfolios" },
  6:  { name: "Modern Gradient",       industries: ["tech", "startup", "marketing"], description: "Contemporary gradient design for modern companies" },
  7:  { name: "Dark Theme",            industries: ["tech", "gaming", "startup"], description: "High-contrast dark theme for tech-forward roles" },
  8:  { name: "Infographic",           industries: ["design", "creative", "data"], description: "Visual skill bars and icons for creatives and analysts" },
  9:  { name: "Elegant Professional",  industries: ["academic", "healthcare", "law"], description: "Classic serif typography for traditional professions" },
  10: { name: "Startup Founder",       industries: ["startup", "business", "tech"], description: "Bold and impactful for entrepreneurial candidates" },
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function getAllText(data: ResumeDetail): string {
  const parts: string[] = [];
  if (data.objective?.summaryText) parts.push(data.objective.summaryText);
  for (const exp of data.experience || []) {
    if (exp.position) parts.push(exp.position);
    if (exp.company) parts.push(exp.company);
    if (exp.responsibilities) parts.push(exp.responsibilities);
  }
  for (const proj of data.projects || []) {
    if (proj.projectTitle) parts.push(proj.projectTitle);
    if (proj.description) parts.push(proj.description);
    if (proj.technologies) parts.push(proj.technologies);
  }
  for (const edu of data.education || []) {
    if (edu.institution) parts.push(edu.institution);
    if (edu.fieldOfStudy) parts.push(edu.fieldOfStudy);
  }
  for (const skill of data.skills || []) {
    if (skill.skillName) parts.push(skill.skillName);
  }
  return parts.join(" ");
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function detectPassiveVoice(text: string): number {
  let count = 0;
  for (const pattern of PASSIVE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

function detectWeakVerbs(text: string): string[] {
  return WEAK_VERBS.filter(v => text.toLowerCase().includes(v.toLowerCase()));
}

function hasMetrics(text: string): boolean {
  return METRIC_PATTERNS.some(p => p.test(text));
}

function detectIndustry(data: ResumeDetail): string {
  const text = getAllText(data).toLowerCase();
  const techCount = ["javascript", "python", "java", "react", "node", "sql", "aws", "docker", "code", "software", "developer", "engineer"].filter(k => text.includes(k)).length;
  const designCount = ["figma", "ui", "ux", "design", "photoshop", "illustrator", "creative", "css"].filter(k => text.includes(k)).length;
  const dataCount = ["machine learning", "data science", "analytics", "tensorflow", "pandas", "statistics", "prediction"].filter(k => text.includes(k)).length;
  const businessCount = ["excel", "power bi", "tableau", "finance", "sales", "marketing", "business", "management"].filter(k => text.includes(k)).length;
  const academicCount = ["research", "professor", "teaching", "academic", "phd", "thesis", "publication"].filter(k => text.includes(k)).length;
  const healthCount = ["medical", "health", "clinical", "nursing", "patient", "hospital", "pharmacy"].filter(k => text.includes(k)).length;

  const scores: [string, number][] = [["tech", techCount], ["design", designCount], ["data", dataCount], ["business", businessCount], ["academic", academicCount], ["healthcare", healthCount]];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "general";
}

// ─── 1. Resume Review Analysis ───────────────────────────────────────────────

export function analyzeResume(data: ResumeDetail): ResumeSuggestion[] {
  const suggestions: ResumeSuggestion[] = [];
  let idCounter = 0;
  const id = () => `sug-${++idCounter}`;

  const fullText = getAllText(data);

  // Missing sections
  if (!data.objective?.summaryText) {
    suggestions.push({ id: id(), type: "structure", severity: "high", field: "Career Objective", title: "Missing Career Objective", description: "Recruiters spend ~6 seconds scanning a resume. A strong summary immediately communicates your value.", suggestion: "Add a 2–3 sentence career objective highlighting your key skills, experience level, and career goal. E.g.: 'Results-driven Computer Science graduate with 1+ year of internship experience in full-stack development. Passionate about building scalable web applications using React and Node.js.'" });
  }
  if (!data.personalInfo?.linkedin) {
    suggestions.push({ id: id(), type: "ats", severity: "medium", field: "Personal Info", title: "LinkedIn Profile Missing", description: "85% of recruiters check LinkedIn before interviews. Missing it reduces your professional credibility.", suggestion: "Add your LinkedIn profile URL (e.g., linkedin.com/in/yourname) to the Personal Information section." });
  }
  if (!data.personalInfo?.portfolio) {
    suggestions.push({ id: id(), type: "content", severity: "low", field: "Personal Info", title: "Portfolio URL Not Provided", description: "A portfolio link (GitHub, personal site) significantly boosts credibility for tech and creative roles.", suggestion: "Add your GitHub profile (github.com/yourusername) or personal portfolio website URL." });
  }
  if ((data.skills || []).length < 5) {
    suggestions.push({ id: id(), type: "keywords", severity: "high", field: "Skills", title: "Too Few Skills Listed", description: `You have ${(data.skills || []).length} skills listed. ATS systems look for keyword matches — most job descriptions mention 8–15 required skills.`, suggestion: "Add at least 8–10 relevant technical and soft skills. Include tools, frameworks, languages, and methodologies you know." });
  }
  if ((data.certifications || []).length === 0) {
    suggestions.push({ id: id(), type: "content", severity: "low", field: "Certifications", title: "No Certifications Listed", description: "Certifications demonstrate initiative and validate skills beyond formal education.", suggestion: "Consider adding free/low-cost certifications: Google's courses on Coursera, AWS Cloud Practitioner, or Cisco CyberOps. Even in-progress certifications can be listed." });
  }

  // Weak verbs in experience
  const weakFound = detectWeakVerbs(fullText);
  if (weakFound.length > 0) {
    suggestions.push({ id: id(), type: "action-verbs", severity: "high", field: "Experience / Projects", title: `Weak Action Verbs Detected (${weakFound.length})`, description: `Found passive/weak verbs: "${weakFound.slice(0, 3).join('", "')}". These fail to convey impact and are often filtered by ATS.`, suggestion: `Replace with strong action verbs: ${STRONG_VERBS.slice(0, 8).join(", ")}. Example: "Was responsible for API development" → "Engineered a REST API serving 10,000+ daily requests"` });
  }

  // Passive voice
  const passiveCount = detectPassiveVoice(fullText);
  if (passiveCount > 2) {
    suggestions.push({ id: id(), type: "grammar", severity: "medium", field: "Experience / Objective", title: `Passive Voice Detected (${passiveCount} instances)`, description: "Passive constructions make your resume sound less confident and are harder to read quickly.", suggestion: "Rewrite sentences in active voice. 'Tasks were completed by me' → 'Completed tasks ahead of schedule'. Start each bullet with a strong action verb." });
  }

  // Missing metrics in experience
  const expWithMetrics = (data.experience || []).filter(e => hasMetrics(e.responsibilities || "")).length;
  if ((data.experience || []).length > 0 && expWithMetrics === 0) {
    suggestions.push({ id: id(), type: "metrics", severity: "high", field: "Experience", title: "No Measurable Achievements", description: "Quantified achievements make your resume 40% more likely to get an interview callback. Numbers prove impact.", suggestion: "Add specific numbers: team size, % improvement, users served, time saved, revenue generated. E.g.: 'Reduced API response time by 40%', 'Built feature used by 500+ students'." });
  }

  // Short objective
  const objLength = (data.objective?.summaryText || "").split(/\s+/).filter(Boolean).length;
  if (data.objective?.summaryText && objLength < 20) {
    suggestions.push({ id: id(), type: "content", severity: "medium", field: "Career Objective", title: "Career Summary Too Short", description: `Your summary is only ${objLength} words. A strong summary is 40–60 words.`, suggestion: "Expand your summary to include: (1) your professional title/level, (2) years of experience, (3) top 2–3 skills, (4) what you aim to achieve in the role." });
  }

  // Short project descriptions
  for (const proj of data.projects || []) {
    const descWords = (proj.description || "").split(/\s+/).filter(Boolean).length;
    if (descWords > 0 && descWords < 15) {
      suggestions.push({ id: id(), type: "content", severity: "medium", field: "Projects", title: `Project "${proj.projectTitle}" Needs More Detail`, description: "Short project descriptions don't give recruiters enough context to evaluate your contribution and impact.", suggestion: "Expand to: what the project does, technologies used, your specific role, and measurable outcomes. Aim for 30–50 words per project." });
      break;
    }
  }

  // Experience responsibilities
  for (const exp of data.experience || []) {
    const respWords = (exp.responsibilities || "").split(/\s+/).filter(Boolean).length;
    if (respWords > 0 && respWords < 10) {
      suggestions.push({ id: id(), type: "content", severity: "medium", field: "Experience", title: `Role at "${exp.company}" Needs Expansion`, description: "Very brief job descriptions signal a lack of depth. Recruiters want to understand your actual contributions.", suggestion: "Describe what you built/did, how you did it (tools/methods), and what the result was. Use 2–4 bullet-style sentences." });
      break;
    }
  }

  // ATS formatting suggestions
  suggestions.push({ id: id(), type: "ats", severity: "low", field: "Overall Formatting", title: "Mirror Job Description Keywords", description: "ATS systems score resumes by keyword frequency. If the job description mentions 'agile development', your resume should too.", suggestion: "Read each job description carefully and mirror exact keywords and phrases used (especially for tools and methodologies). Don't stuff — be natural." });

  if ((data.experience || []).length === 0 && (data.projects || []).length < 2) {
    suggestions.push({ id: id(), type: "content", severity: "high", field: "Experience / Projects", title: "Limited Work Experience — Add More Projects", description: "Without work experience, strong projects are your most valuable differentiator.", suggestion: "Add 3–4 substantial projects with GitHub links, clear tech stacks, and real-world impact. Open-source contributions also count as experience." });
  }

  return suggestions;
}

// ─── 2. Job Match Analysis ───────────────────────────────────────────────────

export function computeJobMatch(data: ResumeDetail, jobDescription: string): JobMatchResult {
  const jdLower = jobDescription.toLowerCase();
  const resumeText = getAllText(data).toLowerCase();

  // Extract tech and soft keywords from JD
  const jdTechMatches = TECH_KEYWORDS.filter(k => jdLower.includes(k));
  const jdSoftMatches = SOFT_KEYWORDS.filter(k => jdLower.includes(k));

  // Check what the resume contains
  const matched = jdTechMatches.filter(k => resumeText.includes(k));
  const missingTech = jdTechMatches.filter(k => !resumeText.includes(k));
  const missingSoft = jdSoftMatches.filter(k => !resumeText.includes(k));

  // Extract meaningful JD words (not stop words)
  const stopWords = new Set(["the", "and", "or", "to", "a", "an", "is", "in", "on", "of", "for", "with", "we", "you", "will", "be", "have", "has", "that", "this", "as", "at", "by", "from", "are"]);
  const jdWords = jdLower.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
  const resumeWords = new Set(resumeText.split(/\W+/));
  const matchedJdWords = [...new Set(jdWords.filter(w => resumeWords.has(w)))].slice(0, 20);
  const missingJdWords = [...new Set(jdWords.filter(w => !resumeWords.has(w)))].slice(0, 15);

  // Score: weighted by keyword presence
  const techWeight = 0.6, softWeight = 0.2, generalWeight = 0.2;
  const techScore = jdTechMatches.length > 0 ? (matched.length / jdTechMatches.length) * 100 : 70;
  const softScore = jdSoftMatches.length > 0 ? ((jdSoftMatches.length - missingSoft.length) / jdSoftMatches.length) * 100 : 70;
  const generalScore = jdWords.length > 0 ? (matchedJdWords.length / Math.min(jdWords.length, 30)) * 100 : 70;

  const rawScore = techWeight * techScore + softWeight * softScore + generalWeight * generalScore;
  const score = Math.min(98, Math.max(12, Math.round(rawScore)));
  const atsCompatibility = Math.min(95, Math.max(20, score + (data.objective ? 5 : -10) + (data.personalInfo?.linkedin ? 5 : 0)));

  const suggestions: string[] = [];
  if (missingTech.length > 0) suggestions.push(`Add these technical skills to your resume: ${missingTech.slice(0, 4).join(", ")}.`);
  if (missingSoft.length > 0) suggestions.push(`Mention soft skills: ${missingSoft.slice(0, 3).join(", ")} — in your objective or experience sections.`);
  if (!data.objective?.summaryText) suggestions.push("Add a career objective tailored to this specific job description.");
  if (!hasMetrics(getAllText(data))) suggestions.push("Add measurable achievements to compete with other candidates.");

  const level = score >= 75 ? "strong" : score >= 50 ? "moderate" : "weak";
  const explanation = `Your resume shows a ${level} match with this job description. You matched ${matched.length} of ${jdTechMatches.length} technical keywords. ${missingTech.length > 0 ? `Adding ${missingTech.slice(0, 2).join(" and ")} to your skills would significantly improve your score.` : "Your tech stack aligns well."} ${score >= 75 ? "You are a competitive applicant for this role." : "Focus on the missing keywords above to strengthen your application."}`;

  return {
    score,
    matchedKeywords: [...matched, ...matchedJdWords.slice(0, 10)],
    missingKeywords: missingJdWords,
    missingTechSkills: missingTech,
    missingSoftSkills: missingSoft,
    suggestions,
    explanation,
    atsCompatibility,
  };
}

// ─── 3. Skill Gap Analysis ───────────────────────────────────────────────────

export function analyzeSkillGap(data: ResumeDetail, targetRole: string, experienceLevel: string): SkillGapResult {
  const currentSkills = (data.skills || []).map(s => s.skillName.toLowerCase());
  const required = (ROLE_SKILLS[targetRole] || ROLE_SKILLS["Software Engineer"]).map(s => ({ orig: s, lower: s.toLowerCase() }));
  const missing = required.filter(r => !currentSkills.some(c => c.includes(r.lower) || r.lower.includes(c)));

  const missingSkillNames = missing.map(m => m.orig);
  const recommendedCerts = ROLE_CERTS[targetRole] || ["AWS Cloud Practitioner", "Google IT Support Certificate"];
  const suggestedProjects = ROLE_PROJECTS[targetRole] || ["Build a portfolio project using your target tech stack", "Contribute to an open-source project", "Create a capstone project demonstrating end-to-end development"];

  const recommendedTech: string[] = [...new Set([
    ...missingSkillNames,
    ...(ROLE_SKILLS[targetRole] || []).slice(0, 5),
  ])].slice(0, 10);

  // Build progressive roadmap
  const roadmap: SkillRoadmapItem[] = missing.slice(0, 6).map((skill, i) => ({
    skill: skill.orig,
    level: i < 2 ? "Beginner" : i < 4 ? "Intermediate" : "Advanced",
    estimatedWeeks: i < 2 ? 3 : i < 4 ? 5 : 8,
    resources: `Search "${skill.orig} tutorial for beginners" on YouTube or freeCodeCamp`,
  }));

  const totalRequired = required.length;
  const matched = totalRequired - missing.length;
  const careerReadinessScore = Math.round((matched / Math.max(totalRequired, 1)) * 100);
  const estimatedMonths = Math.ceil(roadmap.reduce((acc, r) => acc + r.estimatedWeeks, 0) / 4);

  return { currentSkills: (data.skills || []).map(s => s.skillName), missingSkills: missingSkillNames, recommendedTech, recommendedCerts, suggestedProjects, roadmap, careerReadinessScore, estimatedMonths };
}

// ─── 4. Resume Analytics ─────────────────────────────────────────────────────

export function computeAnalytics(data: ResumeDetail): AnalyticsResult {
  const fullText = getAllText(data);
  const wordCount = countWords(fullText);
  const passiveVoiceCount = detectPassiveVoice(fullText);
  const weakVerbCount = detectWeakVerbs(fullText).length;

  // Section status
  const sectionStatus: SectionStatus[] = [
    { name: "Personal Info",    completed: !!data.personalInfo,                                  score: data.personalInfo ? 100 : 0 },
    { name: "Career Objective", completed: !!data.objective?.summaryText,                        score: data.objective?.summaryText ? 100 : 0 },
    { name: "Education",        completed: (data.education || []).length > 0,                    score: Math.min(100, (data.education || []).length * 50) },
    { name: "Skills",           completed: (data.skills || []).length >= 3,                      score: Math.min(100, (data.skills || []).length * 12) },
    { name: "Projects",         completed: (data.projects || []).length > 0,                     score: Math.min(100, (data.projects || []).length * 35) },
    { name: "Experience",       completed: (data.experience || []).length > 0,                   score: Math.min(100, (data.experience || []).length * 50) },
    { name: "Certifications",   completed: (data.certifications || []).length > 0,               score: Math.min(100, (data.certifications || []).length * 50) },
    { name: "Languages",        completed: (data.languages || []).length > 0,                    score: Math.min(100, (data.languages || []).length * 50) },
  ];

  const completedSections = sectionStatus.filter(s => s.completed).length;
  const completenessPercentage = Math.round((completedSections / sectionStatus.length) * 100);

  // ATS score (mirrors backend logic)
  let atsScore = 0;
  if (data.personalInfo) atsScore += 20;
  if (data.objective?.summaryText) atsScore += 10;
  if ((data.education || []).length > 0) atsScore += 20;
  if ((data.skills || []).length >= 3) atsScore += 20;
  if ((data.projects || []).length > 0) atsScore += 15;
  if ((data.experience || []).length > 0) atsScore += 15;
  atsScore = Math.min(100, atsScore);

  // Keyword coverage
  const skillNames = (data.skills || []).map(s => s.skillName.toLowerCase());
  const techCoverage = TECH_KEYWORDS.filter(k => skillNames.some(s => s.includes(k))).length;
  const keywordScore = Math.min(100, Math.round((techCoverage / 10) * 100));

  // Experience strength (action verbs + metrics)
  const expText = (data.experience || []).map(e => e.responsibilities || "").join(" ");
  const projText = (data.projects || []).map(p => p.description || "").join(" ");
  const combinedContent = expText + " " + projText;
  const actionVerbCount = STRONG_VERBS.filter(v => combinedContent.toLowerCase().includes(v.toLowerCase())).length;
  const totalBullets = Math.max(1, (combinedContent.match(/[.!]/g) || []).length);
  const actionVerbPercentage = Math.min(100, Math.round((actionVerbCount / totalBullets) * 100));
  const experienceStrength = Math.min(100, Math.round(
    (actionVerbCount * 8) + (hasMetrics(combinedContent) ? 30 : 0) + Math.min(30, (data.experience || []).length * 15)
  ));

  // Grammar score (based on absence of issues)
  const grammarScore = Math.max(20, 100 - (passiveVoiceCount * 8) - (weakVerbCount * 5));

  // Readability: avg words per sentence
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 20;
  const readabilityScore = avgWordsPerSentence < 15 ? 90 : avgWordsPerSentence < 20 ? 75 : avgWordsPerSentence < 25 ? 60 : 45;

  // Education completeness
  const edu = data.education?.[0];
  const educationCompleteness = !edu ? 0 : [edu.institution, edu.degree, edu.fieldOfStudy, edu.graduationYear, edu.cgpa].filter(Boolean).length * 20;

  // Professionalism score
  const hasLinkedin = !!data.personalInfo?.linkedin;
  const hasPortfolio = !!data.personalInfo?.portfolio;
  const hasPhone = !!data.personalInfo?.phone;
  const professionalismScore = Math.min(100,
    (completenessPercentage * 0.4) +
    (hasLinkedin ? 20 : 0) +
    (hasPortfolio ? 15 : 0) +
    (hasPhone ? 10 : 0) +
    ((data.certifications || []).length > 0 ? 15 : 0)
  );

  // Formatting score
  const formattingScore = Math.min(100,
    completedSections * 8 +
    ((data.skills || []).length >= 5 ? 20 : 10) +
    (wordCount > 150 && wordCount < 800 ? 20 : 10)
  );

  // Skills coverage
  const skillsCoverage = Math.min(100, (data.skills || []).length * 12);

  // Strength score: composite
  const strengthScore = Math.round(
    atsScore * 0.25 + grammarScore * 0.15 + keywordScore * 0.20 +
    experienceStrength * 0.20 + professionalismScore * 0.10 + formattingScore * 0.10
  );

  // Bullet count (approximate from period-terminated sentences in responsibilities)
  const bulletCount = (combinedContent.match(/[.!]/g) || []).length;

  return {
    atsScore, strengthScore, grammarScore, keywordScore, readabilityScore, formattingScore,
    professionalismScore, skillsCoverage, experienceStrength, educationCompleteness,
    completenessPercentage, wordCount, bulletCount, passiveVoiceCount, actionVerbPercentage,
    estimatedReadingTime: Math.max(1, Math.round(wordCount / 200)),
    sectionStatus,
  };
}

// ─── 5. Theme Recommendation ──────────────────────────────────────────────────

export function recommendTheme(data: ResumeDetail): ThemeRecommendation[] {
  const industry = detectIndustry(data);
  const exp = (data.experience || []).length;
  const text = getAllText(data).toLowerCase();

  // Score each template
  const scores = Object.entries(TEMPLATE_META).map(([tidStr, meta]) => {
    const tid = Number(tidStr);
    let score = meta.industries.includes(industry) ? 40 : 10;
    if (meta.industries.includes("general")) score += 5;
    // Experience level adjustments
    if (exp === 0 && [1, 5, 6].includes(tid)) score += 20; // fresher-friendly
    if (exp >= 2 && [4, 9].includes(tid)) score += 15;     // senior-friendly
    if (exp >= 1 && [2, 4].includes(tid)) score += 10;     // experience present
    // Content-based adjustments
    if (text.includes("open source") && [5, 7].includes(tid)) score += 15;
    if (text.includes("startup") && tid === 10) score += 20;
    if (text.includes("research") && [4, 9].includes(tid)) score += 15;
    score += Math.round(Math.random() * 0 + 0); // deterministic
    return { templateId: tid, confidence: Math.min(97, score), meta };
  });

  scores.sort((a, b) => b.confidence - a.confidence);
  const top4 = scores.slice(0, 4);
  const maxConf = top4[0].confidence;

  return top4.map((s, i) => ({
    templateId: s.templateId,
    templateName: s.meta.name,
    confidence: Math.min(97, Math.round(s.confidence * 100 / Math.max(maxConf, 1))),
    reason: s.meta.description,
    industry: s.meta.industries[0],
    isPrimary: i === 0,
  }));
}

// ─── 6. Interview Questions ───────────────────────────────────────────────────

export function generateInterviewQuestions(data: ResumeDetail, jobDescription?: string): Record<QuestionType, InterviewQuestion[]> {
  const skills = (data.skills || []).map(s => s.skillName);
  const projects = (data.projects || []);
  const experience = (data.experience || []);

  const hrQuestions: InterviewQuestion[] = [
    { id: "hr-1", type: "hr", question: "Tell me about yourself.", difficulty: "easy", sampleAnswer: `I'm a ${experience.length > 0 ? "professional with hands-on" : "fresher passionate about"} experience in ${skills.slice(0, 3).join(", ") || "software development"}. ${data.objective?.summaryText || "I'm looking to apply my skills in a challenging role."}`, keyPoints: ["Keep it under 2 minutes", "Focus on professional journey", "End with why you want this role"], tips: "Structure as: Past → Present → Future. Practice until it sounds natural, not rehearsed.", commonMistakes: "Don't share personal life details or start with 'I was born in...'" },
    { id: "hr-2", type: "hr", question: "What are your greatest strengths?", difficulty: "easy", sampleAnswer: `My strongest asset is ${skills[0] || "problem-solving ability"}. For example, I used it in my project '${projects[0]?.projectTitle || "a key project"}' to deliver results ahead of schedule.`, keyPoints: ["Give 2-3 strengths", "Back each with a specific example", "Align strengths with job requirements"], tips: "Pick strengths relevant to the role. Always support with evidence.", commonMistakes: "Don't say 'I work too hard' as a strength — it sounds cliché." },
    { id: "hr-3", type: "hr", question: "Where do you see yourself in 5 years?", difficulty: "medium", sampleAnswer: "In 5 years, I see myself as a senior contributor who has shipped meaningful products and grown into a technical leadership role. I want to develop deep expertise in my domain while mentoring junior engineers.", keyPoints: ["Show ambition but be realistic", "Align with company growth", "Show commitment to growth"], tips: "Research the company's growth trajectory and align your answer with their direction.", commonMistakes: "Don't say you plan to start your own company or leave the industry." },
    { id: "hr-4", type: "hr", question: "Why should we hire you over other candidates?", difficulty: "medium", sampleAnswer: `I combine strong technical skills in ${skills.slice(0, 2).join(" and ") || "relevant technologies"} with a track record of delivering projects. I'm a fast learner and I bring genuine enthusiasm for solving real problems.`, keyPoints: ["Highlight unique combination of skills", "Show cultural fit", "Be confident, not arrogant"], tips: "Study the job description thoroughly and point to 3 specific ways you match their needs.", commonMistakes: "Don't put down other candidates or speak in vague generalities." },
    { id: "hr-5", type: "hr", question: "What is your biggest weakness?", difficulty: "hard", sampleAnswer: "Earlier I tended to spend too much time perfecting code before shipping. I've learned to balance quality with speed by setting personal time-boxes for tasks and seeking early feedback from peers.", keyPoints: ["Be honest about a real weakness", "Show self-awareness", "Demonstrate you're actively improving"], tips: "Choose a genuine weakness that is unrelated to core job requirements, and always end with what you're doing to overcome it.", commonMistakes: "Don't say 'I have no weaknesses' or pick obvious dealbreakers for the role." },
  ];

  const technicalQuestions: InterviewQuestion[] = skills.slice(0, 5).map((skill, i) => {
    const questions: Record<string, Partial<InterviewQuestion>> = {
      "javascript": { question: "Explain the difference between `let`, `const`, and `var` in JavaScript.", sampleAnswer: "`var` is function-scoped and hoisted. `let` and `const` are block-scoped and not hoisted. `const` prevents reassignment. Prefer `const` by default, `let` when reassignment is needed, and avoid `var`." },
      "react": { question: "What are React Hooks and why were they introduced?", sampleAnswer: "Hooks (useState, useEffect, etc.) allow function components to have state and side effects, which were previously only possible in class components. They make logic reusable through custom hooks and avoid the complexity of `this` in class components." },
      "python": { question: "What is the difference between a list and a tuple in Python?", sampleAnswer: "Lists are mutable (can be changed after creation) while tuples are immutable. Tuples are faster and used for fixed data, like function return values or dictionary keys." },
      "sql": { question: "Explain the difference between INNER JOIN and LEFT JOIN.", sampleAnswer: "INNER JOIN returns only rows where there is a match in both tables. LEFT JOIN returns all rows from the left table, with NULLs for non-matching rows in the right table." },
      "node.js": { question: "What is the event loop in Node.js and how does it work?", sampleAnswer: "The event loop is what allows Node.js to perform non-blocking I/O despite being single-threaded. It processes callbacks from the callback queue once the call stack is empty, enabling async operations." },
    };
    const specific = questions[skill.toLowerCase()];
    return {
      id: `tech-${i}`,
      type: "technical" as const,
      question: specific?.question || `Explain how you have used ${skill} in your projects and what makes you confident with it.`,
      difficulty: i < 2 ? "easy" : i < 4 ? "medium" : "hard",
      sampleAnswer: specific?.sampleAnswer || `In my ${projects[0]?.projectTitle || "recent project"}, I used ${skill} to ${projects[0]?.description?.split(".")[0] || "build key features"}. I am comfortable with its core concepts and have applied it in real scenarios.`,
      keyPoints: [`Show hands-on experience with ${skill}`, "Give a real example from your projects", "Mention any best practices you follow"],
      tips: `Prepare 2–3 code-level examples with ${skill}. Be ready to explain 'why' you made certain choices.`,
      commonMistakes: "Don't just define the technology — show you know HOW to use it and WHEN to use it.",
    };
  });

  const projectQuestions: InterviewQuestion[] = projects.slice(0, 3).map((proj, i) => ({
    id: `proj-${i}`,
    type: "project" as const,
    question: `Walk me through your project "${proj.projectTitle}". What problem did it solve and what was your contribution?`,
    difficulty: "medium" as const,
    sampleAnswer: `${proj.projectTitle} was built to ${proj.description?.split(".")[0] || "solve a real problem"}. I used ${proj.technologies || "the relevant tech stack"} and my role was ${proj.role || "lead developer"}. The biggest challenge was [describe a technical challenge] which I solved by [your approach].`,
    keyPoints: ["Explain the problem it solves", "Clarify YOUR specific role", "Mention technical decisions made", "Share outcomes/metrics if available"],
    tips: "Use the STAR method: Situation → Task → Action → Result. Practice explaining it in 90 seconds.",
    commonMistakes: "Don't just describe what the project does — focus on your decision-making process and contributions.",
  }));

  const behavioralQuestions: InterviewQuestion[] = [
    { id: "beh-1", type: "behavioral", question: "Tell me about a time you faced a difficult technical challenge. How did you resolve it?", difficulty: "medium", sampleAnswer: "During my project, I encountered a performance issue where the page loaded slowly. I profiled the code, identified N+1 database queries, and refactored using batch fetching. Page load time improved by 60%.", keyPoints: ["Use STAR format", "Quantify the impact", "Show problem-solving process"], tips: "Prepare 3-4 STAR stories before the interview. They work across multiple question types.", commonMistakes: "Don't give a vague answer — be specific about what YOU did, not what 'we' did." },
    { id: "beh-2", type: "behavioral", question: "Describe a situation where you had to meet a tight deadline. What was your approach?", difficulty: "medium", sampleAnswer: "During exam season, I had to submit a course project in 3 days. I broke it into daily milestones, focused on core features first (MVP approach), and cut non-essential features. I delivered on time and got an A.", keyPoints: ["Show prioritization", "Demonstrate time management", "Show you can work under pressure"], tips: "Choose an example where your planning skills made the difference. Avoid saying you 'just worked harder'.", commonMistakes: "Don't mention situations where you failed to meet the deadline, unless the learning was significant." },
    { id: "beh-3", type: "behavioral", question: "Tell me about a time you disagreed with a teammate. How did you handle it?", difficulty: "hard", sampleAnswer: "My teammate and I disagreed on the database choice for our project. I listened to their perspective, then presented data comparing options. We agreed to prototype both and chose based on actual performance. It taught me the value of data-driven decisions.", keyPoints: ["Show emotional intelligence", "Demonstrate collaboration", "Show focus on the team goal"], tips: "Always frame disagreements as learning experiences, not wins or losses.", commonMistakes: "Don't make the other person look bad. Focus on the resolution, not the conflict." },
  ];

  const scenarioQuestions: InterviewQuestion[] = [
    { id: "scen-1", type: "scenario", question: "You discover a critical bug in production 30 minutes before a major product demo. What do you do?", difficulty: "hard", sampleAnswer: "First, I assess severity — can we demo without that feature? If yes, flag it and prepare to address questions. If not, I look for a quick patch or feature flag to disable it. I communicate proactively with the team and document the bug immediately after.", keyPoints: ["Stay calm and prioritize", "Communicate proactively", "Show decision-making under pressure"], tips: "Interviewers want to see your crisis management process. Think out loud.", commonMistakes: "Don't say you'd hide the bug or just 'restart the server' without diagnosing." },
    { id: "scen-2", type: "scenario", question: "How would you approach building a new feature you've never built before?", difficulty: "medium", sampleAnswer: "I'd start by understanding requirements thoroughly, then research how others have solved similar problems. I'd build a small prototype, get early feedback, iterate, write tests, and document my approach. I'd also ask more experienced teammates for code review.", keyPoints: ["Show structured thinking", "Demonstrate learning approach", "Show openness to feedback"], tips: "Mention mentorship/collaboration as part of your approach — it shows humility and team orientation.", commonMistakes: "Don't say you'd just 'Google it' without showing a structured thought process." },
  ];

  return { hr: hrQuestions, technical: technicalQuestions, project: projectQuestions, behavioral: behavioralQuestions, scenario: scenarioQuestions };
}

// ─── 7. Mock Interview Answer Evaluation ─────────────────────────────────────

export function evaluateMockAnswer(question: string, userAnswer: string, sampleAnswer: string, keyPoints: string[]): AnswerEvaluation {
  if (!userAnswer.trim()) {
    return {
      answerScore: 0, communicationScore: 0, technicalScore: 0, confidenceScore: 0,
      suggestions: ["Please provide an answer to evaluate."],
      betterAnswer: sampleAnswer,
      followUpQuestions: ["Can you elaborate on your approach?"],
    };
  }

  const answerWords = userAnswer.toLowerCase().split(/\s+/).filter(Boolean);
  const sampleWords = sampleAnswer.toLowerCase().split(/\s+/).filter(Boolean);
  const sampleKeywords = new Set(sampleWords.filter(w => w.length > 4));

  // Keyword overlap with sample
  const keywordMatches = answerWords.filter(w => sampleKeywords.has(w)).length;
  const keywordScore = Math.min(100, Math.round((keywordMatches / Math.max(sampleKeywords.size * 0.4, 1)) * 100));

  // Length/communication score
  const wordCount = answerWords.length;
  const communicationScore = wordCount < 20 ? 30 : wordCount < 50 ? 60 : wordCount < 200 ? 85 : 70;

  // Structure score (has paragraphs, examples, numbers)
  const hasExample = /for example|instance|when i|during|in my project|i built|i worked/i.test(userAnswer);
  const hasNumber = /\d+/.test(userAnswer);
  const hasStructure = userAnswer.includes(".") && userAnswer.split(".").length > 2;
  const structureScore = (hasExample ? 30 : 0) + (hasNumber ? 20 : 0) + (hasStructure ? 20 : 0) + 30;

  // Technical accuracy (key point coverage)
  const kpCoverage = keyPoints.filter(kp => kp.toLowerCase().split(/\s+/).some(w => userAnswer.toLowerCase().includes(w))).length;
  const technicalScore = Math.min(100, Math.round((kpCoverage / Math.max(keyPoints.length, 1)) * 100) + 20);

  const answerScore = Math.round(keywordScore * 0.3 + communicationScore * 0.3 + structureScore * 0.2 + technicalScore * 0.2);
  const confidenceScore = Math.min(100, Math.round(communicationScore * 0.6 + structureScore * 0.4));

  const suggestions: string[] = [];
  if (wordCount < 40) suggestions.push("Your answer is too brief. Aim for at least 60–100 words with a specific example.");
  if (!hasExample) suggestions.push("Add a concrete example from your experience using the STAR method.");
  if (!hasNumber) suggestions.push("Include specific numbers or outcomes to make your answer more impactful.");
  if (kpCoverage < keyPoints.length * 0.5) suggestions.push(`Cover these key points: ${keyPoints.slice(0, 2).join(", ")}.`);
  if (communicationScore < 60) suggestions.push("Structure your answer with a clear beginning, middle, and conclusion.");

  const followUpQuestions = [
    `Can you give a specific example from your project work?`,
    `How did that experience shape your current approach to ${question.split(" ").slice(0, 4).join(" ")}?`,
    `What would you do differently if faced with this situation again?`,
  ];

  return { answerScore, communicationScore, technicalScore, confidenceScore, suggestions, betterAnswer: sampleAnswer, followUpQuestions };
}

export function computeInterviewReport(evaluations: AnswerEvaluation[], questions: InterviewQuestion[]): InterviewReport {
  if (evaluations.length === 0) {
    return { overallScore: 0, strengths: [], weaknesses: [], missingKnowledge: [], suggestedTopics: [], hiringReadiness: "Incomplete", questionResults: [] };
  }

  const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
  const overallScore = avg(evaluations.map(e => e.answerScore));
  const avgComm = avg(evaluations.map(e => e.communicationScore));
  const avgTech = avg(evaluations.map(e => e.technicalScore));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (avgComm >= 70) strengths.push("Clear and structured communication");
  if (avgTech >= 70) strengths.push("Good technical knowledge demonstrated");
  if (overallScore >= 75) strengths.push("Strong overall interview performance");
  if (evaluations.some(e => e.answerScore >= 80)) strengths.push("Excellent answers on key questions");

  if (avgComm < 60) weaknesses.push("Communication needs more structure and conciseness");
  if (avgTech < 60) weaknesses.push("Technical depth needs improvement");
  if (evaluations.some(e => e.communicationScore < 40)) weaknesses.push("Some answers were too brief");
  if (overallScore < 50) weaknesses.push("Overall preparation needs significant improvement");

  const hiringReadiness = overallScore >= 80 ? "Strong Hire" : overallScore >= 65 ? "Hire" : overallScore >= 50 ? "Maybe" : "Not Ready Yet";
  const suggestedTopics = evaluations.flatMap(e => e.suggestions).slice(0, 5);
  const missingKnowledge = evaluations.flatMap(e => e.followUpQuestions).slice(0, 3);

  return {
    overallScore,
    strengths: strengths.length > 0 ? strengths : ["Shows willingness to learn"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Minor areas to polish"],
    missingKnowledge,
    suggestedTopics,
    hiringReadiness,
    questionResults: questions.map((q, i) => ({ question: q.question, score: evaluations[i]?.answerScore ?? 0 })),
  };
}
