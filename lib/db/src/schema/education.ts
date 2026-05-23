import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const educationTable = pgTable("education", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  fieldOfStudy: text("field_of_study").notNull(),
  graduationYear: integer("graduation_year").notNull(),
  cgpa: text("cgpa").notNull(),
});

export const insertEducationSchema = createInsertSchema(educationTable).omit({ id: true });
export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type Education = typeof educationTable.$inferSelect;
