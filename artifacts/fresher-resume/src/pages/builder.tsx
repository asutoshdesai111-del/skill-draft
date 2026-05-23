import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetResume, useUpsertPersonalInfo, useUpsertObjective,
  useListEducation, useCreateEducation, useUpdateEducation, useDeleteEducation,
  useListSkills, useCreateSkill, useDeleteSkill,
  useListProjects, useCreateProject, useUpdateProject, useDeleteProject,
  useListExperience, useCreateExperience, useUpdateExperience, useDeleteExperience,
  useListCertifications, useCreateCertification, useUpdateCertification, useDeleteCertification,
  useListLanguages, useCreateLanguage, useDeleteLanguage,
  getGetResumeQueryKey, getListEducationQueryKey, getListSkillsQueryKey,
  getListProjectsQueryKey, getListExperienceQueryKey, getListCertificationsQueryKey, getListLanguagesQueryKey,
  getGetPersonalInfoQueryKey, getGetObjectiveQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, ArrowLeft, ArrowRight, Plus, Trash2, Eye, Save, Loader2, X, HelpCircle, Check } from "lucide-react";

const STEPS = [
  "Personal Info", "Career Objective", "Education", "Skills",
  "Projects", "Experience", "Certifications", "Languages"
];

const POPULAR_SKILLS = [
  "JavaScript", "Python", "React", "Node.js", "SQL", "Java", "C++",
  "Git", "HTML/CSS", "Data Analysis", "Excel", "TypeScript", "MongoDB", "Django", "Docker"
];

const OBJECTIVE_SUGGESTIONS = [
  "Seeking a challenging software developer position where I can apply my programming skills in JavaScript and React to build innovative web applications and contribute to a dynamic team.",
  "Motivated Computer Science graduate eager to launch my career in data analysis. Proficient in Python, SQL, and Excel, with a strong foundation in statistical analysis and machine learning fundamentals.",
  "Aspiring full-stack developer with hands-on experience building web applications using the MERN stack. Looking for an opportunity to grow professionally and contribute to impactful products.",
  "Recent B.Tech graduate in Information Technology, passionate about cloud computing and DevOps practices. Seeking an entry-level position to apply skills in AWS, Docker, and CI/CD pipelines.",
  "Enthusiastic fresher with a background in computer science and a passion for UI/UX design. Eager to join a product team where I can combine technical and design skills to create user-friendly applications.",
];

const GRAD_YEARS = Array.from({ length: 7 }, (_, i) => 2020 + i);

// ─── Personal Info ──────────────────────────────────────────────────────────────
const personalSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone required"),
  linkedin: z.string().optional(),
  portfolio: z.string().optional(),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
});
type PersonalForm = z.infer<typeof personalSchema>;

