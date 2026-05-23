import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const templatesTable = pgTable("templates", {
  id: serial("id").primaryKey(),
  templateName: text("template_name").notNull(),
  templateStyle: text("template_style").notNull(),
  colorScheme: text("color_scheme").notNull(),
  fontFamily: text("font_family").notNull(),
  description: text("description").notNull(),
});

export const insertTemplateSchema = createInsertSchema(templatesTable).omit({ id: true });
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templatesTable.$inferSelect;
