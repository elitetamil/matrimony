"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useMembership } from "@/hooks/useMembership";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Matches", href: "/matches" },
  { label: "Interests", href: "/interests" },
  { label: "Messages", href: "/messages" },
  { label: "Search", href: "/search" },
];

const ABOUT_US_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Our Story", href: "/our-story" },
  { label: "Our Values", href: "/our-values" },
  { label: "Safety & Trust", href: "/safety-trust" },
  { label: "Success Stories", href: "/success-stories" },
  { label: "FAQ's", href: "/faq" },
];

const HELP_SUPPORT_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Membership Plans", href: "/membership" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#fff" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

export default function Footer() {
  const { user } = useAuth();
  const { isPremium } = useMembership();
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setNewsletterSubscribed(true);
      setTimeout(() => setNewsletterSubscribed(false), 4000);
      setEmail("");
    }
  };

  return (
    <>
      {/* ── Pre-Footer CTA Band ─────────────────────────────────────────── */}
      {!user ? (
        <section
          style={{
            background: "var(--bg-light, #FAF3E8)",
            borderTop: "1px solid var(--border-color, #E8D5B7)",
            borderBottom: "1px solid var(--border-color, #E8D5B7)",
            padding: "1.25rem 0",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(0.9375rem, 2vw, 1.125rem)",
                  fontWeight: 700,
                  color: "var(--primary-dark, #4A0F1C)",
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                Looking for a meaningful marriage relationship?
              </h2>
              <div style={{ display: "flex", gap: "0.625rem" }}>
                <Link
                  href="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "var(--primary, #6B1A2A)",
                    color: "#fff",
                    padding: "0.4rem 1.125rem",
                    borderRadius: "4px",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    textDecoration: "none",
                  }}
                >
                  Register Free
                </Link>
                <Link
                  href="/search"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "transparent",
                    color: "var(--primary, #6B1A2A)",
                    border: "1.5px solid var(--primary, #6B1A2A)",
                    padding: "0.4rem 1.125rem",
                    borderRadius: "4px",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    textDecoration: "none",
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
            background: "var(--primary-light, #F5E6E9)",
            borderTop: "1px solid var(--border-color, #E8D5B7)",
            padding: "0.75rem 0",
          }}
        >
          <div className="container" style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 0.125rem", fontSize: "0.875rem", color: "var(--primary, #6B1A2A)", fontWeight: 700 }}>
              Upgrade to Premium for direct messaging, contact access, and priority search.
            </h3>
            <Link
              href="/membership"
              style={{ color: "var(--primary-dark, #4A0F1C)", fontSize: "0.78125rem", textDecoration: "underline", fontWeight: 600 }}
            >
              View Plans
            </Link>
          </div>
        </section>
      )}

      {/* ── Main Footer Container ─────────────────────────────────────────── */}
      <footer style={{ marginTop: "auto" }}>

        {/* 1. TOP FOOTER SECTION — Light Cream Background */}
        <div
          style={{
            background: "#FFF8F0",
            padding: "1.75rem 0 1.5rem",
            borderTop: "1px solid #E8D5B7",
            borderBottom: "1px solid #E8D5B7",
            color: "#333",
          }}
        >
          <div className="container">
            <div className="footer-top-grid">

              {/* Left Brand Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                  <Image
                    src="/logo-transparent.png"
                    alt="Elite Tamil Matrimony"
                    width={130}
                    height={44}
                    style={{ height: "36px", width: "auto" }}
                    priority
                  />
                </Link>

                <p style={{ fontSize: "0.8125rem", fontStyle: "italic", color: "var(--primary, #6B1A2A)", margin: 0, fontWeight: 600 }}>
                  Connecting hearts. Building families.
                </p>

                <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.5, margin: 0, maxWidth: "260px" }}>
                  Elite Tamil Matrimony is a trusted platform for meaningful relationships, bringing together like-minded individuals and families across India and around the world.
                </p>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      title={s.label}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "var(--primary, #6B1A2A)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        textDecoration: "none",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--primary-dark, #4A0F1C)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--primary, #6B1A2A)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="footer-col-title">Quick Links</h4>
                <ul className="footer-link-list">
                  {QUICK_LINKS.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* About Us */}
              <div>
                <h4 className="footer-col-title">About Us</h4>
                <ul className="footer-link-list">
                  {ABOUT_US_LINKS.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Help & Support */}
              <div>
                <h4 className="footer-col-title">Help &amp; Support</h4>
                <ul className="footer-link-list">
                  {HELP_SUPPORT_LINKS.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Section: Stay Connected & Upgrade */}
              <div className="footer-right-col">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {/* Stay Connected Header & Subtitle */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "var(--primary-light, #F5E6E9)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--primary, #6B1A2A)",
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--primary-dark, #4A0F1C)", margin: 0 }}>
                        Stay Connected
                      </h4>
                    </div>
                    <p style={{ fontSize: "0.71875rem", color: "#666", margin: 0, lineHeight: 1.4 }}>
                      Get the latest updates, success stories and helpful tips delivered to your inbox.
                    </p>
                  </div>

                  {/* Newsletter Form */}
                  <form onSubmit={handleNewsletterSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                    <div style={{ display: "flex", width: "100%" }}>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                          flex: 1,
                          padding: "0.375rem 0.625rem",
                          fontSize: "0.75rem",
                          borderTop: "1px solid #D4A840",
                          borderBottom: "1px solid #D4A840",
                          borderLeft: "1px solid #D4A840",
                          borderRight: "none",
                          borderRadius: "4px 0 0 4px",
                          background: "#fff",
                          color: "#333",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        aria-label="Subscribe"
                        style={{
                          background: "var(--primary, #6B1A2A)",
                          color: "#fff",
                          borderTop: "1px solid var(--primary, #6B1A2A)",
                          borderBottom: "1px solid var(--primary, #6B1A2A)",
                          borderRight: "1px solid var(--primary, #6B1A2A)",
                          borderLeft: "none",
                          padding: "0 0.75rem",
                          borderRadius: "0 4px 4px 0",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        style={{ accentColor: "var(--primary, #6B1A2A)" }}
                      />
                      <span style={{ fontSize: "0.6875rem", color: "#666", lineHeight: 1.2 }}>
                        I agree to receive updates and offers from Elite Tamil Matrimony.
                      </span>
                    </label>

                    {newsletterSubscribed && (
                      <span style={{ fontSize: "0.6875rem", color: "#2E7D32", fontWeight: 600 }}>
                        Thank you for subscribing!
                      </span>
                    )}
                  </form>

                  {/* Upgrade to Premium Card */}
                  <div
                    style={{
                      background: "var(--primary-light, #F5E6E9)",
                      border: "1px solid #E8D5B7",
                      borderRadius: "6px",
                      padding: "0.5rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#FFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary, #6B1A2A)",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 4l3 12h14l3-12-6 7-4-5-4 5-6-7z" />
                        <path d="M3 20h18" />
                      </svg>
                    </div>

                    <div style={{ flex: 1 }}>
                      <h5 style={{ fontSize: "0.78125rem", fontWeight: 700, color: "var(--primary-dark, #4A0F1C)", margin: 0 }}>
                        Upgrade to Premium
                      </h5>
                      <p style={{ fontSize: "0.6875rem", color: "#555", margin: 0, lineHeight: 1.2 }}>
                        Unlock more features for a better matrimonial experience.
                      </p>
                    </div>

                    <Link
                      href="/membership"
                      aria-label="Upgrade to Premium"
                      style={{
                        color: "var(--primary, #6B1A2A)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2px",
                        textDecoration: "none",
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 2. BOTTOM FOOTER BAR — Dark Maroon Background */}
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
            <div className="footer-bottom-flex">

              {/* Copyright */}
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", margin: 0 }}>
                &copy; {new Date().getFullYear()} Elite Tamil Matrimony. All rights reserved.
              </p>

              <div className="footer-bottom-divider" />

              {/* Language Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
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

              <div className="footer-bottom-divider" />

              {/* Follow Us & Icons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)" }}>Follow Us</span>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.label + "-bottom"}
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

              <div className="footer-bottom-divider" />

              {/* Branding Slogan */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
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

        {/* Styles for Footer Layout */}
        <style>{`
          .footer-top-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr 0.8fr 0.8fr 1.3fr;
            gap: 1.5rem;
            align-items: start;
          }
          .footer-right-col {
            border-left: 1px solid #E8D5B7;
            padding-left: 1.5rem;
          }
          .footer-col-title {
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--primary-dark, #4A0F1C);
            margin: 0 0 0.5rem;
            position: relative;
            display: inline-block;
          }
          .footer-col-title::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 20px;
            height: 2px;
            background: var(--primary, #6B1A2A);
            border-radius: 1px;
          }
          .footer-link-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .footer-link {
            font-size: 0.78125rem;
            color: #444;
            text-decoration: none;
            transition: color 0.15s ease;
            display: inline-block;
          }
          .footer-link:hover {
            color: var(--primary, #6B1A2A);
            font-weight: 600;
          }
          .footer-bottom-flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          .footer-bottom-divider {
            width: 1px;
            height: 14px;
            background: rgba(255,255,255,0.25);
          }

          @media (max-width: 1024px) {
            .footer-top-grid {
              grid-template-columns: 1fr 1fr 1fr;
              gap: 1.25rem;
            }
            .footer-right-col {
              grid-column: span 3;
              border-left: none;
              border-top: 1px solid #E8D5B7;
              padding-left: 0;
              padding-top: 1rem;
              margin-top: 0.25rem;
            }
            .footer-bottom-divider {
              display: none;
            }
          }

          @media (max-width: 640px) {
            .footer-top-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .footer-right-col {
              grid-column: span 1;
            }
            .footer-bottom-flex {
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
    </>
  );
}


