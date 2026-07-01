// Rule-based resume text -> structured data extractor.
//
// Deliberately not LLM-based: no API key, no network call, no per-upload cost.
// Uses section-header detection + regex/heuristics for contact info, dates,
// and common resume entry patterns. Works well on reasonably standard
// single-column layouts; heavily designed/columnar resumes may need manual
// correction — that's what the Review step (frontend) is for. This mirrors
// how the app's ATS Score checker is also rule-based rather than AI-based.

export type SkillProficiency = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type LanguageProficiency = "Native" | "Fluent" | "Intermediate" | "Basic";

export interface ExtractedPersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  address: string;
}
export interface ExtractedEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number | null;
  cgpa: string;
}
export interface ExtractedSkill {
  skillName: string;
  proficiencyLevel: SkillProficiency;
}
export interface ExtractedProject {
  projectTitle: string;
  description: string;
  technologies: string;
  projectLink: string;
}
export interface ExtractedExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
}
export interface ExtractedCertification {
  certName: string;
  issuingOrg: string;
  dateIssued: string;
}
export interface ExtractedLanguage {
  languageName: string;
  proficiency: LanguageProficiency;
}

export interface ExtractedResume {
  personalInfo: ExtractedPersonalInfo;
  objective: string;
  education: ExtractedEducation[];
  skills: ExtractedSkill[];
  projects: ExtractedProject[];
  experience: ExtractedExperience[];
  certifications: ExtractedCertification[];
  languages: ExtractedLanguage[];
  warnings: string[];
}

// ── Section header detection ──────────────────────────────────────────────

type SectionKey = "objective" | "education" | "experience" | "projects" | "skills" | "certifications" | "languages";

const SECTION_PATTERNS: Array<{ key: SectionKey; regex: RegExp }> = [
  { key: "objective", regex: /^(career\s+objective|objective|professional\s+summary|summary|profile|about\s+me)\s*:?$/i },
  { key: "education", regex: /^education(al)?(\s+background|\s+qualifications?)?\s*:?$/i },
  { key: "experience", regex: /^(work\s+experience|professional\s+experience|employment(\s+history)?|experience|internship(s)?)\s*:?$/i },
  { key: "projects", regex: /^(personal\s+|academic\s+|key\s+)?projects?\s*:?$/i },
  { key: "skills", regex: /^(technical\s+|key\s+|core\s+)?skills?(\s+&\s+tools)?\s*:?$/i },
  { key: "certifications", regex: /^(certifications?|certificates?|achievements?(\s+&\s+awards)?|awards?(\s+&\s+honou?rs)?|honou?rs?)\s*:?$/i },
  { key: "languages", regex: /^languages?(\s+known)?\s*:?$/i },
];

function isLikelySectionHeader(line: string): SectionKey | null {
  const cleaned = line.trim().replace(/[*_]+/g, "");
  if (!cleaned || cleaned.length > 50) return null;
  for (const { key, regex } of SECTION_PATTERNS) {
    if (regex.test(cleaned)) return key;
  }
  return null;
}

interface SectionRange {
  key: SectionKey;
  start: number;
  end: number;
}

function splitIntoSections(lines: string[]): { preamble: string[]; sections: SectionRange[] } {
  const headers: Array<{ key: SectionKey; line: number }> = [];
  lines.forEach((line, i) => {
    const key = isLikelySectionHeader(line);
    if (key) headers.push({ key, line: i });
  });

  const preamble = headers.length > 0 ? lines.slice(0, headers[0].line) : lines.slice();
  const sections: SectionRange[] = headers.map((h, i) => ({
    key: h.key,
    start: h.line + 1,
    end: i + 1 < headers.length ? headers[i + 1].line : lines.length,
  }));

  return { preamble, sections };
}

function sectionText(lines: string[], range: SectionRange | undefined): string[] {
  if (!range) return [];
  return lines.slice(range.start, range.end).filter(l => l.trim().length > 0);
}

function groupBy(sections: SectionRange[], key: SectionKey): SectionRange | undefined {
  return sections.find(s => s.key === key);
}

