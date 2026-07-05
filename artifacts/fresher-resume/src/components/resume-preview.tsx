import type { PersonalInfo, Objective, Education, Skill, Project, Experience, Certification, Language } from "@workspace/api-client-react";

interface ResumeData {
  personalInfo?: PersonalInfo | null;
  objective?: Objective | null;
  education: Education[];
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  certifications: Certification[];
  languages: Language[];
}

interface ResumePreviewProps {
  data: ResumeData;
  templateId: number;
  resumeName?: string;
  fontFamily?: string;
}

type TP = { data: ResumeData; resumeName?: string; fontFamily?: string };

const PW: Record<string, string> = {
  Beginner: "25%", Intermediate: "55%", Advanced: "80%", Expert: "100%",
  Native: "100%", Fluent: "80%", Basic: "30%",
};

const contact = (pi: PersonalInfo | null | undefined) =>
  [pi?.email, pi?.phone, pi?.linkedin, pi?.portfolio, pi?.address].filter(Boolean);

// Strips empty/placeholder values stored by the import flow so they don't
// appear as literal text in the rendered template.
const clean = (v: string | null | undefined): string => {
  if (!v) return "";
  const t = v.trim();
  return t.toLowerCase() === "not specified" ? "" : t;
};

// Returns a formatted date range string, omitting the separator when either
// side is empty so templates never render a lonely " – " or a trailing dash.
const dateRange = (
  start: string | null | undefined,
  end: string | null | undefined,
  isCurrent: boolean,
  presentLabel = "Present",
  sep = " – ",
): string => {
  const s = clean(start);
  const e = isCurrent ? presentLabel : clean(end);
  if (!s && !e) return "";
  if (!s) return e;
  if (!e) return s;
  return `${s}${sep}${e}`;
};

// ── Shared helpers ───────────────────────────────────────────────────────────

function Tag({ text, bg, color }: { text: string; bg: string; color: string }) {
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, marginRight: 4, marginBottom: 4, display: "inline-block" }}>{text}</span>;
}

