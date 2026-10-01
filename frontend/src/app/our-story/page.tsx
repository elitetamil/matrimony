import Navbar from '@/components/layout/Navbar';
import CompactFooter from '@/components/layout/CompactFooter';
import Link from 'next/link';
import StaticPageHeader from '@/components/ui/StaticPageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Story — Elite Tamil Matrimony',
  description: 'A New Beginning for Meaningful Matchmaking',
};

export default function OurStoryPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader 
          title="📖 Our Story" 
          subtitle="A New Beginning for Meaningful Matchmaking" 
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
                Marriage has always held a special place in Tamil families. Traditionally, finding the right partner has been a journey guided by families, values, traditions, and mutual understanding.
              </p>
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "1rem" }}>
                Elite Tamil Matrimony brings these timeless values together with the convenience of modern technology.
              </p>
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "1rem" }}>
                Our platform was created to make it easier for brides, grooms, and families to discover potential matches, understand compatibility, and take the first step towards a meaningful relationship.
              </p>
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "1.5rem" }}>
                From the first profile search to the beginning of a new chapter, we aim to make every step of the matrimonial journey more comfortable and confident.
              </p>
              
              <div style={{ padding: "1.5rem", background: "#FAF4F0", borderRadius: "12px", borderLeft: "4px solid #6B1A2A" }}>
                <p style={{ fontSize: "1rem", color: "#6B1A2A", fontStyle: "italic", fontWeight: 600, margin: 0 }}>
                  Our Story is about bringing people closer — with trust, respect, and shared values.
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
