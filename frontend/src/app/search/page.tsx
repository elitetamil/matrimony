"use client";

import { Suspense, useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";
import {
  RELIGIONS,
  MOTHER_TONGUES,
  MARITAL_STATUS,
  PHYSICAL_STATUS,
  EDUCATION_LEVELS,
  OCCUPATIONS,
  INCOME_RANGES,
  COUNTRIES,
  INDIAN_STATES,
  EATING_HABITS,
  SMOKING_OPTIONS,
  DRINKING_OPTIONS,
  STARS,
  RAASI_LIST,
  DHOSHAM_OPTIONS,
  HEIGHTS,
  AGE_OPTIONS,
  RELIGION_TO_CASTES,
  CASTE_TO_SUBCASTE,
  PROFILE_CREATED_BY,
} from "@/data/matrimony-data";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Search, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

type SearchTab = "criteria" | "byname" | "saved";

// ── COLLAPSIBLE SECTION ────────────────────────────────────────────────
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "var(--bg-light)",
          padding: "0.75rem 1rem",
          border: "1px solid var(--border-color)",
          borderBottom: open ? "1px solid var(--border-light)" : "1px solid var(--border-color)",
          borderRadius: open ? "var(--radius-md) var(--radius-md) 0 0" : "var(--radius-md)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--font-sans)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)" }}>{title}</span>
        {open ? <ChevronUp size={15} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />}
      </button>

      {open && (
        <div
          style={{
            border: "1px solid var(--border-color)",
            borderTop: "none",
            borderRadius: "0 0 var(--radius-md) var(--radius-md)",
            padding: "1.25rem",
            background: "#fff",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── 2-COLUMN FORM GRID ────────────────────────────────────────────────
function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "0.875rem 1.5rem",
      }}
      className="search-form-grid"
    >
      {children}
    </div>
  );
}

// ── FIELD (label + control) ────────────────────────────────────────────
function Field({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <label
        style={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-medium)",
          marginBottom: "0.3125rem",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// ── SELECT ─────────────────────────────────────────────────────────────
function Sel({
  value,
  onChange,
  options,
  placeholder = "Any",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="form-select"
      style={{ fontSize: "0.8125rem" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── RANGE ROW (From — To inline) ───────────────────────────────────────
function RangeField({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  options,
  fullWidth = false,
}: {
  label: string;
  fromValue: string;
  toValue: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <label
        style={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-medium)",
          marginBottom: "0.3125rem",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Sel value={fromValue} onChange={onFromChange} options={options} placeholder="Doesn't matter" />
        <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem", flexShrink: 0 }}>to</span>
        <Sel value={toValue} onChange={onToChange} options={options} placeholder="Doesn't matter" />
      </div>
    </div>
  );
}

// ── MOTHER TONGUE MULTI-SELECT ─────────────────────────────────────────
function MotherTongueMulti({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (lang: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? MOTHER_TONGUES : MOTHER_TONGUES.slice(0, 10);

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-medium)",
          marginBottom: "0.3125rem",
          letterSpacing: "0.01em",
        }}
      >
        Mother Tongue
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
        {display.map((lang) => (
          <button
            key={lang}
            onClick={() => onToggle(lang)}
            style={{
              padding: "0.25rem 0.75rem",
              border: selected.includes(lang)
                ? "1.5px solid var(--primary)"
                : "1px solid var(--border-color)",
              borderRadius: "var(--radius-full)",
              background: selected.includes(lang) ? "var(--primary-light)" : "#fff",
              color: selected.includes(lang) ? "var(--primary)" : "var(--text-medium)",
              fontSize: "0.75rem",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontWeight: selected.includes(lang) ? 600 : 400,
              transition: "all 0.12s ease",
            }}
          >
            {lang}
          </button>
        ))}
        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--primary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              padding: "0.25rem 0.25rem",
            }}
          >
            +{MOTHER_TONGUES.length - 10} more
          </button>
        )}
      </div>
    </div>
  );
}

// ── HEIGHT OPTIONS ─────────────────────────────────────────────────────
const HEIGHT_OPTIONS = HEIGHTS.map((h) => ({ value: String(h.value), label: h.label }));
const AGE_OPTS = AGE_OPTIONS.map((a) => ({ value: String(a.value), label: `${a.value} Yrs` }));

