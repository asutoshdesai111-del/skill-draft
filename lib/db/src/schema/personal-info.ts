import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const personalInfoTable = pgTable("personal_info", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  linkedin: text("linkedin"),
  portfolio: text("portfolio"),
  address: text("address"),
  photoUrl: text("photo_url"),
});

export const insertPersonalInfoSchema = createInsertSchema(personalInfoTable).omit({ id: true });
export type InsertPersonalInfo = z.infer<typeof insertPersonalInfoSchema>;
export type PersonalInfo = typeof personalInfoTable.$inferSelect;
