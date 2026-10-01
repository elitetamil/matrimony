"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import CompactFooter from "@/components/layout/CompactFooter";
import {
  Check, Lock, Shield, Star, Award, Crown, ChevronLeft,
  AlertCircle, X, Mail, Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/auth-store";
import { cacheActivePlan } from "@/hooks/useMembership";

// ── Razorpay window type augmentation ──────────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: any) => { open(): void; on(event: string, cb: (res: any) => void): void };
  }
}

// ── Plan configuration ──────────────────────────────────────────────────────
const PLAN_CONFIG = {
  Gold: {
    name: "Gold",
    price: 3999,
    period: "3 months",
    description: "Valid for 3 months",
    gradient: "linear-gradient(135deg, #C8973A 0%, #E8C060 50%, #C8973A 100%)",
    icon: <Star size={22} />,
    features: [
      "Valid for 3 months",
      "View 40 Phone Nos",
      "Send unlimited messages",
      "Unlimited horoscope views",
    ],
  },
  PrimeGold: {
    name: "Prime Gold",
    price: 4999,
    period: "3 months",
    description: "Valid for 3 months",
    gradient: "var(--gradient-hero)",
    icon: <Crown size={22} />,
    features: [
      "Valid for 3 months",
      "View unlimited Phone Nos*",
      "Send unlimited messages",
      "Unlimited horoscope views",
      "View verified profiles with photos",
    ],
  },
  PrimeTillUMarry: {
    name: "Prime Till U Marry",
    price: 8999,
    period: "12 months",
    description: "Longest validity plan",
    gradient: "linear-gradient(135deg, #6B1A2A 0%, #C8973A 100%)",
    icon: <Sparkles size={22} />,
    features: [
      "Longest validity plan",
      "View unlimited Phone Nos*",
      "Send unlimited messages",
      "Unlimited horoscope views",
      "View verified profiles with photos",
    ],
  },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

// ── Inline Email OTP Gate ────────────────────────────────────────────────────
function EmailGate({ onVerified }: { onVerified: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSecs, setResendSecs] = useState(0);
  const { user } = useAuth();

  const startTimer = () => {
    setResendSecs(60);
    const id = setInterval(() => {
      setResendSecs(s => { if (s <= 1) { clearInterval(id); return 0; } return s - 1; });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRe.test(email)) {
      setError("Please enter a valid email address."); return;
    }
    setSending(true); setError(null);
    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: user?.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send OTP.");
      setOtpSent(true);
      startTimer();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally { setSending(false); }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    setVerifying(true); setError(null);
    try {
      const res = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed.");
      onVerified(email.trim());
    } catch (e: unknown) {
      setError((e as Error).message);
      setOtp("");
    } finally { setVerifying(false); }
  };

  return (
    <div style={{
      background: "#fff",
      border: "2px solid var(--primary)",
      borderRadius: "var(--radius-xl)",
      padding: "1.75rem 1.5rem",
      marginBottom: "1.5rem",
      boxShadow: "0 4px 24px rgba(107,26,42,0.10)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "var(--gradient-hero)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Mail size={16} color="#fff" />
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: "0.9375rem", color: "var(--text-dark)", margin: 0 }}>
            Email Required Before Payment
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
            We need a verified email to send your payment confirmation and membership details.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", background: "#FFF5F5", border: "1px solid #FFCDD2", borderRadius: "var(--radius-md)", padding: "0.5rem 0.75rem", marginBottom: "0.875rem", color: "#C62828", fontSize: "0.8125rem" }}>
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: "1px" }} />
          <span>{error}</span>
        </div>
      )}

      {!otpSent ? (
        <>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: "0.375rem" }}>
            Your Email Address <span style={{ color: "var(--primary)" }}>*</span>
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              onKeyDown={e => { if (e.key === "Enter") handleSendOtp(); }}
              style={{
                flex: "1 1 200px",
                padding: "0.6875rem 1rem",
                border: "1.5px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                fontFamily: "var(--font-sans)",
                outline: "none",
              }}
            />
            <button
              onClick={handleSendOtp}
              disabled={sending}
              className="btn btn-primary"
              style={{ whiteSpace: "nowrap", opacity: sending ? 0.7 : 1, cursor: sending ? "not-allowed" : "pointer", flex: "0 0 auto", minWidth: "120px" }}
            >
              {sending ? "Sending…" : "Send OTP"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.875rem" }}>
            <Mail size={13} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--text-medium)" }}>
              OTP sent to <strong>{email}</strong>
            </span>
            <button
              onClick={() => { setOtpSent(false); setOtp(""); setError(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-sans)", padding: 0, marginLeft: "4px" }}
            >
              Change
            </button>
          </div>

          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-dark)", marginBottom: "0.5rem" }}>
            Enter 6-digit OTP
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {[0,1,2,3,4,5].map(i => (
                <input
                  key={i}
                  id={`payment-otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "");
                    const arr = otp.split("");
                    arr[i] = val;
                    const next = arr.join("").slice(0, 6);
                    setOtp(next);
                    setError(null);
                    if (val && i < 5) (document.getElementById(`payment-otp-${i+1}`) as HTMLInputElement)?.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === "Backspace" && !otp[i] && i > 0)
                      (document.getElementById(`payment-otp-${i-1}`) as HTMLInputElement)?.focus();
                  }}
                  style={{
                    width: "40px", height: "44px",
                    textAlign: "center", fontSize: "1.25rem", fontWeight: 800,
                    border: `2px solid ${otp[i] ? "var(--primary)" : "var(--border-color)"}`,
                    borderRadius: "var(--radius-md)",
                    background: otp[i] ? "var(--primary-light)" : "#fff",
                    color: "var(--primary)", outline: "none",
                    fontFamily: "var(--font-sans)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleVerify}
              disabled={verifying || otp.length !== 6}
              className="btn btn-primary"
              style={{ marginLeft: "4px", opacity: (verifying || otp.length !== 6) ? 0.6 : 1, cursor: (verifying || otp.length !== 6) ? "not-allowed" : "pointer" }}
            >
              {verifying ? "Verifying…" : "Verify"}
            </button>
          </div>

          <div style={{ marginTop: "0.625rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Didn&apos;t receive it?</span>
            <button
              onClick={() => { if (resendSecs === 0) { setOtp(""); handleSendOtp(); } }}
              disabled={resendSecs > 0}
              style={{ background: "none", border: "none", cursor: resendSecs > 0 ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: 700, color: resendSecs > 0 ? "var(--text-muted)" : "var(--primary)", fontFamily: "var(--font-sans)" }}
            >
              {resendSecs > 0 ? `Resend in ${resendSecs}s` : "Resend OTP"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main payment form ────────────────────────────────────────────────────────
function PaymentForm({ planKey }: { planKey: PlanKey }) {
  const plan = PLAN_CONFIG[planKey];
  const router = useRouter();
  const { user, setUser, refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const razorpayScriptLoaded = useRef(false);

  // Email gate state — null = not verified yet
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(
    user?.email && !user.email.endsWith("@etm.app") ? user.email : null
  );

  const gst = Math.round(plan.price * 0.18);
  const total = plan.price + gst;
  const amountInPaise = total * 100;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleEmailVerified = async (email: string) => {
    setVerifiedEmail(email);
    // Persist to Supabase profile immediately
    if (user?.id) {
      try {
        const updated = await updateProfile(user.id, { email });
        setUser(updated);
      } catch { /* non-fatal */ }
    }
  };

  const handlePayNow = async () => {
    if (!verifiedEmail) {
      setError("Please verify your email address before proceeding to payment.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      setError("Payment gateway failed to load. Please check your internet connection or disable adblockers, then try again.");
      setSubmitting(false);
      return;
    }

    // STEP 1: Create Razorpay order
    let orderData: { order_id: string; amount: number; currency: string };
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInPaise, planKey }),
      });
      if (!res.ok) { const b = await res.json(); throw new Error(b.error ?? "Failed to create order."); }
      orderData = await res.json();
    } catch (err: unknown) {
      setError((err as Error).message ?? "Could not reach payment server. Please try again.");
      setSubmitting(false);
      return;
    }

    // STEP 2: Open Razorpay modal
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Elite Tamil Matrimony",
      description: `${plan.name} Membership — ${plan.period}`,
      order_id: orderData.order_id,
      prefill: {
        name: user?.name ?? "",
        email: verifiedEmail,
        contact: user?.mobile ?? "",
      },
      theme: { color: "#6B1A2A" },
      modal: {
        ondismiss: () => {
          setSubmitting(false);
          setError("Payment was cancelled. You can try again.");
        },
      },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        // STEP 3: Verify signature + send confirmation email
        try {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planKey,
              userId: user?.id,
              userEmail: verifiedEmail,
              userName: user?.name,
              amountPaid: orderData.amount,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.error ?? "Signature verification failed.");

          // ── STEP 4: Immediately activate plan client-side ─────────────────
          // Calculate expiry
          const months = planKey === "PrimeTillUMarry" ? 12 : 3;
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + months);
          const expiryIso = expiry.toISOString();

          // 1. Write to localStorage cache FIRST (survives refresh() race)
          if (user?.id) cacheActivePlan(user.id, planKey, expiryIso);

          // 2. Update in-memory user state with full plan info
          if (user) {
            setUser({
              ...user,
              isPremium: true,
              membershipPlan: planKey,
              membershipExpiry: expiryIso,
              email: verifiedEmail ?? user.email,
            });
          }

          // 3. Show success screen immediately — don't wait for DB sync
          setSuccess(true);

          // 4. Background DB refresh (non-blocking — UI already updated above)
          setTimeout(() => { refresh().catch(() => {}); }, 1500);
        } catch (verifyErr: unknown) {
          const e = verifyErr as Error;
          setError(`Payment received but verification failed: ${e.message}. Contact support@elitetamilmatrimony.com with ID: ${response.razorpay_payment_id}`);
        } finally { setSubmitting(false); }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp: { error: { description: string; reason: string } }) => {
      setError(`Payment failed: ${resp.error.description} (${resp.error.reason}). Please try again.`);
      setSubmitting(false);
    });
    rzp.open();
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "3rem 2rem", textAlign: "center", maxWidth: "480px", margin: "0 auto", boxShadow: "0 8px 32px rgba(107,26,42,0.12)" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 4px 20px rgba(107,26,42,0.3)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: "0.5rem" }}>Payment Successful!</h2>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: plan.gradient, color: "#fff", padding: "0.375rem 1.25rem", borderRadius: "var(--radius-full)", fontSize: "0.875rem", fontWeight: 700, margin: "0 auto 1rem" }}>
          {plan.icon}{plan.name} Member
        </div>
        <p style={{ color: "var(--text-medium)", marginBottom: "0.375rem", fontSize: "0.9375rem" }}>Your <strong>{plan.name}</strong> plan is now active.</p>
        {verifiedEmail && (
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
            A confirmation email has been sent to <strong>{verifiedEmail}</strong>.
          </p>
        )}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/")} className="btn" style={{ border: "1.5px solid var(--primary)", color: "var(--primary)", background: "#fff" }}>Go to Dashboard</button>
          <button onClick={() => router.push("/matches")} className="btn btn-primary" style={{ display: "inline-flex", justifyContent: "center" }}>Start Finding Matches</button>
        </div>
      </div>
    );
  }

  // ── Payment form ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Email gate — shown if no verified email */}
      {!verifiedEmail && <EmailGate onVerified={handleEmailVerified} />}

      {/* Email verified badge */}
      {verifiedEmail && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#F0FBF4", border: "1px solid #A5D6A7", borderRadius: "var(--radius-lg)", padding: "0.625rem 1rem", marginBottom: "1.25rem" }}>
          <Check size={14} style={{ color: "#2E7D32", flexShrink: 0 }} />
          <span style={{ fontSize: "0.8125rem", color: "#2E7D32", fontWeight: 600 }}>
            Email verified: <strong>{verifiedEmail}</strong>. Confirmation will be sent here.
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", background: "#FFF5F5", border: "1.5px solid #FFCDD2", borderRadius: "var(--radius-lg)", padding: "0.875rem 1rem", marginBottom: "1.25rem", color: "#C62828", fontSize: "0.875rem", lineHeight: 1.5 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C62828", padding: 0 }} aria-label="Dismiss error"><X size={14} /></button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px, 380px)", gap: "1.5rem", alignItems: "flex-start" }} className="payment-grid">
        {/* Left: What you get */}
        <div>
          <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "1.5rem", marginBottom: "1.25rem" }}>
            <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "1rem" }}>Secure Checkout via Razorpay</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", lineHeight: 1.6, marginBottom: "1.25rem" }}>Click <strong>Pay Securely</strong> to open the Razorpay payment window. You can pay using:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1.25rem" }}>
              {[{ label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay" }, { label: "UPI", sub: "GPay, PhonePe, BHIM" }, { label: "Net Banking", sub: "All major Indian banks" }, { label: "Wallets", sub: "Paytm, Amazon Pay" }].map(m => (
                <div key={m.label} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.625rem 0.875rem", background: "var(--bg-page)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--text-dark)" }}>{m.label}</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "2px" }}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
              {[{ icon: <Shield size={13} style={{ color: "var(--success)" }} />, text: "256-bit SSL" }, { icon: <Lock size={13} style={{ color: "var(--success)" }} />, text: "PCI DSS Compliant" }, { icon: <Check size={13} style={{ color: "var(--success)" }} />, text: "RBI Regulated" }].map(b => (
                <div key={b.text} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--text-muted)" }}>{b.icon} {b.text}</div>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "1.25rem" }}>
            <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "0.75rem" }}>{plan.name} — What&apos;s included</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <Check size={13} style={{ color: "var(--success)", flexShrink: 0, marginTop: "2px", strokeWidth: 2.5 }} />
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Order Summary + CTA */}
        <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", overflow: "hidden", position: "sticky", top: "80px" }}>
          <div style={{ background: plan.gradient, padding: "1.5rem", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{plan.icon}</div>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Selected Plan</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 800 }}>{plan.name}</div>
              </div>
            </div>
            <div style={{ fontSize: "0.8125rem", opacity: 0.8 }}>{plan.description}</div>
          </div>

          <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.375rem" }}><span>Plan Price</span><span>₹{plan.price.toLocaleString("en-IN")}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.375rem" }}><span>GST (18%)</span><span>₹{gst.toLocaleString("en-IN")}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1rem", color: "var(--text-dark)", paddingTop: "0.375rem", borderTop: "1px solid var(--border-light)", marginTop: "0.375rem" }}><span>Total</span><span>₹{total.toLocaleString("en-IN")}</span></div>
          </div>

          <div style={{ padding: "1rem 1.25rem" }}>
            <button
              id="razorpay-pay-button"
              type="button"
              onClick={handlePayNow}
              disabled={submitting || !verifiedEmail}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", opacity: (submitting || !verifiedEmail) ? 0.7 : 1, cursor: (submitting || !verifiedEmail) ? "not-allowed" : "pointer" }}
            >
              {submitting ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }} aria-hidden="true"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Processing...</>
              ) : !verifiedEmail ? (
                <><Mail size={14} />Verify Email to Continue</>
              ) : (
                <><Lock size={14} />Pay ₹{total.toLocaleString("en-IN")} Securely</>
              )}
            </button>
            {!verifiedEmail && (
              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.5rem" }}>
                Verify your email above to enable payment
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", marginTop: "0.75rem" }}>
              <Shield size={12} style={{ color: "var(--success)" }} />
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>Powered by Razorpay · 256-bit SSL encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Page with Suspense wrapper ──────────────────────────────────────────────
function PaymentPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planParam = searchParams.get("plan") as PlanKey | null;
  const validPlan = planParam && planParam in PLAN_CONFIG ? planParam : null;

  if (!validPlan) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <p style={{ color: "var(--text-medium)", marginBottom: "1rem" }}>No valid plan selected. Please choose a plan from our membership page.</p>
        <button onClick={() => router.push("/membership")} className="btn btn-primary" style={{ display: "inline-flex", justifyContent: "center" }}>View Membership Plans</button>
      </div>
    );
  }

  const plan = PLAN_CONFIG[validPlan];
  return (
    <main style={{ background: "var(--bg-page)", minHeight: "calc(100vh - 120px)", padding: "2rem 0" }}>
      <div className="container">
        <div style={{ marginBottom: "1.75rem" }}>
          <BackButton label="Back to Plans" style={{ marginBottom: "0.875rem", padding: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>Complete Your {plan.name} Purchase</h1>
            <div style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", background: "var(--primary-light)", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 700 }}>{plan.period}</div>
          </div>
          <p style={{ color: "var(--text-medium)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{plan.description}</p>
        </div>
        <PaymentForm planKey={validPlan} />
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "var(--text-medium)" }}>Loading...</p></div>}>
        <PaymentPageInner />
      </Suspense>
      <CompactFooter />
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .payment-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
