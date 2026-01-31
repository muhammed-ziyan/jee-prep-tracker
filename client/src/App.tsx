import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Syllabus from "@/pages/Syllabus";
import Revision from "@/pages/Revision";
import Backlog from "@/pages/Backlog";
import MockTests from "@/pages/MockTests";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect logic handled by Layout or Auth hooks generally, but safe to force landing or login
    setLocation("/");
    return <Landing />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Switch>
      <Route path="/">
        {user ? <ProtectedRoute component={Dashboard} /> : <Landing />}
      </Route>
      
      {/* Protected Routes */}
      <Route path="/syllabus">
        <ProtectedRoute component={Syllabus} />
      </Route>
      <Route path="/revision">
        <ProtectedRoute component={Revision} />
      </Route>
      <Route path="/backlog">
        <ProtectedRoute component={Backlog} />
      </Route>
      <Route path="/mock-tests">
        <ProtectedRoute component={MockTests} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
