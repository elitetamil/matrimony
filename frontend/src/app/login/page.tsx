"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Eye, EyeOff, AlertCircle, ChevronRight, Timer } from "lucide-react";
import toast from "react-hot-toast";
import { loginWithPassword, getProfilesByMobile, getProfilesByEmail, loginWithOtpSession, loginToProfile, type RegisteredUser } from "@/lib/auth-store";
import { checkRateLimit, recordFailedAttempt, clearRateLimit, formatCountdown } from "@/lib/rate-limit";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useMSG91, CAPTCHA_DIV_ID } from "@/hooks/useMSG91";
import { validateEmail } from "@/lib/email-validator";

// Detect if input is an email or phone number
function detectInputType(value: string): "email" | "phone" | "unknown" {
  if (value.includes("@")) return "email";
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) return "phone";
  return "unknown";
}

// ── OTP Resend Cooldown ───────────────────────────────────────────────────────
// Cooldown sequence: 30s, 60s, 120s, 240s, …  (doubles each attempt)
const OTP_RESEND_BASE_COOLDOWN = 30; // seconds

function getOtpCooldownState(sessionKey: string): { sendCount: number; unlocksAt: number } {
  if (typeof sessionStorage === "undefined") return { sendCount: 0, unlocksAt: 0 };
  try {
    const raw = sessionStorage.getItem(sessionKey);
    if (!raw) return { sendCount: 0, unlocksAt: 0 };
    return JSON.parse(raw);
  } catch {
    return { sendCount: 0, unlocksAt: 0 };
  }
}

function setOtpCooldownState(sessionKey: string, sendCount: number, cooldownSec: number): void {
  if (typeof sessionStorage === "undefined") return;
  const unlocksAt = Date.now() + cooldownSec * 1000;
  sessionStorage.setItem(sessionKey, JSON.stringify({ sendCount, unlocksAt }));
}

function computeCooldownSec(sendCount: number): number {
  // 1st send → 30s, 2nd → 60s, 3rd → 120s…
  return OTP_RESEND_BASE_COOLDOWN * Math.pow(2, sendCount - 1);
}

