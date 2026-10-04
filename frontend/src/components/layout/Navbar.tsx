// Trigger Turbopack recompile
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown, HelpCircle, Menu, X,
  Home, Heart, Send, MessageSquare, Search, Bell,
  LogOut, Sparkles, Crown, Lock, RefreshCw, User,
  ShieldCheck, Settings, Star, Bookmark, Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import BottomNav from "./BottomNav";
import { getProfilesByMobile, loginWithOtpSession, type RegisteredUser } from "@/lib/auth-store";
import toast from "react-hot-toast";

// ── Guest Center Navigation ────────────────────────────────────────────────────
const GUEST_NAV = [
  { label: "Home", href: "/" },
];

// ── SVG Icon Components ───────────────────────────────────────────────────────

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

// ── Logged-in icon nav items ──────────────────────────────────────────────────

const LOGGED_IN_NAV = [
  {
    label: "Home",
    href: "/",
    icon: <Home size={20} />,
    preview: {
      title: "Dashboard",
      desc: "Your daily match recommendations and profile completeness.",
      stats: [{ label: "New Matches", val: "6" }, { label: "Profile Views", val: "175" }],
      locked: false,
    },
  },
  {
    label: "Matches",
    href: "/matches",
    icon: <Heart size={20} />,
    preview: {
      title: "All Matches",
      desc: "Browse profiles matching your partner preferences.",
      stats: [{ label: "Matches", val: "72" }, { label: "Shortlisted", val: "12" }],
      locked: false,
    },
  },
  {
    label: "Interests",
    href: "/interests",
    icon: <Send size={20} />,
    preview: {
      title: "Interests Sent & Received",
      desc: "Track all interests you have sent and received.",
      stats: [{ label: "Sent", val: "8" }, { label: "Received", val: "14" }],
      locked: false,
    },
  },
  {
    label: "Messages",
    href: "/messages",
    icon: <MessageSquare size={20} />,
    preview: {
      title: "Messages",
      desc: "Chat with matched profiles. Available for Gold and above.",
      stats: [{ label: "Conversations", val: "5" }, { label: "Unread", val: "2" }],
      locked: true,
    },
  },
  {
    label: "Search",
    href: "/search",
    icon: <Search size={20} />,
    preview: {
      title: "Advanced Search",
      desc: "Filter by caste, city, education, income and 25+ filters.",
      stats: [{ label: "Filters", val: "25+" }],
      locked: false,
    },
  },
  {
    label: "Alerts",
    href: "/notifications",
    icon: <Bell size={20} />,
    preview: {
      title: "Notifications",
      desc: "Stay updated on views, interests, and messages.",
      stats: [{ label: "New", val: "3" }, { label: "Today", val: "7" }],
      locked: false,
    },
  },
];

