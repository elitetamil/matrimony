"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CompactFooter from "@/components/layout/CompactFooter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Supabase sends the user to this page with #access_token in the hash.
  // The onAuthStateChange listener fires with event=PASSWORD_RECOVERY.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also try to detect if there's an existing session (for direct URL access)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      }
    });

    // Timeout: if no PASSWORD_RECOVERY event within 5s, show error
    const timeout = setTimeout(() => {
      setSessionError((prev) => {
        if (!prev) {
          supabase.auth.getSession().then(({ data }) => {
            if (!data.session) setSessionError(true);
          });
        }
        return prev;
      });
    }, 5000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!password) errs.password = "New password is required.";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(password) && !/[0-9]/.test(password))
      errs.password = "Password must contain at least one uppercase letter or number.";
    if (!confirm) errs.confirm = "Please confirm your new password.";
    else if (confirm !== password) errs.confirm = "Passwords do not match.";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to reset password. Please try again.");
      return;
    }

    setSuccess(true);
    toast.success("Password reset successfully!");
    setTimeout(() => router.push("/login"), 3000);
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
                <div style={{ background: "var(--primary)", padding: "1rem 1.5rem", textAlign: "center" }}>
                  <div
                    style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 0.625rem",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "1.0625rem", margin: 0 }}>
                    Set New Password
                  </h1>
                </div>

                {/* Success state */}
                {success ? (
                  <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
                    <div
                      style={{
                        width: "56px", height: "56px", borderRadius: "50%",
                        background: "var(--primary-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1rem",
                      }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-dark)", margin: "0 0 0.625rem" }}>
                      Password Updated
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", marginBottom: "1.5rem" }}>
                      Your password has been changed. Redirecting you to login…
                    </p>
                    <Link href="/login" className="btn btn-primary" style={{ display: "inline-flex", justifyContent: "center", width: "100%" }}>
                      Go to Login
                    </Link>
                  </div>

                ) : sessionError ? (
                  /* Invalid / expired link */
                  <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
                    <div
                      style={{
                        width: "56px", height: "56px", borderRadius: "50%",
                        background: "#FFF0F0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1rem",
                      }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-dark)", margin: "0 0 0.5rem" }}>
                      Link Expired or Invalid
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                      This password reset link has expired or has already been used. Please request a new one.
                    </p>
                    <Link href="/forgot-password" className="btn btn-primary" style={{ display: "inline-flex", justifyContent: "center", width: "100%" }}>
                      Request New Link
                    </Link>
                  </div>

                ) : !sessionReady ? (
                  /* Loading / waiting for Supabase */
                  <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"
                      style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem", display: "block" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-medium)" }}>
                      Verifying your reset link…
                    </p>
                  </div>

                ) : (
                  /* Password form */
                  <div style={{ padding: "1.5rem" }}>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                      Enter a new password for your Elite Tamil Matrimony account. Use at least 8 characters.
                    </p>

                    <form onSubmit={handleSubmit}>
                      {/* New password */}
                      <div style={{ marginBottom: "1rem" }}>
                        <label className="form-label" htmlFor="rp-password">New Password</label>
                        <div style={{ position: "relative" }}>
                          <input
                            id="rp-password"
                            type={showPw ? "text" : "password"}
                            autoComplete="new-password"
                            className="form-input"
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: "" })); }}
                            style={{ paddingRight: "2.5rem", borderColor: errors.password ? "#D32F2F" : undefined }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                            aria-label={showPw ? "Hide password" : "Show password"}
                          >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.password && (
                          <p role="alert" style={{ fontSize: "0.75rem", color: "#D32F2F", marginTop: "0.25rem" }}>
                            {errors.password}
                          </p>
                        )}
                      </div>

                      {/* Confirm password */}
                      <div style={{ marginBottom: "1.25rem" }}>
                        <label className="form-label" htmlFor="rp-confirm">Confirm New Password</label>
                        <div style={{ position: "relative" }}>
                          <input
                            id="rp-confirm"
                            type={showConfirm ? "text" : "password"}
                            autoComplete="new-password"
                            className="form-input"
                            placeholder="Re-enter your new password"
                            value={confirm}
                            onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" })); }}
                            style={{ paddingRight: "2.5rem", borderColor: errors.confirm ? "#D32F2F" : undefined }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm((v) => !v)}
                            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                          >
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {errors.confirm && (
                          <p role="alert" style={{ fontSize: "0.75rem", color: "#D32F2F", marginTop: "0.25rem" }}>
                            {errors.confirm}
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              style={{ animation: "spin 1s linear infinite" }}>
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            Updating…
                          </span>
                        ) : "Update Password"}
                      </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                      <Link href="/login" style={{ fontSize: "0.8125rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                        Back to Login
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <CompactFooter />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-page)" }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
