"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import BackButton from "@/components/ui/BackButton";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import CompactFooter from "@/components/layout/CompactFooter";
import {
  Camera, Upload, Trash2, Check, ChevronRight, ChevronDown,
  User, BookOpen, Briefcase, Users, Leaf, MapPin, FileText,
  Heart, Info, Save, Eye, X, Plus, ArrowLeft, CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, addProfilePhoto, deleteProfilePhoto, setProfilePhotoPrimary, type ProfilePhoto, computeProfileCompletion } from "@/lib/auth-store";
import { uploadProfilePhoto } from "@/lib/supabase";
import Link from "next/link";
import {
  RELIGIONS, MARITAL_STATUS, MOTHER_TONGUES, EDUCATION_LEVELS,
  OCCUPATIONS, INCOME_RANGES, INDIAN_STATES, COUNTRIES,
  EATING_HABITS, SMOKING_OPTIONS, DRINKING_OPTIONS,
  STARS, RAASI_LIST, DHOSHAM_OPTIONS, HEIGHTS,
  RELIGION_TO_CASTES, HOBBIES_LIST, INTERESTS_LIST, LANG_LIST
} from "@/data/matrimony-data";
import citiesData from "@/data/cities.json";
import SearchableSelect from "@/components/ui/SearchableSelect";

// ── SECTION META ─────────────────────────────────────────────────────
const SECTIONS = [
  { id: "photo",       label: "Photos & Gallery",      icon: <Camera size={16} /> },
  { id: "basic",       label: "Basic Information",     icon: <User size={16} /> },
  { id: "religion",    label: "Religious Information", icon: <span style={{ fontSize: 14 }}>🕉️</span> },
  { id: "professional",label: "Professional Details",  icon: <Briefcase size={16} /> },
  { id: "family",      label: "Family Details",        icon: <Users size={16} /> },
  { id: "lifestyle",   label: "Lifestyle",             icon: <Leaf size={16} /> },
  { id: "location",    label: "Location",              icon: <MapPin size={16} /> },
  { id: "about",       label: "About Me",              icon: <FileText size={16} /> },
  { id: "partner",     label: "Partner Preferences",   icon: <Heart size={16} /> },
];

// ── FORM FIELD COMPONENTS ─────────────────────────────────────────────
function FormField({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-medium)", display: "flex", alignItems: "center", gap: "4px" }}>
        {label}
        {required && <span style={{ color: "var(--primary)" }}>*</span>}
        {hint && (
          <span title={hint} style={{ cursor: "help", color: "#aaa" }}>
            <Info size={12} />
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function FormInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="form-input"
      style={{ fontSize: "0.875rem", ...(disabled ? { background: "#f9f9f9", color: "#aaa" } : {}) }}
    />
  );
}

function FormSelect({ value, onChange, options, placeholder = "Select" }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
}) {
  const normalised = (options as (string | { value: string; label: string })[]).map(o =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="form-select"
      style={{ fontSize: "0.875rem" }}
    >
      <option value="">{placeholder}</option>
      {normalised.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}


// ── SECTION CARD ─────────────────────────────────────────────────────
function SectionCard({ id, title, icon, children }: {
  id: string; title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      style={{
        background: "#fff",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-xl)",
        marginBottom: "1.25rem",
        boxShadow: "var(--shadow-sm)",
        scrollMarginTop: "80px",
      }}
    >
      <div style={{
        padding: "1rem 1.5rem",
        borderBottom: "1px solid var(--border-light)",
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        background: "#FAFAFA",
        borderTopLeftRadius: "calc(var(--radius-xl) - 1px)",
        borderTopRightRadius: "calc(var(--radius-xl) - 1px)",
      }}>
        <span style={{ color: "var(--primary)" }}>{icon}</span>
        <h2 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}

// ── GRID ─────────────────────────────────────────────────────────────
function FieldGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: "1.125rem 1.5rem",
    }}
      className={`edit-grid edit-grid-${cols}`}
    >
      {children}
    </div>
  );
}

function FullWidth({ children }: { children: React.ReactNode }) {
  return <div style={{ gridColumn: "1 / -1" }}>{children}</div>;
}

// ── PROGRESS BAR ─────────────────────────────────────────────────────
function ProfileProgress({ pct }: { pct: number }) {
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-dark)" }}>Profile Completion</span>
        <span style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--primary)" }}>{pct}%</span>
      </div>
      <div style={{ height: "6px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--gradient-hero)", borderRadius: "3px", transition: "width 0.5s ease" }} />
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.375rem" }}>
        {pct >= 100 ? "Your profile is fully complete!" : "Add more details to improve your matches"}
      </div>
    </div>
  );
}

