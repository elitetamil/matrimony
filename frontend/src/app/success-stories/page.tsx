"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import StaticPageHeader from "@/components/ui/StaticPageHeader";
import CompactFooter from "@/components/layout/CompactFooter";
import { Star, Heart, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface SuccessStory {
  id: string;
  name: string;
  city?: string;
  married?: string;
  story: string;
  photo_url?: string;
  is_visible?: boolean;
  created_at?: string;
}

const DEFAULT_STORIES: SuccessStory[] = [
  {
    id: "default-1",
    name: "Mr. Velmurugan & Mrs. Velmurugan",
    city: "Chennai, Tamil Nadu",
    married: "September 2026",
    story: "Pilot, son of a retired Senior Bureaucrat and married in Chennai with the blessings of both families.",
    photo_url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "default-2",
    name: "Mr. Karthik & Mrs. Anitha",
    city: "Coimbatore, Tamil Nadu",
    married: "August 2026",
    story: "Software Architect & Doctor who found their perfect alignment of values, family traditions, and life goals through Elite Tamil Matrimony.",
    photo_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "default-3",
    name: "Mr. Sundar & Mrs. Priyadarshini",
    city: "Madurai, Tamil Nadu",
    married: "July 2026",
    story: "A beautiful union of two traditional Tamil families from Madurai, uniting culture, heritage, and modern aspirations.",
    photo_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
  },
];

export default function SuccessStoriesPage() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    async function loadStories() {
      try {
        const { data, error } = await supabase
          .from("success_stories")
          .select("*")
          .eq("is_visible", true)
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          setStories(data);
        } else {
          setStories(DEFAULT_STORIES);
        }
      } catch {
        setStories(DEFAULT_STORIES);
      } finally {
        setLoading(false);
      }
    }
    loadStories();
  }, []);

  const displayStories = stories.length > 0 ? stories : DEFAULT_STORIES;

  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader
          title="💕 Success Stories"
          subtitle="💍 Where New Journeys Begin"
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.25rem 0" }}>

          {/* Introductory Content Card */}
          <div style={{ marginBottom: "1.5rem" }}>
            <section
              style={{
                background: "#fff",
                border: "1px solid #E5D5C5",
                borderRadius: "14px",
                padding: "1.75rem 2rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <p style={{ fontSize: "0.9375rem", color: "#333", lineHeight: 1.75, marginBottom: "0" }}>
                Every successful relationship begins with a meaningful connection. At Elite Tamil Matrimony, we are proud to be part of the journey that brings two individuals and their families together. From the first profile view to the first conversation, every connection has its own story. Some begin with shared interests, some through family introductions, and others simply with a meaningful conversation.
              </p>
            </section>
          </div>

          {/* Stories Grid / Content Area */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {loading ? (
              <div className="success-stories-grid">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1px solid #E5D5C5",
                      borderRadius: "16px",
                      height: "360px",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="success-stories-grid">
                {displayStories.map((story) => (
                  <div
                    key={story.id}
                    className="story-card-hover"
                    style={{
                      background: "transparent",
                      borderRadius: "32px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                  >
                    {/* Photo Frame with Editorial Style */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "210px",
                        overflow: "hidden",
                        background: "#EAE0D5",
                        flexShrink: 0,
                        borderRadius: "20px 20px 0 0",
                      }}
                    >
                      {story.photo_url ? (
                        <img
                          src={story.photo_url}
                          alt={story.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "top center",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "linear-gradient(135deg, #6B1A2A 0%, #4A0F1C 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Heart size={44} className="fill-white text-white opacity-75" />
                        </div>
                      )}

                      {/* Badge overlay on image */}
                      <div style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.6875rem", fontWeight: 700, color: "#6B1A2A", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        ✨ Success Story
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div
                      style={{
                        padding: "1.75rem 2rem",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        background: "#fff",
                        zIndex: 1,
                        borderRadius: "0 0 24px 24px",
                        boxShadow: "0 8px 30px rgba(107, 26, 42, 0.06)",
                        border: "1px solid #F4EBE2",
                        borderTop: "none",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 0.375rem",
                          color: "#6B1A2A",
                          fontWeight: 800,
                          fontSize: "1.1875rem",
                          fontFamily: "var(--font-sans)",
                          lineHeight: 1.3,
                        }}
                      >
                        {story.name}
                      </h3>

                      <div style={{ fontSize: "0.8125rem", color: "#D4A840", fontWeight: 700, marginBottom: "1rem", letterSpacing: "0.03em" }}>
                        A beautiful beginning...
                      </div>

                      <p
                        style={{
                          fontSize: "0.9375rem",
                          color: "#444",
                          lineHeight: 1.7,
                          margin: "0 0 1.25rem",
                          fontFamily: "var(--font-sans)",
                          ...(expandedIds.has(story.id) ? {} : {
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }),
                        }}
                      >
                        {story.story}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "0.5rem" }}>
                        <button
                          onClick={() => toggleExpand(story.id)}
                          style={{
                            background: "none", border: "none", padding: 0,
                            color: "#6B1A2A", fontWeight: 700, fontSize: "0.875rem",
                            cursor: "pointer", fontFamily: "var(--font-sans)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "none",
                          }}
                        >
                          {expandedIds.has(story.id) ? "Show less" : "Read Story →"}
                        </button>

                        {(story.city || story.married) && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            {story.city && (
                              <span style={{ fontSize: "0.75rem", color: "#888", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                                <MapPin size={12} style={{ color: "#D4A840" }} />
                                {story.city}
                              </span>
                            )}
                            {story.married && (
                              <span style={{ fontSize: "0.6875rem", color: "#999", fontWeight: 500, fontStyle: "italic", marginTop: "2px" }}>
                                {story.married}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Call to Action Card */}
            <section
              style={{
                background: "#fff",
                border: "1px solid #E5D5C5",
                borderRadius: "16px",
                padding: "2.25rem 2rem",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#6B1A2A", margin: "0 0 0.5rem" }}>
                Your story could be our next beautiful success story.
              </h3>
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
                  boxShadow: "0 2px 8px rgba(107, 26, 42, 0.2)",
                  marginTop: "1.25rem",
                }}
              >
                Share Your Story <ArrowRight size={16} />
              </Link>
            </section>
          </div>
        </div>
      </main>
      <CompactFooter />

      <style>{`
        .success-stories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          padding-bottom: 2rem;
        }
        .story-card-hover {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 20px;
          background: #fff;
        }
        @media (min-width: 900px) {
          .success-stories-grid > div:hover {
            transform: translateY(-6px);
          }
        }
        @media (max-width: 899px) and (min-width: 600px) {
          .success-stories-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
        }
        @media (max-width: 599px) {
          .success-stories-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
            padding-bottom: 0;
          }
          .success-stories-grid > div:hover {
            transform: translateY(-3px);
          }
        }
      `}</style>
    </>
  );
}
