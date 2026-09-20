"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Crown, Lock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import toast from "react-hot-toast";
import Link from "next/link";
import { HEIGHTS } from "@/data/matrimony-data";
import {
  fetchMatchProfiles,
  shortlistProfileWithNotification,
  sendInterestWithNotification,
  getShortlistedProfiles,
  getShortlistedMe,
  getViewedByMe,
  getViewedMe,
  getNewlyJoined,
  getNearbyMatches,
  getWithPhotos,
  getWithHoroscope,
  getSimilarHobbies,
  getMutualMatches,
  getLookingForMe,
  getByEducationPref,
  getByProfessionPref,
  getByLocationPref,
  getNRIMatches,
  getStarMatches,
  getHoroscopeMatches,
  getInterestsSent,
  type RegisteredUser,
} from "@/lib/auth-store";
import DailyMatchesCarousel from "@/components/matches/DailyMatchesCarousel";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// ── Sidebar section definitions (matching screenshot exactly) ─────────────────
const SIDEBAR = [
  {
    group: null,
    items: [
      {
        id: "daily_matches",
        label: "Daily Matches",
        sub: "Your curated recommendations for today",
      },
      {
        id: "your_matches",
        label: "Your Matches",
        sub: "View all the profiles that match\nyour preferences",
      },
    ],
  },
  {
    group: "BASED ON ACTIVITY",
    items: [
      { id: "shortlisted_by_you", label: "Shortlisted by you", sub: "Matches you have shortlisted" },
      { id: "viewed_you", label: "Viewed you", sub: "Matches who have viewed your\nprofile" },
      { id: "shortlisted_you", label: "Shortlisted you", sub: "Matches who have shortlisted your\nprofile" },
      { id: "viewed_by_you", label: "Viewed by you", sub: "Matches you have viewed" },
    ],
  },
  {
    group: "RECENTLY JOINED & NEARBY\nMATCHES",
    items: [
      { id: "newly_joined", label: "Newly Joined", sub: "Matches who joined within the last\n30 days" },
      { id: "nearby_matches", label: "Nearby matches", sub: "Matches near your location" },
    ],
  },
  {
    group: "BASED ON PROFILE DETAILS",
    items: [
      { id: "with_photos", label: "Matches with photos", sub: "Profiles with a photo" },
      { id: "with_horoscope", label: "Matches with horoscope", sub: "Profiles with horoscope details" },
      { id: "similar_hobbies", label: "Similar hobbies", sub: "Profiles who share your hobbies" },
    ],
  },
  {
    group: "BASED ON ASTROLOGICAL\nCOMPATIBILITY",
    items: [
      { id: "star_matches", label: "Star matches", sub: "Profiles with compatible star sign" },
      { id: "horoscope_matches", label: "Horoscope matches", sub: "Profiles with matching horoscope" },
    ],
  },
  {
    group: "MEMBERS LOOKING FOR\nSOMEONE LIKE YOU",
    items: [
      { id: "mutual_matches", label: "Mutual matches", sub: "Profiles matching your preferences,\nand vice versa" },
      { id: "looking_for_you", label: "Looking for you", sub: "Profiles whose preferences match you" },
    ],
  },
  {
    group: "MATCHES BASED ON\nPREFERENCES",
    items: [
      { id: "partner_preference", label: "Partner preference", sub: "Profiles matching your taste" },
      { id: "education_pref", label: "Education preference", sub: "Profiles matching your preferred\neducation" },
      { id: "professional_pref", label: "Professional preference", sub: "Profiles matching your preferred\nprofession" },
      { id: "location_pref", label: "City/location preference", sub: "Profiles in your preferred city or\nstate" },
      { id: "nri_matches", label: "NRI matches", sub: "Profiles from outside India" },
    ],
  },
  {
    group: null,
    items: [
      { id: "hidden_profiles", label: "Hidden Profiles", sub: "Profiles you have hidden" },
    ],
  },
];

// ── Sidebar SVG icon map ──────────────────────────────────────────────────────
const SidebarIcon = ({ id, active }: { id: string; active: boolean }) => {
  const color = active ? "#6B1A2A" : id === "hidden_profiles" ? "#888" : "#aaa";
  const icons: Record<string, React.ReactElement> = {
    daily_matches: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    your_matches: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    partner_preference: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    shortlisted_by_you: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    viewed_you: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    shortlisted_you: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    viewed_by_you: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    newly_joined: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
    nearby_matches: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    with_photos: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    with_horoscope: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    similar_hobbies: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
    star_matches: <svg width="13" height="13" viewBox="0 0 24 24" fill={active ? color : "none"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    horoscope_matches: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    mutual_matches: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
    looking_for_you: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    education_pref: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
    professional_pref: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
    location_pref: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    nri_matches: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    hidden_profiles: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  };
  return icons[id] ?? null;
};

// ── Pagination component ──────────────────────────────────────────────────────
const PAGE_SIZE = 10;
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void; }) {
  if (totalPages <= 1) return (
    <div style={{ textAlign: "center", padding: "0.75rem 0" }}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "6px", background: "#6B1A2A", color: "#fff", fontSize: "0.8125rem", fontWeight: 700 }}>1</span>
    </div>
  );
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  if (end - start < 4) { if (start === 1) end = Math.min(totalPages, 5); else start = Math.max(1, end - 4); }
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const btn = (active: boolean, disabled?: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "0 10px", height: "32px", minWidth: "32px", borderRadius: "6px",
    border: active ? "none" : "1.5px solid #ddd",
    background: active ? "#6B1A2A" : disabled ? "#f5f5f5" : "#fff",
    color: active ? "#fff" : disabled ? "#ccc" : "#333",
    fontSize: "0.8125rem", fontWeight: active ? 700 : 500,
    cursor: disabled ? "default" : "pointer", fontFamily: "var(--font-sans)",
  });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", padding: "1rem 0" }}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={btn(false, currentPage === 1)}>← Prev</button>
      {start > 1 && <><button onClick={() => onPageChange(1)} style={btn(false)}>1</button>{start > 2 && <span style={{ color: "#aaa", padding: "0 4px" }}>…</span>}</>}
      {pages.map(p => <button key={p} onClick={() => onPageChange(p)} style={btn(p === currentPage)}>{p}</button>)}
      {end < totalPages && <>{end < totalPages - 1 && <span style={{ color: "#aaa", padding: "0 4px" }}>…</span>}<button onClick={() => onPageChange(totalPages)} style={btn(false)}>{totalPages}</button></>}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={btn(false, currentPage === totalPages)}>Next →</button>
    </div>
  );
}