// Some resumes repeat the same section key (e.g. "Achievements" detected
// separately from "Certifications") — merge their line ranges.
function allRangesFor(sections: SectionRange[], key: SectionKey): SectionRange[] {
  return sections.filter(s => s.key === key);
}

// ── Contact info ───────────────────────────────────────────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const LINKEDIN_RE = /(https?:\/\/)?(www\.)?linkedin\.com\/[a-zA-Z0-9\-_/%]+/i;
const GITHUB_RE = /(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9\-_/%]+/i;
const PHONE_CANDIDATE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3,5}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;

function extractEmail(text: string): string {
  return text.match(EMAIL_RE)?.[0] ?? "";
}

function extractLinkedin(text: string): string {
  return text.match(LINKEDIN_RE)?.[0] ?? "";
}

function extractGithubOrPortfolio(text: string): string {
  const github = text.match(GITHUB_RE)?.[0];
  if (github) return github;
  // Fall back to any other http(s) URL that isn't an email domain or LinkedIn.
  const urlMatch = text.match(/https?:\/\/[^\s,)]+/i);
  return urlMatch && !LINKEDIN_RE.test(urlMatch[0]) ? urlMatch[0] : "";
}

function extractPhone(text: string): string {
  const candidates = text.match(PHONE_CANDIDATE_RE) ?? [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length === 10) return digits;
    if (digits.length > 10 && digits.length <= 13) return digits.slice(-10);
  }
  return "";
}

function extractFullName(preamble: string[]): string {
  for (const rawLine of preamble.slice(0, 5)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (EMAIL_RE.test(line) || /\d{4,}/.test(line) || /https?:\/\//i.test(line) || /linkedin\.com|github\.com/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 1 && words.length <= 5 && /^[A-Za-z][A-Za-z.'\-\s]*$/.test(line)) {
      return line.replace(/\s+/g, " ").trim();
    }
  }
  return "";
}

function extractAddress(preamble: string[], skipLines: Set<string>): string {
  for (const rawLine of preamble.slice(0, 6)) {
    const line = rawLine.trim();
    if (!line || skipLines.has(line)) continue;
    if (EMAIL_RE.test(line) || LINKEDIN_RE.test(line) || GITHUB_RE.test(line)) continue;
    if (/^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(line) && line.length < 60) return line;
  }
  return "";
}

// ── Shared helpers ───────────────────────────────────────────────────────

const BULLET_RE = /^[•\-*▪‣◦]\s*/;

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, "").trim();
}

// Groups a section's lines into entry blocks. Resumes use two different,
// mutually-incompatible bullet conventions and we have to guess which one a
// given section uses from plain text alone (no font/indent info survives
// PDF/DOCX text extraction):
//   Mode A — bullets mark responsibility/detail lines *within* one entry
//            (header line, then several "- did X" bullets, then next header).
//   Mode B — a single bullet marks an entry's *title*, with unbulleted
//            flowing prose as its description (title, prose, prose, next
//            bulleted title, prose...).
// Consecutive bullet lines only make sense under Mode A (a list of detail
// bullets together) — that's the signal used to pick a mode per section.
const LINK_ONLY_LINE_RE = /^(https?:\/\/\S+|(www\.)?[\w-]+\.(com|in|io|dev|org|net)\/\S+)$/i;

// PDF/DOCX text extraction frequently drops the bullet marker when a bullet's
// sentence wraps onto a second visual line, so a wrapped continuation line
// can look identical to a "new entry" line. A line starting with a lowercase
// letter is almost never the start of a new entry/sentence — titles and new
// sentences start capitalized — so treat it as a continuation regardless of
// bullet state. Without this, a single paragraph-style bullet gets shredded
// into one phantom entry per wrapped line.
const STARTS_LOWERCASE_RE = /^[a-z]/;

