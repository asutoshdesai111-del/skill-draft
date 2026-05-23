import { Router } from "express";
import { db, personalInfoTable, careerObjectiveTable, educationTable, skillsTable, projectsTable, experienceTable, certificationsTable, languagesTable, resumesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

// Helper: verify resume ownership
async function verifyOwnership(resumeId: number, userId: number): Promise<boolean> {
  const [r] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, userId))).limit(1);
  return !!r;
}

// --- Personal Info ---
router.get("/resumes/:resumeId/personal-info", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const [pi] = await db.select().from(personalInfoTable).where(eq(personalInfoTable.resumeId, resumeId)).limit(1);
    if (!pi) { res.status(404).json({ error: "Not found" }); return; }
    res.json(pi);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.put("/resumes/:resumeId/personal-info", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { fullName, email, phone, linkedin, portfolio, address, photoUrl } = req.body;
    const [existing] = await db.select().from(personalInfoTable).where(eq(personalInfoTable.resumeId, resumeId)).limit(1);
    let result;
    if (existing) {
      [result] = await db.update(personalInfoTable).set({ fullName, email, phone, linkedin, portfolio, address, photoUrl }).where(eq(personalInfoTable.resumeId, resumeId)).returning();
    } else {
      [result] = await db.insert(personalInfoTable).values({ resumeId, fullName, email, phone, linkedin, portfolio, address, photoUrl }).returning();
    }
    res.json(result);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

// --- Career Objective ---
router.get("/resumes/:resumeId/objective", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const [obj] = await db.select().from(careerObjectiveTable).where(eq(careerObjectiveTable.resumeId, resumeId)).limit(1);
    if (!obj) { res.status(404).json({ error: "Not found" }); return; }
    res.json(obj);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.put("/resumes/:resumeId/objective", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { summaryText } = req.body;
    const [existing] = await db.select().from(careerObjectiveTable).where(eq(careerObjectiveTable.resumeId, resumeId)).limit(1);
    let result;
    if (existing) {
      [result] = await db.update(careerObjectiveTable).set({ summaryText }).where(eq(careerObjectiveTable.resumeId, resumeId)).returning();
    } else {
      [result] = await db.insert(careerObjectiveTable).values({ resumeId, summaryText }).returning();
    }
    res.json(result);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

// --- Education ---
router.get("/resumes/:resumeId/education", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const rows = await db.select().from(educationTable).where(eq(educationTable.resumeId, resumeId));
    res.json(rows);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/resumes/:resumeId/education", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { institution, degree, fieldOfStudy, graduationYear, cgpa } = req.body;
    const [row] = await db.insert(educationTable).values({ resumeId, institution, degree, fieldOfStudy, graduationYear, cgpa }).returning();
    res.status(201).json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/resumes/:resumeId/education/:educationId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const educationId = parseInt(String(req.params.educationId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { institution, degree, fieldOfStudy, graduationYear, cgpa } = req.body;
    const [row] = await db.update(educationTable).set({ institution, degree, fieldOfStudy, graduationYear, cgpa }).where(and(eq(educationTable.id, educationId), eq(educationTable.resumeId, resumeId))).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/resumes/:resumeId/education/:educationId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const educationId = parseInt(String(req.params.educationId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(educationTable).where(and(eq(educationTable.id, educationId), eq(educationTable.resumeId, resumeId)));
    res.json({ success: true });
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

// --- Skills ---
router.get("/resumes/:resumeId/skills", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const rows = await db.select().from(skillsTable).where(eq(skillsTable.resumeId, resumeId));
    res.json(rows);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/resumes/:resumeId/skills", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { skillName, proficiencyLevel } = req.body;
    const [row] = await db.insert(skillsTable).values({ resumeId, skillName, proficiencyLevel }).returning();
    res.status(201).json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/resumes/:resumeId/skills/:skillId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const skillId = parseInt(String(req.params.skillId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { skillName, proficiencyLevel } = req.body;
    const [row] = await db.update(skillsTable).set({ skillName, proficiencyLevel }).where(and(eq(skillsTable.id, skillId), eq(skillsTable.resumeId, resumeId))).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/resumes/:resumeId/skills/:skillId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const skillId = parseInt(String(req.params.skillId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(skillsTable).where(and(eq(skillsTable.id, skillId), eq(skillsTable.resumeId, resumeId)));
    res.json({ success: true });
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

// --- Projects ---
router.get("/resumes/:resumeId/projects", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const rows = await db.select().from(projectsTable).where(eq(projectsTable.resumeId, resumeId));
    res.json(rows);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/resumes/:resumeId/projects", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { projectTitle, description, technologies, projectLink, role } = req.body;
    const [row] = await db.insert(projectsTable).values({ resumeId, projectTitle, description, technologies, projectLink, role }).returning();
    res.status(201).json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/resumes/:resumeId/projects/:projectId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const projectId = parseInt(String(req.params.projectId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { projectTitle, description, technologies, projectLink, role } = req.body;
    const [row] = await db.update(projectsTable).set({ projectTitle, description, technologies, projectLink, role }).where(and(eq(projectsTable.id, projectId), eq(projectsTable.resumeId, resumeId))).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/resumes/:resumeId/projects/:projectId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const projectId = parseInt(String(req.params.projectId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(projectsTable).where(and(eq(projectsTable.id, projectId), eq(projectsTable.resumeId, resumeId)));
    res.json({ success: true });
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

// --- Experience ---
router.get("/resumes/:resumeId/experience", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const rows = await db.select().from(experienceTable).where(eq(experienceTable.resumeId, resumeId));
    res.json(rows);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/resumes/:resumeId/experience", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { company, position, startDate, endDate, isCurrent, responsibilities } = req.body;
    const [row] = await db.insert(experienceTable).values({ resumeId, company, position, startDate, endDate, isCurrent, responsibilities }).returning();
    res.status(201).json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/resumes/:resumeId/experience/:experienceId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const experienceId = parseInt(String(req.params.experienceId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { company, position, startDate, endDate, isCurrent, responsibilities } = req.body;
    const [row] = await db.update(experienceTable).set({ company, position, startDate, endDate, isCurrent, responsibilities }).where(and(eq(experienceTable.id, experienceId), eq(experienceTable.resumeId, resumeId))).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/resumes/:resumeId/experience/:experienceId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const experienceId = parseInt(String(req.params.experienceId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(experienceTable).where(and(eq(experienceTable.id, experienceId), eq(experienceTable.resumeId, resumeId)));
    res.json({ success: true });
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

// --- Certifications ---
router.get("/resumes/:resumeId/certifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const rows = await db.select().from(certificationsTable).where(eq(certificationsTable.resumeId, resumeId));
    res.json(rows);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/resumes/:resumeId/certifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { certName, issuingOrg, dateIssued, description } = req.body;
    const [row] = await db.insert(certificationsTable).values({ resumeId, certName, issuingOrg, dateIssued, description }).returning();
    res.status(201).json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/resumes/:resumeId/certifications/:certificationId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const certificationId = parseInt(String(req.params.certificationId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { certName, issuingOrg, dateIssued, description } = req.body;
    const [row] = await db.update(certificationsTable).set({ certName, issuingOrg, dateIssued, description }).where(and(eq(certificationsTable.id, certificationId), eq(certificationsTable.resumeId, resumeId))).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/resumes/:resumeId/certifications/:certificationId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const certificationId = parseInt(String(req.params.certificationId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(certificationsTable).where(and(eq(certificationsTable.id, certificationId), eq(certificationsTable.resumeId, resumeId)));
    res.json({ success: true });
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

// --- Languages ---
router.get("/resumes/:resumeId/languages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const rows = await db.select().from(languagesTable).where(eq(languagesTable.resumeId, resumeId));
    res.json(rows);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.post("/resumes/:resumeId/languages", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { languageName, proficiency } = req.body;
    const [row] = await db.insert(languagesTable).values({ resumeId, languageName, proficiency }).returning();
    res.status(201).json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/resumes/:resumeId/languages/:languageId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const languageId = parseInt(String(req.params.languageId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    const { languageName, proficiency } = req.body;
    const [row] = await db.update(languagesTable).set({ languageName, proficiency }).where(and(eq(languagesTable.id, languageId), eq(languagesTable.resumeId, resumeId))).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/resumes/:resumeId/languages/:languageId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumeId = parseInt(String(req.params.resumeId));
    const languageId = parseInt(String(req.params.languageId));
    if (!await verifyOwnership(resumeId, req.userId!)) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(languagesTable).where(and(eq(languagesTable.id, languageId), eq(languagesTable.resumeId, resumeId)));
    res.json({ success: true });
  } catch (err) { logger.error({ err }); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
