import { db, templatesTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding templates...");

  const templates = [
    { id: 1, templateName: "Modern Professional", templateStyle: "modern", colorScheme: "blue", fontFamily: "Inter", description: "Clean blue accent with sidebar — ideal for IT roles" },
    { id: 2, templateName: "Minimalist", templateStyle: "minimalist", colorScheme: "black", fontFamily: "Inter", description: "Black & white, ATS-optimized for any industry" },
    { id: 3, templateName: "Creative", templateStyle: "creative", colorScheme: "teal", fontFamily: "Inter", description: "Colorful gradient for design & marketing roles" },
    { id: 4, templateName: "Corporate", templateStyle: "corporate", colorScheme: "amber", fontFamily: "Inter", description: "Formal amber design for finance & business" },
    { id: 5, templateName: "Technical", templateStyle: "technical", colorScheme: "slate", fontFamily: "Courier New", description: "Code-style design for CS freshers" },
  ];

  for (const t of templates) {
    const existing = await db.select().from(templatesTable).where(eq(templatesTable.id, t.id)).limit(1);
    if (!existing.length) {
      await db.insert(templatesTable).values(t);
      console.log(`  Created: ${t.templateName}`);
    } else {
      await db.update(templatesTable).set({ templateName: t.templateName }).where(eq(templatesTable.id, t.id));
      console.log(`  Updated: ${t.templateName}`);
    }
  }

  console.log("Seeding demo user...");
  const demoEmail = "demo@fresherresume.com";
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, demoEmail)).limit(1);
  if (!existing.length) {
    const passwordHash = await bcrypt.hash("demo123456", 10);
    await db.insert(usersTable).values({ username: "Rahul Sharma (Demo)", email: demoEmail, passwordHash });
    console.log("  Created demo user: demo@fresherresume.com / demo123456");
  } else {
    console.log("  Demo user already exists");
  }

  console.log("Done!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
