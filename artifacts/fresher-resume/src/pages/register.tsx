import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FileText, Loader2, CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

const schema = z.object({
  username: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Only letters, spaces, hyphens, and apostrophes"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Needs one uppercase letter")
    .regex(/\d/, "Needs one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

const STATS = [
  { value: "10,000+", label: "Resumes created" },
  { value: "5", label: "Templates" },
  { value: "100%", label: "Free" },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const { register, handleSubmit, watch, formState: { errors, touchedFields } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const passwordValue = watch("password", "");
  const showStrength = touchedFields.password && passwordValue.length > 0;

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(
      { data: { username: data.username, email: data.email, password: data.password } },
      {
        onSuccess: (res) => {
          setToken(res.token);
          toast({ title: "Account created!", description: "Welcome to SkillDraft." });
          setLocation("/dashboard");
        },
        onError: (err: unknown) => {
          const message = (err as { data?: { error?: string } })?.data?.error || "Registration failed";
          toast({ title: "Error", description: message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0d9488 100%)" }}>

        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-[-40px] w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #5eead4 0%, transparent 70%)" }} />

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">SkillDraft</span>
          </div>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Start your career<br />
              <span className="text-teal-300">journey today</span>
            </h2>
            <p className="text-blue-200 mt-4 text-base leading-relaxed max-w-xs">
              Create a professional resume in minutes with our guided wizard. No design skills needed.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-blue-300 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Resume card preview */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0d9488, #6366f1)" }}>
                <span className="text-white text-xs font-bold">R</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-2.5 bg-white/40 rounded w-32 mb-2" />
                <div className="h-2 bg-white/25 rounded w-24 mb-3" />
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-white/20 rounded w-full" />
                  <div className="h-1.5 bg-white/20 rounded w-4/5" />
                  <div className="h-1.5 bg-white/20 rounded w-3/5" />
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {["Education", "Skills", "Projects"].map(tag => (
                <div key={tag} className="bg-teal-400/20 border border-teal-400/30 rounded-full px-2 py-0.5 text-teal-300 text-xs">{tag}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-2xl px-4 py-3 w-fit">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-white text-sm font-medium">100% free — Start building in seconds</span>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-14 py-12 bg-white overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">SkillDraft</span>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create your account ✨</h1>
            <p className="text-gray-500 mt-1 text-sm">Free forever — no credit card required</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input
                id="username"
                placeholder="Rahul Sharma"
                autoComplete="name"
                aria-invalid={!!errors.username}
                {...register("username")}
                className={`h-11 ${errors.username ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="rahul@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
                className={`h-11 ${errors.email ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
                className={`h-11 ${errors.password ? "border-red-400" : "border-gray-200"}`}
              />
              {showStrength && (
                <div className="grid grid-cols-1 gap-1 mt-1.5">
                  {passwordRules.map(rule => {
                    const ok = rule.test(passwordValue);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {ok
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                        <span className={`text-xs ${ok ? "text-emerald-600" : "text-gray-400"}`}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Repeat your password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
                className={`h-11 ${errors.confirmPassword ? "border-red-400" : "border-gray-200"}`}
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm mt-2"
              disabled={registerMutation.isPending}
              style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}
            >
              {registerMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
                : <><span>Create Free Account</span><ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">
            By creating an account you agree to our Terms of Service
          </p>

          <div className="mt-5 text-center">
            <span className="text-sm text-gray-500">Already have an account? </span>
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
