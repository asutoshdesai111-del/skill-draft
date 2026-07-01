import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, FileText, Download, Eye, Star, Zap, Shield, Users } from "lucide-react";
import ResumePreview from "@/components/resume-preview";

const RESUME_WIDTH = 794;

const FEATURES = [
  { icon: FileText, title: "8-Step Guided Wizard", desc: "Step-by-step form covering every section of a professional resume." },
  { icon: Eye, title: "Live Preview", desc: "See your resume update in real-time as you type." },
  { icon: Download, title: "PDF Export", desc: "Download a print-ready, professional PDF in seconds." },
  { icon: Star, title: "5 Beautiful Templates", desc: "Modern, Minimalist, Creative, Corporate, and Technical." },
  { icon: Zap, title: "ATS Score Checker", desc: "Know how well your resume performs with applicant tracking systems." },
  { icon: Shield, title: "Secure & Private", desc: "Your data is protected. Share only when you're ready." },
];

const TEMPLATES = [
  { id: 6, name: "Modern", desc: "Clean gradient accent — ideal for IT roles" },
  { id: 1, name: "Minimalist", desc: "Black & white — ATS optimized" },
  { id: 3, name: "Creative", desc: "Colorful — for design/marketing roles" },
  { id: 2, name: "Corporate", desc: "Formal — for finance/business roles" },
  { id: 5, name: "Technical", desc: "Code-style — for CS freshers" },
];

const SAMPLE_RESUME = {
  personalInfo: {
    id: 1, resumeId: 1,
    fullName: "Aarav Sharma",
    email: "aarav.sharma@email.com",
    phone: "+91 98765 43210",
    linkedin: "linkedin.com/in/aaravsharma",
    portfolio: "aaravsharma.dev",
    address: "Bengaluru, India",
  },
  objective: {
    id: 1, resumeId: 1,
    summaryText: "Motivated Computer Science graduate seeking an entry-level software engineering role to apply strong problem-solving and full-stack development skills.",
  },
  education: [
    { id: 1, resumeId: 1, institution: "Indian Institute of Technology", degree: "B.Tech", fieldOfStudy: "Computer Science", graduationYear: 2026, cgpa: "8.7" },
  ],
  skills: [
    { id: 1, resumeId: 1, skillName: "JavaScript", proficiencyLevel: "Advanced" as const },
    { id: 2, resumeId: 1, skillName: "React", proficiencyLevel: "Advanced" as const },
    { id: 3, resumeId: 1, skillName: "Python", proficiencyLevel: "Intermediate" as const },
    { id: 4, resumeId: 1, skillName: "SQL", proficiencyLevel: "Intermediate" as const },
  ],
  projects: [
    { id: 1, resumeId: 1, projectTitle: "Smart Attendance System", description: "Built a facial-recognition attendance app used by 500+ students across campus.", technologies: "Python, OpenCV, Flask", projectLink: "github.com/aarav/attendance", role: "Lead Developer" },
  ],
  experience: [
    { id: 1, resumeId: 1, company: "TechNova Labs", position: "Software Engineering Intern", startDate: "May 2025", endDate: "Jul 2025", isCurrent: false, responsibilities: "Built and shipped internal tooling used by 3 product teams." },
  ],
  certifications: [
    { id: 1, resumeId: 1, certName: "AWS Certified Cloud Practitioner", issuingOrg: "Amazon Web Services", dateIssued: "2025", description: null },
  ],
  languages: [
    { id: 1, resumeId: 1, languageName: "English", proficiency: "Fluent" as const },
  ],
};

function TemplateThumb({ id }: { id: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / RESUME_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="aspect-[4/5] bg-white overflow-hidden relative">
      {scale > 0 && (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: RESUME_WIDTH, transform: `scale(${scale})`, pointerEvents: "none" }}
          aria-hidden="true"
        >
          <ResumePreview data={SAMPLE_RESUME} templateId={id} resumeName="Aarav Sharma" />
        </div>
      )}
    </div>
  );
}

const TIPS = [
  "Keep your resume to 1 page for freshers",
  "Use action verbs to describe projects and responsibilities",
  "Include your CGPA if it's above 7.0 or 70%",
  "Always tailor your objective to the job you're applying for",
  "List your most impressive projects with links to GitHub",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground text-sm">SkillDraft</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/login">Sign In</Link></Button>
            <Button size="sm" asChild><Link href="/register">Get Started</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 text-white py-24 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-16 left-1/4 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
          <div className="absolute bottom-8 right-1/4 w-64 h-64 bg-teal-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-blue-800 text-blue-200 border-blue-700 hover:bg-blue-800">
            Free for all freshers
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Create Professional Resumes<br />in Minutes
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
            Perfect for fresh graduates and entry-level job seekers. Build ATS-friendly resumes with beautiful templates — no design skills needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50" asChild>
              <Link href="/register">Build My Resume</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-blue-400 text-white hover:bg-blue-800" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-300 pt-2">
            {["Free to use", "No credit card", "Instant download", "10 templates"].map(t => (
              <span key={t} className="flex items-center gap-1"><CheckCircle className="w-4 h-4" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">Everything you need to land your first job</h2>
          <p className="text-muted-foreground">Built specifically for students and recent graduates</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">5 Professional Templates</h2>
            <p className="text-muted-foreground">Switch between templates instantly — no re-entering data</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {TEMPLATES.map(({ id, name, desc }) => (
              <Card key={name} className="border overflow-hidden hover:shadow-md transition-shadow group">
                <TemplateThumb id={id} />
                <CardContent className="p-3">
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Quick Tips for Freshers</h2>
          <p className="text-muted-foreground">Maximize your chances with these resume best practices</p>
        </div>
        <div className="space-y-3">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-lg border">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <p className="text-sm text-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-accent text-white text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <Users className="w-10 h-10 mx-auto opacity-80" />
          <h2 className="text-2xl font-bold">Ready to build your resume?</h2>
          <p className="text-blue-100">Join thousands of freshers who have landed their first job.</p>
          <Button size="lg" className="bg-white text-primary hover:bg-blue-50" asChild>
            <Link href="/register">Create Free Resume</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-muted-foreground text-sm">
        <p>Made by Asutosh Desai — SkillDraft: Draft your skills into a Resume</p>
      </footer>
    </div>
  );
}
