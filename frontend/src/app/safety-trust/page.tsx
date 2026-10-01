import Navbar from '@/components/layout/Navbar';
import CompactFooter from '@/components/layout/CompactFooter';
import StaticPageHeader from '@/components/ui/StaticPageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safety & Trust — Elite Tamil Matrimony',
  description: 'Your Trust Matters to Us',
};

export default function SafetyTrustPage() {
  const approaches = [
    "Secure handling of member information",
    "Privacy-focused profile settings",
    "Options to control your personal details",
    "Reporting and blocking features",
    "Encouragement of genuine profile information",
    "Responsible communication between members"
  ];

  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader 
          title="🛡️ Safety & Trust" 
          subtitle="Your Trust Matters to Us" 
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.25rem 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
            <section
              style={{
                background: "#fff",
                border: "1px solid #E5D5C5",
                borderRadius: "14px",
                padding: "1.75rem 2rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "1rem" }}>
                Choosing a life partner is a deeply personal journey. That is why safety, privacy, and trust are at the heart of Elite Tamil Matrimony.
              </p>
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "2rem" }}>
                We strive to create a respectful matrimonial environment where members can explore profiles and connect with confidence.
              </p>
              
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
                Our Approach to Safety
              </h2>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem" }}>
                {approaches.map((item, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6B1A2A", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.9375rem", color: "#333" }}>{item}</span>
                  </li>
                ))}
              </ul>

              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                We also encourage every member to take time to know a potential match and verify important personal details before making any major decisions.
              </p>

              <div style={{ padding: "1.5rem", background: "#FAF4F0", borderRadius: "12px", borderLeft: "4px solid #6B1A2A" }}>
                <p style={{ fontSize: "1rem", color: "#6B1A2A", fontStyle: "italic", fontWeight: 600, margin: 0 }}>
                  Connect with confidence. Choose with care.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <CompactFooter />
    </>
  );
}
