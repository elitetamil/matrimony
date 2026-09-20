"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useMembership } from "@/hooks/useMembership";

const FOOTER_LINKS = {
  "Help & Support": [
    { label: "Contact us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
  ],
  "Information": [
    { label: "About Us", href: "/about" },
    { label: "Success stories", href: "/success-stories" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy-policy" },
  ],
};

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    ),
  },
];

export default function Footer() {
  const { user } = useAuth();
  const { isPremium } = useMembership();
  return (
    <>
      {/* ── Pre-Footer CTA Band ─────────────────────────────────────────── */}
      {!user ? (
        <section
          style={{
            background: "var(--bg-light)",
            borderTop: "1px solid var(--border-color)",
            borderBottom: "1px solid var(--border-color)",
            padding: "1.75rem 0",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "0.75rem",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                  fontWeight: 700,
                  color: "var(--text-dark)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Looking for a meaningful marriage relationship?
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", justifyContent: "center" }}>
                <Link
                  href="/register"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "var(--primary)", color: "#fff",
                    padding: "0.5rem 1.25rem", borderRadius: "4px",
                    fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", minHeight: "40px",
                  }}
                >
                  Register Free
                </Link>
                <Link
                  href="/search"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "transparent", color: "var(--primary)",
                    border: "1.5px solid var(--primary)",
                    padding: "0.5rem 1.25rem", borderRadius: "4px",
                    fontWeight: 700, fontSize: "0.875rem", textDecoration: "none", minHeight: "40px",
                  }}
                >
                  Search Profiles
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : isPremium ? null : (
        <section
          style={{
            background: "var(--primary-light)",
            borderTop: "1px solid var(--border-color)",
            padding: "1rem 0",
          }}
        >
          <div className="container" style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: "0.9375rem", color: "var(--primary)", fontWeight: 700 }}>
              Upgrade to Premium for direct messaging, contact access, and priority search.
            </h3>
            <Link href="/membership" style={{ color: "var(--text-dark)", fontSize: "0.8125rem", textDecoration: "underline", fontWeight: 600 }}>
              View Plans
            </Link>
          </div>
        </section>
      )}

      {/* ── Main Footer ─────────────────────────────────────────────────── */}
      <footer style={{ background: "var(--primary-dark)", color: "rgba(255,255,255,0.8)", marginTop: "auto" }}>
        <div className="container" style={{ padding: "1.5rem 1rem" }}>
          <div className="footer-main-grid" style={{ display: "grid", gap: "1.5rem", marginBottom: "1.25rem" }}>
            {/* Brand column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                <Image
                  src="/logo-transparent.png"
                  alt="Elite Tamil Matrimony"
                  width={120}
                  height={60}
                  style={{ height: "38px", width: "auto", filter: "brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
                  priority
                />
              </Link>
              <p style={{ fontSize: "0.78125rem", color: "rgba(255,255,255,0.5)", maxWidth: "300px", lineHeight: 1.6, margin: 0 }}>
                A trusted Tamil matrimony platform connecting families and individuals for meaningful marriage relationships.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <a href="mailto:support@elitetamilmatrimony.com" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>support@elitetamilmatrimony.com</a>
                <a href="tel:+919360653547" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>+91 93606 53547</a>
              </div>
              <div style={{ display: "flex", gap: "0.375rem" }}>
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    title={`${s.label} — Coming Soon`}
                    style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "rgba(255,255,255,0.6)", textDecoration: "none",
                    }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Help & Support */}
            <div>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff", margin: "0 0 0.625rem" }}>Help &amp; Support</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {FOOTER_LINKS["Help & Support"].map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", textDecoration: "none", lineHeight: 1.6 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Information */}
            <div>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fff", margin: "0 0 0.625rem" }}>Information</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {FOOTER_LINKS["Information"].map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", textDecoration: "none", lineHeight: 1.6 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.875rem" }}>
            <p style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)", margin: 0 }}>
              &copy; {new Date().getFullYear()} Elite Tamil Matrimony. All rights reserved.
            </p>
          </div>
        </div>
        <style>{`
          .footer-main-grid { grid-template-columns: 1fr; }
          @media (min-width: 640px) { .footer-main-grid { grid-template-columns: 1.5fr 1fr 1fr; } }
        `}</style>
        {/* Spacer so footer content is not hidden behind mobile bottom nav */}
        <div className="bottom-nav-spacer" aria-hidden="true" />
      </footer>
    </>
  );
}