// ── MULTI-SELECT TAGS ────────────────────────────────────────────────
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Determine dropup direction based on space below the input
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      setDropup(spaceBelow < 260); // same logic as SearchableSelect
    }
  }, [open]);

  const unselected = options.filter(o => !values.includes(o));
  const filtered = query
    ? unselected.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 30)
    : unselected.slice(0, 30);

  const select = (v: string) => {
    if (!values.includes(v)) onChange([...values, v]);
    setQuery("");
    setOpen(false);
  };

  const remove = (v: string) => {
    onChange(values.filter(x => x !== v));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        className="form-input"
        style={{
          minHeight: "48px", height: "auto", display: "flex", flexWrap: "wrap", gap: "0.375rem",
          padding: "0.625rem 2.25rem 0.625rem 0.875rem", alignItems: "center", cursor: "text", position: "relative"
        }}
        onClick={() => { document.getElementById(`multi-input-${label}`)?.focus(); setOpen(true); }}
      >
        {values.map(val => (
          <span
            key={val}
            style={{
              background: "var(--primary-light)", color: "var(--primary)",
              padding: "2px 8px", borderRadius: "var(--radius-full)",
              fontSize: "0.75rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px",
              whiteSpace: "nowrap"
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
          id={`multi-input-${label}`}
          type="text"
          value={query}
          placeholder={values.length === 0 ? placeholder : ""}
          style={{
            border: "none", outline: "none", background: "transparent",
            flex: 1, minWidth: "60px", fontSize: "0.875rem", color: "var(--text-dark)",
          }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        <div style={{ position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex", alignItems: "center" }}>
          <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        </div>
      </div>
      {open && (
        <div style={{
          position: "absolute",
          ...(dropup 
            ? { bottom: "calc(100% + 4px)", top: "auto" }
            : { top: "calc(100% + 4px)", bottom: "auto" }),
          left: 0, right: 0,
          background: "#fff", border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          maxHeight: "200px", overflowY: "auto", zIndex: 200,
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

// ── MAIN ─────────────────────────────────────────────────────────────
function EditProfileContent() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  // Scroll to section from ?section= param
  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
  }, [searchParams]);

  const [saving, setSaving] = useState(false);
  const [gallery, setGallery] = useState<ProfilePhoto[]>(user?.photos || []);

  useEffect(() => {
    if (user?.photos) {
      setGallery(user.photos);
    }
  }, [user?.photos]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // § Basic
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [height, setHeight] = useState(user?.height || "");
  const [weight, setWeight] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [physicalStatus, setPhysicalStatus] = useState("");
  const [maritalStatus, setMaritalStatus] = useState(user?.maritalStatus || "");
  const [motherTongue, setMotherTongue] = useState(user?.motherTongue || "");

  // § Religion
  const [religion, setReligion] = useState(user?.religion || "");
  const [caste, setCaste] = useState(user?.caste || "");
  const [originalCaste] = useState(user?.caste || ""); // to detect if caste was changed
  const [subCaste, setSubCaste] = useState(user?.subcaste || "");
  const [gothram, setGothram] = useState("");
  const [star, setStar] = useState(user?.star || "");
  const [rasi, setRasi] = useState(user?.rasi || "");
  const [dhosham, setDhosham] = useState(user?.dhosham || "");
  const [timeOfBirth, setTimeOfBirth] = useState("");

  // § Professional
  const [education, setEducation] = useState(user?.education || "");
  const [college, setCollege] = useState("");
  const [occupation, setOccupation] = useState(user?.occupation || "");
  const [company, setCompany] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [income, setIncome] = useState(user?.income || "");

  // § Family
  const [fatherOcc, setFatherOcc] = useState(user?.fatherOccupation || "");
  const [motherOcc, setMotherOcc] = useState(user?.motherOccupation || "");
  const [familyStatus, setFamilyStatus] = useState(user?.familyStatus || "");
  const [familyType, setFamilyType] = useState(user?.familyType || "");
  const [brothers, setBrothers] = useState(String(user?.brothers || 0));
  const [sisters, setSisters] = useState(String(user?.sisters || 0));

  // § Lifestyle
  const [diet, setDiet] = useState(user?.diet || "");
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");
  const [disabilities, setDisabilities] = useState("None");
  const [languages, setLanguages] = useState<string[]>(["Tamil"]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  // § Location
  const [country, setCountry] = useState(user?.country || "India");
  const [state, setState] = useState(user?.state || "");
  const [city, setCity] = useState(user?.city || "");
  const [nativePlace, setNativePlace] = useState(user?.nativePlace || "");
  const [address, setAddress] = useState("");

  // § About
  const [about, setAbout] = useState(user?.about || "");

  // § Partner
  const [pGender, setPGender] = useState(user?.partnerGender || "");
  const [pAgeMin, setPAgeMin] = useState(String(user?.partnerAgeMin || 22));
  const [pAgeMax, setPAgeMax] = useState(String(user?.partnerAgeMax || 35));
  const [pReligion, setPReligion] = useState(user?.partnerReligion || "");
  const [pCaste, setPCaste] = useState(user?.partnerCaste || "");
  const [pEducation, setPEducation] = useState(user?.partnerEducation || "");
  const [pOccupation, setPOccupation] = useState(user?.partnerOccupation || "");
  const [pIncome, setPIncome] = useState(user?.partnerIncome || "");
  const [pHeightMin, setPHeightMin] = useState(user?.partnerHeightMin || "152");
  const [pHeightMax, setPHeightMax] = useState(user?.partnerHeightMax || "193");
  const [pMotherTongue, setPMotherTongue] = useState<string[]>(user?.partnerMotherTongue || []);
  const [pMaritalStatus, setPMaritalStatus] = useState<string[]>(user?.partnerMaritalStatus || []);
  const [pCountry, setPCountry] = useState(user?.partnerCountry || "India");

  const [initialStateHash, setInitialStateHash] = useState<string>("");
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

  const currentFormState = JSON.stringify({
    firstName, lastName, gender, dob, height, weight, bodyType, physicalStatus, maritalStatus, motherTongue,
    religion, caste, subCaste, gothram, star, rasi, dhosham, timeOfBirth, education, college,
    occupation, company, employmentType, income, diet, smoking, drinking, disabilities,
    languages, hobbies, interests, country, state, city, nativePlace, about,
    pGender, pAgeMin, pAgeMax, pReligion, pCaste, pEducation, pOccupation,
    pIncome, pHeightMin, pHeightMax, pCountry, pMaritalStatus, pMotherTongue,
    fatherOcc, motherOcc, familyStatus, familyType, brothers, sisters
  });

  const isDirty = initialStateHash !== "" && initialStateHash !== currentFormState;

  // ── Re-populate all fields once `user` loads from auth (auth is async) ─────
  // useState initializers only run once at mount; if user was null at that
  // point, all fields would be blank. This effect hydrates them on user load.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!user || hydratedRef.current) return;
    hydratedRef.current = true;

    // Basic
    setFirstName(user.name?.split(" ")[0] || "");
    setLastName(user.name?.split(" ").slice(1).join(" ") || "");
    setGender(user.gender || "");
    setDob(user.dob || "");
    setHeight(user.height || "");
    setWeight(user.weight || "");
    setBodyType(user.bodyType || "");
    setPhysicalStatus(user.physicalStatus || "");
    // Normalize maritalStatus: if DB has 'never_married' (value) convert to label
    const rawMS = user.maritalStatus || "";
    const normalizedMS = MARITAL_STATUS.find(m => m.value === rawMS)?.label ||
                         MARITAL_STATUS.find(m => m.label === rawMS)?.label ||
                         rawMS;
    setMaritalStatus(normalizedMS);
    setMotherTongue(user.motherTongue || "");

    // Religion
    setReligion(user.religion || "");
    setCaste(user.caste || "");
    setSubCaste(user.subcaste || "");
    setGothram(user.gothram || "");
    setStar(user.star || "");
    setRasi(user.rasi || "");
    setDhosham(user.dhosham || "");
    setTimeOfBirth(user.timeOfBirth || "");

    // Professional
    setEducation(user.education || "");
    setCollege(user.college || "");
    setOccupation(user.occupation || "");
    setCompany(user.company || "");
    setEmploymentType(user.employmentType || "");
    setIncome(user.income || "");

    // Family
    setFatherOcc(user.fatherOccupation || "");
    setMotherOcc(user.motherOccupation || "");
    setFamilyStatus(user.familyStatus || "");
    setFamilyType(user.familyType || "");
    setBrothers(String(user.brothers ?? 0));
    setSisters(String(user.sisters ?? 0));

    // Lifestyle
    setDiet(user.diet || "");
    setSmoking(user.smoking || "");
    setDrinking(user.drinking || "");
    setDisabilities(user.disabilities || "None");
    if (user.languages?.length) setLanguages(user.languages);
    if (user.hobbies?.length) setHobbies(user.hobbies);
    if (user.interests?.length) setInterests(user.interests);

    // Location
    setCountry(user.country || "India");
    setState(user.state || "");
    setCity(user.city || "");
    setNativePlace(user.nativePlace || "");

    // About
    setAbout(user.about || "");

    // Partner Preferences
    setPGender(user.partnerGender || "");
    setPAgeMin(String(user.partnerAgeMin ?? 22));
    setPAgeMax(String(user.partnerAgeMax ?? 35));
    setPReligion(user.partnerReligion || "");
    setPCaste(user.partnerCaste || "");
    setPEducation(user.partnerEducation || "");
    setPOccupation(user.partnerOccupation || "");
    setPIncome(user.partnerIncome || "");
    setPHeightMin(user.partnerHeightMin || "152");
    setPHeightMax(user.partnerHeightMax || "193");
    if (user.partnerMotherTongue?.length) setPMotherTongue(user.partnerMotherTongue);
    if (user.partnerMaritalStatus?.length) setPMaritalStatus(user.partnerMaritalStatus);
    setPCountry(user.partnerCountry || "India");

    // Gallery
    if (user.photos?.length) setGallery(user.photos);

    setTimeout(() => {
      setInitialStateHash(currentFormState);
    }, 150);
  }, [user]);
  // ─────────────────────────────────────────────────────────────────────────

  // Compute profile completion using the shared utility (consistent across app)
  const { pct } = computeProfileCompletion({
    ...user,
    name: firstName,
    gender: gender as "male" | "female",
    dob,
    religion,
    caste,
    education,
    occupation,
    city: city || state,
    about,
    photoUrl: gallery.some(p => p.isPrimary) ? gallery.find(p => p.isPrimary)?.url : user?.photoUrl,
    photos: gallery,
    fatherOccupation: fatherOcc,
    motherOccupation: motherOcc,
    familyStatus,
    familyType,
    nativePlace,
    partnerGender: pGender,
    partnerAgeMin: parseInt(pAgeMin) || undefined,
    partnerAgeMax: parseInt(pAgeMax) || undefined,
    partnerReligion: pReligion,
    partnerCaste: pCaste,
    partnerEducation: pEducation,
  });

  // Caste and Subcaste are now immutable and only displayed.

  const HEIGHT_OPTS = HEIGHTS.map(h => ({ value: String(h.value), label: h.label }));
  const PREF_HEIGHT_OPTS = [{ value: "Any", label: "Doesn't matter" }, ...HEIGHT_OPTS];
  const AGE_OPTS = Array.from({ length: 43 }, (_, i) => ({ value: String(i + 18), label: `${i + 18} yrs` }));

  const ALL_CITIES = Array.from(new Set(citiesData.map(c => c.city))).sort();

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5 MB"); return; }
    
    // Check limit
    if (gallery.length >= 8) { toast.error("Maximum 8 photos allowed (1 primary + 7 gallery)"); return; }
    
    setUploadingGallery(true);
    const toastId = toast.loading("Uploading photo...");
    try {
      const url = await uploadProfilePhoto(user.id, file);
      const isPrimary = gallery.length === 0 || !user.photoUrl;
      const newPhoto = await addProfilePhoto(user.id, url, isPrimary, gallery.length);
      if (newPhoto) {
        setGallery([...gallery, newPhoto]);
        if (isPrimary) await refresh();
        toast.success("Photo uploaded!", { id: toastId });
      } else {
        throw new Error("Failed to save to DB");
      }
    } catch (err) {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setUploadingGallery(false);
      if (e.target) e.target.value = ''; // reset input
    }
  };

  const handleSetPrimary = async (photoId: string, url: string) => {
    if (!user) return;
    const toastId = toast.loading("Setting as primary...");
    try {
      const success = await setProfilePhotoPrimary(photoId, user.id, url);
      if (success) {
        setGallery(gallery.map(p => ({ ...p, isPrimary: p.id === photoId, sortOrder: p.id === photoId ? 0 : 1 })));
        await refresh();
        toast.success("Primary photo updated", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to set primary", { id: toastId });
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!user) return;
    const toastId = toast.loading("Deleting photo...");
    try {
      const success = await deleteProfilePhoto(photoId);
      if (success) {
        const photo = gallery.find(p => p.id === photoId);
        setGallery(gallery.filter(p => p.id !== photoId));
        if (photo?.isPrimary) {
           await updateProfile(user.id, { photoUrl: "" });
           await refresh();
        }
        toast.success("Photo deleted", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  const handleSave = useCallback(async () => {
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    if (!dob) { toast.error("Date of birth is required"); return; }

    setSaving(true);

    try {
      if (!user) throw new Error("Not logged in");

        // Detect if caste was changed and increment casteChangeCount
        const casteChanged = caste && caste !== originalCaste;
        const currentCount = user.casteChangeCount ?? 0;

        await updateProfile(user.id, {
          name: `${firstName} ${lastName}`.trim(),
          gender: gender as "male" | "female",
          dob,
          height,
          weight,
          bodyType: bodyType || undefined,
          physicalStatus: physicalStatus || undefined,
          maritalStatus,
          motherTongue,
          religion,
          caste,
          subcaste: subCaste,
          gothram,
          star,
          rasi,
          dhosham,
          timeOfBirth: timeOfBirth || undefined,
          education,
          college,
          occupation,
          company,
          employmentType,
          income,
          diet,
          smoking,
          drinking,
          disabilities,
          languages,
          hobbies,
          interests,
          country,
          state,
          city,
          nativePlace,
          about,
          partnerGender: pGender || undefined,
          partnerAgeMin: parseInt(pAgeMin),
          partnerAgeMax: parseInt(pAgeMax),
          partnerReligion: pReligion || undefined,
          partnerCaste: pCaste || undefined,
          partnerEducation: pEducation || undefined,
          partnerOccupation: pOccupation || undefined,
          partnerIncome: pIncome || undefined,
          partnerHeightMin: pHeightMin || undefined,
          partnerHeightMax: pHeightMax || undefined,
          partnerCountry: pCountry || undefined,
          partnerMaritalStatus: pMaritalStatus,
          partnerMotherTongue: pMotherTongue,
          fatherOccupation: fatherOcc || undefined,
          motherOccupation: motherOcc || undefined,
          familyStatus: familyStatus || undefined,
          familyType: familyType || undefined,
          brothers: parseInt(brothers),
          sisters: parseInt(sisters),
          ...(casteChanged ? { casteChangeCount: currentCount + 1 } : {}),
        });

      await refresh();
      setInitialStateHash(currentFormState);
      setShowSuccessModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    user, firstName, lastName, gender, dob, height, weight, bodyType, physicalStatus, maritalStatus, motherTongue,
    religion, caste, originalCaste, subCaste, gothram, star, rasi, dhosham, timeOfBirth, education, college,
    occupation, company, employmentType, income, diet, smoking, drinking, disabilities,
    languages, hobbies, interests, country, state, city, nativePlace, about,
    gallery, pAgeMin, pAgeMax, pReligion, pCaste, pEducation, pOccupation,
    pIncome, pHeightMin, pHeightMax, pCountry, pMaritalStatus, pMotherTongue,
    fatherOcc, motherOcc, familyStatus, familyType, brothers, sisters, refresh, router, currentFormState
  ]);

  const handleBack = () => {
    if (isDirty) {
      setShowDiscardModal(true);
      setPendingNav(() => () => router.back());
    } else {
      router.back();
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = user ? `/profile/${user.id}` : "/matches";
    if (isDirty) {
      setShowDiscardModal(true);
      setPendingNav(() => () => router.push(target));
    } else {
      router.push(target);
    }
  };

  return (
    <>
      <Navbar />
      <style>{`
        .edit-sidebar::-webkit-scrollbar { display: none; }
        .edit-sidebar { scrollbar-width: none; }
        .edit-nav-item:hover { background: var(--primary-light) !important; color: var(--primary) !important; }
        @media (min-width: 900px) {
          .edit-sidebar {
            position: sticky !important;
            top: 80px !important;
            max-height: calc(100vh - 100px) !important;
            overflow-y: auto !important;
            overscroll-behavior-y: auto !important;
            align-self: flex-start !important;
          }
        }
        @media (max-width: 899px) {
          .edit-sidebar { display: none !important; }
          .edit-main-col { width: 100% !important; }
        }
      `}</style>
      <main style={{ background: "var(--bg-page)", minHeight: "100vh" }}>
        <div className="edit-main-wrap" style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1rem 6rem" }}>

          {/* ── Auth loading guard — show spinner while user loads from Supabase ── */}
          {!user && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "1rem" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid #f0f0f0", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>Loading your profile…</p>
            </div>
          )}
          {user && (<>
          {/* ── Back Button ── */}
          <div style={{ marginBottom: "1rem" }}>
            <button
              onClick={handleBack}
              aria-label="Go back"
              style={{
                display: "flex", alignItems: "center", gap: "0.25rem",
                background: "#fff", border: "1px solid #E5D5C5",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                cursor: "pointer", color: "var(--text-primary, #111)",
                padding: "0.25rem 0.375rem", borderRadius: "6px",
                fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 600,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>

          {/* ── Page header ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h1 style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>Edit Profile</h1>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "3px" }}>Update your information to get better matches</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={handlePreview} className="btn btn-ghost" style={{ border: "1.5px solid var(--border-color)", display: "flex", alignItems: "center", gap: "5px" }}>
                <Eye size={14} /> Preview
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "140px", justifyContent: "center" }}>
                {saving ? <><span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> Saving…</> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          </div>

          <div className="edit-layout-row" style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
            {/* ── Sticky Left Nav ── */}
            <aside className="edit-sidebar" style={{
              width: "220px",
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
            }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-light)" }}>
                <ProfileProgress pct={pct} />
              </div>
              <nav>
                {SECTIONS.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.625rem",
                      padding: "0.75rem 1rem", textDecoration: "none",
                      color: "var(--text-dark)", fontSize: "0.8125rem", fontWeight: 500,
                      borderBottom: "1px solid var(--border-light)",
                      transition: "all 0.12s",
                    }}
                    className="edit-nav-item"
                  >
                    <span style={{ color: "var(--primary)", flexShrink: 0 }}>{s.icon}</span>
                    {s.label}
                  </a>
                ))}
              </nav>
            </aside>

            {/* ── Main Form ── */}
            <div className="edit-center-col" style={{ flex: 1, minWidth: 0 }}>

              {/* ─────────────────────────────────────────────────────
                  § 1  PROFILE PHOTO
              ───────────────────────────────────────────────────── */}
              <SectionCard id="photo" title="Photos & Gallery" icon={<Camera size={16} />}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
                    {gallery.sort((a, b) => a.sortOrder - b.sortOrder).map(photo => (
                      <div key={photo.id} style={{ position: "relative", borderRadius: "var(--radius-xl)", overflow: "hidden", border: photo.isPrimary ? "2px solid var(--primary)" : "1px solid var(--border-color)", aspectRatio: "3/4" }}>
                        <img src={photo.url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {photo.isPrimary && (
                          <div style={{ position: "absolute", top: "8px", left: "8px", background: "var(--primary)", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "0.7rem", fontWeight: 600 }}>Primary</div>
                        )}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "8px", display: "flex", justifyContent: "space-around", backdropFilter: "blur(4px)" }}>
                          {!photo.isPrimary && (
                            <button onClick={(e) => { e.preventDefault(); handleSetPrimary(photo.id, photo.url); }} style={{ color: "white", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Check size={14} /> Set Primary
                            </button>
                          )}
                          <button onClick={(e) => { e.preventDefault(); handleDeletePhoto(photo.id); }} style={{ color: "#ffcdd2", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {gallery.length < 8 && (
                      <div onClick={() => !uploadingGallery && document.getElementById('gallery-upload')?.click()} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-xl)", border: "2px dashed var(--border-color)", aspectRatio: "3/4", cursor: uploadingGallery ? "not-allowed" : "pointer", background: "#f9f9f9", gap: "0.5rem", color: "var(--text-medium)" }}>
                        {uploadingGallery ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span> : <Plus size={24} />}
                        <span style={{ fontSize: "0.8rem", fontWeight: 500 }}>{uploadingGallery ? "Uploading..." : "Add Photo"}</span>
                        <span style={{ fontSize: "0.7rem" }}>{8 - gallery.length} remaining</span>
                      </div>
                    )}
                  </div>
                  <input id="gallery-upload" type="file" accept="image/*" onChange={handleGalleryUpload} style={{ display: "none" }} />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, background: "#f5f5f5", padding: "0.75rem", borderRadius: "var(--radius-md)" }}>
                    <strong>Guidelines:</strong> JPG, PNG or WEBP · Max 5 MB per photo · Minimum 300×300 pixels.<br />
                    You can add up to 8 photos. <strong>Profiles with more photos get 8x more views.</strong>
                  </div>
                </div>
              </SectionCard>

              {/* ─────────────────────────────────────────────────────
                  § 2  BASIC INFORMATION
              ───────────────────────────────────────────────────── */}
              <SectionCard id="basic" title="Basic Information" icon={<User size={16} />}>
                <FieldGrid>
                  <FormField label="First Name" required>
                    <FormInput value={firstName} onChange={setFirstName} placeholder="Enter first name" />
                  </FormField>
                  <FormField label="Last Name">
                    <FormInput value={lastName} onChange={setLastName} placeholder="Enter last name" />
                  </FormField>
                  <FormField label="Gender" required hint="Set during registration, cannot be changed">
                    <input
                      value={gender === "male" ? "Male" : gender === "female" ? "Female" : ""}
                      disabled
                      readOnly
                      className="form-input"
                      style={{ fontSize: "0.875rem", background: "#f5f5f5", color: "#888", cursor: "not-allowed" }}
                    />
                  </FormField>
                  <FormField label="Date of Birth" required hint="Set during registration, cannot be changed">
                    <FormInput type="date" value={dob} onChange={() => {}} disabled />
                  </FormField>
                  <FormField label="Height" hint="Used for partner matching">
                    <SearchableSelect label="Height" hideLabel value={height} onChange={setHeight} options={HEIGHT_OPTS} placeholder="Select height" />
                  </FormField>
                  <FormField label="Weight (kg)">
                    <FormInput value={weight} onChange={setWeight} placeholder="e.g. 65" type="number" />
                  </FormField>
                  <FormField label="Marital Status" required>
                    <SearchableSelect label="Marital Status" hideLabel value={maritalStatus} onChange={setMaritalStatus} options={MARITAL_STATUS.map(m => m.label)} placeholder="Select status" />
                  </FormField>
                  <FormField label="Mother Tongue" required>
                    <SearchableSelect label="Mother Tongue" hideLabel value={motherTongue} onChange={setMotherTongue} options={MOTHER_TONGUES} placeholder="Select language" />
                  </FormField>
                  <FormField label="Body Type">
                    <FormSelect value={bodyType} onChange={setBodyType} options={["Slim", "Athletic", "Average", "Heavy"]} placeholder="Select body type" />
                  </FormField>
                  <FormField label="Physical Status">
                    <FormSelect value={physicalStatus} onChange={setPhysicalStatus} options={["Normal", "Physically Challenged"]} placeholder="Select" />
                  </FormField>
                </FieldGrid>
              </SectionCard>

              {/* ─────────────────────────────────────────────────────
                  § 3  RELIGIOUS INFORMATION
              ───────────────────────────────────────────────────── */}
              <SectionCard id="religion" title="Religious Information" icon={<span style={{ fontSize: 14 }}>🕉️</span>}>
                <FieldGrid>
                  <FormField label="Religion">
                    <div
                      style={{
                        border: "1.5px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.625rem 0.875rem",
                        background: "#F5F5F5",
                        fontSize: "0.9375rem",
                        color: "var(--text-dark)",
                        fontWeight: 600,
                      }}
                    >
                      {religion || "—"}
                    </div>
                  </FormField>
                  <FormField label="Caste / Community">
                    <div>
                      <div
                        style={{
                          border: "1.5px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          padding: "0.625rem 0.875rem",
                          background: "#F5F5F5",
                          fontSize: "0.9375rem",
                          color: "var(--text-dark)",
                          fontWeight: 600,
                        }}
                      >
                        {caste || "—"}
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "4px" }}>
                        🔒 Caste details cannot be changed after registration. Contact{" "}
                        <a href="mailto:support@elitetamilmatrimony.com" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>support</a>{" "}
                        if you need to update them.
                      </p>
                    </div>
                  </FormField>
                  <FormField label="Sub Caste" hint="Optional">
                    <div
                      style={{
                        border: "1.5px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.625rem 0.875rem",
                        background: "#F5F5F5",
                        fontSize: "0.9375rem",
                        color: "var(--text-dark)",
                        fontWeight: 600,
                      }}
                    >
                      {subCaste || "—"}
                    </div>
                  </FormField>
                  <FormField label="Gothram">
                    <FormInput value={gothram} onChange={setGothram} placeholder="Enter gothram (optional)" />
                  </FormField>
                  <FormField label="Star (Natchathiram)" required>
                    <SearchableSelect label="Star" hideLabel value={star} onChange={setStar} options={STARS} placeholder="Select star" />
                  </FormField>
                  <FormField label="Raasi" required>
                    <SearchableSelect label="Raasi" hideLabel value={rasi} onChange={setRasi} options={RAASI_LIST} placeholder="Select raasi" />
                  </FormField>
                  <FormField label="Dhosham" required>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                      {DHOSHAM_OPTIONS.map((d) => {
                        const selected = dhosham ? dhosham.split(', ').includes(d.value) : false;
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => {
                              const arr = dhosham ? dhosham.split(', ') : [];
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
                              setDhosham(newArr.join(', '));
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
                  </FormField>
                  <FormField label="Time of Birth" hint="Used for jathagam matching">
                    <FormInput type="time" value={timeOfBirth} onChange={setTimeOfBirth} placeholder="e.g. 10:30" />
                  </FormField>
                  <FormField label="Upload Horoscope" hint="PDF or JPG of your jathagam">
                    <button
                      type="button"
                      onClick={() => toast("Horoscope upload coming soon")}
                      style={{ width: "100%", background: "#fafafa", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.75rem", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: "0.8125rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Upload size={14} /> Upload Horoscope (PDF/JPG)
                    </button>
                  </FormField>
                </FieldGrid>
              </SectionCard>

              {/* ─────────────────────────────────────────────────────
                  § 4  PROFESSIONAL DETAILS
              ───────────────────────────────────────────────────── */}
              <SectionCard id="professional" title="Professional Details" icon={<Briefcase size={16} />}>
                <FieldGrid>
                  <FormField label="Highest Education" required>
                    <SearchableSelect label="Education" hideLabel value={education} onChange={setEducation} options={EDUCATION_LEVELS} placeholder="Select qualification" />
                  </FormField>
                  <FormField label="College / University">
                    <FormInput value={college} onChange={setCollege} placeholder="e.g. IIT Madras" />
                  </FormField>
                  <FormField label="Occupation" required>
                    <SearchableSelect
                      label="Occupation"
                      hideLabel
                      value={occupation}
                      onChange={setOccupation}
                      options={(OCCUPATIONS as (string | { value: string; label: string })[]).map(o => typeof o === "string" ? o : o.label)}
                      placeholder="Search occupation..."
                    />
                  </FormField>
                  <FormField label="Company / Organisation">
                    <FormInput value={company} onChange={setCompany} placeholder="e.g. Infosys" />
                  </FormField>
                  <FormField label="Employment Type">
                    <FormSelect value={employmentType} onChange={setEmploymentType} options={["Private Sector", "Government / PSU", "Self Employed", "Business Owner", "Defence / Civil Services", "Not Working"]} placeholder="Select type" />
                  </FormField>
                  <FormField label="Annual Income">
                    <SearchableSelect label="Annual Income" hideLabel value={income} onChange={setIncome} options={INCOME_RANGES} placeholder="Select income range" />
                  </FormField>
                </FieldGrid>
              </SectionCard>

              {/* ─────────────────────────────────────────────────────
                  § 5  FAMILY DETAILS
              ───────────────────────────────────────────────────── */}
              <SectionCard id="family" title="Family Details" icon={<Users size={16} />}>
                <FieldGrid>
                  <FormField label="Father's Occupation">
                    <FormSelect value={fatherOcc} onChange={setFatherOcc} options={["Business", "Government Employee", "Private Employee", "Retired", "Farmer", "Other", "Late"]} placeholder="Select" />
                  </FormField>
                  <FormField label="Mother's Occupation">
                    <FormSelect value={motherOcc} onChange={setMotherOcc} options={["Homemaker", "Business", "Government Employee", "Private Employee", "Retired", "Other", "Late"]} placeholder="Select" />
                  </FormField>
                  <FormField label="Family Status">
                    <FormSelect value={familyStatus} onChange={setFamilyStatus} options={["Rich / Affluent", "Upper Middle Class", "Middle Class", "Lower Middle Class"]} placeholder="Select" />
                  </FormField>
                  <FormField label="Family Type">
                    <FormSelect value={familyType} onChange={setFamilyType} options={["Joint Family", "Nuclear Family"]} placeholder="Select" />
                  </FormField>
                  <FormField label="Number of Brothers">
                    <FormSelect value={brothers} onChange={setBrothers} options={Array.from({ length: 6 }, (_, i) => String(i))} />
                  </FormField>
                  <FormField label="Number of Sisters">
                    <FormSelect value={sisters} onChange={setSisters} options={Array.from({ length: 6 }, (_, i) => String(i))} />
                  </FormField>
                </FieldGrid>
              </SectionCard>

              {/* ─────────────────────────────────────────────────────
                  § 6  LIFESTYLE
              ───────────────────────────────────────────────────── */}
              <SectionCard id="lifestyle" title="Lifestyle" icon={<Leaf size={16} />}>
                <FieldGrid>
                  <FormField label="Food Preference">
                    <FormSelect value={diet} onChange={setDiet} options={EATING_HABITS} placeholder="Select" />
                  </FormField>
                  <FormField label="Smoking Habits">
                    <FormSelect value={smoking} onChange={setSmoking} options={SMOKING_OPTIONS} placeholder="Select" />
                  </FormField>
                  <FormField label="Drinking Habits">
                    <FormSelect value={drinking} onChange={setDrinking} options={DRINKING_OPTIONS} placeholder="Select" />
                  </FormField>
                  <FormField label="Disabilities / Special Needs">
                    <FormSelect value={disabilities} onChange={setDisabilities} options={["None", "Physically Challenged", "Visually Impaired", "Hearing Impaired", "Other"]} />
                  </FormField>
                </FieldGrid>

                <div style={{ marginTop: "1.25rem" }}>
                  <FormField label="Languages Known">
                    <MultiSelectTags label="languages" options={LANG_LIST} values={languages} onChange={setLanguages} placeholder="Search or add languages..." />
                  </FormField>
                </div>

                <div style={{ marginTop: "1.25rem" }}>
                  <FormField label="Hobbies">
                    <MultiSelectTags label="hobbies" options={HOBBIES_LIST} values={hobbies} onChange={setHobbies} placeholder="Search or add hobbies..." />
                  </FormField>
                </div>

                <div style={{ marginTop: "1.25rem" }}>
                  <FormField label="Interests">
                    <MultiSelectTags label="interests" options={INTERESTS_LIST} values={interests} onChange={setInterests} placeholder="Search or add interests..." />
                  </FormField>
                </div>
              </SectionCard>

              {/* ─────────────────────────────────────────────────────
                  § 7  LOCATION
              ───────────────────────────────────────────────────── */}
              <SectionCard id="location" title="Location" icon={<MapPin size={16} />}>
                <FieldGrid>
                  <FormField label="Country" required>
                    <SearchableSelect label="Country" hideLabel value={country} onChange={setCountry} options={COUNTRIES} placeholder="Search country..." />
                  </FormField>
                  <FormField label="State">
                    <SearchableSelect label="State" hideLabel value={state} onChange={setState} options={INDIAN_STATES} placeholder="Search state..." />
                  </FormField>
                  <FormField label="City" required>
                    <SearchableSelect
                      label="City"
                      hideLabel
                      value={city}
                      onChange={v => {
                        setCity(v);
                        const match = citiesData.find(c => c.city === v);
                        if (match && match.state && !state) setState(match.state);
                      }}
                      options={ALL_CITIES}
                      placeholder="Search city..."
                    />
                  </FormField>
                  <FormField label="Native Place">
                    <SearchableSelect label="Native Place" hideLabel value={nativePlace} onChange={setNativePlace} options={ALL_CITIES} placeholder="Search native place..." />
                  </FormField>
                  <FullWidth>
                    <FormField label="Current Address">
                      <textarea
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="Enter your current address (optional)"
                        rows={2}
                        style={{ width: "100%", border: "1.5px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.625rem 0.875rem", fontFamily: "var(--font-sans)", fontSize: "0.875rem", color: "var(--text-dark)", resize: "vertical", outline: "none", lineHeight: 1.5 }}
                        onFocus={e => e.target.style.borderColor = "var(--primary)"}
                        onBlur={e => e.target.style.borderColor = "var(--border-color)"}
                      />
                    </FormField>
                  </FullWidth>
                </FieldGrid>
              </SectionCard>

              {/* ─────────────────────────────────────────────────────
                  § 8  ABOUT ME
              ───────────────────────────────────────────────────── */}
              <SectionCard id="about" title="About Me" icon={<FileText size={16} />}>
                <FormField label="Write about yourself" hint="Tell prospects about your values, family and what you're looking for">
                  <div style={{ position: "relative" }}>
                    <textarea
                      value={about}
                      onChange={e => setAbout(e.target.value.slice(0, 500))}
                      placeholder="Share a little about yourself — your personality, family values, career goals and what you are looking for in a life partner…"
                      rows={6}
                      style={{ width: "100%", border: "1.5px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.875rem 1rem", fontFamily: "var(--font-sans)", fontSize: "0.875rem", color: "var(--text-dark)", resize: "vertical", outline: "none", lineHeight: 1.65 }}
                      onFocus={e => e.target.style.borderColor = "var(--primary)"}
                      onBlur={e => e.target.style.borderColor = "var(--border-color)"}
                    />
                    <div style={{ textAlign: "right", fontSize: "0.75rem", color: about.length > 450 ? "var(--primary)" : "#aaa", marginTop: "4px" }}>
                      {about.length} / 500 characters
                    </div>
                  </div>
                </FormField>
              </SectionCard>

              {/* ─────────────────────────────────────────────────────
                  § 9  PARTNER PREFERENCES
              ───────────────────────────────────────────────────── */}
              <SectionCard id="partner" title="Partner Preferences" icon={<Heart size={16} />}>
                <div style={{ background: "var(--primary-light)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                  <Info size={14} style={{ color: "var(--primary)", flexShrink: 0, marginTop: "2px" }} />
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Your partner preferences help us show you more relevant matches. Be as specific or broad as you like.
                  </p>
                </div>

                <FieldGrid>
                  {/* Partner Gender */}
                  <FormField label="Gender">
                    <SearchableSelect
                      label="Gender"
                      hideLabel
                      value={pGender}
                      onChange={setPGender}
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "any", label: "Any" },
                      ]}
                      placeholder="Select gender"
                    />
                  </FormField>

                  {/* Age Range */}
                  <FormField label="Age Range">
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                      <FormSelect
                        value={pAgeMin}
                        onChange={setPAgeMin}
                        options={AGE_OPTS.filter(o => !pAgeMax || parseInt(o.value) <= parseInt(pAgeMax))}
                        placeholder="Doesn't matter"
                      />
                      <span style={{ color: "#aaa", fontSize: "0.8125rem", flexShrink: 0 }}>to</span>
                      <FormSelect
                        value={pAgeMax}
                        onChange={setPAgeMax}
                        options={AGE_OPTS.filter(o => !pAgeMin || parseInt(o.value) >= parseInt(pAgeMin))}
                        placeholder="Doesn't matter"
                      />
                    </div>
                  </FormField>

                  {/* Height Range */}
                  <FormField label="Height Range">
                    <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                      <FormSelect
                        value={pHeightMin}
                        onChange={setPHeightMin}
                        options={PREF_HEIGHT_OPTS}
                        placeholder="Doesn't matter"
                      />
                      <span style={{ color: "#aaa", fontSize: "0.8125rem", flexShrink: 0 }}>to</span>
                      <FormSelect
                        value={pHeightMax}
                        onChange={setPHeightMax}
                        options={PREF_HEIGHT_OPTS}
                        placeholder="Doesn't matter"
                      />
                    </div>
                  </FormField>

                  <FormField label="Religion">
                    <SearchableSelect label="Religion" hideLabel value={pReligion} onChange={setPReligion} options={RELIGIONS} placeholder="Any religion" />
                  </FormField>

                  {(pReligion && pReligion !== "No Religion" && pReligion !== "Any" && pReligion !== "Not Preferred" && pReligion !== "Spiritual - Not Religious") && (
                    <FormField label="Caste">
                      <FormInput value={pCaste} onChange={setPCaste} placeholder="Any / specific caste" />
                    </FormField>
                  )}

                  <FormField label="Education">
                    <SearchableSelect label="Education" hideLabel value={pEducation} onChange={setPEducation} options={EDUCATION_LEVELS} placeholder="Any" />
                  </FormField>

                  <FormField label="Occupation">
                    <SearchableSelect label="Occupation" hideLabel value={pOccupation} onChange={setPOccupation} options={OCCUPATIONS} placeholder="Any" />
                  </FormField>

                  <FormField label="Annual Income">
                    <SearchableSelect label="Income" hideLabel value={pIncome} onChange={setPIncome} options={INCOME_RANGES} placeholder="Any" />
                  </FormField>

                  <FormField label="Country">
                    <SearchableSelect label="Country" hideLabel value={pCountry} onChange={setPCountry} options={COUNTRIES} placeholder="Select country" />
                  </FormField>
                </FieldGrid>

                <div style={{ marginTop: "1.25rem" }}>
                  <FormField label="Mother Tongue">
                    <MultiSelectTags label="partner-languages" options={LANG_LIST} values={pMotherTongue} onChange={setPMotherTongue} placeholder="Select languages..." />
                  </FormField>
                </div>

                <div style={{ marginTop: "1.25rem" }}>
                  <FormField label="Marital Status">
                    <MultiSelectTags
                      label="partner-marital"
                      options={MARITAL_STATUS.map(m => m.label)}
                      values={pMaritalStatus}
                      onChange={setPMaritalStatus}
                      placeholder="Select marital status..."
                    />
                  </FormField>
                </div>
              </SectionCard>

            </div>
          </div>
          </>)}
        </div>
      </main>

      {/* Discard Modal */}
      {showDiscardModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "var(--radius-lg)", maxWidth: "400px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Discard Changes?</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>You have unsaved changes in your profile. Do you want to discard them and leave?</p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setShowDiscardModal(false)} className="btn btn-ghost flex-1 justify-center border border-gray-300">Keep Editing</button>
              <button onClick={() => { setShowDiscardModal(false); if (pendingNav) pendingNav(); }} className="btn flex-1 justify-center text-white" style={{ background: "#EF4444" }}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: "2rem", borderRadius: "var(--radius-lg)", maxWidth: "400px", width: "90%", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Saved Successfully</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Your profile information has been updated.</p>
            <button onClick={() => { setShowSuccessModal(false); router.back(); }} className="btn btn-primary w-full justify-center">Continue</button>
          </div>
        </div>
      )}

      {/* ── Sticky bottom save bar ── */}
      <div
        className="edit-save-bar"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", borderTop: "1px solid var(--border-color)",
          padding: "0.875rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          zIndex: 50, boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
        }}
      >
        <div className="save-bar-progress" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Profile completion: <strong style={{ color: "var(--primary)" }}>{pct}%</strong>
          </div>
          <div style={{ width: "100px", height: "5px", background: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "var(--gradient-hero)", borderRadius: "3px", transition: "width 0.4s" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/matches" className="btn btn-ghost hide-mobile" style={{ border: "1.5px solid var(--border-color)", whiteSpace: "nowrap" }}>
            Cancel
          </Link>
          <Link href={user ? `/profile/${user.id}` : "/matches"} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
            <Eye size={13} /> <span className="hide-mobile-text">Preview</span>
          </Link>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary save-btn" style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", whiteSpace: "nowrap" }}>
            {saving ? "Saving…" : <><Save size={14} /> Save</>}
          </button>
        </div>
      </div>

      <style>{`
        .edit-grid-2 { grid-template-columns: repeat(2, 1fr); }
        @media (max-width: 640px) {
          .edit-grid-2 { grid-template-columns: 1fr !important; }
          aside { display: none; }
          .hide-mobile { display: none !important; }
          .hide-mobile-text { display: none !important; }
          .save-bar-progress { display: none !important; }
          .edit-save-bar { padding: 0.75rem 1rem !important; justify-content: flex-end !important; }
          .save-btn { min-width: auto !important; flex: 1; }
        }
        .edit-nav-item:hover { background: var(--primary-light); color: var(--primary); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <CompactFooter />
    </>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-page)" }} />}>
      <EditProfileContent />
    </Suspense>
  );
}