// ── Profile Picker ────────────────────────────────────────────────────────────
function ProfilePicker({
  profiles,
  identifier,
  onSelect,
  loading,
}: {
  profiles: RegisteredUser[];
  identifier: string;
  onSelect: (profileId: string) => void;
  loading: boolean;
}) {
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        <div
          style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "var(--primary-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 0.75rem",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8">
            <circle cx="9" cy="7" r="4" /><path d="M3 21v-2c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v2" />
            <circle cx="17" cy="7" r="3" /><path d="M21 21v-2c0-1.7-1-3.2-2.5-3.8" />
          </svg>
        </div>
        <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-dark)", margin: "0 0 0.25rem" }}>
          Multiple Profiles Found
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-medium)" }}>
          {profiles.length} profiles registered with <strong>{identifier}</strong>
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          Select the profile you want to log in with
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {profiles.map((p) => {
          const age = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 0.875rem",
                background: "#fff",
                border: "1.5px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                cursor: loading ? "wait" : "pointer",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
                transition: "border-color 0.15s, box-shadow 0.15s",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(107,26,42,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" opacity="0.6">
                    <circle cx="12" cy="7" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)" }}>{p.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-medium)", marginTop: "1px" }}>
                  {[age > 0 ? `${age} yrs` : null, p.gender === "male" ? "Male" : p.gender === "female" ? "Female" : null, p.caste, p.city].filter(Boolean).join(" • ")}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "1px" }}>
                  Profile for {p.profileFor || "Self"} • ID: {p.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Login Content ────────────────────────────────────────────────────────
function LoginContent() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillMobile = searchParams.get("mobile") || "";
  const msg91 = useMSG91();

  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  const [mode, setMode] = useState<"otp" | "password">("otp");

  // OTP mode state
  const [otpIdentifier, setOtpIdentifier] = useState(prefillMobile);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpType, setOtpType] = useState<"email" | "phone">("phone");

  // OTP resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const OTP_SESSION_KEY = `etm_otp_resend_${otpIdentifier.trim()}`;

  // Restore cooldown from sessionStorage only after OTP has been sent
  // (not on initial mount with otpSent=false, to avoid stale empty-key issues)
  useEffect(() => {
    if (!otpSent) return; // only run when OTP was actually sent
    const state = getOtpCooldownState(OTP_SESSION_KEY);
    const remaining = Math.max(0, Math.ceil((state.unlocksAt - Date.now()) / 1000));
    if (remaining > 0) startResendCountdown(remaining);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpSent]);

  function startResendCountdown(seconds: number) {
    if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
    setResendCooldown(seconds);
    resendIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(resendIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // Cleanup interval on unmount
  useEffect(() => () => { if (resendIntervalRef.current) clearInterval(resendIntervalRef.current); }, []);

  // Password mode state
  const [pwIdentifier, setPwIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password rate limit state
  const [pwLocked, setPwLocked] = useState(false);
  const [pwLockRemaining, setPwLockRemaining] = useState(0);
  const pwLockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check rate limit when password tab opens or identifier changes
  useEffect(() => {
    if (mode !== "password" || !pwIdentifier) return;
    const rl = checkRateLimit(pwIdentifier);
    if (!rl.allowed) {
      startPwLockCountdown(rl.remainingMs);
    } else {
      setPwLocked(false);
      setPwLockRemaining(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pwIdentifier]);

  // Also check on mount from cookies
  useEffect(() => {
    if (mode === "password" && pwIdentifier) {
      const rl = checkRateLimit(pwIdentifier);
      if (!rl.allowed) startPwLockCountdown(rl.remainingMs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPwLockCountdown(remainingMs: number) {
    if (pwLockIntervalRef.current) clearInterval(pwLockIntervalRef.current);
    setPwLocked(true);
    setPwLockRemaining(remainingMs);
    pwLockIntervalRef.current = setInterval(() => {
      setPwLockRemaining((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(pwLockIntervalRef.current!);
          setPwLocked(false);
          return 0;
        }
        return next;
      });
    }, 1000);
  }

  useEffect(() => () => { if (pwLockIntervalRef.current) clearInterval(pwLockIntervalRef.current); }, []);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [multiProfiles, setMultiProfiles] = useState<RegisteredUser[] | null>(null);
  const [notRegistered, setNotRegistered] = useState<string | null>(null); // identifier when not found
  const [otpError, setOtpError] = useState<string | null>(null); // inline OTP field error

  function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
      <p style={{ fontSize: "0.75rem", color: "#D32F2F", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "4px" }} role="alert">
        <AlertCircle size={12} aria-hidden="true" />
        {msg}
      </p>
    );
  }

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const executeSendOtp = async (val: string) => {
    if (!val) {
      setFieldErrors((p) => ({ ...p, otpId: "Please enter your email or mobile number." }));
      return;
    }

    const type = detectInputType(val);
    if (type === "unknown") {
      setFieldErrors((p) => ({ ...p, otpId: "Enter a valid email address or 10-digit mobile number." }));
      return;
    }

    if (type === "phone") {
      const digits = val.replace(/\D/g, "");
      if (digits.length !== 10) {
        setFieldErrors((p) => ({ ...p, otpId: "Mobile number must be exactly 10 digits." }));
        return;
      }
    }

    setFieldErrors({});
    setLoading(true);
    setOtpType(type);

    if (type === "email") {
      const emailValidation = validateEmail(val);
      if (!emailValidation.valid) {
        const msg = emailValidation.error || "Please enter a valid Gmail address.";
        setFieldErrors((p) => ({ ...p, otpId: msg }));
        toast.error(msg);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/send-email-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: val.trim() }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to send OTP. Please try again.");
          setLoading(false);
          return;
        }
        toast.success(`OTP sent to ${val}`);
      } catch {
        toast.error("Network error. Please try again.");
        setLoading(false);
        return;
      }
    } else {
      if (msg91.initError) {
        toast.error(
          msg91.initError.includes("not configured")
            ? "SMS OTP is not configured. Please add MSG91 credentials to .env.local or sign in with Email OTP / Password."
            : msg91.initError
        );
        setLoading(false);
        return;
      }
      const digits = val.replace(/\D/g, "");
      const phone = digits.length === 10 ? `91${digits}` : digits;
      const result = await msg91.sendOtp(phone);
      if (!result.success) {
        toast.error(result.error ?? "Failed to send OTP. Please try again.");
        setLoading(false);
        return;
      }
      const displayDigits = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
      toast.success(`OTP sent to +91 ${displayDigits}`);
    }

    // Record the send and start cooldown
    const state = getOtpCooldownState(OTP_SESSION_KEY);
    const newSendCount = state.sendCount + 1;
    const cooldownSec = computeCooldownSec(newSendCount);
    setOtpCooldownState(OTP_SESSION_KEY, newSendCount, cooldownSec);
    startResendCountdown(cooldownSec);

    setLoading(false);
    setOtpSent(true);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeSendOtp(otpIdentifier.trim());
  };

  // Auto-send OTP if autosend=true in search params
  const autosend = searchParams.get("autosend") === "true";
  const autosendTriggered = useRef(false);
  useEffect(() => {
    if (autosend && prefillMobile && !autosendTriggered.current) {
      autosendTriggered.current = true;
      executeSendOtp(prefillMobile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosend, prefillMobile]);

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    if (otpType === "phone") {
      const result = await msg91.retryOtp(null);
      if (!result.success) {
        toast.error(result.error ?? "Failed to resend OTP.");
        return;
      }
      toast.success("OTP resent successfully.");
    } else {
      // Email resend — re-call send OTP endpoint
      const emailValidation = validateEmail(otpIdentifier);
      if (!emailValidation.valid) {
        toast.error(emailValidation.error || "Please enter a valid Gmail address.");
        return;
      }
      try {
        const res = await fetch("/api/send-email-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: otpIdentifier.trim() }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Failed to resend OTP."); return; }
        toast.success("OTP resent to your email.");
      } catch {
        toast.error("Network error. Please try again.");
        return;
      }
    }

    // Increment cooldown
    const state = getOtpCooldownState(OTP_SESSION_KEY);
    const newSendCount = state.sendCount + 1;
    const cooldownSec = computeCooldownSec(newSendCount);
    setOtpCooldownState(OTP_SESSION_KEY, newSendCount, cooldownSec);
    startResendCountdown(cooldownSec);
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }
    setOtpError(null);
    setLoading(true);

    if (otpType === "phone") {
      const verifyResult = await msg91.verifyOtp(otp);
      if (!verifyResult.success) {
        setLoading(false);
        setOtpError(verifyResult.error ?? "Incorrect OTP. Please try again.");
        return;
      }
      if (verifyResult.accessToken) {
        try {
          const tokenRes = await fetch("/api/verify-msg91-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: verifyResult.accessToken }),
          });
          const tokenData = await tokenRes.json();
          if (!tokenRes.ok) {
            setLoading(false);
            toast.error(tokenData.error ?? "OTP verification failed. Please try again.");
            return;
          }
        } catch {
          setLoading(false);
          toast.error("Network error during verification. Please try again.");
          return;
        }
      }
      const digits = otpIdentifier.replace(/\D/g, "");
      const profiles = await getProfilesByMobile(digits);
      if (profiles.length === 0) {
        setLoading(false);
        setNotRegistered(otpIdentifier.trim());
        return;
      }
      if (profiles.length === 1) {
        const res = await fetch("/api/otp-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: profiles[0].id }),
        });
        const loginData = await res.json();
        if (!res.ok) {
          setLoading(false);
          toast.error(loginData.error || "Login failed. Please try again.");
          return;
        }
        const result = await loginWithOtpSession(loginData.access_token, loginData.refresh_token);
        setLoading(false);
        if (!result) { toast.error("Login failed. Please try again or re-register."); return; }
        setUser(result);
        toast.success("Login successful!");
        router.push("/");
        return;
      }
      setLoading(false);
      setMultiProfiles(profiles);
      return;
    }

    // Email OTP verify
    try {
      const res = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpIdentifier.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        toast.error(data.error || "OTP verification failed.");
        return;
      }
    } catch {
      setLoading(false);
      toast.error("Network error. Please try again.");
      return;
    }

    const profiles = await getProfilesByEmail(otpIdentifier.trim());
    if (profiles.length === 0) {
      setLoading(false);
      setNotRegistered(otpIdentifier.trim());
      return;
    }
    if (profiles.length === 1) {
      const targetId = profiles[0].id;
      const res = await fetch("/api/otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: targetId }),
      });
      const loginData = await res.json();
      if (res.ok && loginData.access_token) {
        const result = await loginWithOtpSession(loginData.access_token, loginData.refresh_token);
        if (result) {
          setLoading(false);
          setUser(result);
          toast.success("Login successful!");
          router.push("/");
          return;
        }
      }

      // Fallback: client-side session login for legacy profiles
      const fallbackUser = await loginToProfile(targetId);
      setLoading(false);
      if (fallbackUser) {
        setUser(fallbackUser);
        toast.success("Login successful!");
        router.push("/");
        return;
      }

      toast.error(loginData.error || "Login failed. Please try again.");
      return;
    }
    setLoading(false);
    setMultiProfiles(profiles);
  };

  const handleSelectProfile = async (profileId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      const tokenData = await res.json();
      if (res.ok && tokenData.access_token) {
        const result = await loginWithOtpSession(tokenData.access_token, tokenData.refresh_token);
        if (result) {
          setUser(result);
          toast.success("Login successful!");
          router.push("/");
          return;
        }
      }

      // Fallback: Use client-side profile login handler (works even without service role key)
      const fallbackUser = await loginToProfile(profileId);
      if (fallbackUser) {
        setUser(fallbackUser);
        toast.success("Login successful!");
        router.push("/");
        return;
      }

      toast.error(tokenData.error || "Login failed. Please try again.");
    } catch {
      toast.error("Failed to login to this profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Password login with rate limiting ─────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit first
    const rl = checkRateLimit(pwIdentifier);
    if (!rl.allowed) {
      startPwLockCountdown(rl.remainingMs);
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!pwIdentifier) {
      newErrors.email = "Email or mobile number is required.";
    } else if (pwIdentifier.includes("@")) {
      const emailValidation = validateEmail(pwIdentifier);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error || "Please enter a valid Gmail address.";
      }
    }
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (Object.keys(newErrors).length > 0) { setFieldErrors((p) => ({ ...p, ...newErrors })); return; }

    setLoading(true);
    const loggedIn = await loginWithPassword(pwIdentifier, password);
    setLoading(false);

    if (!loggedIn) {
      // Record failed attempt
      const result = recordFailedAttempt(pwIdentifier);
      if (!result.allowed) {
        startPwLockCountdown(result.remainingMs);
        toast.error(`Too many failed attempts. Please wait 5 minutes before trying again.`);
      } else {
        const attemptsLeft = 5 - result.attempts;
        toast.error(
          attemptsLeft > 0
            ? `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before lockout.`
            : "Invalid credentials. Check your email / mobile and password."
        );
      }
      return;
    }

    // Success — clear rate limit
    clearRateLimit(pwIdentifier);
    setUser(loggedIn);
    toast.success("Login successful!");
    router.push("/");
  };

  // Build redirect URL for "Create Account" with prefilled identifier
  const buildRegisterUrl = (identifier: string) => {
    const isEmail = identifier.includes("@");
    const params = new URLSearchParams(isEmail ? { email: identifier } : { mobile: identifier.replace(/\D/g, "") });
    return `/register?${params.toString()}`;
  };

  const inputType = detectInputType(otpIdentifier);

  return (
    <>
      <div id={CAPTCHA_DIV_ID} style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 0 }} />
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
              <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
                {/* Header */}
                <div style={{ background: "var(--bm-green)", padding: "1rem 1.5rem", textAlign: "center" }}>
                  <h1 style={{ color: "#fff", fontWeight: 700, fontSize: "1.0625rem", margin: 0 }}>Login to Elite Tamil Matrimony</h1>
                </div>

                {multiProfiles ? (
                  <ProfilePicker
                    profiles={multiProfiles}
                    identifier={otpIdentifier || pwIdentifier}
                    onSelect={handleSelectProfile}
                    loading={loading}
                  />
                ) : (
                  <>
                    {/* Tabs */}
                    <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)" }}>
                      {(["otp", "password"] as const).map((m) => (
                        <button key={m} onClick={() => { setMode(m); setOtpSent(false); setFieldErrors({}); }} style={{ flex: 1, padding: "0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--font-sans)", color: mode === m ? "var(--bm-orange)" : "var(--text-medium)", borderBottom: mode === m ? "2px solid var(--bm-orange)" : "2px solid transparent" }}>
                          {m === "otp" ? "Login with OTP" : "Login with Password"}
                        </button>
                      ))}
                    </div>

                    <div style={{ padding: "1.5rem" }}>

                      {/* ── OTP: Step 1 — enter email or phone ── */}
                      {mode === "otp" && !otpSent && (
                        <form onSubmit={handleSendOtp}>
                          <div style={{ marginBottom: "1.125rem" }}>
                            <label className="form-label">Email Address or Mobile Number</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter email or 10-digit mobile"
                              value={otpIdentifier}
                              onChange={(e) => {
                                setOtpIdentifier(e.target.value);
                                setFieldErrors((p) => { const n = { ...p }; delete n.otpId; return n; });
                              }}
                              style={{ borderColor: fieldErrors.otpId ? "#D32F2F" : undefined }}
                            />
                            <FieldError msg={fieldErrors.otpId} />
                            {!fieldErrors.otpId && otpIdentifier && (
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                {inputType === "email" ? "✉️ OTP will be sent to this email address" :
                                  inputType === "phone" ? "📱 OTP will be sent via SMS to this number" :
                                    "Enter a valid email or 10-digit mobile number"}
                              </p>
                            )}
                          </div>
                          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                            {loading ? "Sending..." : "Send OTP"}
                          </button>
                        </form>
                      )}

                      {/* ── OTP: Step 2 — enter OTP ── */}
                      {mode === "otp" && otpSent && !notRegistered && (
                        <form onSubmit={handleVerifyOtp}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-medium)" }}>
                              OTP sent to <strong>{otpType === "phone" ? `+91 ${otpIdentifier.replace(/\D/g, "")}` : otpIdentifier}</strong>
                            </p>
                            <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setOtpError(null); setNotRegistered(null); }} style={{ fontSize: "0.8125rem", color: "var(--bm-orange)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}>Change</button>
                          </div>
                          <div style={{ marginBottom: otpError ? "0.5rem" : "1rem" }}>
                            <label className="form-label">Enter 6-digit OTP</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="- - - - - -"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(null); }}
                              style={{ textAlign: "center", fontSize: "1.125rem", letterSpacing: "0.25em", borderColor: otpError ? "#D32F2F" : undefined, outline: otpError ? "none" : undefined, boxShadow: otpError ? "0 0 0 3px rgba(211,47,47,0.12)" : undefined }}
                              autoFocus
                            />
                            {otpError && (
                              <p style={{ fontSize: "0.75rem", color: "#D32F2F", marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "4px" }} role="alert">
                                <AlertCircle size={13} />
                                {otpError}
                              </p>
                            )}
                          </div>

                          {/* Resend button with cooldown */}
                          <div style={{ textAlign: "right", marginBottom: "1.125rem" }}>
                            {resendCooldown > 0 ? (
                              <span
                                style={{
                                  fontSize: "0.8125rem",
                                  color: "var(--text-muted)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  userSelect: "none",
                                }}
                              >
                                <Timer size={12} />
                                Resend in {Math.floor(resendCooldown / 60)}:{String(resendCooldown % 60).padStart(2, "0")}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResendOtp}
                                style={{ fontSize: "0.8125rem", color: "var(--bm-orange)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>
                          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                            {loading ? "Verifying..." : "Verify & Login"}
                          </button>
                        </form>
                      )}

                      {/* ── Not registered banner ── */}
                      {notRegistered && (
                        <div
                          style={{
                            background: "#FFF8E1",
                            border: "1.5px solid #FFB300",
                            borderRadius: "var(--radius-lg)",
                            padding: "1rem 1.125rem",
                          }}
                          role="alert"
                        >
                          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#7B4F00", margin: "0 0 0.25rem" }}>
                            Account not found
                          </p>
                          <p style={{ fontSize: "0.8125rem", color: "#5D3900", margin: "0 0 0.875rem", lineHeight: 1.5 }}>
                            <strong>{notRegistered}</strong> is not registered with Elite Tamil Matrimony.
                            Would you like to create a new account?
                          </p>
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              onClick={() => router.push(buildRegisterUrl(notRegistered))}
                              className="btn btn-primary"
                              style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                            >
                              Create Account →
                            </button>
                            <button
                              onClick={() => { setNotRegistered(null); setOtpSent(false); setOtp(""); }}
                              style={{ fontSize: "0.875rem", background: "none", border: "1px solid #7B4F00", borderRadius: "var(--radius-full)", color: "#7B4F00", padding: "0.5rem 1rem", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600 }}
                            >
                              Try another number
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── Password login ── */}
                      {mode === "password" && (
                        <form onSubmit={(e) => e.preventDefault()}>
                          {/* Rate-limit lockout banner */}
                          {pwLocked && (
                            <div
                              style={{
                                background: "#FEF2F2",
                                border: "1px solid #FECACA",
                                borderRadius: "8px",
                                padding: "0.875rem 1rem",
                                marginBottom: "1.125rem",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.5rem",
                              }}
                              role="alert"
                            >
                              <Timer size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: "1px" }} />
                              <div>
                                <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.875rem", color: "#DC2626" }}>
                                  Too Many Failed Attempts
                                </p>
                                <p style={{ margin: 0, fontSize: "0.8125rem", color: "#991B1B" }}>
                                  Please wait <strong>{formatCountdown(pwLockRemaining)}</strong> before trying again.
                                </p>
                              </div>
                            </div>
                          )}

                          <div style={{ marginBottom: "1rem" }}>
                            <label className="form-label">Email ID / Mobile Number</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter Email ID or Mobile Number"
                              value={pwIdentifier}
                              onChange={(e) => {
                                setPwIdentifier(e.target.value);
                                if (!e.target.value) setFieldErrors((p) => ({ ...p, email: "Email or mobile is required." }));
                                else if (e.target.value.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) setFieldErrors((p) => ({ ...p, email: "Email is invalid." }));
                                else setFieldErrors((p) => { const n = { ...p }; delete n.email; return n; });
                                // Re-check rate limit when identifier changes
                                if (e.target.value) {
                                  const rl = checkRateLimit(e.target.value);
                                  if (!rl.allowed) startPwLockCountdown(rl.remainingMs);
                                  else { setPwLocked(false); setPwLockRemaining(0); if (pwLockIntervalRef.current) clearInterval(pwLockIntervalRef.current); }
                                }
                              }}
                              style={{ borderColor: fieldErrors.email ? "#D32F2F" : undefined }}
                              disabled={loading}
                            />
                            <FieldError msg={fieldErrors.email} />
                          </div>
                          <div style={{ marginBottom: "0.375rem" }}>
                            <label className="form-label">Password</label>
                            <div style={{ position: "relative" }}>
                              <input
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value);
                                  if (!e.target.value) setFieldErrors((p) => ({ ...p, password: "Password is required." }));
                                  else if (e.target.value.length < 6) setFieldErrors((p) => ({ ...p, password: "Password must be at least 6 characters." }));
                                  else setFieldErrors((p) => { const n = { ...p }; delete n.password; return n; });
                                }}
                                style={{ paddingRight: "2.5rem", borderColor: fieldErrors.password ? "#D32F2F" : undefined }}
                                disabled={loading || pwLocked}
                              />
                              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            <FieldError msg={fieldErrors.password} />
                          </div>
                          <div style={{ textAlign: "right", marginBottom: "1.125rem" }}>
                            <Link href="/forgot-password" style={{ fontSize: "0.8125rem", color: "var(--bm-orange)", textDecoration: "none", fontWeight: 600 }}>Forgot Password?</Link>
                          </div>
                          <button
                            type="button"
                            onClick={handlePasswordLogin}
                            disabled={loading || pwLocked}
                            className="btn btn-primary"
                            style={{ width: "100%", justifyContent: "center", opacity: (loading || pwLocked) ? 0.6 : 1, cursor: (loading || pwLocked) ? "not-allowed" : "pointer" }}
                          >
                            {loading ? "Logging in..." : pwLocked ? `Locked — ${formatCountdown(pwLockRemaining)}` : "Login"}
                          </button>
                        </form>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem 0" }}>
                        <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
                        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>OR</span>
                        <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
                      </div>

                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", marginBottom: "0.75rem" }}>Not registered yet?</p>
                        <Link href="/register" className="btn btn-green" style={{ width: "100%", justifyContent: "center", display: "flex" }}>Register Free</Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Trusted by Tamil Families &nbsp;•&nbsp; 100% Verified Profiles &nbsp;•&nbsp; Secure &amp; Private</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-page)" }} />}>
      <LoginContent />
    </Suspense>
  );
}
