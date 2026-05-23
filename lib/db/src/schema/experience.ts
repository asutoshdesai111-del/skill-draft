import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const experienceTable = pgTable("experience", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").notNull().default(false),
  responsibilities: text("responsibilities").notNull(),
});

export const insertExperienceSchema = createInsertSchema(experienceTable).omit({ id: true });
export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = typeof experienceTable.$inferSelect;