// ── MAIN SEARCH FORM ───────────────────────────────────────────────────
function SearchContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SearchTab>("criteria");

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
  }, [activeTab]);
  const [profileIdInput, setProfileIdInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [nameResults, setNameResults] = useState<Array<{id:string;name:string;gender?:string;dob?:string;city?:string;state?:string;occupation?:string}>>([]);
  const [nameLoading, setNameLoading] = useState(false);

  // Basic
  const [ageFrom, setAgeFrom] = useState("22");
  const [ageTo, setAgeTo] = useState("35");
  const [heightFrom, setHeightFrom] = useState("152");
  const [heightTo, setHeightTo] = useState("193");
  const [profileCreatedBy, setProfileCreatedBy] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [physicalStatus, setPhysicalStatus] = useState("");
  const [motherTongues, setMotherTongues] = useState<string[]>([]);

  // Religious
  const [religion, setReligion] = useState("");
  const [caste, setCaste] = useState("");
  const [subCaste, setSubCaste] = useState("");

  // Education & Career
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [incomeFrom, setIncomeFrom] = useState("");
  const [incomeTo, setIncomeTo] = useState("");

  // Location
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");

  // Lifestyle
  const [diet, setDiet] = useState("");
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");

  // Horoscope
  const [star, setStar] = useState("");
  const [raasi, setRaasi] = useState("");
  const [dhosham, setDhosham] = useState("");

  const stateDeps = [
    activeTab, ageFrom, ageTo, heightFrom, heightTo, profileCreatedBy, maritalStatus,
    physicalStatus, motherTongues, religion, caste, subCaste, education, occupation,
    incomeFrom, incomeTo, country, state, diet, smoking, drinking, star, raasi, dhosham
  ];

  // Load from session storage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("search_filters_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        setActiveTab(parsed.activeTab || "criteria");
        setAgeFrom(parsed.ageFrom || "22");
        setAgeTo(parsed.ageTo || "35");
        setHeightFrom(parsed.heightFrom || "152");
        setHeightTo(parsed.heightTo || "193");
        setProfileCreatedBy(parsed.profileCreatedBy || "");
        setMaritalStatus(parsed.maritalStatus || "");
        setPhysicalStatus(parsed.physicalStatus || "");
        setMotherTongues(parsed.motherTongues || []);
        setReligion(parsed.religion || "");
        setCaste(parsed.caste || "");
        setSubCaste(parsed.subCaste || "");
        setEducation(parsed.education || "");
        setOccupation(parsed.occupation || "");
        setIncomeFrom(parsed.incomeFrom || "");
        setIncomeTo(parsed.incomeTo || "");
        setCountry(parsed.country || "");
        setState(parsed.state || "");
        setDiet(parsed.diet || "");
        setSmoking(parsed.smoking || "");
        setDrinking(parsed.drinking || "");
        setStar(parsed.star || "");
        setRaasi(parsed.raasi || "");
        setDhosham(parsed.dhosham || "");
      }
    } catch {}
  }, []);

  // Save to session storage whenever form state changes
  useEffect(() => {
    const stateObj = {
      activeTab, ageFrom, ageTo, heightFrom, heightTo, profileCreatedBy, maritalStatus,
      physicalStatus, motherTongues, religion, caste, subCaste, education, occupation,
      incomeFrom, incomeTo, country, state, diet, smoking, drinking, star, raasi, dhosham
    };
    sessionStorage.setItem("search_filters_state", JSON.stringify(stateObj));
  }, stateDeps);

  const toggleTongue = (lang: string) =>
    setMotherTongues((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );

  const availableCastes = religion && RELIGION_TO_CASTES[religion]
    ? RELIGION_TO_CASTES[religion].map((c) => ({ value: c, label: c }))
    : [];

  const availableSubCastes = caste && CASTE_TO_SUBCASTE[caste]
    ? CASTE_TO_SUBCASTE[caste].map((s) => ({ value: s, label: s }))
    : [];

  const handleReset = () => {
    setAgeFrom("22"); setAgeTo("35");
    setHeightFrom("152"); setHeightTo("193");
    setProfileCreatedBy(""); setMaritalStatus(""); setPhysicalStatus("");
    setMotherTongues([]);
    setReligion(""); setCaste(""); setSubCaste("");
    setEducation(""); setOccupation(""); setIncomeFrom(""); setIncomeTo("");
    setCountry(""); setState("");
    setDiet(""); setSmoking(""); setDrinking("");
    setStar(""); setRaasi(""); setDhosham("");
    sessionStorage.removeItem("search_filters_state");
    toast.success("Search filters reset");
  };

  const handleSearch = () => {
    toast.success("Searching profiles…");
    const params = new URLSearchParams({
      religion, caste, ageFrom, ageTo, heightFrom, heightTo,
      education, occupation, country, state,
    });
    router.push(`/search/regular?${params.toString()}`);
  };

  const handleNameSearch = async () => {
    const q = nameInput.trim();
    if (!q) { toast.error("Enter a name to search"); return; }
    setNameLoading(true);
    setNameResults([]);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supa = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supa
        .from("profiles")
        .select("id, name, gender, dob, city, state, occupation")
        .ilike("name", `%${q}%`)
        .limit(20);
      setNameResults(data || []);
      if (!data?.length) toast("No profiles found for that name");
    } catch {
      toast.error("Search failed, try again");
    } finally {
      setNameLoading(false);
    }
  };

  const tabs: { id: SearchTab; label: string }[] = [
    { id: "criteria", label: "By Criteria" },
    { id: "byname", label: "By Name" },
    { id: "saved", label: "Saved Search" },
  ];

  return (
    <>
      <Navbar />
      <style>{`
        @media (max-width: 640px) {
          .search-tab-btn {
            padding: 0.625rem 0.75rem !important;
            font-size: 0.8125rem !important;
          }
        }
        .search-tabs-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <main style={{ background: "#f2f2f2", minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            paddingBottom: "6rem" /* ensure enough padding for sticky bottom bar */
          }}
        >
          {/* Page Header */}
          <div style={{ position: "sticky", top: "-0.75rem", zIndex: 10, background: "#f2f2f2", paddingTop: "0.75rem", paddingBottom: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <BackButton />
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111", margin: 0, fontFamily: "var(--font-sans)", flex: 1 }}>
              Find Your Perfect Tamil Match
            </h1>
          </div>

          {/* Tab card */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* Tabs */}
            <div
              className="search-tabs-container"
              style={{
                display: "flex",
                borderBottom: "2px solid var(--border-light)",
                background: "#fff",
                overflowX: "auto",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="search-tab-btn"
                  style={{
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.875rem",
                    fontWeight: activeTab === t.id ? 700 : 500,
                    color: activeTab === t.id ? "var(--primary)" : "var(--text-secondary)",
                    borderBottom: activeTab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
                    marginBottom: "-2px",
                    position: "relative",
                    transition: "color 0.15s",
                    minHeight: "44px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {t.label}
                  {t.id === "saved" && (
                    <span
                      style={{
                        marginLeft: "5px",
                        background: "var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        padding: "1px 5px",
                        fontSize: "0.625rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      0
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── BY CRITERIA ────────────────────────────────── */}
            {activeTab === "criteria" && (
              <div style={{ padding: "1.5rem" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1.5rem", margin: "0 0 1.5rem" }}>
                  Use the filters below to find profiles that match your preferences.
                </p>

                {/* ── BASIC DETAILS ── */}
                <Section title="🎯 Basic Details">
                  <FormGrid>
                    <RangeField
                      label="Age"
                      fromValue={ageFrom}
                      toValue={ageTo}
                      onFromChange={setAgeFrom}
                      onToChange={setAgeTo}
                      options={AGE_OPTS}
                      fullWidth={false}
                    />
                    <RangeField
                      label="Height"
                      fromValue={heightFrom}
                      toValue={heightTo}
                      onFromChange={setHeightFrom}
                      onToChange={setHeightTo}
                      options={HEIGHT_OPTIONS}
                      fullWidth={false}
                    />
                    <Field label="Marital Status">
                      <Sel
                        value={maritalStatus}
                        onChange={setMaritalStatus}
                        options={MARITAL_STATUS}
                        placeholder="Any"
                      />
                    </Field>
                    <Field label="Profile Created By">
                      <Sel
                        value={profileCreatedBy}
                        onChange={setProfileCreatedBy}
                        options={PROFILE_CREATED_BY.filter((o) => o.value !== "any")}
                        placeholder="Any"
                      />
                    </Field>
                    <Field label="Physical Status">
                      <Sel
                        value={physicalStatus}
                        onChange={setPhysicalStatus}
                        options={PHYSICAL_STATUS}
                        placeholder="Any"
                      />
                    </Field>
                    <MotherTongueMulti selected={motherTongues} onToggle={toggleTongue} />
                  </FormGrid>
                </Section>

                {/* ── RELIGION & COMMUNITY ── */}
                <Section title="🕉️ Religion & Community">
                  <FormGrid>
                    <Field label="Religion">
                      <Sel
                        value={religion}
                        onChange={(v) => { setReligion(v); setCaste(""); setSubCaste(""); }}
                        options={RELIGIONS.map((r) => ({ value: r, label: r }))}
                        placeholder="Any Religion"
                      />
                    </Field>
                    {(!religion || (availableCastes && availableCastes.length > 0)) && (
                      <Field label="Caste / Community">
                        <Sel
                          value={caste}
                          onChange={(v) => { setCaste(v); setSubCaste(""); }}
                          options={availableCastes || []}
                          placeholder={religion ? "Select Caste" : "Select Religion first"}
                        />
                      </Field>
                    )}
                    {(caste || (availableSubCastes && availableSubCastes.length > 0)) && (
                      <Field label="Sub Caste">
                        <Sel
                          value={subCaste}
                          onChange={setSubCaste}
                          options={availableSubCastes || []}
                          placeholder={caste ? "Select Sub Caste" : "Select Caste first"}
                        />
                      </Field>
                    )}
                  </FormGrid>
                </Section>

                {/* ── EDUCATION & CAREER ── */}
                <Section title="🎓 Education & Career" defaultOpen={false}>
                  <FormGrid>
                    <Field label="Education">
                      <Sel
                        value={education}
                        onChange={setEducation}
                        options={EDUCATION_LEVELS.map((e) => ({ value: e, label: e }))}
                        placeholder="Any"
                      />
                    </Field>
                    <Field label="Occupation">
                      <Sel
                        value={occupation}
                        onChange={setOccupation}
                        options={OCCUPATIONS.map((o) => ({ value: o, label: o }))}
                        placeholder="Any"
                      />
                    </Field>
                    <RangeField
                      label="Annual Income"
                      fromValue={incomeFrom}
                      toValue={incomeTo}
                      onFromChange={setIncomeFrom}
                      onToChange={setIncomeTo}
                      options={INCOME_RANGES}
                    />
                  </FormGrid>
                </Section>

                {/* ── LOCATION ── */}
                <Section title="📍 Location" defaultOpen={false}>
                  <FormGrid>
                    <Field label="Country">
                      <Sel
                        value={country}
                        onChange={setCountry}
                        options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                        placeholder="Any"
                      />
                    </Field>
                    <Field label="State (India)">
                      <Sel
                        value={state}
                        onChange={setState}
                        options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                        placeholder="Any"
                      />
                    </Field>
                  </FormGrid>
                </Section>

                {/* ── LIFESTYLE ── */}
                <Section title="🌿 Lifestyle" defaultOpen={false}>
                  <FormGrid>
                    <Field label="Eating Habits">
                      <Sel value={diet} onChange={setDiet} options={EATING_HABITS} placeholder="Any" />
                    </Field>
                    <Field label="Smoking Habits">
                      <Sel value={smoking} onChange={setSmoking} options={SMOKING_OPTIONS} placeholder="Any" />
                    </Field>
                    <Field label="Drinking Habits">
                      <Sel value={drinking} onChange={setDrinking} options={DRINKING_OPTIONS} placeholder="Any" />
                    </Field>
                  </FormGrid>
                </Section>

                {/* ── HOROSCOPE ── */}
                <Section title="⭐ Horoscope" defaultOpen={false}>
                  <FormGrid>
                    <Field label="Star (Natchathiram)">
                      <Sel
                        value={star}
                        onChange={setStar}
                        options={STARS.map((s) => ({ value: s, label: s }))}
                        placeholder="Any"
                      />
                    </Field>
                    <Field label="Raasi">
                      <Sel
                        value={raasi}
                        onChange={setRaasi}
                        options={RAASI_LIST.map((r) => ({ value: r, label: r }))}
                        placeholder="Any"
                      />
                    </Field>
                    <Field label="Dhosham">
                      <Sel value={dhosham} onChange={setDhosham} options={DHOSHAM_OPTIONS} placeholder="Any" />
                    </Field>
                  </FormGrid>
                </Section>
              </div>
            )}

            {/* ── BY NAME ──────────────────────────────────────── */}
            {activeTab === "byname" && (
              <div style={{ padding: "2rem" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
                  Search profiles by entering a first or full name.
                </p>
                <div className="search-by-name-bar" style={{ display: "flex", gap: "0.75rem", alignItems: "center", maxWidth: "420px", marginBottom: "1.5rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleNameSearch(); }}
                      placeholder="Enter name (e.g., Priya, Karthik…)"
                      className="form-input"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <button
                    onClick={handleNameSearch}
                    disabled={nameLoading}
                    className="btn btn-primary"
                    style={{ flexShrink: 0, padding: "0.4375rem 1rem" }}
                  >
                    <Search size={15} />
                    <span className="hide-mobile">{nameLoading ? "Searching…" : "Search"}</span>
                  </button>
                </div>

                {/* Results */}
                {nameResults.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-medium)", margin: "0 0 0.5rem" }}>
                      Found {nameResults.length} profile{nameResults.length !== 1 ? "s" : ""}
                    </p>
                    {nameResults.map((p) => {
                      const age = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
                      const location = [p.city, p.state].filter(Boolean).join(", ") || "India";
                      return (
                        <div
                          key={p.id}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            background: "#fff",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            transition: "box-shadow 0.15s",
                          }}
                          onClick={() => router.push(`/profile/${p.id}?from=search`)}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: "44px", height: "44px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #6B1A2A 0%, #C8973A 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                            fontSize: "1.125rem", fontWeight: 700, color: "#fff",
                          }}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)" }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: "0.8125rem", color: "var(--text-medium)", marginTop: "2px" }}>
                              {age > 0 ? `${age} yrs` : ""}{age > 0 && p.occupation ? " • " : ""}{p.occupation || ""}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1px" }}>
                              {location}
                            </div>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── SAVED SEARCHES ─────────────────────────────── */}
            {activeTab === "saved" && (
              <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
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
                  <Search size={24} style={{ color: "var(--primary)" }} />
                </div>
                <p style={{ fontWeight: 700, color: "var(--text-dark)", marginBottom: "0.375rem" }}>
                  No saved searches yet
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  Use &ldquo;By Criteria&rdquo; to search and save your preferences for quick access.
                </p>
                <button
                  onClick={() => setActiveTab("criteria")}
                  className="btn btn-outline"
                  style={{ marginTop: "1.25rem" }}
                >
                  Start a new search
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── STICKY BOTTOM BAR ── */}
        {activeTab === "criteria" && (
          <div
            className="search-fixed-bottom"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#fff",
              borderTop: "1px solid var(--border-color)",
              padding: "0.75rem 1.25rem",
              paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 50,
              boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-dark)" }}>Verified</strong> profiles
            </span>
            <div style={{ display: "flex", gap: "0.625rem" }}>
              <button
                onClick={handleReset}
                className="btn btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  border: "1.5px solid var(--border-color)",
                  borderRadius: "var(--radius-full)",
                  minHeight: "40px",
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
              <button
                onClick={handleSearch}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", minHeight: "40px" }}
              >
                <Search size={15} />
                Search
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Responsive grid: 2-col on ≥600px, 1-col on mobile */}
      <style>{`
        @media (max-width: 599px) {
          .search-form-grid {
            grid-template-columns: 1fr !important;
          }
          .search-by-name-bar {
            flex-direction: column;
            align-items: stretch !important;
          }
          .search-by-name-bar input,
          .search-by-name-bar button {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--text-medium)" }}>Loading search…</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
