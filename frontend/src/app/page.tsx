"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Home, ChevronDown, ChevronRight, ChevronLeft, ArrowRight, CheckCircle, CheckCircle2,
  Circle, Shield, Users, Star, Crown, Camera, Briefcase, FileText, MapPin, Heart,
  Users2, Sparkles, Eye, Search, User, Settings, Settings2, Mail, X, RefreshCw,
  Clock, Bookmark, Info, MessageSquare, Send, Bell, Check, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import { validateEmail } from "@/lib/email-validator";
import ProfileCard from "@/components/ui/ProfileCard";
import { PROFILE_FOR_OPTIONS, RELIGIONS, MOTHER_TONGUES } from "@/data/matrimony-data";
import {
  fetchMatchProfiles,
  fetchLatestProfiles,
  type RegisteredUser,
  computeProfileCompletion,
  getProfilesByMobile,
  loginWithOtpSession,
  loginToProfile,
  getDailyRecommendations,
  getViewedMe,
  getShortlistedMe,
  getViewedByMe,
  getShortlistedProfiles,
  getNewlyJoined,
  getInterestsReceived,
  acceptInterest,
  shortlistProfile,
  removeShortlist,
  type InterestRow
} from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Helper: compute age from dob
function calcAge(dob?: string): number {
  if (!dob) return 0;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// Helper: convert RegisteredUser → ProfileData shape for ProfileCard
function toProfileData(u: RegisteredUser) {
  return {
    id: u.id,
    name: u.name,
    age: calcAge(u.dob),
    location: [u.city, u.state].filter(Boolean).join(", ") || u.country || "India",
    occupation: u.occupation || "—",
    education: u.education || "—",
    religion: u.religion || "Hindu",
    community: u.caste || u.motherTongue || "Tamil",
    compatibilityScore: 80,
    isVerified: u.isVerified || false,
    isOnline: false,
    isPremium: u.isPremium || false,
    photoUrl: u.photoUrl,
    matchReasons: [],
    gender: u.gender,
    height: u.height,
    income: u.income,
    maritalStatus: u.maritalStatus,
    motherTongue: u.motherTongue,
  };
}


// Stats — honest, credible
const STATS = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#3D7A28" strokeWidth="1.8">
        <circle cx="24" cy="14" r="8" />
        <path d="M8 42c0-8.8 7.2-16 16-16s16 7.2 16 16" />
        <polyline points="20,34 23,37 29,31" strokeWidth="2" />
      </svg>
    ),
    value: "100%",
    label: "Mobile-verified profiles",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#3D7A28" strokeWidth="1.8">
        <rect x="8" y="14" width="32" height="24" rx="3" />
        <path d="M16 14V10a8 8 0 0116 0v4" />
        <circle cx="24" cy="26" r="3" />
      </svg>
    ),
    value: "Free",
    label: "Register & browse profiles",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="#3D7A28" strokeWidth="1.8">
        <path d="M24 6 L28 18 L42 18 L30 26 L35 40 L24 32 L13 40 L18 26 L6 18 L20 18 Z" />
      </svg>
    ),
    value: "Tamil",
    label: "Community focused matrimony",
  },
];

// Profile matches preview — loaded dynamically from DB
const PREVIEW_PROFILES: RegisteredUser[] = [];

