import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  projectTitle: text("project_title").notNull(),
  description: text("description").notNull(),
  technologies: text("technologies").notNull(),
  projectLink: text("project_link"),
  role: text("role"),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
