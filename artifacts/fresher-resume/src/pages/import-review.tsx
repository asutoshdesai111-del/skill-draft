import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  useCreateResume, useUpsertPersonalInfo, useUpsertObjective, useCreateEducation,
  useCreateSkill, useCreateProject, useCreateExperience, useCreateCertification, useCreateLanguage,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { readImportFromSession, clearImportSession } from "@/components/resume-upload-dialog";
import { ArrowLeft, Plus, Trash2, Loader2, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

interface ImportedPersonalInfo { fullName: string; email: string; phone: string; linkedin: string; portfolio: string; address: string }
interface ImportedEducation { institution: string; degree: string; fieldOfStudy: string; graduationYear: number | null; cgpa: string }
interface ImportedSkill { skillName: string; proficiencyLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert" }
interface ImportedProject { projectTitle: string; description: string; technologies: string; projectLink: string }
interface ImportedExperience { company: string; position: string; startDate: string; endDate: string; isCurrent: boolean; responsibilities: string }
interface ImportedCertification { certName: string; issuingOrg: string; dateIssued: string }
interface ImportedLanguage { languageName: string; proficiency: "Native" | "Fluent" | "Intermediate" | "Basic" }

interface ImportedResume {
  personalInfo: ImportedPersonalInfo;
  objective: string;
  education: ImportedEducation[];
  skills: ImportedSkill[];
  projects: ImportedProject[];
  experience: ImportedExperience[];
  certifications: ImportedCertification[];
  languages: ImportedLanguage[];
  warnings: string[];
}

function isImportedResume(data: unknown): data is ImportedResume {
  return !!data && typeof data === "object" && "personalInfo" in data && "education" in data;
}

let nextKey = 1;
function withKey<T>(items: T[]): (T & { _key: number })[] {
  return items.map(item => ({ ...item, _key: nextKey++ }));
}

export default function ImportReview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [resumeName, setResumeName] = useState("");
  const [personalInfo, setPersonalInfo] = useState<ImportedPersonalInfo>({ fullName: "", email: "", phone: "", linkedin: "", portfolio: "", address: "" });
  const [objective, setObjective] = useState("");
  const [education, setEducation] = useState<(ImportedEducation & { _key: number })[]>([]);
  const [skills, setSkills] = useState<(ImportedSkill & { _key: number })[]>([]);
  const [projects, setProjects] = useState<(ImportedProject & { _key: number })[]>([]);
  const [experience, setExperience] = useState<(ImportedExperience & { _key: number })[]>([]);
  const [certifications, setCertifications] = useState<(ImportedCertification & { _key: number })[]>([]);
  const [languages, setLanguages] = useState<(ImportedLanguage & { _key: number })[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createResume = useCreateResume();
  const upsertPersonalInfo = useUpsertPersonalInfo();
  const upsertObjective = useUpsertObjective();
  const createEducation = useCreateEducation();
  const createSkill = useCreateSkill();
  const createProject = useCreateProject();
  const createExperience = useCreateExperience();
  const createCertification = useCreateCertification();
  const createLanguage = useCreateLanguage();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const data = readImportFromSession();
    if (!isImportedResume(data)) {
      toast({ title: "No import data found", description: "Please upload a resume file first.", variant: "destructive" });
      setLocation("/dashboard");
      return;
    }
    setPersonalInfo(data.personalInfo);
    setResumeName(data.personalInfo.fullName ? `${data.personalInfo.fullName}'s Resume` : "Imported Resume");
    setObjective(data.objective);
    setEducation(withKey(data.education));
    setSkills(withKey(data.skills));
    setProjects(withKey(data.projects));
    setExperience(withKey(data.experience));
    setCertifications(withKey(data.certifications));
    setLanguages(withKey(data.languages));
    setWarnings(data.warnings);
    setLoaded(true);
    clearImportSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phoneDigits = personalInfo.phone.replace(/\D/g, "").slice(0, 10);
  const canSubmit = resumeName.trim().length > 0
    && personalInfo.fullName.trim().length >= 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)
    && phoneDigits.length === 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const resume = await createResume.mutateAsync({ data: { resumeName: resumeName.trim(), templateId: 1 } });
      const resumeId = resume.id;

      await upsertPersonalInfo.mutateAsync({
        resumeId,
        data: {
          fullName: personalInfo.fullName.trim(),
          email: personalInfo.email.trim(),
          phone: phoneDigits,
          linkedin: personalInfo.linkedin.trim(),
          portfolio: personalInfo.portfolio.trim(),
          address: personalInfo.address.trim(),
        },
      });

      if (objective.trim()) {
        await upsertObjective.mutateAsync({ resumeId, data: { summaryText: objective.trim() } });
      }

      for (const e of education) {
        if (!e.institution.trim() && !e.degree.trim()) continue;
        await createEducation.mutateAsync({
          resumeId,
          data: {
            institution: e.institution.trim() || "Unknown Institution",
            degree: e.degree.trim() || "Degree",
            fieldOfStudy: e.fieldOfStudy.trim() || "Field of Study",
            graduationYear: e.graduationYear ?? new Date().getFullYear(),
            cgpa: e.cgpa.trim() || "N/A",
          },
        });
      }

      for (const s of skills) {
        if (!s.skillName.trim()) continue;
        await createSkill.mutateAsync({ resumeId, data: { skillName: s.skillName.trim(), proficiencyLevel: s.proficiencyLevel } });
      }

      for (const p of projects) {
        if (!p.projectTitle.trim()) continue;
        await createProject.mutateAsync({
          resumeId,
          data: {
            projectTitle: p.projectTitle.trim(),
            description: p.description.trim() || "No description provided.",
            technologies: p.technologies.trim() || "",
            projectLink: p.projectLink.trim() || undefined,
          },
        });
      }

      for (const exp of experience) {
        if (!exp.position.trim() && !exp.company.trim()) continue;
        await createExperience.mutateAsync({
          resumeId,
          data: {
            company: exp.company.trim() || "Company",
            position: exp.position.trim() || "Position",
            startDate: exp.startDate.trim() || "",
            endDate: exp.isCurrent ? undefined : (exp.endDate.trim() || undefined),
            isCurrent: exp.isCurrent,
            responsibilities: exp.responsibilities.trim() || "",
          },
        });
      }

      for (const c of certifications) {
        if (!c.certName.trim()) continue;
        await createCertification.mutateAsync({
          resumeId,
          data: { certName: c.certName.trim(), issuingOrg: c.issuingOrg.trim() || undefined, dateIssued: c.dateIssued.trim() || undefined },
        });
      }

      for (const l of languages) {
        if (!l.languageName.trim()) continue;
        await createLanguage.mutateAsync({ resumeId, data: { languageName: l.languageName.trim(), proficiency: l.proficiency } });
      }

      toast({ title: "Resume created from your upload!" });
      setLocation(`/builder/${resumeId}/preview`);
    } catch (err) {
      setSubmitError("Something went wrong while saving your resume. Some sections may have been saved — you can finish editing in the builder.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Dashboard
          </Button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="font-semibold text-sm">Review Imported Resume</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">We've pre-filled your resume</h1>
            <p className="text-sm text-muted-foreground">Review the extracted details below, fix anything that looks off, then save.</p>
          </div>
        </div>

        {warnings.length > 0 && (
          <Alert data-testid="alert-import-warnings">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-0.5">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-4 space-y-1.5">
            <Label>Resume Name *</Label>
            <Input value={resumeName} onChange={e => setResumeName(e.target.value)} placeholder="e.g. Software Developer Resume" data-testid="input-import-resume-name" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-sm font-semibold">Personal Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input value={personalInfo.fullName} onChange={e => setPersonalInfo(p => ({ ...p, fullName: e.target.value }))} data-testid="input-import-fullname" />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={personalInfo.email} onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))} data-testid="input-import-email" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone * (10 digits)</Label>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={personalInfo.phone}
                  onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  data-testid="input-import-phone"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City, State</Label>
                <Input value={personalInfo.address} onChange={e => setPersonalInfo(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>LinkedIn URL</Label>
                <Input value={personalInfo.linkedin} onChange={e => setPersonalInfo(p => ({ ...p, linkedin: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Portfolio / GitHub URL</Label>
                <Input value={personalInfo.portfolio} onChange={e => setPersonalInfo(p => ({ ...p, portfolio: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1.5">
            <h2 className="text-sm font-semibold">Career Objective</h2>
            <Textarea value={objective} onChange={e => setObjective(e.target.value)} rows={3} maxLength={500} data-testid="textarea-import-objective" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Education</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => setEducation(e => [...e, { _key: nextKey++, institution: "", degree: "", fieldOfStudy: "", graduationYear: null, cgpa: "" }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add
              </Button>
            </div>
            {education.length === 0 && <p className="text-sm text-muted-foreground">No education detected. Click Add to enter manually.</p>}
            {education.map((edu, i) => (
              <div key={edu._key} className="border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 text-destructive" onClick={() => setEducation(e => e.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Institution</Label>
                  <Input className="h-8 text-sm" value={edu.institution} onChange={e => setEducation(arr => arr.map((x, idx) => idx === i ? { ...x, institution: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Degree</Label>
                  <Input className="h-8 text-sm" value={edu.degree} onChange={e => setEducation(arr => arr.map((x, idx) => idx === i ? { ...x, degree: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Field of Study</Label>
                  <Input className="h-8 text-sm" value={edu.fieldOfStudy} onChange={e => setEducation(arr => arr.map((x, idx) => idx === i ? { ...x, fieldOfStudy: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Graduation Year</Label>
                  <Input className="h-8 text-sm" inputMode="numeric" value={edu.graduationYear ?? ""} onChange={e => setEducation(arr => arr.map((x, idx) => idx === i ? { ...x, graduationYear: e.target.value ? parseInt(e.target.value, 10) : null } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CGPA / Percentage</Label>
                  <Input className="h-8 text-sm" value={edu.cgpa} onChange={e => setEducation(arr => arr.map((x, idx) => idx === i ? { ...x, cgpa: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Work Experience</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => setExperience(e => [...e, { _key: nextKey++, company: "", position: "", startDate: "", endDate: "", isCurrent: false, responsibilities: "" }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add
              </Button>
            </div>
            {experience.length === 0 && <p className="text-sm text-muted-foreground">No work experience detected.</p>}
            {experience.map((exp, i) => (
              <div key={exp._key} className="border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 text-destructive" onClick={() => setExperience(e => e.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <div className="space-y-1">
                  <Label className="text-xs">Position</Label>
                  <Input className="h-8 text-sm" value={exp.position} onChange={e => setExperience(arr => arr.map((x, idx) => idx === i ? { ...x, position: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Company</Label>
                  <Input className="h-8 text-sm" value={exp.company} onChange={e => setExperience(arr => arr.map((x, idx) => idx === i ? { ...x, company: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input className="h-8 text-sm" value={exp.startDate} onChange={e => setExperience(arr => arr.map((x, idx) => idx === i ? { ...x, startDate: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input className="h-8 text-sm" disabled={exp.isCurrent} value={exp.endDate} onChange={e => setExperience(arr => arr.map((x, idx) => idx === i ? { ...x, endDate: e.target.value } : x))} />
                  <div className="flex items-center gap-1.5 mt-1">
                    <Checkbox checked={exp.isCurrent} onCheckedChange={v => setExperience(arr => arr.map((x, idx) => idx === i ? { ...x, isCurrent: Boolean(v) } : x))} />
                    <label className="text-xs text-muted-foreground">Currently working here</label>
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Responsibilities</Label>
                  <Textarea className="text-sm resize-none" rows={2} value={exp.responsibilities} onChange={e => setExperience(arr => arr.map((x, idx) => idx === i ? { ...x, responsibilities: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Projects</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => setProjects(p => [...p, { _key: nextKey++, projectTitle: "", description: "", technologies: "", projectLink: "" }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add
              </Button>
            </div>
            {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects detected.</p>}
            {projects.map((proj, i) => (
              <div key={proj._key} className="border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 text-destructive" onClick={() => setProjects(p => p.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <div className="space-y-1">
                  <Label className="text-xs">Project Title</Label>
                  <Input className="h-8 text-sm" value={proj.projectTitle} onChange={e => setProjects(arr => arr.map((x, idx) => idx === i ? { ...x, projectTitle: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Technologies</Label>
                  <Input className="h-8 text-sm" value={proj.technologies} onChange={e => setProjects(arr => arr.map((x, idx) => idx === i ? { ...x, technologies: e.target.value } : x))} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Project Link</Label>
                  <Input className="h-8 text-sm" value={proj.projectLink} onChange={e => setProjects(arr => arr.map((x, idx) => idx === i ? { ...x, projectLink: e.target.value } : x))} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea className="text-sm resize-none" rows={2} value={proj.description} onChange={e => setProjects(arr => arr.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Skills</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => setSkills(s => [...s, { _key: nextKey++, skillName: "", proficiencyLevel: "Intermediate" }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add
              </Button>
            </div>
            {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills detected.</p>}
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <div key={s._key} className="flex items-center gap-1 border rounded-full pl-3 pr-1 py-1">
                  <input
                    className="text-sm bg-transparent outline-none w-28"
                    value={s.skillName}
                    onChange={e => setSkills(arr => arr.map((x, idx) => idx === i ? { ...x, skillName: e.target.value } : x))}
                  />
                  <button type="button" onClick={() => setSkills(arr => arr.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Certifications</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => setCertifications(c => [...c, { _key: nextKey++, certName: "", issuingOrg: "", dateIssued: "" }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add
              </Button>
            </div>
            {certifications.length === 0 && <p className="text-sm text-muted-foreground">No certifications detected.</p>}
            {certifications.map((c, i) => (
              <div key={c._key} className="border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 text-destructive" onClick={() => setCertifications(arr => arr.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Name</Label>
                  <Input className="h-8 text-sm" value={c.certName} onChange={e => setCertifications(arr => arr.map((x, idx) => idx === i ? { ...x, certName: e.target.value } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Input className="h-8 text-sm" value={c.dateIssued} onChange={e => setCertifications(arr => arr.map((x, idx) => idx === i ? { ...x, dateIssued: e.target.value } : x))} />
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">Issuing Organization</Label>
                  <Input className="h-8 text-sm" value={c.issuingOrg} onChange={e => setCertifications(arr => arr.map((x, idx) => idx === i ? { ...x, issuingOrg: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Languages</h2>
              <Button type="button" size="sm" variant="outline" onClick={() => setLanguages(l => [...l, { _key: nextKey++, languageName: "", proficiency: "Intermediate" }])}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add
              </Button>
            </div>
            {languages.length === 0 && <p className="text-sm text-muted-foreground">No languages detected.</p>}
            {languages.map((l, i) => (
              <div key={l._key} className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Language</Label>
                  <Input className="h-9" value={l.languageName} onChange={e => setLanguages(arr => arr.map((x, idx) => idx === i ? { ...x, languageName: e.target.value } : x))} />
                </div>
                <div className="space-y-1 w-36">
                  <Label className="text-xs">Proficiency</Label>
                  <Select value={l.proficiency} onValueChange={v => setLanguages(arr => arr.map((x, idx) => idx === i ? { ...x, proficiency: v as ImportedLanguage["proficiency"] } : x))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Native", "Fluent", "Intermediate", "Basic"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setLanguages(arr => arr.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {submitError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3 pb-10">
          <Button variant="outline" onClick={() => setLocation("/dashboard")} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting} data-testid="button-confirm-import">
            {submitting
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              : <><CheckCircle2 className="w-4 h-4 mr-2" />Create Resume</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
