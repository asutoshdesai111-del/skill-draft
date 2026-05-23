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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Loader2, CheckCircle, XCircle } from "lucide-react";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
];

const schema = z.object({
  username: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

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
    registerMutation.mutate({ data: { username: data.username, email: data.email, password: data.password } }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast({ title: "Account created!", description: "Welcome to Fresher Resume Builder." });
        setLocation("/dashboard");
      },
      onError: (err: unknown) => {
        const message = (err as { data?: { error?: string } })?.data?.error || "Registration failed";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Fresher Resume Builder</h1>
          <p className="text-blue-300 text-sm">Create your free account</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Get started for free</CardTitle>
            <CardDescription>Build professional resumes in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="username">Full Name</Label>
                <Input
                  id="username"
                  placeholder="Rahul Sharma"
                  autoComplete="name"
                  data-testid="input-username"
                  aria-invalid={!!errors.username}
                  {...register("username")}
                  className={errors.username ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.username && (
                  <p className="text-xs text-destructive" role="alert">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="rahul@example.com"
                  autoComplete="email"
                  data-testid="input-email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  data-testid="input-password"
                  aria-invalid={!!errors.password}
                  className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                  {...register("password")}
                />
                {showStrength && (
                  <div className="space-y-1 mt-1">
                    {passwordRules.map(rule => {
                      const passed = rule.test(passwordValue);
                      return (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {passed
                            ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            : <XCircle className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                          }
                          <span className={`text-xs ${passed ? "text-green-600" : "text-muted-foreground"}`}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {errors.password && !showStrength && (
                  <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  data-testid="input-confirm-password"
                  aria-invalid={!!errors.confirmPassword}
                  className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive" role="alert">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={registerMutation.isPending} data-testid="button-register">
                {registerMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
