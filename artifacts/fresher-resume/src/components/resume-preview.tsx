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

const PROFICIENCY_WIDTHS: Record<string, string> = {
  Beginner: "25%", Intermediate: "55%", Advanced: "80%", Expert: "100%",
  Native: "100%", Fluent: "80%", Basic: "30%",
};

function ProficiencyBar({ level }: { level: string }) {
  return (
    <div className="proficiency-bar mt-1">
      <div className="proficiency-fill" style={{ width: PROFICIENCY_WIDTHS[level] || "50%" }} />
    </div>
  );
}

// ── Template 1: Modern ─────────────────────────────────────────────────────────
function ModernTemplate({ data, resumeName }: { data: ResumeData; resumeName?: string }) {
  const pi = data.personalInfo;
  return (
    <div className="resume-preview template-modern" style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="resume-header">
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>{pi?.fullName || resumeName || "Your Name"}</h1>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: "12px", fontSize: 12, opacity: 0.9 }}>
          {pi?.email && <span>{pi.email}</span>}
          {pi?.phone && <span>{pi.phone}</span>}
          {pi?.address && <span>{pi.address}</span>}
          {pi?.linkedin && <span>{pi.linkedin}</span>}
          {pi?.portfolio && <span>{pi.portfolio}</span>}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div className="resume-sidebar" style={{ width: 230 }}>
          {data.skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-title">Skills</div>
              {data.skills.map(s => (
                <div key={s.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ fontWeight: 500 }}>{s.skillName}</span>
                    <span style={{ fontSize: 10, color: "#6b7280" }}>{s.proficiencyLevel}</span>
                  </div>
                  <ProficiencyBar level={s.proficiencyLevel} />
                </div>
              ))}
            </div>
          )}
          {data.languages.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-title">Languages</div>
              {data.languages.map(l => (
                <div key={l.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{l.languageName}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{l.proficiency}</div>
                </div>
              ))}
            </div>
          )}
          {data.certifications.length > 0 && (
            <div>
              <div className="section-title">Certifications</div>
              {data.certifications.map(c => (
                <div key={c.id} style={{ marginBottom: 8, fontSize: 12 }}>
                  <div style={{ fontWeight: 500 }}>{c.certName}</div>
                  {c.issuingOrg && <div style={{ color: "#6b7280", fontSize: 11 }}>{c.issuingOrg}</div>}
                  {c.dateIssued && <div style={{ color: "#9ca3af", fontSize: 11 }}>{c.dateIssued}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main */}
        <div className="resume-main">
          {data.objective && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-title">Career Objective</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#374151", margin: 0 }}>{data.objective.summaryText}</p>
            </div>
          )}
          {data.education.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-title">Education</div>
              {data.education.map(e => (
                <div key={e.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.degree} in {e.fieldOfStudy}</div>
                  <div style={{ fontSize: 12, color: "#374151" }}>{e.institution}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{e.graduationYear} · CGPA: {e.cgpa}</div>
                </div>
              ))}
            </div>
          )}
          {data.projects.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-title">Projects</div>
              {data.projects.map(p => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.projectTitle}</div>
                  <div style={{ fontSize: 11, color: "#1e40af" }}>{p.technologies}</div>
                  <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{p.description}</div>
                  {p.role && <div style={{ fontSize: 11, color: "#6b7280" }}>Role: {p.role}</div>}
                </div>
              ))}
            </div>
          )}
          {data.experience.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-title">Work Experience</div>
              {data.experience.map(e => (
                <div key={e.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.position}</div>
                  <div style={{ fontSize: 12, color: "#1e40af" }}>{e.company}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{e.startDate} – {e.isCurrent ? "Present" : e.endDate}</div>
                  <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>{e.responsibilities}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Template 2: Minimalist ─────────────────────────────────────────────────────
function MinimalistTemplate({ data, resumeName }: { data: ResumeData; resumeName?: string }) {
  const pi = data.personalInfo;
  return (
    <div className="resume-preview template-minimalist">
      <div className="resume-header">
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -1 }}>{pi?.fullName || resumeName}</h1>
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: "10px", fontSize: 12, color: "#555" }}>
          {pi?.email && <span>{pi.email}</span>}
          {pi?.phone && <span>| {pi.phone}</span>}
          {pi?.address && <span>| {pi.address}</span>}
          {pi?.linkedin && <span>| {pi.linkedin}</span>}
        </div>
      </div>
      <div className="resume-body">
        {data.objective && <Section title="Summary"><p style={{ fontSize: 13, color: "#333", margin: 0 }}>{data.objective.summaryText}</p></Section>}
        {data.education.length > 0 && (
          <Section title="Education">
            {data.education.map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.degree} in {e.fieldOfStudy}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{e.institution}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#555" }}>
                  <div>{e.graduationYear}</div><div>CGPA: {e.cgpa}</div>
                </div>
              </div>
            ))}
          </Section>
        )}
        {data.skills.length > 0 && (
          <Section title="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.skills.map(s => (
                <span key={s.id} style={{ fontSize: 12, border: "1px solid #bbb", padding: "2px 10px", borderRadius: 3 }}>
                  {s.skillName}
                </span>
              ))}
            </div>
          </Section>
        )}
        {data.experience.length > 0 && (
          <Section title="Experience">
            {data.experience.map(e => (
              <div key={e.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{e.position} — {e.company}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{e.startDate} – {e.isCurrent ? "Present" : e.endDate}</div>
                </div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>{e.responsibilities}</div>
              </div>
            ))}
          </Section>
        )}
        {data.projects.length > 0 && (
          <Section title="Projects">
            {data.projects.map(p => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.projectTitle} <span style={{ fontWeight: 400, color: "#666", fontSize: 12 }}>({p.technologies})</span></div>
                <div style={{ fontSize: 12, color: "#444" }}>{p.description}</div>
              </div>
            ))}
          </Section>
        )}
        {data.certifications.length > 0 && (
          <Section title="Certifications">
            {data.certifications.map(c => (
              <div key={c.id} style={{ fontSize: 12, marginBottom: 6 }}>
                <strong>{c.certName}</strong>{c.issuingOrg ? ` — ${c.issuingOrg}` : ""}{c.dateIssued ? ` (${c.dateIssued})` : ""}
              </div>
            ))}
          </Section>
        )}
        {data.languages.length > 0 && (
          <Section title="Languages">
            <div style={{ display: "flex", gap: 16 }}>
              {data.languages.map(l => (
                <div key={l.id} style={{ fontSize: 12 }}><strong>{l.languageName}</strong> — {l.proficiency}</div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="section-title">{title}</div>
      {children}
    </div>
  );
}

// ── Template 3: Creative ───────────────────────────────────────────────────────
function CreativeTemplate({ data, resumeName }: { data: ResumeData; resumeName?: string }) {
  const pi = data.personalInfo;
  return (
    <div className="resume-preview template-creative">
      <div className="resume-header">
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>{pi?.fullName || resumeName}</h1>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, opacity: 0.95 }}>
          {pi?.email && <span>{pi.email}</span>}
          {pi?.phone && <span>{pi.phone}</span>}
          {pi?.address && <span>{pi.address}</span>}
          {pi?.linkedin && <span>{pi.linkedin}</span>}
          {pi?.portfolio && <span>{pi.portfolio}</span>}
        </div>
      </div>
      <div className="resume-body">
        {data.objective && (
          <div style={{ marginBottom: 20 }}>
            <div className="section-title">About Me</div>
            <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{data.objective.summaryText}</p>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            {data.education.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div className="section-title">Education</div>
                {data.education.map(e => (
                  <div key={e.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.degree}</div>
                    <div style={{ fontSize: 12, color: "#0d9488" }}>{e.fieldOfStudy}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{e.institution}</div>
                    <div style={{ fontSize: 11, color: "#777" }}>{e.graduationYear} · {e.cgpa}</div>
                  </div>
                ))}
              </div>
            )}
            {data.skills.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div className="section-title">Skills</div>
                {data.skills.map(s => (
                  <div key={s.id} style={{ marginBottom: 7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span>{s.skillName}</span><span style={{ color: "#0d9488", fontSize: 11 }}>{s.proficiencyLevel}</span>
                    </div>
                    <ProficiencyBar level={s.proficiencyLevel} />
                  </div>
                ))}
              </div>
            )}
            {data.certifications.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div className="section-title">Certifications</div>
                {data.certifications.map(c => (
                  <div key={c.id} style={{ fontSize: 12, marginBottom: 6 }}>
                    <strong>{c.certName}</strong>{c.issuingOrg ? <div style={{ color: "#555" }}>{c.issuingOrg}</div> : null}
                  </div>
                ))}
              </div>
            )}
            {data.languages.length > 0 && (
              <div>
                <div className="section-title">Languages</div>
                {data.languages.map(l => (
                  <div key={l.id} style={{ fontSize: 12, marginBottom: 4 }}><strong>{l.languageName}</strong> — {l.proficiency}</div>
                ))}
              </div>
            )}
          </div>
          <div>
            {data.projects.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div className="section-title">Projects</div>
                {data.projects.map(p => (
                  <div key={p.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.projectTitle}</div>
                    <div style={{ fontSize: 11, color: "#0d9488" }}>{p.technologies}</div>
                    <div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{p.description}</div>
                  </div>
                ))}
              </div>
            )}
            {data.experience.length > 0 && (
              <div>
                <div className="section-title">Experience</div>
                {data.experience.map(e => (
                  <div key={e.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.position}</div>
                    <div style={{ fontSize: 12, color: "#0d9488" }}>{e.company}</div>
                    <div style={{ fontSize: 11, color: "#777" }}>{e.startDate} – {e.isCurrent ? "Present" : e.endDate}</div>
                    <div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{e.responsibilities}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template 4: Corporate ──────────────────────────────────────────────────────
function CorporateTemplate({ data, resumeName }: { data: ResumeData; resumeName?: string }) {
  const pi = data.personalInfo;
  return (
    <div className="resume-preview template-corporate">
      <div className="resume-header">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: 1, textTransform: "uppercase" }}>{pi?.fullName || resumeName}</h1>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#d1d5db" }}>
            {pi?.email && <span>{pi.email}</span>}
            {pi?.phone && <span>| {pi.phone}</span>}
            {pi?.address && <span>| {pi.address}</span>}
            {pi?.linkedin && <span>| {pi.linkedin}</span>}
          </div>
        </div>
      </div>
      <div className="resume-body">
        {data.objective && (
          <div style={{ marginBottom: 18, padding: "10px 14px", background: "#fefce8", borderLeft: "4px solid #b45309" }}>
            <div className="section-title">Professional Summary</div>
            <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{data.objective.summaryText}</p>
          </div>
        )}
        {data.education.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Education</div>
            {data.education.map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.degree} in {e.fieldOfStudy}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{e.institution}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{e.graduationYear}</div>
                  <div style={{ fontSize: 12, color: "#777" }}>CGPA: {e.cgpa}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {data.skills.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Core Competencies</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {data.skills.map(s => (
                <div key={s.id} style={{ fontSize: 12, padding: "4px 8px", background: "#fefce8", border: "1px solid #fbbf24", textAlign: "center", borderRadius: 3 }}>
                  {s.skillName}
                </div>
              ))}
            </div>
          </div>
        )}
        {data.experience.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Professional Experience</div>
            {data.experience.map(e => (
              <div key={e.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{e.position}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{e.startDate} – {e.isCurrent ? "Present" : e.endDate}</div>
                </div>
                <div style={{ fontSize: 13, color: "#b45309", fontWeight: 600 }}>{e.company}</div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>{e.responsibilities}</div>
              </div>
            ))}
          </div>
        )}
        {data.projects.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Notable Projects</div>
            {data.projects.map(p => (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.projectTitle} <span style={{ fontWeight: 400, color: "#777", fontSize: 12 }}>· {p.technologies}</span></div>
                <div style={{ fontSize: 12, color: "#444" }}>{p.description}</div>
              </div>
            ))}
          </div>
        )}
        {(data.certifications.length > 0 || data.languages.length > 0) && (
          <div style={{ display: "flex", gap: 24 }}>
            {data.certifications.length > 0 && (
              <div style={{ flex: 1 }}>
                <div className="section-title">Certifications</div>
                {data.certifications.map(c => (
                  <div key={c.id} style={{ fontSize: 12, marginBottom: 4 }}>{c.certName}{c.issuingOrg ? ` (${c.issuingOrg})` : ""}</div>
                ))}
              </div>
            )}
            {data.languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <div className="section-title">Languages</div>
                {data.languages.map(l => (
                  <div key={l.id} style={{ fontSize: 12, marginBottom: 4 }}>{l.languageName} — {l.proficiency}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Template 5: Technical ──────────────────────────────────────────────────────
function TechnicalTemplate({ data, resumeName }: { data: ResumeData; resumeName?: string }) {
  const pi = data.personalInfo;
  return (
    <div className="resume-preview template-technical">
      <div className="resume-header">
        <div style={{ fontSize: 13, color: "#86efac", marginBottom: 2, fontFamily: "Courier New, monospace" }}>{"// fresher resume"}</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: 1 }}>{pi?.fullName || resumeName}</h1>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "#94a3b8" }}>
          {pi?.email && <span>&lt;{pi.email}&gt;</span>}
          {pi?.phone && <span>{pi.phone}</span>}
          {pi?.linkedin && <span>{pi.linkedin}</span>}
          {pi?.portfolio && <span>{pi.portfolio}</span>}
        </div>
      </div>
      <div className="resume-body">
        {data.objective && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">About</div>
            <p style={{ fontSize: 13, color: "#374151", margin: 0, fontFamily: "Courier New, monospace" }}>{data.objective.summaryText}</p>
          </div>
        )}
        {data.skills.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Tech Stack</div>
            <div style={{ fontFamily: "Courier New, monospace", fontSize: 12, background: "#f8fafc", padding: 12, borderRadius: 4, border: "1px solid #e5e7eb" }}>
              {data.skills.map((s, i) => (
                <span key={s.id} style={{ color: i % 2 === 0 ? "#1e40af" : "#0d9488" }}>{s.skillName}{i < data.skills.length - 1 ? ", " : ""}</span>
              ))}
            </div>
          </div>
        )}
        {data.education.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Education</div>
            {data.education.map(e => (
              <div key={e.id} style={{ marginBottom: 10, padding: "8px 12px", background: "#f8fafc", borderLeft: "3px solid #374151" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.degree} — {e.fieldOfStudy}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{e.institution} | {e.graduationYear} | CGPA: {e.cgpa}</div>
              </div>
            ))}
          </div>
        )}
        {data.projects.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Projects</div>
            {data.projects.map(p => (
              <div key={p.id} style={{ marginBottom: 12, padding: "8px 12px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "Courier New, monospace" }}>{p.projectTitle}</div>
                <div style={{ fontSize: 12, color: "#1e40af", fontFamily: "Courier New, monospace" }}>[{p.technologies}]</div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>{p.description}</div>
                {p.projectLink && <div style={{ fontSize: 12, color: "#0d9488", marginTop: 2 }}>{p.projectLink}</div>}
              </div>
            ))}
          </div>
        )}
        {data.experience.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div className="section-title">Experience</div>
            {data.experience.map(e => (
              <div key={e.id} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.position} @ {e.company}</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "Courier New, monospace" }}>{e.startDate} → {e.isCurrent ? "now" : e.endDate}</div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>{e.responsibilities}</div>
              </div>
            ))}
          </div>
        )}
        {(data.certifications.length > 0 || data.languages.length > 0) && (
          <div style={{ display: "flex", gap: 24 }}>
            {data.certifications.length > 0 && (
              <div style={{ flex: 1 }}>
                <div className="section-title">Certifications</div>
                {data.certifications.map(c => (
                  <div key={c.id} style={{ fontSize: 12, marginBottom: 4, fontFamily: "Courier New, monospace" }}>• {c.certName}</div>
                ))}
              </div>
            )}
            {data.languages.length > 0 && (
              <div style={{ flex: 1 }}>
                <div className="section-title">Languages</div>
                {data.languages.map(l => (
                  <div key={l.id} style={{ fontSize: 12, marginBottom: 4 }}>{l.languageName} ({l.proficiency})</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResumePreview({ data, templateId, resumeName, fontFamily }: ResumePreviewProps) {
  const font = fontFamily || "Inter";
  const style = { fontFamily: `'${font}', sans-serif` };
  switch (templateId) {
    case 1: return <div style={style}><ModernTemplate data={data} resumeName={resumeName} /></div>;
    case 2: return <div style={style}><MinimalistTemplate data={data} resumeName={resumeName} /></div>;
    case 3: return <div style={style}><CreativeTemplate data={data} resumeName={resumeName} /></div>;
    case 4: return <div style={style}><CorporateTemplate data={data} resumeName={resumeName} /></div>;
    case 5: return <div style={style}><TechnicalTemplate data={data} resumeName={resumeName} /></div>;
    default: return <div style={style}><ModernTemplate data={data} resumeName={resumeName} /></div>;
  }
}
