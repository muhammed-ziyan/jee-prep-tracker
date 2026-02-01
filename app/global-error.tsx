"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // Report to error service
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 24, background: "#f8fafc", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>Application error</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>A critical error occurred. Please refresh the page.</p>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 500,
              color: "#fff",
              background: "#3b82f6",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
