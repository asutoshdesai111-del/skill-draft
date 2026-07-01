import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useListResumes, useGetResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Palette, Loader2, Star, Sparkles, ExternalLink } from "lucide-react";
import { recommendTheme, type ThemeRecommendation } from "@/lib/career-analyzer";

const TEMPLATE_COLORS: Record<number, string> = {
  1: "from-slate-400 to-slate-600",
  2: "from-blue-400 to-blue-700",
  3: "from-pink-400 to-rose-600",
  4: "from-amber-400 to-orange-600",
  5: "from-violet-400 to-purple-700",
  6: "from-cyan-400 to-teal-600",
  7: "from-gray-700 to-gray-900",
  8: "from-emerald-400 to-green-700",
  9: "from-indigo-400 to-indigo-700",
  10: "from-red-400 to-orange-600",
};

const INDUSTRY_LABELS: Record<string, string> = {
  tech: "Technology", design: "Design & Creative", data: "Data & Analytics",
  business: "Business & Finance", academic: "Academic & Research", healthcare: "Healthcare",
  startup: "Startup", engineering: "Engineering", marketing: "Marketing", general: "General",
};

function TemplateCard({ rec, resumeId }: { rec: ThemeRecommendation; resumeId: number }) {
  const [, setLocation] = useLocation();
  const gradient = TEMPLATE_COLORS[rec.templateId] || "from-gray-400 to-gray-600";

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-xl ${rec.isPrimary ? "ring-2 ring-blue-500 shadow-lg" : ""}`}>
      {rec.isPrimary && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-blue-600 text-white text-xs shadow-md"><Star className="w-3 h-3 mr-1 fill-current" />Best Match</Badge>
        </div>
      )}

      {/* Gradient preview */}
      <div className={`h-32 bg-gradient-to-br ${gradient} flex items-end p-3`}>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 w-full">
          <div className="h-2 bg-white/60 rounded mb-1.5 w-3/4" />
          <div className="h-1.5 bg-white/40 rounded mb-1 w-1/2" />
          <div className="h-1 bg-white/30 rounded w-2/3" />
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{rec.templateName}</h3>
            <div className="flex-shrink-0 text-right">
              <span className={`text-lg font-bold ${rec.confidence >= 80 ? "text-emerald-600" : rec.confidence >= 60 ? "text-amber-600" : "text-gray-600"}`}>{rec.confidence}%</span>
              <div className="text-[10px] text-gray-400 leading-none">match</div>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1 text-gray-500">{INDUSTRY_LABELS[rec.industry] || rec.industry}</Badge>
        </div>

        {/* Confidence bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${rec.confidence}%`, background: rec.isPrimary ? "linear-gradient(90deg,#3b82f6,#06b6d4)" : "#9ca3af" }} />
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">{rec.reason}</p>

        <Button size="sm" variant={rec.isPrimary ? "default" : "outline"} className="w-full text-xs gap-1.5"
          onClick={() => resumeId > 0 && setLocation(`/builder/${resumeId}`)}>
          <ExternalLink className="w-3 h-3" />
          {rec.isPrimary ? "Apply in Builder" : "Open Builder"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ThemeRecommend() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const { data: resumes } = useListResumes();
  const [selectedId, setSelectedId] = useState(0);
  const effectiveId = selectedId || resumes?.[0]?.id || 0;
  const { data: resumeData, isLoading: resumeLoading } = useGetResume(effectiveId, { query: { queryKey: getGetResumeQueryKey(effectiveId), enabled: effectiveId > 0 } });

  const recommendations = useMemo<ThemeRecommendation[]>(() => resumeData ? recommendTheme(resumeData) : [], [resumeData]);

  if (meLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!me) { queueMicrotask(() => setLocation("/login")); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/career")}><ArrowLeft className="w-4 h-4 mr-1" />Career Tools</Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm flex items-center gap-1.5"><Palette className="w-3.5 h-3.5 text-pink-500" />Theme Recommendation</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(effectiveId)} onValueChange={v => setSelectedId(Number(v))}>
            <SelectTrigger className="w-56 h-8 text-sm bg-white"><SelectValue placeholder="Select resume…" /></SelectTrigger>
            <SelectContent>{(resumes || []).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.resumeName}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {effectiveId === 0 ? (
          <div className="text-center py-20 text-gray-400"><Palette className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No resumes found.</p></div>
        ) : resumeLoading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-gray-600">Based on your resume content and industry, we recommend these templates — ranked by compatibility.</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
              {recommendations.map(rec => <TemplateCard key={rec.templateId} rec={rec} resumeId={effectiveId} />)}
            </div>
            <div className="text-center text-xs text-gray-400 pt-2">
              <Palette className="w-3.5 h-3.5 inline mr-1" />Click "Apply in Builder" to open your resume and change the template there.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
