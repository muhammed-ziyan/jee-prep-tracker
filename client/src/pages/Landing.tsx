import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Target, TrendingUp, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold font-display text-xl">
              J
            </div>
            <span className="font-display font-bold text-xl tracking-tight">JEE Prep</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
               <Link href="/">
                 <Button className="font-semibold">Go to Dashboard</Button>
               </Link>
            ) : (
              <a href="/api/login">
                <Button className="font-semibold">Student Login</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Accepting new students for 2025 batch
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
            Master your JEE journey with <span className="text-primary">precision</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100">
            Track your syllabus, manage backlog, schedule revisions, and analyze mock tests in one beautiful dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-200">
            <a href="/api/login">
              <Button size="lg" className="h-14 px-8 rounded-2xl text-lg font-semibold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                Start Tracking Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-semibold bg-white/50 border-2">
              View Features
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-muted/30 border border-border hover:border-primary/50 transition-colors group">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Syllabus Tracker</h3>
              <p className="text-muted-foreground leading-relaxed">
                Detailed chapter-wise tracking for Physics, Chemistry, and Maths. Mark progress and confidence levels.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-muted/30 border border-border hover:border-primary/50 transition-colors group">
              <div className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Backlog Killer</h3>
              <p className="text-muted-foreground leading-relaxed">
                Systematically destroy your backlog. Prioritize weak topics and schedule dedicated recovery sessions.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-muted/30 border border-border hover:border-primary/50 transition-colors group">
              <div className="h-14 w-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold font-display mb-3">Score Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Visualize your mock test performance. Identify patterns and weak subjects with intuitive charts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>© 2025 JEE Prep Tracker. Built for champions.</p>
        </div>
      </footer>
    </div>
  );
}
