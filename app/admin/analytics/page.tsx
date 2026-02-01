import { Suspense } from "react";
import { AdminAnalyticsClient } from "./AdminAnalyticsClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminAnalyticsClient />
    </Suspense>
  );
}
