import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useForgotPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Loader2, Mail, Copy, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const forgotMutation = useForgotPassword();
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = (data: FormData) => {
    forgotMutation.mutate({ data }, {
      onSuccess: (res) => {
        setResetLink(res.resetLink);
      },
      onError: (err: unknown) => {
        const message = (err as { data?: { error?: string } })?.data?.error || "Something went wrong";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    });
  };

  const handleCopy = async () => {
    if (!resetLink) return;
    const fullLink = `${window.location.origin}${resetLink}`;
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Fresher Resume Builder</h1>
          <p className="text-blue-300 text-sm">Reset your password</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Forgot password?</CardTitle>
            <CardDescription>Enter your email and we'll generate a reset link for you.</CardDescription>
          </CardHeader>
          <CardContent>
            {resetLink ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">Reset link generated!</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Demo mode:</strong> In production, this link would be sent to your email. For now, use the link below to reset your password.
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Your reset link</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded border truncate">
                      {window.location.origin}{resetLink}
                    </code>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="flex-shrink-0">
                      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setLocation(resetLink)}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Go to Reset Page
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                      className={`pl-9 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
                  {forgotMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating link...</>
                    : "Send Reset Link"}
                </Button>
              </form>
            )}

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