// A short, fully-uppercase line is almost always a title, never wrapped prose
// (prose mixes case) — a reliable entry-start signal where titles aren't
// reliably bulleted. Opt-in only (see groupEntries' allowAllCapsTitle param)
// since it risks misfiring on all-caps institution names inside Education.
const ALL_CAPS_TITLE_RE = /^[A-Z][A-Z0-9 ,&()'\-:/]{2,49}$/;

function groupEntries(lines: string[], allowAllCapsTitle = false): string[][] {
  const bulletCount = lines.filter(l => BULLET_RE.test(l)).length;
  const hasConsecutiveBullets = lines.some((l, i) => BULLET_RE.test(l) && i + 1 < lines.length && BULLET_RE.test(lines[i + 1]));
  // Mode B requires at least two non-consecutive bullets — a real pattern of
  // "one bullet marks one entry" repeated across multiple entries. A single
  // isolated bullet is ambiguous (it's equally likely to be one detail point
  // inside an otherwise non-bulleted entry, as in a project with one summary
  // bullet) and defaults to Mode A, the safer/more common convention.
  const mode: "A" | "B" = (!hasConsecutiveBullets && bulletCount >= 2) ? "B" : "A";

  const blocks: string[][] = [];
  let current: string[] = [];
  let sawBulletInCurrent = false;

  for (const line of lines) {
    const isBullet = BULLET_RE.test(line);
    const trimmed = line.trim();
    // A bare link line, or a lowercase-starting line (wrapped continuation),
    // is always a continuation of the current entry, never the start of a new one.
    const isContinuationOnly = LINK_ONLY_LINE_RE.test(trimmed) || STARTS_LOWERCASE_RE.test(trimmed);
    const isAllCapsTitle = allowAllCapsTitle && !isContinuationOnly && ALL_CAPS_TITLE_RE.test(trimmed);

    const shouldFlush = current.length > 0 && !isContinuationOnly && (
      mode === "A"
        ? (!isBullet && sawBulletInCurrent) // non-bullet line ends the previous entry's bullet list
        : (isBullet || isAllCapsTitle) // Mode B: the bullet/title itself starts the new entry
    );
    if (shouldFlush) {
      blocks.push(current);
      current = [];
      sawBulletInCurrent = false;
    }
    current.push(line);
    if (isBullet) sawBulletInCurrent = true;
  }
  if (current.length > 0) blocks.push(current);
  return blocks;
}

const YEAR_RE = /\b(19|20)\d{2}\b/g;

function lastYear(text: string): number | null {
  const matches = text.match(YEAR_RE);
  if (!matches || matches.length === 0) return null;
  return parseInt(matches[matches.length - 1], 10);
}

const DATE_RANGE_RE = /([A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4})\s*(?:[-–—to]+)\s*([A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}\/\d{4}|\d{4}|present|current|ongoing|now)/i;

function extractDateRange(text: string): { startDate: string; endDate: string; isCurrent: boolean } | null {
  const m = text.match(DATE_RANGE_RE);
  if (!m) return null;
  const isCurrent = /present|current|ongoing|now/i.test(m[2]);
  return { startDate: m[1].trim(), endDate: isCurrent ? "" : m[2].trim(), isCurrent };
}

// ── Section parsers ────────────────────────────────────────────────────────

const DEGREE_RE = /\b(B\.?\s?Tech|M\.?\s?Tech|B\.?\s?E|M\.?\s?E|B\.?\s?Sc|M\.?\s?Sc|B\.?\s?A|M\.?\s?A|BBA|MBA|BCA|MCA|Ph\.?\s?D|Bachelor'?s?|Master'?s?|Diploma|Associate'?s?)\b\.?\s*(?:degree\s*)?(?:in|of)?\s*([A-Za-z][A-Za-z &,\-]*)?/i;
const INSTITUTION_RE = /\b([A-Za-z][A-Za-z .,&'\-]*(?:University|College|Institute|School|Academy|Polytechnic)[A-Za-z .,&'\-]*)\b/i;
const CGPA_RE = /(?:cgpa|gpa)\s*[:\-]?\s*(\d{1,2}(?:\.\d{1,2})?)/i;
const PERCENT_RE = /(\d{1,3}(?:\.\d{1,2})?)\s*%/;

function parseEducation(lines: string[]): ExtractedEducation[] {
  const blocks = groupEntries(lines);
  const out: ExtractedEducation[] = [];
  for (const block of blocks) {
    const cleanLines = block.map(stripBullet).filter(Boolean);
    if (cleanLines.length === 0) continue;
    const blockText = cleanLines.join(" ");

    // Match degree/institution against individual lines, not the whole
    // joined block — otherwise a greedy fieldOfStudy capture bleeds into
    // whatever institution text follows on the next line.
    const degreeLine = cleanLines.find(l => DEGREE_RE.test(l));
    const degreeMatch = degreeLine?.match(DEGREE_RE);
    const institutionLine = cleanLines.find(l => INSTITUTION_RE.test(l));
    const institutionMatch = institutionLine?.match(INSTITUTION_RE);
    const cgpaMatch = blockText.match(CGPA_RE);
    const percentMatch = !cgpaMatch ? blockText.match(PERCENT_RE) : null;

    out.push({
      degree: degreeMatch?.[1]?.trim() ?? "",
      fieldOfStudy: degreeMatch?.[2]?.trim() ?? "",
      institution: institutionMatch?.[1]?.trim() ?? institutionLine ?? cleanLines[0],
      graduationYear: lastYear(blockText),
      cgpa: cgpaMatch ? cgpaMatch[1] : percentMatch ? `${percentMatch[1]}%` : "",
    });
  }
  return out;
}

const TECH_LINE_RE = /^(tech(nologies)?|tools?|stack)\s*[:\-]/i;
const LINK_RE = /https?:\/\/[^\s,)]+|github\.com\/[^\s,)]+/i;

