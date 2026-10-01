"use client";

import { useState } from "react";
import Image from "next/image";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#fff" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

export default function CompactFooter() {
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  return (
    <footer style={{ marginTop: "auto", position: "relative", zIndex: 10 }}>
      <div
        style={{
          background: "var(--primary-dark, #4A0F1C)",
          padding: "0.625rem 0",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative Mandala Graphic at Bottom-Right */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            bottom: "-35px",
            width: "140px",
            height: "140px",
            pointerEvents: "none",
            opacity: 0.28,
            zIndex: 1,
          }}
        >
          <Image
            src="/images/Mandala.png"
            alt=""
            width={140}
            height={140}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div className="compact-footer-flex">
            
            {/* Copyright */}
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", margin: 0, whiteSpace: "nowrap" }}>
              &copy; 2026 Elite Tamil Matrimony. All rights reserved.
            </p>

            <div className="compact-footer-divider" />

            {/* Language Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", whiteSpace: "nowrap" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>Language</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  background: "transparent",
                  color: "#fff",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="English" style={{ background: "#4A0F1C", color: "#fff" }}>English</option>
                <option value="Tamil" style={{ background: "#4A0F1C", color: "#fff" }}>தமிழ் (Tamil)</option>
              </select>
            </div>

            <div className="compact-footer-divider" />

            {/* Follow Us & Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>Follow Us</span>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label + "-compact"}
                    href={s.href}
                    aria-label={s.label}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary-dark, #4A0F1C)",
                      textDecoration: "none",
                    }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="compact-footer-divider" />

            {/* Tagline */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", whiteSpace: "nowrap" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.8">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span style={{ fontSize: "0.75rem", fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>
                More than a match... It&apos;s a lifetime
              </span>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .compact-footer-flex {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .compact-footer-divider {
          width: 1px;
          height: 14px;
          background: rgba(255,255,255,0.25);
        }

        @media (max-width: 1024px) {
          .compact-footer-divider {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .compact-footer-flex {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.5rem;
          }
        }
      `}</style>

      {/* Spacer so footer content is not hidden behind mobile bottom nav */}
      <div className="bottom-nav-spacer" aria-hidden="true" />
    </footer>
  );
}
