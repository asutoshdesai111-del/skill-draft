import { db, templatesTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding templates...");

  const templates = [
    { id: 1, templateName: "Modern Professional", previewImage: null, description: "Clean blue accent design with sidebar — ideal for IT and engineering roles" },
    { id: 2, templateName: "Minimalist", previewImage: null, description: "Black and white, ATS-optimized design for any industry" },
    { id: 3, templateName: "Creative", previewImage: null, description: "Colorful gradient design — perfect for design, marketing, and media roles" },
    { id: 4, templateName: "Corporate", previewImage: null, description: "Formal amber accent design — ideal for finance, banking, and business roles" },
    { id: 5, templateName: "Technical", previewImage: null, description: "Code-style dark header design — perfect for CS and software engineering freshers" },
  ];

  for (const template of templates) {
    const existing = await db.select().from(templatesTable).where(eq(templatesTable.id, template.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(templatesTable).values(template);
      console.log(`  Created template: ${template.templateName}`);
    } else {
      await db.update(templatesTable).set({ templateName: template.templateName, description: template.description }).where(eq(templatesTable.id, template.id));
      console.log(`  Updated template: ${template.templateName}`);
    }
  }

  console.log("Seeding demo user...");
  const demoEmail = "demo@fresherresume.com";
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, demoEmail)).limit(1);
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash("demo123456", 10);
    await db.insert(usersTable).values({ username: "Rahul Sharma (Demo)", email: demoEmail, passwordHash });
    console.log("  Created demo user: demo@fresherresume.com / demo123456");
  } else {
    console.log("  Demo user already exists");
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
