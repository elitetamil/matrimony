"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { useMembership, clearCachedPlan } from "@/hooks/useMembership";
import {
  Check, Star, Sparkles, Award, Shield, Crown, ArrowRight, X,
  AlertTriangle, Phone, Zap,
} from "lucide-react";

const PLANS = [
  {
    name: "Gold",
    label: "Gold",
    tagline: "Great Starter Pack",
    price: "₹3,999",
    originalPrice: "₹5,500",
    discountPct: "27%",
    perMonth: "₹1,333 / month",
    period: "3 months",
    gradient: "linear-gradient(135deg, #B8832A 0%, #E8C060 50%, #B8832A 100%)",
    isPopular: false,
    isBestValue: false,
    href: "/payment?plan=Gold",
    features: [
      { text: "3 months validity", ok: true },
      { text: "40 Phone Number reveals", ok: true },
      { text: "Unlimited messaging", ok: true },
      { text: "Unlimited horoscope views", ok: true },
      { text: "Verified profiles with photos", ok: false },
    ],
  },
  {
    name: "PrimeGold",
    label: "Prime Gold",
    tagline: "Most Popular Choice",
    price: "₹4,999",
    originalPrice: "₹7,900",
    discountPct: "37%",
    perMonth: "₹1,666 / month",
    period: "3 months",
    gradient: "linear-gradient(135deg, #6B1A2A 0%, #9B2D42 100%)",
    isPopular: true,
    isBestValue: false,
    href: "/payment?plan=PrimeGold",
    features: [
      { text: "3 months validity", ok: true },
      { text: "Unlimited Phone Number reveals*", ok: true },
      { text: "Unlimited messaging", ok: true },
      { text: "Unlimited horoscope views", ok: true },
      { text: "Verified profiles with photos", ok: true },
    ],
  },
  {
    name: "PrimeTillUMarry",
    label: "Prime Till U Marry",
    tagline: "Best Value — 12 Months",
    price: "₹8,999",
    originalPrice: "₹23,700",
    discountPct: "62%",
    perMonth: "₹750 / month",
    period: "12 months",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #6B1A2A 50%, #C8973A 100%)",
    isPopular: false,
    isBestValue: true,
    href: "/payment?plan=PrimeTillUMarry",
    features: [
      { text: "12 months validity", ok: true },
      { text: "Unlimited Phone Number reveals*", ok: true },
      { text: "Unlimited messaging", ok: true },
      { text: "Unlimited horoscope views", ok: true },
      { text: "Verified profiles with photos", ok: true },
    ],
  },
];

const PLAN_GRADIENT: Record<string, string> = {
  Gold: "linear-gradient(135deg, #B8832A 0%, #E8C060 50%, #B8832A 100%)",
  PrimeGold: "linear-gradient(135deg, #6B1A2A 0%, #9B2D42 100%)",
  PrimeTillUMarry: "linear-gradient(135deg, #1a1a2e 0%, #6B1A2A 50%, #C8973A 100%)",
};

const PLAN_LABEL: Record<string, string> = {
  Gold: "Gold",
  PrimeGold: "Prime Gold",
  PrimeTillUMarry: "Prime Till U Marry",
};

const COMPARISON_ROWS = [
  { feature: "Profile browsing", gold: "Unlimited", primeGold: "Unlimited", primeTillUMarry: "Unlimited" },
  { feature: "Phone No. reveals", gold: "40 numbers", primeGold: "Unlimited*", primeTillUMarry: "Unlimited*" },
  { feature: "Messages", gold: "Unlimited", primeGold: "Unlimited", primeTillUMarry: "Unlimited" },
  { feature: "Horoscope views", gold: "Unlimited", primeGold: "Unlimited", primeTillUMarry: "Unlimited" },
  { feature: "Verified photos", gold: false, primeGold: true, primeTillUMarry: true },
  { feature: "Validity", gold: "3 months", primeGold: "3 months", primeTillUMarry: "12 months" },
];

function CellValue({ val }: { val: boolean | string }) {
  if (typeof val === "boolean") {
    return val
      ? <div style={{ display: "flex", justifyContent: "center" }}><Check size={16} style={{ color: "#2E7D32", strokeWidth: 2.5 }} /></div>
      : <div style={{ display: "flex", justifyContent: "center" }}><X size={14} style={{ color: "#ccc", strokeWidth: 2 }} /></div>;
  }
  return <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{val}</span>;
}

