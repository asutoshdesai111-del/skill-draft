import { useState } from "react";
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
import { FileText, Plus, MoreVertical, Edit, Trash2, Copy, LogOut, Loader2, BarChart3 } from "lucide-react";

const TEMPLATES = [
  { id: 1, name: "Modern Professional" },
  { id: 2, name: "Minimalist" },
  { id: 3, name: "Creative" },
  { id: 4, name: "Corporate" },
  { id: 5, name: "Technical" },
];

const TEMPLATE_COLORS: Record<number, string> = {
  1: "#1e40af", 2: "#111827", 3: "#0d9488", 4: "#b45309", 5: "#374151"
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [templateId, setTemplateId] = useState("1");
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
    setLocation("/login");
    return null;
  }

  const handleCreate = () => {
    if (!resumeName.trim()) { toast({ title: "Please enter a resume name", variant: "destructive" }); return; }
    createMutation.mutate({ data: { resumeName: resumeName.trim(), templateId: parseInt(templateId) } }, {
      onSuccess: (resume) => {
        qc.invalidateQueries({ queryKey: getListResumesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setCreateOpen(false);
        setResumeName("");
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
            <span className="font-bold text-sm">Fresher Resume Builder</span>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Resumes */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">My Resumes</h2>
          <Button onClick={() => setCreateOpen(true)} data-testid="button-create-resume">
            <Plus className="w-4 h-4 mr-2" />New Resume
          </Button>
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
              <Card key={resume.id} className="group hover:shadow-md transition-shadow" data-testid={`card-resume-${resume.id}`}>
                <div
                  className="h-28 flex items-center justify-center rounded-t-lg"
                  style={{ backgroundColor: TEMPLATE_COLORS[resume.templateId] || "#1e40af" }}
                >
                  <FileText className="w-8 h-8 text-white opacity-70" />
                </div>
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
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Resume</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="resume-name">Resume Name</Label>
              <Input id="resume-name" placeholder="e.g. Software Developer Resume" value={resumeName} onChange={e => setResumeName(e.target.value)} data-testid="input-resume-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger data-testid="select-template"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-confirm-create">
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
    </div>
  );
}
