import { Router } from "express";
import { db, resumesTable, personalInfoTable, careerObjectiveTable, educationTable, skillsTable, projectsTable, experienceTable, certificationsTable, languagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import crypto from "crypto";

const router = Router();

// GET /resumes
router.get("/resumes", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumes = await db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId!)).orderBy(desc(resumesTable.updatedAt));
    res.json(resumes);
  } catch (err) {
    logger.error({ err }, "List resumes error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /resumes
router.post("/resumes", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { resumeName, templateId } = req.body;
    if (!resumeName) {
      res.status(400).json({ error: "Resume name is required" });
      return;
    }
    const [resume] = await db.insert(resumesTable).values({
      userId: req.userId!,
      resumeName,
      templateId: templateId || 1,
      isPublic: false,
    }).returning();
    res.status(201).json(resume);
  } catch (err) {
    logger.error({ err }, "Create resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /resumes/:resumeId
router.get("/resumes/:resumeId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const [resume] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId!))).limit(1);
    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    const [personalInfo] = await db.select().from(personalInfoTable).where(eq(personalInfoTable.resumeId, resumeId)).limit(1);
    const [objective] = await db.select().from(careerObjectiveTable).where(eq(careerObjectiveTable.resumeId, resumeId)).limit(1);
    const education = await db.select().from(educationTable).where(eq(educationTable.resumeId, resumeId));
    const skills = await db.select().from(skillsTable).where(eq(skillsTable.resumeId, resumeId));
    const projects = await db.select().from(projectsTable).where(eq(projectsTable.resumeId, resumeId));
    const experience = await db.select().from(experienceTable).where(eq(experienceTable.resumeId, resumeId));
    const certifications = await db.select().from(certificationsTable).where(eq(certificationsTable.resumeId, resumeId));
    const languages = await db.select().from(languagesTable).where(eq(languagesTable.resumeId, resumeId));

    res.json({ resume, personalInfo: personalInfo || null, objective: objective || null, education, skills, projects, experience, certifications, languages });
  } catch (err) {
    logger.error({ err }, "Get resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /resumes/:resumeId
router.patch("/resumes/:resumeId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const { resumeName, templateId, fontFamily, isPublic } = req.body;

    const updates: Record<string, unknown> = {};
    if (resumeName !== undefined) updates.resumeName = resumeName;
    if (templateId !== undefined) updates.templateId = templateId;
    if (fontFamily !== undefined) updates.fontFamily = fontFamily;
    if (isPublic !== undefined) {
      updates.isPublic = isPublic;
      if (isPublic) {
        updates.publicUrl = crypto.randomUUID();
      }
    }

    const [resume] = await db.update(resumesTable).set(updates).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId!))).returning();
    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }
    res.json(resume);
  } catch (err) {
    logger.error({ err }, "Update resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /resumes/:resumeId
router.delete("/resumes/:resumeId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    await db.delete(personalInfoTable).where(eq(personalInfoTable.resumeId, resumeId));
    await db.delete(careerObjectiveTable).where(eq(careerObjectiveTable.resumeId, resumeId));
    await db.delete(educationTable).where(eq(educationTable.resumeId, resumeId));
    await db.delete(skillsTable).where(eq(skillsTable.resumeId, resumeId));
    await db.delete(projectsTable).where(eq(projectsTable.resumeId, resumeId));
    await db.delete(experienceTable).where(eq(experienceTable.resumeId, resumeId));
    await db.delete(certificationsTable).where(eq(certificationsTable.resumeId, resumeId));
    await db.delete(languagesTable).where(eq(languagesTable.resumeId, resumeId));
    await db.delete(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId!)));
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Delete resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /resumes/:resumeId/duplicate
router.post("/resumes/:resumeId/duplicate", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const [orig] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId!))).limit(1);
    if (!orig) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    const [newResume] = await db.insert(resumesTable).values({
      userId: req.userId!,
      resumeName: `${orig.resumeName} (Copy)`,
      templateId: orig.templateId,
      isPublic: false,
    }).returning();

    const [pi] = await db.select().from(personalInfoTable).where(eq(personalInfoTable.resumeId, resumeId)).limit(1);
    if (pi) {
      await db.insert(personalInfoTable).values({ ...pi, id: undefined as unknown as number, resumeId: newResume.id });
    }
    const [obj] = await db.select().from(careerObjectiveTable).where(eq(careerObjectiveTable.resumeId, resumeId)).limit(1);
    if (obj) {
      await db.insert(careerObjectiveTable).values({ ...obj, id: undefined as unknown as number, resumeId: newResume.id });
    }
    const edus = await db.select().from(educationTable).where(eq(educationTable.resumeId, resumeId));
    for (const e of edus) {
      await db.insert(educationTable).values({ ...e, id: undefined as unknown as number, resumeId: newResume.id });
    }
    const skls = await db.select().from(skillsTable).where(eq(skillsTable.resumeId, resumeId));
    for (const s of skls) {
      await db.insert(skillsTable).values({ ...s, id: undefined as unknown as number, resumeId: newResume.id });
    }
    const projs = await db.select().from(projectsTable).where(eq(projectsTable.resumeId, resumeId));
    for (const p of projs) {
      await db.insert(projectsTable).values({ ...p, id: undefined as unknown as number, resumeId: newResume.id });
    }
    const exps = await db.select().from(experienceTable).where(eq(experienceTable.resumeId, resumeId));
    for (const ex of exps) {
      await db.insert(experienceTable).values({ ...ex, id: undefined as unknown as number, resumeId: newResume.id });
    }
    const certs = await db.select().from(certificationsTable).where(eq(certificationsTable.resumeId, resumeId));
    for (const c of certs) {
      await db.insert(certificationsTable).values({ ...c, id: undefined as unknown as number, resumeId: newResume.id });
    }
    const langs = await db.select().from(languagesTable).where(eq(languagesTable.resumeId, resumeId));
    for (const l of langs) {
      await db.insert(languagesTable).values({ ...l, id: undefined as unknown as number, resumeId: newResume.id });
    }

    res.status(201).json(newResume);
  } catch (err) {
    logger.error({ err }, "Duplicate resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /resumes/:resumeId/ats-score
router.get("/resumes/:resumeId/ats-score", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const [resume] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId!))).limit(1);
    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    const [pi] = await db.select().from(personalInfoTable).where(eq(personalInfoTable.resumeId, resumeId)).limit(1);
    const [obj] = await db.select().from(careerObjectiveTable).where(eq(careerObjectiveTable.resumeId, resumeId)).limit(1);
    const edus = await db.select().from(educationTable).where(eq(educationTable.resumeId, resumeId));
    const skls = await db.select().from(skillsTable).where(eq(skillsTable.resumeId, resumeId));
    const projs = await db.select().from(projectsTable).where(eq(projectsTable.resumeId, resumeId));
    const exps = await db.select().from(experienceTable).where(eq(experienceTable.resumeId, resumeId));

    let score = 0;
    const tips: string[] = [];
    const keywordsFound: string[] = [];
    const missingKeywords: string[] = [];

    if (pi) { score += 20; } else { tips.push("Add your personal information to improve ATS score"); missingKeywords.push("Contact Information"); }
    if (obj) { score += 10; keywordsFound.push("Career Objective"); } else { tips.push("Add a career objective/summary"); missingKeywords.push("Objective"); }
    if (edus.length > 0) { score += 20; keywordsFound.push("Education"); } else { tips.push("Add your educational background"); missingKeywords.push("Education"); }
    if (skls.length >= 3) { score += 20; keywordsFound.push("Technical Skills"); } else { tips.push("Add at least 3 skills to improve ATS matching"); missingKeywords.push("Skills"); }
    if (projs.length > 0) { score += 15; keywordsFound.push("Projects"); } else { tips.push("Add projects to showcase your work"); }
    if (exps.length > 0) { score += 15; keywordsFound.push("Work Experience"); } else { tips.push("Add internship or work experience if available"); }

    if (pi?.linkedin) { keywordsFound.push("LinkedIn"); } else { tips.push("Add your LinkedIn profile URL"); }
    if (pi?.phone) { keywordsFound.push("Phone Number"); } else if (pi) { missingKeywords.push("Phone Number"); }

    res.json({ score: Math.min(score, 100), tips, keywordsFound, missingKeywords });
  } catch (err) {
    logger.error({ err }, "ATS score error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /resumes/:resumeId/export/pdf
router.get("/resumes/:resumeId/export/pdf", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const [resume] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId!))).limit(1);
    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    const [pi] = await db.select().from(personalInfoTable).where(eq(personalInfoTable.resumeId, resumeId)).limit(1);
    const [obj] = await db.select().from(careerObjectiveTable).where(eq(careerObjectiveTable.resumeId, resumeId)).limit(1);
    const edus = await db.select().from(educationTable).where(eq(educationTable.resumeId, resumeId));
    const skls = await db.select().from(skillsTable).where(eq(skillsTable.resumeId, resumeId));
    const projs = await db.select().from(projectsTable).where(eq(projectsTable.resumeId, resumeId));
    const exps = await db.select().from(experienceTable).where(eq(experienceTable.resumeId, resumeId));
    const certs = await db.select().from(certificationsTable).where(eq(certificationsTable.resumeId, resumeId));
    const langs = await db.select().from(languagesTable).where(eq(languagesTable.resumeId, resumeId));

    // Build a simple HTML string for the resume, then encode as base64
    const name = pi?.fullName || "Resume";
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; color: #222; }
  h1 { font-size: 22px; margin-bottom: 4px; color: #1e40af; }
  .contact { font-size: 11px; color: #555; margin-bottom: 16px; }
  h2 { font-size: 14px; border-bottom: 2px solid #1e40af; padding-bottom: 2px; color: #1e40af; margin-top: 16px; margin-bottom: 8px; }
  .entry { margin-bottom: 10px; }
  .entry-title { font-weight: bold; }
  .entry-sub { color: #444; font-size: 11px; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #eff6ff; border: 1px solid #93c5fd; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
</style>
</head>
<body>
<h1>${pi?.fullName || resume.resumeName}</h1>
<div class="contact">
  ${pi?.email || ""} ${pi?.phone ? "| " + pi.phone : ""} ${pi?.linkedin ? "| " + pi.linkedin : ""} ${pi?.address ? "| " + pi.address : ""}
</div>
${obj ? `<h2>Career Objective</h2><p>${obj.summaryText}</p>` : ""}
${edus.length > 0 ? `<h2>Education</h2>${edus.map(e => `<div class="entry"><div class="entry-title">${e.degree} in ${e.fieldOfStudy}</div><div class="entry-sub">${e.institution} | ${e.graduationYear} | CGPA: ${e.cgpa}</div></div>`).join("")}` : ""}
${skls.length > 0 ? `<h2>Skills</h2><div class="skills-grid">${skls.map(s => `<span class="skill-tag">${s.skillName} (${s.proficiencyLevel})</span>`).join("")}</div>` : ""}
${projs.length > 0 ? `<h2>Projects</h2>${projs.map(p => `<div class="entry"><div class="entry-title">${p.projectTitle}</div><div class="entry-sub">${p.technologies}</div><div>${p.description}</div>${p.projectLink ? `<div><a href="${p.projectLink}">${p.projectLink}</a></div>` : ""}</div>`).join("")}` : ""}
${exps.length > 0 ? `<h2>Work Experience</h2>${exps.map(e => `<div class="entry"><div class="entry-title">${e.position} at ${e.company}</div><div class="entry-sub">${e.startDate} - ${e.isCurrent ? "Present" : (e.endDate || "")}</div><div>${e.responsibilities}</div></div>`).join("")}` : ""}
${certs.length > 0 ? `<h2>Certifications</h2>${certs.map(c => `<div class="entry"><div class="entry-title">${c.certName}</div>${c.issuingOrg ? `<div class="entry-sub">${c.issuingOrg}${c.dateIssued ? " | " + c.dateIssued : ""}</div>` : ""}</div>`).join("")}` : ""}
${langs.length > 0 ? `<h2>Languages</h2><div class="skills-grid">${langs.map(l => `<span class="skill-tag">${l.languageName} (${l.proficiency})</span>`).join("")}</div>` : ""}
</body>
</html>`;

    const pdfBase64 = Buffer.from(html).toString("base64");
    const filename = `${name.replace(/\s+/g, "_")}_Resume.html`;

    res.json({ pdfBase64, filename });
  } catch (err) {
    logger.error({ err }, "Export PDF error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
