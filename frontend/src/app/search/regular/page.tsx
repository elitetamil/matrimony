"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import CompactFooter from "@/components/layout/CompactFooter";
import { useAuth } from "@/context/AuthContext";
import { RELIGIONS, MOTHER_TONGUES, MARITAL_STATUS, PHYSICAL_STATUS, EDUCATION_LEVELS, OCCUPATIONS, INCOME_RANGES, COUNTRIES, INDIAN_STATES, EATING_HABITS, STARS, RAASI_LIST, DHOSHAM_OPTIONS, RELIGION_TO_CASTES, CASTE_TO_SUBCASTE } from '@/data/matrimony-data';
import { Search, SlidersHorizontal, X, Grid3X3, List, Heart, Bookmark, MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { sendInterestWithNotification, shortlistProfileWithNotification } from "@/lib/auth-store";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import ProfileCard from "@/components/ui/MatchesProfileCard";
import SkeletonCard from "@/components/ui/SkeletonCard";


// ── COLLAPSIBLE SECTION ────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean; }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "1rem" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: "100%", background: "#f8f9fa", padding: "0.75rem 1rem", border: "1px solid #e0e0e0", borderBottom: open ? "none" : "1px solid #e0e0e0", borderRadius: open ? "6px 6px 0 0" : "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-sans)" }}>
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#333" }}>{title}</span>
        {open ? <span style={{ color: "#888", fontSize: "0.75rem" }}>▲</span> : <span style={{ color: "#888", fontSize: "0.75rem" }}>▼</span>}
      </button>
      {open && (
        <div style={{ border: "1px solid #e0e0e0", borderTop: "none", borderRadius: "0 0 6px 6px", padding: "1.25rem", background: "#fff" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean; }) {
  return (
    <div style={{ marginBottom: "1rem", width: fullWidth ? "100%" : undefined }}>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#666", marginBottom: "0.3125rem" }}>{label}</label>
      {children}
    </div>
  );
}

function Sel({ value, onChange, options, placeholder = "Any" }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string; }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px", fontSize: "0.8125rem", backgroundColor: "#fff" }}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function RangeField({ label, fromValue, toValue, onFromChange, onToChange, options }: { label: string; fromValue: string; toValue: string; onFromChange: (v: string) => void; onToChange: (v: string) => void; options: { value: string; label: string }[]; }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#666", marginBottom: "0.3125rem" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Sel value={fromValue} onChange={onFromChange} options={options} placeholder="Min" />
        <span style={{ color: "#999", fontSize: "0.8125rem" }}>to</span>
        <Sel value={toValue} onChange={onToChange} options={options} placeholder="Max" />
      </div>
    </div>
  );
}

function MotherTongueMulti({ selected, onToggle }: { selected: string[]; onToggle: (lang: string) => void; }) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? MOTHER_TONGUES : MOTHER_TONGUES.slice(0, 10);
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#666", marginBottom: "0.3125rem" }}>Mother Tongue</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
        {display.map((lang) => (
          <button key={lang} onClick={(e) => { e.preventDefault(); onToggle(lang); }} style={{ padding: "0.25rem 0.75rem", border: selected.includes(lang) ? "1.5px solid var(--primary)" : "1px solid #ccc", borderRadius: "20px", background: selected.includes(lang) ? "var(--primary-light)" : "#fff", color: selected.includes(lang) ? "var(--primary)" : "#666", fontSize: "0.75rem", cursor: "pointer" }}>{lang}</button>
        ))}
        {!showAll && <button onClick={(e) => { e.preventDefault(); setShowAll(true); }} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.75rem", cursor: "pointer" }}>+{MOTHER_TONGUES.length - 10} more</button>}
      </div>
    </div>
  );
}


