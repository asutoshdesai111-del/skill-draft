import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useListResumes, useGetResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Loader2, CheckCircle2, XCircle, AlertCircle, Zap } from "lucide-react";
import { computeJobMatch } from "@/lib/career-analyzer";

function CircleScore({ score }: { score: number }) {
  const r = 56, circ = 2 * Math.PI * r;
  const color = score >= 70 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  const label = score >= 70 ? "Strong Match" : score >= 50 ? "Fair Match" : "Weak Match";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 136 136" className="w-36 h-36 -rotate-90">
          <circle cx="68" cy="68" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{score}%</span>
          <span className="text-xs text-gray-500">Match</span>
        </div>
      </div>
      <Badge className={`font-semibold ${score >= 70 ? "bg-emerald-100 text-emerald-800" : score >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{label}</Badge>
    </div>
  );
}

export default function JobMatch() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const { data: resumes } = useListResumes();
  const [selectedId, setSelectedId] = useState(0);
  const [jdText, setJdText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const effectiveId = selectedId || resumes?.[0]?.id || 0;
  const { data: resumeData, isLoading: resumeLoading } = useGetResume(effectiveId, { query: { queryKey: getGetResumeQueryKey(effectiveId), enabled: effectiveId > 0 } });

  const result = useMemo(() => {
    if (!submitted || !resumeData || !jdText.trim()) return null;
    return computeJobMatch(resumeData, jdText);
  }, [submitted, resumeData, jdText]);

  const handleAnalyse = () => {
    if (!jdText.trim()) return;
    setSubmitted(true);
  };

  const handleJdChange = (v: string) => { setJdText(v); setSubmitted(false); };

  if (meLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!me) { queueMicrotask(() => setLocation("/login")); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/career")}><ArrowLeft className="w-4 h-4 mr-1" />Career Tools</Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm flex items-center gap-1.5"><Search className="w-3.5 h-3.5 text-emerald-500" />Job Match Score</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Input row */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(effectiveId)} onValueChange={v => { setSelectedId(Number(v)); setSubmitted(false); }}>
            <SelectTrigger className="w-56 h-8 text-sm bg-white"><SelectValue placeholder="Select resume…" /></SelectTrigger>
            <SelectContent>{(resumes || []).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.resumeName}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* JD paste */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Paste Job Description</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Paste the full job description here — including requirements, responsibilities and tech stack…"
                value={jdText}
                onChange={e => handleJdChange(e.target.value)}
                className="min-h-56 resize-none text-sm"
              />
              <Button onClick={handleAnalyse} disabled={!jdText.trim() || !effectiveId || resumeLoading}
                className="w-full" style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
                <Zap className="w-4 h-4 mr-2" />Analyse Match
              </Button>
            </CardContent>
          </Card>

          {/* Score display */}
          <div className="space-y-4">
            {resumeLoading ? <Skeleton className="h-64 rounded-xl" /> : !result ? (
              <Card className="shadow-sm h-full flex items-center justify-center">
                <div className="text-center p-8 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Paste a job description and click Analyse Match</p>
                  <p className="text-sm mt-1">We'll compare your resume against the JD and give you a match score.</p>
                </div>
              </Card>
            ) : (
              <>
                <Card className="shadow-sm">
                  <CardContent className="pt-6 flex flex-col items-center gap-2">
                    <CircleScore score={result.score} />
                    <div className="w-full mt-2 space-y-1.5">
                      <div className="flex justify-between text-xs"><span className="text-gray-500">ATS Compatibility</span><span className="font-semibold">{result.atsCompatibility}%</span></div>
                      <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-full rounded-full bg-blue-400" style={{ width: `${result.atsCompatibility}%` }} /></div>
                    </div>
                  </CardContent>
                </Card>

                {/* ATS compat bar moved above, explanation below */}
                <Card className="shadow-sm">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Recruiter Insight</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Keyword analysis */}
        {result && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Matched Keywords</CardTitle></CardHeader>
              <CardContent>
                {result.matchedKeywords.length === 0 ? <p className="text-sm text-gray-400">No keywords matched.</p> : (
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.map(k => (
                      <Badge key={k} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />{k}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Missing Keywords</CardTitle></CardHeader>
              <CardContent>
                {result.missingKeywords.length === 0 ? <p className="text-sm text-emerald-600 font-medium">Great — no obvious missing keywords!</p> : (
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map(k => (
                      <Badge key={k} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        <XCircle className="w-3 h-3 mr-1" />{k}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Missing Technical Skills</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {result.missingTechSkills.length === 0 ? <p className="text-sm text-emerald-600 font-medium">Your tech stack matches well!</p> : result.missingTechSkills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-700">Improvement Checklist</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.suggestions.length === 0 ? <p className="text-sm text-emerald-600 font-medium">Looking strong!</p> : result.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{s}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
