"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = email.trim().toLowerCase();

    if (!val) { setError("Please enter your email address."); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(val)) { setError("Please enter a valid email address."); return; }
    if (val.endsWith("@etm.app")) { setError("Please enter the real email address you registered with."); return; }

    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(val, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      // Do not reveal whether the email exists — show success regardless
      console.error("[forgot-password]", resetError.message);
    }

    // Always show the confirmation screen (security best practice)
    setSent(true);
  };

  return (
    <>
      <Navbar />
      <main
        style={{
          backgroundImage: "linear-gradient(rgba(250, 246, 241, 0.82), rgba(250, 246, 241, 0.82)), url('/images/Bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          minHeight: "calc(100vh - 120px)",
          display: "flex",
          alignItems: "center",
          padding: "2.5rem 0",
        }}
      >
        <div className="container">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: "420px" }}>
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    background: "var(--primary)",
                    padding: "1rem 1.5rem",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 0.625rem",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h1
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      margin: 0,
                    }}
                  >
                    Reset Your Password
                  </h1>
                </div>

                {sent ? (
                  /* ── Confirmation screen ─────────────────────────── */
                  <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "var(--primary-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 1rem",
                      }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <h2
                      style={{
                        fontSize: "1.0625rem",
                        fontWeight: 700,
                        color: "var(--text-dark)",
                        margin: "0 0 0.625rem",
                      }}
                    >
                      Check Your Email
                    </h2>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-medium)",
                        lineHeight: 1.6,
                        margin: "0 0 1.5rem",
                      }}
                    >
                      If an account exists with this email address, you will receive a password reset link shortly. Please check your inbox and spam folder.
                    </p>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                        marginBottom: "1.25rem",
                      }}
                    >
                      The link expires in 10 minutes.
                    </p>
                    <Link
                      href="/login"
                      className="btn btn-primary"
                      style={{ display: "inline-flex", justifyContent: "center", width: "100%" }}
                    >
                      Back to Login
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setSent(false); setEmail(""); }}
                      style={{
                        marginTop: "0.875rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        color: "var(--primary)",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                      }}
                    >
                      Try a different email
                    </button>
                  </div>
                ) : (
                  /* ── Input form ──────────────────────────────────── */
                  <div style={{ padding: "1.5rem" }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-medium)",
                        marginBottom: "1.25rem",
                        lineHeight: 1.6,
                      }}
                    >
                      Enter the email address associated with your Elite Tamil Matrimony account. We will send you a password reset link.
                    </p>

                    <form onSubmit={handleSubmit}>
                      <div style={{ marginBottom: "1.125rem" }}>
                        <label className="form-label" htmlFor="fp-email">
                          Email Address
                        </label>
                        <input
                          id="fp-email"
                          type="email"
                          autoComplete="email"
                          className="form-input"
                          placeholder="Enter your registered email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError("");
                          }}
                          style={{ borderColor: error ? "#D32F2F" : undefined }}
                        />
                        {error && (
                          <p
                            role="alert"
                            style={{
                              fontSize: "0.75rem",
                              color: "#D32F2F",
                              marginTop: "0.25rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {loading ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            Sending…
                          </span>
                        ) : "Send Reset Link"}
                      </button>
                    </form>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        margin: "1rem 0",
                      }}
                    >
                      <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>OR</span>
                      <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <Link
                        href="/login"
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--primary)",
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        Back to Login
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Need help? Contact us at{" "}
                  <a
                    href="mailto:support@elitetamilmatrimony.com"
                    style={{ color: "var(--primary)", textDecoration: "none" }}
                  >
                    support@elitetamilmatrimony.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
