import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const certificationsTable = pgTable("certifications", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  certName: text("cert_name").notNull(),
  issuingOrg: text("issuing_org"),
  dateIssued: text("date_issued"),
  description: text("description"),
});

export const insertCertificationSchema = createInsertSchema(certificationsTable).omit({ id: true });
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Certification = typeof certificationsTable.$inferSelect;