// ── WhatsApp + Phone SVG icons ────────────────────────────────────────────────
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#E8401A" opacity="0.12" />
    <path d="M16.5 13.9c-.3-.15-1.75-.87-2.02-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.48-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" fill="#E8401A" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#25D366" opacity="0.12" />
    <path d="M17.47 6.53A7.26 7.26 0 0 0 12 4.27a7.3 7.3 0 0 0-6.3 10.95L4.27 19.73l4.6-1.21A7.3 7.3 0 0 0 19.73 12a7.24 7.24 0 0 0-2.26-5.47zm-5.47 11.2a6.06 6.06 0 0 1-3.09-.85l-.22-.13-2.28.6.61-2.23-.14-.23a6.08 6.08 0 1 1 5.12 2.84zm3.34-4.55c-.18-.09-1.08-.53-1.24-.59-.17-.06-.29-.09-.41.09-.12.18-.47.59-.58.71-.1.12-.21.14-.4.05-.18-.09-.77-.28-1.47-.91-.54-.48-.91-1.08-1.01-1.26-.11-.18-.01-.28.08-.37.08-.08.18-.21.27-.32.09-.1.12-.18.18-.3.06-.12.03-.23-.01-.32-.05-.09-.41-.99-.56-1.35-.15-.36-.3-.31-.41-.31h-.35c-.12 0-.32.05-.49.23-.17.18-.64.63-.64 1.52 0 .9.66 1.77.75 1.89.09.12 1.29 1.97 3.13 2.76.44.19.78.3 1.04.38.44.14.84.12 1.15.07.35-.05 1.08-.44 1.23-.87.15-.43.15-.79.1-.87-.05-.08-.17-.12-.35-.21z" fill="#25D366" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "#C8973A" : "none"} stroke={filled ? "#C8973A" : "white"} strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#6B1A2A" />
    <polyline points="7 12 10 15 17 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Single Profile Card (matching screenshot layout exactly) ──────────────────
