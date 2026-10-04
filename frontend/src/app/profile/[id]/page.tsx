"use client";

import { use, useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CompactFooter from "@/components/layout/CompactFooter";
import { MOCK_PROFILES, MOCK_GROOM_PROFILES } from "@/data/mock-profiles";
import { Heart, BookmarkPlus, MessageCircle, Phone, ArrowLeft, ChevronRight, Edit2, CheckCircle, Camera, UserCircle, Briefcase, Star, FileText, MapPin, Crown, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { getUserById, sendInterestWithNotification, getInterestStatus, shortlistProfileWithNotification, recordProfileViewWithNotification } from "@/lib/auth-store";
import { useAuth } from "@/context/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import { ProfileViewSkeleton } from "@/components/ui/Skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ALL_PROFILES = [...MOCK_PROFILES, ...MOCK_GROOM_PROFILES];

// ── SECTION CARD ─────────────────────────────────────────────────────
function SectionCard({
  title,
  onEdit,
  children,
  noPad,
  id,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
  noPad?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      style={{
        background: "#fff",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-xl)",
        marginBottom: "1rem",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0.875rem 1.125rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
          {title}
        </h2>
        {onEdit && (
          <button
            onClick={onEdit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "var(--primary-light)",
              border: "none",
              borderRadius: "var(--radius-full)",
              padding: "4px 12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--primary)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <Edit2 size={12} />
            Edit Profile
          </button>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: noPad ? 0 : "1rem 1.125rem" }}>{children}</div>
    </div>
  );
}

// ── INFO TABLE ROW ────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  addLink,
  isOwnProfile,
  editSection,
}: {
  label: string;
  value?: string | null;
  addLink?: boolean;
  isOwnProfile?: boolean;
  /** The ?section= param to jump to in /profile/edit when "Add" is clicked */
  editSection?: string;
}) {
  const addHref = editSection ? `/profile/edit?section=${editSection}` : "/profile/edit";
  return (
    <tr>
      <td
        className="info-label-col"
        style={{
          padding: "0.4375rem 0",
          width: "180px",
          minWidth: "140px",
          fontSize: "0.8125rem",
          color: "#888",
          fontWeight: 400,
          verticalAlign: "top",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "0.4375rem 0 0.4375rem 0.5rem",
          fontSize: "0.8125rem",
          verticalAlign: "top",
          borderBottom: "1px solid var(--border-light)",
          color: value ? "var(--text-dark)" : undefined,
          fontWeight: value ? 500 : 400,
        }}
      >
        <span style={{ marginRight: "0.375rem", color: "#ccc" }}>:</span>
        {value ? (
          value
        ) : addLink && isOwnProfile ? (
          <a
            href={addHref}
            style={{
              color: "var(--primary)",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.8125rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            Add
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 2 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        ) : (
          <span style={{ color: "#ccc" }}>—</span>
        )}
      </td>
    </tr>
  );
}

// ── OWN PROFILE FALLBACK ──────────────────────────────────────────────
// Shown when clicking "View My Profile" for a registered user whose ID
// is not in mock data (ETM + timestamp IDs from registration)
function OwnProfileFallback({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [storeUser, setStoreUser] = useState(user);
  const [loading, setLoading] = useState(!user);

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/matches");
    }
  };

  useEffect(() => {
    if (!user) {
      getUserById(id).then(u => {
        setStoreUser(u || null);
        setLoading(false);
      });
    } else {
      setStoreUser(user);
      setLoading(false);
    }
  }, [id, user]);

  return (
    <>
      <Navbar />
      <main style={{ background: "var(--bg-page)", minHeight: "100vh" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.25rem 1rem 6.5rem" }}>
          {loading ? (
            <ProfileViewSkeleton />
          ) : (
            <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <button
              type="button"
              onClick={handleBack}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "var(--primary)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span style={{ color: "#ccc" }}>›</span>
            <span style={{ fontSize: "0.875rem", color: "#888" }}>My Profile</span>
          </div>

          <div style={{ background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
            {/* Hero banner */}
            <div style={{ background: "var(--gradient-hero)", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "3px solid rgba(255,255,255,0.5)", overflow: "hidden", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {storeUser?.photoUrl
                    ? <img src={storeUser.photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <UserCircle size={48} style={{ color: "rgba(255,255,255,0.7)" }} />
                  }
                </div>
                <div>
                  <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "1.375rem", margin: 0 }}>{storeUser?.name || "My Profile"}</h1>
                  {storeUser?.isVerified && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", color: "#fff", fontSize: "0.75rem" }}>
                      <CheckCircle size={13} fill="#fff" stroke="var(--primary)" strokeWidth={2} /> Verified
                    </div>
                  )}
                </div>
              </div>
              <Link href="/profile/edit" style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: "var(--radius-full)", padding: "0.5rem 1.25rem", color: "#fff", fontWeight: 700, fontSize: "0.8125rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
                <Edit2 size={13} /> Edit Profile
              </Link>
            </div>

            {/* Content */}
            <div style={{ padding: "2rem" }}>
              {!storeUser ? (
                <div style={{ textAlign: "center", padding: "3rem 0" }}>
                  <UserCircle size={64} style={{ color: "var(--border-color)", margin: "0 auto 1rem" }} />
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Profile not found. Please log in again.</p>
                  <Link href="/login" className="btn btn-primary">Go to Login</Link>
                </div>
              ) : (
                <>
                  {/* Profile completion — specific missing fields */}
                  {(() => {
                    const missing: { label: string; section: string; icon: React.ReactNode }[] = [];
                    if (!storeUser.photoUrl) missing.push({ label: "Add Photo", section: "photo", icon: <Camera size={14} /> });
                    if (!storeUser.education && !storeUser.occupation) missing.push({ label: "Professional Details", section: "professional", icon: <Briefcase size={14} /> });
                    if (!storeUser.star && !storeUser.rasi) missing.push({ label: "Horoscope", section: "religion", icon: <Star size={14} /> });
                    if (!storeUser.about) missing.push({ label: "About Me", section: "about", icon: <FileText size={14} /> });
                    if (!storeUser.city) missing.push({ label: "Location", section: "location", icon: <MapPin size={14} /> });
                    const hasSavedPartnerPrefs = !!(storeUser.partnerReligion || storeUser.partnerCaste || storeUser.partnerEducation || storeUser.partnerOccupation || storeUser.partnerHeightMin || (storeUser.partnerAgeMin && storeUser.partnerAgeMin !== 22));
                    if (!hasSavedPartnerPrefs) missing.push({ label: "Partner Preferences", section: "partner", icon: <Heart size={14} /> });

                    const totalFields = 10;
                    const filled = totalFields - missing.length;
                    const pct = Math.round((filled / totalFields) * 100);

                    if (missing.length === 0) return null;
                    return (
                      <div style={{ background: "#fff8f0", border: "1px solid #ffcc80", borderRadius: "var(--radius-lg)", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#E65100", fontSize: "0.9375rem" }}>Complete Your Profile</div>
                            <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>Profile completeness score {pct}%
                              <span style={{ display: "inline-block", width: "60px", height: "6px", background: "#e0e0e0", borderRadius: "3px", verticalAlign: "middle", margin: "0 4px" }}>
                                <span style={{ display: "block", height: "100%", width: `${pct}%`, background: "#4CAF50", borderRadius: "3px" }} />
                              </span>
                            </div>
                          </div>
                          <Link href="/profile/edit" style={{ fontSize: "0.75rem", color: "#E65100", fontWeight: 600, textDecoration: "none" }}>Edit all →</Link>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {missing.map((m) => (
                            <Link
                              key={m.section}
                              href={`/profile/edit?section=${m.section}`}
                              style={{
                                display: "flex", alignItems: "center", gap: "5px",
                                padding: "0.3125rem 0.75rem",
                                background: "#fff", border: "1px solid #ffcc80",
                                borderRadius: "20px",
                                fontSize: "0.8125rem", color: "#E65100",
                                fontWeight: 600, textDecoration: "none",
                              }}
                            >
                              {m.icon} {m.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Details grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {[
                      ["Full Name", storeUser.name],
                      ["Gender", storeUser.gender ? (storeUser.gender === "male" ? "Male" : "Female") : "—"],
                      ["Date of Birth", storeUser.dob || "Not set"],
                      ["Religion", storeUser.religion || "Not set"],
                      ["Community", storeUser.caste || "Not set"],
                      ["Mother Tongue", storeUser.motherTongue || "Tamil"],
                      ["Education", storeUser.education || "Not set"],
                      ["Occupation", storeUser.occupation || "Not set"],
                      ["Annual Income", storeUser.income || "Not set"],
                      ["Location", [storeUser.city, storeUser.state, storeUser.country].filter(Boolean).join(", ") || "Not set"],
                      ["Height", storeUser.height || "Not set"],
                      ["Marital Status", storeUser.maritalStatus || "Never Married"],
                      ["Star", storeUser.star || "Not set"],
                      ["Raasi", storeUser.rasi || "Not set"],
                    ].map(([label, value]) => (
                      <div key={label} style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border-light)", display: "flex", gap: "0.75rem" }}>
                        <span style={{ color: "#888", fontSize: "0.8125rem", minWidth: "130px", flexShrink: 0 }}>{label}</span>
                        <span style={{ fontSize: "0.8125rem", color: value === "Not set" ? "#ccc" : "var(--text-dark)", fontWeight: 500 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* About */}
                  {storeUser.about && (
                    <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#fafafa", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>About Me</div>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-dark)", lineHeight: 1.6 }}>{storeUser.about}</p>
                    </div>
                  )}

                  {/* Photo upload CTA */}
                  {!storeUser.photoUrl && (
                    <div style={{ marginTop: "1.5rem", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)", padding: "2rem", textAlign: "center" }}>
                      <Camera size={32} style={{ color: "var(--border-color)", margin: "0 auto 0.75rem" }} />
                      <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>No photo added yet</p>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>Profiles with photos get 8x more responses</p>
                      <Link href="/profile/edit?section=photo" className="btn btn-outline">Add Photo</Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </main>
      <CompactFooter />
    </>
  );
}

// ── SIDEBAR ITEMS ─────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { label: "Basic Information", id: "section-Basic-Information" },
  { label: "Photo Gallery", id: "section-Photo-Gallery" },
  { label: "Religion & Horoscope", id: "section-Religion-Horoscope" },
  { label: "Location Details", id: "section-Location" },
  { label: "Family Details", id: "section-Family-Details" },
  { label: "Partner Preferences", id: "section-Partner-Preferences" },
  { label: "Contact Details", id: "section-Contact-Details" },
];

function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const { can, contactLimit } = useMembership();
  const canMessage     = can("messages");
  const canViewContact = can("contacts");
  const canHoroscope   = can("horoscope_view");
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams?.get("from"); // e.g. "daily-recs"
  const [backLabel, setBackLabel] = useState<string>("Back");
  const [fallbackHref, setFallbackHref] = useState<string>("/matches");
  const [activeProfileTab, setActiveProfileTab] = useState("Profile Details");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (fromPage === "home") {
      setBackLabel("Back to Home");
      setFallbackHref("/");
      return;
    }
    if (fromPage === "daily-recs" || fromPage === "daily_matches") {
      setBackLabel("Back to Daily Matches");
      setFallbackHref("/matches?section=daily_matches");
      return;
    }
    if (fromPage === "shortlisted") {
      setBackLabel("Back to Shortlisted");
      setFallbackHref("/shortlisted");
      return;
    }
    if (fromPage === "interests") {
      setBackLabel("Back to Interests");
      setFallbackHref("/interests");
      return;
    }
    if (fromPage === "search") {
      setBackLabel("Back to Search");
      setFallbackHref("/search");
      return;
    }
    if (fromPage === "matches") {
      setBackLabel("Back to Matches");
      setFallbackHref("/matches");
      return;
    }

    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.origin === window.location.origin) {
          const path = refUrl.pathname;
          if (path === "/" || path === "") {
            setBackLabel("Back to Home");
            setFallbackHref("/");
          } else if (path.startsWith("/matches")) {
            if (refUrl.searchParams.get("section") === "daily_matches") {
              setBackLabel("Back to Daily Matches");
            } else if (refUrl.searchParams.get("section") === "shortlisted") {
              setBackLabel("Back to Shortlisted");
            } else if (refUrl.searchParams.get("section") === "interests") {
              setBackLabel("Back to Interests");
            } else {
              setBackLabel("Back to Matches");
            }
            setFallbackHref(path + refUrl.search);
          } else if (path.startsWith("/daily-recs")) {
            setBackLabel("Back to Daily Matches");
            setFallbackHref("/matches?section=daily_matches");
          } else if (path.startsWith("/shortlisted")) {
            setBackLabel("Back to Shortlisted");
            setFallbackHref("/shortlisted");
          } else if (path.startsWith("/interests")) {
            setBackLabel("Back to Interests");
            setFallbackHref("/interests");
          } else if (path.startsWith("/search")) {
            setBackLabel("Back to Search");
            setFallbackHref("/search");
          } else if (path.startsWith("/messages")) {
            setBackLabel("Back to Messages");
            setFallbackHref("/messages");
          } else {
            setBackLabel("Back");
            setFallbackHref(path + refUrl.search);
          }
          return;
        }
      } catch {}
    }

    setBackLabel("Back");
    setFallbackHref("/matches");
  }, [fromPage]);

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };
  const [loading, setLoading] = useState(true);
  const [dbProfile, setDbProfile] = useState<Awaited<ReturnType<typeof getUserById>> | null>(null);

  // Try to find profile from mock data first (fast path)
  const mockProfile = ALL_PROFILES.find((p) => p.id === id);

  useEffect(() => {
    if (!mockProfile) {
      // Not in mock data — try Supabase
      getUserById(id).then(p => {
        setDbProfile(p);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, mockProfile]);

  const [interested, setInterested] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  // Modals state
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: "", onConfirm: () => {} });

  const [activeSection, setActiveSection] = useState("Basic Information");

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
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Load interest status from DB on mount
  useEffect(() => {
    if (!user || !id || user.id === id) return;
    getInterestStatus(user.id, id).then(row => {
      if (row && row.status === "pending") setInterested(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, id]);

  const [hasRevealedContact, setHasRevealedContact] = useState(false);
  const [revealsUsed, setRevealsUsed] = useState(0);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    async function fetchReveals() {
      try {
        const { count, data, error } = await supabase
          .from('contact_reveals')
          .select('target_id', { count: 'exact' })
          .eq('viewer_id', userId)
          .gte('revealed_at', startOfMonth);

        if (!error && count !== null) {
          setRevealsUsed(count || 0);
          if (data?.some((d: { target_id: string }) => d.target_id === id)) {
            setHasRevealedContact(true);
          }
        } else {
          const stored = JSON.parse(localStorage.getItem(`reveals_${userId}`) || "[]");
          setRevealsUsed(stored.length);
          if (stored.includes(id)) setHasRevealedContact(true);
        }
      } catch {
        try {
          const stored = JSON.parse(localStorage.getItem(`reveals_${userId}`) || "[]");
          setRevealsUsed(stored.length);
          if (stored.includes(id)) setHasRevealedContact(true);
        } catch {}
      }
    }
    fetchReveals();
  }, [user, id]);

  const viewRecorded = useRef(false);

  const handleRevealContact = async () => {
    if (!user) {
      toast.error("Please login to view contact numbers");
      return;
    }
    if (!canViewContact || contactLimit === 0) {
      toast.error("Contact viewing requires Gold plan or above. Please upgrade.");
      return;
    }
    if (revealsUsed >= contactLimit && contactLimit !== Infinity) {
      toast.error(`Monthly contact reveal limit (${contactLimit}) reached! Upgrade your plan for unlimited views.`);
      return;
    }
    try {
      const { error } = await supabase.from('contact_reveals').insert({ viewer_id: user.id, target_id: id });
      if (!error || error.code === '23505') {
        setHasRevealedContact(true);
        if (!error) setRevealsUsed((r) => r + 1);
        toast.success(`Contact revealed! (${revealsUsed + 1}/${contactLimit === Infinity ? "Unlimited" : contactLimit} used)`);
      } else {
        const key = `reveals_${user.id}`;
        const stored: string[] = JSON.parse(localStorage.getItem(key) || "[]");
        if (!stored.includes(id)) {
          stored.push(id);
          localStorage.setItem(key, JSON.stringify(stored));
          setRevealsUsed(stored.length);
        }
        setHasRevealedContact(true);
        toast.success(`Contact revealed! (${revealsUsed + 1}/${contactLimit === Infinity ? "Unlimited" : contactLimit} used)`);
      }
    } catch {
      setHasRevealedContact(true);
    }
  };

  const handleSendInterest = async () => {
    if (!user) { toast.error("Please login"); return; }
    if (interested) {
      setConfirmAction({
        isOpen: true,
        title: "Withdraw Interest",
        message: "Are you sure you want to withdraw your interest from this profile?",
        onConfirm: async () => {
          setConfirmAction(prev => ({ ...prev, isOpen: false }));
          setInterested(false);
          toast.success("Interest withdrawn");
        }
      });
      return;
    }
    const result = await sendInterestWithNotification(user.id, id, user.name);
    if (!result.error) {
      setInterested(true);
      toast.success(`Interest sent to ${(mockProfile || dbProfile)?.name || "this profile"}!`);
    } else {
      toast.error("Failed to send interest. Please try again.");
    }
  };

  const handleShortlist = async () => {
    if (!user) { toast.error("Please login"); return; }
    if (shortlisted) {
      setConfirmAction({
        isOpen: true,
        title: "Remove from Shortlist",
        message: "Are you sure you want to remove this profile from your shortlist?",
        onConfirm: async () => {
          setConfirmAction(prev => ({ ...prev, isOpen: false }));
          setShortlisted(false);
          toast.success("Removed from shortlist");
        }
      });
      return;
    }
    await shortlistProfileWithNotification(user.id, id, user.name);
    setShortlisted(true);
    toast.success("Added to shortlist");
  };

  // Record profile view once the profile is loaded and viewer ≠ owner
  useEffect(() => {
    if (viewRecorded.current) return;       // only once per mount
    if (loading) return;                    // wait for load
    if (!user) return;                      // must be logged in
    const resolvedProfile = mockProfile || dbProfile;
    if (!resolvedProfile) return;           // profile must exist
    if (user.id === resolvedProfile.id) return; // don't record own-profile views

    viewRecorded.current = true;
    recordProfileViewWithNotification(user.id, resolvedProfile.id, user.name).catch(
      (err) => console.warn('[profile-view] Failed to record view:', err)
    );
  }, [loading, user, mockProfile, dbProfile]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ background: "var(--bg-page)", minHeight: "100vh" }}>
          <ProfileViewSkeleton />
        </main>
        <CompactFooter />
      </>
    );
  }

  // If not found anywhere:
  // - If the ID matches the logged-in user, show their own profile editor fallback
  // - Otherwise, show a proper "Profile Not Found" page
  if (!mockProfile && !dbProfile) {
    if (user && id === user.id) {
      return <OwnProfileFallback id={id} />;
    }
    // Profile truly not found — don't fall back to the logged-in user's profile
    return (
      <>
        <Navbar />
        <main style={{ background: "var(--bg-page)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <UserCircle size={44} style={{ color: "var(--primary)", opacity: 0.6 }} />
            </div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: "0.5rem" }}>
              Profile Not Found
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-medium)", marginBottom: "1.5rem", maxWidth: "360px", margin: "0 auto 1.5rem" }}>
              This profile doesn&apos;t exist or may have been removed.
            </p>
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
            >
              <ArrowLeft size={15} /> Back to Matches
            </button>
          </div>
        </main>
        <CompactFooter />
      </>
    );
  }

  const profile = mockProfile || dbProfile;

  if (!profile) return null;

  const photo = profile.photoUrl || null;
  const galleryPhotos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : (photo ? [{ id: 'main', url: photo, sortOrder: 0, isPrimary: true }] : []);

  // Compute age from DOB if age field is missing (dob only exists on RegisteredUser, not ProfileData)
  const dobStr = "dob" in profile ? (profile as { dob?: string }).dob : undefined;
  const profileAge = profile.age ||
    (dobStr ? Math.floor((Date.now() - new Date(dobStr).getTime()) / (365.25 * 24 * 3600 * 1000)) : null);
  // Safe accessor for RegisteredUser-only fields (not present on mock ProfileData)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any;

  const pronoun = profile.gender === "female" ? "her" : "him";
  const isOwnProfile = user?.id === profile.id;

  return (
    <>
      <Navbar />
      <style>{`
        .hide-mobile { display: block; }
        .show-mobile { display: none; }
        .profile-sidebar::-webkit-scrollbar, .profile-right-panel::-webkit-scrollbar, .profile-center-col::-webkit-scrollbar { display: none; }
        .profile-sidebar, .profile-right-panel, .profile-center-col { scrollbar-width: none; }
        
        @media (min-width: 900px) {
          .profile-sidebar, .profile-right-panel {
            position: sticky !important;
            top: 80px !important;
            max-height: calc(100vh - 100px) !important;
            overflow-y: auto !important;
            overscroll-behavior-y: auto !important;
            align-self: flex-start !important;
          }
        }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (max-width: 899px) {
          .profile-main-wrap { overflow-x: hidden !important; padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
          .profile-layout-row { flex-direction: column !important; }
          .profile-sidebar { display: none !important; }
          .profile-right-panel { width: 100% !important; margin-top: 1.5rem !important; position: static !important; max-height: none !important; overflow-y: visible !important; }
          .profile-info-body { flex-direction: column !important; align-items: flex-start !important; text-align: left !important; padding: 1.25rem !important; }
          .profile-photo-col { width: 120px !important; margin: 0 0 1rem 0 !important; }
          .profile-photo-img { width: 120px !important; height: 150px !important; border-radius: var(--radius-lg) !important; margin: 0 !important; }
          .profile-actions-col { flex-direction: row !important; flex-wrap: wrap !important; justify-content: flex-start !important; width: 100% !important; margin-top: 0.75rem !important; gap: 0.5rem !important; }
          .profile-attr-grid { grid-template-columns: 1fr !important; }
          .profile-edu-grid { grid-template-columns: 1fr !important; }
          /* Tables: prevent horizontal overflow */
          .profile-details-table, .profile-main-wrap table { width: 100% !important; word-break: break-word !important; }
          .info-label-col { width: 135px !important; min-width: 120px !important; max-width: 45% !important; padding-right: 8px !important; }
          .profile-edu-grid > span:nth-child(odd) { width: 135px !important; }
          /* Section cards: prevent overflow */
          .profile-main-wrap > div > div { max-width: 100% !important; box-sizing: border-box !important; }
          /* Info column: must not overflow */
          .my-profile-info-wrap > div, .my-profile-info-wrap { min-width: 0 !important; overflow-x: hidden !important; }

          /* Custom classes for perfect left-alignment of My Profile on mobile */
          .my-profile-top-card {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 1rem !important;
            gap: 1rem !important;
          }
          .my-profile-photo-wrap {
            width: 120px !important;
            margin: 0 !important;
          }
          .my-profile-info-wrap {
            width: 100% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            text-align: left !important;
            align-items: flex-start !important;
            overflow: hidden !important;
          }
        }
        @media (max-width: 400px) {
          .info-label-col { width: 120px !important; min-width: 110px !important; max-width: 45% !important; padding-right: 4px !important; }
          .profile-main-wrap { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
        }
      `}</style>
      <main style={{ background: "var(--bg-page)", minHeight: "100vh" }}>
        <div
          className="profile-main-wrap"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "1.25rem 1rem 2.5rem",
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              marginBottom: "1.25rem",
              fontSize: "0.8125rem",
              color: "#888",
            }}
          >
            {isOwnProfile ? (
              <span style={{ color: "var(--text-medium)", fontWeight: 600 }}>My Profile</span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--primary)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                >
                  <ArrowLeft size={13} />
                  {backLabel}
                </button>
                <ChevronRight size={12} style={{ color: "#ccc" }} />
                <span>{profile.name}</span>
              </>
            )}
          </div>

          <div className="profile-layout-row" style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            {/* ── LEFT SIDEBAR — desktop only ── */}
            {isOwnProfile && (
<aside
              className="profile-sidebar"
              style={{
                width: "200px",
                flexShrink: 0,
                background: "#fff",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--shadow-sm)",
                position: "sticky",
                top: "80px",
                alignSelf: "flex-start",
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto",
                overscrollBehaviorY: "auto",
              }}
            >
              {/* Sidebar profile mini */}
              <div
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid var(--border-light)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    objectFit: "contain" as const,
                    background: "#F8F0F0",
                    border: "2px solid var(--primary-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 0.5rem",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {photo
                    ? <img src={photo} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    : <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" opacity="0.5"><circle cx="12" cy="7" r="5"/><path d="M4 21c0-4.5 3.6-8 8-8s8 3.5 8 8"/></svg>
                  }
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)" }}>
                  {profile.name.split(" ")[0]}
                </div>
              </div>

              {/* Nav items */}
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.label);
                    const element = document.getElementById(item.id);
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.625rem 1rem",
                    border: "none",
                    borderLeft:
                      activeSection === item.label
                        ? "3px solid var(--primary)"
                        : "3px solid transparent",
                    background:
                      activeSection === item.label ? "var(--primary-light)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.8125rem",
                    fontWeight: activeSection === item.label ? 700 : 400,
                    color: activeSection === item.label ? "var(--primary)" : "var(--text-dark)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {item.label}
                  <ChevronRight size={12} style={{ color: "#ccc", flexShrink: 0 }} />
                </button>
              ))}
            </aside>
)}

            {/* ── MAIN CONTENT ── */}
            <div className="profile-center-col" style={{ flex: 1, minWidth: 0 }}>

              {/* ══════════════════════════════════════════════════
                  1. PERSONAL INFORMATION — AT THE TOP
                  (Separated logic for clean responsive layout)
                  ══════════════════════════════════════════════════ */}
              {isOwnProfile ? (
                <div style={{ background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-color)", overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: "1rem" }}>
                  <div style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)", padding: "0.75rem 1.125rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>My Profile</span>
                    <button onClick={() => router.push("/profile/edit")} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "var(--radius-full)", padding: "4px 12px", color: "white", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                      <Edit2 size={11} /> Edit Profile
                    </button>
                  </div>
                  <div className="my-profile-top-card" style={{ display: "flex", flexWrap: "nowrap", padding: "1.5rem", gap: "1.5rem" }}>
                    {/* Photo */}
                    <div className="my-profile-photo-wrap" style={{ flexShrink: 0, width: "140px" }}>
                      <div style={{ width: "100%", height: "175px", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#f5f0f0", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)", marginBottom: "0.75rem" }}>
                        {photo ? (
                          <img 
                            src={photo} 
                            alt={profile.name} 
                            onClick={() => { setLightboxPhoto(photo); setLightboxIndex(0); }}
                            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} 
                          />
                        ) : (
                          <UserCircle size={64} style={{ color: "var(--text-light)" }} />
                        )}
                      </div>
                    <Link
                      href="/profile/edit"
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "0.5rem 0",
                        textAlign: "center",
                        background: "#fff",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--primary)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        boxShadow: "var(--shadow-sm)"
                      }}
                    >
                      Add/Edit Photos
                    </Link>
                  </div>
                  {/* Info */}
                  <div className="my-profile-info-wrap" style={{ flex: 1, minWidth: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>{profile.name}</h1>
                        {profile.isVerified && <CheckCircle size={18} fill="var(--success)" stroke="white" strokeWidth={2.5} />}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        Profile created for {profile.gender === "female" ? "Friend" : "Son"}
                      </div>
                      <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.9375rem", color: "var(--text-medium)", marginTop: "0.5rem" }}>
                        <div><strong style={{ color: "var(--text-dark)" }}>{profileAge ? `${profileAge} Yrs` : "—"}</strong>{profile.height ? `, ${profile.height}` : ""}</div>
                        {profile.religion || profile.community ? (
                          <div>{[profile.religion, profile.community].filter(Boolean).join(", ")}</div>
                        ) : null}
                        {profile.location && <div>{profile.location}</div>}
                        {profile.education || profile.occupation ? (
                          <div>{[profile.education, profile.occupation && profile.occupation !== "Not Working" ? profile.occupation : (profile.occupation === "Not Working" ? "Not working" : null)].filter(Boolean).join(", ")}</div>
                        ) : null}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem", padding: "0.75rem 1rem", background: "#f8f9fa", borderRadius: "var(--radius-md)" }}>
                        <Phone size={14} color="var(--primary)" />
                        <span style={{ fontWeight: 600, color: "var(--text-dark)" }}>+91 {profile.mobile || "98765 43210"}</span>
                        <a href="/membership" style={{ fontSize: "0.8125rem", color: "var(--primary)", fontWeight: 600, textDecoration: "none", marginLeft: "auto" }}>Edit / Verify</a>
                      </div>
                      <a href={`/profile/${profile.id}`} style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "0.5rem 1rem", border: "1.5px solid var(--primary)", borderRadius: "var(--radius-full)", color: "var(--primary)", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", marginTop: "0.75rem", alignSelf: "flex-start" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Profile Preview
                      </a>
                    </div>
                  </div>
                </div>              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
                  {/* HEADER SECTION (Left & Right Cards) */}
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "stretch", flexWrap: "wrap" }}>
                    
                    {/* LEFT HEADER: Profile Info */}
                    <div style={{ flex: "2", minWidth: "300px", background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-color)", padding: "1.5rem", display: "flex", gap: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
                      {/* Photo */}
                      <div style={{ flexShrink: 0, width: "140px" }}>
                        <div style={{ width: "140px", height: "175px", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#F8F0F0", border: "1px solid var(--border-light)", position: "relative" }}>
                          {photo ? (
                            <img src={photo} alt={profile.name} onClick={() => { setLightboxPhoto(photo); setLightboxIndex(0); }} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", cursor: "pointer" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary-light)" }}>
                               <UserCircle size={48} color="var(--primary)" opacity={0.5} />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Info & Buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>{profile.name}</h1>
                          {profile.isVerified && <CheckCircle size={16} fill="var(--success)" stroke="white" strokeWidth={2.5} />}
                        </div>
                        
                        <div style={{ fontSize: "0.875rem", color: "var(--text-medium)" }}>
                          {profileAge ? `${profileAge} yrs` : "—"} &bull; {profile.height || "—"} &bull; {profile.religion || "—"}
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.875rem", color: "var(--text-medium)" }}>
                           <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Briefcase size={13} color="#ccc" /> {profile.occupation && profile.occupation !== "Not Working" ? profile.occupation : "Not working"}</div>
                           <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={13} color="#ccc" /> {profile.location || "—"}</div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
                           {profile.education && <span style={{ background: "#f8f9fa", padding: "4px 12px", borderRadius: "16px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-medium)", border: "1px solid var(--border-light)" }}>{profile.education}</span>}
                           {p.maritalStatus && <span style={{ background: "#f8f9fa", padding: "4px 12px", borderRadius: "16px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-medium)", border: "1px solid var(--border-light)" }}>{p.maritalStatus}</span>}
                        </div>
                        
                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                          <button onClick={handleShortlist} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0.5rem 1.25rem", background: shortlisted ? "var(--primary-light)" : "transparent", border: "1.5px solid var(--primary)", borderRadius: "var(--radius-full)", color: "var(--primary)", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
                            <BookmarkPlus size={14} fill={shortlisted ? "var(--primary)" : "none"} /> {shortlisted ? "Shortlisted" : "Shortlist"}
                          </button>
                          <button onClick={handleSendInterest} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0.5rem 1.25rem", background: "var(--primary)", border: "1.5px solid var(--primary)", borderRadius: "var(--radius-full)", color: "#fff", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer" }}>
                            <MessageCircle size={14} /> Message
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* RIGHT HEADER: About Me */}
                    <div style={{ flex: "1", minWidth: "250px", background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-color)", padding: "1.5rem", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.75rem", marginTop: 0 }}>About Me</h3>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-medium)", lineHeight: 1.6, margin: 0 }}>
                        My {profile.gender === "female" ? "friend" : "son"} has completed {profile.education || "Bachelor's degree"}. Currently {profile.occupation === "Not Working" ? "not working" : `working as ${profile.occupation}`} and lives in {profile.location || "Chennai"}. Looking for a partner who shares similar values and dreams.
                      </p>
                    </div>
                  </div>

                  {/* TABS SECTION */}
                  <div style={{ background: "#fff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-color)", padding: "0", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid var(--border-light)", padding: "0 1.5rem", overflowX: "auto" }}>
                      {["Profile Details", "Family Details", "Education & Career", "Expectations"].map((tab) => (
                        <button key={tab} onClick={() => setActiveProfileTab(tab)} style={{ background: "none", border: "none", padding: "1rem 0", color: activeProfileTab === tab ? "var(--primary)" : "var(--text-medium)", fontWeight: activeProfileTab === tab ? 700 : 500, fontSize: "0.875rem", cursor: "pointer", borderBottom: activeProfileTab === tab ? "2px solid var(--primary)" : "2px solid transparent", outline: "none", whiteSpace: "nowrap" }}>
                          {tab}
                        </button>
                      ))}
                    </div>
                    
                    {/* TAB CONTENT */}
                    <div style={{ padding: "1.5rem" }}>
                      <div className="profile-attr-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 2rem" }}>
                        {activeProfileTab === "Profile Details" && (
                          <>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <InfoRow label="Age" value={profileAge ? `${profileAge} Years` : undefined} />
                                <InfoRow label="Height" value={profile.height || undefined} />
                                <InfoRow label="Religion" value={p.religion || undefined} />
                                <InfoRow label="Community" value={p.community || (p.caste && p.subcaste ? `${p.caste} / ${p.subcaste}` : p.caste || p.subcaste || undefined)} />
                                <InfoRow label="Location" value={profile.location || undefined} />
                              </tbody>
                            </table>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <InfoRow label="Occupation" value={profile.occupation || undefined} />
                                <InfoRow label="Annual Income" value={profile.income || undefined} />
                                <InfoRow label="Education" value={profile.education || undefined} />
                                <InfoRow label="Marital Status" value={p.maritalStatus || "Never Married"} />
                                <InfoRow label="Mother Tongue" value={p.motherTongue || "Tamil"} />
                              </tbody>
                            </table>
                          </>
                        )}
                        
                        {activeProfileTab === "Family Details" && (
                          <>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <InfoRow label="Family Values" value={p.familyType ? (p.familyType === "Joint Family" ? "Traditional" : "Modern") : undefined} />
                                <InfoRow label="Family Type" value={p.familyType || undefined} />
                                <InfoRow label="Family Status" value={p.familyStatus || undefined} />
                              </tbody>
                            </table>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <InfoRow label="Father's Occupation" value={p.fatherOccupation || undefined} />
                                <InfoRow label="Mother's Occupation" value={p.motherOccupation || undefined} />
                                <InfoRow label="No. of Brothers" value={p.brothers !== undefined ? String(p.brothers) : undefined} />
                                <InfoRow label="No. of Sisters" value={p.sisters !== undefined ? String(p.sisters) : undefined} />
                              </tbody>
                            </table>
                          </>
                        )}

                        {activeProfileTab === "Education & Career" && (
                          <>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <InfoRow label="Qualification" value={profile.education || undefined} />
                                <InfoRow label="Institution" value={p.college || undefined} />
                              </tbody>
                            </table>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <InfoRow label="Occupation" value={profile.occupation || undefined} />
                                <InfoRow label="Company" value={p.company || undefined} />
                                <InfoRow label="Annual Income" value={profile.income || undefined} />
                              </tbody>
                            </table>
                          </>
                        )}

                        {activeProfileTab === "Expectations" && (
                          <>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <InfoRow label="Age Preference" value={p.partnerAgeMin || p.partnerAgeMax ? `${p.partnerAgeMin || 21} to ${p.partnerAgeMax || 35} Years` : "21 to 35 Years"} />
                                <InfoRow label="Height" value={p.partnerHeightMin || p.partnerHeightMax ? `${p.partnerHeightMin ? p.partnerHeightMin + " cm" : "5'0\""} - ${p.partnerHeightMax ? p.partnerHeightMax + " cm" : "6'0\""}` : "5'0\" - 6'0\""} />
                                <InfoRow label="Marital Status" value={Array.isArray(p.partnerMaritalStatus) && p.partnerMaritalStatus.length > 0 ? p.partnerMaritalStatus.join(", ") : typeof p.partnerMaritalStatus === "string" ? p.partnerMaritalStatus : "Never Married"} />
                                <InfoRow label="Religion / Community" value={`${p.partnerReligion || "Any"} / ${p.partnerCaste || "Any"}`} />
                              </tbody>
                            </table>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <tbody>
                                <InfoRow label="Mother Tongue" value={Array.isArray(p.partnerMotherTongue) && p.partnerMotherTongue.length > 0 ? p.partnerMotherTongue.join(", ") : typeof p.partnerMotherTongue === "string" ? p.partnerMotherTongue : "Tamil"} />
                                <InfoRow label="Education" value={p.partnerEducation || "Graduate / Any Professional Degree"} />
                                <InfoRow label="Occupation" value={p.partnerOccupation || "Any / Private or Govt Sector"} />
                                <InfoRow label="Country of Residence" value={p.partnerCountry || "India"} />
                              </tbody>
                            </table>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isOwnProfile && (<>
{/* ══════════════════════════════════════════════════
                  2. UPLOAD PHOTOS PROMPT (only if isOwnProfile and no photo)
                  ══════════════════════════════════════════════════ */}
              {isOwnProfile && !profile.photoUrl && (
                <div
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
                    borderRadius: "var(--radius-xl)",
                    padding: "1.25rem 1.375rem",
                    marginBottom: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Text block — full width, horizontal flow */}
                  <div style={{ color: "white" }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "4px", lineHeight: 1.4 }}>
                      Photos are the first thing that prospects look at.
                    </p>
                    <p style={{ fontSize: "0.8125rem", opacity: 0.9, lineHeight: 1.5, margin: 0 }}>
                      Add your photo and get 10 times more responses!
                    </p>
                  </div>
                  {/* Buttons — bottom row */}
                  <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => toast("Skipped")}
                      style={{
                        padding: "0.5rem 1.25rem",
                        border: "1px solid rgba(255,255,255,0.5)",
                        borderRadius: "var(--radius-full)",
                        background: "transparent",
                        color: "white",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => router.push("/profile/edit?section=photo")}
                      style={{
                        padding: "0.5rem 1.375rem",
                        border: "none",
                        borderRadius: "var(--radius-full)",
                        background: "white",
                        color: "var(--primary)",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Upload Photos Now
                    </button>
                  </div>
                </div>
              )}


              {/* ══════════════════════════════════════════════════
                  PHOTO GALLERY
                  ══════════════════════════════════════════════════ */}
              {/* Show gallery section always for own profile (with empty state), or when others have photos */}
              {(isOwnProfile || galleryPhotos.length > 0) && (
                <SectionCard
                  id="section-Photo-Gallery"
                  title={galleryPhotos.length > 0 ? `Photo Gallery (${galleryPhotos.length})` : "Photo Gallery"}
                  onEdit={isOwnProfile ? () => router.push("/profile/edit?section=photo") : undefined}
                >
                  {galleryPhotos.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
                      {galleryPhotos.sort((a, b) => a.sortOrder - b.sortOrder).map((ph, phIdx) => (
                        <div
                          key={ph.id}
                          onClick={() => { setLightboxPhoto(ph.url); setLightboxIndex(phIdx); }}
                          style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", aspectRatio: "3/4", border: "1px solid var(--border-color)", cursor: "pointer" }}
                        >
                          <img src={ph.url} alt="Gallery photo" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#F8F0F0" }} />
                          <div style={{ position: "absolute", inset: 0, background: "transparent", transition: "background 0.2s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.15)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty state — only shown for own profile */
                    <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
                      <Camera size={36} style={{ color: "var(--border-color)", margin: "0 auto 0.75rem", display: "block" }} />
                      <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.375rem", fontSize: "0.9375rem" }}>
                        No photos added yet
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        Profiles with photos get 8× more responses
                      </p>
                      <button
                        onClick={() => router.push("/profile/edit?section=photo")}
                        style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-full)", padding: "0.5rem 1.5rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                      >
                        Add Photos Now
                      </button>
                    </div>
                  )}
                </SectionCard>
              )}

              {/* Photo lightbox modal */}
              {lightboxPhoto && (
                <div
                  onClick={() => setLightboxPhoto(null)}
                  style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
                    zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {/* Close */}
                  <button
                    onClick={() => setLightboxPhoto(null)}
                    style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  {/* Prev */}
                  {profile.photos && profile.photos.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); const sorted = profile.photos!.sort((a,b)=>a.sortOrder-b.sortOrder); const prev = (lightboxIndex - 1 + sorted.length) % sorted.length; setLightboxIndex(prev); setLightboxPhoto(sorted[prev].url); }}
                      style={{ position: "absolute", left: "1rem", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                  )}
                  {/* Image */}
                  <img
                    src={lightboxPhoto}
                    alt="Photo"
                    onClick={e => e.stopPropagation()}
                    style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
                  />
                  {/* Next */}
                  {profile.photos && profile.photos.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); const sorted = profile.photos!.sort((a,b)=>a.sortOrder-b.sortOrder); const next = (lightboxIndex + 1) % sorted.length; setLightboxIndex(next); setLightboxPhoto(sorted[next].url); }}
                      style={{ position: "absolute", right: "1rem", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  )}
                  {/* Counter */}
                  {profile.photos && profile.photos.length > 1 && (
                    <div style={{ position: "absolute", bottom: "1.25rem", color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>
                      {lightboxIndex + 1} / {profile.photos.length}
                    </div>
                  )}
                </div>
              )}
              {/* ══════════════════════════════════════════════════
                  3. BASIC INFORMATION
                  ══════════════════════════════════════════════════ */}
              <SectionCard id="section-Basic-Information" title="Basic Information" onEdit={isOwnProfile ? () => router.push("/profile/edit?section=basic") : undefined}>
                {/* About Me */}
                <div style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "0.375rem" }}>
                    About Me
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", lineHeight: 1.65 }}>
                    My {profile.gender === "female" ? "friend" : "son"} has completed{" "}
                    {profile.education || "Bachelor's degree"}. Currently{" "}
                    {profile.occupation === "Not Working"
                      ? "not working"
                      : `working as ${profile.occupation}`}{" "}
                    and lives in {profile.location || "Chennai"}.
                  </p>
                </div>

                {/* Two-column attribute table */}
                <div className="profile-attr-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
                  {/* Left column */}
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <InfoRow label="Profile created for" value={profile.gender === "female" ? "Friend" : "Son"} />
                      <InfoRow label="Body Type" value={p.bodyType || undefined} addLink isOwnProfile={isOwnProfile} editSection="lifestyle" />
                      <InfoRow label="Physical Status" value={p.physicalStatus || "Normal"} />
                      <InfoRow label="Weight" value={p.weight ? `${p.weight} kg` : undefined} addLink isOwnProfile={isOwnProfile} editSection="basic" />
                      <InfoRow label="Marital Status" value={p.maritalStatus || "Never Married"} />
                      <InfoRow label="Drinking Habits" value={p.drinking || undefined} addLink isOwnProfile={isOwnProfile} editSection="lifestyle" />
                    </tbody>
                  </table>
                  {/* Right column */}
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <InfoRow label="Name" value={profile.name} />
                      <InfoRow label="Age" value={profileAge ? `${profileAge} Years` : undefined} />
                      <InfoRow label="Height" value={profile.height || undefined} addLink isOwnProfile={isOwnProfile} editSection="basic" />
                      <InfoRow label="Mother Tongue" value={p.motherTongue || "Tamil"} />
                      <InfoRow label="Eating Habits" value={p.diet || undefined} addLink isOwnProfile={isOwnProfile} editSection="lifestyle" />
                      <InfoRow label="Smoking Habits" value={p.smoking || undefined} addLink isOwnProfile={isOwnProfile} editSection="lifestyle" />
                    </tbody>
                  </table>
                </div>

                {/* Education & Career sub-section */}
                <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-light)" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "0.625rem" }}>
                    Education & Career
                  </h3>
                  <div className="profile-edu-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 1.5rem", fontSize: "0.8125rem" }}>
                    {[
                      ["Qualification", profile.education || "—"],
                      ["Occupation", profile.occupation || "—"],
                      ["Company", p.company || "—"],
                      ["Annual Income", profile.income || "—"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: "0.5rem", padding: "0.375rem 0", borderBottom: "1px solid var(--border-light)" }}>
                        <span style={{ color: "#888", width: "180px", flexShrink: 0 }}>{k}</span>
                        <span style={{ color: "var(--text-dark)", fontWeight: 500 }}>
                          <span style={{ color: "#ccc", marginRight: "4px" }}>:</span>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* ══════════════════════════════════════════════════
                  4. RELIGION & HOROSCOPE DETAILS (Combined)
                  ══════════════════════════════════════════════════ */}
              <SectionCard id="section-Religion-Horoscope" title="Religion & Horoscope Details" onEdit={isOwnProfile ? () => router.push("/profile/edit?section=religion") : undefined}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }} className="profile-attr-grid">
                  {/* Left: Religious info */}
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <InfoRow label="Religion" value={p.religion || undefined} />
                      <InfoRow label="Caste / Sub Caste" value={p.community || (p.caste && p.subcaste ? `${p.caste} / ${p.subcaste}` : p.caste || p.subcaste || undefined)} />
                      <InfoRow label="Gothram" value={p.gothram || undefined} />
                      <InfoRow label="Star (Nakshatra)" value={p.star || undefined} addLink isOwnProfile={isOwnProfile} />
                      <InfoRow label="Raasi (Moon Sign)" value={p.rasi || undefined} addLink isOwnProfile={isOwnProfile} />
                      <InfoRow label="Dhosham" value={p.dhosham || undefined} />
                    </tbody>
                  </table>
                  {/* Right: Horoscope birth details */}
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <InfoRow label="Date of Birth" value={isOwnProfile ? (p.dob || dobStr || undefined) : (p.dob || dobStr ? "Available" : undefined)} />
                      <InfoRow label="Time of Birth" value={isOwnProfile ? (p.timeOfBirth || undefined) : (p.timeOfBirth ? "Available" : undefined)} addLink isOwnProfile={isOwnProfile} editSection="religion" />
                      <InfoRow label="Place of Birth" value={p.nativePlace || p.city || undefined} />
                      <InfoRow label="Country of Birth" value={p.country || "India"} />
                      <InfoRow label="Mother Tongue" value={p.motherTongue || "Tamil"} />
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              {/* ══════════════════════════════════════════════════
                  5. LOCATION DETAILS
                  ══════════════════════════════════════════════════ */}
              <SectionCard id="section-Location" title="Location Details" onEdit={isOwnProfile ? () => router.push("/profile/edit?section=location") : undefined}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <InfoRow label="Country" value={p.country || "India"} />
                    <InfoRow label="State" value={p.state || undefined} />
                    <InfoRow label="City" value={p.city || (profile.location?.split(",")[0]) || undefined} />
                    <InfoRow label="Native Place" value={p.nativePlace || undefined} />
                    <InfoRow label="Residency Status" value="Citizen" />
                  </tbody>
                </table>
              </SectionCard>

              {/* ══════════════════════════════════════════════════
                  6. FAMILY DETAILS
                  ══════════════════════════════════════════════════ */}
              <SectionCard id="section-Family-Details" title="Family Details" onEdit={isOwnProfile ? () => router.push("/profile/edit?section=family") : undefined}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <InfoRow label="Family Values" value={p.familyType ? (p.familyType === "Joint Family" ? "Traditional" : "Modern") : undefined} />
                    <InfoRow label="Family Type" value={p.familyType || undefined} />
                    <InfoRow label="Family Status" value={p.familyStatus || undefined} />
                    <InfoRow label="Father's Occupation" value={p.fatherOccupation || undefined} />
                    <InfoRow label="Mother's Occupation" value={p.motherOccupation || undefined} />
                    <InfoRow label="No. of Brothers" value={p.brothers !== undefined ? String(p.brothers) : undefined} />
                    <InfoRow label="No. of Sisters" value={p.sisters !== undefined ? String(p.sisters) : undefined} />
                  </tbody>
                </table>
              </SectionCard>


              {/* ══════════════════════════════════════════════════
                  7b. PARTNER PREFERENCES
                  ══════════════════════════════════════════════════ */}
              <SectionCard
                id="section-Partner-Preferences"
                title="Partner Preferences"
                onEdit={isOwnProfile ? () => router.push("/profile/edit?section=partner") : undefined}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <InfoRow
                      label="Age Preference"
                      value={
                        p.partnerAgeMin || p.partnerAgeMax
                          ? `${p.partnerAgeMin || 21} to ${p.partnerAgeMax || 35} Years`
                          : "21 to 35 Years"
                      }
                    />
                    <InfoRow
                      label="Height"
                      value={
                        p.partnerHeightMin || p.partnerHeightMax
                          ? `${p.partnerHeightMin ? p.partnerHeightMin + " cm" : "5'0\""} - ${p.partnerHeightMax ? p.partnerHeightMax + " cm" : "6'0\""}`
                          : "5'0\" - 6'0\""
                      }
                    />
                    <InfoRow
                      label="Marital Status"
                      value={
                        Array.isArray(p.partnerMaritalStatus) && p.partnerMaritalStatus.length > 0
                          ? p.partnerMaritalStatus.join(", ")
                          : typeof p.partnerMaritalStatus === "string"
                          ? p.partnerMaritalStatus
                          : "Never Married"
                      }
                    />
                    <InfoRow
                      label="Religion / Community"
                      value={`${p.partnerReligion || "Any"} / ${p.partnerCaste || "Any"}`}
                    />
                    <InfoRow
                      label="Mother Tongue"
                      value={
                        Array.isArray(p.partnerMotherTongue) && p.partnerMotherTongue.length > 0
                          ? p.partnerMotherTongue.join(", ")
                          : typeof p.partnerMotherTongue === "string"
                          ? p.partnerMotherTongue
                          : "Tamil"
                      }
                    />
                    <InfoRow
                      label="Education"
                      value={p.partnerEducation || "Graduate / Any Professional Degree"}
                    />
                    <InfoRow
                      label="Occupation"
                      value={p.partnerOccupation || "Any / Private or Govt Sector"}
                    />
                    <InfoRow
                      label="Country of Residence"
                      value={p.partnerCountry || "India"}
                    />
                  </tbody>
                </table>
              </SectionCard>

              {/* ══════════════════════════════════════════════════
                  8. CONTACT DETAILS (locked for others)
                  ══════════════════════════════════════════════════ */}
              {!isOwnProfile && (
              <SectionCard id="section-Contact-Details" title="Contact Details">
                <div style={{ textAlign: "center", padding: "0.75rem 0" }}>
                  <div
                    style={{
                      fontSize: "0.9375rem",
                      color: "var(--text-dark)",
                      marginBottom: "0.75rem",
                      filter: hasRevealedContact && canViewContact ? "none" : "blur(4px)",
                      userSelect: hasRevealedContact && canViewContact ? "auto" : "none",
                      fontWeight: 600,
                    }}
                  >
                    +91 {profile.mobile || "98765 43210"}
                  </div>
                  {hasRevealedContact && canViewContact ? (
                    <a
                      href={`tel:+91${profile.mobile || "9876543210"}`}
                      style={{
                        background: "#10b981", // Green color for Call Now
                        color: "#fff",
                        border: "none",
                        borderRadius: "var(--radius-full)",
                        padding: "0.5rem 1.75rem",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      Call Now
                    </a>
                  ) : (
                    <button
                      onClick={handleRevealContact}
                      style={{
                        background: "var(--primary)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "var(--radius-full)",
                        padding: "0.5rem 1.75rem",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        boxShadow: "var(--shadow-pink)",
                      }}
                    >
                      Reveal Contact
                    </button>
                  )}
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.625rem" }}>
                    {contactLimit === 0
                      ? "Upgrade to view contacts"
                      : contactLimit !== Infinity
                      ? `${revealsUsed} of ${contactLimit} monthly views used`
                      : "Unlimited contact views with your plan"}
                  </p>
                </div>
              </SectionCard>
              )}
            
</>)}
</div>

            {/* ── RIGHT PANEL — Partner Preferences etc. ── */}
            {isOwnProfile && (
              <aside
                className="profile-right-panel"
                style={{
                  width: "220px",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  position: "sticky",
                  top: "80px",
                  alignSelf: "flex-start",
                  maxHeight: "calc(100vh - 100px)",
                  overflowY: "auto",
                  overscrollBehaviorY: "auto",
                }}
              >
                {/* Add Partner Preferences */}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-xl)",
                    padding: "1rem",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", marginBottom: "0.875rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--primary-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Heart size={16} style={{ color: "var(--primary)" }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)" }}>
                        Add Partner Preferences
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px" }}>
                        To find your perfect match
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/profile/edit?section=partner"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--primary)",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      textDecoration: "none",
                    }}
                  >
                    Add Partner Preferences ▶
                  </Link>
                </div>

                {/* Add Photos */}
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-xl)",
                    padding: "1rem",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", marginBottom: "0.875rem" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#E3F2FD",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Camera size={20} color="#1565C0" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)" }}>
                        Add Photos
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "2px", lineHeight: 1.4 }}>
                        Photos are the first things members look for in a profile.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/profile/edit?section=photo"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: "var(--primary)",
                      fontWeight: 700,
                      fontSize: "0.8125rem",
                      textDecoration: "none",
                    }}
                  >
                    Add Photos Now ▶
                  </Link>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
      <CompactFooter />
    </>
  );
}

export default function ProfileDetailPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-page)" }} />}>
      <ProfileDetailPage params={params} />
    </Suspense>
  );
}
