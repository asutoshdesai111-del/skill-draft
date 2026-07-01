import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Builder from "@/pages/builder";
import Preview from "@/pages/preview";
import Upgrade from "@/pages/upgrade";
import ImportReview from "@/pages/import-review";
import CareerHub from "@/pages/career/index";
import Analytics from "@/pages/career/analytics";
import ResumeReview from "@/pages/career/review";
import JobMatch from "@/pages/career/job-match";
import SkillGap from "@/pages/career/skill-gap";
import ThemeRecommend from "@/pages/career/theme-recommend";
import InterviewPrep from "@/pages/career/interview-prep";
import MockInterview from "@/pages/career/mock-interview";

setAuthTokenGetter(() => getToken());

// Configure API base URL for development
if (import.meta.env.DEV) {
  setBaseUrl("http://localhost:8080");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/import-review" component={ImportReview} />
      <Route path="/builder/:resumeId" component={Builder} />
      <Route path="/builder/:resumeId/preview" component={Preview} />
      <Route path="/upgrade" component={Upgrade} />
      <Route path="/career" component={CareerHub} />
      <Route path="/career/analytics" component={Analytics} />
      <Route path="/career/review" component={ResumeReview} />
      <Route path="/career/job-match" component={JobMatch} />
      <Route path="/career/skill-gap" component={SkillGap} />
      <Route path="/career/theme" component={ThemeRecommend} />
      <Route path="/career/interview-prep" component={InterviewPrep} />
      <Route path="/career/mock-interview" component={MockInterview} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
