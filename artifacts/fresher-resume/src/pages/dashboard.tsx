import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useListResumes, useCreateResume, useDeleteResume, useDuplicateResume, useGetDashboardStats, getListResumesQueryKey, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { removeToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, MoreVertical, Edit, Trash2, Copy, LogOut, Loader2, BarChart3, Crown, Sparkles, Upload, Lock, Search, TrendingUp, Palette, MessageSquare, Brain } from "lucide-react";
import ResumePreview from "@/components/resume-preview";
import ResumeUploadDialog from "@/components/resume-upload-dialog";
import { isTemplatePremium } from "@/lib/premium";

const TEMPLATES = [
  { id: 1,  name: "Minimal ATS Resume" },
  { id: 2,  name: "Corporate Resume" },
  { id: 3,  name: "Creative Designer" },
  { id: 4,  name: "Executive Resume" },
  { id: 5,  name: "Developer Resume" },
  { id: 6,  name: "Modern Gradient" },
  { id: 7,  name: "Dark Theme" },
  { id: 8,  name: "Infographic" },
  { id: 9,  name: "Elegant Professional" },
  { id: 10, name: "Startup Founder" },
];

const PREMIUM_TEASER_TEMPLATE_IDS = [3, 7, 9, 10];

const TEMPLATE_COLORS: Record<number, string> = {
  1: "#111827", 2: "#003366", 3: "#7C3AED", 4: "#1C2B3A", 5: "#0D1117",
  6: "#4F46E5", 7: "#0f172a", 8: "#6366F1", 9: "#8B6914", 10: "#F97316",
};

const RESUME_PREVIEW_WIDTH = 794;

const SAMPLE_RESUME = {
  personalInfo: {
    id: 1, resumeId: 1,
    fullName: "Aarav Sharma",
    email: "aarav.sharma@email.com",
    phone: "9876543210",
    linkedin: "linkedin.com/in/aaravsharma",
    portfolio: "aaravsharma.dev",
    address: "Bengaluru, India",
  },
  objective: {
    id: 1, resumeId: 1,
    summaryText: "Motivated Computer Science graduate seeking an entry-level software engineering role to apply strong problem-solving and full-stack development skills.",
  },
  education: [
    { id: 1, resumeId: 1, institution: "Indian Institute of Technology", degree: "B.Tech", fieldOfStudy: "Computer Science", graduationYear: 2026, cgpa: "8.7" },
  ],
  skills: [
    { id: 1, resumeId: 1, skillName: "JavaScript", proficiencyLevel: "Advanced" as const },
    { id: 2, resumeId: 1, skillName: "React", proficiencyLevel: "Advanced" as const },
    { id: 3, resumeId: 1, skillName: "Python", proficiencyLevel: "Intermediate" as const },
    { id: 4, resumeId: 1, skillName: "SQL", proficiencyLevel: "Intermediate" as const },
  ],
  projects: [
    { id: 1, resumeId: 1, projectTitle: "Smart Attendance System", description: "Built a facial-recognition attendance app used by 500+ students across campus.", technologies: "Python, OpenCV, Flask", projectLink: "github.com/aarav/attendance", role: "Lead Developer" },
  ],
  experience: [
    { id: 1, resumeId: 1, company: "TechNova Labs", position: "Software Engineering Intern", startDate: "May 2025", endDate: "Jul 2025", isCurrent: false, responsibilities: "Built and shipped internal tooling used by 3 product teams." },
  ],
  certifications: [
    { id: 1, resumeId: 1, certName: "AWS Certified Cloud Practitioner", issuingOrg: "Amazon Web Services", dateIssued: "2025", description: null },
  ],
  languages: [
    { id: 1, resumeId: 1, languageName: "English", proficiency: "Fluent" as const },
  ],
};

