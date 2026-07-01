import { useEffect, useRef, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetResume, useGetAtsScore, useExportResumePdf, useExportResumeDocx, useUpdateResume, useListTemplates, useGetMe,
  getGetResumeQueryKey, getGetAtsScoreQueryKey, getListTemplatesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import ResumePreview from "@/components/resume-preview";
import { ArrowLeft, Download, Loader2, CheckCircle, AlertCircle, ChevronRight, Type, FileText, FileCode, ChevronDown, Lock, Crown, LayoutTemplate } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { isTemplatePremium, isFontPremium } from "@/lib/premium";
import { getToken } from "@/lib/auth";
import { getExportResumeDocxUrl } from "@workspace/api-client-react";

const TEMPLATE_COLORS: Record<number, string> = {
  1: "#111827", 2: "#003366", 3: "#7C3AED", 4: "#1C2B3A", 5: "#0D1117",
  6: "#4F46E5", 7: "#0f172a", 8: "#6366F1", 9: "#8B6914", 10: "#F97316",
};

const ALL_TEMPLATE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RESUME_PREVIEW_WIDTH = 794;

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

type ResumePreviewData = React.ComponentProps<typeof ResumePreview>["data"];

function GalleryThumb({ tid, data, resumeName, active, locked, onClick }: { tid: number; data: ResumePreviewData; resumeName?: string; active: boolean; locked: boolean; onClick: () => void }) {
  const containerRef = useRef<HTMLButtonElement>(null);
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
    <button
      ref={containerRef}
      onClick={onClick}
      className={`relative aspect-[4/5] rounded overflow-hidden border-2 transition-all bg-white cursor-pointer ${active ? "border-primary scale-105" : "border-transparent hover:border-muted-foreground/30"}`}
      style={{ backgroundColor: TEMPLATE_COLORS[tid] || "#111" }}
      data-testid={`template-pick-${tid}`}
      title={locked ? `Template ${tid} (Premium)` : `Template ${tid}`}
    >
      {scale > 0 && (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: RESUME_PREVIEW_WIDTH, transform: `scale(${scale})`, pointerEvents: "none" }}
          aria-hidden="true"
        >
          <ResumePreview data={data} templateId={tid} resumeName={resumeName} />
        </div>
      )}
      {locked && (
        <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-1">
            <Lock className="w-3 h-3 text-gray-700" />
          </div>
        </div>
      )}
    </button>
  );
}

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

  const { data: me } = useGetMe();
  const isPremiumUser = !!me?.isPremium;
  const { data: resumeDetail, isLoading } = useGetResume(resumeId, { query: { queryKey: getGetResumeQueryKey(resumeId), enabled: !!resumeId } });
  const { data: atsScore } = useGetAtsScore(resumeId, { query: { queryKey: getGetAtsScoreQueryKey(resumeId), enabled: !!resumeId } });
  const { data: templates } = useListTemplates({ query: { queryKey: getListTemplatesQueryKey(), staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 } });
  const { refetch: refetchHtml, isFetching: isExportingHtml } = useExportResumePdf(resumeId, {
    query: { enabled: false, queryKey: ["export-resume-pdf", resumeId] as const },
  });
  const { refetch: refetchDocx, isFetching: isExportingDocx } = useExportResumeDocx(resumeId, {
    query: { enabled: false, queryKey: ["export-resume-docx", resumeId] as const },
  });
  const updateMutation = useUpdateResume();

  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [currentFont, setCurrentFont] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [paperSize, setPaperSize] = useState<"a4" | "letter">("a4");

  const templateId = currentTemplateId ?? resumeDetail?.resume?.templateId ?? 1;
  const fontFamily = currentFont ?? resumeDetail?.resume?.fontFamily ?? "Inter";

  // Shows an upgrade nudge instead of performing a Premium-only action.
  // Returns true when the action is allowed to proceed.
  const requirePremium = (featureLabel: string): boolean => {
    if (isPremiumUser) return true;
    toast({
      title: `${featureLabel} is a Premium feature`,
      description: "Upgrade to unlock it — tap here or use the Upgrade button.",
      variant: "destructive",
    });
    return false;
  };

  const handleTemplateChange = (val: string) => {
    const tid = parseInt(val);
    if (isTemplatePremium(tid) && !requirePremium("This template")) return;
    setCurrentTemplateId(tid);
    if (resumeId) {
      updateMutation.mutate({ resumeId, data: { templateId: tid } }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getGetResumeQueryKey(resumeId) }),
      });
    }
  };

  const handleFontChange = (font: string) => {
    if (isFontPremium(font) && !requirePremium("This font")) return;
    setCurrentFont(font);
    if (resumeId) {
      updateMutation.mutate({ resumeId, data: { fontFamily: font } }, {
        onSuccess: () => qc.invalidateQueries({ queryKey: getGetResumeQueryKey(resumeId) }),
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!requirePremium("PDF export")) return;
    const el = document.querySelector(".resume-preview") as HTMLElement;
    if (!el) { toast({ title: "Preview not ready", variant: "destructive" }); return; }
    setIsDownloadingPdf(true);

    // A4 = 210×297mm @ 96dpi → 794×1123px; Letter = 215.9×279.4mm @ 96dpi → 816×1056px.
    // Templates are designed for A4 width; when Letter is chosen we still capture at
    // 794px so proportions remain correct, then stretch slightly in jsPDF to fill the
    // slightly wider Letter page — the 3% difference is imperceptible on a resume.
    const captureWidth = 794;
    const prevWidth = el.style.width;
    const prevMaxWidth = el.style.maxWidth;
    el.style.width = `${captureWidth}px`;
    el.style.maxWidth = `${captureWidth}px`;

    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, windowWidth: captureWidth });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: paperSize === "letter" ? "letter" : "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const pxPerMm = canvas.width / pdfWidth;
      const pageHeightPx = pdfPageHeight * pxPerMm;
      // A naive fixed-height cut can slice straight through a card or
      // paragraph at the page boundary. Instead, search for a "safe" row
      // near the ideal cut point — one with low pixel variance, meaning
      // it's blank background between elements rather than text/a border —
      // and cut there instead. Falls back to the ideal point untouched if
      // nothing better is found nearby, so this can only help, never hurt.
      //
      // Read the whole canvas into memory once (a GPU readback) instead of
      // calling getImageData per candidate row — repeated small readbacks
      // each pay the full GPU-sync cost and can take 30s+ on a long resume.
      const ctx = canvas.getContext("2d");
      const fullData = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
      const rowVariance = (y: number): number => {
        if (!fullData) return Infinity;
        const clampedY = Math.max(0, Math.min(Math.round(y), canvas.height - 1));
        const rowStart = clampedY * canvas.width * 4;
        const step = Math.max(1, Math.floor(canvas.width / 300)) * 4;
        let sum = 0, sumSq = 0, count = 0;
        for (let offset = 0; offset < canvas.width * 4; offset += step) {
          const idx = rowStart + offset;
          const lum = 0.299 * fullData[idx] + 0.587 * fullData[idx + 1] + 0.114 * fullData[idx + 2];
          sum += lum;
          sumSq += lum * lum;
          count++;
        }
        const mean = sum / count;
        return sumSq / count - mean * mean;
      };

      const findSafeCut = (idealY: number): number => {
        if (idealY >= canvas.height) return canvas.height;
        // Search back far enough to reach the margin *between* entries, not
        // just the narrow line-spacing gap within one entry (e.g. between a
        // card's title and its own description) — settling for the nearest
        // low-variance row instead of the widest one reproduces the original
        // bug in a subtler form, just one gap up.
        const tolerance = Math.round(pageHeightPx * 0.25);
        const BLANK_THRESHOLD = 6;
        let bestRunStart = -1;
        let bestRunLen = 0;
        let runStart = -1;
        let runLen = 0;
        let fallbackY = idealY;
        let fallbackVariance = Infinity;

        for (let dy = 0; dy <= tolerance; dy++) {
          const y = idealY - dy;
          if (y <= 0) break;
          const v = rowVariance(y);
          if (v < fallbackVariance) { fallbackVariance = v; fallbackY = y; }
          if (v < BLANK_THRESHOLD) {
            if (runStart === -1) runStart = y;
            runLen++;
          } else if (runStart !== -1) {
            if (runLen > bestRunLen) { bestRunLen = runLen; bestRunStart = runStart; }
            runStart = -1;
            runLen = 0;
          }
        }
        if (runStart !== -1 && runLen > bestRunLen) { bestRunLen = runLen; bestRunStart = runStart; }

        // A run of several consecutive blank rows is real inter-entry margin;
        // cut at its midpoint. Otherwise fall back to the single calmest row.
        if (bestRunLen >= 4) return bestRunStart - Math.floor(bestRunLen / 2);
        return fallbackY;
      };

      const cuts: number[] = [0];
      let y = 0;
      let guard = 0;
      while (y < canvas.height) {
        // Safety net only — each iteration advances by at least ~75% of a
        // page (see findSafeCut), so this should never actually trip.
        if (++guard > 1000) break;
        const idealNext = y + pageHeightPx;
        if (idealNext >= canvas.height) { cuts.push(canvas.height); break; }
        const safeNext = findSafeCut(idealNext);
        cuts.push(safeNext);
        y = safeNext;
      }

      for (let i = 0; i < cuts.length - 1; i++) {
        const sliceTop = cuts[i];
        const sliceHeight = cuts[i + 1] - sliceTop;
        if (sliceHeight <= 0) continue;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        sliceCanvas.getContext("2d")?.drawImage(canvas, 0, sliceTop, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const sliceDataUrl = sliceCanvas.toDataURL("image/jpeg", 0.95);
        const sliceMmHeight = sliceHeight / pxPerMm;

        if (i > 0) pdf.addPage();
        pdf.addImage(sliceDataUrl, "JPEG", 0, 0, pdfWidth, sliceMmHeight);
      }

      const fileName = resumeDetail?.resume?.resumeName?.replace(/\s+/g, "_") || "Resume";
      pdf.save(`${fileName}_Resume.pdf`);
      toast({ title: "PDF downloaded successfully!" });
    } catch (err) {
      toast({ title: "PDF export failed", description: "Please try again.", variant: "destructive" });
    } finally {
      el.style.width = prevWidth;
      el.style.maxWidth = prevMaxWidth;
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!requirePremium("Word export")) return;
    try {
      // Pass the selected paper size as a query param so the backend sets the
      // correct page dimensions in the Word document (A4 vs US Letter).
      // Use the generated URL helper so the /api prefix is always correct,
      // then append the paperSize param.
      const token = getToken();
      const apiBase = import.meta.env.DEV ? "http://localhost:8080" : "";
      const docxUrl = `${apiBase}${getExportResumeDocxUrl(resumeId)}?paperSize=${paperSize}`;
      const resp = await fetch(docxUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error(await resp.text());
      const result: { docxBase64: string; filename: string } = await resp.json();
      const byteChars = atob(result.docxBase64);
      const byteNums = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteNums], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Word document downloaded!" });
    } catch {
      toast({ title: "DOCX export failed", variant: "destructive" });
    }
  };

  const handleDownloadHtml = async () => {
    try {
      const { data: result } = await refetchHtml();
      if (!result) return;
      const byteChars = atob(result.pdfBase64);
      const byteNums = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteNums], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "HTML downloaded!", description: "Open in browser and press Ctrl+P to print as PDF." });
    } catch {
      toast({ title: "HTML export failed", variant: "destructive" });
    }
  };

  const isAnyDownloading = isDownloadingPdf || isExportingDocx || isExportingHtml;

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
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Template:</span>
              <Select value={String(templateId)} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-40 h-8 text-xs" data-testid="select-preview-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(templates && templates.length > 0 ? templates : [
                    { id: 1, templateName: "Minimal ATS Resume" }, { id: 2, templateName: "Corporate Resume" },
                    { id: 3, templateName: "Creative Designer Resume" }, { id: 4, templateName: "Executive Resume" },
                    { id: 5, templateName: "Developer Resume" }, { id: 6, templateName: "Modern Gradient Resume" },
                    { id: 7, templateName: "Dark Theme Resume" }, { id: 8, templateName: "Infographic Resume" },
                    { id: 9, templateName: "Elegant Professional" }, { id: 10, templateName: "Startup Founder Resume" },
                  ]).map(t => {
                    const locked = !isPremiumUser && isTemplatePremium(t.id);
                    return (
                      <SelectItem key={t.id} value={String(t.id)}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TEMPLATE_COLORS[t.id] || "#111" }} />
                          {t.templateName}
                          {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Download dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={isAnyDownloading} data-testid="button-download">
                  {isAnyDownloading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Download className="w-4 h-4 mr-1" />Download<ChevronDown className="w-3 h-3 ml-1" /></>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Paper size selector */}
                <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground py-1.5">
                  <LayoutTemplate className="w-3 h-3" /> Page Size
                </DropdownMenuLabel>
                <div className="flex gap-1 px-2 pb-2">
                  {(["a4", "letter"] as const).map(sz => (
                    <button
                      key={sz}
                      onClick={() => setPaperSize(sz)}
                      className={`flex-1 text-xs py-1 rounded border transition-colors font-medium ${paperSize === sz ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    >
                      {sz === "a4" ? "A4" : "Letter"}
                    </button>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadPdf} className="gap-3 cursor-pointer">
                  <div className="w-7 h-7 bg-red-50 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      PDF Document
                      {!isPremiumUser && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-yellow-700 border-yellow-300 bg-yellow-50">PRO</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">High-quality .pdf · {paperSize.toUpperCase()}</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadDocx} className="gap-3 cursor-pointer">
                  <div className="w-7 h-7 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      Word Document
                      {!isPremiumUser && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-yellow-700 border-yellow-300 bg-yellow-50">PRO</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">Editable .docx · {paperSize.toUpperCase()}</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadHtml} className="gap-3 cursor-pointer">
                  <div className="w-7 h-7 bg-gray-50 rounded flex items-center justify-center flex-shrink-0">
                    <FileCode className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">HTML File</div>
                    <div className="text-xs text-muted-foreground">Open in browser → Print</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground">Template Gallery</p>
                {!isPremiumUser && (
                  <Link href="/upgrade" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3" />Unlock all 10
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ALL_TEMPLATE_IDS.map(tid => (
                  <GalleryThumb
                    key={tid}
                    tid={tid}
                    data={data}
                    resumeName={resume.resumeName}
                    active={tid === templateId}
                    locked={!isPremiumUser && isTemplatePremium(tid)}
                    onClick={() => handleTemplateChange(String(tid))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font picker */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground">Font Style</p>
                </div>
                {!isPremiumUser && (
                  <Link href="/upgrade" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3" />Unlock all
                  </Link>
                )}
              </div>
              <div className="space-y-1">
                {FONT_OPTIONS.map(f => {
                  const locked = !isPremiumUser && isFontPremium(f.value);
                  return (
                    <button
                      key={f.value}
                      onClick={() => handleFontChange(f.value)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-sm transition-all border flex items-center justify-between ${
                        fontFamily === f.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-transparent hover:bg-muted text-foreground"
                      }`}
                      style={{ fontFamily: f.style }}
                      data-testid={`font-pick-${f.value}`}
                    >
                      <span>{f.label}</span>
                      {locked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sections completed */}
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
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40" />}
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
