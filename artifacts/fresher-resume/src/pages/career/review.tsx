import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useListResumes, useGetResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Sparkles, Loader2, Copy, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { analyzeResume, type ResumeSuggestion, type Severity } from "@/lib/career-analyzer";
import { useToast } from "@/hooks/use-toast";

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  high:   { label: "High Priority",   color: "text-red-700",    bg: "bg-red-50 border-red-200",    icon: AlertTriangle },
  medium: { label: "Medium Priority", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200", icon: AlertCircle },
  low:    { label: "Low Priority",    color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   icon: Info },
};

const TYPE_LABELS: Record<ResumeSuggestion["type"], string> = {
  "grammar": "Grammar", "content": "Content", "structure": "Structure",
  "keywords": "Keywords", "metrics": "Metrics", "action-verbs": "Action Verbs", "ats": "ATS",
};

function SuggestionCard({ sug }: { sug: ResumeSuggestion }) {
  const { toast } = useToast();
  const cfg = SEVERITY_CONFIG[sug.severity];
  const Icon = cfg.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(sug.suggestion).then(() => toast({ title: "Copied!" }));
  };

  return (
    <Card className={`border ${cfg.bg}`}>
      <AccordionItem value={sug.id} className="border-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm text-gray-900">{sug.title}</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.color} border-current`}>{cfg.label}</Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{TYPE_LABELS[sug.type]}</Badge>
              </div>
              <span className="text-xs text-gray-500">{sug.field}</span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-3 pt-1">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Issue</p>
              <p className="text-sm text-gray-700">{sug.description}</p>
            </div>
            <div className="bg-white rounded-lg border p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Suggested Improvement</p>
              <p className="text-sm text-gray-800 leading-relaxed">{sug.suggestion}</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs gap-1.5">
              <Copy className="w-3.5 h-3.5" />Copy Suggestion
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Card>
  );
}

export default function ResumeReview() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const { data: resumes } = useListResumes();
  const [selectedId, setSelectedId] = useState(0);
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const effectiveId = selectedId || resumes?.[0]?.id || 0;
  const { data: resumeData, isLoading } = useGetResume(effectiveId, { query: { queryKey: getGetResumeQueryKey(effectiveId), enabled: effectiveId > 0 } });

  const suggestions = useMemo(() => resumeData ? analyzeResume(resumeData) : [], [resumeData]);
  const filtered = filterSeverity === "all" ? suggestions : suggestions.filter(s => s.severity === filterSeverity);
  const counts = { high: suggestions.filter(s => s.severity === "high").length, medium: suggestions.filter(s => s.severity === "medium").length, low: suggestions.filter(s => s.severity === "low").length };

  if (meLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!me) { queueMicrotask(() => setLocation("/login")); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/career")}><ArrowLeft className="w-4 h-4 mr-1" />Career Tools</Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-500" />AI Resume Review</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(effectiveId)} onValueChange={v => setSelectedId(Number(v))}>
            <SelectTrigger className="w-56 h-8 text-sm bg-white"><SelectValue placeholder="Select resume…" /></SelectTrigger>
            <SelectContent>{(resumes || []).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.resumeName}</SelectItem>)}</SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {(["all", "high", "medium", "low"] as const).map(s => (
              <button key={s} onClick={() => setFilterSeverity(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterSeverity === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                {s === "all" ? `All (${suggestions.length})` : s === "high" ? `High (${counts.high})` : s === "medium" ? `Medium (${counts.medium})` : `Low (${counts.low})`}
              </button>
            ))}
          </div>
        </div>

        {/* Summary strip */}
        {suggestions.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "High Priority", count: counts.high, color: "border-l-red-500 bg-red-50" },
              { label: "Medium Priority", count: counts.medium, color: "border-l-amber-500 bg-amber-50" },
              { label: "Low Priority", count: counts.low, color: "border-l-blue-500 bg-blue-50" },
            ].map(c => (
              <Card key={c.label} className={`border-l-4 shadow-sm ${c.color}`}>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{c.count}</div>
                  <div className="text-xs text-gray-500">{c.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {effectiveId === 0 ? (
          <div className="text-center py-20 text-gray-400"><Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No resumes found. Create one first.</p><Button className="mt-4" onClick={() => setLocation("/dashboard")}>Dashboard</Button></div>
        ) : isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p className="font-semibold text-gray-700">{suggestions.length === 0 ? "Complete your resume to get suggestions" : "No issues in this category!"}</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {filtered.map(sug => <SuggestionCard key={sug.id} sug={sug} />)}
          </Accordion>
        )}
      </div>
    </div>
  );
}