function ResumeThumb({ templateId, resumeName }: { templateId: number; resumeName?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / RESUME_PREVIEW_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-28 overflow-hidden relative bg-white rounded-t-lg">
      {scale > 0 && (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: RESUME_PREVIEW_WIDTH, transform: `scale(${scale})`, pointerEvents: "none" }}
          aria-hidden="true"
        >
          <ResumePreview data={SAMPLE_RESUME} templateId={templateId} resumeName={resumeName} />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [resumeNameTouched, setResumeNameTouched] = useState(false);
  const [templateId, setTemplateId] = useState("1");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const resumeNameError = !resumeName.trim()
    ? "Resume name is required"
    : resumeName.trim().length > 80
      ? "Keep it under 80 characters"
      : null;

  const { data: me, isLoading: meLoading } = useGetMe();
  const { data: resumes, isLoading: resumesLoading } = useListResumes();
  const { data: stats } = useGetDashboardStats();
  const createMutation = useCreateResume();
  const deleteMutation = useDeleteResume();
  const duplicateMutation = useDuplicateResume();

  if (meLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!me) {
    queueMicrotask(() => setLocation("/login"));
    return null;
  }

  const handleCreate = () => {
    setResumeNameTouched(true);
    if (resumeNameError) return;
    createMutation.mutate({ data: { resumeName: resumeName.trim(), templateId: parseInt(templateId) } }, {
      onSuccess: (resume) => {
        qc.invalidateQueries({ queryKey: getListResumesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setCreateOpen(false);
        setResumeName("");
        setResumeNameTouched(false);
        setTemplateId("1");
        setLocation(`/builder/${resume.id}`);
      },
      onError: () => toast({ title: "Failed to create resume", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ resumeId: id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListResumesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setDeleteId(null);
        toast({ title: "Resume deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate({ resumeId: id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListResumesQueryKey() });
        toast({ title: "Resume duplicated" });
      },
      onError: () => toast({ title: "Failed to duplicate", variant: "destructive" }),
    });
  };

  const handleLogout = () => {
    removeToken();
    setLocation("/login");
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">SkillDraft</span>
          </div>
          <div className="flex items-center gap-3">
            {me.isPremium ? (
              <Link
                href="/upgrade"
                className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 hover:bg-yellow-100 transition-colors cursor-pointer"
                data-testid="button-premium-badge"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-semibold text-yellow-700">Premium</span>
              </Link>
            ) : (
              <Button size="sm" variant="outline" asChild className="border-blue-200 text-blue-600 hover:bg-blue-50" data-testid="button-upgrade-header">
                <Link href="/upgrade"><Sparkles className="w-3.5 h-3.5 mr-1.5" /><span className="hidden sm:inline">Upgrade</span></Link>
              </Button>
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">Hi, <strong>{me.username}</strong></span>
            <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-1" />Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Resumes</p>
              <p className="text-2xl font-bold text-primary">{stats?.totalResumes ?? resumes?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Downloads</p>
              <p className="text-2xl font-bold">{stats?.totalDownloads ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Most Used Template</p>
              <p className="text-sm font-semibold">{stats?.templateUsage?.[0]?.templateName ?? "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Account</p>
              <p className="text-sm font-semibold truncate">{me.email}</p>
            </CardContent>
          </Card>
        </div>

        {/* Premium teaser */}
        {!me.isPremium && (
          <Card className="mb-8 border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50 overflow-hidden" data-testid="card-premium-teaser">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Crown className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Premium</span>
                  </div>
                  <h3 className="font-bold text-base mb-1">Unlock 7 more designer templates</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Plus unlimited PDF &amp; Word downloads and every font — for ₹499/year.
                  </p>
                  <Button asChild size="sm" style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
                    <Link href="/upgrade"><Sparkles className="w-3.5 h-3.5 mr-1.5" />See Premium Plans</Link>
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2 w-full md:w-72 flex-shrink-0">
                  {PREMIUM_TEASER_TEMPLATE_IDS.map(tid => (
                    <div key={tid} className="relative rounded-md overflow-hidden border border-blue-200 shadow-sm">
                      <ResumeThumb templateId={tid} resumeName="Aarav Sharma" />
                      <div className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                        <Lock className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumes */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">My Resumes</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="button-import-resume">
              <Upload className="w-4 h-4 mr-2" />Import Resume
            </Button>
            <Button onClick={() => setCreateOpen(true)} data-testid="button-create-resume">
              <Plus className="w-4 h-4 mr-2" />New Resume
            </Button>
          </div>
        </div>

        {resumesLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !resumes?.length ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center space-y-3">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">No resumes yet</h3>
              <p className="text-sm text-muted-foreground">Create your first resume to get started</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Create Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume) => (
              <Card key={resume.id} className="group hover:shadow-md transition-shadow overflow-hidden" data-testid={`card-resume-${resume.id}`}>
                <ResumeThumb templateId={resume.templateId} resumeName={resume.resumeName} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{resume.resumeName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {TEMPLATES.find(t => t.id === resume.templateId)?.name || "Modern"} · {formatDate(resume.updatedAt)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" data-testid={`menu-resume-${resume.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/builder/${resume.id}`)}>
                          <Edit className="w-4 h-4 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation(`/builder/${resume.id}/preview`)}>
                          <BarChart3 className="w-4 h-4 mr-2" />Preview & Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(resume.id)}>
                          <Copy className="w-4 h-4 mr-2" />Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(resume.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setLocation(`/builder/${resume.id}`)}>
                      Edit
                    </Button>
                    <Button size="sm" className="flex-1 text-xs" onClick={() => setLocation(`/builder/${resume.id}/preview`)}>
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Career Tools */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />Career Tools
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">AI-powered tools to improve your resume and interview readiness</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/career"><Brain className="w-3.5 h-3.5 mr-1.5" />View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { href: "/career/analytics",      icon: BarChart3,     label: "Analytics",        color: "bg-blue-500" },
              { href: "/career/review",         icon: Sparkles,      label: "AI Review",        color: "bg-purple-500" },
              { href: "/career/job-match",      icon: Search,        label: "Job Match",        color: "bg-emerald-500" },
              { href: "/career/skill-gap",      icon: TrendingUp,    label: "Skill Gap",        color: "bg-orange-500" },
              { href: "/career/interview-prep", icon: MessageSquare, label: "Interview Prep",   color: "bg-teal-500" },
              { href: "/career/mock-interview", icon: Brain,         label: "Mock Interview",   color: "bg-red-500" },
            ].map(tool => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} href={tool.href}>
                  <Card className="cursor-pointer hover:shadow-md transition-all duration-150 hover:border-blue-200 group">
                    <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                      <div className={`w-10 h-10 rounded-xl ${tool.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 leading-tight">{tool.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setResumeNameTouched(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="resume-name">Resume Name</Label>
              <Input
                id="resume-name"
                placeholder="e.g. Software Developer Resume"
                value={resumeName}
                onChange={e => setResumeName(e.target.value)}
                onBlur={() => setResumeNameTouched(true)}
                maxLength={80}
                aria-invalid={!!resumeNameError}
                className={resumeNameTouched && resumeNameError ? "border-destructive focus-visible:ring-destructive" : ""}
                data-testid="input-resume-name"
              />
              {resumeNameTouched && resumeNameError && <p className="text-xs text-destructive">{resumeNameError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger data-testid="select-template"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => {
                    const locked = !me.isPremium && isTemplatePremium(t.id);
                    return (
                      <SelectItem key={t.id} value={String(t.id)} disabled={locked} data-testid={`select-template-option-${t.id}`}>
                        <span className="flex items-center gap-1.5">
                          {t.name}
                          {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!me.isPremium && (
                <p className="text-xs text-muted-foreground">
                  <Lock className="w-3 h-3 inline mr-1" />
                  7 premium templates are available with{" "}
                  <Link href="/upgrade" className="text-blue-600 hover:underline font-medium">Premium</Link>.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || (resumeNameTouched && !!resumeNameError)} data-testid="button-confirm-create">
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create & Build"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. The resume and all its data will be permanently deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResumeUploadDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
