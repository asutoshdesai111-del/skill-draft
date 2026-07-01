import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useListResumes, useGetResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Loader2, CheckCircle2, XCircle, BookOpen, Award, FolderOpen, Clock } from "lucide-react";
import { analyzeSkillGap } from "@/lib/career-analyzer";

const ROLES = ["Software Engineer","Frontend Developer","Backend Developer","Full Stack Developer","Data Scientist","Data Analyst","UI/UX Designer","DevOps Engineer","Mobile Developer","Business Analyst","Machine Learning Engineer"];
const LEVELS = ["Fresher (0–1 yr)", "Junior (1–3 yrs)", "Mid-level (3–5 yrs)", "Senior (5+ yrs)"];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-blue-100 text-blue-800 border-blue-200",
  Intermediate: "bg-amber-100 text-amber-800 border-amber-200",
  Advanced: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function SkillGap() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const { data: resumes } = useListResumes();
  const [selectedId, setSelectedId] = useState(0);
  const [role, setRole] = useState("Software Engineer");
  const [level, setLevel] = useState("Fresher (0–1 yr)");
  const effectiveId = selectedId || resumes?.[0]?.id || 0;
  const { data: resumeData, isLoading: resumeLoading } = useGetResume(effectiveId, { query: { queryKey: getGetResumeQueryKey(effectiveId), enabled: effectiveId > 0 } });

  const result = useMemo(() => resumeData ? analyzeSkillGap(resumeData, role, level) : null, [resumeData, role, level]);

  if (meLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!me) { queueMicrotask(() => setLocation("/login")); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/career")}><ArrowLeft className="w-4 h-4 mr-1" />Career Tools</Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-orange-500" />Skill Gap Analysis</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={String(effectiveId)} onValueChange={v => setSelectedId(Number(v))}>
            <SelectTrigger className="w-52 h-8 text-sm bg-white"><SelectValue placeholder="Resume…" /></SelectTrigger>
            <SelectContent>{(resumes || []).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.resumeName}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-52 h-8 text-sm bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-44 h-8 text-sm bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {effectiveId === 0 ? (
          <div className="text-center py-20 text-gray-400"><TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No resumes found.</p></div>
        ) : resumeLoading || !result ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-6">
            {/* Readiness score + estimate */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Career Readiness", value: `${result.careerReadinessScore}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Skills to Learn", value: result.missingSkills.length, icon: BookOpen, color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Est. Time", value: `${result.estimatedMonths}mo`, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "You Already Have", value: result.currentSkills.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <Card key={m.label} className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${m.color}`} />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-900">{m.value}</div>
                        <div className="text-xs text-gray-500">{m.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Readiness bar */}
            <Card className="shadow-sm">
              <CardContent className="pt-5 pb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-700">Career Readiness for <span className="text-blue-600">{role}</span></span>
                  <span className="font-bold text-gray-900">{result.careerReadinessScore}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${result.careerReadinessScore}%`, background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {result.careerReadinessScore >= 80 ? "You're well-prepared for this role!" : result.careerReadinessScore >= 50 ? "Good foundation — close the gaps below to become competitive." : "Several key skills are missing. Follow the roadmap below."}
                </p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Current vs Missing */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Skill Comparison</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">You Have</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.currentSkills.length === 0 ? <p className="text-xs text-gray-400">No skills listed yet</p> : result.currentSkills.map(s => (
                        <Badge key={s} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />{s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase mb-2">Missing for {role}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingSkills.length === 0 ? <p className="text-xs text-emerald-600 font-medium">All required skills present!</p> : result.missingSkills.map(s => (
                        <Badge key={s} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          <XCircle className="w-3 h-3 mr-1" />{s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended certs + projects */}
              <div className="space-y-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-yellow-600" />Recommended Certifications</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5">
                    {result.recommendedCerts.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-4 h-4 rounded-full bg-yellow-100 text-yellow-700 text-[10px] flex items-center justify-center font-bold">{i + 1}</span>{c}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-blue-600" />Suggested Projects</CardTitle></CardHeader>
                  <CardContent className="space-y-1.5">
                    {result.suggestedProjects.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>{p}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Learning Roadmap */}
            {result.roadmap.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-purple-600" />Learning Roadmap</CardTitle></CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
                    <div className="space-y-5">
                      {result.roadmap.map((item, i) => (
                        <div key={i} className="relative pl-12">
                          <div className="absolute left-3.5 top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
                            <span className="text-[9px] text-white font-bold">{i + 1}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-gray-900">{item.skill}</span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${LEVEL_COLORS[item.level]}`}>{item.level}</Badge>
                                <span className="text-xs text-gray-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{item.estimatedWeeks} weeks</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{item.resources}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />Estimated total learning time: <strong>{result.estimatedMonths} months</strong> (studying ~10–15 hours/week)
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