function StepPersonal({ resumeId, initialData, onSaved }: { resumeId: number; initialData?: PersonalForm | null; onSaved: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpsertPersonalInfo();
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<PersonalForm>({
    resolver: zodResolver(personalSchema),
    defaultValues: { fullName: initialData?.fullName || "", email: initialData?.email || "", phone: initialData?.phone || "", linkedin: initialData?.linkedin || "", portfolio: initialData?.portfolio || "", address: initialData?.address || "" },
  });

  const onSubmit = (data: PersonalForm) => {
    mutation.mutate({ resumeId, data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetPersonalInfoQueryKey(resumeId) });
        qc.invalidateQueries({ queryKey: getGetResumeQueryKey(resumeId) });
        toast({ title: "Personal info saved" });
        onSaved();
      },
      onError: () => toast({ title: "Save failed", variant: "destructive" }),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Full Name *</Label>
          <Input placeholder="Rahul Sharma" data-testid="input-fullname" {...register("fullName")} />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input type="email" placeholder="rahul@example.com" data-testid="input-email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Phone *</Label>
          <Input placeholder="+91 98765 43210" data-testid="input-phone" {...register("phone")} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>City, State</Label>
          <Input placeholder="Mumbai, Maharashtra" {...register("address")} />
        </div>
        <div className="space-y-1.5">
          <Label>LinkedIn URL</Label>
          <Input placeholder="linkedin.com/in/rahul-sharma" {...register("linkedin")} />
        </div>
        <div className="space-y-1.5">
          <Label>Portfolio / GitHub URL</Label>
          <Input placeholder="github.com/rahulsharma" {...register("portfolio")} />
        </div>
      </div>
      <Button type="submit" disabled={mutation.isPending} data-testid="button-save-personal">
        {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save & Continue
      </Button>
    </form>
  );
}

// ─── Career Objective ───────────────────────────────────────────────────────────
function StepObjective({ resumeId, initialData, onSaved }: { resumeId: number; initialData?: { summaryText: string } | null; onSaved: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const mutation = useUpsertObjective();
  const [text, setText] = useState(initialData?.summaryText || "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { toast({ title: "Please enter a career objective", variant: "destructive" }); return; }
    mutation.mutate({ resumeId, data: { summaryText: text } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetObjectiveQueryKey(resumeId) });
        toast({ title: "Objective saved" });
        onSaved();
      },
      onError: () => toast({ title: "Save failed", variant: "destructive" }),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Career Objective / Professional Summary *</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowSuggestions(s => !s)} className="text-xs">
            {showSuggestions ? "Hide" : "See"} Suggestions
          </Button>
        </div>
        {showSuggestions && (
          <Card className="border-primary/20">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Click to use a suggestion:</p>
              {OBJECTIVE_SUGGESTIONS.map((s, i) => (
                <div key={i} className="text-xs text-muted-foreground p-2 bg-muted rounded cursor-pointer hover:bg-accent/20 transition-colors"
                  onClick={() => { setText(s); setShowSuggestions(false); }}>
                  {s}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        <Textarea
          placeholder="Write a 2-3 sentence summary about your career goals, key skills, and what you're looking for..."
          value={text}
          onChange={e => setText(e.target.value.slice(0, 500))}
          rows={5}
          data-testid="textarea-objective"
        />
        <div className="flex justify-end">
          <span className={`text-xs ${text.length >= 450 ? "text-amber-500" : "text-muted-foreground"}`}>{text.length}/500</span>
        </div>
      </div>
      <Button type="submit" disabled={mutation.isPending} data-testid="button-save-objective">
        {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save & Continue
      </Button>
    </form>
  );
}

// ─── Education ───────────────────────────────────────────────────────────────────
const eduSchema = z.object({
  institution: z.string().min(2, "Institution required"),
  degree: z.string().min(2, "Degree required"),
  fieldOfStudy: z.string().min(2, "Field required"),
  graduationYear: z.coerce.number().min(2020).max(2026),
  cgpa: z.string().min(1, "CGPA required"),
});
type EduForm = z.infer<typeof eduSchema>;

function EduEntry({ resumeId, edu, onDelete }: { resumeId: number; edu: EduForm & { id: number }; onDelete: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateEducation();
  const del = useDeleteEducation();
  const { register, handleSubmit, formState: { errors } } = useForm<EduForm>({
    resolver: zodResolver(eduSchema),
    defaultValues: { ...edu },
  });
  const [saved, setSaved] = useState(false);

  const onSubmit = (data: EduForm) => {
    update.mutate({ resumeId, educationId: edu.id, data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListEducationQueryKey(resumeId) });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
      onError: () => toast({ title: "Save failed", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    del.mutate({ resumeId, educationId: edu.id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListEducationQueryKey(resumeId) }); onDelete(); },
    });
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Institution *</Label>
              <Input placeholder="IIT Delhi / VIT University" {...register("institution")} className="h-8 text-sm" />
              {errors.institution && <p className="text-xs text-destructive">{errors.institution.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Degree *</Label>
              <Input placeholder="B.Tech / BCA / MCA" {...register("degree")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Field of Study *</Label>
              <Input placeholder="Computer Science" {...register("fieldOfStudy")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Year of Graduation *</Label>
              <select {...register("graduationYear")} className="w-full h-8 border rounded-md text-sm px-2 bg-background">
                {GRAD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CGPA / Percentage *</Label>
              <Input placeholder="8.5 / 85%" {...register("cgpa")} className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={update.isPending} className="text-xs">
              {saved ? <><Check className="w-3.5 h-3.5 mr-1" />Saved</> : update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
            </Button>
            <Button type="button" size="sm" variant="outline" className="text-xs text-destructive hover:text-destructive" onClick={handleDelete} disabled={del.isPending}>
              <Trash2 className="w-3.5 h-3.5 mr-1" />Remove
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StepEducation({ resumeId, onSaved }: { resumeId: number; onSaved: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: rows = [], isLoading } = useListEducation(resumeId, { query: { queryKey: getListEducationQueryKey(resumeId) } });
  const create = useCreateEducation();

  const addNew = () => {
    create.mutate({ resumeId, data: { institution: "Enter institution", degree: "B.Tech", fieldOfStudy: "Computer Science", graduationYear: 2024, cgpa: "8.0" } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListEducationQueryKey(resumeId) }),
      onError: () => toast({ title: "Failed to add entry", variant: "destructive" }),
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {rows.map(edu => (
        <EduEntry key={edu.id} resumeId={resumeId} edu={{ ...edu, graduationYear: edu.graduationYear }} onDelete={() => {}} />
      ))}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addNew} disabled={create.isPending}>
          <Plus className="w-4 h-4 mr-2" />Add Education
        </Button>
        {rows.length > 0 && (
          <Button onClick={onSaved} data-testid="button-continue-education">
            <ArrowRight className="w-4 h-4 mr-2" />Continue
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Skills ──────────────────────────────────────────────────────────────────────
function StepSkills({ resumeId, onSaved }: { resumeId: number; onSaved: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: skills = [] } = useListSkills(resumeId, { query: { queryKey: getListSkillsQueryKey(resumeId) } });
  const create = useCreateSkill();
  const del = useDeleteSkill();
  const [skillName, setSkillName] = useState("");
  const [proficiency, setProficiency] = useState<"Beginner" | "Intermediate" | "Advanced" | "Expert">("Intermediate");

  const addSkill = () => {
    if (!skillName.trim()) return;
    create.mutate({ resumeId, data: { skillName: skillName.trim(), proficiencyLevel: proficiency } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListSkillsQueryKey(resumeId) }); setSkillName(""); },
      onError: () => toast({ title: "Failed to add skill", variant: "destructive" }),
    });
  };

  const removeSkill = (skillId: number) => {
    del.mutate({ resumeId, skillId }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListSkillsQueryKey(resumeId) }),
    });
  };

  const addPopular = (name: string) => {
    if (skills.some(s => s.skillName.toLowerCase() === name.toLowerCase())) return;
    create.mutate({ resumeId, data: { skillName: name, proficiencyLevel: "Intermediate" } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListSkillsQueryKey(resumeId) }),
    });
  };

  const PROFICIENCY_COLORS: Record<string, string> = { Beginner: "bg-slate-100 text-slate-700", Intermediate: "bg-blue-100 text-blue-700", Advanced: "bg-green-100 text-green-700", Expert: "bg-purple-100 text-purple-700" };

  return (
    <div className="space-y-5">
      {/* Added skills */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Your Skills</Label>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills added yet. Add some below.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <div key={s.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${PROFICIENCY_COLORS[s.proficiencyLevel] || "bg-muted"}`} data-testid={`skill-tag-${s.id}`}>
                {s.skillName}
                <span className="text-xs opacity-60">· {s.proficiencyLevel}</span>
                <button onClick={() => removeSkill(s.id)} className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add skill */}
      <div className="flex gap-2 items-end">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Skill Name</Label>
          <Input value={skillName} onChange={e => setSkillName(e.target.value)} placeholder="e.g. React, Python, SQL..."
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
            data-testid="input-skill-name" />
        </div>
        <div className="space-y-1 w-36">
          <Label className="text-xs">Proficiency</Label>
          <Select value={proficiency} onValueChange={v => setProficiency(v as typeof proficiency)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Beginner", "Intermediate", "Advanced", "Expert"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={addSkill} disabled={create.isPending} className="h-9" data-testid="button-add-skill">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Popular suggestions */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Popular skills for freshers — click to add:</Label>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SKILLS.map(name => {
            const added = skills.some(s => s.skillName.toLowerCase() === name.toLowerCase());
            return (
              <button key={name} onClick={() => addPopular(name)} disabled={added}
                className={`px-2.5 py-0.5 rounded-full border text-xs transition-colors ${added ? "bg-muted text-muted-foreground border-muted cursor-default" : "border-border hover:border-primary hover:text-primary cursor-pointer"}`}>
                {added ? <><Check className="w-3 h-3 inline mr-0.5" />{name}</> : name}
              </button>
            );
          })}
        </div>
      </div>

      {skills.length > 0 && (
        <Button onClick={onSaved} data-testid="button-continue-skills">
          <ArrowRight className="w-4 h-4 mr-2" />Continue
        </Button>
      )}
    </div>
  );
}

// ─── Projects ────────────────────────────────────────────────────────────────────
const projectSchema = z.object({
  projectTitle: z.string().min(2, "Title required"),
  description: z.string().min(5, "Description required"),
  technologies: z.string().min(2, "Technologies required"),
  projectLink: z.string().optional(),
  role: z.string().optional(),
});
type ProjectForm = z.infer<typeof projectSchema>;

function ProjectEntry({ resumeId, project, onDelete }: { resumeId: number; project: ProjectForm & { id: number }; onDelete: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateProject();
  const del = useDeleteProject();
  const { register, handleSubmit, watch } = useForm<ProjectForm>({ defaultValues: { ...project } });
  const descLen = watch("description", "").length;
  const [saved, setSaved] = useState(false);

  const onSubmit = (data: ProjectForm) => {
    update.mutate({ resumeId, projectId: project.id, data }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListProjectsQueryKey(resumeId) }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
      onError: () => toast({ title: "Save failed", variant: "destructive" }),
    });
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Project Title *</Label>
              <Input placeholder="E-commerce Website" {...register("projectTitle")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Technologies Used *</Label>
              <Input placeholder="React, Node.js, MongoDB" {...register("technologies")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Your Role</Label>
              <Input placeholder="Full Stack Developer" {...register("role")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Project Link</Label>
              <Input placeholder="https://github.com/..." {...register("projectLink")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <div className="flex justify-between">
                <Label className="text-xs">Description *</Label>
                <span className={`text-xs ${descLen > 270 ? "text-amber-500" : "text-muted-foreground"}`}>{descLen}/300</span>
              </div>
              <Textarea placeholder="Brief description of what you built and its impact..." {...register("description")} rows={2} className="text-sm resize-none" maxLength={300} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={update.isPending} className="text-xs">
              {saved ? <><Check className="w-3.5 h-3.5 mr-1" />Saved</> : "Save"}
            </Button>
            <Button type="button" size="sm" variant="outline" className="text-xs text-destructive hover:text-destructive" onClick={() => del.mutate({ resumeId, projectId: project.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListProjectsQueryKey(resumeId) }); onDelete(); } })}>
              <Trash2 className="w-3.5 h-3.5 mr-1" />Remove
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StepProjects({ resumeId, onSaved }: { resumeId: number; onSaved: () => void }) {
  const qc = useQueryClient();
  const { data: projects = [], isLoading } = useListProjects(resumeId, { query: { queryKey: getListProjectsQueryKey(resumeId) } });
  const create = useCreateProject();

  const addNew = () => {
    create.mutate({ resumeId, data: { projectTitle: "My Project", description: "Brief project description", technologies: "React, Node.js" } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListProjectsQueryKey(resumeId) }),
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {projects.map(p => <ProjectEntry key={p.id} resumeId={resumeId} project={{ ...p, role: p.role ?? undefined, projectLink: p.projectLink ?? undefined }} onDelete={() => {}} />)}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addNew} disabled={create.isPending}>
          <Plus className="w-4 h-4 mr-2" />Add Project
        </Button>
        <Button onClick={onSaved} data-testid="button-continue-projects">
          <ArrowRight className="w-4 h-4 mr-2" />{projects.length === 0 ? "Skip for now" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

// ─── Experience ────────────────────────────────────────────────────────────────
const expSchema = z.object({
  company: z.string().min(2, "Company required"),
  position: z.string().min(2, "Position required"),
  startDate: z.string().min(4, "Start date required"),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  responsibilities: z.string().min(5, "Responsibilities required"),
});
type ExpForm = z.infer<typeof expSchema>;

function ExpEntry({ resumeId, exp, onDelete }: { resumeId: number; exp: ExpForm & { id: number }; onDelete: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateExperience();
  const del = useDeleteExperience();
  const { register, handleSubmit, watch, setValue } = useForm<ExpForm>({ defaultValues: { ...exp, isCurrent: exp.isCurrent || false } });
  const isCurrent = watch("isCurrent");
  const [saved, setSaved] = useState(false);

  const onSubmit = (data: ExpForm) => {
    update.mutate({ resumeId, experienceId: exp.id, data }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListExperienceQueryKey(resumeId) }); setSaved(true); setTimeout(() => setSaved(false), 2000); },
      onError: () => toast({ title: "Save failed", variant: "destructive" }),
    });
  };

  return (
    <Card className="border">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Company / Organization *</Label>
              <Input placeholder="Google, TCS, Startup Inc." {...register("company")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Position / Role *</Label>
              <Input placeholder="Software Developer Intern" {...register("position")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Date *</Label>
              <Input placeholder="June 2023" {...register("startDate")} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input placeholder="Aug 2023" {...register("endDate")} disabled={isCurrent} className="h-8 text-sm disabled:opacity-50" />
              <div className="flex items-center gap-1.5 mt-1">
                <Checkbox id={`current-${exp.id}`} checked={isCurrent} onCheckedChange={v => setValue("isCurrent", Boolean(v))} />
                <label htmlFor={`current-${exp.id}`} className="text-xs text-muted-foreground cursor-pointer">Currently working here</label>
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Key Responsibilities *</Label>
              <Textarea placeholder="Describe your key contributions and achievements..." {...register("responsibilities")} rows={2} className="text-sm resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={update.isPending} className="text-xs">
              {saved ? <><Check className="w-3.5 h-3.5 mr-1" />Saved</> : "Save"}
            </Button>
            <Button type="button" size="sm" variant="outline" className="text-xs text-destructive hover:text-destructive" onClick={() => del.mutate({ resumeId, experienceId: exp.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListExperienceQueryKey(resumeId) }); onDelete(); } })}>
              <Trash2 className="w-3.5 h-3.5 mr-1" />Remove
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StepExperience({ resumeId, onSaved }: { resumeId: number; onSaved: () => void }) {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useListExperience(resumeId, { query: { queryKey: getListExperienceQueryKey(resumeId) } });
  const create = useCreateExperience();

  const addNew = () => {
    create.mutate({ resumeId, data: { company: "Company Name", position: "Intern", startDate: "June 2023", isCurrent: false, responsibilities: "Describe your responsibilities..." } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListExperienceQueryKey(resumeId) }),
    });
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {rows.map(exp => <ExpEntry key={exp.id} resumeId={resumeId} exp={{ ...exp, endDate: exp.endDate ?? undefined, isCurrent: exp.isCurrent ?? false }} onDelete={() => {}} />)}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addNew} disabled={create.isPending}>
          <Plus className="w-4 h-4 mr-2" />Add Experience
        </Button>
        <Button onClick={onSaved} data-testid="button-continue-experience">
          <ArrowRight className="w-4 h-4 mr-2" />{rows.length === 0 ? "Skip for now" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

// ─── Certifications ────────────────────────────────────────────────────────────
function StepCertifications({ resumeId, onSaved }: { resumeId: number; onSaved: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: certs = [] } = useListCertifications(resumeId, { query: { queryKey: getListCertificationsQueryKey(resumeId) } });
  const create = useCreateCertification();
  const update = useUpdateCertification();
  const del = useDeleteCertification();
  const [form, setForm] = useState({ certName: "", issuingOrg: "", dateIssued: "", description: "" });

  const addCert = () => {
    if (!form.certName.trim()) return;
    create.mutate({ resumeId, data: { ...form } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListCertificationsQueryKey(resumeId) }); setForm({ certName: "", issuingOrg: "", dateIssued: "", description: "" }); },
      onError: () => toast({ title: "Failed to add", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      {certs.map(c => (
        <Card key={c.id} className="border">
          <CardContent className="p-3 flex items-start gap-3">
            <div className="flex-1">
              <p className="font-medium text-sm">{c.certName}</p>
              {c.issuingOrg && <p className="text-xs text-muted-foreground">{c.issuingOrg}{c.dateIssued ? ` · ${c.dateIssued}` : ""}</p>}
              {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate({ resumeId, certificationId: c.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListCertificationsQueryKey(resumeId) }) })}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">Add Certification / Award</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input placeholder="AWS Cloud Practitioner" value={form.certName} onChange={e => setForm(f => ({ ...f, certName: e.target.value }))} className="h-8 text-sm" data-testid="input-cert-name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Issuing Organization</Label>
              <Input placeholder="Amazon, Coursera, NPTEL..." value={form.issuingOrg} onChange={e => setForm(f => ({ ...f, issuingOrg: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date Issued</Label>
              <Input placeholder="March 2024" value={form.dateIssued} onChange={e => setForm(f => ({ ...f, dateIssued: e.target.value }))} className="h-8 text-sm" />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCert} disabled={create.isPending || !form.certName}>
            <Plus className="w-3.5 h-3.5 mr-1" />Add
          </Button>
        </CardContent>
      </Card>

      <Button onClick={onSaved} data-testid="button-continue-certifications">
        <ArrowRight className="w-4 h-4 mr-2" />{certs.length === 0 ? "Skip for now" : "Continue"}
      </Button>
    </div>
  );
}

// ─── Languages ─────────────────────────────────────────────────────────────────
function StepLanguages({ resumeId, onSaved }: { resumeId: number; onSaved: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: langs = [] } = useListLanguages(resumeId, { query: { queryKey: getListLanguagesQueryKey(resumeId) } });
  const create = useCreateLanguage();
  const del = useDeleteLanguage();
  const [langName, setLangName] = useState("");
  const [proficiency, setProficiency] = useState<"Native" | "Fluent" | "Intermediate" | "Basic">("Intermediate");

  const addLang = () => {
    if (!langName.trim()) return;
    create.mutate({ resumeId, data: { languageName: langName.trim(), proficiency } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListLanguagesQueryKey(resumeId) }); setLangName(""); },
      onError: () => toast({ title: "Failed to add", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {langs.map(l => (
          <div key={l.id} className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm">
            <span className="font-medium">{l.languageName}</span>
            <span className="text-xs text-muted-foreground">· {l.proficiency}</span>
            <button onClick={() => del.mutate({ resumeId, languageId: l.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListLanguagesQueryKey(resumeId) }) })}>
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Language</Label>
          <Input value={langName} onChange={e => setLangName(e.target.value)} placeholder="English, Hindi, Tamil..." className="h-9" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLang())} data-testid="input-language-name" />
        </div>
        <div className="space-y-1 w-36">
          <Label className="text-xs">Proficiency</Label>
          <Select value={proficiency} onValueChange={v => setProficiency(v as typeof proficiency)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Native", "Fluent", "Intermediate", "Basic"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={addLang} disabled={create.isPending} className="h-9" data-testid="button-add-language">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Button onClick={onSaved} data-testid="button-complete">
        {langs.length === 0 ? "Finish Resume" : <><Check className="w-4 h-4 mr-2" />Finish Resume</>}
      </Button>
    </div>
  );
}

// ─── Main Builder ───────────────────────────────────────────────────────────────
export default function Builder() {
  const params = useParams<{ resumeId: string }>();
  const resumeId = parseInt(params.resumeId);
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);

  const { data: resumeDetail, isLoading } = useGetResume(resumeId, { query: { queryKey: getGetResumeQueryKey(resumeId), enabled: !!resumeId } });

  const next = useCallback(() => {
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
    else setLocation(`/builder/${resumeId}/preview`);
  }, [currentStep, resumeId, setLocation]);

  const prev = useCallback(() => { if (currentStep > 0) setCurrentStep(s => s - 1); }, [currentStep]);

  const TOOLTIPS: Record<number, string> = {
    0: "Add your contact details so recruiters can reach you.",
    1: "A great objective tells recruiters who you are and what you want in 2-3 sentences.",
    2: "List your most recent education first. Include CGPA if 7.0+.",
    3: "Add at least 5 relevant technical and soft skills.",
    4: "Projects are crucial for freshers — they demonstrate real-world experience.",
    5: "Include internships, part-time work, or volunteer experience.",
    6: "Add any online certifications from Coursera, NPTEL, Udemy, etc.",
    7: "Listing languages shows cultural versatility to recruiters.",
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!resumeDetail) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Resume not found. <Link href="/dashboard" className="text-primary ml-1">Go to dashboard</Link></div>;

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
          </Button>
          <span className="text-muted-foreground text-sm hidden sm:block">/</span>
          <span className="font-semibold text-sm truncate hidden sm:block">{resumeDetail.resume.resumeName}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Step {currentStep + 1} of {STEPS.length}</span>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/builder/${resumeId}/preview`}><Eye className="w-4 h-4 mr-1" />Preview</Link>
            </Button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-1">
          <Progress value={progress} className="h-1.5" />
        </div>
      </header>

      <div className="flex-1 flex max-w-5xl mx-auto w-full px-4 py-6 gap-6">
        {/* Sidebar nav */}
        <aside className="w-44 flex-shrink-0 hidden md:block">
          <nav className="space-y-0.5 sticky top-20">
            {STEPS.map((step, i) => (
              <button key={step} onClick={() => setCurrentStep(i)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${i === currentStep ? "bg-primary text-primary-foreground font-semibold" : i < currentStep ? "text-foreground bg-muted/40" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                data-testid={`step-nav-${i}`}>
                <span className={`inline-flex w-5 h-5 rounded-full text-xs font-bold items-center justify-center mr-2 ${i === currentStep ? "bg-white/20" : i < currentStep ? "bg-primary/20 text-primary" : "bg-muted"}`}>{i + 1}</span>
                {step}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main form area */}
        <main className="flex-1 min-w-0">
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{STEPS[currentStep]}</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground"><HelpCircle className="w-4 h-4" /></button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">{TOOLTIPS[currentStep]}</TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground">{TOOLTIPS[currentStep]}</p>
          </div>

          {currentStep === 0 && <StepPersonal resumeId={resumeId} initialData={resumeDetail.personalInfo ? { ...resumeDetail.personalInfo, address: resumeDetail.personalInfo.address ?? undefined, linkedin: resumeDetail.personalInfo.linkedin ?? undefined, portfolio: resumeDetail.personalInfo.portfolio ?? undefined, photoUrl: resumeDetail.personalInfo.photoUrl ?? undefined } : null} onSaved={next} />}
          {currentStep === 1 && <StepObjective resumeId={resumeId} initialData={resumeDetail.objective} onSaved={next} />}
          {currentStep === 2 && <StepEducation resumeId={resumeId} onSaved={next} />}
          {currentStep === 3 && <StepSkills resumeId={resumeId} onSaved={next} />}
          {currentStep === 4 && <StepProjects resumeId={resumeId} onSaved={next} />}
          {currentStep === 5 && <StepExperience resumeId={resumeId} onSaved={next} />}
          {currentStep === 6 && <StepCertifications resumeId={resumeId} onSaved={next} />}
          {currentStep === 7 && <StepLanguages resumeId={resumeId} onSaved={() => setLocation(`/builder/${resumeId}/preview`)} />}

          <div className="flex gap-3 mt-8 pt-4 border-t">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prev}>
                <ArrowLeft className="w-4 h-4 mr-2" />Previous
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
