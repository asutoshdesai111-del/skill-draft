import { db, templatesTable, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding templates...");

  const templates = [
    { id: 1,  templateName: "Minimal ATS Resume",      templateStyle: "minimal-ats",     colorScheme: "black",    fontFamily: "Georgia",     description: "Clean serif, single-column — maximum ATS compatibility" },
    { id: 2,  templateName: "Corporate Resume",         templateStyle: "corporate-v2",    colorScheme: "navy",     fontFamily: "Calibri",     description: "Navy blue header, two-column — finance & consulting" },
    { id: 3,  templateName: "Creative Designer Resume", templateStyle: "creative-design", colorScheme: "purple",   fontFamily: "Montserrat",  description: "Purple gradient sidebar — design, marketing, UX roles" },
    { id: 4,  templateName: "Executive Resume",         templateStyle: "executive",       colorScheme: "charcoal", fontFamily: "Georgia",     description: "Dark charcoal + gold — senior leadership roles" },
    { id: 5,  templateName: "Developer Resume",         templateStyle: "developer",       colorScheme: "dark",     fontFamily: "Courier New", description: "GitHub-inspired dark header — CS & engineering" },
    { id: 6,  templateName: "Modern Gradient Resume",   templateStyle: "gradient",        colorScheme: "indigo",   fontFamily: "Inter",       description: "Indigo gradient, card sections — modern tech roles" },
    { id: 7,  templateName: "Dark Theme Resume",        templateStyle: "dark-theme",      colorScheme: "slate",    fontFamily: "Inter",       description: "Full dark UI with teal accent — bold, modern" },
    { id: 8,  templateName: "Infographic Resume",       templateStyle: "infographic",     colorScheme: "violet",   fontFamily: "Inter",       description: "Visual timeline, progress bars — eye-catching" },
    { id: 9,  templateName: "Elegant Professional",     templateStyle: "elegant",         colorScheme: "cream",    fontFamily: "Georgia",     description: "Cream background, ornamental serif — classic premium" },
    { id: 10, templateName: "Startup Founder Resume",   templateStyle: "startup",         colorScheme: "orange",   fontFamily: "Inter",       description: "Bold orange, dynamic layout — entrepreneurs & founders" },
  ];

  for (const t of templates) {
    const existing = await db.select().from(templatesTable).where(eq(templatesTable.id, t.id)).limit(1);
    if (!existing.length) {
      await db.insert(templatesTable).values(t);
      console.log(`  Created: ${t.templateName}`);
    } else {
      await db.update(templatesTable).set({ templateName: t.templateName, templateStyle: t.templateStyle, colorScheme: t.colorScheme, description: t.description }).where(eq(templatesTable.id, t.id));
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
