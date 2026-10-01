import Navbar from "@/components/layout/Navbar";
import CompactFooter from "@/components/layout/CompactFooter";
import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import StaticPageHeader from "@/components/ui/StaticPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — Elite Tamil Matrimony",
  description:
    "Discover how Elite Tamil Matrimony helps you create a profile, search verified Tamil matches, express interest, and connect safely.",
};

const STEPS = [
  {
    step: "01",
    title: "Create Your Free Profile",
    desc: "Register in under 2 minutes. Fill in basic details, family background, partner preferences, and upload your profile photos securely.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #6B1A2A)" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="17" y1="11" x2="23" y2="11" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Mobile & Identity Verification",
    desc: "Verify your phone number with instant OTP validation. Complete optional identity verification to earn a verified trust badge on your profile.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #6B1A2A)" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Discover Compatible Matches",
    desc: "Use advanced filters to search by religion, caste, sub-caste, education, profession, location, and horoscope details to find true compatibility.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #6B1A2A)" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    step: "04",
    title: "Express Interest & Connect",
    desc: "Send free interest requests to profiles you like. Upgrade to Premium to unlock direct messaging, contact number access, and priority search placement.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary, #6B1A2A)" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader 
          title="How Elite Tamil Matrimony Works" 
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.25rem 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            {STEPS.map((s) => (
              <div
                key={s.step}
                style={{
                  background: "#fff",
                  border: "1px solid #E5D5C5",
                  borderRadius: "14px",
                  padding: "1.5rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "#F8ECE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s.icon}
                  </div>
                  <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "rgba(107,26,42,0.25)" }}>{s.step}</span>
                </div>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#6B1A2A", margin: 0 }}>{s.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#555", margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #E5D5C5", borderRadius: "14px", padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 0.5rem" }}>
              Ready to find your soulmate?
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "#666", marginBottom: "1.25rem" }}>
              Join thousands of verified Tamil members today and take the first step towards your life journey.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/register"
                style={{
                  background: "#6B1A2A",
                  color: "#fff",
                  padding: "0.625rem 1.5rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                Register Free
              </Link>
              <Link
                href="/search"
                style={{
                  background: "transparent",
                  color: "#6B1A2A",
                  border: "1.5px solid #6B1A2A",
                  padding: "0.625rem 1.5rem",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                Browse Matches
              </Link>
            </div>
          </div>
        </div>
      </main>
      <CompactFooter />
    </>
  );
}