function RegisterForm() {
  const [profileFor, setProfileFor] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFor) { toast.error("Please select who this profile is for"); return; }
    if (!name.trim()) { toast.error("Please enter the name"); return; }
    if (!mobile || mobile.length < 10) { toast.error("Please enter a valid 10-digit mobile number"); return; }
    // Pass data via URL so register page skips asking again
    const params = new URLSearchParams({
      profileFor,
      name: name.trim(),
      mobile,
    });
    window.location.href = `/register?${params.toString()}`;
  };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-lg)", width: "100%", maxWidth: "380px" }}>
      {/* Green header */}
      <div style={{ background: "var(--gradient-hero)", padding: "0.875rem 1.25rem", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", margin: 0 }}>
          Create a Matrimony Profile
        </h2>
      </div>

      <div style={{ padding: "1.25rem" }}>
        <p style={{ textAlign: "center", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "1rem" }}>
          Find your perfect match
        </p>

        <form onSubmit={handleRegister}>
          {/* Profile created for */}
          <div style={{ marginBottom: "0.75rem", position: "relative" }}>
            <select
              className="form-select"
              value={profileFor}
              onChange={(e) => setProfileFor(e.target.value)}
            >
              <option value="" disabled>Profile created for</option>
              {PROFILE_FOR_OPTIONS.map((p) => <option key={p.value} value={p.label}>{p.label}</option>)}
            </select>
          </div>

          {/* Name */}
          <div style={{ marginBottom: "0.75rem" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter the name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Mobile */}
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  border: "1.5px solid var(--border-color)",
                  borderRight: "none",
                  borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
                  padding: "0.625rem 0.625rem",
                  background: "#F7F7F7",
                  fontSize: "0.875rem",
                  color: "var(--text-dark)",
                  fontWeight: 600,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                +91 <ChevronDown size={11} />
              </div>
              <input
                type="tel"
                className="form-input"
                placeholder="Enter Mobile Number"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                style={{ borderRadius: "0 var(--radius-md) var(--radius-md) 0" }}
              />
            </div>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              OTP will be sent to this number
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", display: "flex", marginTop: "0.875rem", fontSize: "0.9375rem" }}
          >
            REGISTER FREE
            <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.75rem" }}>
          *By clicking register free, I agree to the{" "}
          <Link href="/terms" style={{ color: "var(--primary)", textDecoration: "none" }}>T&C</Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: "var(--primary)", textDecoration: "none" }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

// ── Hero Auth Card (Login / Register tabs shown on homepage) ─────────────────
function HeroAuthCard() {
  const [tab, setTab] = useState<"login" | "register">("register");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const resetScroll = () => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const vp = document.getElementById("app-scroll-viewport");
        if (vp) vp.scrollTop = 0;
      };
      resetScroll();
      const t1 = setTimeout(resetScroll, 10);
      const t2 = setTimeout(resetScroll, 50);
      const t3 = setTimeout(() => { document.documentElement.style.scrollBehavior = ""; }, 100);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [tab]);

  // OTP login inline state
  const [otpId, setOtpId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Register form state
  const [profileFor, setProfileFor] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const detectType = (v: string): "email" | "phone" | "unknown" => {
    if (v.includes("@")) return "email";
    if (v.replace(/\D/g, "").length >= 10) return "phone";
    return "unknown";
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = otpId.trim();
    const type = detectType(val);
    if (type === "unknown") { toast.error("Enter a valid email or 10-digit mobile number"); return; }
    if (type === "email") {
      const emailValidation = validateEmail(val);
      if (!emailValidation.valid) {
        toast.error(emailValidation.error || "Please enter a valid Gmail address.");
        return;
      }
      setSendingOtp(true);
      try {
        const res = await fetch("/api/send-email-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: val }) });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Failed to send OTP"); setSendingOtp(false); return; }
        toast.success(`OTP sent to ${val}`);
        setSendingOtp(false);
        setOtpSent(true);
      } catch {
        toast.error("Network error. Please try again.");
        setSendingOtp(false);
      }
    } else {
      const digits = val.replace(/\D/g, "");
      toast.success(`OTP sent to +91 ${digits}`);
      // Redirect to full login page for phone OTP (MSG91 widget required)
      window.location.href = `/login?mobile=${digits}&autosend=true`;
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setSendingOtp(true);
    try {
      const res = await fetch("/api/verify-email-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: otpId.trim(), otp }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "OTP verification failed"); setSendingOtp(false); return; }
      // OTP verified — use server-side login to get token
      const profilesRes = await fetch(`/api/otp-login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: otpId.trim() }) });
      if (profilesRes.ok) {
        toast.success("Login successful!");
        window.location.href = "/matches";
      } else {
        toast.error("Account not found. Please register first.");
        setTab("register");
      }
    } catch { toast.error("Network error. Please try again."); }
    setSendingOtp(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFor) { toast.error("Please select who this profile is for"); return; }
    if (!name.trim()) { toast.error("Please enter the name"); return; }
    if (!mobile || mobile.length < 10) { toast.error("Please enter a valid 10-digit mobile number"); return; }
    const params = new URLSearchParams({ profileFor, name: name.trim(), mobile });
    window.location.href = `/register?${params.toString()}`;
  };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-lg)", width: "100%", maxWidth: "380px" }}>
      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)" }}>
        <button
          onClick={() => setTab("register")}
          style={{
            flex: 1, padding: "0.75rem 0.25rem",
            background: tab === "register" ? "var(--gradient-hero)" : "#f9f9f9",
            border: "none", cursor: "pointer",
            fontSize: "0.875rem", fontWeight: 700,
            color: tab === "register" ? "#fff" : "var(--text-medium)",
            fontFamily: "var(--font-sans)",
            transition: "all 0.2s",
            borderRadius: "0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          Register Free
        </button>
        <button
          onClick={() => setTab("login")}
          style={{
            flex: 1, padding: "0.75rem 0.25rem",
            background: tab === "login" ? "var(--gradient-hero)" : "#f9f9f9",
            border: "none", cursor: "pointer",
            fontSize: "0.875rem", fontWeight: 700,
            color: tab === "login" ? "#fff" : "var(--text-medium)",
            fontFamily: "var(--font-sans)",
            transition: "all 0.2s",
            borderRadius: "0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          Login
        </button>
      </div>

      <div style={{ padding: "1.25rem" }}>
        {/* ── REGISTER TAB ── */}
        {tab === "register" && (
          <>
            <p style={{ textAlign: "center", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "1rem" }}>
              Find your perfect Tamil match
            </p>
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "0.75rem" }}>
                <select
                  className="form-select"
                  value={profileFor}
                  onChange={(e) => setProfileFor(e.target.value)}
                >
                  <option value="" disabled>Profile created for</option>
                  {PROFILE_FOR_OPTIONS.map((p) => <option key={p.value} value={p.label}>{p.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <input type="text" className="form-input" placeholder="Enter the name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ display: "flex" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px", border: "1.5px solid var(--border-color)", borderRight: "none", borderRadius: "var(--radius-md) 0 0 var(--radius-md)", padding: "0.625rem 0.625rem", background: "#F7F7F7", fontSize: "0.875rem", color: "var(--text-dark)", fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>
                    +91 <ChevronDown size={11} />
                  </div>
                  <input type="tel" className="form-input" placeholder="Enter Mobile Number" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} style={{ borderRadius: "0 var(--radius-md) var(--radius-md) 0" }} />
                </div>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>OTP will be sent to this number</p>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", display: "flex", marginTop: "0.875rem", fontSize: "0.9375rem" }}>
                REGISTER FREE <ArrowRight size={16} />
              </button>
            </form>
            <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.75rem" }}>
              *By clicking register free, I agree to the{" "}
              <Link href="/terms" style={{ color: "var(--primary)", textDecoration: "none" }}>T&C</Link>
              {" "}and{" "}
              <Link href="/privacy" style={{ color: "var(--primary)", textDecoration: "none" }}>Privacy Policy</Link>
            </p>
          </>
        )}

        {/* ── LOGIN TAB ── */}
        {tab === "login" && (
          <>
            <p style={{ textAlign: "center", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "1rem" }}>
              Welcome back to Elite Tamil Matrimony
            </p>

            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Email Address or Mobile Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter email or 10-digit mobile"
                    value={otpId}
                    onChange={(e) => setOtpId(e.target.value)}
                  />
                  {otpId && detectType(otpId) === "phone" && (
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>📱 You&apos;ll be redirected to verify via SMS OTP</p>
                  )}
                  {otpId && detectType(otpId) === "email" && (
                    <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>✉️ OTP will be sent to this email</p>
                  )}
                </div>
                <button type="submit" disabled={sendingOtp} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", marginBottom: "0.75rem" }}>
                  OTP sent to <strong>{otpId}</strong>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} style={{ marginLeft: "0.5rem", color: "var(--bm-orange)", background: "none", border: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, fontFamily: "var(--font-sans)" }}>Change</button>
                </p>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="form-label">Enter 6-digit OTP</label>
                  <input type="text" className="form-input" placeholder="- - - - - -" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} style={{ textAlign: "center", fontSize: "1.125rem", letterSpacing: "0.25em" }} autoFocus />
                </div>
                <button type="submit" disabled={sendingOtp} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
                  {sendingOtp ? "Verifying..." : "Verify & Login"}
                </button>
              </form>
            )}

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-medium)", marginBottom: "0.5rem" }}>New here?</p>
              <button onClick={() => setTab("register")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--font-sans)" }}>Register Free →</button>
            </div>

            <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "0.75rem", paddingTop: "0.75rem", textAlign: "center" }}>
              <Link href="/login" style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textDecoration: "none" }}>More login options →</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AuthenticatedDashboard() {
  const { user, setUser, refresh } = useAuth();
  const { isPremium } = useMembership();
  const router = useRouter();
  const [dailyRecs, setDailyRecs] = useState<RegisteredUser[]>([]);
  const [viewedMeProfiles, setViewedMeProfiles] = useState<RegisteredUser[]>([]);
  const [viewedByMeProfiles, setViewedByMeProfiles] = useState<RegisteredUser[]>([]);
  const [receivedInterests, setReceivedInterests] = useState<InterestRow[]>([]);
  const [shortlistedProfilesList, setShortlistedProfilesList] = useState<RegisteredUser[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [multiProfiles, setMultiProfiles] = useState<RegisteredUser[]>([]);
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [switchDropdownOpen, setSwitchDropdownOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState<RegisteredUser | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const recScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic Greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch profiles with same mobile number for switch account feature
  useEffect(() => {
    if (!user?.mobile) {
      setMultiProfiles([]);
      return;
    }
    getProfilesByMobile(user.mobile).then((profiles) => {
      setMultiProfiles(profiles.filter((p) => p.id !== user.id));
    }).catch((err) => {
      console.error("[Home] error fetching mobile profiles:", err);
      setMultiProfiles([]);
    });
  }, [user?.id, user?.mobile]);

  const handleSwitchAccount = async () => {
    if (!targetAccount) return;
    setSwitchConfirmOpen(false);

    const toastId = toast.loading("Switching account...");
    try {
      let switchedUser: RegisteredUser | null = null;
      try {
        const res = await fetch("/api/otp-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: targetAccount.id }),
        });
        const loginData = await res.json();
        if (res.ok && loginData.access_token) {
          switchedUser = await loginWithOtpSession(loginData.access_token, loginData.refresh_token);
        }
      } catch (e) {
        console.warn("[SwitchAccount] API login failed, attempting fallback:", e);
      }

      if (!switchedUser) {
        switchedUser = await loginToProfile(targetAccount.id);
      }

      if (switchedUser) {
        setUser(switchedUser);
        toast.success(`Switched to ${targetAccount.name}`, { id: toastId });
        window.location.href = "/";
        return;
      }

      toast.error("Failed to switch account. Please try again.", { id: toastId });
    } catch {
      toast.error("Network error while switching account.", { id: toastId });
    }
  };

  interface DashboardCounts {
    allMatches: number;
    newMatches: number;
    whoViewedYou: number;
    whoShortlistedYou: number;
    profilesYouViewed: number;
    shortlistedByYou: number;
  }

  const [matchCounts, setMatchCounts] = useState<DashboardCounts>(() => {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("dash_matchCounts");
      if (cached) {
        try { return JSON.parse(cached); } catch (e) { }
      }
    }
    return {
      allMatches: 0,
      newMatches: 0,
      whoViewedYou: 0,
      whoShortlistedYou: 0,
      profilesYouViewed: 0,
      shortlistedByYou: 0,
    };
  });
  const [loadingCounts, setLoadingCounts] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("dash_matchCounts");
    }
    return true;
  });

  // Dynamic compatibility match score calculator
  const computeMatchScore = (target: RegisteredUser): number => {
    if (!user) return 85;
    let score = 76;
    if (user.religion && target.religion && user.religion.toLowerCase() === target.religion.toLowerCase()) score += 7;
    if (user.caste && target.caste && user.caste.toLowerCase() === target.caste.toLowerCase()) score += 6;
    if (user.motherTongue && target.motherTongue && user.motherTongue.toLowerCase() === target.motherTongue.toLowerCase()) score += 5;
    if (user.city && target.city && user.city.toLowerCase() === target.city.toLowerCase()) score += 4;
    // Consistent hash variation by ID
    const hash = target.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variation = (hash % 7) - 3;
    return Math.min(98, Math.max(78, score + variation));
  };

  // Scroll handler for Recommended For You carousel
  const scrollRecs = (direction: "left" | "right") => {
    if (recScrollRef.current) {
      const amount = direction === "left" ? -230 : 230;
      recScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Handle shortlist toggle
  const handleToggleShortlist = async (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const isCurrently = shortlistedIds.has(targetId);
    const nextSet = new Set(shortlistedIds);
    if (isCurrently) {
      nextSet.delete(targetId);
      setShortlistedIds(nextSet);
      setMatchCounts(prev => ({ ...prev, shortlistedByYou: Math.max(0, prev.shortlistedByYou - 1) }));
      await removeShortlist(user.id, targetId);
      toast.success("Removed from shortlist");
    } else {
      nextSet.add(targetId);
      setShortlistedIds(nextSet);
      setMatchCounts(prev => ({ ...prev, shortlistedByYou: prev.shortlistedByYou + 1 }));
      await shortlistProfile(user.id, targetId);
      toast.success("Added to shortlist");
    }
  };

  // Handle accept interest
  const handleAcceptInterest = async (interestId: string, senderName?: string) => {
    const toastId = toast.loading("Accepting interest...");
    try {
      const res = await acceptInterest(interestId);
      if (res.error) {
        toast.error(res.error, { id: toastId });
      } else {
        toast.success(`Accepted interest from ${senderName || "member"}!`, { id: toastId });
        setReceivedInterests(prev => prev.filter(i => i.id !== interestId));
      }
    } catch {
      toast.error("Failed to accept interest", { id: toastId });
    }
  };

  useEffect(() => {
    if (!user) return;
    const opp = user.gender === "male" ? "female" : user.gender === "female" ? "male" : null;

    // Load recommendations
    getDailyRecommendations(user.id, user.gender)
      .then((data: RegisteredUser[]) => {
        if (data && data.length > 0) {
          setDailyRecs(data);
        } else {
          // Fallback to general matches if daily recs empty
          fetchMatchProfiles(user, opp || undefined).then((fallback) => setDailyRecs(fallback.slice(0, 10)));
        }
      })
      .catch(() => setDailyRecs([]))
      .finally(() => setLoadingRecs(false));

    // Load all other dynamic sections
    Promise.all([
      fetchMatchProfiles(user, opp || undefined),
      getNewlyJoined(user.id, opp),
      getViewedMe(user.id, opp),
      getShortlistedMe(user.id, opp),
      getViewedByMe(user.id, opp),
      getShortlistedProfiles(user.id),
      getInterestsReceived(user.id, "pending"),
    ]).then(([all, newM, viewedMe, shortlistedMe, viewedByMe, shortlisted, interests]) => {
      const counts = {
        allMatches: all.length,
        newMatches: newM.length,
        whoViewedYou: viewedMe.length,
        whoShortlistedYou: shortlistedMe.length,
        profilesYouViewed: viewedByMe.length,
        shortlistedByYou: shortlisted.length,
      };
      setMatchCounts(counts);
      sessionStorage.setItem("dash_matchCounts", JSON.stringify(counts));

      setViewedMeProfiles(viewedMe || []);
      setViewedByMeProfiles(viewedByMe || []);
      setShortlistedProfilesList(shortlisted || []);
      setShortlistedIds(new Set(shortlisted.map((p) => p.id)));
      setReceivedInterests(interests || []);
    }).catch((err) => {
      console.warn("[Dashboard] error fetching supplemental data:", err);
    }).finally(() => {
      setLoadingCounts(false);
      setLoadingExtras(false);
    });
  }, [user?.id, user?.gender]);

  if (!user) return null;

  const pct = computeProfileCompletion(user);
  const profileCode = `ETM${user.id.replace(/-/g, "").slice(0, 7).toUpperCase()}`;
  const userPhoto = user.photoUrl || null;

  // Dynamic checklist conditions for Right Sidebar "Complete Your Profile"
  const hasBasicDetails = !!(user.name && user.dob && user.gender);
  const hasEducation = !!(user.education && user.education !== "—");
  const hasCareer = !!(user.occupation && user.occupation !== "—");
  const hasPartnerPrefs = !!(user.partnerAgeMin || user.partnerAgeMax || user.partnerReligion || user.partnerCaste || user.partnerEducation);
  const hasFamilyDetails = !!(user.fatherOccupation || user.motherOccupation || user.familyStatus || user.familyType || user.nativePlace);
  const hasMorePhotos = !!(user.photos && user.photos.length > 1);

  return (
    <div style={{ background: "#FAF6F0", minHeight: "100vh", fontFamily: "var(--font-sans)" }}>
      <Navbar />

      <style>{`
        .dashboard-container {
          max-width: 1360px;
          margin: 0 auto;
          padding: 0.75rem 1.25rem 2rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .dash-left-sidebar {
          width: 235px;
          flex-shrink: 0;
          position: sticky;
          top: 80px;
        }
        .dash-center-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .dash-right-sidebar {
          width: 275px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .stat-cards-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.625rem;
        }
        .two-column-split {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 1rem;
        }
        .recs-carousel-track::-webkit-scrollbar {
          display: none;
        }
        .recs-carousel-track {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .side-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.5625rem 1rem;
          color: #3D2028;
          text-decoration: none;
          font-size: 0.8125rem;
          font-weight: 500;
          transition: background 0.15s ease, color 0.15s ease;
          border-left: 3px solid transparent;
        }
        .side-nav-link:hover {
          background: #FAF3EC;
          color: #6B1A2A;
        }
        .side-nav-link.active {
          background: #FEF2F4;
          color: #6B1A2A;
          font-weight: 700;
          border-left: 3px solid #6B1A2A;
        }
        .nav-badge-pill {
          margin-left: auto;
          background: #6B1A2A;
          color: #fff;
          font-size: 0.625rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 10px;
        }
        @media (max-width: 1220px) {
          .dash-right-sidebar { display: none !important; }
        }
        @media (max-width: 960px) {
          .dash-left-sidebar { display: none !important; }
          .stat-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .two-column-split { grid-template-columns: 1fr !important; }
          .dashboard-container { padding: 0.5rem 0.75rem 1.5rem; }
        }
      `}</style>

      <div className="dashboard-container">

        {/* ========================================================================= */}
        {/* 1. LEFT SIDEBAR                                                           */}
        {/* ========================================================================= */}
        <aside className="dash-left-sidebar">
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #EFE8DE",
              borderRadius: "14px",
              boxShadow: "0 2px 12px rgba(107,26,42,0.04)",
              overflow: "hidden",
            }}
          >
            {/* User Profile Header */}
            <div style={{ padding: "1.25rem 1rem 1rem", textAlign: "center", borderBottom: "1px solid #F5ECE0" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "0.625rem" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    border: "2.5px solid #F0E2D2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    background: userPhoto ? "transparent" : "#EDE5DC",
                    margin: "0 auto",
                  }}
                >
                  {userPhoto ? (
                    <img src={userPhoto} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  ) : (
                    <Users size={36} color="#A08088" />
                  )}
                </div>
              </div>

              <div style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#2D1018", lineHeight: 1.25, marginBottom: "2px" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8B6070", letterSpacing: "0.02em", marginBottom: "0.625rem" }}>
                {profileCode}
              </div>

              {/* Profile Progress Bar */}
              <div style={{ marginBottom: "0.75rem", padding: "0 0.5rem" }}>
                <div style={{ height: "4px", background: "#EFE8DE", borderRadius: "3px", overflow: "hidden", marginBottom: "4px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#2E7D32", borderRadius: "3px" }} />
                </div>
                <div style={{ fontSize: "0.6875rem", color: "#8B6070", fontWeight: 600 }}>
                  Profile {pct}% Complete
                </div>
              </div>

              {/* Complete Profile Button */}
              <Link
                href="/profile/edit"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  padding: "0.375rem 1rem",
                  borderRadius: "20px",
                  border: "1px solid #E5D5C5",
                  background: "#FFFFFF",
                  color: "#6B1A2A",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  transition: "all 0.15s ease",
                }}
              >
                {pct >= 100 ? "Edit Profile ✏️" : "Complete Profile →"}
              </Link>
            </div>

            {/* Sidebar Navigation Items */}
            <div style={{ padding: "0.5rem 0" }}>
              <Link href="/" className="side-nav-link active">
                <Home size={16} /> Home
              </Link>
              <Link href="/matches" className="side-nav-link">
                <Heart size={16} /> My Matches
              </Link>
              <Link href="/interests" className="side-nav-link">
                <Send size={16} /> My Interests
              </Link>
              <Link href="/messages" className="side-nav-link">
                <MessageSquare size={16} /> Messages
                {receivedInterests.length > 0 && (
                  <span className="nav-badge-pill">{receivedInterests.length}</span>
                )}
              </Link>
              <Link href="/matches?tab=viewed_you" className="side-nav-link">
                <Eye size={16} /> Profile Visitors
                {matchCounts.whoViewedYou > 0 && (
                  <span className="nav-badge-pill">{matchCounts.whoViewedYou}</span>
                )}
              </Link>
              <Link href="/shortlisted" className="side-nav-link">
                <Bookmark size={16} /> Shortlisted Profiles
              </Link>
              <Link href="/settings" className="side-nav-link">
                <Settings size={16} /> Settings
              </Link>

              {/* MY ACCOUNT Section */}
              <div style={{ padding: "0.875rem 1rem 0.25rem", fontSize: "0.6875rem", fontWeight: 800, color: "#9E7A85", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                My Account
              </div>
              <Link href="/profile/edit" className="side-nav-link">
                <User size={15} /> Edit Profile
              </Link>
              <Link href="/profile/edit?section=partner" className="side-nav-link">
                <Settings2 size={15} /> Edit Preferences
              </Link>
              <Link href="/settings?tab=privacy" className="side-nav-link">
                <Shield size={15} /> Privacy Settings
              </Link>
              <div
                onClick={() => setSwitchDropdownOpen(!switchDropdownOpen)}
                className="side-nav-link"
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                <RefreshCw size={15} /> Switch Account
                <ChevronDown size={14} style={{ marginLeft: "auto", transform: switchDropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </div>

              {/* Switch Account Dropdown */}
              {switchDropdownOpen && (
                <div style={{ background: "#FAF7F2", padding: "0.375rem 0.75rem", borderTop: "1px solid #F0E4D5", borderBottom: "1px solid #F0E4D5" }}>
                  {multiProfiles.length > 0 ? (
                    multiProfiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setTargetAccount(p);
                          setSwitchConfirmOpen(true);
                          setSwitchDropdownOpen(false);
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "0.375rem 0.5rem",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#6B1A2A",
                          borderRadius: "6px",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F2E8DC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6B1A2A" }} />
                        {p.name}
                      </button>
                    ))
                  ) : (
                    <div style={{ fontSize: "0.6875rem", color: "#8B6070", padding: "0.25rem" }}>
                      No other profiles under this mobile number.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Promo Card */}
            <div
              style={{
                margin: "0.5rem 0.875rem 1rem",
                background: isPremium 
                  ? "linear-gradient(135deg, #FFF9F0 0%, #FFF0DC 100%)" 
                  : "linear-gradient(135deg, #FFF9F5 0%, #FFF3EC 100%)",
                border: isPremium ? "1px solid #F5DAB0" : "1px solid #F5E0D5",
                borderRadius: "10px",
                padding: "0.875rem 0.75rem",
                textAlign: "center",
              }}
            >
              {isPremium ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", color: "#C8973A", fontWeight: 800, fontSize: "0.75rem", marginBottom: "3px" }}>
                    <Crown size={14} fill="#C8973A" /> Active Premium Member
                  </div>
                  <p style={{ fontSize: "0.6875rem", color: "#7A5060", margin: "0 0 0.625rem", lineHeight: 1.35 }}>
                    You have full access to messaging, verified profiles, &amp; priority matching.
                  </p>
                  <Link
                    href="/membership"
                    style={{
                      display: "block",
                      background: "#6B1A2A",
                      color: "#FFFFFF",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                  >
                    View Plan Details &rarr;
                  </Link>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", color: "#C8973A", fontWeight: 800, fontSize: "0.75rem", marginBottom: "3px" }}>
                    <Crown size={14} fill="#C8973A" /> Unlock More Connections
                  </div>
                  <p style={{ fontSize: "0.6875rem", color: "#7A5060", margin: "0 0 0.625rem", lineHeight: 1.35 }}>
                    Get access to messaging, advanced search and more.
                  </p>
                  <Link
                    href="/membership"
                    style={{
                      display: "block",
                      background: "#6B1A2A",
                      color: "#FFFFFF",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                  >
                    Explore Premium &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* 2. CENTER MAIN CONTENT                                                    */}
        {/* ========================================================================= */}
        <main className="dash-center-main">

          {/* ── WELCOME BANNER ── */}
          <div
            style={{
              background: "linear-gradient(135deg, #FFF6F0 0%, #FFF0EA 100%)",
              border: "1px solid #F3E5D8",
              borderRadius: "16px",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 2px 10px rgba(107,26,42,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div>
              <h1 style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)", fontWeight: 800, color: "#2D1018", margin: "0 0 4px" }}>
                {getGreeting()}, {user.name.split(" ")[0]}! 👋
              </h1>
              <p style={{ fontSize: "0.8125rem", color: "#7A5060", margin: 0 }}>
                Here are a few matches selected based on your preferences.
              </p>
            </div>

            <div
              style={{
                textAlign: "right",
                fontFamily: "Georgia, 'Playfair Display', serif",
                fontStyle: "italic",
                color: "#A05A40",
                fontSize: "0.875rem",
                lineHeight: 1.25,
                opacity: 0.9,
              }}
            >
              Better Matches<br />
              <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>Brighter Tomorrows</span>
            </div>
          </div>

          {/* ── 5 SUMMARY / STATISTICS CARDS ── */}
          <div className="stat-cards-grid">
            {/* 1: New Matches */}
            <Link
              href="/matches?tab=newly_joined"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EFE8DE",
                borderRadius: "12px",
                padding: "0.875rem 0.75rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(107,26,42,0.02)",
                transition: "border-color 0.15s, transform 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FEF2F4", display: "flex", alignItems: "center", justifyContent: "center", color: "#C84B60", flexShrink: 0 }}>
                  <Heart size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "#8B6070", fontWeight: 600 }}>New Matches</div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#2D1018", lineHeight: 1.1 }}>
                    {loadingCounts ? "—" : matchCounts.newMatches}
                  </div>
                </div>
              </div>
              <ChevronRight size={14} color="#C0A8B0" />
            </Link>

            {/* 2: Profile Views */}
            <Link
              href="/matches?tab=viewed_you"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EFE8DE",
                borderRadius: "12px",
                padding: "0.875rem 0.75rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(107,26,42,0.02)",
                transition: "border-color 0.15s, transform 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#F5EFFE", display: "flex", alignItems: "center", justifyContent: "center", color: "#7B42BC", flexShrink: 0 }}>
                  <Eye size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "#8B6070", fontWeight: 600 }}>Profile Views</div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#2D1018", lineHeight: 1.1 }}>
                    {loadingCounts ? "—" : matchCounts.whoViewedYou}
                  </div>
                </div>
              </div>
              <ChevronRight size={14} color="#C0A8B0" />
            </Link>

            {/* 3: New Interests */}
            <Link
              href="/interests"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EFE8DE",
                borderRadius: "12px",
                padding: "0.875rem 0.75rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(107,26,42,0.02)",
                transition: "border-color 0.15s, transform 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", color: "#D32F2F", flexShrink: 0 }}>
                  <Mail size={16} />
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "#8B6070", fontWeight: 600 }}>New Interests</div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#2D1018", lineHeight: 1.1 }}>
                    {loadingExtras ? "—" : receivedInterests.length}
                  </div>
                </div>
              </div>
              <ChevronRight size={14} color="#C0A8B0" />
            </Link>

            {/* 4: Shortlisted */}
            <Link
              href="/shortlisted"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EFE8DE",
                borderRadius: "12px",
                padding: "0.875rem 0.75rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(107,26,42,0.02)",
                transition: "border-color 0.15s, transform 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FFF9E6", display: "flex", alignItems: "center", justifyContent: "center", color: "#D49800", flexShrink: 0 }}>
                  <Star size={16} fill="#D49800" strokeWidth={0} />
                </div>
                <div>
                  <div style={{ fontSize: "0.6875rem", color: "#8B6070", fontWeight: 600 }}>Shortlisted</div>
                  <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#2D1018", lineHeight: 1.1 }}>
                    {loadingCounts ? "—" : matchCounts.shortlistedByYou}
                  </div>
                </div>
              </div>
              <ChevronRight size={14} color="#C0A8B0" />
            </Link>

            {/* 5: View All Matches */}
            <Link
              href="/matches"
              style={{
                background: "#FFFFFF",
                border: "1px solid #EFE8DE",
                borderRadius: "12px",
                padding: "0.875rem 0.75rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(107,26,42,0.02)",
                transition: "border-color 0.15s, transform 0.15s",
              }}
            >
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FEF2F4", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B1A2A", flexShrink: 0 }}>
                <Users2 size={16} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 800, color: "#6B1A2A", display: "flex", alignItems: "center", gap: "3px" }}>
                  View All Matches &rarr;
                </div>
                <div style={{ fontSize: "0.625rem", color: "#8B6070", lineHeight: 1.2, marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Explore more profiles
                </div>
              </div>
            </Link>
          </div>

          {/* ── RECOMMENDED FOR YOU CAROUSEL ── */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #EFE8DE",
              borderRadius: "16px",
              padding: "1.25rem 1.25rem",
              boxShadow: "0 2px 12px rgba(107,26,42,0.03)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Sparkles size={17} color="#6B1A2A" />
                  <h2 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#2D1018", margin: 0 }}>
                    Recommended For You
                  </h2>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#8B6070", margin: "2px 0 0" }}>
                  Based on your preferences and recent activity
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#FBF7F2", border: "1px solid #EBE0D5", borderRadius: "14px", padding: "3px 8px", fontSize: "0.6875rem", fontWeight: 700, color: "#6B1A2A" }}>
                  Match Score <Info size={11} />
                </div>
                <button
                  onClick={() => scrollRecs("left")}
                  style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#FFFFFF", border: "1px solid #E5D5C5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B1A2A" }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => scrollRecs("right")}
                  style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#FFFFFF", border: "1px solid #E5D5C5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B1A2A" }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Carousel Container */}
            <div
              ref={recScrollRef}
              className="recs-carousel-track"
              style={{
                display: "flex",
                gap: "0.875rem",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                paddingBottom: "0.25rem",
              }}
            >
              {loadingRecs ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ width: "190px", height: "300px", borderRadius: "12px", background: "#F5EDE5", flexShrink: 0, animation: "pulse 1.5s infinite" }} />
                ))
              ) : dailyRecs.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", width: "100%", color: "#8B6070", fontSize: "0.875rem" }}>
                  No match recommendations available today. Try adjusting your partner preferences!
                </div>
              ) : (
                dailyRecs.map((p) => {
                  const age = calcAge(p.dob);
                  const score = computeMatchScore(p);
                  const pCode = `ETM${p.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
                  const isShort = shortlistedIds.has(p.id);

                  return (
                    <div
                      key={p.id}
                      style={{
                        width: "190px",
                        flexShrink: 0,
                        background: "#FFFFFF",
                        border: "1px solid #EFE8DE",
                        borderRadius: "12px",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        scrollSnapAlign: "start",
                        boxShadow: "0 2px 8px rgba(107,26,42,0.03)",
                      }}
                    >
                      {/* Photo + Overlay Badges */}
                      <div style={{ position: "relative", height: "165px", width: "100%", background: "#F2E8DC", overflow: "hidden" }}>
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#C0A8B0" }}>
                            <Users size={44} />
                          </div>
                        )}

                        {/* Match Score Badge */}
                        <div
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            background: "#E6F4EA",
                            color: "#137333",
                            fontSize: "0.625rem",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "10px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          {score}% Match
                        </div>
                      </div>

                      {/* Info Body */}
                      <div style={{ padding: "0.625rem 0.625rem 0.75rem", display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.875rem", color: "#2D1018", marginBottom: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "#6B5060", marginBottom: "2px" }}>
                          {age > 0 ? `${age} yrs` : "26 yrs"} • {p.city || "Tamil Nadu"}
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "#2D1018", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>
                          {p.occupation || "Professional"}
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "#8B6070", marginBottom: "2px" }}>
                          {p.education || "Graduate"} • {p.religion || "Hindu"}
                        </div>
                        <div style={{ fontSize: "0.6875rem", color: "#8B6070", marginBottom: "0.625rem" }}>
                          {p.maritalStatus || "Never Married"}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "auto" }}>
                          <Link
                            href={`/profile/${p.id}?from=home`}
                            style={{
                              flex: 1,
                              background: "#6B1A2A",
                              color: "#FFFFFF",
                              padding: "0.375rem 0.5rem",
                              borderRadius: "6px",
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              textAlign: "center",
                              transition: "background 0.15s",
                            }}
                          >
                            View Profile
                          </Link>
                          <button
                            onClick={(e) => handleToggleShortlist(e, p.id)}
                            title={isShort ? "Remove Shortlist" : "Shortlist"}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              border: "1px solid #E5D5C5",
                              background: isShort ? "#FEF2F4" : "#FFFFFF",
                              color: isShort ? "#6B1A2A" : "#8B6070",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            <Heart size={14} fill={isShort ? "#6B1A2A" : "none"} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── TWO COLUMN ROW: People Interested in You & Who Viewed You ── */}
          <div className="two-column-split">

            {/* Left Box: People Interested in You */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #EFE8DE",
                borderRadius: "14px",
                padding: "1rem 1.125rem",
                boxShadow: "0 2px 10px rgba(107,26,42,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Heart size={16} color="#6B1A2A" />
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2D1018", margin: 0 }}>
                    People Interested in You
                  </h3>
                </div>
                <Link href="/interests" style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#6B1A2A", textDecoration: "none" }}>
                  View All &rarr;
                </Link>
              </div>

              <p style={{ fontSize: "0.6875rem", color: "#8B6070", margin: "0 0 0.75rem" }}>
                {receivedInterests.length} member{receivedInterests.length === 1 ? "" : "s"} expressed interest in your profile.
              </p>

              <div style={{ display: "flex", gap: "0.625rem", overflowX: "auto" }}>
                {receivedInterests.length === 0 ? (
                  <div style={{ padding: "1.25rem 0.5rem", color: "#9E7A85", fontSize: "0.75rem", textAlign: "center", width: "100%" }}>
                    No pending interests right now. Keep your profile updated!
                  </div>
                ) : (
                  receivedInterests.slice(0, 3).map((item) => {
                    const prof = item.profile;
                    const name = prof?.name || "Member";
                    const age = prof?.dob ? calcAge(prof.dob) : 27;

                    return (
                      <div
                        key={item.id}
                        style={{
                          flex: "1 1 0",
                          minWidth: "115px",
                          background: "#FAF7F2",
                          border: "1px solid #EFE8DE",
                          borderRadius: "10px",
                          padding: "0.625rem 0.5rem",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", overflow: "hidden", background: "#EDE5DC", marginBottom: "4px" }}>
                          {prof?.photoUrl ? (
                            <img src={prof.photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Users size={20} color="#A08088" style={{ margin: "9px auto 0" }} />
                          )}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "0.75rem", color: "#2D1018", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                          {name}
                        </div>
                        <div style={{ fontSize: "0.625rem", color: "#8B6070" }}>{age} yrs • {prof?.city || "Chennai"}</div>
                        <div style={{ fontSize: "0.625rem", color: "#6B1A2A", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", marginBottom: "6px" }}>
                          {prof?.occupation || "Professional"}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", marginTop: "auto" }}>
                          <Link
                            href={prof ? `/profile/${prof.id}?from=home` : "/interests"}
                            style={{
                              padding: "2px 0",
                              fontSize: "0.625rem",
                              fontWeight: 700,
                              color: "#6B1A2A",
                              border: "1px solid #E5D5C5",
                              borderRadius: "4px",
                              background: "#FFFFFF",
                              textDecoration: "none",
                            }}
                          >
                            View Profile
                          </Link>
                          <button
                            onClick={() => handleAcceptInterest(item.id, name)}
                            style={{
                              padding: "2px 0",
                              fontSize: "0.625rem",
                              fontWeight: 700,
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "4px",
                              background: "#6B1A2A",
                              cursor: "pointer",
                            }}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Box: Who Viewed You */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #EFE8DE",
                borderRadius: "14px",
                padding: "1rem 1.125rem",
                boxShadow: "0 2px 10px rgba(107,26,42,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Eye size={16} color="#6B1A2A" />
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2D1018", margin: 0 }}>
                    Who Viewed You
                  </h3>
                </div>
                <Link href="/matches?tab=viewed_you" style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#6B1A2A", textDecoration: "none" }}>
                  View Visitors &rarr;
                </Link>
              </div>

              <p style={{ fontSize: "0.6875rem", color: "#8B6070", margin: "0 0 0.75rem" }}>
                {viewedMeProfiles.length} person{viewedMeProfiles.length === 1 ? "" : "s"} viewed your profile.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {viewedMeProfiles.length === 0 ? (
                  <div style={{ padding: "1.25rem 0.5rem", color: "#9E7A85", fontSize: "0.75rem", textAlign: "center" }}>
                    No recent profile visitors yet. Boost your activity to increase profile views!
                  </div>
                ) : (
                  viewedMeProfiles.slice(0, 2).map((p) => {
                    const age = calcAge(p.dob);

                    return (
                      <Link
                        key={p.id}
                        href={`/profile/${p.id}?from=home`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "0.5rem",
                          background: "#FAF7F2",
                          border: "1px solid #EFE8DE",
                          borderRadius: "10px",
                          textDecoration: "none",
                        }}
                      >
                        <div style={{ width: "42px", height: "42px", borderRadius: "50%", overflow: "hidden", background: "#EDE5DC", flexShrink: 0 }}>
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Users size={22} color="#A08088" style={{ margin: "10px auto 0" }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.8125rem", color: "#2D1018" }}>{p.name}</div>
                          <div style={{ fontSize: "0.6875rem", color: "#6B5060" }}>{age > 0 ? `${age} yrs` : "28 yrs"} • {p.city || "Chennai"}</div>
                          <div style={{ fontSize: "0.6875rem", color: "#2D1018", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.occupation || "Software Engineer"}
                          </div>
                          <div style={{ fontSize: "0.625rem", color: "#A08088" }}>Viewed your profile • Recently</div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* ── RECENTLY VIEWED STRIP ── */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #EFE8DE",
              borderRadius: "14px",
              padding: "1rem 1.125rem",
              boxShadow: "0 2px 10px rgba(107,26,42,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={16} color="#6B1A2A" />
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2D1018", margin: 0 }}>
                  Recently Viewed
                </h3>
              </div>
              <Link href="/matches?tab=viewed_by_you" style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#6B1A2A", textDecoration: "none" }}>
                View All &rarr;
              </Link>
            </div>

            <p style={{ fontSize: "0.6875rem", color: "#8B6070", margin: "0 0 0.75rem" }}>
              Continue exploring profiles you recently viewed.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto" }}>
              {(viewedByMeProfiles.length > 0 ? viewedByMeProfiles : dailyRecs).slice(0, 4).map((p) => {
                const age = calcAge(p.dob);
                const isShort = shortlistedIds.has(p.id);

                return (
                  <div
                    key={p.id}
                    style={{
                      flex: "1 1 0",
                      minWidth: "145px",
                      background: "#FAF7F2",
                      border: "1px solid #EFE8DE",
                      borderRadius: "10px",
                      padding: "0.5rem 0.625rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Link href={`/profile/${p.id}?from=home`} style={{ width: "34px", height: "34px", borderRadius: "50%", overflow: "hidden", background: "#EDE5DC", flexShrink: 0 }}>
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Users size={18} color="#A08088" style={{ margin: "8px auto 0" }} />
                      )}
                    </Link>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Link href={`/profile/${p.id}?from=home`} style={{ fontWeight: 800, fontSize: "0.75rem", color: "#2D1018", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </Link>
                      <div style={{ fontSize: "0.625rem", color: "#8B6070" }}>
                        {age > 0 ? `${age} yrs` : "26 yrs"} • {p.city || "Tamil Nadu"}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleShortlist(e, p.id)}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: isShort ? "#6B1A2A" : "#B098A0", padding: "2px" }}
                    >
                      <Heart size={14} fill={isShort ? "#6B1A2A" : "none"} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </main>

        {/* ========================================================================= */}
        {/* 3. RIGHT SIDEBAR                                                          */}
        {/* ========================================================================= */}
        <aside className="dash-right-sidebar">

          {/* ── CARD 1: Premium Membership Status / Upgrade ── */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #EFE8DE",
              borderRadius: "14px",
              padding: "1.25rem 1.125rem",
              boxShadow: "0 2px 10px rgba(107,26,42,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Crown size={18} color="#C8973A" fill="#C8973A" />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2D1018", margin: 0 }}>
                {isPremium ? "Active Membership" : "Premium Membership"}
              </h3>
            </div>
            <p style={{ fontSize: "0.6875rem", color: "#8B6070", margin: "0 0 0.875rem", lineHeight: 1.35 }}>
              {isPremium
                ? "You are currently enjoying full access to all premium features."
                : "Unlock more features for a better matrimonial experience."}
            </p>

            {/* Benefits Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
              {[
                "Unlimited messaging",
                "Advanced search filters",
                "View profile visitors",
                "Priority support",
                "Assisted matchmaking",
              ].map((benefit) => (
                <div key={benefit} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.75rem", color: "#3D2028", fontWeight: 500 }}>
                  <Check size={13} color={isPremium ? "#2E7D32" : "#C84B60"} strokeWidth={3} />
                  {benefit}
                </div>
              ))}
            </div>

            <Link
              href="/membership"
              style={{
                display: "block",
                background: "#6B1A2A",
                color: "#FFFFFF",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
                transition: "background 0.15s",
              }}
            >
              {isPremium ? "Manage Membership →" : "Upgrade Now →"}
            </Link>
          </div>

          {/* ── CARD 2: Complete Your Profile ── */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #EFE8DE",
              borderRadius: "14px",
              padding: "1.25rem 1.125rem",
              boxShadow: "0 2px 10px rgba(107,26,42,0.03)",
            }}
          >
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#2D1018", margin: "0 0 0.75rem" }}>
              Complete Your Profile
            </h3>

            {/* Gauge row */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.875rem" }}>
              <div style={{ position: "relative", width: "48px", height: "48px", flexShrink: 0 }}>
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="19" fill="none" stroke="#EFE8DE" strokeWidth="4.5" />
                  <circle
                    cx="24"
                    cy="24"
                    r="19"
                    fill="none"
                    stroke="#2E7D32"
                    strokeWidth="4.5"
                    strokeDasharray={2 * Math.PI * 19}
                    strokeDashoffset={2 * Math.PI * 19 * (1 - pct / 100)}
                    strokeLinecap="round"
                    transform="rotate(-90 24 24)"
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: "#2E7D32" }}>
                  {pct}%
                </div>
              </div>
              <div style={{ fontSize: "0.6875rem", color: "#8B6070", lineHeight: 1.35 }}>
                Complete your profile to get better matches.
              </div>
            </div>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
              {[
                { label: "Basic details", done: hasBasicDetails },
                { label: "Education", done: hasEducation },
                { label: "Career", done: hasCareer },
                { label: "Partner preferences", done: hasPartnerPrefs },
                { label: "Add family details", done: hasFamilyDetails },
                { label: "Add more photos", done: hasMorePhotos },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.75rem", color: item.done ? "#2D1018" : "#8B6070" }}>
                  {item.done ? (
                    <CheckCircle2 size={14} color="#2E7D32" />
                  ) : (
                    <Circle size={14} color="#C5B0B8" />
                  )}
                  {item.label}
                </div>
              ))}
            </div>

            <Link
              href="/profile/edit"
              style={{
                display: "block",
                background: "#6B1A2A",
                color: "#FFFFFF",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.8125rem",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              {pct >= 100 ? "Edit Profile ✏️" : "Complete Profile →"}
            </Link>
          </div>

          {/* ── CARD 3: Your Story Matters ── */}
          <div
            style={{
              background: "#FAF7F2",
              border: "1px solid #EFE8DE",
              borderRadius: "14px",
              padding: "1.125rem 1.125rem",
              boxShadow: "0 2px 10px rgba(107,26,42,0.03)",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 4px" }}>
              Your Story Matters
            </h3>
            <p style={{ fontSize: "0.6875rem", color: "#7A5060", margin: "0 0 0.625rem", lineHeight: 1.35 }}>
              Find a partner who shares your values, dreams and future.
            </p>

            <div style={{ height: "115px", borderRadius: "10px", overflow: "hidden", margin: "0 0 0.75rem", border: "1px solid #EFE8DE" }}>
              <img
                src="/images/Reception.jpeg"
                alt="Elite Tamil Matrimony"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <Link
              href="/matches"
              style={{
                display: "inline-block",
                padding: "0.375rem 1rem",
                border: "1px solid #E5D5C5",
                borderRadius: "20px",
                background: "#FFFFFF",
                color: "#6B1A2A",
                fontSize: "0.75rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Explore Matches &rarr;
            </Link>
          </div>

        </aside>

      </div>

      <ConfirmDialog
        isOpen={switchConfirmOpen}
        title="Switch Account"
        message={`Do you want to switch to the ${targetAccount?.name} account?`}
        onConfirm={handleSwitchAccount}
        onCancel={() => {
          setSwitchConfirmOpen(false);
          setTargetAccount(null);
        }}
      />
      <Footer />
    </div>
  );
}

// ── Guest Latest Profiles (DB-backed) ───────────────────────────────────────
function GuestLatestProfiles() {
  const [profiles, setProfiles] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load recent registered profiles from DB
    fetchLatestProfiles(12)
      .then((data) => setProfiles(data || []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section style={{ background: "#fff", padding: "3rem 0", borderTop: "1px solid var(--border-light)" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text-dark)", margin: 0 }}>
              Latest Profiles
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-medium)", marginTop: "2px" }}>
              Recently joined Tamil members
            </p>
          </div>
          <Link
            href="/register"
            style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
          >
            Register to View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1rem" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ background: "#f5f5f5", borderRadius: "var(--radius-lg)", height: "240px", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "var(--primary-light)", borderRadius: "var(--radius-xl)", border: "1px dashed var(--primary)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" style={{ margin: "0 auto 1rem", opacity: 0.5 }}>
              <circle cx="12" cy="7" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <p style={{ color: "var(--text-medium)", fontWeight: 600, margin: "0 0 0.5rem" }}>Be the first to join!</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0 0 1rem" }}>
              Register now and start your Tamil matrimony journey.
            </p>
            <Link href="/register" className="btn btn-primary" style={{ display: "inline-flex" }}>
              Register Free <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            <div
              className="guest-profiles-scroll"
              style={{
                display: "flex",
                gap: "1rem",
                overflowX: "auto",
                paddingBottom: "0.75rem",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {profiles.map((profile) => {
                const age = profile.dob ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
                return (
                  <Link
                    key={profile.id}
                    href="/register"
                    style={{
                      textDecoration: "none",
                      minWidth: "170px",
                      maxWidth: "200px",
                      flex: "0 0 auto",
                      scrollSnapAlign: "start",
                    }}
                  >
                    <div
                      className="profile-card-hover"
                      style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}
                    >
                      {/* Photo — blurred for guest view */}
                      <div style={{ height: "180px", overflow: "hidden", background: "#f0f0f0", position: "relative" }}>
                        {profile.photoUrl ? (
                          <img
                            src={profile.photoUrl}
                            alt={profile.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", background: "#F8F0F0", filter: "blur(18px)", transform: "scale(1.2)" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary-light)" }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.2" opacity="0.4">
                              <circle cx="12" cy="7" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                            </svg>
                          </div>
                        )}
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)" }}>
                          <span style={{ color: "#fff", fontSize: "0.6875rem", fontWeight: 700, background: "rgba(0,0,0,0.4)", padding: "2px 8px", borderRadius: "20px" }}>
                            Register to View
                          </span>
                        </div>
                      </div>
                      {/* Info */}
                      <div style={{ padding: "0.625rem 0.75rem" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)", marginBottom: "2px" }}>
                          {profile.name.split(" ")[0]} {profile.name.split(" ")[1]?.[0]}.
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-medium)" }}>
                          {age > 0 ? `${age} yrs` : ""}{age > 0 && profile.caste ? " • " : ""}{profile.caste || profile.motherTongue || "Tamil"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "1px" }}>
                          {[profile.city, profile.state].filter(Boolean).join(", ") || "India"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <Link href="/register" className="btn btn-primary" style={{ display: "inline-flex" }}>
                View All {profiles.length}+ Profiles <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ── Guest Success Stories (DB-backed, fallback to default stories) ─────────────
const DEFAULT_GUEST_STORIES = [
  {
    id: "default-1",
    name: "Mr. Velmurugan & Mrs. Velmurugan",
    city: "Chennai, Tamil Nadu",
    married: "September 2026",
    story: "Pilot, son of a retired Senior Bureaucrat and married in Chennai with the blessings of both families.",
    photo_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "default-2",
    name: "Mr. Karthik & Mrs. Anitha",
    city: "Coimbatore, Tamil Nadu",
    married: "August 2026",
    story: "Software Architect & Doctor who found their perfect alignment of values, family traditions, and life goals through Elite Tamil Matrimony.",
    photo_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "default-3",
    name: "Mr. Sundar & Mrs. Priyadarshini",
    city: "Madurai, Tamil Nadu",
    married: "July 2026",
  },
];

// ── Hero Dynamic Success Story Overlay (reuses exact same database/data source) ──
function HeroSuccessStoryCard() {
  const [topStory, setTopStory] = useState<any>(null);

  useEffect(() => {
    async function loadStory() {
      try {
        const { data, error } = await supabase
          .from("success_stories")
          .select("*")
          .eq("is_visible", true)
          .order("created_at", { ascending: false })
          .limit(1);
        if (!error && data && data.length > 0) {
          setTopStory(data[0]);
        } else {
          setTopStory(DEFAULT_GUEST_STORIES[0]);
        }
      } catch {
        setTopStory(DEFAULT_GUEST_STORIES[0]);
      }
    }
    loadStory();
  }, []);

  if (!topStory) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        left: "16px",
        right: "16px",
        background: "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(8px)",
        borderRadius: "16px",
        padding: "0.875rem 1rem",
        border: "1px solid rgba(255, 255, 255, 0.8)",
        boxShadow: "0 8px 24px rgba(107,26,42,0.18)",
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "var(--primary-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)",
          flexShrink: 0,
        }}
      >
        <Heart size={22} fill="var(--primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {topStory.name}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600 }}>
          {topStory.city || "Happy Tamil Couple"}
        </div>
      </div>
      <Link
        href="/success-stories"
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#fff",
          background: "var(--primary)",
          padding: "0.375rem 0.75rem",
          borderRadius: "var(--radius-full)",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        Story →
      </Link>
    </div>
  );
}

function GuestSuccessStories() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStories() {
      try {
        const { data, error } = await supabase
          .from("success_stories")
          .select("*")
          .eq("is_visible", true)
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          setStories(data);
        } else {
          setStories(DEFAULT_GUEST_STORIES);
        }
      } catch {
        setStories(DEFAULT_GUEST_STORIES);
      } finally {
        setLoading(false);
      }
    }
    loadStories();
  }, []);

  if (loading) return null;

  return (
    <section style={{ background: "#fff", borderTop: "1px solid var(--border-light)", padding: "3rem 0" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text-dark)", margin: 0 }}>
              Success Stories
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-medium)", marginTop: "2px" }}>
              Real Tamil couples who found their match
            </p>
          </div>
          <Link
            href="/success-stories"
            style={{ fontSize: "0.875rem", color: "var(--primary)", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div
          className="success-stories-scroll"
          style={{
            display: "flex",
            gap: "1.25rem",
            overflowX: "auto",
            paddingBottom: "0.5rem",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {stories.map((story) => (
            <div
              key={story.id}
              style={{
                background: "#fff",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                minWidth: "280px",
                maxWidth: "340px",
                flex: "0 0 auto",
                scrollSnapAlign: "start",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {story.photo_url ? (
                <div style={{ height: "160px", width: "100%", overflow: "hidden", background: "#f0f0f0" }}>
                  <img src={story.photo_url} alt={story.name} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", display: "block" }} />
                </div>
              ) : (
                <div style={{ height: "100px", background: "var(--gradient-hero)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart size={32} className="fill-white text-white opacity-80" />
                </div>
              )}
              <div style={{ padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)" }}>
                    {story.name}
                  </div>
                  {story.married && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{story.married}</div>}
                </div>
                {story.city && (
                  <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600, marginBottom: "0.5rem" }}>
                    {story.city}
                  </div>
                )}
                <p style={{ fontSize: "0.8125rem", color: "var(--text-medium)", lineHeight: 1.55 }}>
                  &ldquo;{story.story}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
        <style>{`.success-stories-scroll::-webkit-scrollbar{display:none}`}</style>
      </div>

    </section>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Landing Page Hero Search State
  const [lookingFor, setLookingFor] = useState("");
  const [ageMin, setAgeMin] = useState<number | "">("");
  const [ageMax, setAgeMax] = useState<number | "">("");
  const [heroReligion, setHeroReligion] = useState("");
  const [heroMotherTongue, setHeroMotherTongue] = useState("");
  const [searchError, setSearchError] = useState("");

  const handleMinAgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : "";
    setAgeMin(val);
    if (val !== "" && ageMax !== "" && val > ageMax) {
      setAgeMax("");
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    if (!lookingFor) { setSearchError("Please select who you are looking for."); return; }
    if (!ageMin || !ageMax) { setSearchError("Please select a valid age range."); return; }
    if (ageMin > ageMax) { setSearchError("Minimum age cannot be greater than maximum age."); return; }
    if (!heroReligion) { setSearchError("Please select a religion."); return; }
    if (!heroMotherTongue) { setSearchError("Please select a mother tongue."); return; }

    const params = new URLSearchParams({
      lookingFor,
      partnerAgeMin: String(ageMin),
      partnerAgeMax: String(ageMax),
      religion: heroReligion,
      motherTongue: heroMotherTongue
    });
    router.push(`/register?${params.toString()}`);
  };

  // While auth is resolving, show a minimal spinner to avoid flash of guest UI
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f2f2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "40px", height: "40px",
          border: "3px solid #e0e0e0",
          borderTopColor: "#6B1A2A",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user) {
    return <AuthenticatedDashboard />;
  }

  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg-page)", paddingTop: 0 }}>

        {/* =================== HERO SECTION (FULL WIDTH BANNER WITH DECOR BACKGROUND) =================== */}
        <section
          className="hero-banner-full"
          style={{
            position: "relative",
            background: "radial-gradient(ellipse at center 35%, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.18) 50%, transparent 80%), url('/images/Background.jpeg') center 18% / cover no-repeat",
            padding: "calc(var(--navbar-height, 72px) + 2rem) 0 2.5rem",
            overflow: "hidden",
            minHeight: "560px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            className="container"
            style={{
              maxWidth: "1140px",
              margin: "0 auto",
              padding: "0 1.25rem",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            {/* Centered Hero Text */}
            <div
              style={{
                maxWidth: "960px",
                margin: "0 auto 2.5rem auto",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  color: "#E0C070",
                  textTransform: "uppercase",
                  marginBottom: "0.875rem",
                  fontFamily: "'Montserrat', 'Poppins', 'Inter', var(--font-sans)",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.9), 0 0 3px rgba(0, 0, 0, 1)",
                }}
              >
                ELITE TAMIL MATRIMONY
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  margin: "0 0 1rem 0",
                  textShadow: "0 2px 10px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.7)",
                }}
              >
                <span style={{ display: "block", color: "#FFFDF8" }}>Tradition Meets</span>
                <span style={{ display: "block", color: "#E0C070", whiteSpace: "nowrap" }}>True Connections</span>
              </h1>

              <p
                style={{
                  fontSize: "clamp(1.0625rem, 2vw, 1.25rem)",
                  color: "#FFFDF8",
                  lineHeight: 1.6,
                  maxWidth: "680px",
                  margin: "0 auto",
                  fontWeight: 400,
                  fontFamily: "var(--font-sans)",
                  textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
                }}
              >
                Find your life partner from a trusted community where values, culture and love come together.
              </p>
            </div>

            {/* HORIZONTAL SEARCH FORM (Integrated into existing Hero) */}
            <div
              style={{
                position: "relative",
                zIndex: 10,
                background: "rgba(0, 0, 0, 0.48)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                padding: "1.25rem 1.5rem",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.3)",
                width: "100%",
              }}
            >
              <form onSubmit={handleHeroSearch} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
                {/* Looking For */}
                <div style={{ flex: "1 1 130px" }}>
                  <label style={{ display: "block", color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.4rem", textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}>
                    I&apos;m looking for a
                  </label>
                  <select className="form-select" value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} style={{ background: "#ffffff url('data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23333%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E') no-repeat right 0.75rem center / 14px", appearance: "none", paddingRight: "2rem", border: "1px solid #d1d5db", color: "#111827", borderRadius: "6px" }}>
                    <option value="" disabled>Select</option>
                    <option value="Woman">Woman</option>
                    <option value="Man">Man</option>
                  </select>
                </div>

                {/* Age Range */}
                <div style={{ flex: "1 1 180px" }}>
                  <label style={{ display: "block", color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.4rem", textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}>
                    aged
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <select className="form-select" value={ageMin} onChange={handleMinAgeChange} style={{ background: "#ffffff url('data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23333%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E') no-repeat right 0.75rem center / 14px", appearance: "none", paddingRight: "1.75rem", border: "1px solid #d1d5db", color: "#111827", borderRadius: "6px" }}>
                      <option value="" disabled>Select</option>
                      {Array.from({ length: 35 }, (_, i) => i + 18).map(y => <option key={`min-${y}`} value={y}>{y}</option>)}
                    </select>
                    <span style={{ color: "#ffffff", fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0, textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}>to</span>
                    <select className="form-select" value={ageMax} onChange={(e) => setAgeMax(e.target.value ? Number(e.target.value) : "")} style={{ background: "#ffffff url('data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23333%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E') no-repeat right 0.75rem center / 14px", appearance: "none", paddingRight: "1.75rem", border: "1px solid #d1d5db", color: "#111827", borderRadius: "6px" }}>
                      <option value="" disabled>Select</option>
                      {Array.from({ length: 35 }, (_, i) => i + 18).map(y => (
                        <option key={`max-${y}`} value={y} disabled={ageMin !== "" && y < (ageMin as number)}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Religion */}
                <div style={{ flex: "1 1 150px" }}>
                  <label style={{ display: "block", color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.4rem", textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}>
                    of religion
                  </label>
                  <select className="form-select" value={heroReligion} onChange={(e) => setHeroReligion(e.target.value)} style={{ background: "#ffffff url('data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23333%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E') no-repeat right 0.75rem center / 14px", appearance: "none", paddingRight: "2rem", border: "1px solid #d1d5db", color: "#111827", borderRadius: "6px" }}>
                    <option value="" disabled>Select</option>
                    {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Mother Tongue */}
                <div style={{ flex: "1 1 150px" }}>
                  <label style={{ display: "block", color: "#ffffff", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.4rem", textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}>
                    and mother tongue
                  </label>
                  <select className="form-select" value={heroMotherTongue} onChange={(e) => setHeroMotherTongue(e.target.value)} style={{ background: "#ffffff url('data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23333%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E') no-repeat right 0.75rem center / 14px", appearance: "none", paddingRight: "2rem", border: "1px solid #d1d5db", color: "#111827", borderRadius: "6px" }}>
                    <option value="" disabled>Select</option>
                    {MOTHER_TONGUES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Let's Begin Button */}
                <div style={{ flex: "1 1 120px" }}>
                  <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, padding: "0 1.25rem", borderRadius: "6px", cursor: "pointer", boxShadow: "0 4px 14px rgba(107, 26, 42, 0.4)" }}>
                    Let&apos;s Begin
                  </button>
                </div>
              </form>
              {searchError && (
                <div style={{ color: "#ff8080", fontSize: "0.875rem", marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.375rem", fontWeight: 600, textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)" }}>
                  <AlertCircle size={16} /> {searchError}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =================== SUB-HERO TRUST BAR =================== */}
        <section
          style={{
            background: "#fff",
            borderTop: "1px solid var(--border-light)",
            borderBottom: "1px solid var(--border-light)",
            padding: "1.75rem 0",
          }}
        >
          <div className="container" style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 1.25rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.5rem",
                alignItems: "center",
              }}
            >
              {[
                {
                  icon: (
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                      <Users size={22} />
                    </div>
                  ),
                  title: "Verified Profiles",
                  desc: "Safe & Genuine",
                },
                {
                  icon: (
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                      <Shield size={22} />
                    </div>
                  ),
                  title: "Trusted Community",
                  desc: "For a Better Tomorrow",
                },
                {
                  icon: (
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                      <Heart size={22} />
                    </div>
                  ),
                  title: "Smart Matching",
                  desc: "Find Your Compatibility",
                },
                {
                  icon: (
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                      </svg>
                    </div>
                  ),
                  title: "Dedicated Support",
                  desc: "Always With You",
                },
              ].map((feat) => (
                <div key={feat.title} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {feat.icon}
                  <div>
                    <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-dark)", lineHeight: 1.2 }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {feat.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =================== QUICK REGISTER & LOGIN CARD SECTION (DISABLED / COMMENTED OUT AS REQUESTED) =================== */}
        {/*
        <section style={{ background: "#fff", padding: "2.5rem 0 1.5rem" }} id="register-card">
          <div className="container" style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 1.25rem", display: "flex", justifyContent: "center" }}>
            <HeroAuthCard />
          </div>
        </section>
        */}

        {/* =================== "BECAUSE EVERY LOVE STORY MATTERS" SECTION =================== */}
        <section style={{ background: "var(--bg-page)", padding: "4rem 0" }}>
          <div className="container" style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 1.25rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "2.5rem",
                alignItems: "center",
              }}
              className="love-story-grid"
            >
              {/* Left Column: Heading & Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 800,
                    color: "var(--text-dark)",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  Because Every <br />
                  <span style={{ color: "var(--primary)" }}>Love Story Matters</span>
                </h2>

                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--text-medium)",
                    lineHeight: 1.65,
                    margin: "0.25rem 0 1rem",
                  }}
                >
                  Elite Tamil Matrimony brings together like-minded individuals from our community, helping you build a beautiful future, together.
                </p>

                <div>
                  <Link
                    href="/register"
                    style={{
                      background: "var(--primary)",
                      color: "#fff",
                      borderRadius: "var(--radius-full)",
                      padding: "0.75rem 2rem",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      boxShadow: "var(--shadow-sm)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-dark)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary)")}
                  >
                    Start Your Search
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* Right Column: 3 Feature Cards Side-by-Side */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "1rem",
                }}
              >
                {[
                  {
                    img: "/images/Traditional Wedding.jpeg",
                    title: "Real People",
                    sub: "Real Stories",
                  },
                  {
                    img: "/images/Table decor Flower.jpeg",
                    title: "Beautiful",
                    sub: "Beginnings",
                  },
                  {
                    img: "/images/Reception.jpeg",
                    title: "Lasting",
                    sub: "Relationships",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      background: "#fff",
                      borderRadius: "20px",
                      overflow: "hidden",
                      boxShadow: "var(--shadow-sm)",
                      border: "1px solid var(--border-light)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ height: "140px", overflow: "hidden" }}>
                      <img
                        src={item.img}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                    <div style={{ padding: "0.875rem 0.5rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)" }}>{item.title}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-medium)" }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <style>{`
              @media (min-width: 992px) {
                .love-story-grid {
                  grid-template-columns: 1fr 1.3fr !important;
                }
              }
            `}</style>
          </div>
        </section>

        {/* =================== DYNAMIC SUCCESS STORIES SECTION =================== */}
        <GuestSuccessStories />

        {/* =================== LATEST PROFILES =================== */}
        <GuestLatestProfiles />

        {/* =================== BOTTOM CTA BANNER =================== */}
        <section
          style={{
            position: "relative",
            background: "linear-gradient(90deg, rgba(74,15,28,0.85) 0%, rgba(107,26,42,0.65) 100%), url('/images/Rose.jpeg') center/cover no-repeat",
            padding: "4rem 0",
            color: "#fff",
          }}
        >
          <div className="container" style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 1.25rem", position: "relative", zIndex: 2 }}>
            <div style={{ maxWidth: "540px" }}>
              <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, margin: "0 0 0.75rem", lineHeight: 1.2 }}>
                Your Perfect Match <br />
                Could Be Just a Click Away
              </h2>
              <p style={{ fontSize: "0.9375rem", opacity: 0.9, margin: "0 0 1.75rem", lineHeight: 1.6 }}>
                Join thousands of happy couples and take the first step towards your forever.
              </p>
              <Link
                href="/register"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  borderRadius: "var(--radius-full)",
                  padding: "0.875rem 2.25rem",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "var(--shadow-md)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                Start Your Profile
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}


