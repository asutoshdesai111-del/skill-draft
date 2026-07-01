import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useListResumes, useGetResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, MessageSquare, Loader2, ChevronRight, Lightbulb, AlertCircle, Brain } from "lucide-react";
import { generateInterviewQuestions, type QuestionType, type InterviewQuestion, type Difficulty } from "@/lib/career-analyzer";
import { useToast } from "@/hooks/use-toast";

const TAB_CONFIG: { type: QuestionType; label: string; color: string }[] = [
  { type: "hr",         label: "HR",         color: "bg-blue-100 text-blue-800 border-blue-200" },
  { type: "technical",  label: "Technical",  color: "bg-purple-100 text-purple-800 border-purple-200" },
  { type: "project",    label: "Projects",   color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { type: "behavioral", label: "Behavioral", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { type: "scenario",   label: "Scenarios",  color: "bg-rose-100 text-rose-800 border-rose-200" },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard:   "bg-red-50 text-red-700 border-red-200",
};

function QuestionCard({ q }: { q: InterviewQuestion }) {
  const { toast } = useToast();
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <AccordionItem value={q.id} className="border-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline text-left">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</Badge>
              </div>
              <p className="text-sm font-semibold text-gray-900 leading-snug">{q.question}</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4 pt-1 ml-7">
            {/* Sample Answer */}
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-3">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1.5">Sample Answer</p>
              <p className="text-sm text-gray-800 leading-relaxed">{q.sampleAnswer}</p>
              <Button size="sm" variant="ghost" className="mt-2 text-xs text-blue-700 h-6 px-2"
                onClick={() => { navigator.clipboard.writeText(q.sampleAnswer); toast({ title: "Copied sample answer!" }); }}>
                Copy
              </Button>
            </div>

            {/* Key Points */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5" />Key Points to Cover</p>
              <ul className="space-y-1">
                {q.keyPoints.map((kp, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>{kp}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 rounded-lg border border-amber-100 p-3">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" />Tip</p>
              <p className="text-xs text-gray-700">{q.tips}</p>
            </div>

            {/* Common Mistakes */}
            <div className="bg-red-50 rounded-lg border border-red-100 p-3">
              <p className="text-xs font-semibold text-red-700 uppercase mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Common Mistake</p>
              <p className="text-xs text-gray-700">{q.commonMistakes}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Card>
  );
}

export default function InterviewPrep() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const { data: resumes } = useListResumes();
  const [selectedId, setSelectedId] = useState(0);
  const [activeTab, setActiveTab] = useState<QuestionType>("hr");
  const effectiveId = selectedId || resumes?.[0]?.id || 0;
  const { data: resumeData, isLoading: resumeLoading } = useGetResume(effectiveId, { query: { queryKey: getGetResumeQueryKey(effectiveId), enabled: effectiveId > 0 } });

  const questions = useMemo(() => resumeData ? generateInterviewQuestions(resumeData) : null, [resumeData]);

  if (meLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!me) { queueMicrotask(() => setLocation("/login")); return null; }

  const activeList = questions?.[activeTab] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/career")}><ArrowLeft className="w-4 h-4 mr-1" />Career Tools</Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-teal-500" />Interview Preparation</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(effectiveId)} onValueChange={v => setSelectedId(Number(v))}>
            <SelectTrigger className="w-56 h-8 text-sm bg-white"><SelectValue placeholder="Select resume…" /></SelectTrigger>
            <SelectContent>{(resumes || []).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.resumeName}</SelectItem>)}</SelectContent>
          </Select>
          {questions && (
            <Button size="sm" variant="outline" className="ml-auto text-xs gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
              onClick={() => setLocation("/career/mock-interview")}>
              <Brain className="w-3.5 h-3.5" />Practice Mock Interview
            </Button>
          )}
        </div>

        {effectiveId === 0 ? (
          <div className="text-center py-20 text-gray-400"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No resumes found.</p></div>
        ) : resumeLoading || !questions ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <>
            {/* Category tabs */}
            <Card className="shadow-sm">
              <CardContent className="p-2 flex flex-wrap gap-1.5">
                {TAB_CONFIG.map(tab => (
                  <button key={tab.type} onClick={() => setActiveTab(tab.type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.type ? tab.color + " shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
                    {tab.label}
                    <span className="bg-white/60 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                      {questions[tab.type].length}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Question list */}
            {activeList.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center text-gray-400">
                  <p className="text-sm">No {activeTab} questions available — add more content to your resume to generate personalized questions.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                <CardHeader className="px-0 pb-3">
                  <CardTitle className="text-xs font-semibold text-gray-500 uppercase">
                    {activeList.length} Question{activeList.length !== 1 ? "s" : ""} — click to expand
                  </CardTitle>
                </CardHeader>
                <Accordion type="multiple" className="space-y-3">
                  {activeList.map(q => <QuestionCard key={q.id} q={q} />)}
                </Accordion>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