function Bar({ level, color }: { level: string; color: string }) {
  return (
    <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", marginTop: 3 }}>
      <div style={{ width: PW[level] || "50%", height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T1 · Minimal ATS Resume
// Clean, single-column, serif, no decoration — maximum ATS pass-through
// ────────────────────────────────────────────────────────────────────────────
function T1MinimalATS({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', Georgia, serif` : "Georgia, serif";
  const sh: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, borderBottom: "1px solid #999", paddingBottom: 4, marginBottom: 10, marginTop: 20, color: "#111" };
  return (
    <div className="resume-preview" style={{ fontFamily: ff, padding: "44px 52px", background: "#fff", color: "#111" }}>
      <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 18, borderBottom: "2px solid #111" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: 3, margin: 0, textTransform: "uppercase" }}>{pi?.fullName || resumeName || "Your Name"}</h1>
        <p style={{ fontSize: 11, color: "#444", margin: "8px 0 0", letterSpacing: 0.5, lineHeight: 1.8 }}>{contact(pi).join(" · ")}</p>
      </div>
      {data.objective && (<><h2 style={sh}>Career Objective</h2><p style={{ fontSize: 12, lineHeight: 1.8, color: "#333", margin: 0 }}>{data.objective.summaryText}</p></>)}
      {data.education.length > 0 && (<><h2 style={sh}>Education</h2>{data.education.map(e => (<div key={e.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div><div style={{ fontWeight: 600, fontSize: 12 }}>{e.degree} in {e.fieldOfStudy}</div><div style={{ fontSize: 11, color: "#555" }}>{e.institution}</div></div><div style={{ textAlign: "right", fontSize: 11, color: "#555" }}><div>{e.graduationYear}</div><div>CGPA: {e.cgpa}</div></div></div>))}</>)}
      {data.skills.length > 0 && (<><h2 style={sh}>Skills</h2><p style={{ fontSize: 12, color: "#333", lineHeight: 2, margin: 0 }}>{data.skills.map(s => s.skillName).join(" · ")}</p></>)}
      {data.projects.length > 0 && (<><h2 style={sh}>Projects</h2>{data.projects.map(p => (<div key={p.id} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 600, fontSize: 12 }}>{p.projectTitle}</span><span style={{ fontSize: 11, fontStyle: "italic", color: "#555" }}>{p.technologies}</span></div><p style={{ fontSize: 11, color: "#444", margin: "3px 0 0", lineHeight: 1.6 }}>{p.description}</p></div>))}</>)}
      {data.experience.length > 0 && (<><h2 style={sh}>Work Experience</h2>{data.experience.map(e => (<div key={e.id} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 600, fontSize: 12 }}>{e.position}, {e.company}</span><span style={{ fontSize: 11, color: "#555" }}>{dateRange(e.startDate, e.endDate, e.isCurrent)}</span></div><p style={{ fontSize: 11, color: "#444", margin: "3px 0 0", lineHeight: 1.6 }}>{e.responsibilities}</p></div>))}</>)}
      {data.certifications.length > 0 && (<><h2 style={sh}>Certifications</h2>{data.certifications.map(c => (<div key={c.id} style={{ marginBottom: 5, fontSize: 12 }}><strong>{c.certName}</strong>{c.issuingOrg && <span style={{ color: "#555" }}> — {c.issuingOrg}{c.dateIssued ? ` (${c.dateIssued})` : ""}</span>}</div>))}</>)}
      {data.languages.length > 0 && (<><h2 style={sh}>Languages</h2><p style={{ fontSize: 12, color: "#333" }}>{data.languages.map(l => `${l.languageName} (${l.proficiency})`).join(" · ")}</p></>)}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T2 · Corporate Resume
// Navy header, formal two-column layout — finance, consulting, management
// ────────────────────────────────────────────────────────────────────────────
function T2Corporate({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', sans-serif` : "'Calibri', sans-serif";
  const navy = "#003366"; const gold = "#D4A843";
  const sideTitle: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: "#fff", background: navy, padding: "4px 8px", marginBottom: 8, marginTop: 16 };
  const mainTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: 3, marginBottom: 10, marginTop: 18 };
  return (
    <div className="resume-preview" style={{ fontFamily: ff, background: "#fff", color: "#222", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: navy, padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: 1 }}>{pi?.fullName || resumeName || "Your Name"}</h1>
          <div style={{ width: 48, height: 3, background: gold, marginTop: 8 }} />
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "#b3c6e0", lineHeight: 1.9 }}>
          {contact(pi).map((c, i) => <div key={i}>{c}</div>)}
        </div>
      </div>
      {/* Body */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#f0f4f8", padding: "20px 16px", flexShrink: 0 }}>
          {data.skills.length > 0 && (<><div style={sideTitle}>Skills</div>{data.skills.map(s => (<div key={s.id} style={{ marginBottom: 8 }}><div style={{ fontSize: 11, fontWeight: 600, color: "#333" }}>{s.skillName}</div><Bar level={s.proficiencyLevel} color={navy} /></div>))}</>)}
          {data.languages.length > 0 && (<><div style={sideTitle}>Languages</div>{data.languages.map(l => (<div key={l.id} style={{ marginBottom: 6 }}><div style={{ fontSize: 11, fontWeight: 600 }}>{l.languageName}</div><div style={{ fontSize: 10, color: "#666" }}>{l.proficiency}</div></div>))}</>)}
          {data.certifications.length > 0 && (<><div style={sideTitle}>Certifications</div>{data.certifications.map(c => (<div key={c.id} style={{ marginBottom: 6, fontSize: 10, color: "#333", lineHeight: 1.5 }}><strong>{c.certName}</strong>{c.issuingOrg && <div style={{ color: "#666" }}>{c.issuingOrg}</div>}</div>))}</>)}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: "20px 28px" }}>
          {data.objective && (<><div style={mainTitle}>Career Objective</div><p style={{ fontSize: 12, lineHeight: 1.7, color: "#333", margin: "0 0 8px" }}>{data.objective.summaryText}</p></>)}
          {data.experience.length > 0 && (<><div style={mainTitle}>Work Experience</div>{data.experience.map(e => (<div key={e.id} style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, fontSize: 13, color: navy }}>{e.position}</span><span style={{ fontSize: 10, color: "#777", fontStyle: "italic" }}>{dateRange(e.startDate, e.endDate, e.isCurrent)}</span></div><div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>{e.company}</div><p style={{ fontSize: 11, color: "#444", margin: 0, lineHeight: 1.6 }}>{e.responsibilities}</p></div>))}</>)}
          {data.projects.length > 0 && (<><div style={mainTitle}>Projects</div>{data.projects.map(p => (<div key={p.id} style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 12, color: navy }}>{p.projectTitle}</div><div style={{ fontSize: 10, color: gold, fontWeight: 600, marginBottom: 3 }}>{p.technologies}</div><p style={{ fontSize: 11, color: "#444", margin: 0, lineHeight: 1.6 }}>{p.description}</p></div>))}</>)}
          {data.education.length > 0 && (<><div style={mainTitle}>Education</div>{data.education.map(e => (<div key={e.id} style={{ marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{e.degree} in {e.fieldOfStudy}</div><div style={{ fontSize: 11, color: "#555" }}>{e.institution} · {e.graduationYear} · CGPA {e.cgpa}</div></div>))}</>)}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T3 · Creative Designer Resume
// Purple gradient sidebar + white main — design, marketing, UX roles
// ────────────────────────────────────────────────────────────────────────────
function T3CreativeDesigner({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', sans-serif` : "'Montserrat', sans-serif";
  return (
    <div className="resume-preview" style={{ fontFamily: ff, display: "flex", background: "#fff", color: "#222" }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: "linear-gradient(180deg, #7C3AED 0%, #DB2777 100%)", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
        {/* Avatar */}
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32, color: "#fff" }}>
          {(pi?.fullName || resumeName || "U")[0]?.toUpperCase()}
        </div>
        <h2 style={{ color: "#fff", fontSize: 16, fontWeight: 700, textAlign: "center", margin: "0 0 4px" }}>{pi?.fullName || resumeName || "Your Name"}</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, textAlign: "center", margin: "0 0 24px" }}>{pi?.email}</p>
        {contact(pi).filter(c => c !== pi?.email).map((c, i) => <div key={i} style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, marginBottom: 4 }}>↗ {c}</div>)}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.25)", margin: "20px 0 16px" }} />
        {data.skills.length > 0 && (<><div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 10 }}>Skills</div>{data.skills.map(s => (<div key={s.id} style={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 11, color: "#fff", fontWeight: 500 }}>{s.skillName}</span><span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{s.proficiencyLevel}</span></div><div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" }}><div style={{ width: PW[s.proficiencyLevel] || "50%", height: "100%", background: "#fff", borderRadius: 2 }} /></div></div>))}</>)}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.25)", margin: "16px 0" }} />
        {data.languages.length > 0 && (<><div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 8 }}>Languages</div>{data.languages.map(l => (<div key={l.id} style={{ color: "#fff", fontSize: 11, marginBottom: 4 }}>{l.languageName} <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>({l.proficiency})</span></div>))}</>)}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: "32px 28px" }}>
        {data.objective && (<div style={{ background: "linear-gradient(135deg, #f5f3ff, #fce7f3)", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#7C3AED", marginBottom: 6 }}>About Me</div><p style={{ fontSize: 12, lineHeight: 1.7, color: "#374151", margin: 0 }}>{data.objective.summaryText}</p></div>)}
        {["experience", "projects", "education", "certifications"].map(section => {
          if (section === "experience" && data.experience.length > 0) return (<div key="exp" style={{ marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#7C3AED", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><div style={{ height: 2, width: 20, background: "#7C3AED" }} />Experience</div>{data.experience.map(e => (<div key={e.id} style={{ marginBottom: 12, paddingLeft: 14, borderLeft: "3px solid #e9d5ff" }}><div style={{ fontWeight: 700, fontSize: 13, color: "#1f2937" }}>{e.position}</div><div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 500, marginBottom: 2 }}>{e.company} · <span style={{ color: "#9ca3af" }}>{dateRange(e.startDate, e.endDate, e.isCurrent)}</span></div><p style={{ fontSize: 11, color: "#4b5563", margin: 0, lineHeight: 1.6 }}>{e.responsibilities}</p></div>))}</div>);
          if (section === "projects" && data.projects.length > 0) return (<div key="proj" style={{ marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#DB2777", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><div style={{ height: 2, width: 20, background: "#DB2777" }} />Projects</div>{data.projects.map(p => (<div key={p.id} style={{ marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{p.projectTitle}</div><div style={{ fontSize: 10, marginBottom: 3 }}>{p.technologies?.split(",").map(t => <Tag key={t} text={t.trim()} bg="#fce7f3" color="#9d174d" />)}</div><p style={{ fontSize: 11, color: "#4b5563", margin: 0, lineHeight: 1.6 }}>{p.description}</p></div>))}</div>);
          if (section === "education" && data.education.length > 0) return (<div key="edu" style={{ marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#7C3AED", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><div style={{ height: 2, width: 20, background: "#7C3AED" }} />Education</div>{data.education.map(e => (<div key={e.id} style={{ marginBottom: 8 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{e.degree} in {e.fieldOfStudy}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{e.institution} · {e.graduationYear} · CGPA {e.cgpa}</div></div>))}</div>);
          if (section === "certifications" && data.certifications.length > 0) return (<div key="cert" style={{ marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#DB2777", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><div style={{ height: 2, width: 20, background: "#DB2777" }} />Certifications</div>{data.certifications.map(c => (<div key={c.id} style={{ fontSize: 11, marginBottom: 4 }}><strong>{c.certName}</strong>{c.issuingOrg && <span style={{ color: "#6b7280" }}> · {c.issuingOrg}</span>}</div>))}</div>);
          return null;
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T4 · Executive Resume
// Dark charcoal header + gold accents — senior roles, management, leadership
// ────────────────────────────────────────────────────────────────────────────
function T4Executive({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', sans-serif` : "'Georgia', serif";
  const charcoal = "#1C2B3A"; const gold = "#C9A96E";
  const sh: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, color: charcoal, marginBottom: 10, marginTop: 22, display: "flex", alignItems: "center", gap: 10 };
  return (
    <div className="resume-preview" style={{ fontFamily: ff, background: "#fff", color: "#222" }}>
      <div style={{ background: charcoal, padding: "36px 48px 28px", textAlign: "center" }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: 4, textTransform: "uppercase" as const }}>{pi?.fullName || resumeName || "Your Name"}</h1>
        <div style={{ width: 60, height: 2, background: gold, margin: "12px auto" }} />
        <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" as const, marginTop: 10 }}>
          {contact(pi).map((c, i) => <span key={i} style={{ fontSize: 11, color: "#94a3b8" }}>{c}</span>)}
        </div>
      </div>
      <div style={{ padding: "8px 48px 36px" }}>
        {data.objective && (<div style={{ borderLeft: `4px solid ${gold}`, paddingLeft: 20, marginTop: 24, marginBottom: 8 }}><p style={{ fontSize: 13, lineHeight: 1.9, color: "#374151", margin: 0, fontStyle: "italic" }}>{data.objective.summaryText}</p></div>)}
        {data.experience.length > 0 && (<><div style={sh}><div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />Professional Experience<div style={{ flex: 1, height: 1, background: "#e5e7eb" }} /></div>{data.experience.map((e, i) => (<div key={e.id} style={{ display: "flex", gap: 20, marginBottom: 18 }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, paddingTop: 4 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: gold, flexShrink: 0 }} />{i < data.experience.length - 1 && <div style={{ width: 1, flex: 1, background: "#e5e7eb", marginTop: 4 }} />}</div><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontWeight: 700, fontSize: 14, color: charcoal }}>{e.position}</div><span style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>{dateRange(e.startDate, e.endDate, e.isCurrent)}</span></div><div style={{ fontSize: 12, color: gold, fontWeight: 600, marginBottom: 4 }}>{e.company}</div><p style={{ fontSize: 12, color: "#4b5563", margin: 0, lineHeight: 1.7 }}>{e.responsibilities}</p></div></div>))}</>)}
        {data.education.length > 0 && (<><div style={sh}><div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />Education<div style={{ flex: 1, height: 1, background: "#e5e7eb" }} /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{data.education.map(e => (<div key={e.id} style={{ borderTop: `2px solid ${gold}`, paddingTop: 8 }}><div style={{ fontWeight: 700, fontSize: 12, color: charcoal }}>{e.degree}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{e.fieldOfStudy}</div><div style={{ fontSize: 11, color: "#9ca3af" }}>{e.institution} · {e.graduationYear}</div></div>))}</div></>)}
        {data.skills.length > 0 && (<><div style={sh}><div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />Core Competencies<div style={{ flex: 1, height: 1, background: "#e5e7eb" }} /></div><div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>{data.skills.map(s => <Tag key={s.id} text={s.skillName} bg={`${charcoal}11`} color={charcoal} />)}</div></>)}
        {data.projects.length > 0 && (<><div style={sh}><div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />Key Projects<div style={{ flex: 1, height: 1, background: "#e5e7eb" }} /></div>{data.projects.map(p => (<div key={p.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontWeight: 700, fontSize: 13, color: charcoal }}>{p.projectTitle}</div><span style={{ fontSize: 10, color: gold, fontWeight: 600 }}>{p.technologies}</span></div><p style={{ fontSize: 12, color: "#4b5563", margin: "3px 0 0", lineHeight: 1.6 }}>{p.description}</p></div>))}</>)}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T5 · Developer Resume
// Dark GitHub-inspired header, green accent, code-style — CS, engineering
// ────────────────────────────────────────────────────────────────────────────
function T5Developer({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', monospace` : "'Courier New', monospace";
  const green = "#39D353"; const dark = "#0D1117"; const darkBorder = "#30363d";
  return (
    <div className="resume-preview" style={{ fontFamily: ff, background: "#fff", color: "#24292f" }}>
      <div style={{ background: dark, padding: "28px 36px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f0f6fc", margin: "0 0 8px" }}>{pi?.fullName || resumeName || "Your Name"}</h1>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, marginTop: 6 }}>
          {contact(pi).map((c, i) => <span key={i} style={{ fontSize: 11, color: "#8b949e" }}>{c}</span>)}
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          {data.skills.slice(0, 8).map(s => <span key={s.id} style={{ background: "#21262d", border: `1px solid ${darkBorder}`, color: green, fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20 }}>{s.skillName}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left column */}
        <div style={{ flex: 1, padding: "24px 28px" }}>
          {data.objective && (<><div style={{ fontSize: 11, fontWeight: 700, color: green, marginBottom: 8, marginTop: 0 }}>{"// About"}</div><p style={{ fontSize: 12, lineHeight: 1.7, color: "#4b5563", margin: "0 0 20px", paddingLeft: 12, borderLeft: `3px solid ${darkBorder}` }}>{data.objective.summaryText}</p></>)}
          {data.experience.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 700, color: green, marginBottom: 10 }}>{"// Experience"}</div>{data.experience.map(e => (<div key={e.id} style={{ marginBottom: 14, padding: "12px 14px", border: `1px solid ${darkBorder}`, borderRadius: 6 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><div style={{ fontWeight: 700, fontSize: 13, fontFamily: "sans-serif" }}>{e.position}</div><span style={{ fontSize: 10, color: "#6b7280", fontFamily: "sans-serif" }}>{dateRange(e.startDate, e.endDate, e.isCurrent)}</span></div><div style={{ fontSize: 11, color: green, marginBottom: 4, fontFamily: "sans-serif" }}>{e.company}</div><p style={{ fontSize: 11, color: "#4b5563", margin: 0, lineHeight: 1.6, fontFamily: "sans-serif" }}>{e.responsibilities}</p></div>))}</>)}
          {data.projects.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 700, color: green, marginBottom: 10, marginTop: 16 }}>{"// Projects"}</div>{data.projects.map(p => (<div key={p.id} style={{ marginBottom: 14, padding: "12px 14px", border: `1px solid ${darkBorder}`, borderRadius: 6 }}><div style={{ fontWeight: 700, fontSize: 13, fontFamily: "sans-serif" }}>{p.projectTitle}</div><div style={{ marginBottom: 4 }}>{p.technologies?.split(",").map(t => <Tag key={t} text={t.trim()} bg="#f0f6fc" color="#0d1117" />)}</div><p style={{ fontSize: 11, color: "#4b5563", margin: 0, lineHeight: 1.6, fontFamily: "sans-serif" }}>{p.description}</p></div>))}</>)}
        </div>
        {/* Right column */}
        <div style={{ width: 200, padding: "24px 20px 24px 0", flexShrink: 0 }}>
          {data.education.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 700, color: green, marginBottom: 8 }}>{"// Education"}</div>{data.education.map(e => (<div key={e.id} style={{ marginBottom: 10, padding: "10px", border: `1px solid ${darkBorder}`, borderRadius: 6, fontFamily: "sans-serif" }}><div style={{ fontWeight: 600, fontSize: 11 }}>{e.degree}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{e.fieldOfStudy}</div><div style={{ fontSize: 10, color: green, marginTop: 2 }}>{e.institution}</div><div style={{ fontSize: 10, color: "#9ca3af" }}>{e.graduationYear} | {e.cgpa}</div></div>))}</>)}
          {data.skills.slice(8).length > 0 && (<><div style={{ fontSize: 11, fontWeight: 700, color: green, marginBottom: 8, marginTop: 12 }}>{"// More Skills"}</div>{data.skills.slice(8).map(s => (<div key={s.id} style={{ fontSize: 11, color: "#374151", marginBottom: 5, fontFamily: "sans-serif" }}>▶ {s.skillName}</div>))}</>)}
          {data.certifications.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 700, color: green, marginBottom: 8, marginTop: 12 }}>{"// Certs"}</div>{data.certifications.map(c => (<div key={c.id} style={{ fontSize: 10, color: "#374151", marginBottom: 4, fontFamily: "sans-serif" }}><strong>{c.certName}</strong></div>))}</>)}
          {data.languages.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 700, color: green, marginBottom: 8, marginTop: 12 }}>{"// Languages"}</div>{data.languages.map(l => (<div key={l.id} style={{ fontSize: 10, color: "#374151", marginBottom: 4, fontFamily: "sans-serif" }}>{l.languageName} ({l.proficiency})</div>))}</>)}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T6 · Modern Gradient Resume
// Indigo-to-violet gradient header, card sections — modern tech roles
// ────────────────────────────────────────────────────────────────────────────
function T6ModernGradient({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', sans-serif` : "'Inter', sans-serif";
  return (
    <div className="resume-preview" style={{ fontFamily: ff, background: "#f8fafc", color: "#1e293b" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #2563EB 100%)", padding: "40px 40px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -20, left: 200, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 24, position: "relative" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
            {(pi?.fullName || resumeName || "U")[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: -0.5 }}>{pi?.fullName || resumeName || "Your Name"}</h1>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 16 }}>
              {contact(pi).map((c, i) => <span key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{c}</span>)}
            </div>
          </div>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: "24px 36px" }}>
        {data.objective && (<div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 6px rgba(79,70,229,0.1)", borderLeft: "4px solid #4F46E5" }}><p style={{ fontSize: 12, lineHeight: 1.8, color: "#374151", margin: 0 }}>{data.objective.summaryText}</p></div>)}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {data.experience.length > 0 && (<div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#4F46E5", marginBottom: 12 }}>Experience</div>{data.experience.map(e => (<div key={e.id} style={{ display: "flex", gap: 14, marginBottom: 12 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4F46E5", marginTop: 5, flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, fontSize: 13 }}>{e.position}</span><span style={{ fontSize: 10, color: "#9ca3af" }}>{dateRange(e.startDate, e.endDate, e.isCurrent, "Now", "–")}</span></div><div style={{ fontSize: 11, color: "#4F46E5", fontWeight: 500 }}>{e.company}</div><p style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 0", lineHeight: 1.6 }}>{e.responsibilities}</p></div></div>))}</div>)}
          {data.education.length > 0 && (<div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#4F46E5", marginBottom: 10 }}>Education</div>{data.education.map(e => (<div key={e.id} style={{ marginBottom: 8 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{e.degree}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{e.fieldOfStudy} · {e.institution}</div><div style={{ fontSize: 10, color: "#9ca3af" }}>{e.graduationYear} · CGPA {e.cgpa}</div></div>))}</div>)}
          {data.skills.length > 0 && (<div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#7C3AED", marginBottom: 10 }}>Skills</div><div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>{data.skills.map(s => <Tag key={s.id} text={s.skillName} bg="#ede9fe" color="#4F46E5" />)}</div></div>)}
          {data.projects.length > 0 && (<div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#4F46E5", marginBottom: 10 }}>Projects</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{data.projects.map(p => (<div key={p.id} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}><div style={{ fontWeight: 700, fontSize: 12 }}>{p.projectTitle}</div><div style={{ fontSize: 10, color: "#4F46E5", marginBottom: 4 }}>{p.technologies}</div><p style={{ fontSize: 10, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{p.description}</p></div>))}</div></div>)}
        </div>
        {data.certifications.length > 0 && (<div style={{ background: "#fff", borderRadius: 10, padding: "14px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: 12 }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#4F46E5", marginBottom: 8 }}>Certifications</div><div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>{data.certifications.map(c => <span key={c.id} style={{ fontSize: 11, background: "#ede9fe", color: "#4F46E5", padding: "4px 10px", borderRadius: 20, fontWeight: 500 }}>{c.certName}</span>)}</div></div>)}
        {data.languages.length > 0 && (<div style={{ background: "#fff", borderRadius: 10, padding: "14px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: "#4F46E5", marginBottom: 8 }}>Languages</div><div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>{data.languages.map(l => <Tag key={l.id} text={`${l.languageName} · ${l.proficiency}`} bg="#eff6ff" color="#2563EB" />)}</div></div>)}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T7 · Dark Theme Resume
// Full dark background, teal accent, sidebar — modern dark UI aesthetic
// ────────────────────────────────────────────────────────────────────────────
function T7DarkTheme({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', sans-serif` : "'Inter', sans-serif";
  const bg = "#0f172a"; const card = "#1e293b"; const teal = "#14b8a6"; const muted = "#94a3b8";
  const sh: React.CSSProperties = { fontSize: 9, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase" as const, color: teal, marginBottom: 10 };
  return (
    <div className="resume-preview" style={{ fontFamily: ff, background: bg, color: "#e2e8f0", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "#0d1526", padding: "30px 18px", flexShrink: 0 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${teal}22`, border: `2px solid ${teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: teal, fontWeight: 700, marginBottom: 14 }}>
          {(pi?.fullName || resumeName || "U")[0]?.toUpperCase()}
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px", lineHeight: 1.3 }}>{pi?.fullName || resumeName || "Your Name"}</h2>
        <div style={{ width: 32, height: 2, background: teal, marginBottom: 14 }} />
        {contact(pi).map((c, i) => <div key={i} style={{ fontSize: 10, color: muted, marginBottom: 5, lineHeight: 1.4 }}>{c}</div>)}
        <div style={{ borderTop: `1px solid #334155`, margin: "18px 0 14px" }} />
        {data.skills.length > 0 && (<><div style={sh}>Skills</div>{data.skills.map(s => (<div key={s.id} style={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 11, color: "#cbd5e1" }}>{s.skillName}</span><span style={{ fontSize: 9, color: muted }}>{s.proficiencyLevel}</span></div><div style={{ height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}><div style={{ width: PW[s.proficiencyLevel] || "50%", height: "100%", background: teal, borderRadius: 2 }} /></div></div>))}</>)}
        <div style={{ borderTop: `1px solid #334155`, margin: "16px 0 14px" }} />
        {data.languages.length > 0 && (<><div style={sh}>Languages</div>{data.languages.map(l => (<div key={l.id} style={{ fontSize: 11, color: "#cbd5e1", marginBottom: 4 }}>{l.languageName} <span style={{ color: muted, fontSize: 10 }}>({l.proficiency})</span></div>))}</>)}
        {data.certifications.length > 0 && (<><div style={{ borderTop: `1px solid #334155`, margin: "16px 0 14px" }} /><div style={sh}>Certifications</div>{data.certifications.map(c => (<div key={c.id} style={{ fontSize: 10, color: "#94a3b8", marginBottom: 5, lineHeight: 1.4 }}><div style={{ color: "#cbd5e1", fontWeight: 600 }}>{c.certName}</div>{c.issuingOrg && <div>{c.issuingOrg}</div>}</div>))}</>)}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: "30px 28px" }}>
        {data.objective && (<div style={{ background: card, border: `1px solid #334155`, borderLeft: `3px solid ${teal}`, borderRadius: 8, padding: "14px 16px", marginBottom: 18 }}><p style={{ fontSize: 12, lineHeight: 1.8, color: "#cbd5e1", margin: 0 }}>{data.objective.summaryText}</p></div>)}
        {data.experience.length > 0 && (<div style={{ marginBottom: 18 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: teal, marginBottom: 12 }}>Experience</div>{data.experience.map(e => (<div key={e.id} style={{ background: card, border: `1px solid #334155`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{e.position}</span><span style={{ fontSize: 10, color: muted }}>{dateRange(e.startDate, e.endDate, e.isCurrent, "Now", "–")}</span></div><div style={{ fontSize: 11, color: teal, fontWeight: 500, marginBottom: 4 }}>{e.company}</div><p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{e.responsibilities}</p></div>))}</div>)}
        {data.projects.length > 0 && (<div style={{ marginBottom: 18 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: teal, marginBottom: 12 }}>Projects</div>{data.projects.map(p => (<div key={p.id} style={{ background: card, border: `1px solid #334155`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}><div style={{ fontWeight: 700, fontSize: 12, color: "#f1f5f9" }}>{p.projectTitle}</div><div style={{ marginBottom: 4, marginTop: 2 }}>{p.technologies?.split(",").map(t => <span key={t} style={{ fontSize: 9, background: `${teal}20`, color: teal, border: `1px solid ${teal}40`, padding: "1px 6px", borderRadius: 3, marginRight: 4, fontWeight: 600 }}>{t.trim()}</span>)}</div><p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{p.description}</p></div>))}</div>)}
        {data.education.length > 0 && (<div><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: teal, marginBottom: 10 }}>Education</div>{data.education.map(e => (<div key={e.id} style={{ background: card, border: `1px solid #334155`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}><div style={{ fontWeight: 700, fontSize: 12, color: "#f1f5f9" }}>{e.degree} in {e.fieldOfStudy}</div><div style={{ fontSize: 11, color: teal }}>{e.institution}</div><div style={{ fontSize: 10, color: muted }}>{e.graduationYear} · CGPA {e.cgpa}</div></div>))}</div>)}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T8 · Infographic Resume
// Visual timeline, skill bars, icon markers — eye-catching visual layout
// ────────────────────────────────────────────────────────────────────────────
function T8Infographic({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', sans-serif` : "'Inter', sans-serif";
  const indigo = "#6366F1"; const violet = "#8B5CF6";
  return (
    <div className="resume-preview" style={{ fontFamily: ff, background: "#fff", color: "#1f2937" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(120deg, ${indigo} 0%, ${violet} 100%)`, padding: "28px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: -0.5 }}>{pi?.fullName || resumeName || "Your Name"}</h1>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
            {contact(pi).map((c, i) => <span key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.15)", padding: "2px 8px", borderRadius: 12 }}>{c}</span>)}
          </div>
        </div>
        {data.skills.length > 0 && (<div style={{ textAlign: "right" }}>{data.skills.slice(0, 4).map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, justifyContent: "flex-end" }}><div style={{ width: 60, height: 6, background: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}><div style={{ width: PW[s.proficiencyLevel] || "50%", height: "100%", background: "#fff", borderRadius: 3 }} /></div><span style={{ fontSize: 10, color: "#fff", fontWeight: 500, width: 70, textAlign: "right" }}>{s.skillName}</span></div>))}</div>)}
      </div>
      {/* Body */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* Main */}
        <div style={{ flex: 1, padding: "24px 28px" }}>
          {data.objective && (<div style={{ marginBottom: 20, padding: "14px 16px", background: "#f5f3ff", borderRadius: 8, borderLeft: `4px solid ${indigo}` }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: indigo, marginBottom: 6 }}>Profile</div><p style={{ fontSize: 12, lineHeight: 1.7, color: "#374151", margin: 0 }}>{data.objective.summaryText}</p></div>)}
          {data.experience.length > 0 && (<div style={{ marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: indigo, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: indigo }} />Timeline · Experience</div>{data.experience.map((e, i) => (<div key={e.id} style={{ display: "flex", gap: 0, marginBottom: 0 }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24, marginRight: 12 }}><div style={{ width: 14, height: 14, borderRadius: "50%", background: i === 0 ? indigo : "#e5e7eb", border: `2px solid ${indigo}`, flexShrink: 0 }} />{i < data.experience.length - 1 && <div style={{ width: 2, flex: 1, background: `${indigo}30`, margin: "2px 0" }} />}</div><div style={{ flex: 1, paddingBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700, fontSize: 13 }}>{e.position}</span><span style={{ fontSize: 10, color: "#9ca3af" }}>{dateRange(e.startDate, e.endDate, e.isCurrent, "Now", "–")}</span></div><div style={{ fontSize: 11, color: indigo, fontWeight: 500, marginBottom: 3 }}>{e.company}</div><p style={{ fontSize: 11, color: "#4b5563", margin: 0, lineHeight: 1.6 }}>{e.responsibilities}</p></div></div>))}</div>)}
          {data.projects.length > 0 && (<div><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: violet, marginBottom: 10 }}>Projects</div>{data.projects.map(p => (<div key={p.id} style={{ marginBottom: 10, padding: "10px 12px", border: `1px solid #e0e7ff`, borderRadius: 8 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{p.projectTitle}</div><div style={{ fontSize: 10, color: violet, margin: "2px 0 4px" }}>{p.technologies}</div><p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{p.description}</p></div>))}</div>)}
        </div>
        {/* Right sidebar */}
        <div style={{ width: 200, background: "#f8fafc", borderLeft: "1px solid #e5e7eb", padding: "24px 18px" }}>
          {data.skills.length > 0 && (<><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: indigo, marginBottom: 10 }}>Skills</div>{data.skills.map(s => (<div key={s.id} style={{ marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 11, fontWeight: 500, color: "#374151" }}>{s.skillName}</span><span style={{ fontSize: 9, color: "#9ca3af" }}>{PW[s.proficiencyLevel]?.replace("%", "") || "50"}%</span></div><div style={{ height: 5, background: "#e0e7ff", borderRadius: 3, overflow: "hidden" }}><div style={{ width: PW[s.proficiencyLevel] || "50%", height: "100%", background: `linear-gradient(90deg, ${indigo}, ${violet})`, borderRadius: 3 }} /></div></div>))}<div style={{ borderTop: "1px solid #e5e7eb", margin: "14px 0" }} /></>)}
          {data.education.length > 0 && (<><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: violet, marginBottom: 10 }}>Education</div>{data.education.map(e => (<div key={e.id} style={{ marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 11 }}>{e.degree}</div><div style={{ fontSize: 10, color: "#6b7280" }}>{e.fieldOfStudy}</div><div style={{ fontSize: 10, color: indigo }}>{e.institution}</div><div style={{ fontSize: 9, color: "#9ca3af" }}>{e.graduationYear} · {e.cgpa}</div></div>))}<div style={{ borderTop: "1px solid #e5e7eb", margin: "14px 0" }} /></>)}
          {data.certifications.length > 0 && (<><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: indigo, marginBottom: 8 }}>Certs</div>{data.certifications.map(c => (<div key={c.id} style={{ fontSize: 10, color: "#374151", marginBottom: 4 }}><div style={{ fontWeight: 600 }}>{c.certName}</div>{c.issuingOrg && <div style={{ color: "#9ca3af" }}>{c.issuingOrg}</div>}</div>))}<div style={{ borderTop: "1px solid #e5e7eb", margin: "14px 0" }} /></>)}
          {data.languages.length > 0 && (<><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: violet, marginBottom: 8 }}>Languages</div>{data.languages.map(l => (<div key={l.id} style={{ fontSize: 10, marginBottom: 5 }}><div style={{ fontWeight: 600, color: "#374151" }}>{l.languageName}</div><div style={{ height: 4, background: "#e0e7ff", borderRadius: 2, overflow: "hidden", marginTop: 2 }}><div style={{ width: PW[l.proficiency] || "50%", height: "100%", background: violet, borderRadius: 2 }} /></div></div>))}</>)}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T9 · Elegant Professional Resume
// Cream background, serif typography, ornamental dividers — classic premium
// ────────────────────────────────────────────────────────────────────────────
function T9Elegant({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', serif` : "'Georgia', 'Times New Roman', serif";
  const brown = "#3b1f0a"; const cream = "#faf7f0"; const warmGold = "#8B6914";
  const Ornament = () => <div style={{ textAlign: "center", margin: "16px 0 12px", color: warmGold, fontSize: 14, letterSpacing: 8 }}>— ✦ —</div>;
  return (
    <div className="resume-preview" style={{ fontFamily: ff, background: cream, color: brown }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "44px 52px 24px", borderBottom: `1px solid ${warmGold}55` }}>
        <div style={{ fontSize: 10, letterSpacing: 6, textTransform: "uppercase" as const, color: warmGold, marginBottom: 10 }}>Curriculum Vitae</div>
        <h1 style={{ fontSize: 36, fontWeight: 400, margin: "0 0 12px", letterSpacing: 4, color: brown }}>{pi?.fullName || resumeName || "Your Name"}</h1>
        <div style={{ width: 80, height: 1, background: warmGold, margin: "0 auto 12px" }} />
        <p style={{ fontSize: 11, color: "#7c5c3e", letterSpacing: 1, margin: 0, lineHeight: 2 }}>{contact(pi).join(" ✦ ")}</p>
      </div>
      <div style={{ padding: "0 52px 40px" }}>
        {data.objective && (<><Ornament /><div style={{ textAlign: "center", marginBottom: 8 }}><div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: warmGold, marginBottom: 10 }}>Career Objective</div></div><p style={{ fontSize: 13, lineHeight: 2, color: "#5c3d1e", textAlign: "justify", margin: "0 24px" }}>{data.objective.summaryText}</p></>)}
        {data.education.length > 0 && (<><Ornament /><div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: warmGold, textAlign: "center", marginBottom: 14 }}>Education</div>{data.education.map(e => (<div key={e.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, padding: "10px 0", borderBottom: `1px dotted ${warmGold}44` }}><div><div style={{ fontWeight: 700, fontSize: 13 }}>{e.degree} in {e.fieldOfStudy}</div><div style={{ fontSize: 11, color: "#7c5c3e", fontStyle: "italic" }}>{e.institution}</div></div><div style={{ textAlign: "right", fontSize: 11, color: warmGold }}><div>{e.graduationYear}</div><div>CGPA: {e.cgpa}</div></div></div>))}</>)}
        {data.experience.length > 0 && (<><Ornament /><div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: warmGold, textAlign: "center", marginBottom: 14 }}>Professional Experience</div>{data.experience.map(e => (<div key={e.id} style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontWeight: 700, fontSize: 14 }}>{e.position}</div><div style={{ fontSize: 11, color: warmGold, fontStyle: "italic" }}>{dateRange(e.startDate, e.endDate, e.isCurrent)}</div></div><div style={{ fontSize: 12, color: "#7c5c3e", fontStyle: "italic", marginBottom: 4 }}>{e.company}</div><p style={{ fontSize: 12, color: "#5c3d1e", lineHeight: 1.8, margin: 0, textAlign: "justify" }}>{e.responsibilities}</p></div>))}</>)}
        {data.skills.length > 0 && (<><Ornament /><div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: warmGold, textAlign: "center", marginBottom: 12 }}>Areas of Expertise</div><p style={{ fontSize: 12, color: "#5c3d1e", textAlign: "center", lineHeight: 2 }}>{data.skills.map(s => s.skillName).join(" · ")}</p></>)}
        {data.projects.length > 0 && (<><Ornament /><div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase" as const, color: warmGold, textAlign: "center", marginBottom: 14 }}>Notable Projects</div>{data.projects.map(p => (<div key={p.id} style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{p.projectTitle} <span style={{ fontWeight: 400, fontSize: 11, fontStyle: "italic", color: warmGold }}>({p.technologies})</span></div><p style={{ fontSize: 12, color: "#5c3d1e", lineHeight: 1.8, margin: "3px 0 0", textAlign: "justify" }}>{p.description}</p></div>))}</>)}
        {(data.certifications.length > 0 || data.languages.length > 0) && (<><Ornament /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>{data.certifications.length > 0 && (<div><div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase" as const, color: warmGold, marginBottom: 8 }}>Certifications</div>{data.certifications.map(c => (<div key={c.id} style={{ fontSize: 12, color: "#5c3d1e", marginBottom: 4 }}><strong>{c.certName}</strong>{c.issuingOrg && <span style={{ color: "#7c5c3e" }}> — {c.issuingOrg}</span>}</div>))}</div>)}{data.languages.length > 0 && (<div><div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase" as const, color: warmGold, marginBottom: 8 }}>Languages</div>{data.languages.map(l => (<div key={l.id} style={{ fontSize: 12, color: "#5c3d1e", marginBottom: 4 }}>{l.languageName} <span style={{ color: "#7c5c3e", fontStyle: "italic" }}>({l.proficiency})</span></div>))}</div>)}</div></>)}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// T10 · Startup Founder Resume
// Bold orange accent, dynamic asymmetric layout — entrepreneurs, founders
// ────────────────────────────────────────────────────────────────────────────
function T10StartupFounder({ data, resumeName, fontFamily }: TP) {
  const pi = data.personalInfo;
  const ff = fontFamily ? `'${fontFamily}', sans-serif` : "'Inter', sans-serif";
  const orange = "#F97316"; const dark = "#0c0a09";
  return (
    <div className="resume-preview" style={{ fontFamily: ff, background: "#fff", color: dark }}>
      {/* Header */}
      <div style={{ padding: "32px 40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase" as const, color: orange, marginBottom: 6 }}>Resume</div>
            <h1 style={{ fontSize: 38, fontWeight: 900, color: dark, margin: "0 0 6px", letterSpacing: -1.5, lineHeight: 1 }}>{pi?.fullName || resumeName || "Your Name"}</h1>
          </div>
          <div style={{ textAlign: "right", paddingTop: 8 }}>
            {contact(pi).map((c, i) => <div key={i} style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>{c}</div>)}
          </div>
        </div>
        <div style={{ height: 4, background: orange, borderRadius: 2, margin: "16px 0" }} />
      </div>
      {/* Body */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* Main */}
        <div style={{ flex: 1, padding: "20px 40px 36px 40px" }}>
          {data.objective && (<div style={{ background: "#fff7ed", border: `2px solid ${orange}`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: orange, marginBottom: 6 }}>Mission Statement</div><p style={{ fontSize: 12, lineHeight: 1.8, color: "#1c1917", margin: 0, fontWeight: 500 }}>{data.objective.summaryText}</p></div>)}
          {data.projects.length > 0 && (<div style={{ marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: orange, marginBottom: 12 }}>Ventures & Projects</div>{data.projects.map((p, i) => (<div key={p.id} style={{ marginBottom: 12, padding: "14px 16px", border: "1px solid #e7e5e4", borderRadius: 8, borderLeft: `4px solid ${i === 0 ? orange : "#e7e5e4"}`, position: "relative" }}><div style={{ fontWeight: 800, fontSize: 14, color: dark }}>{p.projectTitle}</div><div style={{ fontSize: 10, color: orange, fontWeight: 600, marginBottom: 4 }}>{p.technologies}</div><p style={{ fontSize: 11, color: "#57534e", margin: 0, lineHeight: 1.6 }}>{p.description}</p>{p.projectLink && <div style={{ fontSize: 10, color: orange, marginTop: 4 }}>↗ {p.projectLink}</div>}</div>))}</div>)}
          {data.experience.length > 0 && (<div style={{ marginBottom: 20 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: orange, marginBottom: 12 }}>Experience</div>{data.experience.map(e => (<div key={e.id} style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 800, fontSize: 14, color: dark }}>{e.position}</span><span style={{ fontSize: 10, color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: 12 }}>{dateRange(e.startDate, e.endDate, e.isCurrent, "Now", "–")}</span></div><div style={{ fontSize: 11, color: orange, fontWeight: 600, marginBottom: 3 }}>{e.company}</div><p style={{ fontSize: 11, color: "#57534e", margin: 0, lineHeight: 1.6 }}>{e.responsibilities}</p></div>))}</div>)}
        </div>
        {/* Right sidebar */}
        <div style={{ width: 210, background: "#fafaf9", borderLeft: "1px solid #e7e5e4", padding: "20px 18px" }}>
          {data.skills.length > 0 && (<><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: orange, marginBottom: 10 }}>Tech Stack</div><div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, marginBottom: 18 }}>{data.skills.map(s => (<span key={s.id} style={{ fontSize: 10, background: dark, color: "#fff", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>{s.skillName}</span>))}</div></>)}
          {data.education.length > 0 && (<><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: orange, marginBottom: 10 }}>Education</div>{data.education.map(e => (<div key={e.id} style={{ marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 12 }}>{e.degree}</div><div style={{ fontSize: 11, color: "#57534e" }}>{e.fieldOfStudy}</div><div style={{ fontSize: 10, color: orange, fontWeight: 600 }}>{e.institution}</div><div style={{ fontSize: 10, color: "#9ca3af" }}>{e.graduationYear} · {e.cgpa} CGPA</div></div>))}</>)}
          {data.certifications.length > 0 && (<><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: orange, marginBottom: 8, marginTop: 14 }}>Certifications</div>{data.certifications.map(c => (<div key={c.id} style={{ fontSize: 10, color: "#374151", marginBottom: 5 }}><div style={{ fontWeight: 700 }}>{c.certName}</div>{c.issuingOrg && <div style={{ color: "#9ca3af" }}>{c.issuingOrg}</div>}</div>))}</>)}
          {data.languages.length > 0 && (<><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, color: orange, marginBottom: 8, marginTop: 14 }}>Languages</div>{data.languages.map(l => (<div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{l.languageName}</span><span style={{ color: "#9ca3af" }}>{l.proficiency}</span></div>))}</>)}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────────────────────
export default function ResumePreview({ data, templateId, resumeName, fontFamily }: ResumePreviewProps) {
  const p = { data, resumeName, fontFamily };
  switch (templateId) {
    case 1:  return <T1MinimalATS {...p} />;
    case 2:  return <T2Corporate {...p} />;
    case 3:  return <T3CreativeDesigner {...p} />;
    case 4:  return <T4Executive {...p} />;
    case 5:  return <T5Developer {...p} />;
    case 6:  return <T6ModernGradient {...p} />;
    case 7:  return <T7DarkTheme {...p} />;
    case 8:  return <T8Infographic {...p} />;
    case 9:  return <T9Elegant {...p} />;
    case 10: return <T10StartupFounder {...p} />;
    default: return <T1MinimalATS {...p} />;
  }
}
