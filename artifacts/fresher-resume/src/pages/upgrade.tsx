import { useState } from "react";
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
  ArrowLeft, Loader2, CreditCard, Lock, Star, Crown
} from "lucide-react";

const FREE_FEATURES = [
  { label: "3 Resume templates", ok: true },
  { label: "HTML export", ok: true },
  { label: "ATS score checker", ok: true },
  { label: "8-step guided wizard", ok: true },
  { label: "PDF & Word export", ok: false },
  { label: "All 10 fonts", ok: false },
  { label: "Priority support", ok: false },
  { label: "Premium templates", ok: false },
];

const PREMIUM_FEATURES = [
  { label: "All 5 premium templates", ok: true },
  { label: "HTML export", ok: true },
  { label: "ATS score checker", ok: true },
  { label: "8-step guided wizard", ok: true },
  { label: "PDF & Word export", ok: true },
  { label: "All 10 fonts", ok: true },
  { label: "Priority support", ok: true },
  { label: "Premium badge", ok: true },
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
                <span className="text-white font-bold">Fresher Resume Builder</span>
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

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!cardName.trim()) { toast({ title: "Enter cardholder name", variant: "destructive" }); return; }
    if (cardNumber.replace(/\s/g, "").length < 16) { toast({ title: "Enter a valid 16-digit card number", variant: "destructive" }); return; }
    if (expiry.length < 5) { toast({ title: "Enter a valid expiry (MM/YY)", variant: "destructive" }); return; }
    if (cvv.length < 3) { toast({ title: "Enter a valid CVV", variant: "destructive" }); return; }

    setPaying(true);
    await new Promise(r => setTimeout(r, 1800));

    upgradeMutation.mutate({ data: { planType: "premium" } }, {
      onSuccess: (res) => {
        qc.invalidateQueries();
        const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        setReceipt({
          name: res.user.username,
          email: res.user.email,
          amount: "₹499 / year",
          plan: "Premium Annual Plan",
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          txnId,
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

  if (me?.isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're already Premium!</h2>
          <p className="text-gray-500 mb-6">You have access to all premium features.</p>
          <Button asChild style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Dashboard</Link>
          </Button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="font-semibold text-sm">Upgrade to Premium</span>
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
              <div className="absolute top-4 right-4">
                <Badge className="bg-yellow-400 text-yellow-900 border-0 font-bold text-xs">
                  <Star className="w-3 h-3 mr-1 fill-yellow-900" />BEST VALUE
                </Badge>
              </div>
              <CardHeader className="pb-4" style={{ background: "linear-gradient(135deg, #1e40af 0%, #0d9488 100%)" }}>
                <div className="text-sm font-semibold text-blue-200 uppercase tracking-wide mb-1">Premium</div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">₹499</span>
                  <span className="text-blue-200 mb-1">/ year</span>
                </div>
                <p className="text-sm text-blue-200">Everything you need to succeed</p>
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
                >
                  <Zap className="w-4 h-4 mr-2" />Upgrade Now — ₹499/year
                </Button>
              </CardContent>
            </Card>
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
            <p className="text-gray-500 mt-1">Premium Annual Plan — ₹499 / year</p>
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
                    <div className="font-semibold text-gray-900 text-sm">Premium Annual Plan</div>
                    <div className="text-xs text-gray-500">Full access · 1 year</div>
                  </div>
                </div>
                <div className="font-bold text-gray-900">₹499</div>
              </div>

              {/* Card form */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Cardholder Name</Label>
                  <Input
                    placeholder="Name as on card"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Card Number</Label>
                  <div className="relative">
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      className="h-11 pr-12"
                      maxLength={19}
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Expiry Date</Label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      className="h-11"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">CVV</Label>
                    <Input
                      placeholder="•••"
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="h-11"
                      type="password"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

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
              >
                {paying
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing payment...</>
                  : <><Lock className="w-4 h-4 mr-2" />Pay ₹499 Securely</>}
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
