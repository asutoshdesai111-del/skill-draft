// Faithful HTML/CSS ports of the 10 on-screen templates defined in
// artifacts/fresher-resume/src/components/resume-preview.tsx, so the exported
// HTML file actually matches the template the user picked instead of one
// generic layout with swapped colors.

interface PersonalInfoLike {
  fullName: string;
  email: string;
  phone: string;
  linkedin?: string | null;
  portfolio?: string | null;
  address?: string | null;
}
interface ObjectiveLike { summaryText: string }
interface EducationLike { institution: string; degree: string; fieldOfStudy: string; graduationYear: number; cgpa: string }
interface SkillLike { skillName: string; proficiencyLevel: string }
interface ProjectLike { projectTitle: string; description: string; technologies: string; projectLink?: string | null }
interface ExperienceLike { company: string; position: string; startDate: string; endDate?: string | null; isCurrent: boolean; responsibilities: string }
interface CertificationLike { certName: string; issuingOrg?: string | null; dateIssued?: string | null }
interface LanguageLike { languageName: string; proficiency: string }

export interface ResumeHtmlContext {
  resumeName: string;
  pi?: PersonalInfoLike | null;
  obj?: ObjectiveLike | null;
  edus: EducationLike[];
  skls: SkillLike[];
  projs: ProjectLike[];
  exps: ExperienceLike[];
  certs: CertificationLike[];
  langs: LanguageLike[];
}

const PW: Record<string, string> = {
  Beginner: "25%", Intermediate: "55%", Advanced: "80%", Expert: "100%",
  Native: "100%", Fluent: "80%", Basic: "30%",
};

// All user-supplied text is interpolated into raw HTML — escape it so a resume
// field can't inject markup/scripts into the exported file.
const esc = (v: unknown): string =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function contactParts(pi?: PersonalInfoLike | null): string[] {
  return [pi?.email, pi?.phone, pi?.linkedin, pi?.portfolio, pi?.address].filter((v): v is string => !!v).map(esc);
}

function name(ctx: ResumeHtmlContext): string {
  return esc(ctx.pi?.fullName || ctx.resumeName || "Your Name");
}

function cleanDate(v: string | null | undefined): string {
  if (!v) return "";
  const t = v.trim();
  return t.toLowerCase() === "not specified" ? "" : t;
}

function dateRangeHtml(e: ExperienceLike, sep = " – ", presentLabel = "Present"): string {
  const s = cleanDate(e.startDate);
  const en = e.isCurrent ? presentLabel : cleanDate(e.endDate);
  if (!s && !en) return "";
  if (!s) return esc(en);
  if (!en) return esc(s);
  return `${esc(s)}${sep}${esc(en)}`;
}

function endLabel(e: ExperienceLike): string {
  return e.isCurrent ? "Present" : esc(cleanDate(e.endDate));
}

function bar(level: string, color: string, bg = "#e5e7eb", height = 5): string {
  return `<div style="height:${height}px;background:${bg};border-radius:3px;overflow:hidden;margin-top:3px"><div style="width:${PW[level] || "50%"};height:100%;background:${color};border-radius:3px"></div></div>`;
}

function tag(text: string, bg: string, color: string): string {
  return `<span style="background:${bg};color:${color};font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;margin-right:4px;margin-bottom:4px;display:inline-block">${esc(text)}</span>`;
}

function shell(bodyStyle: string, innerHtml: string): string {
  const printCss = `<style>@page{size:A4;margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@media print{body{margin:0}}</style>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${printCss}</head><body style="margin:0;${bodyStyle}">${innerHtml}</body></html>`;
}

// ── T1 · Minimal ATS ─────────────────────────────────────────────────────────
function t1(ctx: ResumeHtmlContext): string {
  const sh = "font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;border-bottom:1px solid #999;padding-bottom:4px;margin-bottom:10px;margin-top:20px;color:#111";
  const body = `
    <div style="text-align:center;margin-bottom:20px;padding-bottom:18px;border-bottom:2px solid #111">
      <h1 style="font-size:28px;font-weight:700;letter-spacing:3px;margin:0;text-transform:uppercase">${name(ctx)}</h1>
      <p style="font-size:11px;color:#444;margin:8px 0 0;letter-spacing:0.5px;line-height:1.8">${contactParts(ctx.pi).join(" · ")}</p>
    </div>
    ${ctx.obj ? `<h2 style="${sh}">Career Objective</h2><p style="font-size:12px;line-height:1.8;color:#333;margin:0">${esc(ctx.obj.summaryText)}</p>` : ""}
    ${ctx.edus.length ? `<h2 style="${sh}">Education</h2>${ctx.edus.map(e => `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><div><div style="font-weight:600;font-size:12px">${esc(e.degree)} in ${esc(e.fieldOfStudy)}</div><div style="font-size:11px;color:#555">${esc(e.institution)}</div></div><div style="text-align:right;font-size:11px;color:#555"><div>${esc(e.graduationYear)}</div><div>CGPA: ${esc(e.cgpa)}</div></div></div>`).join("")}` : ""}
    ${ctx.skls.length ? `<h2 style="${sh}">Skills</h2><p style="font-size:12px;color:#333;line-height:2;margin:0">${ctx.skls.map(s => esc(s.skillName)).join(" · ")}</p>` : ""}
    ${ctx.projs.length ? `<h2 style="${sh}">Projects</h2>${ctx.projs.map(p => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><span style="font-weight:600;font-size:12px">${esc(p.projectTitle)}</span><span style="font-size:11px;font-style:italic;color:#555">${esc(p.technologies)}</span></div><p style="font-size:11px;color:#444;margin:3px 0 0;line-height:1.6">${esc(p.description)}</p></div>`).join("")}` : ""}
    ${ctx.exps.length ? `<h2 style="${sh}">Work Experience</h2>${ctx.exps.map(e => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><span style="font-weight:600;font-size:12px">${esc(e.position)}, ${esc(e.company)}</span><span style="font-size:11px;color:#555">${dateRangeHtml(e)}</span></div><p style="font-size:11px;color:#444;margin:3px 0 0;line-height:1.6">${esc(e.responsibilities)}</p></div>`).join("")}` : ""}
    ${ctx.certs.length ? `<h2 style="${sh}">Certifications</h2>${ctx.certs.map(c => `<div style="margin-bottom:5px;font-size:12px"><strong>${esc(c.certName)}</strong>${c.issuingOrg ? ` <span style="color:#555">— ${esc(c.issuingOrg)}${c.dateIssued ? ` (${esc(c.dateIssued)})` : ""}</span>` : ""}</div>`).join("")}` : ""}
    ${ctx.langs.length ? `<h2 style="${sh}">Languages</h2><p style="font-size:12px;color:#333">${ctx.langs.map(l => `${esc(l.languageName)} (${esc(l.proficiency)})`).join(" · ")}</p>` : ""}
  `;
  return shell("font-family:Georgia,'Times New Roman',serif;padding:44px 52px;background:#fff;color:#111", body);
}

