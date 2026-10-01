import Navbar from "@/components/layout/Navbar";
import CompactFooter from "@/components/layout/CompactFooter";
import Link from "next/link";
import StaticPageHeader from "@/components/ui/StaticPageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Elite Tamil Matrimony",
  description: "Articles, relationships advice, Tamil marriage traditions, and success stories on Elite Tamil Matrimony.",
};

const ARTICLES = [
  {
    title: "10 Essential Tips for a Meaningful Matrimonial Search",
    category: "Relationship Advice",
    date: "Sep 20, 2026",
    desc: "Discover how clear partner preferences, honest profile details, and active communication can streamline your journey.",
  },
  {
    title: "Understanding Tamil Wedding Traditions & Rituals",
    category: "Culture & Heritage",
    date: "Sep 15, 2026",
    desc: "Explore the deep cultural significance behind Nichayathartham, Muhurtham, and Saptapadi in traditional Tamil weddings.",
  },
  {
    title: "How to Ensure Safety & Privacy When Finding a Life Partner Online",
    category: "Safety & Privacy",
    date: "Sep 08, 2026",
    desc: "Best practices for photo privacy, mobile verification, and initial conversations with potential matches.",
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader 
          title="Elite Tamil Matrimony Blog" 
          subtitle="Insights, advice, and stories on Tamil matrimony, relationships, and finding your life partner." 
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.25rem 0" }}>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {ARTICLES.map((a) => (
              <article
                key={a.title}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                  <span style={{ color: "#6B1A2A", fontWeight: 700, background: "#F5E6E9", padding: "2px 8px", borderRadius: "4px" }}>
                    {a.category}
                  </span>
                  <span style={{ color: "#888" }}>{a.date}</span>
                </div>
                <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#2D1018", margin: 0, lineHeight: 1.4 }}>
                  {a.title}
                </h2>
                <p style={{ fontSize: "0.84375rem", color: "#555", margin: 0, lineHeight: 1.6 }}>{a.desc}</p>
                <Link
                  href="/about"
                  style={{
                    color: "#6B1A2A",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    marginTop: "auto",
                    paddingTop: "0.5rem",
                  }}
                >
                  Read More &rarr;
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <CompactFooter />
    </>
  );
}
