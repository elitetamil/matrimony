"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import CompactFooter from "@/components/layout/CompactFooter";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Profile page error:", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <AlertTriangle size={64} style={{ color: "var(--warning)", margin: "0 auto 1.5rem" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            Profile Unavailable
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.5 }}>
            We couldn't load this profile. It may have been removed, or there might be a temporary issue with our servers.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "var(--primary)",
              color: "white",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "var(--radius-full)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
      <CompactFooter />
    </div>
  );
}