function parseProjects(lines: string[]): ExtractedProject[] {
  const blocks = groupEntries(lines, true);
  const out: ExtractedProject[] = [];
  for (const block of blocks) {
    if (block.length === 0) continue;
    const title = stripBullet(block[0]).replace(/[:\-–]\s*$/, "");
    if (!title) continue;

    let technologies = "";
    const descLines: string[] = [];
    for (const raw of block.slice(1)) {
      const line = stripBullet(raw);
      if (TECH_LINE_RE.test(line)) {
        technologies = line.replace(TECH_LINE_RE, "").trim();
      } else if (line && !LINK_ONLY_LINE_RE.test(line)) {
        descLines.push(line);
      }
    }
    const linkMatch = block.join(" ").match(LINK_RE);

    out.push({
      projectTitle: title,
      description: descLines.join(" ").trim(),
      technologies,
      projectLink: linkMatch?.[0] ?? "",
    });
  }
  return out;
}

// When position and company sit on two separate lines, their order varies
// by resume ("Role" then "Company", or "Company" then "Role"). Use job-title
// vs. organization-name keyword hints to pick the right order instead of
// always assuming the first line is the role.
const JOB_TITLE_HINT_RE = /\b(engineer|developer|programmer|manager|intern(ship)?|analyst|designer|specialist|officer|executive|consultant|director|lead|architect|administrator|coordinator|associate|assistant|scientist|researcher)\b/i;
const ORG_HINT_RE = /\b(ltd|pvt|llc|inc|corp|corporation|company|co\.|llp|municipal|university|college|institute|technologies|labs|solutions|systems|group|enterprises)\b/i;

function orderPositionCompany(lineA: string, lineB: string): [string, string] {
  const aLooksOrg = ORG_HINT_RE.test(lineA) && !JOB_TITLE_HINT_RE.test(lineA);
  const bLooksTitle = JOB_TITLE_HINT_RE.test(lineB) && !ORG_HINT_RE.test(lineB);
  // Swap when the first line reads like an org/company name and the second
  // reads like a job title — the default assumption is position-then-company.
  if (aLooksOrg && bLooksTitle) return [lineB, lineA];
  return [lineA, lineB];
}

