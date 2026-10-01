"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import CompactFooter from "@/components/layout/CompactFooter";
import {
  Lock, Mail, Phone, Trash2, LogOut, Eye, EyeOff, Bell, BellOff,
  Shield, Users, Globe, Moon, Languages, Ruler, Heart, GraduationCap,
  Briefcase, MapPin, DollarSign, CreditCard, FileText, HelpCircle,
  MessageSquare, AlertTriangle, ChevronRight, Check, X, Edit2,
  Smartphone, Activity, Key, Star, Calendar, BarChart2, Info,
  UserX, BookOpen, Zap, Crown, CheckCircle2, Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { logout, updateProfile } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

// ── TYPES ─────────────────────────────────────────────────────────────
type Section =
  | "account" | "privacy" | "notifications"
  | "security" | "subscription" | "help";

// ── SIDEBAR NAV ───────────────────────────────────────────────────────
const NAV_SECTIONS: { id: Section; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "account", label: "Account", icon: <Key size={16} /> },
  { id: "privacy", label: "Privacy", icon: <Shield size={16} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { id: "security", label: "Security", icon: <Lock size={16} /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard size={16} />, badge: "Free" },
  { id: "help", label: "Help & Support", icon: <HelpCircle size={16} /> },
];

// ── REUSABLE: SETTINGS CARD ───────────────────────────────────────────
function SettingsCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", overflow: "hidden", marginBottom: "1rem", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "2px" }}>{subtitle}</div>}
      </div>
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

// ── REUSABLE: TOGGLE SWITCH ROW ───────────────────────────────────────
function ToggleRow({
  label, sublabel, value, onChange, disabled = false,
}: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-light)" }}>
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: disabled ? "#aaa" : "var(--text-dark)" }}>{label}</div>
        {sublabel && <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "2px" }}>{sublabel}</div>}
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        aria-label={`Toggle ${label}`}
        style={{
          width: "44px", height: "24px", borderRadius: "12px",
          background: value && !disabled ? "var(--primary)" : "#ddd",
          border: "none", cursor: disabled ? "default" : "pointer",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: "3px", left: value ? "23px" : "3px",
          width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  );
}

// ── REUSABLE: FIELD ROW ───────────────────────────────────────────────
function FieldRow({ label, value, onEdit, danger = false, mono = false }: { label: string; value?: string; onEdit?: () => void; danger?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-light)" }}>
      <div>
        <div style={{ fontSize: "0.8125rem", color: "#888" }}>{label}</div>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: danger ? "var(--error, #e53935)" : "var(--text-dark)", marginTop: "1px", fontFamily: mono ? "monospace" : undefined }}>{value || "—"}</div>
      </div>
      {onEdit && (
        <button onClick={onEdit} style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--primary-light)", border: "none", borderRadius: "var(--radius-full)", padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", color: "var(--primary)", fontFamily: "var(--font-sans)" }}>
          <Edit2 size={11} /> Edit
        </button>
      )}
    </div>
  );
}

