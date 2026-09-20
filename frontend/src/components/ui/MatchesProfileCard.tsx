import Link from "next/link";
import { Lock } from "lucide-react";
import { type RegisteredUser } from "@/lib/auth-store";

// PhoneIcon component for the profile card
function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
    </svg>
  );
}

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

export default ProfileCard;