function parseExperience(lines: string[]): ExtractedExperience[] {
  const blocks = groupEntries(lines);
  const out: ExtractedExperience[] = [];
  for (const block of blocks) {
    const cleanLines = block.map(stripBullet).filter(Boolean);
    if (cleanLines.length === 0) continue;

    const headerLineIdx = cleanLines.findIndex(l => DATE_RANGE_RE.test(l));
    const dateLine = headerLineIdx >= 0 ? cleanLines[headerLineIdx] : "";
    const dateRange = extractDateRange(dateLine) ?? { startDate: "", endDate: "", isCurrent: false };

    // Title is usually alongside the date on the same line ("Role, Company  Jan 2022 - Mar 2023").
    const sameLineTitle = dateLine.replace(DATE_RANGE_RE, "").replace(/[,|\-–]+\s*$/, "").trim();

    let position = "";
    let company = "";
    const consumedIdx = new Set<number>([headerLineIdx]);
    const splitTitle = (text: string): [string, string] | null => {
      const atSplit = text.split(/\s+at\s+|\s*@\s*/i);
      if (atSplit.length === 2) return [atSplit[0], atSplit[1]];
      // Require whitespace around the hyphen so mid-word hyphens (e.g. "Front-End") don't split.
      const dashSplit = text.split(/\s+-\s+|\s*[,|]\s*/);
      if (dashSplit.length === 2) return [dashSplit[0], dashSplit[1]];
      return null;
    };

    if (sameLineTitle) {
      const split = splitTitle(sameLineTitle);
      if (split) [position, company] = split;
      else position = sameLineTitle;
    } else if (headerLineIdx >= 2 && splitTitle(cleanLines[headerLineIdx - 1]) === null && splitTitle(cleanLines[headerLineIdx - 2]) === null) {
      // Position and company sit on two separate preceding lines, in either order
      // ("Frontend Developer" / "PixelWorks Pvt Ltd" / "Jan 2023 - Present").
      [position, company] = orderPositionCompany(cleanLines[headerLineIdx - 2], cleanLines[headerLineIdx - 1]);
      consumedIdx.add(headerLineIdx - 1);
      consumedIdx.add(headerLineIdx - 2);
    } else if (headerLineIdx > 0) {
      const prevLine = cleanLines[headerLineIdx - 1];
      const split = splitTitle(prevLine);
      if (split) [position, company] = split;
      else position = prevLine;
      consumedIdx.add(headerLineIdx - 1);
    } else {
      // No date range found anywhere in this entry (e.g. an internship listed
      // without dates) — best effort from the first one or two non-bullet lines.
      const headerCandidates = cleanLines
        .map((l, i) => ({ l, i }))
        .filter(({ l }) => !BULLET_RE.test(l))
        .slice(0, 2);
      if (headerCandidates.length === 2) {
        [position, company] = orderPositionCompany(headerCandidates[0].l, headerCandidates[1].l);
        consumedIdx.add(headerCandidates[0].i);
        consumedIdx.add(headerCandidates[1].i);
      } else if (headerCandidates.length === 1) {
        const split = splitTitle(headerCandidates[0].l);
        if (split) [position, company] = split;
        else position = headerCandidates[0].l;
        consumedIdx.add(headerCandidates[0].i);
      }
    }

    const descLines = cleanLines.filter((_, i) => !consumedIdx.has(i));

    out.push({
      company: company.trim(),
      position: position.trim(),
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      isCurrent: dateRange.isCurrent,
      responsibilities: descLines.join(" ").trim(),
    });
  }
  return out;
}

function splitTokens(lines: string[]): string[] {
  return lines
    .flatMap(l => stripBullet(l).split(/[,•|·;]/))
    .map(t => t.trim())
    .filter(t => t.length > 0 && t.length <= 40);
}

function parseSkills(lines: string[]): ExtractedSkill[] {
  const tokens = splitTokens(lines).map(t => t.replace(TECH_LINE_RE, "").trim());
  const seen = new Set<string>();
  const out: ExtractedSkill[] = [];
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (!token || seen.has(key)) continue;
    seen.add(key);
    out.push({ skillName: token, proficiencyLevel: "Intermediate" });
    if (out.length >= 40) break;
  }
  return out;
}

function parseCertifications(lines: string[]): ExtractedCertification[] {
  const out: ExtractedCertification[] = [];
  for (const raw of lines) {
    const line = stripBullet(raw);
    if (!line) continue;
    const year = lastYear(line);
    // Require whitespace around the hyphen so mid-word hyphens (e.g. "Front-End")
    // aren't mistaken for the certName/issuingOrg separator.
    const parts = line.split(/\s+-\s+|\s*\|\s*|,\s*/).map(p => p.trim()).filter(Boolean);
    out.push({
      certName: parts[0] ?? line,
      issuingOrg: parts.length > 1 ? parts[1].replace(YEAR_RE, "").trim() : "",
      dateIssued: year ? String(year) : "",
    });
  }
  return out;
}

