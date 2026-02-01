"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error reporting service in production
    if (process.env.NODE_ENV === "production") {
      // e.g. reportError(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertCircle className="h-8 w-8 shrink-0" />
            <h1 className="text-xl font-semibold">Something went wrong</h1>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <Button onClick={reset} variant="default">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
