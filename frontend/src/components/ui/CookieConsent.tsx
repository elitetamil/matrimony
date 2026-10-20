"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "etm_cookie_consent";
const CONSENT_VERSION = "v1"; // bump this to re-show the banner after policy updates

type ConsentStatus = "accepted" | "rejected" | null;

function getStoredConsent(): ConsentStatus {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null; // re-show on policy update
    return parsed.status;
  } catch {
    return null;
  }
}

function storeConsent(status: "accepted" | "rejected"): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ status, version: CONSENT_VERSION, ts: Date.now() }));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // In development, unregister any service worker to avoid stale cached chunks and hydration mismatches
    if (process.env.NODE_ENV !== "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
    }

    const consent = getStoredConsent();
    if (consent === null) {
      // Small delay so it doesn't flash immediately on first render
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    storeConsent("accepted");
    setVisible(false);
    // Register service worker for offline caching only in production
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration is optional — fail silently
      });
    }
  };

  const handleReject = () => {
    storeConsent("rejected");
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 9998,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie consent"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "#fff",
          borderTop: "3px solid var(--primary)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          padding: "1.25rem 1.5rem",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }} aria-hidden="true">🍪</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 0.375rem", fontWeight: 700, fontSize: "1rem", color: "var(--text-dark)" }}>
                We use cookies &amp; local storage
              </p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-medium)", lineHeight: 1.6 }}>
                We use <strong>essential cookies</strong> to keep you logged in and protect your account security
                (rate-limiting). With your permission, we also cache the app layout offline so pages load faster
                on your next visit. No cookie data is ever sold to third parties.
              </p>
            </div>
          </div>

          {/* Expandable details */}
          <div>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "0.8125rem",
                color: "var(--primary)",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "var(--font-sans)",
              }}
            >
              {expanded ? "▲ Hide details" : "▼ What cookies do we use?"}
            </button>

            {expanded && (
              <div
                style={{
                  marginTop: "0.75rem",
                  background: "var(--bg-light)",
                  borderRadius: "8px",
                  padding: "1rem",
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                  color: "var(--text-dark)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                <div>
                  <strong>✅ Essential (always active)</strong>
                  <ul style={{ margin: "0.25rem 0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <li><code style={{ background: "#e5e7eb", padding: "0 3px", borderRadius: "3px" }}>auth tokens</code> — keeps you signed in securely</li>
                    <li><code style={{ background: "#e5e7eb", padding: "0 3px", borderRadius: "3px" }}>etm_cookie_consent</code> — remembers your cookie choice</li>
                    <li><code style={{ background: "#e5e7eb", padding: "0 3px", borderRadius: "3px" }}>etm_rl_pw_*</code> — tracks failed logins to block brute-force attacks</li>
                  </ul>
                </div>
                <div>
                  <strong>⚙️ Optional (only with your consent)</strong>
                  <ul style={{ margin: "0.25rem 0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <li>Service Worker offline cache — stores the app shell &amp; layout for faster loads</li>
                    <li>Analytics — anonymous page-view data to help us improve the Platform</li>
                  </ul>
                </div>
                <p style={{ margin: 0 }}>
                  Read our full{" "}
                  <Link href="/privacy-policy#cookies" style={{ color: "var(--primary)", fontWeight: 600 }}>
                    Cookie Policy
                  </Link>
                  .
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              id="cookie-accept-btn"
              onClick={handleAccept}
              className="btn btn-primary"
              style={{ minWidth: "160px", justifyContent: "center" }}
            >
              Accept All Cookies
            </button>
            <button
              id="cookie-reject-btn"
              onClick={handleReject}
              style={{
                minWidth: "160px",
                padding: "0.625rem 1.25rem",
                background: "transparent",
                border: "1.5px solid var(--border-color)",
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-medium)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--text-medium)";
                e.currentTarget.style.color = "var(--text-dark)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-medium)";
              }}
            >
              Essential Only
            </button>
            <Link
              href="/privacy-policy"
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                textDecoration: "underline",
                display: "flex",
                alignItems: "center",
                paddingLeft: "0.25rem",
              }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
