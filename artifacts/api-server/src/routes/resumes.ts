import { Router } from "express";
import { db, resumesTable, personalInfoTable, careerObjectiveTable, educationTable, skillsTable, projectsTable, experienceTable, certificationsTable, languagesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { renderResumeHtml } from "../lib/resume-html-templates";
import { isTemplatePremium, isFontPremium } from "../lib/premium";
import crypto from "crypto";

const router = Router();

// Visual identity per template, mirrored from the on-screen templates in resume-preview.tsx,
// so exported HTML/DOCX reflect the template the user actually picked instead of one fixed look.
// `layout` drives actual document structure (sidebar column vs single flowing column) —
// color/font alone wasn't enough to make exports feel template-specific.
const TEMPLATE_STYLES: Record<number, { primary: string; secondary: string; cssFont: string; docxFont: string; layout: "single" | "sidebar" }> = {
  1: { primary: "111827", secondary: "6b7280", cssFont: "Georgia, 'Times New Roman', serif", docxFont: "Georgia", layout: "single" },
  2: { primary: "003366", secondary: "D4A843", cssFont: "Calibri, Arial, sans-serif", docxFont: "Calibri", layout: "sidebar" },
  3: { primary: "7C3AED", secondary: "DB2777", cssFont: "'Montserrat', Arial, sans-serif", docxFont: "Montserrat", layout: "sidebar" },
  4: { primary: "1C2B3A", secondary: "C9A96E", cssFont: "Georgia, serif", docxFont: "Georgia", layout: "single" },
  5: { primary: "0D1117", secondary: "39D353", cssFont: "'Courier New', monospace", docxFont: "Consolas", layout: "sidebar" },
  6: { primary: "4F46E5", secondary: "7C3AED", cssFont: "'Inter', Arial, sans-serif", docxFont: "Calibri", layout: "single" },
  7: { primary: "0f172a", secondary: "14b8a6", cssFont: "'Inter', Arial, sans-serif", docxFont: "Calibri", layout: "sidebar" },
  8: { primary: "6366F1", secondary: "8B5CF6", cssFont: "'Inter', Arial, sans-serif", docxFont: "Calibri", layout: "sidebar" },
  9: { primary: "3b1f0a", secondary: "8B6914", cssFont: "Georgia, 'Times New Roman', serif", docxFont: "Georgia", layout: "single" },
  10: { primary: "F97316", secondary: "0c0a09", cssFont: "'Inter', Arial, sans-serif", docxFont: "Calibri", layout: "sidebar" },
};
const getTemplateStyle = (templateId: number) => TEMPLATE_STYLES[templateId] || TEMPLATE_STYLES[1];

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
    if (templateId !== undefined && isTemplatePremium(templateId)) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
      if (!user?.isPremium) {
        res.status(403).json({ error: "This template requires a Premium subscription." });
        return;
      }
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

    // Defense-in-depth: the frontend already locks Premium templates/fonts in
    // the UI, but enforce it here too in case the API is called directly.
    if ((templateId !== undefined && isTemplatePremium(templateId)) || (fontFamily !== undefined && isFontPremium(fontFamily))) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
      if (!user?.isPremium) {
        res.status(403).json({ error: "This template or font requires a Premium subscription." });
        return;
      }
    }

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

    // Build an HTML string that mirrors the on-screen template's actual design
    // (resume-html-templates.ts ports each of the 10 React templates 1:1), then
    // encode as base64.
    const name = pi?.fullName || "Resume";
    const html = renderResumeHtml(resume.templateId, {
      resumeName: resume.resumeName,
      pi, obj, edus, skls, projs, exps, certs, langs,
    });

    const pdfBase64 = Buffer.from(html).toString("base64");
    const filename = `${name.replace(/\s+/g, "_")}_Resume.html`;

    res.json({ pdfBase64, filename });
  } catch (err) {
    logger.error({ err }, "Export PDF error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /resumes/:resumeId/export/docx
router.get("/resumes/:resumeId/export/docx", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, WidthType, Table, TableRow, TableCell, VerticalAlign } = await import("docx");

    const resumeId = parseInt(String(req.params.resumeId));
    const [resume] = await db.select().from(resumesTable).where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, req.userId!))).limit(1);
    if (!resume) { res.status(404).json({ error: "Resume not found" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user?.isPremium) {
      res.status(403).json({ error: "Word export requires a Premium subscription." });
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

    const style = getTemplateStyle(resume.templateId);

    type Para = InstanceType<typeof Paragraph>;

    const sectionHeading = (text: string) => new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: style.primary, space: 4 } },
    });

    const buildObjective = (): Para[] => {
      if (!obj?.summaryText) return [];
      return [sectionHeading("Career Objective"), new Paragraph({ children: [new TextRun({ text: obj.summaryText, size: 20 })], spacing: { after: 120 } })];
    };

    const buildEducation = (): Para[] => {
      if (edus.length === 0) return [];
      const out: Para[] = [sectionHeading("Education")];
      edus.forEach(e => {
        out.push(new Paragraph({ children: [new TextRun({ text: `${e.degree} in ${e.fieldOfStudy}`, bold: true, size: 22 })] }));
        out.push(new Paragraph({ children: [new TextRun({ text: `${e.institution}`, size: 20, color: "444444" })], spacing: { after: 80 } }));
        out.push(new Paragraph({ children: [new TextRun({ text: `${e.graduationYear} | CGPA: ${e.cgpa}`, size: 18, color: "666666" })], spacing: { after: 120 } }));
      });
      return out;
    };

    const buildSkills = (): Para[] => {
      if (skls.length === 0) return [];
      const skillText = skls.map(s => `${s.skillName} (${s.proficiencyLevel})`).join("   •   ");
      return [sectionHeading("Skills"), new Paragraph({ children: [new TextRun({ text: skillText, size: 20 })], spacing: { after: 120 } })];
    };

    const buildProjects = (): Para[] => {
      if (projs.length === 0) return [];
      const out: Para[] = [sectionHeading("Projects")];
      projs.forEach(p => {
        out.push(new Paragraph({ children: [new TextRun({ text: p.projectTitle, bold: true, size: 22 })] }));
        if (p.technologies) out.push(new Paragraph({ children: [new TextRun({ text: p.technologies, size: 18, color: style.primary, italics: true })] }));
        if (p.description) out.push(new Paragraph({ children: [new TextRun({ text: p.description, size: 20 })], spacing: { after: 120 } }));
      });
      return out;
    };

    const buildExperience = (): Para[] => {
      if (exps.length === 0) return [];
      const out: Para[] = [sectionHeading("Work Experience")];
      exps.forEach(e => {
        out.push(new Paragraph({ children: [new TextRun({ text: e.position, bold: true, size: 22 }), new TextRun({ text: ` at ${e.company}`, size: 22, color: style.primary })] }));
        out.push(new Paragraph({ children: [new TextRun({ text: `${e.startDate} – ${e.isCurrent ? "Present" : (e.endDate || "")}`, size: 18, color: "666666", italics: true })] }));
        if (e.responsibilities) out.push(new Paragraph({ children: [new TextRun({ text: e.responsibilities, size: 20 })], spacing: { after: 120 } }));
      });
      return out;
    };

    const buildCertifications = (): Para[] => {
      if (certs.length === 0) return [];
      const out: Para[] = [sectionHeading("Certifications")];
      certs.forEach(c => {
        out.push(new Paragraph({ children: [new TextRun({ text: c.certName, bold: true, size: 22 })] }));
        if (c.issuingOrg) out.push(new Paragraph({ children: [new TextRun({ text: `${c.issuingOrg}${c.dateIssued ? " | " + c.dateIssued : ""}`, size: 18, color: "666666" })], spacing: { after: 100 } }));
      });
      return out;
    };

    const buildLanguages = (): Para[] => {
      if (langs.length === 0) return [];
      const langText = langs.map(l => `${l.languageName} (${l.proficiency})`).join("   •   ");
      return [sectionHeading("Languages"), new Paragraph({ children: [new TextRun({ text: langText, size: 20 })], spacing: { after: 120 } })];
    };

    const children: (Para | InstanceType<typeof Table>)[] = [];

    // Name
    children.push(new Paragraph({
      children: [new TextRun({ text: pi?.fullName || resume.resumeName, bold: true, size: 44, color: style.primary })],
      alignment: AlignmentType.CENTER,
    }));

    // Contact info
    const contactParts = [pi?.email, pi?.phone, pi?.linkedin, pi?.address].filter(Boolean);
    if (contactParts.length > 0) {
      children.push(new Paragraph({
        children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: "444444" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }));
    }

    if (style.layout === "sidebar") {
      // Two-column layout via a borderless table: narrow shaded sidebar + wider main column —
      // mirrors the sidebar templates' actual structure instead of just recoloring one flat layout.
      const sidebarChildren = [...buildSkills(), ...buildLanguages(), ...buildCertifications()];
      const mainChildren = [...buildObjective(), ...buildEducation(), ...buildExperience(), ...buildProjects()];
      const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              shading: { fill: "F8FAFC" },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 120, bottom: 120, left: 120, right: 160 },
              children: sidebarChildren.length > 0 ? sidebarChildren : [new Paragraph({ text: "" })],
            }),
            new TableCell({
              width: { size: 68, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.TOP,
              margins: { top: 120, bottom: 120, left: 160, right: 0 },
              children: mainChildren.length > 0 ? mainChildren : [new Paragraph({ text: "" })],
            }),
          ],
        })],
      }));
    } else {
      children.push(...buildObjective(), ...buildEducation(), ...buildSkills(), ...buildProjects(), ...buildExperience(), ...buildCertifications(), ...buildLanguages());
    }

    // A4: 11906×16838 twips (210×297mm); Letter: 12240×15840 twips (8.5×11in)
    const ps = String(req.query.paperSize || "a4").toLowerCase();
    const pageSize = ps === "letter"
      ? { width: 12240, height: 15840 }
      : { width: 11906, height: 16838 };

    const doc = new Document({
      sections: [{
        properties: { page: { size: pageSize, margin: { top: 720, right: 900, bottom: 720, left: 900 } } as never },
        children,
      }],
      styles: {
        default: { document: { run: { font: style.docxFont, size: 20 } } },
        paragraphStyles: [
          { id: "Heading2", name: "Heading 2", run: { bold: true, size: 24, color: style.primary, font: style.docxFont }, paragraph: {} },
        ],
      },
    });

    const buffer = await Packer.toBuffer(doc);
    const docxBase64 = buffer.toString("base64");
    const filename = `${(pi?.fullName || resume.resumeName).replace(/\s+/g, "_")}_Resume.docx`;

    res.json({ docxBase64, filename });
  } catch (err) {
    logger.error({ err }, "Export DOCX error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
