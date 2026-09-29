import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — Elite Tamil Matrimony',
  description: 'Learn about Elite Tamil Matrimony — a dedicated platform helping Tamil individuals and families find meaningful marriage relationships.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "1.5rem 0 4rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.25rem" }}>
          {/* Back Button */}
          <div style={{ marginBottom: "1rem" }}>
            <BackButton style={{ background: "#fff", border: "1px solid #E5D5C5", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
          </div>

          {/* Hero Banner Card — Matching Reference Image */}
          <div
            style={{
              background: "#6B1A2A",
              borderRadius: "16px",
              padding: "2.25rem 2.5rem",
              marginBottom: "1.75rem",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(107, 26, 42, 0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.125rem", marginBottom: "0.75rem" }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  width: "52px",
                  height: "52px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", fontFamily: "var(--font-sans)" }}>
                About Elite Tamil Matrimony
              </h1>
            </div>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "1.0625rem", lineHeight: 1.65, maxWidth: "750px", fontWeight: 400 }}>
              A trusted matrimonial platform built exclusively for Tamil individuals and families, focused on meaningful connections and lifelong partnerships.
            </p>
            <div style={{ marginTop: "1.25rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.85)", fontWeight: 500 }}>
              <span>🏛️ Trusted Tamil Network</span>
              <span>✨ Mobile Verified Profiles</span>
              <span>🔒 Privacy &amp; Security First</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            {/* Our Mission */}
            <section
              style={{
                background: "#fff",
                border: "1px solid #E5D5C5",
                borderRadius: "14px",
                padding: "1.75rem 2rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#6B1A2A",
                  margin: "0 0 1rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1.5px solid #F8ECE8",
                }}
              >
                Our Mission
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "1rem" }}>
                Elite Tamil Matrimony was founded with a single purpose: to help Tamil-speaking individuals and families find compatible life partners in a respectful, privacy-first environment.
              </p>
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "1rem" }}>
                We understand that marriage is one of the most important decisions in a person&apos;s life. Our platform is designed to make the process of discovering, evaluating, and connecting with potential matches as meaningful and stress-free as possible.
              </p>
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, margin: 0 }}>
                Built with modern technology and a deep respect for Tamil culture and family values, every feature on Elite Tamil Matrimony is designed with your safety, privacy, and wellbeing in mind.
              </p>
            </section>

            {/* What We Stand For (Values Grid) */}
            <section
              id="values"
              style={{
                background: "#fff",
                border: "1px solid #E5D5C5",
                borderRadius: "14px",
                padding: "1.75rem 2rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#6B1A2A",
                  margin: "0 0 1.25rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1.5px solid #F8ECE8",
                }}
              >
                What We Stand For
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {[
                  {
                    title: "Privacy First",
                    desc: "Your personal details are protected. Profile photos are blurred for unregistered visitors. You control who sees your contact information.",
                    icon: (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                    ),
                  },
                  {
                    title: "Verified Profiles",
                    desc: "All profiles are verified via mobile OTP. We encourage members to complete identity verification for a safer community.",
                    icon: (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="7" r="4" />
                        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                        <polyline points="16 11 17.5 12.5 21 9" strokeWidth="2" />
                      </svg>
                    ),
                  },
                  {
                    title: "Smart Matching",
                    desc: "Our compatibility engine scores potential matches based on shared values, lifestyle, and life goals — not just demographics.",
                    icon: (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Tamil Community Focus",
                    desc: "Built exclusively for the Tamil community. We understand the cultural nuances, traditions, and values that matter to Tamil families.",
                    icon: (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      background: "#FAF4F0",
                      border: "1px solid #E5D5C5",
                      borderRadius: "12px",
                      padding: "1.25rem",
                    }}
                  >
                    <div style={{ marginBottom: "0.625rem" }}>{item.icon}</div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: "#111",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {item.title}
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.6, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact CTA */}
            <section
              style={{
                background: "#fff",
                border: "1px solid #E5D5C5",
                borderRadius: "14px",
                padding: "2rem",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 0.5rem" }}>
                Have questions or feedback?
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "#555", margin: "0 0 1.25rem" }}>
                We&apos;d love to hear from you. Our support team is here to help you find your match.
              </p>
              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#6B1A2A",
                  color: "#fff",
                  padding: "0.625rem 1.75rem",
                  borderRadius: "30px",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                Contact Support →
              </Link>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
