import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FileText, Loader2, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

const FEATURES = [
  "8-step guided resume wizard",
  "5 professional templates",
  "ATS score checker",
  "PDF & Word export",
  "Font customization",
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        setToken(res.token);
        setLocation("/dashboard");
      },
      onError: (err: unknown) => {
        const message = (err as { data?: { error?: string } })?.data?.error || "Invalid email or password";
        toast({ title: "Login failed", description: message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #0d9488 100%)" }}>

        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] left-[-40px] w-60 h-60 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #5eead4 0%, transparent 70%)" }} />

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Fresher Resume Builder</span>
          </div>
          <p className="text-blue-200 text-sm mt-1">Your career starts with a great resume</p>
        </div>

        {/* Center content */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Build resumes that<br />
              <span className="text-teal-300">get you hired</span>
            </h2>
            <p className="text-blue-200 mt-4 text-base leading-relaxed max-w-sm">
              Trusted by thousands of freshers to create ATS-friendly resumes that stand out from the crowd.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-300 flex-shrink-0" />
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-2xl px-4 py-3 w-fit">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-white text-sm font-medium">Free for all freshers — No credit card needed</span>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}>
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">Fresher Resume Builder</span>
        </div>

        <div className="max-w-sm w-full mx-auto lg:mx-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back 👋</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to continue building your resume</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
                className={`h-11 ${errors.email ? "border-red-400 focus-visible:ring-red-300" : "border-gray-200 focus-visible:ring-blue-300"}`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
                className={`h-11 ${errors.password ? "border-red-400 focus-visible:ring-red-300" : "border-gray-200 focus-visible:ring-blue-300"}`}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm"
              disabled={loginMutation.isPending}
              style={{ background: "linear-gradient(135deg, #1e40af, #0d9488)" }}
            >
              {loginMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                : <><span>Sign In</span><ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">Don't have an account? </span>
            <Link href="/register" className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              Create one free
            </Link>
          </div>

          <div className="mt-6 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 text-center">
            <span className="font-semibold text-gray-600">Demo account:</span> demo@fresherresume.com · demo123456
          </div>
        </div>
      </div>
    </div>
  );
}
