import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Loader2, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "At least one number", test: (p: string) => /\d/.test(p) },
];

const schema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const resetMutation = useResetPassword();

  const params = new URLSearchParams(search);
  const token = params.get("token") || "";

  useEffect(() => {
    if (!token) {
      toast({ title: "Invalid link", description: "No reset token found. Please request a new link.", variant: "destructive" });
    }
  }, [token, toast]);

  const { register, handleSubmit, watch, formState: { errors, touchedFields, isSubmitSuccessful } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const passwordValue = watch("newPassword", "");
  const showStrength = touchedFields.newPassword && passwordValue.length > 0;

  const onSubmit = (data: FormData) => {
    resetMutation.mutate({ data: { token, newPassword: data.newPassword } }, {
      onSuccess: () => {
        toast({ title: "Password reset!", description: "You can now sign in with your new password." });
        setTimeout(() => setLocation("/login"), 1500);
      },
      onError: (err: unknown) => {
        const message = (err as { data?: { error?: string } })?.data?.error || "Failed to reset password";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Invalid reset link</h2>
            <p className="text-sm text-muted-foreground">This link is missing a reset token. Please request a new password reset.</p>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request new link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitSuccessful && resetMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Password reset!</h2>
            <p className="text-sm text-muted-foreground">Your password has been updated. Redirecting to login…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Fresher Resume Builder</h1>
          <p className="text-blue-300 text-sm">Set a new password</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create new password</CardTitle>
            <CardDescription>Choose a strong password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  aria-invalid={!!errors.newPassword}
                  className={errors.newPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                  {...register("newPassword")}
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
                {errors.newPassword && !showStrength && (
                  <p className="text-xs text-destructive" role="alert">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  className={errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive" role="alert">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
                {resetMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting password...</>
                  : "Reset Password"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary font-medium hover:underline">Back to Sign In</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
