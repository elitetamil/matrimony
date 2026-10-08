"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Phone, Upload, X, Check, AlertCircle, Mail, Plus, Info, FileText } from "lucide-react";
import CompactFooter from "@/components/layout/CompactFooter";
import toast from "react-hot-toast";
import { registerUser, saveCompatibilityAnswers, saveHoroscope } from "@/lib/auth-store";
import { uploadProfilePhoto, uploadHoroscopeFile } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useMSG91, CAPTCHA_DIV_ID } from "@/hooks/useMSG91";
import { validateEmail } from "@/lib/email-validator";
import {
  RELIGIONS, RELIGION_TO_CASTES, CASTE_TO_SUBCASTE, MOTHER_TONGUES, HEIGHTS,
  EDUCATION_LEVELS, OCCUPATIONS, INCOME_RANGES, INDIAN_STATES,
  CITIES_BY_STATE, MARITAL_STATUS, EATING_HABITS, DHOSHAM_OPTIONS,
  PROFILE_FOR_OPTIONS, STARS, RAASI_LIST,
} from "@/data/matrimony-data";
import {
  COMPATIBILITY_QUESTIONS,
} from "@/data/compatibility-questions";
import SearchableSelect from "@/components/ui/SearchableSelect";

// HEIGHTS is {value: number (cm), label: string}[] — use cm as option value
const HEIGHT_OPTIONS = HEIGHTS.map((h) => ({ value: String(h.value), label: h.label }));
// INCOME_RANGES is {value, label}[] — flatten to label strings
const INCOME_OPTIONS = INCOME_RANGES.map((r) => r.label);
// Max DOB for 18+ validation — computed once at module load (never during render)
const MAX_DOB_DATE = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

// Flattened unique list of all Indian cities for type-to-search/autocomplete
const ALL_INDIAN_CITIES = Array.from(
  new Set(
    Object.values(CITIES_BY_STATE).flat().filter((c) => Boolean(c) && c !== "Other")
  )
).sort((a, b) => a.localeCompare(b));

// DOB dropdown helpers
const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function dobPartsToString(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - 18 - i); // 18..78 years ago

// ── Bio generator ──────────────────────────────────────────────────────────
function generateBio(f: any): string {
  const parts = [];
  
  let age = "";
  if (f.dob) {
    age = String(Math.floor((Date.now() - new Date(f.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
  }

  let intro = "I am";
  if (f.name) {
    intro = `Hi, I am ${f.name}`;
    if (age) intro += `, a ${age}-year-old`;
    else intro += `, a`;
  } else {
    if (age) intro += ` a ${age}-year-old`;
    else intro += ` a`;
  }

  if (f.occupation) {
    intro += ` ${f.occupation.toLowerCase()}`;
  } else {
    intro += ` professional`;
  }

  if (f.city || f.state) {
    const loc = [f.city, f.state].filter(Boolean).join(", ");
    intro += ` based in ${loc}`;
  }
  parts.push(intro + ".");

  if (f.education) {
    parts.push(`I hold a degree in ${f.education}.`);
  }

  const background = [];
  if (f.religion) background.push(f.religion);
  if (f.caste) background.push(f.caste);
  if (background.length > 0) {
    parts.push(`I come from a ${background.join(", ")} family.`);
  }

  if (f.diet) {
    parts.push(`In terms of lifestyle, I am a ${f.diet.toLowerCase()} by diet.`);
  }

  let partner = "I am looking for a kind, understanding, and supportive partner";
  const pPrefs = [];
  if (f.partnerReligion && f.partnerReligion !== "Any") {
    pPrefs.push(f.partnerReligion);
  }
  if (f.partnerState && f.partnerState !== "Any") {
    pPrefs.push(`from ${f.partnerState}`);
  }
  if (pPrefs.length > 0) {
    partner += ` who is ${pPrefs.join(" ")}`;
  }
  partner += " to build a happy life together.";
  
  parts.push(partner);

  return parts.join(" ");
}

// ── Inline field error display ────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{
      fontSize: "0.75rem",
      color: "#D32F2F",
      marginTop: "0.25rem",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    }} role="alert">
      <AlertCircle size={12} aria-hidden="true" />
      {msg}
    </p>
  );
}

// ── Validation helpers ────────────────────────────────────────────────────
function validatePassword(v: string): string {
  if (!v) return "";
  if (v.length < 6) return "Password must contain at least 6 characters.";
  return "";
}

function validateMobile(v: string): string {
  if (!v) return "Mobile Number is required.";
  if (v.length !== 10) return "Mobile Number must be exactly 10 digits.";
  if (!/^\d{10}$/.test(v)) return "Mobile Number must contain only digits.";
  return "";
}

function validateDob(v: string): string {
  if (!v) return "Date of Birth is required.";
  if (v > MAX_DOB_DATE) return "You must be at least 18 years old.";
  return "";
}

