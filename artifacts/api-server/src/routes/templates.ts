import { Router } from "express";
import { db, templatesTable, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { desc } from "drizzle-orm";

const router = Router();

// GET /templates
router.get("/templates", async (_req, res) => {
  try {
    const templates = await db.select().from(templatesTable);
    res.json(templates);
  } catch (err) {
    logger.error({ err }, "List templates error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /dashboard/stats
router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const resumes = await db.select().from(resumesTable).where(eq(resumesTable.userId, req.userId!)).orderBy(desc(resumesTable.updatedAt));
    const templates = await db.select().from(templatesTable);
    
    const templateMap = new Map(templates.map(t => [t.id, t.templateName]));
    const usageMap = new Map<string, number>();
    
    for (const resume of resumes) {
      const name = templateMap.get(resume.templateId) || `Template ${resume.templateId}`;
      usageMap.set(name, (usageMap.get(name) || 0) + 1);
    }
    
    const templateUsage = Array.from(usageMap.entries()).map(([templateName, count]) => ({ templateName, count }));
    
    res.json({
      totalResumes: resumes.length,
      totalDownloads: 0,
      recentResumes: resumes.slice(0, 5),
      templateUsage,
    });
  } catch (err) {
    logger.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