function ActivePlanDashboard() {
  const { user, setUser, refresh } = useAuth();
  const { planName: hookPlanName, isPremium: hookIsPremium } = useMembership();
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const plan = hookIsPremium ? hookPlanName : null;
  const planConfig = PLANS.find(p => p.name === plan);
  const gradient = PLAN_GRADIENT[plan ?? "Gold"];

  const expiryDate = user?.membershipExpiry ? new Date(user.membershipExpiry) : null;
  const activatedDate = user?.membershipActivated ? new Date(user.membershipActivated) : null;
  const daysLeft = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    if (!user?.id || !plan) return;
    if (daysLeft !== null && daysLeft <= 7 && daysLeft > 0) {
      fetch("/api/notify-expiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    }
  }, [user?.id, plan, daysLeft]);

  const handleCancelPlan = async () => {
    if (!user?.id) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/cancel-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, userName: user.name, planName: plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel membership.");
      if (user) {
        setUser({ ...user, isPremium: false, membershipPlan: null, membershipExpiry: undefined });
        clearCachedPlan();
      }
      setCancelled(true);
      await refresh().catch(() => {});
    } catch (e: unknown) {
      setCancelError((e as Error).message);
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  if (cancelled) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1.5rem", maxWidth: "520px", margin: "0 auto" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#f5f5f5", border: "2px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <Shield size={32} style={{ color: "#999" }} />
        </div>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.75rem" }}>Membership Cancelled</h2>
        <p style={{ color: "#666", marginBottom: "0.5rem", lineHeight: 1.65 }}>
          Your plan has been cancelled and your account reverted to the <strong>Free plan</strong>. All premium benefits have been removed.
        </p>
        <p style={{ fontSize: "0.875rem", color: "#999", marginBottom: "2rem" }}>A cancellation confirmation has been sent to your email.</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/")} className="btn" style={{ border: "1.5px solid var(--primary)", color: "var(--primary)", background: "#fff" }}>Go to Dashboard</button>
          <button onClick={() => setCancelled(false)} className="btn btn-primary" style={{ justifyContent: "center" }}>View Plans</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 1rem 4rem" }}>

      {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
        <div style={{ background: "#FFF8E1", border: "1.5px solid #FFD54F", borderRadius: "12px", padding: "0.875rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <AlertTriangle size={18} style={{ color: "#E65100", flexShrink: 0 }} />
          <p style={{ fontSize: "0.875rem", color: "#7B5800", margin: 0, fontWeight: 600, flex: 1 }}>
            Your {PLAN_LABEL[plan ?? ""] || plan} plan expires in <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong>
            {expiryDate && ` (${formatDate(expiryDate)})`}. Renew now to keep benefits.
          </p>
          <button onClick={() => router.push(`/payment?plan=${plan}`)} className="btn btn-primary" style={{ flexShrink: 0, fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}>Renew</button>
        </div>
      )}

      <div style={{ borderRadius: "20px", overflow: "hidden", boxShadow: "0 8px 40px rgba(107,26,42,0.18)", marginBottom: "1.75rem" }}>
        <div style={{ background: gradient, padding: "1.75rem 1.5rem", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {plan === "Gold" ? <Star size={24} fill="currentColor" /> : plan === "PrimeGold" ? <Crown size={24} /> : <Sparkles size={24} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.6875rem", fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Active Plan</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, lineHeight: 1.2 }}>{planConfig?.label || plan}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "0.25rem 0.875rem", fontSize: "0.75rem", fontWeight: 700, border: "1px solid rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
              ✓ Active
            </div>
          </div>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {expiryDate && <div><div style={{ fontSize: "0.6875rem", opacity: 0.7, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Expires</div><div style={{ fontWeight: 700 }}>{formatDate(expiryDate)}</div></div>}
            {activatedDate && <div><div style={{ fontSize: "0.6875rem", opacity: 0.7, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Activated</div><div style={{ fontWeight: 700 }}>{formatDate(activatedDate)}</div></div>}
            {daysLeft !== null && <div><div style={{ fontSize: "0.6875rem", opacity: 0.7, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Days Left</div><div style={{ fontWeight: 700 }}>{daysLeft} days</div></div>}
          </div>
        </div>
        <div style={{ background: "#fff", padding: "1.25rem 1.5rem" }}>
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.875rem" }}>Your Benefits</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.625rem" }}>
            {(planConfig?.features ?? []).filter(f => f.ok).map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#333" }}>
                <Check size={15} style={{ color: "#2E7D32", flexShrink: 0, strokeWidth: 2.5 }} />
                {f.text}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0", padding: "1rem 1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={() => { setRenewing(true); router.push(`/payment?plan=${plan}`); }} className="btn btn-primary" style={{ fontSize: "0.875rem", justifyContent: "center", flex: "1 1 140px", opacity: renewing ? 0.7 : 1 }}>
            {renewing ? <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> Loading…</> : "Renew Plan"}
          </button>
          <button onClick={() => setShowCancelConfirm(true)} className="btn" style={{ fontSize: "0.875rem", border: "1.5px solid #e0e0e0", color: "#666", background: "#fff", flex: "1 1 140px", justifyContent: "center" }}>Cancel Plan</button>
        </div>
      </div>

      {cancelError && (
        <div style={{ background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: "10px", padding: "0.875rem 1.25rem", marginBottom: "1.5rem", fontSize: "0.875rem", color: "#C62828" }}>
          {cancelError}
        </div>
      )}

      {showCancelConfirm && (
        <>
          <div onClick={() => setShowCancelConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: "16px", padding: "1.75rem 1.5rem", zIndex: 1001, maxWidth: "400px", width: "calc(100% - 2rem)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#FFF3E0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <AlertTriangle size={24} style={{ color: "#E65100" }} />
              </div>
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.5rem" }}>Cancel Membership?</h3>
              <p style={{ fontSize: "0.875rem", color: "#666", lineHeight: 1.6 }}>
                You will immediately lose all premium benefits including phone number access, unlimited messages, and verified profile views.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setShowCancelConfirm(false)} className="btn" style={{ flex: 1, border: "1.5px solid var(--border-color)", color: "#555", background: "#fff", justifyContent: "center" }}>Keep Plan</button>
              <button onClick={handleCancelPlan} disabled={cancelling} className="btn" style={{ flex: 1, background: "#D32F2F", color: "#fff", border: "none", justifyContent: "center", opacity: cancelling ? 0.7 : 1, cursor: cancelling ? "wait" : "pointer" }}>
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </>
      )}

      {plan !== "PrimeTillUMarry" && (
        <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #6B1A2A 50%, #C8973A 100%)", borderRadius: "16px", padding: "1.5rem", color: "#fff", marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem" }}>Upgrade to Prime Till U Marry</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.85 }}>12 months for just ₹8,999 — find your match stress-free.</div>
            </div>
            <button onClick={() => { setRenewing(true); router.push("/payment?plan=PrimeTillUMarry"); }} style={{ background: "#fff", color: "#6B1A2A", border: "none", borderRadius: "8px", padding: "0.625rem 1.25rem", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, opacity: renewing ? 0.7 : 1 }}>
              {renewing ? "Loading…" : "Upgrade →"}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "12px", padding: "1.25rem 1.5rem" }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.875rem" }}>Need Help?</div>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/contact" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#555", fontSize: "0.875rem", textDecoration: "none", fontWeight: 600 }}>
            <Phone size={15} /> Contact Support
          </Link>
          <Link href="/faq" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#555", fontSize: "0.875rem", textDecoration: "none", fontWeight: 600 }}>
            <Zap size={15} /> FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}

function PricingGrid({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  return (
    <div>
      <div className="plans-scroll-wrapper">
        {PLANS.map((plan) => (
          <div key={plan.name} className={`plan-card${plan.isPopular ? " plan-card--popular" : ""}${plan.isBestValue ? " plan-card--best" : ""}`}>
            {plan.isPopular && <div className="plan-badge plan-badge--popular">⭐ Most Popular</div>}
            {plan.isBestValue && <div className="plan-badge plan-badge--best">🔥 Best Value</div>}

            <div className="plan-header" style={{ background: plan.gradient }}>
              <div className="plan-icon">
                {plan.name === "Gold" ? <Star size={22} fill="currentColor" style={{ color: "#fff" }} />
                  : plan.name === "PrimeGold" ? <Crown size={22} style={{ color: "#fff" }} />
                  : <Sparkles size={22} style={{ color: "#fff" }} />}
              </div>
              <div>
                <div className="plan-name">{plan.label}</div>
                <div className="plan-tagline">{plan.tagline}</div>
              </div>
            </div>

            <div className="plan-pricing">
              <div className="plan-price">{plan.price}</div>
              <div className="plan-original">
                <span style={{ textDecoration: "line-through", color: "#bbb", fontSize: "0.8125rem" }}>{plan.originalPrice}</span>
                <span className="plan-discount">{plan.discountPct} OFF</span>
              </div>
              <div className="plan-per-month">{plan.perMonth}</div>
            </div>

            <ul className="plan-features">
              {plan.features.map((f, i) => (
                <li key={i} className={`plan-feature${f.ok ? "" : " plan-feature--no"}`}>
                  {f.ok
                    ? <Check size={14} style={{ color: "#2E7D32", strokeWidth: 2.5, flexShrink: 0 }} />
                    : <X size={13} style={{ color: "#ccc", flexShrink: 0 }} />}
                  {f.text}
                </li>
              ))}
            </ul>

            <div className="plan-cta">
              <button
                onClick={() => {
                  setLoadingPlan(plan.name);
                  router.push(isLoggedIn ? plan.href : `/login?redirect=${encodeURIComponent(plan.href)}`);
                }}
                className="btn plan-btn"
                style={{ background: plan.gradient, display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", border: "none", color: "#fff", width: "100%", opacity: loadingPlan === plan.name ? 0.7 : 1 }}
                disabled={loadingPlan === plan.name}
              >
                {loadingPlan === plan.name ? (
                  <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> Loading…</>
                ) : (
                  <>{isLoggedIn ? "Pay Now" : "Login to Buy"} <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "3rem", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.25rem", color: "#1a1a1a", marginBottom: "1rem", textAlign: "center" }}>Compare Plans</h2>
        <table style={{ width: "100%", minWidth: "480px", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontWeight: 700, color: "#777", borderBottom: "2px solid #f0f0f0", fontSize: "0.8125rem" }}>Feature</th>
              {PLANS.map(p => (
                <th key={p.name} style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#1a1a1a", borderBottom: "2px solid #f0f0f0", textAlign: "center", fontSize: "0.875rem" }}>
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, i) => (
              <tr key={row.feature} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "0.75rem 1rem", color: "#555", fontWeight: 500, borderBottom: "1px solid #f0f0f0" }}>{row.feature}</td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}><CellValue val={row.gold} /></td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}><CellValue val={row.primeGold} /></td>
                <td style={{ padding: "0.75rem 1rem", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}><CellValue val={row.primeTillUMarry} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: "0.75rem", color: "#bbb", marginTop: "0.75rem", textAlign: "center" }}>* Subject to fair usage policy</p>
      </div>
    </div>
  );
}

export default function MembershipPage() {
  const { user, loading } = useAuth();
  const { isPremium } = useMembership();

  return (
    <>
      <Navbar />
      <main style={{ background: "#f8f8f8", minHeight: "100vh", paddingTop: "64px" }}>
        <section style={{
          background: "linear-gradient(135deg, #6B1A2A 0%, #9B2D42 50%, #C8973A 100%)",
          padding: "3rem 1rem 5.5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(200,151,58,0.12) 0%, transparent 50%)", pointerEvents: "none" }} />
          {/* Back button — top-left */}
          <div style={{ position: "absolute", top: "1rem", left: "1rem", zIndex: 2 }}>
            <BackButton style={{ color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }} />
          </div>
          <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.15)", borderRadius: "20px", padding: "0.25rem 0.875rem", marginBottom: "1.25rem", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Crown size={13} style={{ color: "#E8C060" }} />
              <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em" }}>PREMIUM MEMBERSHIP</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 900, lineHeight: 1.2, margin: "0 0 0.875rem" }}>
              Find Your Perfect<br />Tamil Match Faster
            </h1>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem", lineHeight: 1.6, margin: 0 }}>
              Unlock unlimited phone numbers, verified profiles, and direct messaging.
            </p>
          </div>
        </section>

        <section style={{ maxWidth: "1100px", margin: "-3.5rem auto 0", padding: "0 1rem 3rem", position: "relative", zIndex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
              <div style={{ width: "36px", height: "36px", border: "3px solid #e0e0e0", borderTopColor: "#6B1A2A", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : user && isPremium ? (
            <ActivePlanDashboard />
          ) : (
            <PricingGrid isLoggedIn={!!user} />
          )}
        </section>

        {(!user || !isPremium) && (
          <section style={{ maxWidth: "960px", margin: "0 auto", padding: "1rem 1rem 4rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              {[
                { icon: <Shield size={20} style={{ color: "#2E7D32" }} />, title: "100% Secure Payment", desc: "Powered by Razorpay with 256-bit SSL encryption" },
                { icon: <Award size={20} style={{ color: "#1565C0" }} />, title: "Verified Profiles Only", desc: "Every profile is mobile-verified by our team" },
                { icon: <Phone size={20} style={{ color: "#6B1A2A" }} />, title: "24/7 Support", desc: "Our team is always here to help you find your match" },
              ].map((item) => (
                <div key={item.title} style={{ background: "#fff", borderRadius: "12px", padding: "1.25rem", border: "1px solid #f0f0f0", display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1a1a1a", marginBottom: "3px" }}>{item.title}</div>
                    <div style={{ fontSize: "0.8125rem", color: "#777", lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />

      <style>{`
        .plans-scroll-wrapper {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          align-items: stretch;
          padding-top: 0.5rem;
        }
        @media (max-width: 900px) {
          .plans-scroll-wrapper {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 1rem;
            padding: 0.5rem 0 1.25rem;
            scrollbar-width: none;
          }
          .plans-scroll-wrapper::-webkit-scrollbar { display: none; }
        }
        .plan-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #efefef;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(107,26,42,0.15); }
        .plan-card--popular { border-color: #6B1A2A; box-shadow: 0 4px 24px rgba(107,26,42,0.2); }
        .plan-card--best { border-color: #C8973A; box-shadow: 0 4px 24px rgba(200,151,58,0.2); }
        @media (max-width: 900px) {
          .plan-card { min-width: 260px; max-width: 280px; flex-shrink: 0; scroll-snap-align: start; }
        }
        .plan-badge {
          position: absolute; top: -1px; right: 0; left: 0;
          text-align: center; font-size: 0.6875rem; font-weight: 800;
          padding: 3px 0; letter-spacing: 0.03em; z-index: 1;
        }
        .plan-badge--popular { background: #6B1A2A; color: #fff; }
        .plan-badge--best { background: linear-gradient(90deg, #C8973A, #E8C060); color: #4a2800; }
        .plan-header {
          padding: 1.5rem 1.25rem 1.25rem;
          color: #fff; display: flex; align-items: center; gap: 0.75rem;
        }
        .plan-card--popular .plan-header, .plan-card--best .plan-header { padding-top: 1.875rem; }
        .plan-icon {
          width: 42px; height: 42px; border-radius: 10px;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .plan-name { font-size: 1rem; font-weight: 800; line-height: 1.2; }
        .plan-tagline { font-size: 0.75rem; opacity: 0.8; margin-top: 2px; }
        .plan-pricing { padding: 1rem 1.25rem 0.75rem; border-bottom: 1px solid #f5f5f5; }
        .plan-price { font-size: 1.625rem; font-weight: 900; color: #1a1a1a; line-height: 1; margin-bottom: 4px; }
        .plan-original { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin-bottom: 3px; }
        .plan-discount { background: #E8F5E9; color: #2E7D32; padding: 1px 6px; border-radius: 4px; font-weight: 700; font-size: 0.6875rem; }
        .plan-per-month { font-size: 0.75rem; color: #888; font-weight: 600; }
        .plan-features { list-style: none; margin: 0; padding: 0.875rem 1.25rem; flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .plan-feature { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #333; font-weight: 500; }
        .plan-feature--no { color: #bbb; font-weight: 400; }
        .plan-cta { padding: 0 1.25rem 1.25rem; }
        .plan-btn { width: 100%; border-radius: 8px !important; font-size: 0.875rem !important; padding: 0.625rem 1rem !important; }
      `}</style>
    </>
  );
}