export default function Navbar() {
  const { user, setUser, logout, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [multiProfiles, setMultiProfiles] = useState<RegisteredUser[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [switchConfirmOpen, setSwitchConfirmOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState<RegisteredUser | null>(null);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Sticky scroll shrink
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch profiles with same mobile number for switch account feature
  useEffect(() => {
    if (!user?.mobile) {
      setMultiProfiles([]);
      return;
    }
    getProfilesByMobile(user.mobile).then((profiles) => {
      setMultiProfiles(profiles.filter((p) => p.id !== user.id));
    }).catch((err) => {
      console.error("[Navbar] error fetching mobile profiles:", err);
      setMultiProfiles([]);
    });
  }, [user?.id, user?.mobile]);

  const handleSwitchAccount = async () => {
    if (!targetAccount) return;
    setSwitchConfirmOpen(false);

    const toastId = toast.loading("Switching account...");
    try {
      let switchedUser: any = null;
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
        const { loginToProfile } = await import("@/lib/auth-store");
        switchedUser = await loginToProfile(targetAccount.id);
      }

      if (switchedUser) {
        setUser(switchedUser);
        toast.success(`Switched to ${targetAccount.name}`, { id: toastId });
        await refresh();
        router.push("/");
        return;
      }

      toast.error("Failed to switch account. Please try again.", { id: toastId });
    } catch {
      toast.error("Network error while switching account.", { id: toastId });
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  // Close profile menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  // Lock scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setMobileOpen(false);
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    logout();
    router.push("/");
    setLogoutConfirmOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const { can, isPremium, planName } = useMembership();

  // ── LOGGED-IN NAVBAR ──────────────────────────────────────────────────────
  if (user) {
    return (
      <>
        <header
          style={{
            background: scrolled ? "rgba(255,255,255,0.98)" : "#fff",
            borderBottom: "1px solid #e0e0e0",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            boxShadow: scrolled ? "0 3px 16px rgba(107,26,42,0.12)" : "0 1px 4px rgba(0,0,0,0.07)",
            backdropFilter: scrolled ? "blur(10px)" : "none",
            paddingLeft: "env(safe-area-inset-left, 0px)",
            paddingRight: "env(safe-area-inset-right, 0px)",
            transition: "box-shadow 0.2s ease, background 0.2s ease",
          }}
        >
          <div
            style={{
              maxWidth: "1140px",
              margin: "0 auto",
              padding: "0 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: scrolled ? "62px" : "70px",
              gap: "0.75rem",
              transition: "height 0.2s ease",
            }}
          >
            {/* Logo — transparent icon + brand text */}
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <img
                src="/logo-transparent.png"
                alt="Elite Tamil Matrimony"
                style={{ height: "42px", width: "auto", display: "block" }}
              />
              <div className="nav-brand-text" style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#6B1A2A", letterSpacing: "0.04em", textTransform: "uppercase" }}>Elite</span>
                <span style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#C8973A", letterSpacing: "0.08em", textTransform: "uppercase" }}>Tamil Matrimony</span>
              </div>
            </Link>

            {/* Desktop icon nav — hidden on mobile (bottom nav handles it) */}
            <nav className="nav-icon-row" style={{ display: "flex", alignItems: "center", gap: "0", flex: 1, justifyContent: "center" }}>
              {LOGGED_IN_NAV.map((item) => {
                const active = isActive(item.href);
                const isLocked = item.preview.locked && !can("messages");
                return (
                  <div
                    key={item.label}
                    className="nav-preview-wrap"
                    style={{ position: "relative" }}
                  >
                    <Link
                      href={item.href}
                      className="nav-link-item"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px",
                        padding: "0 0.75rem",
                        height: "70px",
                        justifyContent: "center",
                        color: active ? "var(--primary)" : isLocked ? "#8B6070" : "#2D1018",
                        textDecoration: "none",
                        fontSize: "0.8rem",
                        fontWeight: active ? 800 : 600,
                        borderBottom: active ? "3px solid var(--primary)" : "3px solid transparent",
                        background: active ? "#FEF0F0" : "transparent",
                        borderRadius: active ? "6px 6px 0 0" : undefined,
                        position: "relative",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.icon}
                      {item.label}
                      {isLocked && (
                        <Lock size={8} style={{ position: "absolute", top: "8px", right: "6px", color: "#C8973A" }} />
                      )}
                    </Link>
                    {/* Hover Preview Card — desktop only */}
                    <div className="nav-preview-card" style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: "50%",
                      transform: "translateX(-50%) translateY(-4px)",
                      width: "220px",
                      background: "#fff",
                      border: "1px solid #E8D5B7",
                      borderRadius: "10px",
                      boxShadow: "0 8px 32px rgba(107,26,42,0.18)",
                      overflow: "hidden",
                      opacity: 0,
                      pointerEvents: "none",
                      transition: "opacity 0.18s ease, transform 0.18s ease",
                      zIndex: 500,
                      fontFamily: "var(--font-sans)",
                    }}>
                      <div style={{
                        background: "linear-gradient(135deg, #6B1A2A 0%, #C8973A 100%)",
                        padding: "0.625rem 0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}>
                        <span style={{ color: "#fff", opacity: 0.9 }}>{item.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#fff" }}>{item.preview.title}</span>
                        {isLocked && (
                          <span style={{
                            marginLeft: "auto",
                            background: "rgba(255,255,255,0.2)",
                            borderRadius: "4px",
                            padding: "1px 6px",
                            fontSize: "0.625rem",
                            color: "#FFD54F",
                            fontWeight: 700,
                          }}>GOLD+</span>
                        )}
                      </div>
                      <div style={{ padding: "0.625rem 0.875rem" }}>
                        <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.5, margin: "0 0 0.5rem" }}>
                          {item.preview.desc}
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          {item.preview.stats.map((s) => (
                            <div key={s.label} style={{
                              flex: 1,
                              background: "#FBF0F5",
                              borderRadius: "6px",
                              padding: "0.375rem 0.5rem",
                              textAlign: "center",
                            }}>
                              <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "#6B1A2A" }}>{s.val}</div>
                              <div style={{ fontSize: "0.625rem", color: "#888", fontWeight: 500 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{
                        padding: "0.375rem 0.875rem",
                        borderTop: "1px solid #F0E8E8",
                        fontSize: "0.6875rem",
                        color: "#6B1A2A",
                        fontWeight: 600,
                      }}>Click to open {item.label} →</div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Right: Premium badge + Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              {/* Plan badge — always visible for logged-in users */}
              <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {isPremium ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      background: ({
                        Gold: "linear-gradient(135deg, #C8973A 0%, #E8C060 50%, #C8973A 100%)",
                        Diamond: "linear-gradient(135deg, hsl(253,70%,45%) 0%, hsl(217,91%,55%) 100%)",
                        Platinum: "linear-gradient(135deg, #E69C00 0%, #FFB703 100%)",
                      } as Record<string, string>)[planName] ?? "linear-gradient(135deg, #C8973A 0%, #E8C060 50%, #C8973A 100%)",
                      border: "none",
                      borderRadius: "20px",
                      padding: "0.3rem 0.875rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "0.02em",
                      boxShadow: "0 2px 8px rgba(200,151,58,0.35)",
                    }}
                  >
                    <Crown size={12} fill="#fff" strokeWidth={0} />
                    {planName ?? "Premium"}
                  </div>
                ) : (
                  <button
                    onClick={() => { setLoadingUpgrade(true); router.push("/membership"); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "linear-gradient(135deg, #C8973A 0%, #E8C060 50%, #C8973A 100%)",
                      border: "none",
                      borderRadius: "20px",
                      padding: "0.3rem 0.875rem",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      whiteSpace: "nowrap",
                      boxShadow: "0 2px 6px rgba(200,151,58,0.35)",
                      letterSpacing: "0.02em",
                      opacity: loadingUpgrade ? 0.7 : 1,
                      pointerEvents: loadingUpgrade ? "none" : "auto",
                    }}
                  >
                    {loadingUpgrade ? <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span></> : <Sparkles size={11} />}
                    {loadingUpgrade ? "Loading..." : "Upgrade"}
                  </button>
                )}
              </div>

              {/* Avatar dropdown */}
              <div style={{ position: "relative" }} ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    fontFamily: "var(--font-sans)",
                    minHeight: "44px",
                    minWidth: "44px",
                    justifyContent: "center",
                  }}
                  aria-label="Profile menu"
                  aria-expanded={profileMenuOpen}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#ddd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#555",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      overflow: "hidden",
                      border: "1px solid #ccc",
                    }}
                  >
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <UserIcon />
                    )}
                  </div>
                  <ChevronDown size={12} style={{ color: "#777" }} />
                </button>

                {profileMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "#fff",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      minWidth: "220px",
                      zIndex: 300,
                      animation: "slideDown 0.15s ease",
                      maxHeight: "calc(100vh - 120px)",
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                    }}
                    role="menu"
                  >
                    {/* User info header */}
                    <div
                      style={{
                        padding: "0.875rem 1rem",
                        borderBottom: "1px solid #f0f0f0",
                        background: "#fafafa",
                        borderRadius: "8px 8px 0 0",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>
                        {user.id.slice(0, 8).toUpperCase()}
                      </div>
                      {/* Show plan badge in dropdown on mobile */}
                      <div className="show-mobile" style={{ marginTop: "6px" }}>
                        {isPremium ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            background: ({
                              Gold: "linear-gradient(135deg, #C8973A 0%, #E8C060 50%, #C8973A 100%)",
                              Diamond: "linear-gradient(135deg, hsl(253,70%,45%) 0%, hsl(217,91%,55%) 100%)",
                              Platinum: "linear-gradient(135deg, #E69C00 0%, #FFB703 100%)",
                            } as Record<string, string>)[planName] ?? "linear-gradient(135deg, #C8973A 0%, #E8C060 50%, #C8973A 100%)",
                            color: "#fff", fontSize: "0.6875rem", fontWeight: 700,
                            padding: "2px 8px", borderRadius: "10px",
                          }}>
                            <Crown size={10} fill="#fff" strokeWidth={0} />
                            {planName} Plan
                          </span>
                        ) : (
                          <button
                            onClick={() => { setLoadingUpgrade(true); router.push("/membership"); setProfileMenuOpen(false); }}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "4px",
                              background: "linear-gradient(135deg, #C8973A 0%, #E8C060 50%, #C8973A 100%)",
                              color: "#fff", fontSize: "0.6875rem", fontWeight: 700,
                              padding: "3px 10px", borderRadius: "10px", border: "none", cursor: "pointer",
                              fontFamily: "var(--font-sans)",
                              opacity: loadingUpgrade ? 0.7 : 1,
                              pointerEvents: loadingUpgrade ? "none" : "auto",
                            }}
                          >
                            {loadingUpgrade ? <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span></> : <Sparkles size={10} />}
                            {loadingUpgrade ? "Loading..." : "Upgrade to Gold"}
                          </button>
                        )}
                      </div>
                    </div>

                    {[
                      { label: "My Profile", href: `/profile/${user.id}`, icon: <User size={14} /> },
                      { label: "Edit Profile", href: "/profile/edit", icon: <Settings size={14} /> },
                      { label: "My Matches", href: "/matches", icon: <Heart size={14} /> },
                      { label: "Shortlisted Profiles", href: "/matches?tab=shortlisted_by_you", icon: <Bookmark size={14} /> },
                      { label: "Profile Visitors", href: "/notifications", icon: <Eye size={14} /> },
                      { label: "Interests", href: "/interests", icon: <Send size={14} /> },
                      { label: "Membership", href: "/membership", icon: <Crown size={14} /> },
                      { label: "Account Settings", href: "/settings", icon: <Settings size={14} /> },
                      { label: "Privacy Settings", href: "/settings#privacy", icon: <ShieldCheck size={14} /> },
                      { label: "Help & Support", href: "/faq", icon: <HelpCircle size={14} /> },
                    ].map((item) => (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.625rem",
                          padding: "0.5625rem 1rem",
                          fontSize: "0.8125rem",
                          color: "#333",
                          textDecoration: "none",
                          borderBottom: "1px solid #f5f5f5",
                          minHeight: "40px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ color: "var(--primary)", opacity: 0.7, flexShrink: 0 }}>{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}

                    {/* Switch Account */}
                    {multiProfiles.length > 0 && (
                      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "0.25rem" }}>
                        <div style={{ padding: "0.375rem 1rem 0.25rem", fontSize: "0.6875rem", fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Switch Account
                        </div>
                        {multiProfiles.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setProfileMenuOpen(false);
                              setTargetAccount(p);
                              setSwitchConfirmOpen(true);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.625rem",
                              padding: "0.5rem 1rem",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "var(--font-sans)",
                              borderBottom: "1px solid #f5f5f5",
                              minHeight: "44px",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <div style={{
                              width: "28px", height: "28px", borderRadius: "50%",
                              background: "#eee", display: "flex", alignItems: "center",
                              justifyContent: "center", overflow: "hidden", flexShrink: 0, border: "1px solid #ddd",
                            }}>
                              {p.photoUrl ? (
                                <img src={p.photoUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8">
                                  <circle cx="12" cy="7" r="4" />
                                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#222", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                              {p.mobile && <div style={{ fontSize: "0.6875rem", color: "#888" }}>+91 {p.mobile}</div>}
                            </div>
                            <RefreshCw size={12} style={{ color: "#bbb", flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      style={{
                        width: "100%",
                        padding: "0.625rem 1rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "var(--primary)",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 700,
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        borderRadius: "0 0 8px 8px",
                        borderTop: "1px solid #f0f0f0",
                        minHeight: "44px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Bottom nav for mobile — only for logged-in users */}
        <BottomNav />

        {/* Inline styles for nav hover effects on desktop only */}
        <style>{`
          @media (min-width: 901px) {
            .nav-preview-wrap:hover .nav-preview-card {
              opacity: 1 !important;
              pointer-events: auto !important;
              transform: translateX(-50%) translateY(0) !important;
            }
            .nav-preview-card {
              opacity: 0;
              pointer-events: none;
              transform: translateX(-50%) translateY(-4px);
              transition: opacity 0.18s ease, transform 0.18s ease;
            }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Switch Account confirmation modal */}
        {switchConfirmOpen && targetAccount && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1rem",
            }}
            onClick={() => setSwitchConfirmOpen(false)}
          >
            <div
              style={{
                background: "#fff", borderRadius: "16px",
                padding: "2rem 1.75rem", maxWidth: "360px", width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                textAlign: "center",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "#f0f8ff", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 1rem", border: "1px solid #cce5ff"
              }}>
                <RefreshCw size={24} style={{ color: "#0056b3" }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
                Switch Account?
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#888", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                Do you want to switch to the <strong>{targetAccount.name}</strong> account?
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => setSwitchConfirmOpen(false)}
                  style={{
                    flex: 1, padding: "0.625rem", border: "1.5px solid var(--border-color)",
                    borderRadius: "var(--radius-full)", background: "#fff",
                    color: "var(--text-dark)", fontWeight: 600, fontSize: "0.875rem",
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSwitchAccount}
                  style={{
                    flex: 1, padding: "0.625rem", border: "none",
                    borderRadius: "var(--radius-full)",
                    background: "var(--primary)", color: "#fff",
                    fontWeight: 700, fontSize: "0.875rem",
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  Yes, switch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout confirmation modal */}
        {logoutConfirmOpen && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1rem",
            }}
            onClick={() => setLogoutConfirmOpen(false)}
          >
            <div
              style={{
                background: "#fff", borderRadius: "16px",
                padding: "2rem 1.75rem", maxWidth: "360px", width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                textAlign: "center",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "#FFF0F0", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 1rem",
              }}>
                <LogOut size={24} style={{ color: "var(--primary)" }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
                Log out?
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#888", marginBottom: "1.5rem", lineHeight: 1.5 }}>
                Are you sure you want to log out of Elite Tamil Matrimony?
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => setLogoutConfirmOpen(false)}
                  style={{
                    flex: 1, padding: "0.625rem", border: "1.5px solid var(--border-color)",
                    borderRadius: "var(--radius-full)", background: "#fff",
                    color: "var(--text-dark)", fontWeight: 600, fontSize: "0.875rem",
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  No, stay here
                </button>
                <button
                  onClick={confirmLogout}
                  style={{
                    flex: 1, padding: "0.625rem", border: "none",
                    borderRadius: "var(--radius-full)",
                    background: "var(--primary)", color: "#fff",
                    fontWeight: 700, fontSize: "0.875rem",
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  Yes, log out
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ── GUEST NAVBAR ──────────────────────────────────────────────────────────
  const GUEST_LINKS = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Matches", href: "/matches" },
    { label: "Success Stories", href: "/success-stories" },
    { label: "Features", href: "/#how-it-works" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: scrolled ? "rgba(255,255,255,0.98)" : "#fff",
        borderBottom: "1px solid var(--border-light)",
        boxShadow: scrolled ? "0 3px 16px rgba(107,26,42,0.10)" : "0 1px 4px rgba(0,0,0,0.05)",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        transition: "box-shadow 0.2s ease, background 0.2s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1140px",
          margin: "0 auto",
          padding: "0 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          height: scrolled ? "60px" : "72px",
          transition: "height 0.2s ease",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <img
            src="/logo-transparent.png"
            alt="Elite Tamil Matrimony"
            style={{ height: "52px", width: "auto", display: "block" }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.15rem", color: "var(--primary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Elite</span>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.75rem", color: "var(--secondary)", letterSpacing: "0.09em", textTransform: "uppercase" }}>Tamil Matrimony</span>
          </div>
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
          {GUEST_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--primary)" : "var(--text-medium)",
                  position: "relative",
                  padding: "0.5rem 0.25rem",
                  margin: "0 0.25rem",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  transition: "color 0.15s ease",
                }}
              >
                {link.label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      left: 0,
                      right: 0,
                      height: "2.5px",
                      backgroundColor: "var(--primary)",
                      borderRadius: "2px",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Pill buttons for Login & Sign Up */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {/* Login — Pill outline button */}
          <Link
            href="/login"
            style={{
              border: "1.5px solid var(--primary)",
              color: "var(--primary)",
              padding: "0.4375rem 1.25rem",
              borderRadius: "var(--radius-full)",
              fontWeight: 700,
              fontSize: "0.8125rem",
              textDecoration: "none",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary-light)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            Login
          </Link>



          {/* Hamburger for mobile drawer */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="show-mobile-flex"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "var(--text-dark)",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "36px",
              minHeight: "36px",
              borderRadius: "var(--radius-md)",
            }}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 990,
              animation: "fadeIn 0.2s ease",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "280px",
              height: "100vh",
              background: "#fff",
              zIndex: 995,
              boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
              padding: "1.25rem",
              animation: "slideInRight 0.25s ease",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <img src="/logo-transparent.png" alt="Elite Tamil Matrimony" style={{ height: "34px", width: "auto" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.875rem", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Elite</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "0.625rem", color: "var(--secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tamil Matrimony</div>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "var(--text-dark)" }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {GUEST_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: "0.625rem 0",
                    color: "var(--text-dark)",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: "0.625rem",
                  border: "1.5px solid var(--primary)",
                  color: "var(--primary)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                Login
              </Link>

            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (max-width: 899px) {
          .hide-mobile { display: none !important; }
          .show-mobile-flex { display: flex !important; }
        }
        @media (min-width: 900px) {
          .show-mobile-flex { display: none !important; }
        }
      `}</style>
    </header>
  );
}

