import Navbar from '@/components/layout/Navbar';
import CompactFooter from '@/components/layout/CompactFooter';
import StaticPageHeader from '@/components/ui/StaticPageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Values — Elite Tamil Matrimony',
  description: 'What We Believe In',
};

export default function OurValuesPage() {
  const values = [
    {
      title: "Trust",
      desc: "We believe meaningful relationships begin with honesty and transparency.",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Respect",
      desc: "Every individual and every family deserves to be treated with dignity and understanding.",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      title: "Authenticity",
      desc: "We encourage genuine profiles and meaningful intentions throughout the matchmaking journey.",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      title: "Privacy",
      desc: "Your personal information deserves care, security, and responsible handling.",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      title: "Compatibility",
      desc: "We believe a meaningful match goes beyond preferences — it is about shared values, understanding, and life goals.",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      title: "Family Values",
      desc: "We respect the traditions and values that make Tamil families and relationships unique.",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader 
          title="💎 Our Values" 
          subtitle="What We Believe In" 
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
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                Our values guide everything we do and shape the experience we create for our members.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {values.map((item) => (
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
          </div>
        </div>
      </main>
      <CompactFooter />
    </>
  );
}
