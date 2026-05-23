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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Fresher Resume Builder</h1>
          <p className="text-blue-300 text-sm">Sign in to your account</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  data-testid="input-email"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  data-testid="input-password"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-login">
                {loginMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">Create one</Link>
            </div>

            <div className="mt-3 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <strong>Demo:</strong> demo@fresherresume.com / demo123456
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
