import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useUpgradePlan } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, XCircle, Sparkles, FileText, Download, Zap, Shield,
  ArrowLeft, Loader2, CreditCard, Lock, Star, Crown, Wallet, Smartphone, QrCode
} from "lucide-react";
import ResumePreview from "@/components/resume-preview";
import { PREMIUM_TEMPLATE_IDS } from "@/lib/premium";

const RESUME_PREVIEW_WIDTH = 794;

const SHOWCASE_RESUME = {
  personalInfo: {
    id: 1, resumeId: 1,
    fullName: "Ashu Desai",
    email: "ashudesai1@gmail.com",
    phone: "9876543210",
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

function ShowcaseThumb({ templateId }: { templateId: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div ref={containerRef} className="aspect-[4/5] overflow-hidden relative bg-white rounded-lg border border-gray-200 shadow-sm">
      {scale > 0 && (
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: RESUME_PREVIEW_WIDTH, transform: `scale(${scale})`, pointerEvents: "none" }}
          aria-hidden="true"
        >
          <ResumePreview data={SHOWCASE_RESUME} templateId={templateId} resumeName="Ashu Desai" />
        </div>
      )}
    </div>
  );
}

const FREE_FEATURES = [
  { label: "3 Resume templates", ok: true },
  { label: "HTML export", ok: true },
  { label: "ATS score checker", ok: true },
  { label: "8-step guided wizard", ok: true },
  { label: "PDF & Word export", ok: false },
  { label: "All 10 fonts", ok: false },
  { label: "Priority support", ok: false },
  { label: "7 premium templates", ok: false },
];

const PREMIUM_FEATURES = [
  { label: "All 10 templates (7 premium)", ok: true },
  { label: "HTML export", ok: true },
  { label: "ATS score checker", ok: true },
  { label: "8-step guided wizard", ok: true },
  { label: "PDF & Word export", ok: true },
  { label: "All 10 fonts", ok: true },
  { label: "Priority support", ok: true },
  { label: "Premium badge", ok: true },
];

type BillingCycle = "weekly" | "monthly" | "yearly";

const PLANS: Record<BillingCycle, { label: string; price: number; unit: string; planType: string; badge?: string; sub: string }> = {
  weekly: { label: "Weekly", price: 49, unit: "week", planType: "premium-weekly", sub: "Try it out" },
  monthly: { label: "Monthly", price: 149, unit: "month", planType: "premium-monthly", sub: "Most flexible" },
  yearly: { label: "Yearly", price: 499, unit: "year", planType: "premium-yearly", badge: "Best Value", sub: "Save 72% vs monthly" },
};

function planLabelFromType(planType?: string | null): { label: string; price: string } {
  if (planType === "premium-weekly") return { label: "Premium Weekly Plan", price: "₹49 / week" };
  if (planType === "premium-monthly") return { label: "Premium Monthly Plan", price: "₹149 / month" };
  if (planType === "premium-yearly" || planType === "premium") return { label: "Premium Yearly Plan", price: "₹499 / year" };
  return { label: "Premium Plan", price: "" };
}

type PaymentMethod = "razorpay" | "gpay" | "phonepe" | "card";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; sub: string; icon: typeof Wallet }[] = [
  { id: "razorpay", label: "Razorpay", sub: "Cards, UPI, wallets", icon: Wallet },
  { id: "gpay", label: "Google Pay", sub: "Pay via UPI", icon: Smartphone },
  { id: "phonepe", label: "PhonePe", sub: "Pay via UPI", icon: QrCode },
  { id: "card", label: "Debit / Credit Card", sub: "Visa, Mastercard, RuPay", icon: CreditCard },
];

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

interface ReceiptData {
  name: string;
  email: string;
  amount: string;
  plan: string;
  date: string;
  txnId: string;
  method: string;
}