const LANG_PROFICIENCY_RE = /\((native|fluent|intermediate|basic|beginner|advanced|proficient|conversational)\)/i;

function mapLanguageProficiency(hint: string | undefined): LanguageProficiency {
  if (!hint) return "Intermediate";
  const v = hint.toLowerCase();
  if (v === "native") return "Native";
  if (v === "fluent" || v === "advanced" || v === "proficient") return "Fluent";
  if (v === "basic" || v === "beginner") return "Basic";
  return "Intermediate";
}

function parseLanguages(lines: string[]): ExtractedLanguage[] {
  const out: ExtractedLanguage[] = [];
  const seen = new Set<string>();
  for (const raw of lines) {
    for (const token of stripBullet(raw).split(/[,•|·;]/)) {
      const trimmed = token.trim();
      if (!trimmed) continue;
      const proficiencyMatch = trimmed.match(LANG_PROFICIENCY_RE);
      const name = trimmed.replace(LANG_PROFICIENCY_RE, "").trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key)) continue;
      seen.add(key);
      out.push({ languageName: name, proficiency: mapLanguageProficiency(proficiencyMatch?.[1]) });
    }
  }
  return out;
}

// ── Entry point ─────────────────────────────────────────────────────────

export function extractResumeData(rawText: string): ExtractedResume {
  const warnings: string[] = [];

  const normalized = rawText.replace(/\r\n/g, "\n").replace(/ /g, " ");
  const lines = normalized.split("\n").map(l => l.trim());
  const nonEmptyLines = lines.filter(l => l.length > 0);

  if (nonEmptyLines.length === 0) {
    warnings.push("Couldn't extract any readable text from this file. Please fill in the form manually.");
    return {
      personalInfo: { fullName: "", email: "", phone: "", linkedin: "", portfolio: "", address: "" },
      objective: "", education: [], skills: [], projects: [], experience: [], certifications: [], languages: [],
      warnings,
    };
  }

  const { preamble, sections } = splitIntoSections(nonEmptyLines);
  const fullText = nonEmptyLines.join("\n");

  const fullName = extractFullName(preamble);
  const email = extractEmail(fullText);
  const phone = extractPhone(fullText);
  const linkedin = extractLinkedin(fullText);
  const portfolio = extractGithubOrPortfolio(fullText);
  const address = extractAddress(preamble, new Set([fullName]));

  if (!fullName) warnings.push("Couldn't detect your name — please fill it in.");
  if (!email) warnings.push("Couldn't detect an email address — please fill it in.");
  if (!phone) warnings.push("Couldn't detect a 10-digit phone number — please fill it in.");

  const objectiveRange = groupBy(sections, "objective");
  let objective = sectionText(nonEmptyLines, objectiveRange).join(" ").trim();
  if (!objective) {
    // Fall back to a preamble paragraph that isn't just contact info.
    const candidate = preamble
      .filter(l => l && l !== fullName && !EMAIL_RE.test(l) && !LINKEDIN_RE.test(l) && !GITHUB_RE.test(l) && l !== address)
      .join(" ")
      .trim();
    if (candidate.length > 30) objective = candidate;
  }
  if (!objective) warnings.push("No career objective/summary detected — please add one.");

  const education = parseEducation(sectionText(nonEmptyLines, groupBy(sections, "education")));
  if (education.length === 0) warnings.push("No education entries detected — please add your education.");

  const experience = parseExperience(sectionText(nonEmptyLines, groupBy(sections, "experience")));

  const projects = parseProjects(sectionText(nonEmptyLines, groupBy(sections, "projects")));

  const skills = parseSkills(sectionText(nonEmptyLines, groupBy(sections, "skills")));
  if (skills.length === 0) warnings.push("No skills detected — please add at least a few skills.");

  const certLines = allRangesFor(sections, "certifications").flatMap(r => sectionText(nonEmptyLines, r));
  const certifications = parseCertifications(certLines);

  const languages = parseLanguages(sectionText(nonEmptyLines, groupBy(sections, "languages")));

  return {
    personalInfo: { fullName, email, phone, linkedin, portfolio, address },
    objective,
    education,
    skills,
    projects,
    experience,
    certifications,
    languages,
    warnings,
  };
}
