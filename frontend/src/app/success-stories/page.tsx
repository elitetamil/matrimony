"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";
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
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "1.5rem 0 4rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.25rem" }}>
          {/* Back Button */}
          <div style={{ marginBottom: "1rem" }}>
            <BackButton style={{ background: "#fff", border: "1px solid #E5D5C5", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
          </div>

          {/* Hero Banner Card */}
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
                <Heart size={28} className="fill-white text-white" />
              </div>
              <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#fff", fontFamily: "var(--font-sans)" }}>
                Success Stories
              </h1>
            </div>
            <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.9)", fontSize: "1.0625rem", lineHeight: 1.65, maxWidth: "750px", fontWeight: 400 }}>
              Real Couples. Real Happiness. Inspiring love stories from members who found their soulmates on Elite Tamil Matrimony.
            </p>
            <div style={{ marginTop: "1.25rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.85)", fontWeight: 500 }}>
              <span>💖 500+ Happy Unions</span>
              <span>✨ Verified Member Stories</span>
              <span>💍 Global Tamil Couples</span>
            </div>
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
                      background: "#fff",
                      border: "1px solid #E5D5C5",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    {/* Photo Frame with Fixed Size & Aspect Ratio matching Reference Image */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "240px",
                        overflow: "hidden",
                        background: "#2A0A10",
                        flexShrink: 0,
                      }}
                    >
                      {story.photo_url ? (
                        <img
                          src={story.photo_url}
                          alt={story.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            objectPosition: "center",
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

                      {/* Dark Gradient Overlay with Couple's Name at bottom-left */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)",
                          display: "flex",
                          alignItems: "flex-end",
                          padding: "1.125rem 1.25rem",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "1.0625rem",
                            fontFamily: "var(--font-sans)",
                            lineHeight: 1.3,
                            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                          }}
                        >
                          {story.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div
                      style={{
                        padding: "1.25rem",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        background: "#fff",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.9375rem",
                          color: "#222222",
                          lineHeight: 1.6,
                          margin: "0 0 0.75rem",
                          fontFamily: "var(--font-sans)",
                          ...(expandedIds.has(story.id) ? {} : {
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }),
                        }}
                      >
                        {story.story}
                      </p>
                      <button
                        onClick={() => toggleExpand(story.id)}
                        style={{
                          background: "none", border: "none", padding: 0,
                          color: "#6B1A2A", fontWeight: 700, fontSize: "0.8125rem",
                          cursor: "pointer", fontFamily: "var(--font-sans)",
                          marginBottom: "0.5rem",
                          textDecoration: "underline",
                        }}
                      >
                        {expandedIds.has(story.id) ? "Show less" : "Read more..."}
                      </button>

                      {/* Location & Rating Stars */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderTop: "1px solid #F4EBE2",
                          paddingTop: "0.875rem",
                          marginTop: "auto",
                        }}
                      >
                        {story.city ? (
                          <span
                            style={{
                              fontSize: "0.78125rem",
                              color: "#666",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: 500,
                            }}
                          >
                            <MapPin size={13} style={{ color: "#6B1A2A" }} />
                            {story.city}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.78125rem", color: "#666", fontWeight: 500 }}>
                            Verified Couple
                          </span>
                        )}
                        <div style={{ display: "flex", gap: "2px" }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} size={13} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
                          ))}
                        </div>
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
                Write Your Own Love Story
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "#555", margin: "0 0 1.25rem" }}>
                Find someone who shares your values, culture, and life goals.
              </p>
              <Link
                href="/register"
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
                }}
              >
                Register Free <ArrowRight size={16} />
              </Link>
            </section>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        .success-stories-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .success-stories-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
        }
        @media (max-width: 600px) {
          .success-stories-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }
        .story-card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        @media (hover: hover) {
          .story-card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 28px rgba(107, 26, 42, 0.12) !important;
          }
        }
      `}</style>
    </>
  );
}