function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const defaultLookingFor = user?.gender === "female" ? "groom" : "bride";
  const [query, setQuery] = useState(() => {
    if (typeof window !== "undefined") {
      if (searchParams.toString()) return searchParams.get("q") || "";
      return sessionStorage.getItem("search_regular_q") || "";
    }
    return searchParams.get("q") || "";
  });

  const [lookingFor, setLookingFor] = useState(searchParams.get("looking_for") || defaultLookingFor);

  useEffect(() => {
    if (user?.gender) {
      setLookingFor(user.gender === "female" ? "groom" : "bride");
    }
  }, [user?.gender]);

  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sort, setSort] = useState("relevance");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filters, setFilters] = useState(() => {
    const defaultF = {
      religion: searchParams.get("religion") || "",
      mother_tongues: [] as string[],
      age_min: searchParams.get("ageFrom") || "18",
      age_max: searchParams.get("ageTo") || "45",
      height_min: searchParams.get("heightFrom") || "121",
      height_max: searchParams.get("heightTo") || "213",
      marital_status: "",
      physical_status: "",
      caste: searchParams.get("caste") || "",
      sub_caste: "",
      education: "",
      occupation: "",
      income: "",
      country: "",
      state: "",
      city: "",
      eating: "",
      drinking: "",
      smoking: "",
      star: "",
      raasi: "",
      dhosham: "",
      verified_only: false,
    };
    if (typeof window !== "undefined") {
      if (searchParams.toString()) return defaultF;
      const saved = sessionStorage.getItem("search_regular_f");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return defaultF;
  });

  // Staged filters — only applied when user clicks Apply
  const [stagedFilters, setStagedFilters] = useState(filters);

  useEffect(() => {
    sessionStorage.setItem("search_regular_q", query);
    sessionStorage.setItem("search_regular_f", JSON.stringify(filters));
  }, [query, filters]);

  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [sentInterestIds, setSentInterestIds] = useState<Set<string>>(new Set());
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchRealProfiles() {
      setLoadingProfiles(true);
      const gender = lookingFor === "bride" ? "female" : "male";
      const { data } = await supabase
        .from("profiles")
        .select("*, photos:profile_photos(*)")
        .eq("gender", gender)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const mapped = data.map((row: any) => ({
          ...row,
          id: row.id,
          name: row.name || "Unknown",
          age: row.dob ? Math.floor((Date.now() - new Date(row.dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : 0,
          dob: row.dob,
          city: row.city,
          state: row.state,
          country: row.country,
          location: [row.city, row.state].filter(Boolean).join(", ") || "India",
          occupation: row.occupation || "",
          education: row.education || "",
          religion: row.religion || "",
          community: row.caste || "",
          caste: row.caste || "",
          subcaste: row.subcaste || "",
          maritalStatus: row.marital_status || "",
          motherTongue: row.mother_tongue || "",
          physicalStatus: row.physical_status || "",
          height: row.height || "",
          diet: row.diet || "",
          dhosham: row.dhosham || "",
          star: row.star || "",
          raasi: row.raasi || "",
          income: row.income || "",
          isVerified: row.is_verified || false,
          isOnline: row.is_online || false,
          isPremium: row.is_premium || false,
          photoUrl: row.photos && row.photos.length > 0 ? row.photos[0].url : row.photo_url,
          photos: row.photos,
          gender: row.gender,
        }));
        setDbProfiles(mapped);
      }
      setLoadingProfiles(false);
    }
    fetchRealProfiles();
  }, [lookingFor]);

  const filtered = dbProfiles.filter((p) => {
    if (query) {
      const q = query.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(q) ||
        p.occupation.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.community.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filters.religion && p.religion?.toLowerCase() !== filters.religion.toLowerCase()) return false;
    if (filters.caste && p.caste?.toLowerCase() !== filters.caste.toLowerCase()) return false;
    if (filters.sub_caste && p.subcaste?.toLowerCase() !== filters.sub_caste.toLowerCase()) return false;
    
    if (p.age < Number(filters.age_min) || p.age > Number(filters.age_max)) return false;
    if (p.height && Number(p.height) > 0) {
      if (Number(p.height) < Number(filters.height_min) || Number(p.height) > Number(filters.height_max)) return false;
    }
    
    if (filters.mother_tongue && filters.mother_tongue !== "") {
      if (!p.motherTongue || p.motherTongue.toLowerCase() !== filters.mother_tongue.toLowerCase()) return false;
    } else if (filters.mother_tongues && filters.mother_tongues.length > 0) {
      const lowerPrefs = filters.mother_tongues.map((m:string) => m.toLowerCase());
      if (!p.motherTongue || !lowerPrefs.includes(p.motherTongue.toLowerCase())) return false;
    }
    
    // Additional exact matches
    if (filters.income && p.income && p.income.toLowerCase() !== filters.income.toLowerCase()) return false;
    if (filters.star && p.star && p.star.toLowerCase() !== filters.star.toLowerCase()) return false;
    if (filters.raasi && p.raasi && p.raasi.toLowerCase() !== filters.raasi.toLowerCase()) return false;
    
    if (filters.marital_status && p.maritalStatus?.toLowerCase() !== filters.marital_status.toLowerCase()) return false;
    if (filters.education && p.education?.toLowerCase() !== filters.education.toLowerCase()) return false;
    if (filters.occupation && p.occupation?.toLowerCase() !== filters.occupation.toLowerCase()) return false;
    if (filters.country && p.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
    if (filters.state && p.state?.toLowerCase() !== filters.state.toLowerCase()) return false;
    if (filters.city && p.city?.toLowerCase() !== filters.city.toLowerCase()) return false;
    
    if (filters.physical_status && p.physicalStatus && p.physicalStatus.toLowerCase() !== filters.physical_status.toLowerCase()) return false;
    if (filters.eating && p.diet && p.diet.toLowerCase() !== filters.eating.toLowerCase()) return false;
    if (filters.dhosham && p.dhosham && p.dhosham.toLowerCase() !== filters.dhosham.toLowerCase()) return false;

    if (filters.verified_only && !p.isVerified) return false;
    if (hiddenIds.has(p.id)) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "age_asc") return a.age - b.age;
    if (sort === "age_desc") return b.age - a.age;
    return 0;
  });

  // Scroll to top on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    });
  }, []);

  const handleApplyFilters = () => {
    setFilters(stagedFilters);
    setSidebarOpen(false);
  };

  const handleClearFilters = () => {
    const cleared = { religion: "", mother_tongues: [], age_min: "18", age_max: "45", height_min: "121", height_max: "213", marital_status: "", physical_status: "", caste: "", sub_caste: "", education: "", occupation: "", income: "", country: "", state: "", city: "", eating: "", drinking: "", smoking: "", star: "", raasi: "", dhosham: "", verified_only: false };
    setStagedFilters(cleared);
    setFilters(cleared);
    setQuery("");
    sessionStorage.removeItem("search_regular_q");
    sessionStorage.removeItem("search_regular_f");
  };

  const handleSendInterest = async (profileId: string, name: string) => {
    if (!user) { toast.error("Please login"); return; }
    await sendInterestWithNotification(user.id, profileId, user.name);
    setSentInterestIds(prev => new Set([...prev, profileId]));
    toast.success(`Interest sent to ${name}!`);
  };

  const handleShortlist = async (profileId: string, name: string) => {
    if (!user) { toast.error("Please login"); return; }
    await shortlistProfileWithNotification(user.id, profileId);
    setShortlistedIds(prev => new Set([...prev, profileId]));
    toast.success(`${name} shortlisted!`);
  };

  const handleMessage = (profileId: string) => {
    if (!user) { toast.error("Please login"); return; }
    router.push(`/messages?chat=${profileId}`);
  };

  const handleHide = (profileId: string, name: string) => {
    setHiddenIds(prev => new Set([...prev, profileId]));
    toast.success(`${name} hidden`);
  };

  return (
    <>
      <Navbar />
      <style>{`
        @media (max-width: 899px) {
          .sr-sidebar { display: none !important; }
          .sr-sidebar.open { display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; bottom: 0 !important; width: 85vw !important; max-width: 300px !important; z-index: 200 !important; background: #fff !important; flex-direction: column !important; overflow-y: auto !important; border-radius: 0 12px 12px 0 !important; box-shadow: 4px 0 24px rgba(0,0,0,0.18) !important; }
        }
        @media (min-width: 900px) {
          .sr-sidebar-toggle { display: none !important; }
          .sr-sidebar { display: flex !important; }
        }
        .sr-profile-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.10) !important; }
      `}</style>

      <main style={{ background: "#f7f7f7", height: "calc(100vh - 64px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "stretch",
            flex: 1,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 199 }} />
          )}

          {/* ── LEFT SIDEBAR ── */}
          <aside
            className={`sr-sidebar${sidebarOpen ? " open" : ""}`}
            style={{
              width: "268px",
              flexShrink: 0,
              background: "#fff",
              borderRight: "1px solid #e0e0e0",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            {/* Sidebar header */}
            <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#111", display: "flex", alignItems: "center", gap: "6px" }}>
                <SlidersHorizontal size={15} /> Filters
              </span>
              <button onClick={() => setSidebarOpen(false)} className="sr-sidebar-toggle" style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>

            {/* Filter fields */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
              {/* Looking for toggle */}
              {!user && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Looking For</label>
                  <div style={{ display: "flex", border: "1.5px solid #e0e0e0", borderRadius: "6px", overflow: "hidden" }}>
                    {["bride", "groom"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setLookingFor(g)}
                        style={{
                          flex: 1, padding: "0.4375rem 0", border: "none",
                          background: lookingFor === g ? "#6B1A2A" : "#fff",
                          color: lookingFor === g ? "#fff" : "#555",
                          fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
                          fontFamily: "var(--font-sans)", textTransform: "capitalize",
                        }}
                      >{g}s</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Basic Details */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "1rem 0 0.5rem", color: "#444" }}>Basic Details</h4>
                  
                  {/* Age range */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Age</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <select className="form-select" style={{ fontSize: "0.8125rem", flex: 1 }} value={stagedFilters.age_min} onChange={(e) => setStagedFilters({ ...stagedFilters, age_min: e.target.value })}>
                        {Array.from({ length: 35 }, (_, i) => 18 + i).map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <span style={{ color: "#888", fontSize: "0.8125rem", flexShrink: 0 }}>to</span>
                      <select className="form-select" style={{ fontSize: "0.8125rem", flex: 1 }} value={stagedFilters.age_max} onChange={(e) => setStagedFilters({ ...stagedFilters, age_max: e.target.value })}>
                        {Array.from({ length: 35 }, (_, i) => 18 + i).map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {/* Height */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Height (cm)</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <select className="form-select" style={{ fontSize: "0.8125rem", flex: 1 }} value={stagedFilters.height_min} onChange={(e) => setStagedFilters({ ...stagedFilters, height_min: e.target.value })}>
                        {Array.from({ length: 93 }, (_, i) => 121 + i).map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span style={{ color: "#888", fontSize: "0.8125rem", flexShrink: 0 }}>to</span>
                      <select className="form-select" style={{ fontSize: "0.8125rem", flex: 1 }} value={stagedFilters.height_max} onChange={(e) => setStagedFilters({ ...stagedFilters, height_max: e.target.value })}>
                        {Array.from({ length: 93 }, (_, i) => 121 + i).map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Marital Status */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Marital Status</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.marital_status} onChange={(e) => setStagedFilters({ ...stagedFilters, marital_status: e.target.value })}>
                      <option value="">Any</option>
                      {MARITAL_STATUS.map((m: any) => <option key={m.value || m} value={m.value || m}>{m.label || m}</option>)}
                    </select>
                  </div>

                  {/* Mother Tongue */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Mother Tongue</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.mother_tongue} onChange={(e) => setStagedFilters({ ...stagedFilters, mother_tongue: e.target.value })}>
                      <option value="">Any</option>
                      {MOTHER_TONGUES.map((m: string) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  
                  {/* Physical Status */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Physical Status</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.physical_status} onChange={(e) => setStagedFilters({ ...stagedFilters, physical_status: e.target.value })}>
                      <option value="">Any</option>
                      {PHYSICAL_STATUS.map((p: any) => <option key={p.value || p} value={p.value || p}>{p.label || p}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Religious Details */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Religious Details</h4>
                  
                  {/* Religion */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Religion</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.religion} onChange={(e) => { setStagedFilters({ ...stagedFilters, religion: e.target.value, caste: "", sub_caste: "" }); }}>
                      <option value="">Any Religion</option>
                      {RELIGIONS.map((r: string) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Caste */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Caste</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.caste} onChange={(e) => setStagedFilters({ ...stagedFilters, caste: e.target.value, sub_caste: "" })}>
                      <option value="">Any Caste</option>
                      {(stagedFilters.religion && RELIGION_TO_CASTES[stagedFilters.religion as keyof typeof RELIGION_TO_CASTES] ? RELIGION_TO_CASTES[stagedFilters.religion as keyof typeof RELIGION_TO_CASTES] : []).map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  {/* Subcaste */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Subcaste</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.sub_caste} onChange={(e) => setStagedFilters({ ...stagedFilters, sub_caste: e.target.value })}>
                      <option value="">Any Subcaste</option>
                      {(stagedFilters.caste && CASTE_TO_SUBCASTE[stagedFilters.caste] ? CASTE_TO_SUBCASTE[stagedFilters.caste] : []).map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Professional Details */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Professional Details</h4>
                  
                  {/* Education */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Education</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.education} onChange={(e) => setStagedFilters({ ...stagedFilters, education: e.target.value })}>
                      <option value="">Any</option>
                      {EDUCATION_LEVELS.map((e: string) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  {/* Occupation */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Occupation</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.occupation} onChange={(e) => setStagedFilters({ ...stagedFilters, occupation: e.target.value })}>
                      <option value="">Any</option>
                      {OCCUPATIONS.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                  
                  {/* Income */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Income</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.income} onChange={(e) => setStagedFilters({ ...stagedFilters, income: e.target.value })}>
                      <option value="">Any</option>
                      {INCOME_RANGES.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Location Details */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Location Details</h4>
                  
                  {/* Country */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Country</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.country} onChange={(e) => setStagedFilters({ ...stagedFilters, country: e.target.value })}>
                      <option value="">Any</option>
                      {COUNTRIES.map((e: string) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  {/* State */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>State (India)</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.state} onChange={(e) => setStagedFilters({ ...stagedFilters, state: e.target.value })}>
                      <option value="">Any</option>
                      {INDIAN_STATES.map((e: string) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Lifestyle */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Lifestyle</h4>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Eating Habit</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.eating} onChange={(e) => setStagedFilters({ ...stagedFilters, eating: e.target.value })}>
                      <option value="">Any</option>
                      {EATING_HABITS.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Horoscope */}
                <div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 800, margin: "0 0 0.5rem", color: "#444" }}>Horoscope</h4>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Star</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.star} onChange={(e) => setStagedFilters({ ...stagedFilters, star: e.target.value })}>
                      <option value="">Any</option>
                      {STARS.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Raasi / Moon Sign</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.raasi} onChange={(e) => setStagedFilters({ ...stagedFilters, raasi: e.target.value })}>
                      <option value="">Any</option>
                      {RAASI_LIST.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#888", display: "block", marginBottom: "5px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Dhosham</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem", width: "100%" }} value={stagedFilters.dhosham} onChange={(e) => setStagedFilters({ ...stagedFilters, dhosham: e.target.value })}>
                      <option value="">Any</option>
                      {DHOSHAM_OPTIONS.map((e: any) => <option key={e.value || e} value={e.value || e}>{e.label || e}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ height: "1px", background: "#f0f0f0", margin: "1.5rem 0" }}></div>

                {/* Verified only */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={stagedFilters.verified_only}
                      onChange={(e) => setStagedFilters({ ...stagedFilters, verified_only: e.target.checked })}
                      style={{ accentColor: "#6B1A2A", width: "14px", height: "14px" }}
                    />
                    <span style={{ fontSize: "0.8125rem", color: "#444" }}>Verified profiles only</span>
                  </label>
                </div>
              </div>
            </div>
            {/* Apply / Clear buttons */}
            <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid #f0f0f0", display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button
                onClick={handleClearFilters}
                style={{
                  flex: 1, padding: "0.5rem 0", border: "1.5px solid #e0e0e0",
                  borderRadius: "20px", background: "#fff", color: "#555",
                  fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Clear
              </button>
              <button
                onClick={handleApplyFilters}
                style={{
                  flex: 1, padding: "0.5rem 0", border: "none",
                  borderRadius: "20px", background: "#6B1A2A", color: "#fff",
                  fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Apply
              </button>
            </div>
          </aside>

          {/* ── RIGHT PANEL ── */}
          <div
            className="matches-right-scroll"
            style={{
              flex: 1,
              minWidth: 0,
              background: "#f7f7f7",
              overflowY: "auto",
              overflowX: "hidden",
              padding: "1rem",
            }}
          >
            {/* Sticky top header */}
            <div
              style={{
                background: "#fff",
                borderBottom: "1px solid #e0e0e0",
                padding: "0.75rem 1rem",
                position: "sticky",
                top: 0,
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              {/* Back button inline */}
              <BackButton />

              {/* Mobile filter toggle */}
              <button
                className="sr-sidebar-toggle"
                onClick={() => setSidebarOpen(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "0.375rem 0.75rem", border: "1.5px solid #6B1A2A",
                  borderRadius: "20px", background: "#fff", color: "#6B1A2A",
                  fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <SlidersHorizontal size={13} /> Filters
              </button>

              {/* Search input */}
              <div style={{ flex: 1, position: "relative", minWidth: "140px" }}>
                <Search size={13} style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                <input
                  type="text"
                  placeholder="Search by name, location..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "0.375rem 2rem 0.375rem 1.875rem",
                    border: "1.5px solid #e0e0e0", borderRadius: "20px",
                    fontSize: "0.8125rem", fontFamily: "var(--font-sans)",
                    outline: "none", background: "#fafafa", boxSizing: "border-box",
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  fontSize: "0.8125rem", padding: "0.375rem 0.75rem",
                  border: "1.5px solid #e0e0e0", borderRadius: "6px",
                  fontFamily: "var(--font-sans)", background: "#fff",
                  color: "#444", cursor: "pointer",
                }}
              >
                <option value="relevance">Best Match</option>
                <option value="newest">Newest</option>
                <option value="age_asc">Age: Low → High</option>
                <option value="age_desc">Age: High → Low</option>
              </select>



              {/* Count */}
              <span style={{ fontSize: "0.8125rem", color: "#888", flexShrink: 0 }}>
                <strong style={{ color: "#111" }}>{loadingProfiles ? "…" : filtered.length}</strong> profiles
              </span>
            </div>

            {/* Scrollable results */}
            <div>
              {loadingProfiles ? (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "3rem", textAlign: "center" }}>
                  <Search size={40} style={{ color: "#ccc", margin: "0 auto 0.875rem", display: "block" }} />
                  <p style={{ fontWeight: 700, color: "#444", marginBottom: "0.375rem" }}>No profiles found</p>
                  <p style={{ fontSize: "0.8125rem", color: "#888" }}>Try a different search or adjust filters.</p>
                  <button onClick={handleClearFilters} style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", border: "1.5px solid #6B1A2A", borderRadius: "20px", background: "#fff", color: "#6B1A2A", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {filtered.map((p, idx) => (
                    <ProfileCard
                      key={p.id}
                      profile={p as any}
                      index={idx}
                      onShortlist={() => handleShortlist(p.id, p.name)}
                      onHide={() => handleHide(p.id, p.name)} 
                      onSendInterest={() => handleSendInterest(p.id, p.name)}
                      shortlisted={shortlistedIds.has(p.id)}
                      interestSent={sentInterestIds.has(p.id)}
                      canMessage={user?.isPremium || false}
                      canViewContact={user?.isPremium || false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <CompactFooter />
    </>
  );
}

export default function SearchRegularPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f2f2f2" }}>
        <p style={{ color: "#888", fontSize: "0.875rem" }}>Loading search...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

// force rebuild