// ---- Pill button selector ----
function PillGroup({ label, options, value, onChange, required }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "0.625rem" }}>
        {label}{required && <span style={{ color: "var(--primary)", marginLeft: "2px" }}>*</span>}
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }} role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
            style={{
              padding: "0.4375rem 1.125rem",
              borderRadius: "var(--radius-full)",
              border: "1.5px solid " + (value === opt ? "var(--primary)" : "var(--border-color)"),
              background: value === opt ? "var(--primary)" : "#fff",
              color: value === opt ? "#fff" : "var(--text-dark)",
              fontWeight: value === opt ? 700 : 400,
              fontSize: "0.875rem",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (value !== opt) {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.color = "var(--primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (value !== opt) {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.color = "var(--text-dark)";
              }
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Floated label select — accepts string[] or {value,label}[] ----
function FloatSelect({ label, value, onChange, options, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[];
  placeholder?: string;
}) {
  const normalized = (options as Array<string | { value: string; label: string }>).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div style={{ position: "relative", marginBottom: "1rem" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-select"
        aria-label={label}
        style={{ paddingTop: value ? "1.375rem" : "0.75rem", paddingBottom: value ? "0.375rem" : "0.75rem" }}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {normalized.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {value && (
        <span style={{ position: "absolute", top: "0.3125rem", left: "0.875rem", fontSize: "0.6875rem", color: "var(--primary)", fontWeight: 700, pointerEvents: "none", letterSpacing: "0.02em" }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ---- Floated label searchable combobox (supports custom entry) ----
function FloatSearchableCombobox({ label, value, onChange, options, placeholder = "Search or type..." }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [dropup, setDropup] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
    if (!value) setIsTyping(false);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setIsTyping(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Filter with case-insensitive includes when typing, or show all options on focus/clear
  const trimmed = query.trim().toLowerCase();
  const shouldFilter = isTyping && trimmed.length > 0;

  const filtered = shouldFilter
    ? options
        .filter(o => o.toLowerCase().includes(trimmed))
        .sort((a, b) => {
          const aStarts = a.toLowerCase().startsWith(trimmed);
          const bStarts = b.toLowerCase().startsWith(trimmed);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.localeCompare(b);
        })
        .slice(0, 200)
    : options;

  const handleOpen = () => {
    setIsTyping(false);
    setOpen(true);
    // Detect if we should open upward (dropup) to avoid keyboard
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      setDropup(viewportHeight - rect.bottom < 260);
      // Scroll into view so keyboard doesn't overlap
      setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    }
  };

  const select = (v: string) => {
    setQuery(v);
    setIsTyping(false);
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: "1rem" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder || `Select ${label}`}
        className="form-input"
        style={{ 
          paddingTop: query ? "1.375rem" : "0.75rem", 
          paddingBottom: query ? "0.375rem" : "0.75rem",
          fontSize: "16px",
        }}
        onChange={e => {
          setIsTyping(true);
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={handleOpen}
        onKeyDown={e => {
          if (e.key === "Escape") {
            setOpen(false);
            setIsTyping(false);
          } else if (e.key === "Enter" && open && filtered.length > 0) {
            e.preventDefault();
            select(filtered[0]);
          }
        }}
        autoComplete="off"
        aria-label={label}
      />
      {query && (
        <span style={{ position: "absolute", top: "0.3125rem", left: "0.875rem", fontSize: "0.6875rem", color: "var(--primary)", fontWeight: 700, pointerEvents: "none", letterSpacing: "0.02em" }}>
          {label}
        </span>
      )}
      {open && (
        <div style={{
          position: "absolute",
          ...(dropup ? { bottom: "calc(100% + 4px)", top: "auto" } : { top: "calc(100% + 4px)", bottom: "auto" }),
          left: 0, right: 0,
          background: "#fff", border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          maxHeight: "220px", overflowY: "auto", zIndex: 9999,
        }}>
          {filtered.length === 0 && query.trim() && (
            <div
              style={{ padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "var(--text-muted)", cursor: "pointer" }}
              onMouseDown={(e) => { e.preventDefault(); select(query); }}
            >
              Use &ldquo;{query}&rdquo; as custom {label.toLowerCase()}
            </div>
          )}
          {filtered.map(opt => (
            <div
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); select(opt); }}
              style={{
                padding: "0.5rem 0.875rem", fontSize: "0.875rem", cursor: "pointer",
                background: opt === value ? "var(--primary-light)" : "transparent",
                color: opt === value ? "var(--primary)" : "var(--text-dark)",
                fontWeight: opt === value ? 600 : 400,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.background = opt === value ? "var(--primary-light)" : "transparent")}
            >
              {opt}
            </div>
          ))}
          {filtered.length > 0 && !filtered.includes(query) && query.trim() && (
            <div
              onMouseDown={(e) => { e.preventDefault(); select(query); }}
              style={{
                padding: "0.5rem 0.875rem", fontSize: "0.8125rem", cursor: "pointer",
                borderTop: "1px solid var(--border-light)", color: "var(--primary)", fontWeight: 600,
              }}
            >
              + Use &ldquo;{query}&rdquo; as custom entry
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Multi-Select Tags (for Languages, etc.) ----
function MultiSelectTags({ label, values, onChange, options, placeholder = "Select or type..." }: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [dropup, setDropup] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const unselected = options.filter(o => !values.includes(o));
  const filtered = query
    ? unselected
        .filter(o => o.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
          const aS = a.toLowerCase().startsWith(query.toLowerCase());
          const bS = b.toLowerCase().startsWith(query.toLowerCase());
          if (aS && !bS) return -1;
          if (!aS && bS) return 1;
          return a.localeCompare(b);
        })
        .slice(0, 50)
    : unselected.slice(0, 50);

  const handleInputFocus = () => {
    setOpen(true);
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      setDropup(viewportHeight - rect.bottom < 220);
      setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    }
  };

  const select = (v: string) => {
    if (!values.includes(v)) onChange([...values, v]);
    setQuery("");
    setOpen(false);
  };

  const remove = (v: string) => {
    onChange(values.filter(x => x !== v));
  };

  return (
    <div ref={ref} style={{ position: "relative", marginBottom: "1rem" }}>
      <div
        className="form-input"
        style={{
          minHeight: "48px", height: "auto", display: "flex", flexWrap: "wrap", gap: "0.375rem",
          paddingTop: values.length > 0 ? "1.375rem" : "0.75rem", paddingBottom: "0.375rem",
          alignItems: "center", cursor: "text",
        }}
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
      >
        {values.map(val => (
          <span
            key={val}
            style={{
              background: "var(--primary-light)", color: "var(--primary)",
              padding: "2px 8px", borderRadius: "var(--radius-full)",
              fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px"
            }}
          >
            {val}
            <span
              onClick={(e) => { e.stopPropagation(); remove(val); }}
              style={{ cursor: "pointer", opacity: 0.7, padding: "2px" }}
            >
              ×
            </span>
          </span>
        ))}
        <input
          ref={inputRef}
          id={`multi-input-${label}`}
          type="text"
          value={query}
          placeholder={values.length === 0 ? placeholder : ""}
          style={{
            border: "none", outline: "none", background: "transparent",
            flex: 1, minWidth: "60px", fontSize: "16px", color: "var(--text-dark)",
          }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
      </div>
      {(values.length > 0 || query) && (
        <span style={{ position: "absolute", top: "0.3125rem", left: "0.875rem", fontSize: "0.6875rem", color: "var(--primary)", fontWeight: 700, pointerEvents: "none", letterSpacing: "0.02em" }}>
          {label}
        </span>
      )}
      {open && (
        <div style={{
          position: "absolute",
          ...(dropup ? { bottom: "calc(100% + 4px)", top: "auto" } : { top: "calc(100% + 4px)", bottom: "auto" }),
          left: 0, right: 0,
          background: "#fff", border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          maxHeight: "200px", overflowY: "auto", zIndex: 9999,
        }}>
          {filtered.length === 0 && !query && (
            <div style={{ padding: "0.625rem 0.875rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              No options available
            </div>
          )}
          {filtered.map(opt => (
            <div
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); select(opt); }}
              style={{ padding: "0.5rem 0.875rem", fontSize: "0.875rem", cursor: "pointer", color: "var(--text-dark)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {opt}
            </div>
          ))}
          {query.trim() && !filtered.includes(query) && !values.includes(query) && (
            <div
              onMouseDown={(e) => { e.preventDefault(); select(query.trim()); }}
              style={{
                padding: "0.5rem 0.875rem", fontSize: "0.8125rem", cursor: "pointer",
                borderTop: filtered.length > 0 ? "1px solid var(--border-light)" : "none",
                color: "var(--primary)", fontWeight: 600,
              }}
            >
              + Add &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Step progress bar ----
function StepProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / total) * 100);
  return (
    <div style={{ marginBottom: "0.375rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.125rem" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>Step {step} of {total}</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>{pct}% complete</span>
      </div>
      <div style={{ height: "4px", background: "var(--border-light)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)",
            borderRadius: "var(--radius-full)",
            transition: "width 0.4s ease",
          }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Registration progress: ${pct}%`}
        />
      </div>
    </div>
  );
}

// ---- Step header ----
function StepHeader({ step, total, title, onBack }: { step: number; total: number; title: string; onBack?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-dark)", display: "flex" }}>
            <ChevronLeft size={20} />
          </button>
        )}
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>{title}</h2>
      </div>
      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>Step {step}/{total}</span>
    </div>
  );
}

// ---- Main Register Wizard ----
function RegisterWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const msg91 = useMSG91();

  // Data passed from homepage form
  const initProfileFor = searchParams.get("profileFor") || "";
  const initName = searchParams.get("name") || "";
  const initMobile = searchParams.get("mobile") || "";
  const initEmail = searchParams.get("email") || ""; // prefilled from login "Create Account" flow
  
  // Landing page search parameters
  const initLookingFor = searchParams.get("lookingFor") || ""; // "Woman" or "Man"
  const initPartnerGender = initLookingFor.toLowerCase() === "woman" ? "female" : initLookingFor.toLowerCase() === "man" ? "male" : "";
  const initPartnerAgeMin = searchParams.get("partnerAgeMin") ? Number(searchParams.get("partnerAgeMin")) : undefined;
  const initPartnerAgeMax = searchParams.get("partnerAgeMax") ? Number(searchParams.get("partnerAgeMax")) : undefined;
  const initReligion = searchParams.get("religion") || "";
  const initMotherTongue = searchParams.get("motherTongue") || "";

  // Step state:
  //   0 = Basic info (profile_for / name / mobile / DOB / gender) — pre-filled from homepage if applicable
  //   1 = Personal & Religious Details
  //   2 = Education & Career
  //   3 = Add Photo
  // ALWAYS start at step 0 so DOB and gender are always collected.
  // Homepage pre-fills name/mobile but DOB/gender still need to be entered.
  const [step, setStep] = useState(0);
  const [showInvalidEmailModal, setShowInvalidEmailModal] = useState(false);

  // Form data — Gender is NEVER pre-filled; user must manually select their own gender
  const [form, setForm] = useState({
    profileFor: initProfileFor,
    name: initName,
    mobile: initMobile,
    dob: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    gender: "", // Unselected by default — user selects Male or Female manually
    partnerGender: initPartnerGender, // Initialized from Landing Page
    password: "",
    email: initEmail, // prefilled when coming from login "Create Account"
    // Step 1
    height: "",
    physicalStatus: "",         // blank by default — user must select
    maritalStatus: "",          // blank by default — user must select
    religion: initReligion,
    caste: "",
    subcaste: "",
    motherTongue: initMotherTongue,            // blank by default — user must select
    // Step 2
    education: "",
    occupation: "",
    income: "",
    state: "",
    city: "",
    diet: "",
    star: "",
    rasi: "",
    dhosham: "",
    // Step 3 — Partner Preferences (preserved from landing page search)
    partnerAgeMin: initPartnerAgeMin as number | undefined,
    partnerAgeMax: initPartnerAgeMax as number | undefined,
    partnerReligion: initReligion,
    partnerMotherTongue: initMotherTongue ? [initMotherTongue] : [] as string[],
    partnerMaritalStatus: [] as string[],
    partnerState: "",
    // Step 5 — Photo / About
    photoUrl: "",
    about: "",
    languages: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [horoscopeFile, setHoroscopeFile] = useState<File | null>(null);
  const [horoscopeFileName, setHoroscopeFileName] = useState<string>("");
  const [horoscopeError, setHoroscopeError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);  // ← prevents double-submit

  // Compatibility answers (step 4)
  const [compatAnswers, setCompatAnswers] = useState<Record<string, string>>({});
  const [hasAutoGeneratedBio, setHasAutoGeneratedBio] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    if (step === 5 && !hasAutoGeneratedBio && !form.about) {
      set("about", generateBio(form));
      setHasAutoGeneratedBio(true);
    }
  }, [step, form, hasAutoGeneratedBio]);

  // DOB derived values
  const dobDayOptions = form.dobMonth && form.dobYear
    ? Array.from({ length: daysInMonth(Number(form.dobMonth), Number(form.dobYear)) }, (_, i) => i + 1)
    : Array.from({ length: 31 }, (_, i) => i + 1);

  // Sync dob string whenever parts change
  const updateDobPart = (part: "dobDay" | "dobMonth" | "dobYear", val: string) => {
    const next = { ...form, [part]: val };
    // Clamp day if month change makes it invalid
    if (part === "dobMonth" || part === "dobYear") {
      const maxDay = next.dobMonth && next.dobYear ? daysInMonth(Number(next.dobMonth), Number(next.dobYear)) : 31;
      if (Number(next.dobDay) > maxDay) next.dobDay = String(maxDay);
    }
    const dobStr = dobPartsToString(next.dobDay, next.dobMonth, next.dobYear);
    setForm({ ...next, dob: dobStr });
  };

  // Derived: castes based on religion
  const castes = form.religion && RELIGION_TO_CASTES[form.religion] ? RELIGION_TO_CASTES[form.religion] : [];

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpResendSeconds, setOtpResendSeconds] = useState(0);
  const [otpSending, setOtpSending] = useState(false);

  // Email OTP state
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailResendSecs, setEmailResendSecs] = useState(0);

  // Real-time field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  };
  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  // Countdown timer for OTP resend
  const startResendTimer = () => {
    setOtpResendSeconds(30);
    const interval = setInterval(() => {
      setOtpResendSeconds((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!form.mobile || form.mobile.length < 10) { toast.error("Enter valid 10-digit mobile number"); return; }
    if (otpSending) return; // prevent double-tap
    setOtpSending(true);
    setOtp("");
    const digits = form.mobile.replace(/\D/g, "");
    const phone = digits.length === 10 ? `91${digits}` : digits;
    const result = await msg91.sendOtp(phone);
    setOtpSending(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to send OTP. Please try again.");
      return;
    }
    setOtpSent(true);
    setOtpModalOpen(true);
    startResendTimer();
    toast.success(`OTP sent to +91 ${form.mobile}`);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    // Step 1: Verify OTP via MSG91 widget — returns a JWT access_token
    const verifyResult = await msg91.verifyOtp(otp);
    if (!verifyResult.success) {
      toast.error(verifyResult.error ?? "Incorrect OTP. Please try again.");
      setOtp("");
      return;
    }
    // Step 2 (optional): Server-side validation of the MSG91 JWT token.
    // The MSG91 widget in exposeMethods mode does not always return an
    // access_token in the verifyOtp per-call callback — the success callback
    // firing is itself proof the OTP was verified by MSG91's servers.
    // We only do the extra server check when a token is actually present.
    if (verifyResult.accessToken) {
      try {
        const res = await fetch("/api/verify-msg91-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: verifyResult.accessToken }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "OTP verification failed. Please try again.");
          setOtp("");
          return;
        }
      } catch {
        toast.error("Network error during verification. Please try again.");
        setOtp("");
        return;
      }
    }
    setOtpVerified(true);
    setOtpModalOpen(false);
    toast.success("Mobile verified successfully!");
  };

  const handleResendOtp = async () => {
    if (otpResendSeconds > 0) return;
    setOtp("");
    startResendTimer();
    // Use retryOtp with null = default channel (SMS)
    const result = await msg91.retryOtp(null);
    if (!result.success) {
      toast.error(result.error ?? "Failed to resend OTP.");
      return;
    }
    toast.success(`OTP resent to +91 ${form.mobile}`);
  };

  // ── Email OTP handlers ──────────────────────────────────────────────────
  const startEmailResendTimer = () => {
    setEmailResendSecs(60);
    const interval = setInterval(() => {
      setEmailResendSecs(s => { if (s <= 1) { clearInterval(interval); return 0; } return s - 1; });
    }, 1000);
  };

  const handleSendEmailOtp = async () => {
    const emailValidation = validateEmail(form.email);
    if (!emailValidation.valid) {
      const msg = emailValidation.error || "Please enter a valid Gmail address.";
      setFieldError("email", msg);
      setShowInvalidEmailModal(true);
      return;
    }
    setFieldError("email", "");
    setEmailOtpSending(true);
    try {
      const res = await fetch("/api/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), name: form.name || "there" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send OTP.");
      setEmailOtpSent(true);
      setEmailOtp("");
      startEmailResendTimer();
      toast.success(`OTP sent to ${form.email}`);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally { setEmailOtpSending(false); }
  };

  const handleVerifyEmailOtp = async () => {
    if (emailOtp.length !== 6) { toast.error("Enter the 6-digit OTP."); return; }
    setEmailOtpVerifying(true);
    try {
      const res = await fetch("/api/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), otp: emailOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed.");
      setEmailOtpVerified(true);
      clearFieldError("email");
      toast.success("Email verified successfully!");
    } catch (e: unknown) {
      toast.error((e as Error).message);
      setEmailOtp("");
    } finally { setEmailOtpVerifying(false); }
  };

  const handleResendEmailOtp = () => {
    if (emailResendSecs > 0) return;
    setEmailOtp("");
    handleSendEmailOtp();
  };


  const validateStep0 = () => {
    const newErrors: Record<string, string> = {};
    if (!form.profileFor) newErrors.profileFor = "Please select who this profile is for.";
    if (!form.name.trim()) newErrors.name = "Name is required.";
    const mobileErr = validateMobile(form.mobile);
    if (mobileErr) newErrors.mobile = mobileErr;
    const dobErr = validateDob(form.dob);
    if (dobErr) newErrors.dob = dobErr;
    if (!form.gender) newErrors.gender = "Please select your gender.";
    if (!form.partnerGender) newErrors.partnerGender = "Please select who you are looking for.";
    if (!otpVerified) newErrors.otp = "Please verify your mobile number.";
    // Email is mandatory
    if (!form.email.trim()) {
      newErrors.email = "Email address is required.";
    } else {
      const emailValidation = validateEmail(form.email);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.error || "Please enter a valid Gmail address.";
        setShowInvalidEmailModal(true);
      } else if (!emailOtpVerified) {
        newErrors.email = "Please verify your email address before continuing.";
      }
    }
    // Password is mandatory
    if (!form.password) {
      newErrors.password = "Password is required.";
    } else {
      const pwErr = validatePassword(form.password);
      if (pwErr) newErrors.password = pwErr;
    }
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      toast.error("Please fill in all required fields to continue.");
      return false;
    }
    return true;
  };

  // ---- Step 1: Personal & Religious Details ----
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!form.height) newErrors.height = "Please select your height.";
    if (!form.maritalStatus) newErrors.maritalStatus = "Please select marital status.";
    if (!form.religion) newErrors.religion = "Please select a religion.";
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...newErrors }));
      toast.error("Please fill in all required fields to continue.");
      return false;
    }
    return true;
  };

  // ---- Step 2: Education & Career ----
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!form.education) newErrors.education = "Please select your highest education.";
    if (!form.occupation) newErrors.occupation = "Please select your occupation.";
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...newErrors }));
      toast.error("Please fill in all required fields to continue.");
      return false;
    }
    return true;
  };

  // ---- Final registration (with double-submit guard) ----
  const handleComplete = async () => {
    if (isSubmitting) return;          // ← block repeated calls

    // Final required-field check (covers users who started from homepage pre-fill)
    if (!form.name.trim())            { toast.error("Please enter your name"); return; }
    if (!form.mobile || form.mobile.length < 10) { toast.error("Please enter a valid mobile number"); return; }
    if (!form.dob)                    { toast.error("Please enter your date of birth"); return; }
    if (!form.gender)                 { toast.error("Please select your gender"); return; }
    if (!otpVerified)                 { toast.error("Please verify your mobile number first"); return; }
    if (!form.email.trim() || !validateEmail(form.email).valid) {
      toast.error("Please enter a valid Gmail address.");
      return;
    }
    if (!form.password)               { toast.error("Please set a password"); return; }
    if (!horoscopeFile) {
      setHoroscopeError("Please upload your horoscope image to complete registration.");
      toast.error("Please upload your horoscope image to complete registration.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser = await registerUser({
        profileFor: form.profileFor || "Myself",
        name: form.name,
        mobile: form.mobile,
        email: form.email || undefined,
        password: form.password,   // always user-set (validated above)
        dob: form.dob,                 // guaranteed non-empty by guard above
        gender: form.gender as "male" | "female",
        height: form.height,
        physicalStatus: form.physicalStatus,
        maritalStatus: form.maritalStatus,
        religion: form.religion,
        caste: form.caste,
        subcaste: form.subcaste,
        motherTongue: form.motherTongue,
        education: form.education,
        occupation: form.occupation,
        income: form.income,
        state: form.state,
        city: form.city,
        diet: form.diet,
        star: form.star,
        rasi: form.rasi,
        dhosham: form.dhosham,
        about: form.about,
        photoUrl: form.photoUrl || undefined,
        // Partner preferences
        partnerGender: form.partnerGender,
        partnerAgeMin: form.partnerAgeMin || undefined,
        partnerAgeMax: form.partnerAgeMax || undefined,
        partnerReligion: form.partnerReligion && form.partnerReligion !== "Any" ? form.partnerReligion : undefined,
        partnerMotherTongue: form.partnerMotherTongue && form.partnerMotherTongue.length > 0 ? form.partnerMotherTongue : undefined,
        partnerMaritalStatus: form.partnerMaritalStatus.length > 0 ? form.partnerMaritalStatus : undefined,
        partnerCountry: form.partnerState && form.partnerState !== "Any" ? "India" : undefined,
      });

      // Save compatibility questionnaire answers (non-fatal if it fails)
      if (newUser.id && Object.keys(compatAnswers).length > 0) {
        saveCompatibilityAnswers(newUser.id, compatAnswers).catch(e =>
          console.warn('[register] Failed to save compatibility answers:', e)
        );
      }

      // Upload photo to Supabase Storage if file was selected
      if (photoFile && newUser.id) {
        try {
          const photoUrl = await uploadProfilePhoto(newUser.id, photoFile);
          const { addProfilePhoto } = await import("@/lib/auth-store");
          await addProfilePhoto(newUser.id, photoUrl, true, 0);
        } catch (photoErr) {
          console.warn("Photo upload failed:", photoErr);
          // Non-fatal — user can add photo later
        }
      }

      // Upload horoscope to Supabase Storage
      if (horoscopeFile && newUser.id) {
        try {
          const { url, fileName } = await uploadHoroscopeFile(newUser.id, horoscopeFile);
          await saveHoroscope(newUser.id, url, fileName);
        } catch (horoscopeErr) {
          console.warn("Horoscope upload failed:", horoscopeErr);
        }
      }

      await refresh();
      toast.success("Profile created successfully! Welcome to Elite Tamil Matrimony");
      router.push("/");   // redirect to Home after registration
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      // Map Supabase rate-limit error to a user-friendly message
      if (msg.toLowerCase().includes("security purposes") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("42")) {
        toast.error("Please wait a moment before trying again (Supabase rate limit). Try after 1 minute.");
      } else {
        toast.error(msg);
      }
      setIsSubmitting(false);          // ← only reset on error; success navigates away
    }
  };

  // =====================================
  // RENDER STEPS
  // =====================================
  return (
    <div
      style={{
        marginTop: "calc(-1 * var(--navbar-height, 70px))",
        minHeight: "100vh",
        backgroundImage: "linear-gradient(rgba(250, 246, 241, 0.82), rgba(250, 246, 241, 0.82)), url('/images/Bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* MSG91 hCaptcha container — must be a visible DOM element for exposeMethods:true.
          Without this, MSG91 routes through grecaptcha.enterprise which silently hangs
          on production domains when reCAPTCHA Enterprise is not configured. */}
      <div id={CAPTCHA_DIV_ID} style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 0 }} />
      {/* Minimal header */}
      <header style={{ background: "#fff", borderBottom: "1px solid var(--border-color)", padding: "0.375rem 0" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <img
              src="/logo-transparent.png"
              alt="Elite Tamil Matrimony"
              style={{ height: "44px", width: "auto" }}
            />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#6B1A2A", letterSpacing: "0.04em", textTransform: "uppercase" }}>Elite Tamil</div>
              <div style={{ fontFamily: "'Lato', sans-serif", fontWeight: 700, fontSize: "0.6875rem", color: "#C8973A", letterSpacing: "0.08em", textTransform: "uppercase" }}>Matrimony</div>
            </div>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "var(--text-medium)" }}>
            Need help? Call
            <a href="tel:+919360653547" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
              +91 93606 53547
            </a>
          </div>
        </div>
      </header>

      {/* ── INVALID EMAIL MODAL ─────────────────────────────────── */}
      {showInvalidEmailModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(26,10,14,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          role="dialog" aria-modal="true" aria-label="Invalid Email Address"
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--radius-xl)",
              padding: "2rem 1.75rem",
              maxWidth: "380px", width: "100%",
              boxShadow: "0 20px 60px rgba(107,26,42,0.25)",
              position: "relative",
              animation: "slideUp 0.3s ease",
              textAlign: "center",
            }}
          >
            <button
              onClick={() => setShowInvalidEmailModal(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: "4px" }}
              aria-label="Close dialog"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div style={{ marginBottom: "1rem", color: "var(--primary)", display: "flex", justifyContent: "center" }}>
              <AlertCircle size={40} />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: "0.5rem" }}>
              Enter a valid Gmail address and verify with Google.
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", marginBottom: "1.5rem" }}>
              Please use a valid @gmail.com email address to continue.
            </p>
            <button
              onClick={() => setShowInvalidEmailModal(false)}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* ── OTP VERIFICATION MODAL ─────────────────────────────────── */}
      {otpModalOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(26,10,14,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
          role="dialog" aria-modal="true" aria-label="OTP Verification"
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--radius-xl)",
              padding: "2rem 1.75rem",
              maxWidth: "380px", width: "100%",
              boxShadow: "0 20px 60px rgba(107,26,42,0.25)",
              position: "relative",
              animation: "slideUp 0.3s ease",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setOtpModalOpen(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: "4px" }}
              aria-label="Close OTP dialog"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Phone icon with brand colors */}
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div
                style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary-light), #FFF8F0)",
                  border: "2px solid var(--primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <Phone size={28} style={{ color: "var(--primary)" }} />
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark)", margin: "0 0 0.375rem" }}>
                Verify Your Mobile
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", margin: 0 }}>
                OTP has been sent to
              </p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--primary)", margin: "0.25rem 0 0" }}>
                +91 {form.mobile.replace(/(\d{5})(\d{5})/, "$1 $2")}
              </p>
            </div>

            {/* 6-box OTP input */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-medium)", marginBottom: "0.75rem", textAlign: "center", letterSpacing: "0.02em" }}>
                ENTER 6-DIGIT OTP
              </label>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    id={`otp-box-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ""}
                    autoFocus={i === 0}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const arr = otp.split("");
                      arr[i] = val;
                      const next = arr.join("").slice(0, 6);
                      setOtp(next);
                      // Auto-focus next box
                      if (val && i < 5) {
                        (document.getElementById(`otp-box-${i + 1}`) as HTMLInputElement)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        (document.getElementById(`otp-box-${i - 1}`) as HTMLInputElement)?.focus();
                      }
                    }}
                    style={{
                      width: "44px", height: "52px",
                      textAlign: "center", fontSize: "1.375rem", fontWeight: 800,
                      border: `2px solid ${otp[i] ? "var(--primary)" : "var(--border-color)"}`,
                      borderRadius: "var(--radius-lg)",
                      background: otp[i] ? "var(--primary-light)" : "#fff",
                      color: "var(--primary)",
                      outline: "none",
                      transition: "all 0.15s",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", opacity: otp.length !== 6 ? 0.6 : 1, cursor: otp.length !== 6 ? "not-allowed" : "pointer" }}
            >
              Verify &amp; Proceed
            </button>

            {/* Resend */}
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0 0 0.375rem" }}>
                Didn&apos;t receive OTP?
              </p>
              <button
                onClick={handleResendOtp}
                disabled={otpResendSeconds > 0}
                style={{
                  background: "none", border: "none", cursor: otpResendSeconds > 0 ? "not-allowed" : "pointer",
                  fontSize: "0.875rem", fontWeight: 700,
                  color: otpResendSeconds > 0 ? "var(--text-muted)" : "var(--primary)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {otpResendSeconds > 0
                  ? `Resend OTP in ${otpResendSeconds}s`
                  : "Resend OTP"}
              </button>
            </div>

            {/* MSG91 handles OTP delivery — no dev hint needed */}
          </div>
        </div>
      )}

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "0.25rem 1rem 1.5rem", overflowX: "hidden" }}>

        {/* ===== STEP 0: Basic Info ===== */}
        {step === 0 && (
          <div className="animate-fade-in-up">
            <StepProgressBar step={1} total={6} />
            <StepHeader step={1} total={6} title="Create your profile" />
            <div className="register-card" style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "1.5rem" }}>
              {/* Profile for */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "0.625rem" }}>
                  This profile is for <span style={{ color: "var(--primary)", marginLeft: "2px" }}>*</span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }} role="group" aria-label="Profile for">
                  {PROFILE_FOR_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => set("profileFor", opt.label)}
                      aria-pressed={form.profileFor === opt.label}
                      style={{
                        padding: "0.4375rem 1.125rem",
                        borderRadius: "var(--radius-full)",
                        border: "1.5px solid " + (form.profileFor === opt.label ? "var(--primary)" : "var(--border-color)"),
                        background: form.profileFor === opt.label ? "var(--primary)" : "#fff",
                        color: form.profileFor === opt.label ? "#fff" : "var(--text-dark)",
                        fontWeight: form.profileFor === opt.label ? 700 : 400,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { if (form.profileFor !== opt.label) { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; } }}
                      onMouseLeave={(e) => { if (form.profileFor !== opt.label) { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-dark)"; } }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">
                  {form.profileFor && form.profileFor !== "Myself" ? `${form.profileFor.replace("My ", "")}'s Name` : "Your Name"}
                  <span style={{ color: "var(--primary)", marginLeft: "2px" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!e.target.value.trim()) setFieldError("name", "Name is required.");
                    else clearFieldError("name");
                  }}
                  aria-required="true"
                  style={{ borderColor: fieldErrors.name ? "#D32F2F" : undefined }}
                />
                <FieldError msg={fieldErrors.name} />
              </div>

              {/* Gender */}
              <div style={{ marginBottom: "1.25rem" }}>
                <PillGroup
                  label="Profile Gender"
                  options={["Male", "Female"]}
                  value={form.gender === "male" ? "Male" : form.gender === "female" ? "Female" : ""}
                  onChange={(v) => {
                    set("gender", v.toLowerCase());
                    clearFieldError("gender");
                  }}
                  required
                />
                <FieldError msg={fieldErrors.gender} />
              </div>

              {/* Looking For (Partner Gender) */}
              <div style={{ marginBottom: "1.25rem" }}>
                <PillGroup
                  label="Looking For"
                  options={["Male", "Female"]}
                  value={form.partnerGender === "male" ? "Male" : form.partnerGender === "female" ? "Female" : ""}
                  onChange={(v) => {
                    set("partnerGender", v.toLowerCase());
                    clearFieldError("partnerGender");
                  }}
                  required
                />
                <FieldError msg={fieldErrors.partnerGender} />
              </div>

              {/* Date of Birth — three dropdowns with leap year support */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Date of Birth <span style={{ color: "var(--primary)" }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "0.5rem" }}>
                  {/* Day */}
                  <select
                    className="form-select"
                    value={form.dobDay}
                    onChange={(e) => {
                      updateDobPart("dobDay", e.target.value);
                      clearFieldError("dob");
                    }}
                    aria-label="Day of birth"
                    style={{ borderColor: fieldErrors.dob ? "#D32F2F" : undefined }}
                  >
                    <option value="">DD</option>
                    {dobDayOptions.map((d) => (
                      <option key={d} value={String(d)}>{String(d).padStart(2, "0")}</option>
                    ))}
                  </select>
                  {/* Month */}
                  <select
                    className="form-select"
                    value={form.dobMonth}
                    onChange={(e) => {
                      updateDobPart("dobMonth", e.target.value);
                      clearFieldError("dob");
                    }}
                    aria-label="Month of birth"
                    style={{ borderColor: fieldErrors.dob ? "#D32F2F" : undefined }}
                  >
                    <option value="">Month</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={String(m.value)}>{m.label}</option>
                    ))}
                  </select>
                  {/* Year */}
                  <select
                    className="form-select"
                    value={form.dobYear}
                    onChange={(e) => {
                      updateDobPart("dobYear", e.target.value);
                      clearFieldError("dob");
                    }}
                    aria-label="Year of birth"
                    style={{ borderColor: fieldErrors.dob ? "#D32F2F" : undefined }}
                  >
                    <option value="">YYYY</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
                {form.dob && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    {(() => {
                      const age = Math.floor((Date.now() - new Date(form.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                      return `Age: ${age} years`;
                    })()}
                  </p>
                )}
                <FieldError msg={fieldErrors.dob} />
              </div>

              {/* Mobile + OTP */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Mobile Number <span style={{ color: "var(--primary)" }}>*</span></label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", border: "1.5px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.625rem 0.625rem", background: "#F7F7F7", fontSize: "0.875rem", color: "var(--text-dark)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                    +91 <ChevronDown size={12} />
                  </div>
                  <input
                    type="tel" className="form-input" placeholder="Enter Mobile Number" maxLength={10}
                    value={form.mobile}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      set("mobile", v);
                      const err = validateMobile(v);
                      if (err) setFieldError("mobile", err);
                      else clearFieldError("mobile");
                    }}
                    disabled={otpVerified} style={{ flex: 1, opacity: otpVerified ? 0.7 : 1, borderColor: fieldErrors.mobile ? "#D32F2F" : undefined }}
                    aria-required="true"
                  />
                  {otpVerified ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--success)", fontWeight: 700, fontSize: "0.8125rem", flexShrink: 0 }}>
                      <Check size={15} /> Verified
                    </div>
                  ) : (
                    <button
                      type="button" onClick={handleSendOtp}
                      disabled={otpSending}
                      style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "0 0.875rem", fontWeight: 700, fontSize: "0.8125rem", cursor: otpSending ? "wait" : "pointer", fontFamily: "var(--font-sans)", flexShrink: 0, whiteSpace: "nowrap", opacity: otpSending ? 0.7 : 1 }}
                    >
                      {otpSending ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP"}
                    </button>
                  )}
                </div>
                <FieldError msg={fieldErrors.mobile} />
                {!fieldErrors.mobile && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    {otpVerified ? "Mobile number verified ✓" : "OTP will be sent to this number"}
                  </p>
                )}
                {fieldErrors.otp && <FieldError msg={fieldErrors.otp} />}
              </div>

              {/* Password — mandatory with eye toggle */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="form-label" htmlFor="password-input">Set Password <span style={{ color: "var(--primary)", marginLeft: "2px" }}>*</span></label>
                <div style={{ position: "relative" }}>
                  {/* Hidden dummy inputs trick browser autofill away from visible fields */}
                  <input type="text" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
                  <input type="password" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Create a login password (min 6 characters)"
                    value={form.password}
                    autoComplete="new-password"
                    onChange={(e) => {
                      set("password", e.target.value);
                      if (!e.target.value) setFieldError("password", "Password is required.");
                      else {
                        const err = validatePassword(e.target.value);
                        if (err) setFieldError("password", err);
                        else clearFieldError("password");
                      }
                    }}
                    style={{ borderColor: fieldErrors.password ? "#D32F2F" : undefined, paddingRight: "2.5rem" }}
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#888", padding: "2px",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <FieldError msg={fieldErrors.password} />
              </div>

              {/* ── Email with OTP Verification (mandatory) ── */}
              <div style={{ marginBottom: "1.5rem", background: "var(--bg-page)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "1rem 1.125rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.625rem" }}>
                  <Mail size={15} style={{ color: "var(--primary)" }} />
                  <label className="form-label" style={{ margin: 0, fontSize: "0.9375rem" }}>
                    Email Address <span style={{ color: "var(--primary)", marginLeft: "2px" }}>*</span>
                  </label>
                </div>

                {!emailOtpVerified ? (
                  <>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="your@email.com"
                        value={form.email}
                        disabled={emailOtpSent}
                        autoComplete="off"
                        onChange={(e) => {
                          set("email", e.target.value);
                          clearFieldError("email");
                          setEmailOtpSent(false);
                          setEmailOtpVerified(false);
                        }}
                        style={{ flex: 1, borderColor: fieldErrors.email ? "#D32F2F" : undefined, opacity: emailOtpSent ? 0.7 : 1 }}
                      />
                      {!emailOtpSent ? (
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={emailOtpSending || !form.email.trim()}
                          style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "0 0.875rem", fontWeight: 700, fontSize: "0.8125rem", cursor: emailOtpSending || !form.email.trim() ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", flexShrink: 0, whiteSpace: "nowrap", opacity: emailOtpSending || !form.email.trim() ? 0.6 : 1 }}
                        >
                          {emailOtpSending ? "Sending…" : "Send OTP"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setEmailOtpSent(false); setEmailOtp(""); }}
                          style={{ background: "none", border: "1.5px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0 0.75rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", fontFamily: "var(--font-sans)", flexShrink: 0, color: "var(--text-medium)", whiteSpace: "nowrap" }}
                        >
                          Change
                        </button>
                      )}
                    </div>
                    <FieldError msg={fieldErrors.email} />

                    {emailOtpSent && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                          OTP sent to <strong>{form.email}</strong>
                        </p>
                        <div style={{ display: "flex", gap: "6px", marginBottom: "0.5rem" }}>
                          {[0,1,2,3,4,5].map(i => (
                            <input
                              key={i}
                              id={`email-otp-reg-${i}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={emailOtp[i] || ""}
                              autoFocus={i === 0 && emailOtpSent}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                const arr = emailOtp.split("");
                                arr[i] = val;
                                const next = arr.join("").slice(0, 6);
                                setEmailOtp(next);
                                if (val && i < 5) (document.getElementById(`email-otp-reg-${i+1}`) as HTMLInputElement)?.focus();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" && !emailOtp[i] && i > 0)
                                  (document.getElementById(`email-otp-reg-${i-1}`) as HTMLInputElement)?.focus();
                              }}
                              style={{ width: "38px", height: "42px", textAlign: "center", fontSize: "1.125rem", fontWeight: 800, border: `2px solid ${emailOtp[i] ? "var(--primary)" : "var(--border-color)"}`, borderRadius: "var(--radius-md)", background: emailOtp[i] ? "var(--primary-light)" : "#fff", color: "var(--primary)", outline: "none", fontFamily: "var(--font-sans)" }}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={handleVerifyEmailOtp}
                            disabled={emailOtpVerifying || emailOtp.length !== 6}
                            style={{ background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "0 0.875rem", fontWeight: 700, fontSize: "0.8125rem", cursor: emailOtpVerifying || emailOtp.length !== 6 ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", flexShrink: 0, opacity: emailOtpVerifying || emailOtp.length !== 6 ? 0.6 : 1 }}
                          >
                            {emailOtpVerifying ? "…" : "Verify"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleResendEmailOtp}
                          disabled={emailResendSecs > 0}
                          style={{ background: "none", border: "none", cursor: emailResendSecs > 0 ? "not-allowed" : "pointer", fontSize: "0.75rem", fontWeight: 700, color: emailResendSecs > 0 ? "var(--text-muted)" : "var(--primary)", fontFamily: "var(--font-sans)" }}
                        >
                          {emailResendSecs > 0 ? `Resend in ${emailResendSecs}s` : "Resend OTP"}
                        </button>
                      </div>
                    )}

                    {!emailOtpSent && (
                      <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>
                        We&apos;ll send a 6-digit OTP to verify your email.
                      </p>
                    )}
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--success)", fontSize: "0.875rem", fontWeight: 600 }}>
                    <Check size={15} />
                    <span>Email verified: <strong>{form.email}</strong></span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => { if (validateStep0()) { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
                className="btn btn-primary animate-pulse-rose"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Continue
              </button>

              <p style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.75rem" }}>
                By continuing, you agree to our{" "}
                <a href="/terms" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Terms</a>
                {" "}and{" "}
                <a href="/privacy" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</a>
              </p>
            </div>
          </div>
        )}

        {/* ===== STEP 1: Personal & Religious Details ===== */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <StepProgressBar step={2} total={6} />
            <StepHeader step={2} total={6} title="Personal and Religious Details" onBack={() => setStep(step - 1)} />
            <div className="register-card" style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-light)" }}>
                Personal Details
              </h3>

              {/* Height */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
                  {form.profileFor && form.profileFor !== "Myself" ? `${form.profileFor.replace("My ", "")}'s` : "Your"} Height <span style={{ color: "var(--primary)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    className="form-select"
                    value={form.height}
                    onChange={(e) => set("height", e.target.value)}
                    aria-required="true"
                  >
                    <option value="">Select height</option>
                    {HEIGHT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Physical status */}
              <PillGroup
                label={`${form.profileFor && form.profileFor !== "Myself" ? form.profileFor.replace("My ", "") + "'s " : ""}Physical status`}
                options={["Normal", "Physically challenged"]}
                value={form.physicalStatus}
                onChange={(v) => set("physicalStatus", v)}
              />

              {/* Marital status */}
              <PillGroup
                label={`${form.profileFor && form.profileFor !== "Myself" ? form.profileFor.replace("My ", "") + "'s " : ""}Marital status`}
                options={MARITAL_STATUS.map((m) => m.label)}
                value={form.maritalStatus}
                onChange={(v) => set("maritalStatus", v)}
              />

              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-light)", marginTop: "0.5rem" }}>
                Religion &amp; Community
              </h3>

              <SearchableSelect
                label="Religion"
                value={form.religion}
                onChange={(v) => {
                  set("religion", v);
                  set("caste", "");
                  set("subcaste", "");
                  if (v) clearFieldError("religion");
                  else setFieldError("religion", "Please select a religion.");
                }}
                options={RELIGIONS}
                placeholder="Select religion"
              />
              <FieldError msg={fieldErrors.religion} />
              {castes.length > 0 && (
                <SearchableSelect
                  label="Caste"
                  value={form.caste}
                  onChange={(v) => { set("caste", v); set("subcaste", ""); }}
                  options={castes}
                  placeholder="Search or select caste"
                />
              )}

              {/* ── SUB-CASTE SECTION ── */}
              {form.caste && (
                <div style={{ marginBottom: "1rem" }}>
                  <label className="form-label">
                    Sub-caste <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.subcaste}
                    onChange={(e) => set("subcaste", e.target.value)}
                    placeholder="Enter your sub-caste"
                    disabled={!form.caste}
                  />
                </div>
              )}

              <SearchableSelect label="Mother Tongue" value={form.motherTongue} onChange={(v) => set("motherTongue", v)} options={MOTHER_TONGUES} placeholder="Select mother tongue" />
              
              <MultiSelectTags
                label="Other Languages Known"
                values={form.languages}
                onChange={(vals) => setForm(f => ({ ...f, languages: vals }))}
                options={MOTHER_TONGUES}
                placeholder="Type or select languages..."
              />
              <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-light)", marginTop: "0.5rem" }}>
                Horoscope Details
              </h3>

              {/* Star (Natchathiram) */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Star (Natchathiram)</label>
                <select
                  className="form-select"
                  value={form.star}
                  onChange={(e) => set("star", e.target.value)}
                >
                  <option value="">Select your star</option>
                  {STARS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Raasi */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Raasi</label>
                <select
                  className="form-select"
                  value={form.rasi}
                  onChange={(e) => set("rasi", e.target.value)}
                >
                  <option value="">Select your raasi</option>
                  {RAASI_LIST.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Dhosham */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "0.625rem" }}>
                  Dhosham
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {DHOSHAM_OPTIONS.map((d) => {
                    const selected = form.dhosham.split(', ').includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          const arr = form.dhosham ? form.dhosham.split(', ') : [];
                          let newArr;
                          if (selected) {
                            newArr = arr.filter(x => x !== d.value);
                          } else {
                            if (d.value === 'none' || d.value === 'unknown') {
                              newArr = [d.value];
                            } else {
                              newArr = arr.filter(x => x !== 'none' && x !== 'unknown').concat(d.value);
                            }
                          }
                          set("dhosham", newArr.join(', '));
                        }}
                        style={{
                          padding: "0.4375rem 1rem",
                          borderRadius: "var(--radius-full)",
                          border: `1.5px solid ${selected ? "var(--primary)" : "var(--border-color)"}`,
                          background: selected ? "var(--primary)" : "#fff",
                          color: selected ? "#fff" : "var(--text-dark)",
                          fontWeight: selected ? 700 : 400,
                          fontSize: "0.875rem",
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => { if (validateStep1()) { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Education & Career / Location ===== */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <StepProgressBar step={3} total={6} />
            <StepHeader step={3} total={6} title="Education and Career" onBack={() => setStep(1)} />
            <div className="register-card" style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "1.5rem" }}>
              <SearchableSelect
                label="Highest Education"
                value={form.education}
                onChange={(v) => {
                  set("education", v);
                  if (v) clearFieldError("education");
                  else setFieldError("education", "Please select your education.");
                }}
                options={EDUCATION_LEVELS}
                placeholder="Select education"
              />
              <FieldError msg={fieldErrors.education} />
              <FloatSearchableCombobox
                label="Occupation"
                value={form.occupation}
                onChange={(v) => {
                  set("occupation", v);
                  if (v) clearFieldError("occupation");
                  else setFieldError("occupation", "Please select your occupation.");
                }}
                options={OCCUPATIONS}
                placeholder="Search or type your occupation..."
              />
              <FieldError msg={fieldErrors.occupation} />
              <SearchableSelect label="Annual Income (Rs.)" value={form.income} onChange={(v) => set("income", v)} options={INCOME_OPTIONS} placeholder="Select income range" />

              <div style={{ marginBottom: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-light)" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "1rem" }}>Location</h3>
                <FloatSearchableCombobox
                  label="State"
                  value={form.state}
                  onChange={(v) => { set("state", v); set("city", ""); }}
                  options={INDIAN_STATES}
                  placeholder="Search or select state..."
                />
                <FloatSearchableCombobox
                  label="City"
                  value={form.city}
                  onChange={(v) => {
                    set("city", v);
                    // If state not selected yet, auto-select state if city belongs to a known state
                    if (!form.state && v) {
                      const matchedState = Object.keys(CITIES_BY_STATE).find((st) =>
                        CITIES_BY_STATE[st].includes(v)
                      );
                      if (matchedState) set("state", matchedState);
                    }
                  }}
                  options={
                    form.state && CITIES_BY_STATE[form.state]
                      ? CITIES_BY_STATE[form.state]
                      : ALL_INDIAN_CITIES
                  }
                  placeholder="Search or select city..."
                />
              </div>

              <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border-light)", marginBottom: "0.5rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "1rem" }}>Lifestyle</h3>
                <PillGroup label="Diet" options={EATING_HABITS.map((e) => e.label).filter((l) => l !== "Doesn't Matter")} value={form.diet} onChange={(v) => set("diet", v)} />
              </div>

              <button
                type="button"
                onClick={() => { if (validateStep2()) { setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Partner Preferences ===== */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <StepProgressBar step={4} total={6} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button onClick={() => setStep(2)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-dark)", display: "flex" }}>
                  <ChevronLeft size={20} />
                </button>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>Partner Preferences</h2>
              </div>
              <button
                onClick={() => { setStep(4); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 700, fontSize: "0.875rem", fontFamily: "var(--font-sans)" }}
              >
                Skip
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div className="register-card" style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "1.5rem" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                Tell us what you&apos;re looking for in a partner. Matches will be scored based on your preferences.
              </p>

              {/* Partner Age Range */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "0.625rem" }}>
                  Partner Age Range
                </label>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <select
                    className="form-select"
                    value={form.partnerAgeMin ?? ""}
                    onChange={e => setForm(f => ({ ...f, partnerAgeMin: e.target.value ? Number(e.target.value) : undefined }))}
                    style={{ flex: 1 }}
                  >
                    <option value="">Min Age</option>
                    {Array.from({ length: 35 }, (_, i) => 18 + i).map(age => (
                      <option key={age} value={age}>{age} yrs</option>
                    ))}
                  </select>
                  <span style={{ color: "var(--text-muted)", fontWeight: 600, flexShrink: 0 }}>to</span>
                  <select
                    className="form-select"
                    value={form.partnerAgeMax ?? ""}
                    onChange={e => setForm(f => ({ ...f, partnerAgeMax: e.target.value ? Number(e.target.value) : undefined }))}
                    style={{ flex: 1 }}
                  >
                    <option value="">Max Age</option>
                    {Array.from({ length: 35 }, (_, i) => 18 + i).map(age => (
                      <option key={age} value={age}>{age} yrs</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Partner Religion */}
              <SearchableSelect
                label="Partner Religion"
                value={form.partnerReligion}
                onChange={v => setForm(f => ({ ...f, partnerReligion: v }))}
                options={["Any", ...RELIGIONS]}
                placeholder="Any religion"
              />

              {/* Partner Marital Status */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", marginBottom: "0.625rem" }}>
                  Acceptable Marital Status
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {MARITAL_STATUS.map(m => {
                    const selected = form.partnerMaritalStatus.includes(m.label);
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, partnerMaritalStatus: selected ? f.partnerMaritalStatus.filter(x => x !== m.label) : [...f.partnerMaritalStatus, m.label] }))}
                        style={{
                          padding: "0.4375rem 1rem",
                          borderRadius: "var(--radius-full)",
                          border: `1.5px solid ${selected ? "var(--primary)" : "var(--border-color)"}`,
                          background: selected ? "var(--primary)" : "#fff",
                          color: selected ? "#fff" : "var(--text-dark)",
                          fontWeight: selected ? 700 : 400,
                          fontSize: "0.875rem",
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred State */}
              <SearchableSelect
                label="Preferred State"
                value={form.partnerState}
                onChange={v => setForm(f => ({ ...f, partnerState: v }))}
                options={["Any", ...INDIAN_STATES]}
                placeholder="Any state"
              />

              <button
                type="button"
                onClick={() => { setStep(4); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
              >
                Save & Continue
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 4: Add Photo ===== */}

        {step === 4 && (
          <div className="animate-fade-in-up">
            <StepProgressBar step={5} total={6} />
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button onClick={() => setStep(3)} aria-label="Go back" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-dark)", display: "flex" }}>
                  <ChevronLeft size={20} />
                </button>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>Add photo</h2>
              </div>
              <button
                onClick={() => { setStep(5); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 700, fontSize: "0.875rem", fontFamily: "var(--font-sans)" }}
              >
                Continue Without Photo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <div className="register-card" style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "1.75rem" }}>
              {/* Avatar preview */}
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.25rem" }}>
                <label
                  htmlFor="photo-upload"
                  style={{
                    width: "100px",
                    height: "110px",
                    border: form.photoUrl ? "2px solid var(--primary)" : "2px dashed var(--primary)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--primary-light)",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  {form.photoUrl ? (
                    <>
                      <img src={form.photoUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={(e) => { e.preventDefault(); set("photoUrl", ""); setPhotoFile(null); }}
                        style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, color: "#fff" }}
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <Plus size={36} color="var(--primary)" strokeWidth={2.5} />
                  )}
                </label>
              </div>

              <h3 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--text-dark)", marginBottom: "0.875rem" }}>
                Add photo for better responses
              </h3>

              <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)", marginBottom: "0.625rem" }}>
                Benefits of adding photo
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-medium)" strokeWidth="1.5">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                  </svg>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-medium)" }}>90% members prefer to contact only profiles with photo</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-medium)" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.63 19 19.5 19.5 0 0 1 4.69 12"/>
                    <path d="M1 1l22 22M4.69 4.69A19.79 19.79 0 0 0 1.73 11.6a2 2 0 0 0 .27 1.15L3 14"/>
                  </svg>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-medium)" }}>10 times more responses</span>
                </div>
              </div>


              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => set("photoUrl", reader.result as string);
                    reader.readAsDataURL(file);
                    toast.success("Photo selected! It will be uploaded on registration.");
                  }
                }}
              />

              <button
                type="button"
                onClick={() => { setStep(5); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "0.75rem" }}
              >
                {form.photoUrl ? "Save & Continue" : "Continue Without Photo"}
              </button>

              {form.photoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    set("photoUrl", "");
                    setPhotoFile(null);
                    setStep(5);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    color: "var(--text-medium)",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    marginTop: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Continue Without Photo
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===== STEP 5: Horoscope & About Me ===== */}
        {step === 5 && (
          <div className="animate-fade-in-up">
            <StepProgressBar step={6} total={6} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <button onClick={() => setStep(4)} aria-label="Go back" style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-dark)", display: "flex" }}>
                <ChevronLeft size={20} />
              </button>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>Horoscope &amp; About You</h2>
            </div>

            <div className="register-card" style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)", padding: "1.75rem" }}>
              {/* ── MANDATORY HOROSCOPE UPLOAD SECTION ── */}
              <div style={{ marginBottom: "1.75rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.625rem" }}>
                  <label style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-dark)", margin: 0 }}>
                    Upload Horoscope
                  </label>
                  <span
                    title="Upload PDF or JPG format of your horoscope (jathagam)"
                    style={{ cursor: "pointer", color: "#8E8E93", display: "inline-flex", alignItems: "center" }}
                  >
                    <Info size={16} />
                  </span>
                </div>

                <label
                  htmlFor="horoscope-file-input"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "56px",
                    padding: "0.875rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    border: `1.5px dashed ${horoscopeError ? "#D32F2F" : horoscopeFile ? "var(--primary)" : "#E4C5B9"}`,
                    background: horoscopeFile ? "var(--primary-light)" : "#FFFDFB",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {horoscopeFile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={22} style={{ color: "var(--primary)" }} />
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--text-dark)" }}>
                            {horoscopeFileName || horoscopeFile.name}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--success)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                            <Check size={13} /> Horoscope attached successfully
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setHoroscopeFile(null);
                          setHoroscopeFileName("");
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: "4px" }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4A2027" }}>
                      <Upload size={18} />
                      <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Upload Horoscope (PDF/JPG)</span>
                    </div>
                  )}
                </label>

                <input
                  id="horoscope-file-input"
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setHoroscopeFile(file);
                      setHoroscopeFileName(file.name);
                      setHoroscopeError("");
                      toast.success("Horoscope attached!");
                    }
                  }}
                />

                {horoscopeError && <FieldError msg={horoscopeError} />}
                {!horoscopeFile && !horoscopeError && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem", marginBottom: 0 }}>
                    Registration will be completed only after uploading your horoscope image.
                  </p>
                )}
              </div>

              {/* ── ABOUT YOU SECTION ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--text-dark)", margin: 0 }}>
                  Write a few words about yourself
                </h3>
                <button
                  onClick={() => set("about", generateBio(form))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: "0.8125rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.34-11.14l4.5 4.5"/></svg>
                  Regenerate
                </button>
              </div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-medium)", marginBottom: "0.25rem", lineHeight: 1.5 }}>
                A good bio tells prospects about your personality, upbringing, and what you are looking for in a partner.
              </p>
              <p style={{ fontSize: "0.8125rem", color: "#007B55", fontWeight: 600, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "4px" }}>
                ✨ Here’s a bio based on your profile. You can edit it before continuing.
              </p>

              <textarea
                className="form-input"
                placeholder="E.g. I am a software engineer working in Chennai. I come from a traditional nuclear family..."
                value={form.about}
                onChange={e => set("about", e.target.value)}
                style={{ minHeight: "120px", resize: "vertical", fontSize: "0.875rem", padding: "1rem", marginBottom: "1.5rem" }}
              />

              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
              >
                {isSubmitting ? "Creating your profile..." : "Complete Registration"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RegisterWizardWithKey() {
  const searchParams = useSearchParams();
  return <RegisterWizard key={searchParams.toString()} />;
}

export default function RegisterPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)" }}>
        <p style={{ color: "var(--text-medium)" }}>Loading...</p>
      </div>
    }>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          <RegisterWizardWithKey />
        </div>
        <CompactFooter />
      </div>
    </Suspense>
  );
}
