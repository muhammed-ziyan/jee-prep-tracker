"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  CalendarClock, 
  ListTodo, 
  GraduationCap, 
  LogOut,
  User,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Syllabus", href: "/syllabus", icon: BookOpen },
  { label: "Revision", href: "/revision", icon: CalendarClock },
  { label: "Backlog", href: "/backlog", icon: ListTodo },
  { label: "Tests", href: "/mock-tests", icon: GraduationCap },
];

export function Layout({ children }: LayoutProps) {
  const { user, logout, isLoggingOut, isLoading } = useAuth();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on the landing page (and presumably not logged in check handled by parent or page logic),
  // but strictly speaking Layout wraps authenticated pages.
  // If user is null, the parent App component or page protection should redirect.
  // For safety, if user is null here, show nothing or redirect logic handles it.

  if (!user) return <>{children}</>;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-border">
      <div className="p-6">
        <h1 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          JEE Prep
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}>
              <item.icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.firstName || "Student"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 h-full fixed inset-y-0 z-20">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-background border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-primary">
            <GraduationCap className="h-6 w-6" />
            JEE Prep
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-30 px-6 py-2 flex justify-between items-center safe-area-pb">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 p-2">
                 <div className={`p-1.5 rounded-full transition-colors ${isActive ? "bg-primary/10" : "bg-transparent"}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                 </div>
                 <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                   {item.label}
                 </span>
              </Link>
            );
          })}
          <Link href="/mock-tests" className="flex flex-col items-center gap-1 p-2">
             <div className={`p-1.5 rounded-full transition-colors ${pathname === "/mock-tests" ? "bg-primary/10" : "bg-transparent"}`}>
                <GraduationCap className={`h-5 w-5 ${pathname === "/mock-tests" ? "text-primary" : "text-muted-foreground"}`} />
             </div>
             <span className={`text-[10px] font-medium ${pathname === "/mock-tests" ? "text-primary" : "text-muted-foreground"}`}>
               Tests
             </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