function Receipt({ data, onDone }: { data: ReceiptData; onDone: () => void }) {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Success animation */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Successful! 🎉</h1>
          <p className="text-gray-500 mt-2">Welcome to Premium! Your account has been upgraded.</p>
        </div>

        {/* Receipt card */}
        <Card className="border-2 border-emerald-100 shadow-xl mb-6">
          <CardHeader className="pb-3" style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" />
                <span className="text-white font-bold">SkillDraft</span>
              </div>
              <Badge className="bg-yellow-400 text-yellow-900 border-0 font-bold">
                <Crown className="w-3 h-3 mr-1" />PREMIUM
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="text-center pb-4 border-b">
              <div className="text-3xl font-bold text-gray-900">{data.amount}</div>
              <div className="text-sm text-gray-500 mt-1">{data.plan}</div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { label: "Customer Name", value: data.name },
                { label: "Email", value: data.email },
                { label: "Payment Method", value: data.method },
                { label: "Date", value: data.date },
                { label: "Transaction ID", value: data.txnId },
                { label: "Status", value: "✅ Paid" },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%] break-all">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>Note:</strong> A receipt has been generated for your records. For email delivery, configure an SMTP service in settings.
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Download className="w-4 h-4 mr-2" />Print Receipt
          </Button>
          <Button onClick={onDone} className="flex-1" style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
            <Sparkles className="w-4 h-4 mr-2" />Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: me } = useGetMe();
  const upgradeMutation = useUpgradePlan();

  const [step, setStep] = useState<"pricing" | "checkout" | "receipt">("pricing");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [manageBilling, setManageBilling] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paying, setPaying] = useState(false);
  const [checkoutErrors, setCheckoutErrors] = useState<{ cardName?: string; cardNumber?: string; expiry?: string; cvv?: string; upiId?: string }>({});

  const plan = PLANS[billingCycle];

  const validateCheckout = () => {
    const next: typeof checkoutErrors = {};

    if (paymentMethod === "card") {
      if (!cardName.trim()) next.cardName = "Enter the cardholder name";

      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length !== 16) next.cardNumber = "Enter a valid 16-digit card number";

      const match = expiry.match(/^(\d{2})\/(\d{2})$/);
      if (!match) {
        next.expiry = "Enter expiry as MM/YY";
      } else {
        const month = parseInt(match[1], 10);
        const year = 2000 + parseInt(match[2], 10);
        if (month < 1 || month > 12) {
          next.expiry = "Enter a valid month (01-12)";
        } else {
          const now = new Date();
          const isPast = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
          if (isPast) next.expiry = "Card has expired";
        }
      }

      if (cvv.length < 3) next.cvv = "Enter a valid CVV";
    } else if (paymentMethod === "gpay" || paymentMethod === "phonepe") {
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) next.upiId = "Enter a valid UPI ID (e.g. name@okhdfcbank)";
    }
    // razorpay: no inline fields, handled by Razorpay's own secure checkout

    setCheckoutErrors(next);
    return Object.keys(next).length === 0;
  };

  const methodLabel = PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label ?? "Card";

  const handlePay = async () => {
    if (!validateCheckout()) return;

    setPaying(true);
    await new Promise(r => setTimeout(r, 1800));

    upgradeMutation.mutate({ data: { planType: plan.planType } }, {
      onSuccess: (res) => {
        qc.invalidateQueries();
        const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        setReceipt({
          name: res.user.username,
          email: res.user.email,
          amount: `₹${plan.price} / ${plan.unit}`,
          plan: `Premium ${plan.label} Plan`,
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          txnId,
          method: methodLabel,
        });
        setStep("receipt");
        setPaying(false);
      },
      onError: () => {
        toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
        setPaying(false);
      },
    });
  };

  if (step === "receipt" && receipt) {
    return <Receipt data={receipt} onDone={() => setLocation("/dashboard")} />;
  }

  if (me?.isPremium && !manageBilling) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
            </Button>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="font-semibold text-sm">My Plan</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
            <Badge className="mb-3 bg-yellow-400 text-yellow-900 border-0 font-bold">PREMIUM ACTIVE</Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're all set, {me.username}!</h1>
            <p className="text-gray-500">
              {planLabelFromType(me.planType).label}
              {planLabelFromType(me.planType).price && ` — ${planLabelFromType(me.planType).price}`}. Here's everything you have access to.
            </p>
          </div>

          <Card className="border-2 border-blue-100 shadow-lg max-w-md mx-auto mb-12">
            <CardContent className="pt-6 space-y-3">
              {PREMIUM_FEATURES.map(f => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-gray-800 font-medium">{f.label}</span>
                </div>
              ))}
              <Button asChild className="w-full mt-4" style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
                <Link href="/dashboard"><Sparkles className="w-4 h-4 mr-2" />Go build a resume</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setManageBilling(true)}
                data-testid="button-change-plan"
              >
                <CreditCard className="w-4 h-4 mr-2" />Change plan / payment method
              </Button>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Your 7 unlocked templates</h2>
            <p className="text-gray-500 text-center mb-8 text-sm">Plus the 3 free templates — all 10 are yours to use.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {PREMIUM_TEMPLATE_IDS.map(tid => (
                <ShowcaseThumb key={tid} templateId={tid} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          {manageBilling ? (
            <Button variant="ghost" size="sm" onClick={() => { setManageBilling(false); setStep("pricing"); }}>
              <ArrowLeft className="w-4 h-4 mr-1" />My Plan
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
            </Button>
          )}
          <span className="text-muted-foreground text-sm">/</span>
          <span className="font-semibold text-sm">{manageBilling ? "Change Plan" : "Upgrade to Premium"}</span>
        </div>
      </div>

      {step === "pricing" && (
        <div className="max-w-5xl mx-auto px-4 py-16">
          {/* Hero */}
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />Premium Plan
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Unlock your full resume potential
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Get PDF & Word exports, all fonts, premium templates, and more — everything a fresher needs to land their dream job.
            </p>
          </div>

          {/* Billing cycle toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white border border-gray-200 rounded-full p-1 shadow-sm">
              {(Object.keys(PLANS) as BillingCycle[]).map(cycle => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  data-testid={`button-cycle-${cycle}`}
                  className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                    billingCycle === cycle ? "text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={billingCycle === cycle ? { background: "linear-gradient(135deg, #1e40af, #0d9488)" } : undefined}
                >
                  {PLANS[cycle].label}
                  {PLANS[cycle].badge && (
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {PLANS[cycle].badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-4">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Free</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹0</span>
                  <span className="text-gray-400 mb-1">forever</span>
                </div>
                <p className="text-sm text-gray-500">Perfect to get started</p>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {FREE_FEATURES.map(f => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    {f.ok
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                    <span className={`text-sm ${f.ok ? "text-gray-800" : "text-gray-400"}`}>{f.label}</span>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4" disabled>Current Plan</Button>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-2 border-blue-500 shadow-xl shadow-blue-100 relative overflow-hidden">
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-yellow-400 text-yellow-900 border-0 font-bold text-xs">
                    <Star className="w-3 h-3 mr-1 fill-yellow-900" />{plan.badge.toUpperCase()}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4" style={{ background: "linear-gradient(135deg, #1e40af 0%, #0d9488 100%)" }}>
                <div className="text-sm font-semibold text-blue-200 uppercase tracking-wide mb-1">Premium · {plan.label}</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                  <span className="text-blue-200 mb-1">/ {plan.unit}</span>
                </div>
                <p className="text-sm text-blue-200">{plan.sub}</p>
              </CardHeader>
              <CardContent className="space-y-3 pt-5">
                {PREMIUM_FEATURES.map(f => (
                  <div key={f.label} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-800 font-medium">{f.label}</span>
                  </div>
                ))}
                <Button
                  className="w-full mt-4 h-11 font-semibold"
                  style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}
                  onClick={() => setStep("checkout")}
                  data-testid="button-upgrade-now"
                >
                  <Zap className="w-4 h-4 mr-2" />{manageBilling ? "Switch to this plan" : "Upgrade Now"} — ₹{plan.price}/{plan.unit}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Premium templates showcase */}
          <div className="mt-16">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                <Crown className="w-3.5 h-3.5 mr-1.5" />7 Premium-only designs
              </Badge>
              <h2 className="text-2xl font-bold text-gray-900">See exactly what you're unlocking</h2>
              <p className="text-gray-500 mt-2">Real previews of the designer templates only Premium members can use.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {PREMIUM_TEMPLATE_IDS.map(tid => (
                <ShowcaseThumb key={tid} templateId={tid} />
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-gray-400">
            {[
              { icon: Shield, text: "Secure Payment" },
              { icon: Lock, text: "256-bit Encryption" },
              { icon: CheckCircle2, text: "Instant Access" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "checkout" && (
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Complete your purchase</h2>
            <p className="text-gray-500 mt-1">Premium {plan.label} Plan — ₹{plan.price} / {plan.unit}</p>
          </div>

          <Card className="shadow-xl border-2 border-gray-100">
            <CardContent className="pt-6 space-y-5">
              {/* Order summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Premium {plan.label} Plan</div>
                    <div className="text-xs text-gray-500">Full access · billed per {plan.unit}</div>
                  </div>
                </div>
                <div className="font-bold text-gray-900">₹{plan.price}</div>
              </div>

              {/* Plan switcher */}
              <div className="flex gap-2">
                {(Object.keys(PLANS) as BillingCycle[]).map(cycle => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    data-testid={`button-checkout-cycle-${cycle}`}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-md border transition-colors ${
                      billingCycle === cycle ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {PLANS[cycle].label}
                  </button>
                ))}
              </div>

              {/* Payment method selector */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Choose payment method</Label>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(m => {
                    const Icon = m.icon;
                    const active = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setPaymentMethod(m.id); setCheckoutErrors({}); }}
                        data-testid={`button-pay-${m.id}`}
                        className={`flex items-center gap-2.5 rounded-lg border-2 p-3 text-left transition-colors ${
                          active ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${active ? "bg-blue-500" : "bg-gray-100"}`}>
                          <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-500"}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{m.label}</div>
                          <div className="text-[11px] text-gray-500 truncate">{m.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card form */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Cardholder Name</Label>
                    <Input
                      placeholder="Name as on card"
                      value={cardName}
                      onChange={e => { setCardName(e.target.value); setCheckoutErrors(er => ({ ...er, cardName: undefined })); }}
                      aria-invalid={!!checkoutErrors.cardName}
                      className={`h-11 ${checkoutErrors.cardName ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                    />
                    {checkoutErrors.cardName && <p className="text-xs text-red-500 mt-1">{checkoutErrors.cardName}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Card Number</Label>
                    <div className="relative">
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={e => { setCardNumber(formatCardNumber(e.target.value)); setCheckoutErrors(er => ({ ...er, cardNumber: undefined })); }}
                        aria-invalid={!!checkoutErrors.cardNumber}
                        className={`h-11 pr-12 ${checkoutErrors.cardNumber ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        maxLength={19}
                      />
                      <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {checkoutErrors.cardNumber && <p className="text-xs text-red-500 mt-1">{checkoutErrors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Expiry Date</Label>
                      <Input
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={e => { setExpiry(formatExpiry(e.target.value)); setCheckoutErrors(er => ({ ...er, expiry: undefined })); }}
                        aria-invalid={!!checkoutErrors.expiry}
                        className={`h-11 ${checkoutErrors.expiry ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        maxLength={5}
                      />
                      {checkoutErrors.expiry && <p className="text-xs text-red-500 mt-1">{checkoutErrors.expiry}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1.5 block">CVV</Label>
                      <Input
                        placeholder="•••"
                        value={cvv}
                        onChange={e => { setCvv(e.target.value.replace(/\D/g, "").slice(0, 4)); setCheckoutErrors(er => ({ ...er, cvv: undefined })); }}
                        aria-invalid={!!checkoutErrors.cvv}
                        className={`h-11 ${checkoutErrors.cvv ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        type="password"
                        maxLength={4}
                      />
                      {checkoutErrors.cvv && <p className="text-xs text-red-500 mt-1">{checkoutErrors.cvv}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* UPI form (GPay / PhonePe) */}
              {(paymentMethod === "gpay" || paymentMethod === "phonepe") && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    {paymentMethod === "gpay" ? "Google Pay" : "PhonePe"} UPI ID
                  </Label>
                  <Input
                    placeholder="yourname@okhdfcbank"
                    value={upiId}
                    onChange={e => { setUpiId(e.target.value); setCheckoutErrors(er => ({ ...er, upiId: undefined })); }}
                    aria-invalid={!!checkoutErrors.upiId}
                    className={`h-11 ${checkoutErrors.upiId ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                  />
                  {checkoutErrors.upiId && <p className="text-xs text-red-500 mt-1">{checkoutErrors.upiId}</p>}
                  <p className="text-xs text-gray-400 mt-1.5">You'll get a payment request on your {paymentMethod === "gpay" ? "Google Pay" : "PhonePe"} app to approve.</p>
                </div>
              )}

              {/* Razorpay info */}
              {paymentMethod === "razorpay" && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>You'll be redirected to Razorpay's secure checkout to pay by card, UPI, netbanking or wallet.</span>
                </div>
              )}

              {/* Security note */}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Your payment is secured with 256-bit SSL encryption</span>
              </div>

              <Button
                className="w-full h-12 font-bold text-base"
                onClick={handlePay}
                disabled={paying}
                style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}
                data-testid="button-pay-submit"
              >
                {paying
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing payment...</>
                  : <><Lock className="w-4 h-4 mr-2" />Pay ₹{plan.price} via {methodLabel}</>}
              </Button>

              <Button variant="ghost" size="sm" className="w-full text-gray-400" onClick={() => setStep("pricing")}>
                ← Back to plans
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