// ── T2 · Corporate ───────────────────────────────────────────────────────────
function t2(ctx: ResumeHtmlContext): string {
  const navy = "#003366", gold = "#D4A843";
  const sideTitle = `font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff;background:${navy};padding:4px 8px;margin-bottom:8px;margin-top:16px`;
  const mainTitle = `font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${navy};border-bottom:2px solid ${navy};padding-bottom:3px;margin-bottom:10px;margin-top:18px`;
  const body = `
    <div style="background:${navy};padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-end">
      <div><h1 style="font-size:28px;font-weight:700;color:#fff;margin:0;letter-spacing:1px">${name(ctx)}</h1><div style="width:48px;height:3px;background:${gold};margin-top:8px"></div></div>
      <div style="text-align:right;font-size:11px;color:#b3c6e0;line-height:1.9">${contactParts(ctx.pi).map(c => `<div>${c}</div>`).join("")}</div>
    </div>
    <div style="display:flex">
      <div style="width:220px;background:#f0f4f8;padding:20px 16px;flex-shrink:0">
        ${ctx.skls.length ? `<div style="${sideTitle}">Skills</div>${ctx.skls.map(s => `<div style="margin-bottom:8px"><div style="font-size:11px;font-weight:600;color:#333">${esc(s.skillName)}</div>${bar(s.proficiencyLevel, navy)}</div>`).join("")}` : ""}
        ${ctx.langs.length ? `<div style="${sideTitle}">Languages</div>${ctx.langs.map(l => `<div style="margin-bottom:6px"><div style="font-size:11px;font-weight:600">${esc(l.languageName)}</div><div style="font-size:10px;color:#666">${esc(l.proficiency)}</div></div>`).join("")}` : ""}
        ${ctx.certs.length ? `<div style="${sideTitle}">Certifications</div>${ctx.certs.map(c => `<div style="margin-bottom:6px;font-size:10px;color:#333;line-height:1.5"><strong>${esc(c.certName)}</strong>${c.issuingOrg ? `<div style="color:#666">${esc(c.issuingOrg)}</div>` : ""}</div>`).join("")}` : ""}
      </div>
      <div style="flex:1;padding:20px 28px">
        ${ctx.obj ? `<div style="${mainTitle}">Career Objective</div><p style="font-size:12px;line-height:1.7;color:#333;margin:0 0 8px">${esc(ctx.obj.summaryText)}</p>` : ""}
        ${ctx.exps.length ? `<div style="${mainTitle}">Work Experience</div>${ctx.exps.map(e => `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><span style="font-weight:700;font-size:13px;color:${navy}">${esc(e.position)}</span><span style="font-size:10px;color:#777;font-style:italic">${dateRangeHtml(e)}</span></div><div style="font-size:11px;color:#555;margin-bottom:3px">${esc(e.company)}</div><p style="font-size:11px;color:#444;margin:0;line-height:1.6">${esc(e.responsibilities)}</p></div>`).join("")}` : ""}
        ${ctx.projs.length ? `<div style="${mainTitle}">Projects</div>${ctx.projs.map(p => `<div style="margin-bottom:12px"><div style="font-weight:700;font-size:12px;color:${navy}">${esc(p.projectTitle)}</div><div style="font-size:10px;color:${gold};font-weight:600;margin-bottom:3px">${esc(p.technologies)}</div><p style="font-size:11px;color:#444;margin:0;line-height:1.6">${esc(p.description)}</p></div>`).join("")}` : ""}
        ${ctx.edus.length ? `<div style="${mainTitle}">Education</div>${ctx.edus.map(e => `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:12px">${esc(e.degree)} in ${esc(e.fieldOfStudy)}</div><div style="font-size:11px;color:#555">${esc(e.institution)} · ${esc(e.graduationYear)} · CGPA ${esc(e.cgpa)}</div></div>`).join("")}` : ""}
      </div>
    </div>
  `;
  return shell("font-family:Calibri,Arial,sans-serif;background:#fff;color:#222", body);
}

