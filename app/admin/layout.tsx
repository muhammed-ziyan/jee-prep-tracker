"use client";

import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  BarChart3,
  FileText,
  CalendarDays,
  Quote,
  ArrowLeft,
  Loader2,
  Shield,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Sheet = dynamic(
  () => import("@/components/ui/sheet").then((m) => ({ default: m.Sheet })),
  { ssr: false }
);
const SheetContent = dynamic(
  () => import("@/components/ui/sheet").then((m) => ({ default: m.SheetContent })),
  { ssr: false }
);
const SheetTrigger = dynamic(
  () => import("@/components/ui/sheet").then((m) => ({ default: m.SheetTrigger })),
  { ssr: false }
);

const adminNavItems = [
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Syllabus", href: "/admin/syllabus", icon: BookOpen },
  { label: "Exam dates", href: "/admin/exam-dates", icon: CalendarDays },
  { label: "Quotes", href: "/admin/quotes", icon: Quote },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Report", href: "/admin/analytics?tab=report", icon: FileText },
];

function AdminLayoutInner({
  children,
  pathname,
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const searchParams = useSearchParams();
  const { logout, isLoggingOut } = useAuth();
  const isReportTab = pathname === "/admin/analytics" && searchParams.get("tab") === "report";
  const isMobile = useIsMobile();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-border w-72">
      <div className="p-6 flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-display font-bold text-primary">Admin</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {adminNavItems.map((item) => {
          const isReportLink = item.href.includes("tab=report");
          const isActive =
            isReportLink
              ? isReportTab
              : pathname === item.href ||
                (item.href !== "/admin/analytics" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <item.icon
                className={`h-5 w-5 ${
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0" />
          )}
          Log out
        </Button>
        <Link href="/" className="block">
          <Button variant="outline" className="w-full justify-start gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-muted/20">
      <div className="hidden lg:block fixed inset-y-0 z-20">
        <SidebarContent />
      </div>
      <div className="flex-1 lg:pl-72 flex flex-col min-h-0 overflow-hidden">
        <div className="lg:hidden flex items-center justify-between p-4 bg-background border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-2 font-display font-bold text-xl text-primary">
            <Shield className="h-6 w-6" />
            Admin
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user) {
      router.replace("/login?callbackUrl=" + encodeURIComponent("/admin"));
      return;
    }
    if (!isAdmin) {
      router.replace("/login?callbackUrl=" + encodeURIComponent("/admin") + "&error=not_admin");
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  if (authLoading || adminLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <AdminLayoutInner pathname={pathname ?? "/admin"}>{children}</AdminLayoutInner>
    </Suspense>
  );
}