// ── REUSABLE: SELECT ROW ──────────────────────────────────────────────
function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-light)" }}>
      <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)" }}>{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="form-select"
        style={{ width: "auto", minWidth: "180px", fontSize: "0.8125rem" }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", padding: "0" }}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)", animation: "slideUp 0.3s ease" }}>
        <style>{`
          @media (min-width: 480px) {
            .settings-modal-panel {
              border-radius: 16px !important;
              max-width: 440px !important;
              margin: 0 auto !important;
            }
          }
        `}</style>
        <div className="settings-modal-panel" style={{ padding: 0 }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-dark)" }}>{title}</div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex", minWidth: "44px", minHeight: "44px", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
          </div>
          <div style={{ padding: "1.25rem" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// ── PASSWORD STRENGTH ─────────────────────────────────────────────────
function PasswordHint({ password }: { password: string }) {
  if (!password) return null;
  const tooShort = password.length < 8;
  return (
    <div style={{
      marginTop: "0.375rem",
      fontSize: "0.75rem",
      color: tooShort ? "#e53935" : "#2e7d32",
      display: "flex",
      alignItems: "center",
      gap: "5px",
      fontWeight: 600,
    }}>
      {tooShort
        ? <><X size={12} /> Password must be at least 8 characters (currently {password.length})</>
        : <><Check size={12} /> Password length is valid</>
      }
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────
function SettingsContent() {
  const { user, setUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<Section>("account");

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
  }, [activeSection]);
  const [modal, setModal] = useState<"phone" | "email" | "password" | "delete" | "logout" | null>(null);

  // Account state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPhone, setNewPhone] = useState(user?.mobile || "");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);

  // Privacy
  const [profileVisibility, setProfileVisibility] = useState<"public" | "logged_in" | "hidden">("public");
  const [hideLastSeen, setHideLastSeen] = useState(false);
  const [hideOnline, setHideOnline] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [marketing, setMarketing] = useState(false);

  // Display preferences only
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [distanceUnit, setDistanceUnit] = useState("Kilometers");
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);

  // Jump to section from URL param (e.g. /settings?section=preferences)
  useEffect(() => {
    const urlSection = searchParams?.get("section") as Section | null;
    if (urlSection && NAV_SECTIONS.some(n => n.id === urlSection)) {
      setActiveSection(urlSection);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


  useEffect(() => {
    if (user?.id) {
      import("@/lib/supabase").then(({ supabase }) => {
        supabase.from('user_sessions').select('*').eq('profile_id', user.id).order('login_time', { ascending: false }).then(({ data }) => {
          if (data) setSessions(data);
        });
        
        // Also load notification preferences
        supabase.from('notification_preferences').select('*').eq('profile_id', user.id).single().then(({ data }) => {
          if (data) {
            setEmailNotif(data.email_matches || data.email_messages);
            setMatchAlerts(data.inapp_matches);
            setMessageAlerts(data.inapp_messages);
            setMarketing(data.email_promotions);
          }
        });
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`pwChangedAt_${user.id}`);
      setPasswordChangedAt(stored || null);
    }
  }, [user?.id]);





  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
    toast.success("Logged out successfully");
    router.push("/login");
  }, [router, setUser]);

  // Save notification settings to Supabase
  const handleSaveNotifications = async () => {
    if (!user) return;
    const prefs = { 
      profile_id: user.id,
      email_matches: emailNotif, 
      email_messages: emailNotif, 
      email_promotions: marketing, 
      inapp_matches: matchAlerts, 
      inapp_messages: messageAlerts, 
      inapp_promotions: marketing 
    };
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from('notification_preferences').upsert(prefs);
      toast.success("Notification preferences saved!");
    } catch {
      toast.success("Preferences saved!"); 
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast.error("Please enter your old password");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (user) {
      setIsUpdatingPassword(true);
      const { supabase } = await import("@/lib/supabase");
      
      // Verify old password
      const emailToUse = user.email || `${user.mobile}@etm.app`;
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: oldPassword
      });

      if (verifyError) {
        setIsUpdatingPassword(false);
        toast.error("Old password is incorrect");
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      setIsUpdatingPassword(false);
      
      if (error) { toast.error(error.message); return; }

      // Persist the timestamp so "Last changed" shows accurate date
      const now = new Date().toISOString();
      localStorage.setItem(`pwChangedAt_${user.id}`, now);
      setPasswordChangedAt(now);
    }
    toast.success("Password changed successfully");
    setModal(null);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Partner preferences moved to /profile/edit?section=partner

  const handleDeleteAccount = () => {
    toast.error("Account deletion request submitted. Our team will contact you.");
    setModal(null);
  };

  // Format password changed date
  const passwordChangedLabel = passwordChangedAt
    ? `Last changed: ${new Date(passwordChangedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
    : "Last changed: Never";

  // ETM profile code
  const profileCode = user ? `ETM${user.id.replace(/-/g, "").slice(0, 7).toUpperCase()}` : "";

  // ── SECTION RENDERERS ─────────────────────────────────────────────
  const sections: Record<Section, React.ReactNode> = {

    // ── ACCOUNT ──────────────────────────────────────────────────────
    account: (
      <>
        <SettingsCard title="Account Information">
          {/* Profile UID — always visible */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-light)" }}>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "#888" }}>Profile ID</div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--primary)", marginTop: "1px", fontFamily: "monospace", letterSpacing: "0.04em" }}>{profileCode}</div>
            </div>
            <button
              onClick={() => { navigator.clipboard?.writeText(profileCode); toast.success("Profile ID copied!"); }}
              style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--primary-light)", border: "none", borderRadius: "var(--radius-full)", padding: "4px 12px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", color: "var(--primary)", fontFamily: "var(--font-sans)" }}
            >
              <Copy size={11} /> Copy
            </button>
          </div>

          <FieldRow label="Full Name" value={user?.name || "—"} onEdit={() => toast("Edit name from Edit Profile")} />
          <FieldRow label="Mobile Number" value={user?.mobile || "—"} onEdit={() => setModal("phone")} />
          <FieldRow label="Email Address" value={user?.email || "Not set"} onEdit={() => setModal("email")} />

          {/* Joined On — always shown (account creation date) */}
          <FieldRow
            label="Joined On"
            value={user ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          />

          {/* Member Since — only shown for paid members */}
          {user?.membershipPlan && (
            <FieldRow
              label="Member Since"
              value={user.membershipActivated
                ? new Date(user.membershipActivated).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
                : new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })}
            />
          )}
        </SettingsCard>

        <SettingsCard title="Security" subtitle="Manage your account security">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-light)" }}>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)" }}>Password</div>
              <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{passwordChangedLabel}</div>
            </div>
            <button onClick={() => setModal("password")} className="btn btn-outline" style={{ fontSize: "0.8125rem" }}>
              Change
            </button>
          </div>
        </SettingsCard>

        <SettingsCard title="Danger Zone" subtitle="Irreversible account actions">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)" }}>Logout</div>
                <div style={{ fontSize: "0.75rem", color: "#aaa" }}>Sign out from this device</div>
              </div>
              <button onClick={() => setModal("logout")} className="btn btn-ghost" style={{ border: "1.5px solid var(--border-color)", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                <LogOut size={14} /> Logout
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0" }}>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e53935" }}>Delete Account</div>
                <div style={{ fontSize: "0.75rem", color: "#aaa" }}>Permanently delete all your data</div>
              </div>
              <button onClick={() => setModal("delete")} style={{ display: "flex", alignItems: "center", gap: "5px", background: "#fff5f5", border: "1.5px solid #ffcdd2", borderRadius: "var(--radius-full)", padding: "0.4375rem 1rem", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", color: "#e53935", fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </SettingsCard>
      </>
    ),

    // ── PRIVACY ──────────────────────────────────────────────────────
    privacy: (
      <>
        <SettingsCard title="Profile Visibility" subtitle="Control who can see your profile">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "0.75rem" }}>
            {([
              ["public", "Public – Visible to everyone (recommended)"],
              ["hidden", "Hidden – Not visible in search results"],
            ] as [typeof profileVisibility, string][]).map(([val, label]) => (
              <label key={val} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", padding: "0.625rem 0.875rem", borderRadius: "var(--radius-md)", background: profileVisibility === val ? "var(--primary-light)" : "#fafafa", border: `1.5px solid ${profileVisibility === val ? "var(--primary)" : "var(--border-light)"}` }}>
                <input type="radio" name="visibility" checked={profileVisibility === val} onChange={() => setProfileVisibility(val)} style={{ accentColor: "var(--primary)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-dark)", fontWeight: profileVisibility === val ? 600 : 400 }}>{label}</span>
              </label>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Activity Status">
          <ToggleRow label="Hide Last Seen" sublabel="Others won't see when you were last active" value={hideLastSeen} onChange={setHideLastSeen} />
          <ToggleRow label="Hide Online Status" sublabel="Don't show online indicator to others" value={hideOnline} onChange={setHideOnline} />
          <ToggleRow label="Premium-Only Messages" sublabel="Only premium members can message you" value={premiumOnly} onChange={setPremiumOnly} />
        </SettingsCard>

        <SettingsCard title="Blocked Users" subtitle="Manage profiles you've blocked">
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <UserX size={40} style={{ color: "#e0e0e0", margin: "0 auto 0.75rem" }} />
            <div style={{ fontWeight: 600, color: "#bbb", fontSize: "0.875rem" }}>No blocked users</div>
          </div>
        </SettingsCard>

        <SettingsCard title="Hidden Profiles" subtitle="Profiles you've hidden from your matches">
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <EyeOff size={40} style={{ color: "#e0e0e0", margin: "0 auto 0.75rem" }} />
            <div style={{ fontWeight: 600, color: "#bbb", fontSize: "0.875rem" }}>No hidden profiles</div>
          </div>
        </SettingsCard>
      </>
    ),

    // ── NOTIFICATIONS ─────────────────────────────────────────────────
    notifications: (
      <>
        <SettingsCard title="In-App Alerts" subtitle="Manage alerts within the application">
          <ToggleRow label="New Match Alerts" sublabel="New profile matches for you" value={matchAlerts} onChange={setMatchAlerts} />
          <ToggleRow label="Message Alerts" sublabel="New messages from profiles" value={messageAlerts} onChange={setMessageAlerts} />
        </SettingsCard>

        <SettingsCard title="Email Notifications">
          <ToggleRow label="Email Notifications" sublabel={user?.email || "No email set"} value={emailNotif} onChange={setEmailNotif} />
          <ToggleRow label="Marketing Emails" sublabel="Offers, tips and feature updates" value={marketing} onChange={setMarketing} />
        </SettingsCard>

        <div style={{ marginTop: "0.75rem" }}>
          <button onClick={handleSaveNotifications} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Save Notification Settings
          </button>
        </div>
      </>
    ),

    // ── SECURITY ──────────────────────────────────────────────────────
    security: (
      <>
        <SettingsCard title="Login Activity">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {sessions.length === 0 ? (
              <div style={{ fontSize: "0.875rem", color: "#888", padding: "1rem" }}>No recent activity found.</div>
            ) : sessions.map((session, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 0", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "var(--radius-md)", background: i === 0 ? "var(--primary-light)" : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Smartphone size={18} style={{ color: i === 0 ? "var(--primary)" : "#aaa" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "6px" }}>
                      {session.device}
                      {session.current && <span style={{ fontSize: "0.625rem", background: "var(--success-light)", color: "var(--success)", borderRadius: "var(--radius-sm)", padding: "1px 6px", fontWeight: 700 }}>Current</span>}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{session.location} · {session.time}</div>
                  </div>
                </div>
                {!session.current && (
                  <button onClick={() => setModal("logout")} style={{ background: "none", border: "1px solid #ffcdd2", borderRadius: "var(--radius-full)", padding: "0.25rem 0.75rem", color: "#e53935", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    Logout
                  </button>
                )}
              </div>
            ))}
          </div>
        </SettingsCard>
      </>
    ),

    // ── SUBSCRIPTION ──────────────────────────────────────────────────
    subscription: (
      <>
        <SettingsCard title="Current Plan">
          {user?.isPremium ? (
            <div style={{ background: "linear-gradient(135deg, #FBF6EC, #F5EDDC)", border: "1.5px solid #C8973A", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "#C8973A", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Crown size={18} fill="#C8973A" strokeWidth={0} /> Premium Member
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#8B6914", marginTop: "4px" }}>Unlimited interests • Direct messaging • Priority search</div>
              </div>
              <CheckCircle2 size={28} color="#C8973A" fill="#FBF6EC" />
            </div>
          ) : (
            <div style={{ background: "var(--primary-light)", border: "1.5px solid var(--primary)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "var(--primary)" }}>Free Plan</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>10 interests/month • Basic search filters</div>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--primary)" }}>₹0</div>
            </div>
          )}
          {!user?.isPremium && (
            <a href="/membership" className="btn btn-primary" style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "0.75rem" }}>
              Upgrade to Gold — ₹999/month
            </a>
          )}
          <a href="/membership" style={{ display: "flex", justifyContent: "center", fontSize: "0.8125rem", color: "var(--text-secondary)", textDecoration: "none" }}>
            View all plans →
          </a>
        </SettingsCard>

        <SettingsCard title="Billing History">
          {user?.membershipPlan ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 0" }}>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)" }}>{user.membershipPlan} Plan</div>
                  <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{new Date(user.membershipActivated || user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</div>
                </div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)" }}>₹{user.membershipPricePaid || "999"}</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <FileText size={40} style={{ color: "#e0e0e0", margin: "0 auto 0.75rem" }} />
              <div style={{ fontWeight: 600, color: "#bbb", fontSize: "0.875rem" }}>No billing history</div>
              <div style={{ fontSize: "0.75rem", color: "#ccc", marginTop: "4px" }}>Upgrade to a paid plan to see invoices</div>
            </div>
          )}
        </SettingsCard>
      </>
    ),

    // ── HELP ─────────────────────────────────────────────────────────
    help: (
      <>
        <SettingsCard title="Help & Support">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {[
              { icon: <BookOpen size={16} />, label: "Frequently Asked Questions", href: "/faq" },
              { icon: <MessageSquare size={16} />, label: "Contact Support", href: "/contact" },
              { icon: <FileText size={16} />, label: "Terms & Conditions", href: "/terms" },
              { icon: <Shield size={16} />, label: "Privacy Policy", href: "/privacy" },
            ].map(item => (
              <a key={item.label} href={item.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 0", borderBottom: "1px solid var(--border-light)", textDecoration: "none", color: "var(--text-dark)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{item.label}</span>
                </div>
                <ChevronRight size={14} style={{ color: "#aaa" }} />
              </a>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard title="Feedback">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button onClick={() => toast("Opening feedback form…")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem", borderRadius: "var(--radius-md)", background: "#fafafa", border: "1px solid var(--border-light)", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)" }}>
              <Star size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)" }}>Rate this App</div>
                <div style={{ fontSize: "0.75rem", color: "#aaa" }}>Share your feedback on the Play Store</div>
              </div>
            </button>
            <a href="/contact?topic=bug_report" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem", borderRadius: "var(--radius-md)", background: "#fafafa", border: "1px solid var(--border-light)", cursor: "pointer", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
              <AlertTriangle size={16} style={{ color: "#e53935", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)" }}>Report a Bug</div>
                <div style={{ fontSize: "0.75rem", color: "#aaa" }}>Let us know what's not working</div>
              </div>
            </a>
          </div>
        </SettingsCard>

        <div style={{ textAlign: "center", padding: "1rem", color: "#bbb", fontSize: "0.75rem" }}>
          Elite Tamil Matrimony v1.0.0 · © 2026 All rights reserved
        </div>
      </>
    ),
  };

  const activeNav = NAV_SECTIONS.find(n => n.id === activeSection)!;

  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg-page)", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1rem 0.875rem 5rem" }}>

          {/* Page Title */}
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <BackButton />
              <h1 style={{ fontSize: "clamp(1.125rem, 4vw, 1.375rem)", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>Settings</h1>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "3px" }}>
              Manage your account, privacy, notifications and preferences
            </p>
          </div>

          {/* Mobile: horizontal tab bar */}
          <div className="settings-mobile-tabs" style={{ display: "none" }}>
            <div style={{
              display: "flex", overflowX: "auto", scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch", gap: "0",
              borderBottom: "1px solid var(--border-color)",
              marginBottom: "1rem",
            }}>
              {NAV_SECTIONS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: "5px",
                    padding: "0.625rem 0.875rem",
                    border: "none", borderBottom: activeSection === item.id ? "2px solid var(--primary)" : "2px solid transparent",
                    background: "transparent",
                    color: activeSection === item.id ? "var(--primary)" : "#666",
                    fontWeight: activeSection === item.id ? 700 : 500,
                    fontSize: "0.8125rem", cursor: "pointer", fontFamily: "var(--font-sans)",
                    whiteSpace: "nowrap", minHeight: "44px",
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            {/* ── Sidebar — desktop only ── */}
            <aside className="settings-sidebar-desktop" style={{ width: "220px", flexShrink: 0, background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              {/* Profile mini */}
              <div style={{ padding: "1.25rem 1rem", borderBottom: "1px solid var(--border-light)", textAlign: "center" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.625rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--primary)" }}>
                  {user?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)" }}>{user?.name || "My Account"}</div>
                {/* Profile ID badge */}
                <div style={{ fontSize: "0.6875rem", color: "var(--primary)", marginTop: "3px", fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.04em", background: "var(--primary-light)", borderRadius: "4px", padding: "2px 6px", display: "inline-block" }}>{profileCode}</div>
              </div>
              {/* Nav */}
              <nav>
                {NAV_SECTIONS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.75rem 1rem", border: "none", background: activeSection === item.id ? "var(--primary-light)" : "transparent",
                      borderLeft: activeSection === item.id ? "3px solid var(--primary)" : "3px solid transparent",
                      cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left", minHeight: "44px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <span style={{ color: activeSection === item.id ? "var(--primary)" : "#888" }}>{item.icon}</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: activeSection === item.id ? 700 : 400, color: activeSection === item.id ? "var(--primary)" : "var(--text-dark)" }}>
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span style={{ fontSize: "0.6rem", background: "var(--border-color)", borderRadius: "var(--radius-sm)", padding: "1px 6px", color: "#888", fontWeight: 700 }}>{item.badge}</span>
                    )}
                  </button>
                ))}
              </nav>
            </aside>

            {/* ── Content ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--primary)" }}>{activeNav.icon}</span>
                <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>{activeNav.label}</h2>
              </div>
              {sections[activeSection]}
            </div>
          </div>
        </div>
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          .settings-mobile-tabs { display: block !important; }
          .settings-sidebar-desktop { display: none !important; }
        }
      `}</style>

      {/* ── MODALS ── */}
      {modal === "password" && (
        <Modal title="Change Password" onClose={() => { setModal(null); setOldPassword(""); setNewPassword(""); setConfirmPassword(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-medium)", display: "block", marginBottom: "0.375rem" }}>Old Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter current password"
                  style={{ paddingRight: "2.5rem" }}
                  disabled={isUpdatingPassword}
                />
                <button
                  onClick={() => setShowOldPassword(v => !v)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex", alignItems: "center" }}
                  type="button"
                >
                  {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-medium)", display: "block", marginBottom: "0.375rem" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Min. 8 characters"
                  style={{ paddingRight: "2.5rem" }}
                  disabled={isUpdatingPassword}
                />
                <button
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex", alignItems: "center" }}
                  type="button"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordHint password={newPassword} />
              <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#aaa" }}>Minimum 8 characters</div>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-medium)", display: "block", marginBottom: "0.375rem" }}>Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="Repeat new password"
                  style={{ paddingRight: "2.5rem" }}
                  disabled={isUpdatingPassword}
                />
                <button
                  onClick={() => setShowConfirmPassword(v => !v)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex", alignItems: "center" }}
                  type="button"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <div style={{ marginTop: "0.375rem", fontSize: "0.75rem", color: "#e53935", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                  <X size={12} /> Passwords do not match
                </div>
              )}
            </div>
            <button
              onClick={handleChangePassword}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
              disabled={isUpdatingPassword || newPassword.length < 8 || newPassword !== confirmPassword || !oldPassword}
            >
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "email" && (
        <Modal title="Change Email Address" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-medium)", display: "block", marginBottom: "0.375rem" }}>New Email Address</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="form-input" placeholder="you@example.com" />
            </div>
            <button onClick={async () => { if (user) { await updateProfile(user.id, { email: newEmail }); } toast.success("Email updated!"); setModal(null); }} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Save Email
            </button>
          </div>
        </Modal>
      )}

      {modal === "phone" && (
        <Modal title="Change Phone Number" onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-medium)", display: "block", marginBottom: "0.375rem" }}>New Mobile Number</label>
              <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} className="form-input" placeholder="10-digit number" />
            </div>
            <button onClick={async () => { if (user) { await updateProfile(user.id, { mobile: newPhone }); } toast.success("Phone updated!"); setModal(null); }} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Save & Verify
            </button>
          </div>
        </Modal>
      )}

      {modal === "delete" && (
        <Modal title="Delete Account" onClose={() => setModal(null)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Trash2 size={28} style={{ color: "#e53935" }} />
            </div>
            <h3 style={{ color: "var(--text-dark)", fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Are you absolutely sure?</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              This action is permanent. Your profile, matches, messages, and subscription data will all be deleted and cannot be recovered.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setModal(null)} className="btn btn-ghost" style={{ flex: 1, border: "1.5px solid var(--border-color)", justifyContent: "center" }}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount} style={{ flex: 1, background: "#e53935", color: "#fff", border: "none", borderRadius: "var(--radius-full)", padding: "0.625rem", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                Delete Account
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "logout" && (
        <Modal title="Confirm Logout" onClose={() => setModal(null)}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <LogOut size={28} style={{ color: "var(--primary)" }} />
            </div>
            <h3 style={{ color: "var(--text-dark)", fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Are you sure you want to log out?</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              You will need to enter your credentials or verify OTP to sign in again.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setModal(null)} className="btn btn-ghost" style={{ flex: 1, border: "1.5px solid var(--border-color)", justifyContent: "center" }}>
                Cancel
              </button>
              <button onClick={handleLogout} style={{ flex: 1, background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-full)", padding: "0.625rem", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                Logout
              </button>
            </div>
          </div>
        </Modal>
      )}

      <CompactFooter />
    </>
  );
}

function SettingsGuard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div style={{ background: "#FDF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
          Loading...
        </div>
        <CompactFooter />
      </div>
    );
  }

  return <SettingsContent />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <SettingsGuard />
    </Suspense>
  );
}
