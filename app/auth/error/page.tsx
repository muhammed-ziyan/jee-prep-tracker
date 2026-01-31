"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "An error occurred during sign in.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-sm text-center space-y-4">
        <h1 className="text-xl font-semibold text-destructive">Authentication error</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button asChild>
          <Link href="/login">Try again</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
