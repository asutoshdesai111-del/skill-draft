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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";

const schema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Full Name</Label>
                <Input id="username" placeholder="Rahul Sharma" data-testid="input-username" {...register("username")} />
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="rahul@example.com" data-testid="input-email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" data-testid="input-password" {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Repeat password" data-testid="input-confirm-password" {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
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
