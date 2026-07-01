import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useListResumes, useGetResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BarChart3, Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles } from "lucide-react";
import { computeAnalytics } from "@/lib/career-analyzer";

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 32, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-gray-900">{score}</span>
          <span className="text-[10px] text-gray-400">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
    </div>
  );
}

function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function CareerPageShell({ title, icon: Icon, iconColor, resumeId, setResumeId, resumes, children }: {
  title: string; icon: React.ElementType; iconColor: string; resumeId: number; setResumeId: (id: number) => void;
  resumes: { id: number; resumeName: string }[] | undefined; children: React.ReactNode;
}) {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/career")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Career Tools
          </Button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="font-semibold text-sm flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />{title}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Analysing resume:</span>
          <Select value={String(resumeId)} onValueChange={(v) => setResumeId(Number(v))}>
            <SelectTrigger className="w-60 h-8 text-sm bg-white">
              <SelectValue placeholder="Select a resume…" />
            </SelectTrigger>
            <SelectContent>
              {(resumes || []).map(r => (
                <SelectItem key={r.id} value={String(r.id)}>{r.resumeName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12 pt-4">{children}</div>
    </div>
  );
}

export default function Analytics() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const { data: resumes } = useListResumes();
  const [selectedId, setSelectedId] = useState(0);
  const effectiveId = selectedId || resumes?.[0]?.id || 0;
  const { data: resumeData, isLoading: resumeLoading } = useGetResume(effectiveId, { query: { queryKey: getGetResumeQueryKey(effectiveId), enabled: effectiveId > 0 } });

  const analytics = useMemo(() => resumeData ? computeAnalytics(resumeData) : null, [resumeData]);

  if (meLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!me) { queueMicrotask(() => setLocation("/login")); return null; }

  const scoreColor = (s: number) => s >= 70 ? "#16a34a" : s >= 40 ? "#d97706" : "#dc2626";

  return (
    <CareerPageShell title="Resume Analytics" icon={BarChart3} iconColor="text-blue-500"
      resumeId={effectiveId} setResumeId={setSelectedId} resumes={resumes}>

      {effectiveId === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No resumes found. Create one first.</p>
          <Button className="mt-4" onClick={() => setLocation("/dashboard")}>Go to Dashboard</Button>
        </div>
      ) : resumeLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !analytics ? (
        <div className="text-center py-16"><Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" /><p className="text-gray-400">Could not compute analytics.</p></div>
      ) : (
        <div className="space-y-6">
          {/* Score rings */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Overview Scores</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-4">
                <ScoreRing score={analytics.atsScore}              label="ATS Score"       color={scoreColor(analytics.atsScore)} />
                <ScoreRing score={analytics.strengthScore}         label="Strength"        color={scoreColor(analytics.strengthScore)} />
                <ScoreRing score={analytics.grammarScore}          label="Grammar"         color={scoreColor(analytics.grammarScore)} />
                <ScoreRing score={analytics.keywordScore}          label="Keywords"        color={scoreColor(analytics.keywordScore)} />
                <ScoreRing score={analytics.readabilityScore}      label="Readability"     color={scoreColor(analytics.readabilityScore)} />
                <ScoreRing score={analytics.formattingScore}       label="Formatting"      color={scoreColor(analytics.formattingScore)} />
                <ScoreRing score={analytics.professionalismScore}  label="Professionalism" color={scoreColor(analytics.professionalismScore)} />
                <ScoreRing score={analytics.completenessPercentage} label="Completeness"   color={scoreColor(analytics.completenessPercentage)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Progress bars */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Detailed Scores</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Bar value={analytics.skillsCoverage}      color="#6366f1" label="Skills Coverage" />
                <Bar value={analytics.experienceStrength}  color="#0d9488" label="Experience Strength" />
                <Bar value={analytics.educationCompleteness} color="#d97706" label="Education Completeness" />
                <Bar value={analytics.actionVerbPercentage} color="#16a34a" label="Action Verb Usage" />
                <Bar value={Math.max(0, 100 - analytics.passiveVoiceCount * 15)} color="#8b5cf6" label="Active Voice Score" />
              </CardContent>
            </Card>

            {/* Section status */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Section Completion</CardTitle></CardHeader>
              <CardContent className="space-y-2.5">
                {analytics.sectionStatus.map(sec => (
                  <div key={sec.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {sec.completed
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-gray-300" />}
                      <span className="text-sm text-gray-700">{sec.name}</span>
                    </div>
                    <Badge variant={sec.completed ? "outline" : "secondary"} className={`text-xs ${sec.completed ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "text-gray-400"}`}>
                      {sec.completed ? `${sec.score}%` : "Missing"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: "Word Count",       value: analytics.wordCount,           note: analytics.wordCount < 150 ? "Too short" : analytics.wordCount > 800 ? "Too long" : "Good" },
              { label: "Bullet Points",    value: analytics.bulletCount,         note: "" },
              { label: "Passive Voice",    value: analytics.passiveVoiceCount,   note: analytics.passiveVoiceCount > 3 ? "Reduce it" : "Good" },
              { label: "Reading Time",     value: `${analytics.estimatedReadingTime}m`, note: "" },
              { label: "Action Verbs %",   value: `${analytics.actionVerbPercentage}%`, note: "" },
              { label: "Sections Done",    value: `${analytics.sectionStatus.filter(s => s.completed).length}/8`, note: "" },
            ].map(m => (
              <Card key={m.label} className="shadow-sm">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{m.value}</div>
                  <div className="text-xs text-gray-500">{m.label}</div>
                  {m.note && <div className={`text-[10px] mt-0.5 font-medium ${m.note === "Good" ? "text-emerald-600" : "text-amber-600"}`}>{m.note}</div>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ATS verdict */}
          <Card className={`shadow-sm border-l-4 ${analytics.atsScore >= 70 ? "border-l-emerald-500 bg-emerald-50" : analytics.atsScore >= 40 ? "border-l-amber-500 bg-amber-50" : "border-l-red-500 bg-red-50"}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${analytics.atsScore >= 70 ? "text-emerald-600" : analytics.atsScore >= 40 ? "text-amber-600" : "text-red-600"}`} />
              <div>
                <p className="font-semibold text-sm">ATS Compatibility: {analytics.atsScore >= 70 ? "Likely to pass screening" : analytics.atsScore >= 40 ? "May be filtered out" : "High risk of rejection"}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {analytics.atsScore < 70 && "Complete missing sections, add more skills, and tailor your resume to each job description to improve your ATS score."}
                  {analytics.atsScore >= 70 && "Your resume has the key sections. Tailor keywords to each specific job description for best results."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </CareerPageShell>
  );
}
