import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const languagesTable = pgTable("languages", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  languageName: text("language_name").notNull(),
  proficiency: text("proficiency").notNull().default("Intermediate"),
});

export const insertLanguageSchema = createInsertSchema(languagesTable).omit({ id: true });
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Language = typeof languagesTable.$inferSelect;
