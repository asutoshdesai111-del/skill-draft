import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetResume, useGetAtsScore, useExportResumePdf, useUpdateResume, useListTemplates,
  getGetResumeQueryKey, getGetAtsScoreQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ResumePreview from "@/components/resume-preview";
import { ArrowLeft, Download, Loader2, CheckCircle, AlertCircle, ChevronRight, Type } from "lucide-react";

const TEMPLATE_COLORS: Record<number, string> = { 1: "#1e40af", 2: "#111827", 3: "#0d9488", 4: "#b45309", 5: "#374151" };

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", style: "Inter, sans-serif" },
  { value: "Georgia", label: "Georgia", style: "Georgia, serif" },
  { value: "Roboto", label: "Roboto", style: "Roboto, sans-serif" },
  { value: "Merriweather", label: "Merriweather", style: "Merriweather, serif" },
  { value: "Playfair Display", label: "Playfair Display", style: "'Playfair Display', serif" },
  { value: "Lato", label: "Lato", style: "Lato, sans-serif" },
  { value: "Montserrat", label: "Montserrat", style: "Montserrat, sans-serif" },
  { value: "Open Sans", label: "Open Sans", style: "'Open Sans', sans-serif" },
  { value: "Source Serif 4", label: "Source Serif", style: "'Source Serif 4', serif" },
  { value: "Courier Prime", label: "Courier Prime", style: "'Courier Prime', monospace" },
];

function AtsScoreWidget({ score, tips, keywordsFound, missingKeywords }: { score: number; tips: string[]; keywordsFound: string[]; missingKeywords: string[] }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 88 88" className="w-20 h-20 -rotate-90">
              <circle cx="44" cy="44" r="36" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="44" cy="44" r="36" fill="none" stroke={color} strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold" style={{ color }}>{score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm">ATS Score</p>
            <p className="text-xs text-muted-foreground">{score >= 70 ? "Good — likely to pass ATS" : score >= 40 ? "Fair — could be improved" : "Needs improvement"}</p>
          </div>
        </div>

        {tips.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Improvement Tips</p>
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                {tip}
              </div>
            ))}
          </div>
        )}

        {keywordsFound.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Sections Found</p>
            <div className="flex flex-wrap gap-1">
              {keywordsFound.map(k => (
                <Badge key={k} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />{k}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {missingKeywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Missing</p>
            <div className="flex flex-wrap gap-1">
              {missingKeywords.map(k => (
                <Badge key={k} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">{k}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Preview() {
  const params = useParams<{ resumeId: string }>();
  const resumeId = parseInt(params.resumeId);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: resumeDetail, isLoading } = useGetResume(resumeId, { query: { queryKey: getGetResumeQueryKey(resumeId), enabled: !!resumeId } });
  const { data: atsScore } = useGetAtsScore(resumeId, { query: { queryKey: getGetAtsScoreQueryKey(resumeId), enabled: !!resumeId } });
  const { data: templates } = useListTemplates();
  const { refetch: refetchExport, isFetching: isExporting } = useExportResumePdf(resumeId, {
    query: { enabled: false, queryKey: ["export-resume-pdf", resumeId] as const },
  });
  const updateMutation = useUpdateResume();

  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [currentFont, setCurrentFont] = useState<string | null>(null);

  const templateId = currentTemplateId ?? resumeDetail?.resume?.templateId ?? 1;
  const fontFamily = currentFont ?? resumeDetail?.resume?.fontFamily ?? "Inter";

  const handleTemplateChange = (val: string) => {
    const tid = parseInt(val);
    setCurrentTemplateId(tid);
    if (resumeId) {
      updateMutation.mutate({ resumeId, data: { templateId: tid } }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getGetResumeQueryKey(resumeId) }),
      });
    }
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    if (resumeId) {
      updateMutation.mutate({ resumeId, data: { fontFamily: font } }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getGetResumeQueryKey(resumeId) }),
      });
    }
  };

  const handleDownload = async () => {
    try {
      const { data: result } = await refetchExport();
      if (!result) return;
      const byteChars = atob(result.pdfBase64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Resume downloaded!", description: "Open the HTML file in a browser and use Ctrl+P to print/save as PDF." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!resumeDetail) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Resume not found</div>;
  }

  const { resume, personalInfo, objective, education = [], skills = [], projects = [], experience = [], certifications = [], languages = [] } = resumeDetail;

  const data = { personalInfo, objective, education, skills, projects, experience, certifications, languages };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/builder/${resumeId}`}><ArrowLeft className="w-4 h-4 mr-1" />Edit</Link>
          </Button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="font-semibold text-sm truncate">{resume.resumeName}</span>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">Template:</span>
              <Select value={String(templateId)} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-preview-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(templates || [{ id: 1, templateName: "Modern Professional" }, { id: 2, templateName: "Minimalist" }, { id: 3, templateName: "Creative" }, { id: 4, templateName: "Corporate" }, { id: 5, templateName: "Technical" }]).map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TEMPLATE_COLORS[t.id] || "#111" }} />
                        {t.templateName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleDownload} disabled={isExporting} data-testid="button-download-pdf">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Download className="w-4 h-4 mr-1" />Download</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Resume Preview */}
        <div className="flex justify-center">
          <div style={{ width: "100%", maxWidth: 794 }}>
            <ResumePreview data={data} templateId={templateId} resumeName={resume.resumeName} fontFamily={fontFamily} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {atsScore && (
            <AtsScoreWidget
              score={atsScore.score}
              tips={atsScore.tips}
              keywordsFound={atsScore.keywordsFound}
              missingKeywords={atsScore.missingKeywords}
            />
          )}

          {/* Template quick-pick */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Template Gallery</p>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map(tid => (
                  <button
                    key={tid}
                    onClick={() => handleTemplateChange(String(tid))}
                    className={`h-10 rounded cursor-pointer border-2 transition-all ${tid === templateId ? "border-primary scale-105" : "border-transparent"}`}
                    style={{ backgroundColor: TEMPLATE_COLORS[tid] }}
                    data-testid={`template-pick-${tid}`}
                    title={`Template ${tid}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5 px-0.5">
                {["Mod", "Min", "Cre", "Corp", "Tech"].map(n => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font picker */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Type className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">Font Style</p>
              </div>
              <div className="space-y-1">
                {FONT_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => handleFontChange(f.value)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-sm transition-all border ${
                      fontFamily === f.value
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-transparent hover:bg-muted text-foreground"
                    }`}
                    style={{ fontFamily: f.style }}
                    data-testid={`font-pick-${f.value}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next steps */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Sections Completed</p>
              {[
                { label: "Personal Info", done: !!personalInfo },
                { label: "Career Objective", done: !!objective },
                { label: "Education", done: education.length > 0 },
                { label: "Skills", done: skills.length > 0 },
                { label: "Projects", done: projects.length > 0 },
                { label: "Experience", done: experience.length > 0 },
                { label: "Certifications", done: certifications.length > 0 },
                { label: "Languages", done: languages.length > 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {done
                    ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40" />
                  }
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-2 text-xs" asChild>
                <Link href={`/builder/${resumeId}`}><ChevronRight className="w-3.5 h-3.5 mr-1" />Back to Editor</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
