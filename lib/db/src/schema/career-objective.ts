import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const careerObjectiveTable = pgTable("career_objective", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull().unique(),
  summaryText: text("summary_text").notNull(),
});

export const insertCareerObjectiveSchema = createInsertSchema(careerObjectiveTable).omit({ id: true });
export type InsertCareerObjective = z.infer<typeof insertCareerObjectiveSchema>;
export type CareerObjective = typeof careerObjectiveTable.$inferSelect;
