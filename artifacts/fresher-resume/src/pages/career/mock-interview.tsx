import { useMemo, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useGetMe, useListResumes, useGetResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Brain, Loader2, CheckCircle2, AlertCircle, MessageSquare,
  ChevronRight, RotateCcw, Trophy, TrendingUp, Lightbulb, User
} from "lucide-react";
import {
  generateInterviewQuestions, evaluateMockAnswer, computeInterviewReport,
  type InterviewQuestion, type AnswerEvaluation, type InterviewReport, type QuestionType,
} from "@/lib/career-analyzer";

type Phase = "setup" | "active" | "complete";

const TYPE_LABELS: Record<QuestionType, string> = {
  hr: "HR", technical: "Technical", project: "Project", behavioral: "Behavioral", scenario: "Scenario",
};

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 75 ? "bg-emerald-100 text-emerald-800" : score >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>{score}%</span>;
}

function SetupPhase({ resumeId, setResumeId, resumes, questions, onStart }: {
  resumeId: number;
  setResumeId: (id: number) => void;
  resumes: { id: number; resumeName: string }[] | undefined;
  questions: Record<QuestionType, InterviewQuestion[]> | null;
  onStart: (selected: InterviewQuestion[]) => void;
}) {
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(new Set(["hr", "technical"]));
  const [count, setCount] = useState("5");

  const toggleType = (t: QuestionType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); } else next.add(t);
      return next;
    });
  };

  const handleStart = () => {
    if (!questions) return;
    const pool: InterviewQuestion[] = [];
    for (const t of Array.from(selectedTypes)) pool.push(...(questions[t] || []));
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, Number(count));
    onStart(shuffled);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base font-semibold">Configure Your Mock Interview</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Resume</p>
            <Select value={String(resumeId)} onValueChange={v => setResumeId(Number(v))}>
              <SelectTrigger className="h-8 text-sm bg-white"><SelectValue placeholder="Select resume…" /></SelectTrigger>
              <SelectContent>{(resumes || []).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.resumeName}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Question Categories</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_LABELS) as QuestionType[]).map(t => (
                <button key={t} onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTypes.has(t) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                  {TYPE_LABELS[t]} ({questions?.[t]?.length ?? 0})
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Number of Questions</p>
            <div className="flex gap-2">
              {["3", "5", "8", "10"].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${count === n ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full gap-2" style={{ background: "linear-gradient(135deg,#1e40af,#0d9488)" }}
            disabled={!questions || resumeId === 0}
            onClick={handleStart}>
            <Brain className="w-4 h-4" />Start Interview ({count} questions)
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: MessageSquare, label: "Real Questions", desc: "Tailored to your resume" },
          { icon: Lightbulb, label: "Instant Feedback", desc: "Score and suggestions" },
          { icon: Trophy, label: "Full Report", desc: "Hiring readiness rating" },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="shadow-sm p-4">
              <Icon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-xs font-semibold text-gray-800">{item.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ActivePhase({ questions, onComplete }: { questions: InterviewQuestion[]; onComplete: (evals: AnswerEvaluation[]) => void }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [evaluations, setEvaluations] = useState<AnswerEvaluation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const current = questions[index];
  const progress = ((index) / questions.length) * 100;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      const eval_ = evaluateMockAnswer(current.question, answer, current.sampleAnswer, current.keyPoints);
      setEvaluation(eval_);
      setEvaluations(prev => [...prev, eval_]);
      setSubmitting(false);
    }, 600);
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      onComplete([...evaluations]);
    } else {
      setIndex(i => i + 1);
      setAnswer("");
      setEvaluation(null);
      textRef.current?.focus();
    }
  };

  const isLast = index + 1 >= questions.length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-4">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Question {index + 1} of {questions.length}</span>
          <Badge variant="outline" className="text-[10px] capitalize">{current.type} · {current.difficulty}</Badge>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 bg-blue-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <Card className="shadow-sm border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-base font-semibold text-gray-900 leading-snug">{current.question}</p>
          </div>
        </CardContent>
      </Card>

      {/* Answer area */}
      {!evaluation ? (
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Your Answer</span>
            </div>
            <Textarea
              ref={textRef}
              placeholder="Type your answer here. Be specific, use examples, and include numbers where possible…"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="min-h-40 resize-none text-sm"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">{answer.split(/\s+/).filter(Boolean).length} words</span>
              <Button onClick={handleSubmit} disabled={!answer.trim() || submitting} className="gap-2"
                style={{ background: "linear-gradient(135deg,#1e40af,#0d9488)" }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                {submitting ? "Evaluating…" : "Submit Answer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Scores */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Overall", score: evaluation.answerScore },
              { label: "Communication", score: evaluation.communicationScore },
              { label: "Technical", score: evaluation.technicalScore },
              { label: "Confidence", score: evaluation.confidenceScore },
            ].map(s => (
              <Card key={s.label} className="shadow-sm">
                <CardContent className="p-3 text-center">
                  <ScoreBadge score={s.score} />
                  <div className="text-[10px] text-gray-500 mt-1">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Your answer recap */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1"><User className="w-3 h-3" />Your Answer</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{answer}</p>
            </CardContent>
          </Card>

          {/* Suggestions */}
          {evaluation.suggestions.length > 0 && (
            <Card className="shadow-sm border-l-4 border-l-amber-400">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" />Improve your answer</p>
                <ul className="space-y-1.5">
                  {evaluation.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sample answer */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Sample Answer</p>
              <p className="text-sm text-gray-700 leading-relaxed">{evaluation.betterAnswer}</p>
            </CardContent>
          </Card>

          <Button className="w-full gap-2" style={{ background: "linear-gradient(135deg,#1e40af,#0d9488)" }} onClick={handleNext}>
            {isLast ? <><Trophy className="w-4 h-4" />Finish & See Report</> : <><ChevronRight className="w-4 h-4" />Next Question</>}
          </Button>
        </div>
      )}
    </div>
  );
}

function CompletePhase({ report, questions, onRestart }: { report: InterviewReport; questions: InterviewQuestion[]; onRestart: () => void }) {
  const readinessColors: Record<string, string> = {
    "Strong Hire": "text-emerald-600 bg-emerald-50",
    "Hire": "text-blue-600 bg-blue-50",
    "Maybe": "text-amber-600 bg-amber-50",
    "Not Ready Yet": "text-red-600 bg-red-50",
    "Incomplete": "text-gray-600 bg-gray-50",
  };
  const cls = readinessColors[report.hiringReadiness] || "text-gray-600 bg-gray-50";

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4">
      {/* Header */}
      <Card className="shadow-sm text-center">
        <CardContent className="p-6">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Interview Complete!</h2>
          <div className="text-5xl font-bold text-blue-600 mb-1">{report.overallScore}%</div>
          <div className="text-sm text-gray-500 mb-3">Overall Score</div>
          <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold ${cls}`}>
            <TrendingUp className="w-4 h-4" />{report.hiringReadiness}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-emerald-700 uppercase mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Strengths</p>
            {report.strengths.map((s, i) => <p key={i} className="text-xs text-gray-700 py-0.5">• {s}</p>)}
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-red-700 uppercase mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Areas to Improve</p>
            {report.weaknesses.map((w, i) => <p key={i} className="text-xs text-gray-700 py-0.5">• {w}</p>)}
          </CardContent>
        </Card>
      </div>

      {/* Per-question scores */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Question-by-Question Results</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {report.questionResults.map((qr, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 truncate flex-1 mr-3" title={qr.question}>{i + 1}. {qr.question.length > 70 ? qr.question.slice(0, 70) + "…" : qr.question}</span>
                <ScoreBadge score={qr.score} />
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${qr.score}%`, backgroundColor: qr.score >= 75 ? "#16a34a" : qr.score >= 50 ? "#d97706" : "#dc2626" }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Suggested topics */}
      {report.suggestedTopics.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-purple-700 uppercase mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" />Topics to Revise</p>
            {report.suggestedTopics.map((t, i) => <p key={i} className="text-xs text-gray-700 py-0.5">• {t}</p>)}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="w-full gap-2" onClick={onRestart}>
        <RotateCcw className="w-4 h-4" />Try Again
      </Button>
    </div>
  );
}

export default function MockInterview() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const { data: resumes } = useListResumes();
  const [selectedId, setSelectedId] = useState(0);
  const effectiveId = selectedId || resumes?.[0]?.id || 0;
  const { data: resumeData, isLoading: resumeLoading } = useGetResume(effectiveId, { query: { queryKey: getGetResumeQueryKey(effectiveId), enabled: effectiveId > 0 } });

  const [phase, setPhase] = useState<Phase>("setup");
  const [activeQuestions, setActiveQuestions] = useState<InterviewQuestion[]>([]);
  const [report, setReport] = useState<InterviewReport | null>(null);

  const questions = useMemo(() => resumeData ? generateInterviewQuestions(resumeData) : null, [resumeData]);

  const handleStart = (selected: InterviewQuestion[]) => {
    setActiveQuestions(selected);
    setPhase("active");
  };

  const handleComplete = (evals: AnswerEvaluation[]) => {
    const r = computeInterviewReport(evals, activeQuestions);
    setReport(r);
    setPhase("complete");
  };

  const handleRestart = () => {
    setPhase("setup");
    setActiveQuestions([]);
    setReport(null);
  };

  if (meLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!me) { queueMicrotask(() => setLocation("/login")); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={phase !== "setup" ? handleRestart : () => setLocation("/career")}>
            <ArrowLeft className="w-4 h-4 mr-1" />{phase !== "setup" ? "Restart" : "Career Tools"}
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm flex items-center gap-1.5"><Brain className="w-3.5 h-3.5 text-red-500" />Mock Interview</span>
          {phase === "active" && (
            <Badge variant="outline" className="ml-auto text-xs border-red-200 text-red-600 bg-red-50">
              Live Session
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {effectiveId === 0 && phase === "setup" ? (
          <div className="text-center py-20 text-gray-400"><Brain className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No resumes found.</p></div>
        ) : resumeLoading && phase === "setup" ? (
          <div className="max-w-2xl mx-auto py-6 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : phase === "setup" ? (
          <SetupPhase resumeId={effectiveId} setResumeId={setSelectedId} resumes={resumes} questions={questions} onStart={handleStart} />
        ) : phase === "active" ? (
          <ActivePhase questions={activeQuestions} onComplete={handleComplete} />
        ) : report ? (
          <CompletePhase report={report} questions={activeQuestions} onRestart={handleRestart} />
        ) : null}
      </div>
    </div>
  );
}
