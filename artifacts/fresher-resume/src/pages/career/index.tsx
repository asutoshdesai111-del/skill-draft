import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, FileText, BarChart3, Search, TrendingUp, Palette, MessageSquare, Brain, Sparkles } from "lucide-react";

const TOOLS = [
  { href: "/career/analytics",      icon: BarChart3,      label: "Resume Analytics",       desc: "Real-time scores for ATS, grammar, readability, formatting and 12+ other metrics.", color: "bg-blue-500",   badge: "Popular" },
  { href: "/career/review",         icon: Sparkles,        label: "AI Resume Review",        desc: "Detailed improvement suggestions with severity levels, action verb analysis and ATS tips.", color: "bg-purple-500", badge: "AI-Powered" },
  { href: "/career/job-match",      icon: Search,          label: "Job Match Score",         desc: "Paste a job description and get a 0–100% match score with keyword analysis.", color: "bg-emerald-500", badge: "Must Try" },
  { href: "/career/skill-gap",      icon: TrendingUp,      label: "Skill Gap Analysis",      desc: "Identify missing skills for your target role and get a personalized learning roadmap.", color: "bg-orange-500", badge: null },
  { href: "/career/theme",          icon: Palette,         label: "Theme Recommendation",    desc: "AI recommends the best resume template based on your industry and experience.", color: "bg-pink-500",   badge: null },
  { href: "/career/interview-prep", icon: MessageSquare,   label: "Interview Preparation",   desc: "Tailored HR, technical, project, behavioral and scenario questions from your resume.", color: "bg-teal-500",  badge: null },
  { href: "/career/mock-interview", icon: Brain,           label: "Mock Interview",          desc: "Practice live Q&A, get answer evaluations, and receive a full interview report.", color: "bg-red-500",   badge: "Interactive" },
];

export default function CareerHub() {
  const { data: me, isLoading } = useGetMe();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!me) { queueMicrotask(() => setLocation("/login")); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</a>
          </Button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="font-semibold text-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />Career Tools
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />AI-Powered Career Tools
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your complete career toolkit
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Analyse your resume, match it to jobs, identify skill gaps, prepare for interviews
            and land your dream role — all in one place.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            return (
              <Card key={tool.href} className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200 overflow-hidden"
                onClick={() => setLocation(tool.href)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {tool.badge && (
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">{tool.badge}</Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{tool.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{tool.desc}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                    <span>Open tool</span>
                    <ArrowLeft className="w-4 h-4 rotate-180 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info footer */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <FileText className="w-4 h-4 inline mr-1" />
          All tools analyse the resume data stored in your account — no re-upload needed.
        </div>
      </div>
    </div>
  );
}