function ProfileCard({
  profile,
  index,
  onShortlist,
  onHide,
  onSendInterest,
  shortlisted,
  interestSent = false,
  canMessage = false,
  canViewContact = false,
}: {
  profile: RegisteredUser;
  index: number;
  onShortlist: () => void;
  onHide: () => void;
  onSendInterest: () => void;
  shortlisted?: boolean;
  interestSent?: boolean;
  canMessage?: boolean;
  canViewContact?: boolean;
}) {
  // Calculate age using a stable approach or suppress hydration warning
  // Using a stable server-rendered date or simply calculating it
  const age = profile.dob
    ? Math.floor((new Date().getTime() - new Date(profile.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  const photo = profile.photoUrl || null;

  const profileCode = `ETM-${profile.id.substring(0, 8).toUpperCase()}`;
  const location = [profile.city, profile.state].filter(Boolean).join(", ") || profile.country || "India";

  // Build attribute string (includes marital status, dhosham, diet, income)
  const attrs: string[] = [
    age > 0 ? `${age} yrs` : "",
    profile.height || "",
    profile.maritalStatus || "",
    profile.caste || "",
    profile.education || "",
    profile.occupation || "",
    profile.income ? `₹ ${profile.income}` : "",
    profile.diet || "",
    profile.dhosham ? `Dhosham: ${profile.dhosham}` : "",
    location,
  ].filter(Boolean);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: "8px",
        overflow: "visible",
        marginBottom: "14px",
        position: "relative",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
      className="match-card-grid"
    >
      {/* LEFT — Photo column */}
      <div style={{ gridArea: "photo", width: "100%", position: "relative" }} className="match-card-photo-wrap">
        <Link href={`/profile/${profile.id}`} style={{ display: "block", lineHeight: 0, height: "100%" }}>
          {photo ? (
            <img
              src={photo}
              alt={profile.name}
              className="match-card-photo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
                display: "block",
                maxHeight: "340px",
              }}
            />
          ) : (
            <div
              className="match-card-photo"
              style={{
                width: "100%",
                height: "100%",
                minHeight: "220px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--primary-light)",
                borderRight: "1px solid #e8e8e8",
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.2" opacity="0.5">
                <circle cx="12" cy="7" r="5" />
                <path d="M4 21c0-4.5 3.6-8 8-8s8 3.5 8 8" />
              </svg>
            </div>
          )}
        </Link>

        {/* Shortlist badge — top left */}
        {shortlisted ? (
          /* Static gold badge when already shortlisted */
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(200,151,58,0.90)",
              border: "none",
              borderRadius: "3px",
              padding: "3px 7px",
              color: "#fff",
              fontSize: "0.6875rem",
              fontWeight: 700,
            }}
          >
            <BookmarkIcon filled />
            Shortlisted
          </div>
        ) : (
          /* Click to shortlist when not yet saved */
          <button
            onClick={onShortlist}
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(0,0,0,0.62)",
              border: "none",
              borderRadius: "3px",
              padding: "3px 7px",
              color: "#fff",
              fontSize: "0.6875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <BookmarkIcon filled={false} />
            Shortlist
          </button>
        )}

        {/* Photo count badge — bottom right, only when photos exist */}
        {(() => {
          const photoCount = profile.photos?.length || (profile.photoUrl ? 1 : 0);
          if (photoCount === 0) return null;
          return (
            <div
              style={{
                position: "absolute",
                bottom: "6px",
                right: "6px",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: "0.625rem",
                fontWeight: 700,
                borderRadius: "3px",
                padding: "1px 5px",
              }}
            >
              {photoCount > 1 ? `1/${photoCount}` : "1/1"}
            </div>
          );
        })()}
      </div>

      {/* RIGHT — Info column */}
      <div
        style={{
          gridArea: "info",
          padding: "1rem 1.125rem 0.5rem 1.125rem",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
        className="match-card-info-wrap"
      >
        {/* Top row: Verified + name / phone+whatsapp */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "2px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Verified badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "2px",
              }}
            >
              <VerifiedIcon />
              <span style={{ fontSize: "0.75rem", color: "#1565C0", fontWeight: 600 }}>
                Verified
              </span>
              {/* Match score badge */}
              {profile.compatibilityScore !== undefined && (
                <span
                  style={{
                    marginLeft: "6px",
                    padding: "1px 7px",
                    borderRadius: "10px",
                    fontSize: "0.6875rem",
                    fontWeight: 800,
                    background:
                      profile.compatibilityScore >= 70 ? "#E8F5E9" :
                        profile.compatibilityScore >= 50 ? "#FBF6EC" : "#F5F5F5",
                    color:
                      profile.compatibilityScore >= 70 ? "#2E7D32" :
                        profile.compatibilityScore >= 50 ? "#C8973A" : "#888",
                    border:
                      profile.compatibilityScore >= 70 ? "1px solid #A5D6A7" :
                        profile.compatibilityScore >= 50 ? "1px solid #E0C070" : "1px solid #ddd",
                  }}
                >
                  {profile.compatibilityScore}% Match
                </span>
              )}
            </div>

            {/* Name */}
            <Link
              href={`/profile/${profile.id}`}
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "#111",
                textDecoration: "none",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              {profile.name}
            </Link>

            {/* Profile code */}
            <div
              style={{
                fontSize: "0.75rem",
                color: "#888",
                marginTop: "2px",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              {profileCode}
            </div>
          </div>
        </div>

        {/* Attributes line */}
        <p
          suppressHydrationWarning
          style={{
            fontSize: "0.8125rem",
            color: "#444",
            margin: "0.5rem 0 0",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          className="match-card-attrs"
        >
          {attrs.map((a, i) => (
            <span key={i}>
              {a}
              {i < attrs.length - 1 && (
                <span style={{ color: "#bbb", margin: "0 4px" }}>·</span>
              )}
            </span>
          ))}
        </p>

      </div>

      {/* Action buttons row */}
      <div
        style={{
          gridArea: "actions",
          padding: "0.5rem 1.125rem 1rem 1.125rem",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          flexWrap: "wrap",
        }}
        className="match-card-actions"
      >
          {/* Don't Show */}
          <button
            onClick={onHide}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "0.4375rem 0.875rem",
              border: "1.5px solid #ccc",
              borderRadius: "20px",
              background: "#fff",
              color: "#444",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Don&apos;t Show
          </button>

          {/* Shortlist button (bottom row) */}
          {shortlisted ? (
            /* Already shortlisted — single pill button with X inside */
            <button
              onClick={onShortlist}
              title="Remove from shortlist"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.4375rem 0.6rem 0.4375rem 0.875rem",
                border: "1.5px solid #C8973A",
                borderRadius: "20px",
                background: "#FBF6EC",
                color: "#C8973A",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#C8973A" stroke="#C8973A" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              Saved
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "16px", height: "16px", borderRadius: "50%",
                background: "rgba(200,151,58,0.18)", marginLeft: "2px",
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#C8973A" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            </button>
          ) : (
            <button
              onClick={onShortlist}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.4375rem 0.875rem",
                border: "1.5px solid #ccc",
                borderRadius: "20px",
                background: "#fff",
                color: "#444",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              Shortlist
            </button>
          )}

          {/* Send Interest — dark maroon / Interest Sent state */}
          {interestSent ? (
            /* Interest already sent — single pill button with X inside */
            <button
              onClick={onSendInterest}
              title="Withdraw interest"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.4375rem 0.6rem 0.4375rem 1.125rem",
                border: "1.5px solid #6B1A2A",
                borderRadius: "20px",
                background: "#FEF0F0",
                color: "#6B1A2A",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#6B1A2A">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              Interest Sent ✓
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "16px", height: "16px", borderRadius: "50%",
                background: "rgba(107,26,42,0.12)", marginLeft: "2px",
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            </button>
          ) : (
            <button
              onClick={onSendInterest}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.4375rem 1.125rem",
                border: "none",
                borderRadius: "20px",
                background: "#6B1A2A",
                color: "#fff",
                fontSize: "0.8125rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s",
              }}
              title="Send Interest"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              Send Interest
            </button>
          )}

          {/* View Contact — Gold+ */}
          {canViewContact ? (
            <Link
              href={`/profile/${profile.id}#section-Contact-Details`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.4375rem 1rem",
                border: "1.5px solid #E8401A",
                borderRadius: "20px",
                background: "#fff",
                color: "#E8401A",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
              }}
            >
              <PhoneIcon />
              Contact
            </Link>
          ) : (
            <Link
              href="/membership"
              title="Upgrade to Gold to view contacts"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.4375rem 1rem",
                border: "1.5px solid #C8973A",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #FFF8ED 0%, #FFF3DC 100%)",
                color: "#6B1A2A",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                textDecoration: "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Lock size={13} style={{ color: "#C8973A", flexShrink: 0, zIndex: 1 }} />
              <span style={{ filter: "blur(3px)", userSelect: "none", zIndex: 0 }}>+91 98XXXXXX</span>
            </Link>
          )}

          {/* Message — always visible, quick action */}
          <Link
            href={`/messages?partnerId=${profile.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "0.4375rem 1rem",
              border: "1.5px solid #1565C0",
              borderRadius: "20px",
              background: "#fff",
              color: "#1565C0",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              textDecoration: "none",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Message
          </Link>

        </div>
    </div>
  );
}

// ── Filter chips (top row, matching screenshot) ───────────────────────────────
const QUICK_CHIPS = ["Newly joined", "Not seen", "Profiles with photo", "Matches with horoscope"];

// ── Skeleton loader card ──────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: "6px",
        display: "flex",
        marginBottom: "10px",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "160px", height: "192px", background: "#f0f0f0", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ flex: 1, padding: "1rem" }}>
        <div style={{ width: "120px", height: "14px", background: "#f0f0f0", borderRadius: "4px", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "200px", height: "20px", background: "#f0f0f0", borderRadius: "4px", marginBottom: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "80%", height: "13px", background: "#f0f0f0", borderRadius: "4px", marginBottom: "12px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "60%", height: "13px", background: "#f0f0f0", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

// ── Main Page (receives auth data as props — hook count is always constant) ────────
function MatchesContent({ user, canMessage, canViewContact, initialTab, isPremium }: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  canMessage: boolean;
  canViewContact: boolean;
  initialTab: string | null;
  isPremium: boolean;
}) {
  const router = useRouter();
  const oppositeGender = user.gender === "male" ? "female" : user.gender === "female" ? "male" : undefined;

  const [activeSection, setActiveSection] = useState("your_matches");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [hiddenProfiles, setHiddenProfiles] = useState<RegisteredUser[]>([]);


  useEffect(() => {
    if (initialTab && initialTab !== activeSection) {
      setActiveSection(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  // Lock body scroll when mobile sidebar is open to prevent background scrolling
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // Keep sessionStorage in sync whenever the user changes section
  useEffect(() => {
    sessionStorage.setItem("matches_section", activeSection);
  }, [activeSection]);
  const [profiles, setProfiles] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [sentInterestIds, setSentInterestIds] = useState<Set<string>>(new Set());
  const [viewedByMeIds, setViewedByMeIds] = useState<Set<string>>(new Set());

  // Modals state
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: "", onConfirm: () => {} });

  // Use server-safe defaults (empty) — sessionStorage values are restored after mount
  const [nameSearch, setNameSearch] = useState("");
  const [starMissing, setStarMissing] = useState(false);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [ageFrom, setAgeFrom] = useState("Any");
  const [ageTo, setAgeTo] = useState("Any");
  const [heightFrom, setHeightFrom] = useState("Any");
  const [heightTo, setHeightTo] = useState("Any");
  const chipRowRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  // Track last user ID to detect account switches
  const lastUserIdRef = useRef<string | null>(null);



  // Persist filter state whenever it changes
  useEffect(() => { sessionStorage.setItem("matches_nameSearch", nameSearch); }, [nameSearch]);
  useEffect(() => { sessionStorage.setItem("matches_chips", JSON.stringify(activeChips)); }, [activeChips]);
  useEffect(() => { sessionStorage.setItem("matches_ageFrom", ageFrom); }, [ageFrom]);
  useEffect(() => { sessionStorage.setItem("matches_ageTo", ageTo); }, [ageTo]);
  useEffect(() => { sessionStorage.setItem("matches_heightFrom", heightFrom); }, [heightFrom]);
  useEffect(() => { sessionStorage.setItem("matches_heightTo", heightTo); }, [heightTo]);

  // Load hidden IDs from localStorage on user change
  useEffect(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`etm_hidden_${user.id}`);
      if (stored) setHiddenIds(new Set(JSON.parse(stored) as string[]));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadSection = useCallback(async (sectionId: string, currentUser: typeof user) => {
    if (!currentUser) return;
    setLoading(true);
    setProfiles([]);
    setStarMissing(false);
    setCurrentPage(1);
    let result: RegisteredUser[] = [];
    try {
      if (sectionId === "daily_matches") {
        setLoading(false);
        return;
      }
      switch (sectionId) {
        case "your_matches": result = await fetchMatchProfiles(currentUser, oppositeGender as "male" | "female" | undefined); break;
        case "partner_preference": 
          result = await fetchMatchProfiles(currentUser, oppositeGender as "male" | "female" | undefined);
          result = result.filter(p => (p.compatibilityScore ?? 0) >= 60);
          break;
        case "shortlisted_by_you": {
          const all = await getShortlistedProfiles(currentUser.id);
          const og = currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null;
          result = og ? all.filter(p => p.gender === og) : all;
          break;
        }
        case "viewed_you": result = await getViewedMe(currentUser.id, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "shortlisted_you": result = await getShortlistedMe(currentUser.id, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "viewed_by_you": result = await getViewedByMe(currentUser.id, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "newly_joined": result = await getNewlyJoined(currentUser.id, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "nearby_matches": result = await getNearbyMatches(currentUser.id, currentUser.state, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "with_photos": result = await getWithPhotos(currentUser.id, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "with_horoscope": result = await getWithHoroscope(currentUser.id, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "similar_hobbies": result = await getSimilarHobbies(currentUser.id, currentUser.hobbies || [], currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "star_matches": {
          if (!currentUser.star) {
            setStarMissing(true);
            setLoading(false);
            return;
          }
          result = await getStarMatches(currentUser.id, currentUser.star, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null);
          break;
        }
        case "horoscope_matches": result = await getHoroscopeMatches(currentUser.id, currentUser.rasi, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "mutual_matches": result = await getMutualMatches(currentUser); break;
        case "looking_for_you": result = await getLookingForMe(currentUser); break;
        case "partner_preference": 
          result = await fetchMatchProfiles(currentUser, oppositeGender as "male" | "female" | undefined);
          result = result.filter(p => (p.compatibilityScore ?? 0) >= 60);
          break;
        case "education_pref": result = await getByEducationPref(currentUser.id, currentUser.partnerEducation, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "professional_pref": result = await getByProfessionPref(currentUser.id, currentUser.partnerOccupation, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "location_pref": result = await getByLocationPref(currentUser.id, currentUser.city, currentUser.state, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "nri_matches": result = await getNRIMatches(currentUser.id, currentUser.gender === "male" ? "female" : currentUser.gender === "female" ? "male" : null); break;
        case "hidden_profiles": result = []; break;
        default: result = await fetchMatchProfiles(currentUser, oppositeGender as "male" | "female" | undefined);
      }
    } catch {
      result = [];
    }
    setProfiles(result.slice(0, 200));
    setLoading(false);
  }, []);

  // Load shortlisted IDs on mount
  useEffect(() => {
    if (!user) return;
    getShortlistedProfiles(user.id).then(profiles => {
      setShortlistedIds(new Set(profiles.map(p => p.id)));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load sent interest IDs on mount
  useEffect(() => {
    if (!user) return;
    getInterestsSent(user.id).then(rows => {
      setSentInterestIds(new Set(rows.map(r => r.receiverId)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load viewed-by-me IDs for "Not seen" filter chip
  useEffect(() => {
    if (!user) return;
    const oppGender = user.gender === "male" ? "female" : user.gender === "female" ? "male" : null;
    getViewedByMe(user.id, oppGender).then(profiles => {
      setViewedByMeIds(new Set(profiles.map(p => p.id)));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Reload data whenever the user changes (account switch) or active section changes
  useEffect(() => {
    if (!user) {
      // User logged out — reset state
      if (lastUserIdRef.current !== null) {
        setProfiles([]);
        setActiveSection("your_matches");
        lastUserIdRef.current = null;
      }
      return;
    }
    // User changed (account switch) or section changed
    lastUserIdRef.current = user.id;
    loadSection(activeSection, user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, user?.id]);

  // Restore scroll position of the right panel when navigating back from a profile or switching sections
  useEffect(() => {
    if (loading) return; // wait until profiles have loaded and rendered
    const saved = sessionStorage.getItem(`matches_scroll_${activeSection}`);
    if (saved) {
      const scrollTop = parseInt(saved, 10);
      // Double RAF: first RAF waits for paint, second waits for layout
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (rightPanelRef.current) {
            rightPanelRef.current.scrollTop = scrollTop;
          }
        });
      });
    } else {
      // If no saved scroll, go to top
       if (rightPanelRef.current) {
          rightPanelRef.current.scrollTop = 0;
       }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activeSection]);

  // For hidden profiles section
  useEffect(() => {
    if (activeSection !== "hidden_profiles" || !user) return;
    if (hiddenIds.size === 0) { setHiddenProfiles([]); return; }
    fetchMatchProfiles(user, oppositeGender as "male" | "female" | undefined)
      .then(all => setHiddenProfiles(all.filter(p => hiddenIds.has(p.id))))
      .catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, user?.id, hiddenIds.size]);



  // Client-side chip filtering + hide + name search + advanced filters
  // Runs even when user is null so hook count never changes
  const allFiltered = profiles.filter((p) => {
    if (!user) return false;
    if (p.id === user.id) return false;
    if (activeSection !== "hidden_profiles" && hiddenIds.has(p.id)) return false;
    if (nameSearch.trim() && !p.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
    if (activeChips?.includes("Profiles with photo") && !p.photoUrl) return false;
    if (activeChips?.includes("Matches with horoscope") && !p.star && !p.rasi) return false;
    if (activeChips?.includes("Not seen") && viewedByMeIds.has(p.id)) return false;
    if (activeChips?.includes("Newly joined")) {
      if (!p.createdAt || Date.now() - new Date(p.createdAt).getTime() > 30 * 24 * 60 * 60 * 1000) return false;
    }

    // Age Filter — compare consistently as numbers
    const ageFilterActive = ageFrom !== "Any" || ageTo !== "Any";
    const age = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    if (ageFilterActive) {
      if (age === null) return false;
      const fromNum = ageFrom !== "Any" ? Number(ageFrom) : null;
      const toNum = ageTo !== "Any" ? Number(ageTo) : null;
      if (fromNum !== null && age < fromNum) return false;
      if (toNum !== null && age > toNum) return false;
    }

    // Height Filter
    if (heightFrom !== "Any" || heightTo !== "Any") {
      const fromIdx = HEIGHTS.findIndex(h => h.label === heightFrom);
      const toIdx = HEIGHTS.findIndex(h => h.label === heightTo);
      const pIdx = HEIGHTS.findIndex(h => h.label === p.height);
      if (pIdx !== -1) {
        if (fromIdx !== -1 && pIdx < fromIdx) return false;
        if (toIdx !== -1 && pIdx > toIdx) return false;
      }
    }

    return true;
  });
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const displayed = allFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Section label for heading
  const sectionLabel = SIDEBAR.flatMap((s) => s.items).find((i) => i.id === activeSection)?.label || "Matches";
  void sectionLabel;


  const toggleChip = (chip: string) => {
    setCurrentPage(1);
    setActiveChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleShortlist = async (profileId: string, name: string) => {
    if (!user) { toast.error("Please login"); return; }
    const isAlreadyShortlisted = shortlistedIds.has(profileId);
    if (isAlreadyShortlisted) {
      setConfirmAction({
        isOpen: true,
        message: `Are you sure you want to remove ${name} from your shortlist?`,
        onConfirm: () => {
          setShortlistedIds((prev) => { const s = new Set(prev); s.delete(profileId); return s; });
          toast("Removed from shortlist");
        }
      });
    } else {
      setShortlistedIds((prev) => new Set([...prev, profileId]));
      await shortlistProfileWithNotification(user.id, profileId, user.name);
      toast.success(`${name} shortlisted!`);
    }
  };

  const handleHide = (profileId: string) => {
    setHiddenIds((prev) => {
      const next = new Set([...prev, profileId]);
      if (user?.id) {
        try { localStorage.setItem(`etm_hidden_${user.id}`, JSON.stringify([...next])); } catch { /* ignore */ }
      }
      return next;
    });
    toast("Profile hidden. View in \"Hidden Profiles\".");
  };

  const handleUnhide = (profileId: string, name: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev); next.delete(profileId);
      if (user?.id) {
        try { localStorage.setItem(`etm_hidden_${user.id}`, JSON.stringify([...next])); } catch { /* ignore */ }
      }
      return next;
    });
    setHiddenProfiles((prev) => prev.filter(p => p.id !== profileId));
    toast(`${name} is now visible again.`);
  };

  const handleSendInterest = async (profileId: string, name: string) => {
    if (!user) { toast.error("Please login"); return; }
    if (sentInterestIds.has(profileId)) {
      setConfirmAction({
        isOpen: true,
        message: `Are you sure you want to withdraw your interest from ${name}?`,
        onConfirm: () => {
          setSentInterestIds((prev) => { const s = new Set(prev); s.delete(profileId); return s; });
          toast(`Interest withdrawn from ${name}`);
        }
      });
      return;
    }
    await sendInterestWithNotification(user.id, profileId, user.name);
    setSentInterestIds(prev => new Set([...prev, profileId]));
    toast.success(`Interest sent to ${name}!`);
  };

  // —————————————————————————————————————————————
  // From here: no more hooks. Single render return.
  // —————————————————————————————————————————————

  return (
    <>
      <Navbar />
      <main style={{ background: "#f2f2f2", height: "calc(100vh - 64px)", overflow: "hidden", display: "flex", flexDirection: "column" }} className="matches-main-content">
        <div
          style={{
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
            padding: "0.75rem",
            display: "flex",
            gap: "1rem",
            alignItems: "stretch",
            flex: 1,
            overflow: "hidden",
          }}
        >

          {/* ── MOBILE SIDEBAR OVERLAY ── */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                zIndex: 150, animation: "fadeIn 0.2s ease",
              }}
            />
          )}

          {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
            <aside
              className="matches-sidebar-panel"
              style={{
                width: "268px",
                flexShrink: 0,
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                overflowY: "auto",
                overscrollBehavior: "contain",
                alignSelf: "flex-start",
                position: "sticky",
                top: 0,
                height: "100%",
                maxHeight: "100%",
              }}
            >
            {/* "All Matches" header */}
            <div
              style={{
                padding: "0.875rem 1rem",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "#111" }}>
                All Matches
              </span>
            </div>

            {SIDEBAR.map((section) => (
              <div key={section.group ?? (section.items[0]?.id ?? "root")}>
                {/* Group label */}
                {section.group && (
                  <div
                    style={{
                      padding: "0.625rem 1rem 0.25rem",
                      fontSize: "0.6875rem",
                      fontWeight: 800,
                      color: "#888",
                      letterSpacing: "0.03em",
                      lineHeight: 1.3,
                      borderTop: "1px solid #f4f4f4",
                      background: "#fafafa",
                    }}
                  >
                    {section.group.split("\n").map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}

                {section.items.map((item) => {
                  const active = activeSection === item.id;
                  const isHiddenItem = item.id === "hidden_profiles";
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.625rem 1rem",
                        background: active ? "#FEF0F0" : isHiddenItem ? "#fafafa" : "transparent",
                        border: "none",
                        borderLeft: active ? "3px solid #6B1A2A" : "3px solid transparent",
                        borderTop: isHiddenItem ? "2px solid #f0f0f0" : undefined,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "var(--font-sans)",
                        borderBottom: "1px solid #f8f8f8",
                      }}
                    >
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ color: active ? "#6B1A2A" : isHiddenItem ? "#888" : "#bbb", marginTop: "2px", flexShrink: 0 }}>
                          <SidebarIcon id={item.id} active={active} />
                        </span>
                        <div>
                          <div style={{ fontWeight: active ? 700 : 600, fontSize: "0.875rem", color: active ? "#6B1A2A" : isHiddenItem ? "#555" : "#222", marginBottom: "1px" }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: "0.6875rem", color: "#999", lineHeight: 1.3 }}>
                            {item.sub.split("\n").map((l, i) => (
                              <span key={i}>{l}{i < item.sub.split("\n").length - 1 && <br />}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" style={{ flexShrink: 0, marginLeft: "4px" }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            ))}
            {/* Extra padding at bottom so last items are accessible on mobile */}
            <div style={{ height: "5rem" }} />
          </aside>

          {/* ── MAIN ────────────────────────────────────────────────────── */}
          <div
            ref={rightPanelRef}
            onScroll={(e) => sessionStorage.setItem(`matches_scroll_${activeSection}`, String(e.currentTarget.scrollTop))}
            style={{ flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden", paddingRight: "2px", paddingBottom: "2rem" }}>
            {/* Mobile: Section select button */}
            <div className="matches-mobile-header" style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setSidebarOpen(true)}
                className="matches-section-btn"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0.5rem", border: "1.5px solid #ccc",
                  borderRadius: "8px", background: "#fff", color: "#333",
                  cursor: "pointer", minHeight: "40px", minWidth: "40px",
                }}
                aria-label="Menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <h1
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "#111",
                  margin: 0,
                  flex: 1,
                }}
              >
                {loading ? "Loading…" : activeSection === "hidden_profiles" ? `${hiddenProfiles.length} hidden profiles` : activeSection === "daily_matches" ? "Daily Matches" : `${allFiltered.length} matches`}
              </h1>
            </div>

            {/* Filter / Sort / Chips row — includes search */}
            {activeSection !== "daily_matches" && (
            <div
              ref={chipRowRef}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                flexWrap: "nowrap",
                marginBottom: "0.75rem",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                paddingBottom: "4px",
              }}
            >
              {/* Inline search input */}
              <div style={{ position: "relative", flexShrink: 0, minWidth: "140px", maxWidth: "200px" }}>
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"
                  style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                >
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search name…"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.3125rem 1.5rem 0.3125rem 1.75rem",
                    border: nameSearch ? "1.5px solid #6B1A2A" : "1.5px solid #ddd",
                    borderRadius: "20px",
                    fontSize: "0.8125rem",
                    fontFamily: "var(--font-sans)",
                    color: "#222",
                    background: "#fff",
                    outline: "none",
                    boxSizing: "border-box" as const,
                    transition: "border-color 0.2s",
                  }}
                />
                {nameSearch && (
                  <button
                    onClick={() => setNameSearch("")}
                    style={{
                      position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#aaa",
                      padding: "2px", lineHeight: 1,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              {/* Filter button with active-count badge */}
              <button
                onClick={() => setFilterOpen((v) => !v)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "0.3125rem 0.75rem",
                  border: filterOpen || activeChips.length > 0 ? "1.5px solid #6B1A2A" : "1.5px solid #ccc",
                  borderRadius: "20px",
                  background: filterOpen ? "#FEF0F0" : "#fff",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  color: filterOpen || activeChips.length > 0 ? "#6B1A2A" : "#333",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                Filter
                {activeChips.length > 0 && (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#E8401A",
                    color: "#fff",
                    fontSize: "0.625rem",
                    fontWeight: 800,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}>{activeChips.length}</span>
                )}
              </button>


              {/* Quick filter chips */}
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "0.3125rem 0.75rem",
                    border: activeChips.includes(chip)
                      ? "1.5px solid #6B1A2A"
                      : "1.5px solid #ccc",
                    borderRadius: "20px",
                    background: activeChips.includes(chip) ? "#FEF0F0" : "#fff",
                    fontWeight: activeChips.includes(chip) ? 700 : 500,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    color: activeChips.includes(chip) ? "#6B1A2A" : "#333",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {chip}
                  {activeChips.includes(chip) && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Scroll arrows removed — chips row is touch-scrollable */}
            </div>
            )}

            {/* Expandable filter panel */}
            {filterOpen && activeSection !== "daily_matches" && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "1rem",
                  marginBottom: "0.875rem",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
              {/* Age From */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>Age From</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem" }} value={ageFrom} onChange={e => setAgeFrom(e.target.value)}>
                      <option value="Any">Doesn't matter</option>
                      {Array.from({ length: 35 }, (_, i) => String(18 + i)).map(val => {
                        const isDisabled = ageTo !== "Any" && Number(val) > Number(ageTo);
                        return <option key={val} value={val} disabled={isDisabled}>{val} Yrs</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>Age To</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem" }} value={ageTo} onChange={e => setAgeTo(e.target.value)}>
                      <option value="Any">Doesn't matter</option>
                      {Array.from({ length: 35 }, (_, i) => String(18 + i)).map(val => {
                        const isDisabled = ageFrom !== "Any" && Number(val) < Number(ageFrom);
                        return <option key={val} value={val} disabled={isDisabled}>{val} Yrs</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>Height From</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem" }} value={heightFrom} onChange={e => setHeightFrom(e.target.value)}>
                      <option value="Any">Doesn't matter</option>
                      {HEIGHTS.map(h => <option key={h.label} value={h.label}>{h.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#555", marginBottom: "4px" }}>Height To</label>
                    <select className="form-select" style={{ fontSize: "0.8125rem" }} value={heightTo} onChange={e => setHeightTo(e.target.value)}>
                      <option value="Any">Doesn't matter</option>
                      {HEIGHTS.map(h => <option key={h.label} value={h.label}>{h.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                  {/* Active filter count indicator */}
                  {(ageFrom !== "Any" || ageTo !== "Any" || heightFrom !== "Any" || heightTo !== "Any") && (
                    <span style={{ fontSize: "0.75rem", color: "#888" }}>
                      {[ageFrom !== "Any" ? `Age from ${ageFrom}` : "", ageTo !== "Any" ? `to ${ageTo}` : "", heightFrom !== "Any" ? `Height from ${heightFrom}` : "", heightTo !== "Any" ? `to ${heightTo}` : ""].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  <button onClick={() => {
                    setAgeFrom("Any");
                    setAgeTo("Any");
                    setHeightFrom("Any");
                    setHeightTo("Any");
                    setActiveChips([]);
                    setNameSearch("");
                    setCurrentPage(1);
                  }} style={{ padding: "0.5rem 1rem", background: "none", border: "1.5px solid #ccc", borderRadius: "20px", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", color: "#555", fontFamily: "var(--font-sans)" }}>Reset All</button>
                  <button onClick={() => setFilterOpen(false)} style={{ padding: "0.5rem 1rem", background: "#6B1A2A", color: "#fff", border: "none", borderRadius: "20px", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Close Filters</button>
                </div>
              </div>
            )}

            {/* Profile cards */}
            {activeSection === "daily_matches" ? (
              <DailyMatchesCarousel />
            ) : activeSection === "hidden_profiles" ? (
              hiddenProfiles.length === 0 ? (
                <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "4rem 2rem", textAlign: "center" }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2" style={{ margin: "0 auto 1rem", display: "block" }}>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                  <p style={{ fontWeight: 700, color: "#555", fontSize: "1rem", margin: "0 0 0.5rem" }}>No hidden profiles</p>
                  <p style={{ color: "#aaa", fontSize: "0.875rem", margin: 0 }}>Profiles you hide using &ldquo;Don&apos;t Show&rdquo; will appear here.</p>
                </div>
              ) : (
                <>
                  <div style={{ background: "#FFF8E8", border: "1px solid #E8D5B7", borderRadius: "6px", padding: "0.75rem 1rem", marginBottom: "0.875rem", fontSize: "0.8125rem", color: "#888" }}>
                    These profiles are hidden from all match lists. Click &ldquo;Unhide&rdquo; to make them visible again.
                  </div>
                  {hiddenProfiles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((profile, idx) => (
                    <div key={profile.id}>
                      <div style={{ opacity: 0.85, border: "1px solid #e0d0c0", borderRadius: "8px", marginBottom: "14px", overflow: "hidden", background: "#fafafa", position: "relative" }}>
                        <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2, background: "rgba(80,80,80,0.85)", color: "#fff", borderRadius: "3px", padding: "3px 8px", fontSize: "0.6875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          Hidden
                        </div>
                        <ProfileCard
                          profile={profile} index={idx}
                          onShortlist={() => handleShortlist(profile.id, profile.name)}
                          onHide={() => { }}
                          onSendInterest={() => handleSendInterest(profile.id, profile.name)}
                          shortlisted={shortlistedIds.has(profile.id)}
                          interestSent={sentInterestIds.has(profile.id)}
                          canMessage={canMessage}
                          canViewContact={canViewContact}
                        />
                        <div style={{ padding: "0 1rem 0.75rem", display: "flex", justifyContent: "flex-end" }}>
                          <button onClick={() => handleUnhide(profile.id, profile.name)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0.4375rem 1rem", border: "1.5px solid #6B1A2A", borderRadius: "20px", background: "#fff", color: "#6B1A2A", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            Unhide
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Pagination currentPage={currentPage} totalPages={Math.max(1, Math.ceil(hiddenProfiles.length / PAGE_SIZE))} onPageChange={(p) => { setCurrentPage(p); rightPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }} />
                </>
              )
            ) : loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : starMissing
                ? (
                  <div style={{ background: "#fff", border: "1px solid #E8D5B7", borderRadius: "8px", padding: "3rem 2rem", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #6B1A2A 0%, #C8973A 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "0.5rem" }}>Star (Nakshatra) Not Set</h3>
                    <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "1.5rem", maxWidth: "360px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                      To view star matches, please update your Nakshatra (Star) in your profile. We use Tamil horoscope star compatibility to find the best matches for you.
                    </p>
                    <Link href="/profile/edit?section=religion" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#6B1A2A", color: "#fff", borderRadius: "20px", padding: "0.625rem 1.5rem", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}>
                      Update Star Details →
                    </Link>
                  </div>
                )
                : displayed.length === 0
                  ? (
                    <div
                      style={{
                        background: "#fff",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        padding: "4rem 2rem",
                        textAlign: "center",
                      }}
                    >
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2" style={{ margin: "0 auto 1rem" }}>
                        <circle cx="12" cy="7" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                      <p style={{ fontWeight: 700, color: "#555", fontSize: "1rem", margin: "0 0 0.5rem" }}>
                        No profiles found
                      </p>
                      <p style={{ color: "#aaa", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
                        No matches in this category yet. Try another section.
                      </p>
                      <button
                        onClick={() => setActiveSection("your_matches")}
                        style={{
                          padding: "0.5rem 1.5rem",
                          background: "#6B1A2A",
                          color: "#fff",
                          border: "none",
                          borderRadius: "20px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.875rem",
                        }}
                      >
                        View All Matches
                      </button>
                    </div>
                  )
                  : (activeSection === "shortlisted_you" || activeSection === "viewed_you") && !isPremium ? (
                    <div style={{ padding: "4rem 2rem", textAlign: "center", background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
                      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #6B1A2A 0%, #C8973A 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                        <Lock size={28} color="#fff" />
                      </div>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "0.5rem" }}>
                        {activeSection === "shortlisted_you" ? "See Who Shortlisted You" : "See Who Viewed You"}
                      </h3>
                      {profiles.length > 0 && (
                        <p style={{ color: "#6B1A2A", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
                          {profiles.length} members
                        </p>
                      )}
                      <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "1.5rem", maxWidth: "400px", margin: "0 auto 1.5rem" }}>
                        Upgrade to Gold or Prime to see exactly who {activeSection === "shortlisted_you" ? "shortlisted" : "viewed"} your profile and connect with them.
                      </p>
                      <Link href="/membership" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "linear-gradient(135deg, #C8973A 0%, #E8C060 100%)", color: "#fff", fontWeight: 700, fontSize: "0.9375rem", borderRadius: "30px", padding: "0.75rem 2rem", textDecoration: "none", boxShadow: "0 4px 16px rgba(200,151,58,0.35)" }}>
                        <Crown size={16} />
                        Upgrade to Gold — ₹999/mo
                      </Link>
                    </div>
                  )
                    : displayed.map((profile, idx) => (
                      <div
                        key={profile.id}
                        onClick={() => {
                          sessionStorage.setItem("matches_section", activeSection);
                        }}
                      >
                        <ProfileCard
                          profile={profile}
                          index={idx}
                          onShortlist={() => handleShortlist(profile.id, profile.name)}
                          onHide={() => handleHide(profile.id)}
                          onSendInterest={() => handleSendInterest(profile.id, profile.name)}
                          shortlisted={shortlistedIds.has(profile.id)}
                          interestSent={sentInterestIds.has(profile.id)}
                          canMessage={canMessage}
                          canViewContact={canViewContact}
                        />
                      </div>
                    ))
            }

            {/* Pagination */}
            {!loading && allFiltered.length > 0 && activeSection !== "hidden_profiles" &&
              !((activeSection === "shortlisted_you" || activeSection === "viewed_you") && !isPremium) && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => { setCurrentPage(p); rightPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
                />
              )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Mobile-specific styles */}
      <style>{`
        /* Desktop: sidebar always visible */
        @media (min-width: 900px) {
          .matches-sidebar-panel {
            display: block !important;
            position: sticky !important;
          }
          .matches-section-btn { display: none !important; }
          .matches-mobile-header h1 { font-size: 1rem !important; }
        }
        /* Mobile: sidebar as drawer */
        @media (max-width: 899px) {
          .matches-sidebar-panel {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 85vw !important;
            max-width: 320px !important;
            z-index: 160 !important;
            max-height: 100vh !important;
            border-radius: 0 12px 12px 0 !important;
            overflow-y: auto !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.15) !important;
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            transition: transform 0.25s ease !important;
          }
        }
        /* Smallest screens: horizontal split mini card */
        @media (max-width: 479px) {
          .match-card-grid { 
            display: grid !important; 
            grid-template-columns: 140px 1fr !important;
            grid-template-areas: "photo info" "actions actions" !important;
          }
          .match-card-photo-wrap {
            width: 140px !important;
            aspect-ratio: unset !important;
            max-height: 220px !important;
            min-height: 180px !important;
            overflow: hidden !important;
          }
          .match-card-photo {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: top center !important;
            min-height: 180px !important;
            max-height: 220px !important;
          }
        }
        /* Medium phones: side-by-side */
        @media (min-width: 480px) {
          .match-card-grid { 
            display: grid !important; 
            grid-template-columns: 165px 1fr !important;
            grid-template-areas: "photo info" "photo actions" !important;
          }
          .match-card-photo-wrap {
            width: 165px !important;
            aspect-ratio: unset !important;
            min-height: 210px !important;
          }
          .match-card-photo {
            height: 100% !important;
            min-height: 210px !important;
            max-height: 300px !important;
          }
        }
        @media (min-width: 768px) {
          .match-card-grid {
            grid-template-columns: 190px 1fr !important;
          }
          .match-card-photo-wrap { width: 190px !important; min-height: 230px !important; }
          .match-card-photo { min-height: 230px !important; max-height: 340px !important; }
        }
        .match-card-actions::-webkit-scrollbar { display: none; }
        /* Right scroll panel custom scrollbar */
        .matches-right-scroll::-webkit-scrollbar { width: 4px; }
        .matches-right-scroll::-webkit-scrollbar-track { background: transparent; }
        .matches-right-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        .matches-right-scroll::-webkit-scrollbar-thumb:hover { background: #bbb; }
        /* On mobile, reduce main height to account for the fixed bottom nav bar */
        @media (max-width: 899px) {
          .matches-main-content {
            height: calc(100vh - 64px - 60px - env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
      
      <ConfirmDialog
        isOpen={confirmAction.isOpen}
        title={confirmAction.title}
        message={confirmAction.message}
        onConfirm={confirmAction.onConfirm}
        onCancel={() => setConfirmAction((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

// ── Auth Guard — owns useSearchParams + auth gating, renders MatchesContent only when ready ──
function MatchesGuard() {
  const { user, loading: authLoading } = useAuth();
  const { can, isPremium } = useMembership();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab") ?? null;
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Server render + first client paint: return a static spinner with NO auth-aware components.
  // This guarantees server HTML === client HTML, eliminating hydration mismatch.
  if (!mounted) {
    return (
      <main style={{ background: "#f2f2f2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{
            width: "40px", height: "40px", margin: "0 auto 1rem",
            border: "3px solid #e0e0e0",
            borderTopColor: "#6B1A2A",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }} />
          <p style={{ color: "#888", fontSize: "0.875rem" }}>Loading your matches…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    );
  }

  // Client-only: auth check with full Navbar
  if (authLoading || !user) {
    return (
      <>
        <Navbar />
        <main style={{ background: "#f2f2f2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{
              width: "40px", height: "40px", margin: "0 auto 1rem",
              border: "3px solid #e0e0e0",
              borderTopColor: "#6B1A2A",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
            <p style={{ color: "#888", fontSize: "0.875rem" }}>Loading your matches…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <MatchesContent
      key={user.id}
      user={user}
      canMessage={can("messages")}
      canViewContact={can("contacts")}
      initialTab={tab}
      isPremium={isPremium}
    />
  );
}

const loadingFallback = (
  <main style={{ background: "#f2f2f2", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <div style={{
        width: "40px", height: "40px", margin: "0 auto 1rem",
        border: "3px solid #e0e0e0", borderTopColor: "#6B1A2A",
        borderRadius: "50%", animation: "spin 0.7s linear infinite",
      }} />
      <p style={{ color: "#888", fontSize: "0.875rem" }}>Loading your matches…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </main>
);

export default function MatchesPage() {
  return (
    <Suspense fallback={loadingFallback}>
      <MatchesGuard />
    </Suspense>
  );
}