// ── T3 · Creative Designer ───────────────────────────────────────────────────
function t3(ctx: ResumeHtmlContext): string {
  const purple = "#7C3AED", pink = "#DB2777";
  const lbl = `color:rgba(255,255,255,0.6);font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px`;
  const initial = esc((ctx.pi?.fullName || ctx.resumeName || "U")[0]?.toUpperCase() || "U");
  const otherContacts = [ctx.pi?.phone, ctx.pi?.linkedin, ctx.pi?.portfolio, ctx.pi?.address].filter(Boolean).map(esc);
  const body = `
    <div style="display:flex">
      <div style="width:240px;background:linear-gradient(180deg, ${purple} 0%, ${pink} 100%);padding:32px 20px;flex-shrink:0">
        <div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;color:#fff">${initial}</div>
        <h2 style="color:#fff;font-size:16px;font-weight:700;text-align:center;margin:0 0 4px">${name(ctx)}</h2>
        <p style="color:rgba(255,255,255,0.7);font-size:11px;text-align:center;margin:0 0 24px">${esc(ctx.pi?.email)}</p>
        ${otherContacts.map(c => `<div style="color:rgba(255,255,255,0.8);font-size:10px;margin-bottom:4px">↗ ${c}</div>`).join("")}
        <div style="border-top:1px solid rgba(255,255,255,0.25);margin:20px 0 16px"></div>
        ${ctx.skls.length ? `<div style="${lbl}">Skills</div>${ctx.skls.map(s => `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:11px;color:#fff;font-weight:500">${esc(s.skillName)}</span><span style="font-size:9px;color:rgba(255,255,255,0.6)">${esc(s.proficiencyLevel)}</span></div>${bar(s.proficiencyLevel, "#fff", "rgba(255,255,255,0.2)", 4)}</div>`).join("")}` : ""}
        <div style="border-top:1px solid rgba(255,255,255,0.25);margin:16px 0"></div>
        ${ctx.langs.length ? `<div style="${lbl}">Languages</div>${ctx.langs.map(l => `<div style="color:#fff;font-size:11px;margin-bottom:4px">${esc(l.languageName)} <span style="color:rgba(255,255,255,0.6);font-size:10px">(${esc(l.proficiency)})</span></div>`).join("")}` : ""}
      </div>
      <div style="flex:1;padding:32px 28px">
        ${ctx.obj ? `<div style="background:linear-gradient(135deg, #f5f3ff, #fce7f3);border-radius:10px;padding:14px 18px;margin-bottom:20px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${purple};margin-bottom:6px">About Me</div><p style="font-size:12px;line-height:1.7;color:#374151;margin:0">${esc(ctx.obj.summaryText)}</p></div>` : ""}
        ${ctx.exps.length ? `<div style="margin-bottom:20px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${purple};margin-bottom:10px;display:flex;align-items:center;gap:8px"><div style="height:2px;width:20px;background:${purple}"></div>Experience</div>${ctx.exps.map(e => `<div style="margin-bottom:12px;padding-left:14px;border-left:3px solid #e9d5ff"><div style="font-weight:700;font-size:13px;color:#1f2937">${esc(e.position)}</div><div style="font-size:11px;color:${purple};font-weight:500;margin-bottom:2px">${esc(e.company)} · <span style="color:#9ca3af">${dateRangeHtml(e)}</span></div><p style="font-size:11px;color:#4b5563;margin:0;line-height:1.6">${esc(e.responsibilities)}</p></div>`).join("")}</div>` : ""}
        ${ctx.projs.length ? `<div style="margin-bottom:20px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${pink};margin-bottom:10px;display:flex;align-items:center;gap:8px"><div style="height:2px;width:20px;background:${pink}"></div>Projects</div>${ctx.projs.map(p => `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:13px">${esc(p.projectTitle)}</div><div style="font-size:10px;margin-bottom:3px">${(p.technologies || "").split(",").map(t => tag(t.trim(), "#fce7f3", "#9d174d")).join("")}</div><p style="font-size:11px;color:#4b5563;margin:0;line-height:1.6">${esc(p.description)}</p></div>`).join("")}</div>` : ""}
        ${ctx.edus.length ? `<div style="margin-bottom:20px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${purple};margin-bottom:10px;display:flex;align-items:center;gap:8px"><div style="height:2px;width:20px;background:${purple}"></div>Education</div>${ctx.edus.map(e => `<div style="margin-bottom:8px"><div style="font-weight:700;font-size:12px">${esc(e.degree)} in ${esc(e.fieldOfStudy)}</div><div style="font-size:11px;color:#6b7280">${esc(e.institution)} · ${esc(e.graduationYear)} · CGPA ${esc(e.cgpa)}</div></div>`).join("")}</div>` : ""}
        ${ctx.certs.length ? `<div style="margin-bottom:20px"><div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${pink};margin-bottom:10px;display:flex;align-items:center;gap:8px"><div style="height:2px;width:20px;background:${pink}"></div>Certifications</div>${ctx.certs.map(c => `<div style="font-size:11px;margin-bottom:4px"><strong>${esc(c.certName)}</strong>${c.issuingOrg ? ` <span style="color:#6b7280">· ${esc(c.issuingOrg)}</span>` : ""}</div>`).join("")}</div>` : ""}
      </div>
    </div>
  `;
  return shell("font-family:'Montserrat',Arial,sans-serif;background:#fff;color:#222", body);
}

// ── T4 · Executive ───────────────────────────────────────────────────────────
function t4(ctx: ResumeHtmlContext): string {
  const charcoal = "#1C2B3A", gold = "#C9A96E";
  const sh = (label: string) => `<div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${charcoal};margin-bottom:10px;margin-top:22px;display:flex;align-items:center;gap:10px"><div style="flex:1;height:1px;background:#e5e7eb"></div>${label}<div style="flex:1;height:1px;background:#e5e7eb"></div></div>`;
  const body = `
    <div style="background:${charcoal};padding:36px 48px 28px;text-align:center">
      <h1 style="font-size:34px;font-weight:700;color:#fff;margin:0;letter-spacing:4px;text-transform:uppercase">${name(ctx)}</h1>
      <div style="width:60px;height:2px;background:${gold};margin:12px auto"></div>
      <div style="display:flex;justify-content:center;gap:28px;flex-wrap:wrap;margin-top:10px">${contactParts(ctx.pi).map(c => `<span style="font-size:11px;color:#94a3b8">${c}</span>`).join("")}</div>
    </div>
    <div style="padding:8px 48px 36px">
      ${ctx.obj ? `<div style="border-left:4px solid ${gold};padding-left:20px;margin-top:24px;margin-bottom:8px"><p style="font-size:13px;line-height:1.9;color:#374151;margin:0;font-style:italic">${esc(ctx.obj.summaryText)}</p></div>` : ""}
      ${ctx.exps.length ? `${sh("Professional Experience")}${ctx.exps.map((e, i) => `<div style="display:flex;gap:20px;margin-bottom:18px"><div style="display:flex;flex-direction:column;align-items:center;padding-top:4px"><div style="width:12px;height:12px;border-radius:50%;background:${gold};flex-shrink:0"></div>${i < ctx.exps.length - 1 ? `<div style="width:1px;flex:1;background:#e5e7eb;margin-top:4px"></div>` : ""}</div><div style="flex:1"><div style="display:flex;justify-content:space-between"><div style="font-weight:700;font-size:14px;color:${charcoal}">${esc(e.position)}</div><span style="font-size:11px;color:#6b7280;font-style:italic">${dateRangeHtml(e)}</span></div><div style="font-size:12px;color:${gold};font-weight:600;margin-bottom:4px">${esc(e.company)}</div><p style="font-size:12px;color:#4b5563;margin:0;line-height:1.7">${esc(e.responsibilities)}</p></div></div>`).join("")}` : ""}
      ${ctx.edus.length ? `${sh("Education")}<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${ctx.edus.map(e => `<div style="border-top:2px solid ${gold};padding-top:8px"><div style="font-weight:700;font-size:12px;color:${charcoal}">${esc(e.degree)}</div><div style="font-size:11px;color:#6b7280">${esc(e.fieldOfStudy)}</div><div style="font-size:11px;color:#9ca3af">${esc(e.institution)} · ${esc(e.graduationYear)}</div></div>`).join("")}</div>` : ""}
      ${ctx.skls.length ? `${sh("Core Competencies")}<div style="display:flex;flex-wrap:wrap;gap:6px">${ctx.skls.map(s => tag(s.skillName, `${charcoal}11`, charcoal)).join("")}</div>` : ""}
      ${ctx.projs.length ? `${sh("Key Projects")}${ctx.projs.map(p => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><div style="font-weight:700;font-size:13px;color:${charcoal}">${esc(p.projectTitle)}</div><span style="font-size:10px;color:${gold};font-weight:600">${esc(p.technologies)}</span></div><p style="font-size:12px;color:#4b5563;margin:3px 0 0;line-height:1.6">${esc(p.description)}</p></div>`).join("")}` : ""}
    </div>
  `;
  return shell("font-family:Georgia,serif;background:#fff;color:#222", body);
}

// ── T5 · Developer ───────────────────────────────────────────────────────────
function t5(ctx: ResumeHtmlContext): string {
  const green = "#39D353", dark = "#0D1117", darkBorder = "#30363d";
  const sfFont = "font-family:Arial,sans-serif;";
  const body = `
    <div style="background:${dark};padding:28px 36px">
      <h1 style="font-size:26px;font-weight:700;color:#f0f6fc;margin:0 0 8px">${name(ctx)}</h1>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:6px">${contactParts(ctx.pi).map(c => `<span style="font-size:11px;color:#8b949e">${c}</span>`).join("")}</div>
      <div style="margin-top:14px;display:flex;gap:6px;flex-wrap:wrap">${ctx.skls.slice(0, 8).map(s => `<span style="background:#21262d;border:1px solid ${darkBorder};color:${green};font-size:10px;font-weight:600;padding:2px 10px;border-radius:20px">${esc(s.skillName)}</span>`).join("")}</div>
    </div>
    <div style="display:flex">
      <div style="flex:1;padding:24px 28px">
        ${ctx.obj ? `<div style="font-size:11px;font-weight:700;color:${green};margin-bottom:8px">// About</div><p style="font-size:12px;line-height:1.7;color:#4b5563;margin:0 0 20px;padding-left:12px;border-left:3px solid ${darkBorder}">${esc(ctx.obj.summaryText)}</p>` : ""}
        ${ctx.exps.length ? `<div style="font-size:11px;font-weight:700;color:${green};margin-bottom:10px">// Experience</div>${ctx.exps.map(e => `<div style="margin-bottom:14px;padding:12px 14px;border:1px solid ${darkBorder};border-radius:6px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><div style="font-weight:700;font-size:13px;${sfFont}">${esc(e.position)}</div><span style="font-size:10px;color:#6b7280;${sfFont}">${dateRangeHtml(e)}</span></div><div style="font-size:11px;color:${green};margin-bottom:4px;${sfFont}">${esc(e.company)}</div><p style="font-size:11px;color:#4b5563;margin:0;line-height:1.6;${sfFont}">${esc(e.responsibilities)}</p></div>`).join("")}` : ""}
        ${ctx.projs.length ? `<div style="font-size:11px;font-weight:700;color:${green};margin-bottom:10px;margin-top:16px">// Projects</div>${ctx.projs.map(p => `<div style="margin-bottom:14px;padding:12px 14px;border:1px solid ${darkBorder};border-radius:6px"><div style="font-weight:700;font-size:13px;${sfFont}">${esc(p.projectTitle)}</div><div style="margin-bottom:4px">${(p.technologies || "").split(",").map(t => tag(t.trim(), "#f0f6fc", "#0d1117")).join("")}</div><p style="font-size:11px;color:#4b5563;margin:0;line-height:1.6;${sfFont}">${esc(p.description)}</p></div>`).join("")}` : ""}
      </div>
      <div style="width:200px;padding:24px 20px 24px 0;flex-shrink:0">
        ${ctx.edus.length ? `<div style="font-size:11px;font-weight:700;color:${green};margin-bottom:8px">// Education</div>${ctx.edus.map(e => `<div style="margin-bottom:10px;padding:10px;border:1px solid ${darkBorder};border-radius:6px;${sfFont}"><div style="font-weight:600;font-size:11px">${esc(e.degree)}</div><div style="font-size:10px;color:#6b7280">${esc(e.fieldOfStudy)}</div><div style="font-size:10px;color:${green};margin-top:2px">${esc(e.institution)}</div><div style="font-size:10px;color:#9ca3af">${esc(e.graduationYear)} | ${esc(e.cgpa)}</div></div>`).join("")}` : ""}
        ${ctx.skls.slice(8).length ? `<div style="font-size:11px;font-weight:700;color:${green};margin-bottom:8px;margin-top:12px">// More Skills</div>${ctx.skls.slice(8).map(s => `<div style="font-size:11px;color:#374151;margin-bottom:5px;${sfFont}">▶ ${esc(s.skillName)}</div>`).join("")}` : ""}
        ${ctx.certs.length ? `<div style="font-size:11px;font-weight:700;color:${green};margin-bottom:8px;margin-top:12px">// Certs</div>${ctx.certs.map(c => `<div style="font-size:10px;color:#374151;margin-bottom:4px;${sfFont}"><strong>${esc(c.certName)}</strong></div>`).join("")}` : ""}
        ${ctx.langs.length ? `<div style="font-size:11px;font-weight:700;color:${green};margin-bottom:8px;margin-top:12px">// Languages</div>${ctx.langs.map(l => `<div style="font-size:10px;color:#374151;margin-bottom:4px;${sfFont}">${esc(l.languageName)} (${esc(l.proficiency)})</div>`).join("")}` : ""}
      </div>
    </div>
  `;
  return shell("font-family:'Courier New',monospace;background:#fff;color:#24292f", body);
}

// ── T6 · Modern Gradient ─────────────────────────────────────────────────────
function t6(ctx: ResumeHtmlContext): string {
  const initial = esc((ctx.pi?.fullName || ctx.resumeName || "U")[0]?.toUpperCase() || "U");
  const card = "background:#fff;border-radius:10px;padding:16px 20px;box-shadow:0 1px 6px rgba(0,0,0,0.06)";
  const hdr = (color: string) => `font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${color};margin-bottom:10px`;
  const body = `
    <div style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #2563EB 100%);padding:40px 40px 36px">
      <div style="display:flex;align-items:center;gap:24px">
        <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.2);border:3px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;font-weight:700;flex-shrink:0">${initial}</div>
        <div><h1 style="font-size:28px;font-weight:800;color:#fff;margin:0 0 4px">${name(ctx)}</h1><div style="display:flex;flex-wrap:wrap;gap:16px">${contactParts(ctx.pi).map(c => `<span style="font-size:11px;color:rgba(255,255,255,0.8)">${c}</span>`).join("")}</div></div>
      </div>
    </div>
    <div style="padding:24px 36px;background:#f8fafc">
      ${ctx.obj ? `<div style="${card};margin-bottom:16px;border-left:4px solid #4F46E5"><p style="font-size:12px;line-height:1.8;color:#374151;margin:0">${esc(ctx.obj.summaryText)}</p></div>` : ""}
      ${ctx.exps.length ? `<div style="${card};margin-bottom:12px"><div style="${hdr("#4F46E5")}">Experience</div>${ctx.exps.map(e => `<div style="display:flex;gap:14px;margin-bottom:12px"><div style="width:8px;height:8px;border-radius:50%;background:#4F46E5;margin-top:5px;flex-shrink:0"></div><div style="flex:1"><div style="display:flex;justify-content:space-between"><span style="font-weight:700;font-size:13px">${esc(e.position)}</span><span style="font-size:10px;color:#9ca3af">${dateRangeHtml(e, "–")}</span></div><div style="font-size:11px;color:#4F46E5;font-weight:500">${esc(e.company)}</div><p style="font-size:11px;color:#6b7280;margin:3px 0 0;line-height:1.6">${esc(e.responsibilities)}</p></div></div>`).join("")}</div>` : ""}
      ${ctx.edus.length ? `<div style="${card};margin-bottom:12px"><div style="${hdr("#4F46E5")}">Education</div>${ctx.edus.map(e => `<div style="margin-bottom:8px"><div style="font-weight:700;font-size:12px">${esc(e.degree)}</div><div style="font-size:11px;color:#6b7280">${esc(e.fieldOfStudy)} · ${esc(e.institution)}</div><div style="font-size:10px;color:#9ca3af">${esc(e.graduationYear)} · CGPA ${esc(e.cgpa)}</div></div>`).join("")}</div>` : ""}
      ${ctx.skls.length ? `<div style="${card};margin-bottom:12px"><div style="${hdr("#7C3AED")}">Skills</div><div style="display:flex;flex-wrap:wrap;gap:4px">${ctx.skls.map(s => tag(s.skillName, "#ede9fe", "#4F46E5")).join("")}</div></div>` : ""}
      ${ctx.projs.length ? `<div style="${card};margin-bottom:12px"><div style="${hdr("#4F46E5")}">Projects</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${ctx.projs.map(p => `<div style="padding:10px 12px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0"><div style="font-weight:700;font-size:12px">${esc(p.projectTitle)}</div><div style="font-size:10px;color:#4F46E5;margin-bottom:4px">${esc(p.technologies)}</div><p style="font-size:10px;color:#6b7280;margin:0;line-height:1.5">${esc(p.description)}</p></div>`).join("")}</div></div>` : ""}
      ${ctx.certs.length ? `<div style="${card};margin-bottom:12px"><div style="${hdr("#4F46E5")}">Certifications</div><div style="display:flex;flex-wrap:wrap;gap:8px">${ctx.certs.map(c => `<span style="font-size:11px;background:#ede9fe;color:#4F46E5;padding:4px 10px;border-radius:20px;font-weight:500">${esc(c.certName)}</span>`).join("")}</div></div>` : ""}
      ${ctx.langs.length ? `<div style="${card}"><div style="${hdr("#4F46E5")}">Languages</div><div style="display:flex;flex-wrap:wrap;gap:8px">${ctx.langs.map(l => tag(`${l.languageName} · ${l.proficiency}`, "#eff6ff", "#2563EB")).join("")}</div></div>` : ""}
    </div>
  `;
  return shell("font-family:'Inter',Arial,sans-serif;background:#f8fafc;color:#1e293b", body);
}

// ── T7 · Dark Theme ──────────────────────────────────────────────────────────
function t7(ctx: ResumeHtmlContext): string {
  const card = "#1e293b", teal = "#14b8a6", muted = "#94a3b8";
  const initial = esc((ctx.pi?.fullName || ctx.resumeName || "U")[0]?.toUpperCase() || "U");
  const sh = `font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${teal};margin-bottom:10px`;
  const body = `
    <div style="display:flex">
      <div style="width:220px;background:#0d1526;padding:30px 18px;flex-shrink:0">
        <div style="width:72px;height:72px;border-radius:50%;background:${teal}22;border:2px solid ${teal};display:flex;align-items:center;justify-content:center;font-size:26px;color:${teal};font-weight:700;margin-bottom:14px">${initial}</div>
        <h2 style="font-size:15px;font-weight:700;color:#f1f5f9;margin:0 0 4px">${name(ctx)}</h2>
        <div style="width:32px;height:2px;background:${teal};margin-bottom:14px"></div>
        ${contactParts(ctx.pi).map(c => `<div style="font-size:10px;color:${muted};margin-bottom:5px">${c}</div>`).join("")}
        <div style="border-top:1px solid #334155;margin:18px 0 14px"></div>
        ${ctx.skls.length ? `<div style="${sh}">Skills</div>${ctx.skls.map(s => `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:11px;color:#cbd5e1">${esc(s.skillName)}</span><span style="font-size:9px;color:${muted}">${esc(s.proficiencyLevel)}</span></div>${bar(s.proficiencyLevel, teal, "#1e293b", 3)}</div>`).join("")}` : ""}
        <div style="border-top:1px solid #334155;margin:16px 0 14px"></div>
        ${ctx.langs.length ? `<div style="${sh}">Languages</div>${ctx.langs.map(l => `<div style="font-size:11px;color:#cbd5e1;margin-bottom:4px">${esc(l.languageName)} <span style="color:${muted};font-size:10px">(${esc(l.proficiency)})</span></div>`).join("")}` : ""}
        ${ctx.certs.length ? `<div style="border-top:1px solid #334155;margin:16px 0 14px"></div><div style="${sh}">Certifications</div>${ctx.certs.map(c => `<div style="font-size:10px;color:#94a3b8;margin-bottom:5px"><div style="color:#cbd5e1;font-weight:600">${esc(c.certName)}</div>${c.issuingOrg ? `<div>${esc(c.issuingOrg)}</div>` : ""}</div>`).join("")}` : ""}
      </div>
      <div style="flex:1;padding:30px 28px">
        ${ctx.obj ? `<div style="background:${card};border:1px solid #334155;border-left:3px solid ${teal};border-radius:8px;padding:14px 16px;margin-bottom:18px"><p style="font-size:12px;line-height:1.8;color:#cbd5e1;margin:0">${esc(ctx.obj.summaryText)}</p></div>` : ""}
        ${ctx.exps.length ? `<div style="margin-bottom:18px"><div style="${sh}">Experience</div>${ctx.exps.map(e => `<div style="background:${card};border:1px solid #334155;border-radius:8px;padding:12px 14px;margin-bottom:8px"><div style="display:flex;justify-content:space-between"><span style="font-weight:700;font-size:13px;color:#f1f5f9">${esc(e.position)}</span><span style="font-size:10px;color:${muted}">${dateRangeHtml(e, "–")}</span></div><div style="font-size:11px;color:${teal};font-weight:500;margin-bottom:4px">${esc(e.company)}</div><p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.6">${esc(e.responsibilities)}</p></div>`).join("")}</div>` : ""}
        ${ctx.projs.length ? `<div style="margin-bottom:18px"><div style="${sh}">Projects</div>${ctx.projs.map(p => `<div style="background:${card};border:1px solid #334155;border-radius:8px;padding:12px 14px;margin-bottom:8px"><div style="font-weight:700;font-size:12px;color:#f1f5f9">${esc(p.projectTitle)}</div><div style="margin-bottom:4px;margin-top:2px">${(p.technologies || "").split(",").map(t => `<span style="font-size:9px;background:${teal}20;color:${teal};border:1px solid ${teal}40;padding:1px 6px;border-radius:3px;margin-right:4px;font-weight:600">${esc(t.trim())}</span>`).join("")}</div><p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.6">${esc(p.description)}</p></div>`).join("")}</div>` : ""}
        ${ctx.edus.length ? `<div><div style="${sh}">Education</div>${ctx.edus.map(e => `<div style="background:${card};border:1px solid #334155;border-radius:8px;padding:12px 14px;margin-bottom:8px"><div style="font-weight:700;font-size:12px;color:#f1f5f9">${esc(e.degree)} in ${esc(e.fieldOfStudy)}</div><div style="font-size:11px;color:${teal}">${esc(e.institution)}</div><div style="font-size:10px;color:${muted}">${esc(e.graduationYear)} · CGPA ${esc(e.cgpa)}</div></div>`).join("")}</div>` : ""}
      </div>
    </div>
  `;
  return shell("font-family:'Inter',Arial,sans-serif;background:#0f172a;color:#e2e8f0", body);
}

// ── T8 · Infographic ─────────────────────────────────────────────────────────
function t8(ctx: ResumeHtmlContext): string {
  const indigo = "#6366F1", violet = "#8B5CF6";
  const hdr = (color: string) => `font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${color};margin-bottom:10px`;
  const body = `
    <div style="background:linear-gradient(120deg, ${indigo} 0%, ${violet} 100%);padding:28px 36px;display:flex;justify-content:space-between;align-items:center">
      <div><h1 style="font-size:28px;font-weight:800;color:#fff;margin:0 0 4px">${name(ctx)}</h1><div style="display:flex;flex-wrap:wrap;gap:10px">${contactParts(ctx.pi).map(c => `<span style="font-size:10px;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:12px">${c}</span>`).join("")}</div></div>
      ${ctx.skls.length ? `<div style="text-align:right">${ctx.skls.slice(0, 4).map(s => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;justify-content:flex-end"><div style="width:60px;height:6px;background:rgba(255,255,255,0.2);border-radius:3px;overflow:hidden"><div style="width:${PW[s.proficiencyLevel] || "50%"};height:100%;background:#fff;border-radius:3px"></div></div><span style="font-size:10px;color:#fff;font-weight:500;width:70px;text-align:right">${esc(s.skillName)}</span></div>`).join("")}</div>` : ""}
    </div>
    <div style="display:flex">
      <div style="flex:1;padding:24px 28px">
        ${ctx.obj ? `<div style="margin-bottom:20px;padding:14px 16px;background:#f5f3ff;border-radius:8px;border-left:4px solid ${indigo}"><div style="${hdr(indigo)}">Profile</div><p style="font-size:12px;line-height:1.7;color:#374151;margin:0">${esc(ctx.obj.summaryText)}</p></div>` : ""}
        ${ctx.exps.length ? `<div style="margin-bottom:20px"><div style="${hdr(indigo)}">Timeline · Experience</div>${ctx.exps.map((e, i) => `<div style="display:flex"><div style="display:flex;flex-direction:column;align-items:center;width:24px;margin-right:12px"><div style="width:14px;height:14px;border-radius:50%;background:${i === 0 ? indigo : "#e5e7eb"};border:2px solid ${indigo};flex-shrink:0"></div>${i < ctx.exps.length - 1 ? `<div style="width:2px;flex:1;background:${indigo}30;margin:2px 0"></div>` : ""}</div><div style="flex:1;padding-bottom:14px"><div style="display:flex;justify-content:space-between"><span style="font-weight:700;font-size:13px">${esc(e.position)}</span><span style="font-size:10px;color:#9ca3af">${dateRangeHtml(e, "–")}</span></div><div style="font-size:11px;color:${indigo};font-weight:500;margin-bottom:3px">${esc(e.company)}</div><p style="font-size:11px;color:#4b5563;margin:0;line-height:1.6">${esc(e.responsibilities)}</p></div></div>`).join("")}</div>` : ""}
        ${ctx.projs.length ? `<div><div style="${hdr(violet)}">Projects</div>${ctx.projs.map(p => `<div style="margin-bottom:10px;padding:10px 12px;border:1px solid #e0e7ff;border-radius:8px"><div style="font-weight:700;font-size:12px">${esc(p.projectTitle)}</div><div style="font-size:10px;color:${violet};margin:2px 0 4px">${esc(p.technologies)}</div><p style="font-size:11px;color:#6b7280;margin:0;line-height:1.5">${esc(p.description)}</p></div>`).join("")}</div>` : ""}
      </div>
      <div style="width:200px;background:#f8fafc;border-left:1px solid #e5e7eb;padding:24px 18px">
        ${ctx.skls.length ? `<div style="${hdr(indigo)}">Skills</div>${ctx.skls.map(s => `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:2px"><span style="font-size:11px;font-weight:500;color:#374151">${esc(s.skillName)}</span><span style="font-size:9px;color:#9ca3af">${(PW[s.proficiencyLevel] || "50%").replace("%", "")}%</span></div><div style="height:5px;background:#e0e7ff;border-radius:3px;overflow:hidden"><div style="width:${PW[s.proficiencyLevel] || "50%"};height:100%;background:linear-gradient(90deg, ${indigo}, ${violet});border-radius:3px"></div></div></div>`).join("")}<div style="border-top:1px solid #e5e7eb;margin:14px 0"></div>` : ""}
        ${ctx.edus.length ? `<div style="${hdr(violet)}">Education</div>${ctx.edus.map(e => `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:11px">${esc(e.degree)}</div><div style="font-size:10px;color:#6b7280">${esc(e.fieldOfStudy)}</div><div style="font-size:10px;color:${indigo}">${esc(e.institution)}</div><div style="font-size:9px;color:#9ca3af">${esc(e.graduationYear)} · ${esc(e.cgpa)}</div></div>`).join("")}<div style="border-top:1px solid #e5e7eb;margin:14px 0"></div>` : ""}
        ${ctx.certs.length ? `<div style="${hdr(indigo)}">Certs</div>${ctx.certs.map(c => `<div style="font-size:10px;color:#374151;margin-bottom:4px"><div style="font-weight:600">${esc(c.certName)}</div>${c.issuingOrg ? `<div style="color:#9ca3af">${esc(c.issuingOrg)}</div>` : ""}</div>`).join("")}<div style="border-top:1px solid #e5e7eb;margin:14px 0"></div>` : ""}
        ${ctx.langs.length ? `<div style="${hdr(violet)}">Languages</div>${ctx.langs.map(l => `<div style="font-size:10px;margin-bottom:5px"><div style="font-weight:600;color:#374151">${esc(l.languageName)}</div><div style="height:4px;background:#e0e7ff;border-radius:2px;overflow:hidden;margin-top:2px"><div style="width:${PW[l.proficiency] || "50%"};height:100%;background:${violet};border-radius:2px"></div></div></div>`).join("")}` : ""}
      </div>
    </div>
  `;
  return shell("font-family:'Inter',Arial,sans-serif;background:#fff;color:#1f2937", body);
}

// ── T9 · Elegant Professional ────────────────────────────────────────────────
function t9(ctx: ResumeHtmlContext): string {
  const warmGold = "#8B6914";
  const ornament = `<div style="text-align:center;margin:16px 0 12px;color:${warmGold};font-size:14px;letter-spacing:8px">— ✦ —</div>`;
  const title = (t: string) => `<div style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${warmGold};text-align:center;margin-bottom:14px">${t}</div>`;
  const body = `
    <div style="text-align:center;padding:44px 52px 24px;border-bottom:1px solid ${warmGold}55">
      <div style="font-size:10px;letter-spacing:6px;text-transform:uppercase;color:${warmGold};margin-bottom:10px">Curriculum Vitae</div>
      <h1 style="font-size:36px;font-weight:400;margin:0 0 12px;letter-spacing:4px;color:#3b1f0a">${name(ctx)}</h1>
      <div style="width:80px;height:1px;background:${warmGold};margin:0 auto 12px"></div>
      <p style="font-size:11px;color:#7c5c3e;letter-spacing:1px;margin:0;line-height:2">${contactParts(ctx.pi).join(" ✦ ")}</p>
    </div>
    <div style="padding:0 52px 40px">
      ${ctx.obj ? `${ornament}${title("Career Objective")}<p style="font-size:13px;line-height:2;color:#5c3d1e;text-align:justify;margin:0 24px">${esc(ctx.obj.summaryText)}</p>` : ""}
      ${ctx.edus.length ? `${ornament}${title("Education")}${ctx.edus.map(e => `<div style="display:flex;justify-content:space-between;margin-bottom:10px;padding:10px 0;border-bottom:1px dotted ${warmGold}44"><div><div style="font-weight:700;font-size:13px">${esc(e.degree)} in ${esc(e.fieldOfStudy)}</div><div style="font-size:11px;color:#7c5c3e;font-style:italic">${esc(e.institution)}</div></div><div style="text-align:right;font-size:11px;color:${warmGold}"><div>${esc(e.graduationYear)}</div><div>CGPA: ${esc(e.cgpa)}</div></div></div>`).join("")}` : ""}
      ${ctx.exps.length ? `${ornament}${title("Professional Experience")}${ctx.exps.map(e => `<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between"><div style="font-weight:700;font-size:14px">${esc(e.position)}</div><div style="font-size:11px;color:${warmGold};font-style:italic">${dateRangeHtml(e)}</div></div><div style="font-size:12px;color:#7c5c3e;font-style:italic;margin-bottom:4px">${esc(e.company)}</div><p style="font-size:12px;color:#5c3d1e;line-height:1.8;margin:0;text-align:justify">${esc(e.responsibilities)}</p></div>`).join("")}` : ""}
      ${ctx.skls.length ? `${ornament}<div style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:${warmGold};text-align:center;margin-bottom:12px">Areas of Expertise</div><p style="font-size:12px;color:#5c3d1e;text-align:center;line-height:2">${ctx.skls.map(s => esc(s.skillName)).join(" · ")}</p>` : ""}
      ${ctx.projs.length ? `${ornament}${title("Notable Projects")}${ctx.projs.map(p => `<div style="margin-bottom:12px"><div style="font-weight:700;font-size:13px">${esc(p.projectTitle)} <span style="font-weight:400;font-size:11px;font-style:italic;color:${warmGold}">(${esc(p.technologies)})</span></div><p style="font-size:12px;color:#5c3d1e;line-height:1.8;margin:3px 0 0;text-align:justify">${esc(p.description)}</p></div>`).join("")}` : ""}
      ${(ctx.certs.length || ctx.langs.length) ? `${ornament}<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">${ctx.certs.length ? `<div><div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${warmGold};margin-bottom:8px">Certifications</div>${ctx.certs.map(c => `<div style="font-size:12px;color:#5c3d1e;margin-bottom:4px"><strong>${esc(c.certName)}</strong>${c.issuingOrg ? ` <span style="color:#7c5c3e">— ${esc(c.issuingOrg)}</span>` : ""}</div>`).join("")}</div>` : ""}${ctx.langs.length ? `<div><div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${warmGold};margin-bottom:8px">Languages</div>${ctx.langs.map(l => `<div style="font-size:12px;color:#5c3d1e;margin-bottom:4px">${esc(l.languageName)} <span style="color:#7c5c3e;font-style:italic">(${esc(l.proficiency)})</span></div>`).join("")}</div>` : ""}</div>` : ""}
    </div>
  `;
  return shell("font-family:Georgia,'Times New Roman',serif;background:#faf7f0;color:#3b1f0a", body);
}

// ── T10 · Startup Founder ─────────────────────────────────────────────────────
function t10(ctx: ResumeHtmlContext): string {
  const orange = "#F97316", dark = "#0c0a09";
  const hdr = `font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${orange};margin-bottom:10px`;
  const body = `
    <div style="padding:32px 40px 0">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div style="font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:${orange};margin-bottom:6px">Resume</div><h1 style="font-size:38px;font-weight:900;color:${dark};margin:0 0 6px;letter-spacing:-1.5px;line-height:1">${name(ctx)}</h1></div>
        <div style="text-align:right;padding-top:8px">${contactParts(ctx.pi).map(c => `<div style="font-size:11px;color:#6b7280;margin-bottom:2px">${c}</div>`).join("")}</div>
      </div>
      <div style="height:4px;background:${orange};border-radius:2px;margin:16px 0"></div>
    </div>
    <div style="display:flex">
      <div style="flex:1;padding:20px 40px 36px 40px">
        ${ctx.obj ? `<div style="background:#fff7ed;border:2px solid ${orange};border-radius:10px;padding:14px 18px;margin-bottom:20px"><div style="${hdr}">Mission Statement</div><p style="font-size:12px;line-height:1.8;color:#1c1917;margin:0;font-weight:500">${esc(ctx.obj.summaryText)}</p></div>` : ""}
        ${ctx.projs.length ? `<div style="margin-bottom:20px"><div style="${hdr}">Ventures & Projects</div>${ctx.projs.map((p, i) => `<div style="margin-bottom:12px;padding:14px 16px;border:1px solid #e7e5e4;border-radius:8px;border-left:4px solid ${i === 0 ? orange : "#e7e5e4"}"><div style="font-weight:800;font-size:14px;color:${dark}">${esc(p.projectTitle)}</div><div style="font-size:10px;color:${orange};font-weight:600;margin-bottom:4px">${esc(p.technologies)}</div><p style="font-size:11px;color:#57534e;margin:0;line-height:1.6">${esc(p.description)}</p>${p.projectLink ? `<div style="font-size:10px;color:${orange};margin-top:4px">↗ ${esc(p.projectLink)}</div>` : ""}</div>`).join("")}</div>` : ""}
        ${ctx.exps.length ? `<div style="margin-bottom:20px"><div style="${hdr}">Experience</div>${ctx.exps.map(e => `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><span style="font-weight:800;font-size:14px;color:${dark}">${esc(e.position)}</span><span style="font-size:10px;color:#9ca3af;background:#f3f4f6;padding:2px 8px;border-radius:12px">${dateRangeHtml(e, "–")}</span></div><div style="font-size:11px;color:${orange};font-weight:600;margin-bottom:3px">${esc(e.company)}</div><p style="font-size:11px;color:#57534e;margin:0;line-height:1.6">${esc(e.responsibilities)}</p></div>`).join("")}</div>` : ""}
      </div>
      <div style="width:210px;background:#fafaf9;border-left:1px solid #e7e5e4;padding:20px 18px">
        ${ctx.skls.length ? `<div style="${hdr}">Tech Stack</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:18px">${ctx.skls.map(s => `<span style="font-size:10px;background:${dark};color:#fff;padding:3px 8px;border-radius:4px;font-weight:600">${esc(s.skillName)}</span>`).join("")}</div>` : ""}
        ${ctx.edus.length ? `<div style="${hdr}">Education</div>${ctx.edus.map(e => `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:12px">${esc(e.degree)}</div><div style="font-size:11px;color:#57534e">${esc(e.fieldOfStudy)}</div><div style="font-size:10px;color:${orange};font-weight:600">${esc(e.institution)}</div><div style="font-size:10px;color:#9ca3af">${esc(e.graduationYear)} · ${esc(e.cgpa)} CGPA</div></div>`).join("")}` : ""}
        ${ctx.certs.length ? `<div style="${hdr};margin-top:14px">Certifications</div>${ctx.certs.map(c => `<div style="font-size:10px;color:#374151;margin-bottom:5px"><div style="font-weight:700">${esc(c.certName)}</div>${c.issuingOrg ? `<div style="color:#9ca3af">${esc(c.issuingOrg)}</div>` : ""}</div>`).join("")}` : ""}
        ${ctx.langs.length ? `<div style="${hdr};margin-top:14px">Languages</div>${ctx.langs.map(l => `<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px"><span style="font-weight:600">${esc(l.languageName)}</span><span style="color:#9ca3af">${esc(l.proficiency)}</span></div>`).join("")}` : ""}
      </div>
    </div>
  `;
  return shell("font-family:'Inter',Arial,sans-serif;background:#fff;color:" + dark, body);
}

const BUILDERS: Record<number, (ctx: ResumeHtmlContext) => string> = {
  1: t1, 2: t2, 3: t3, 4: t4, 5: t5, 6: t6, 7: t7, 8: t8, 9: t9, 10: t10,
};

export function renderResumeHtml(templateId: number, ctx: ResumeHtmlContext): string {
  return (BUILDERS[templateId] || t1)(ctx);
}
