"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import StaticPageHeader from "@/components/ui/StaticPageHeader";
import CompactFooter from "@/components/layout/CompactFooter";
import { Search, ChevronDown, MessageCircle, HelpCircle, ShieldCheck, CreditCard, UserCircle, Heart } from "lucide-react";
import Link from "next/link";

// ── NEW PREMIUM FAQ CONTENT ───────────────────────────────────────
const FAQ_CATEGORIES = [
  { id: "all", label: "All Questions", icon: HelpCircle },
  { id: "registration", label: "Registration & Profile", icon: UserCircle },
  { id: "matches", label: "Matches & Search", icon: Heart },
  { id: "premium", label: "Premium Memberships", icon: CreditCard },
  { id: "safety", label: "Trust & Safety", icon: ShieldCheck },
];

const NEW_FAQ_DATA = [
  // ── Registration & Profile ──
  {
    category: "registration",
    q: "How do I create a profile on Elite Tamil Matrimony?",
    a: "Creating a profile is completely free and takes only a few minutes. Click on 'Register' at the top right, fill in your basic details, verify your mobile number via OTP, and complete your profile by adding your education, profession, family background, and partner preferences.",
  },
  {
    category: "registration",
    q: "Can I register a profile on behalf of my son, daughter, or sibling?",
    a: "Yes! During registration, you can choose the 'Profile Created For' option and select Son, Daughter, Brother, Sister, or Relative. This helps other members know they are interacting with a parent or guardian.",
  },
  {
    category: "registration",
    q: "Why is my profile marked as 'Unverified'?",
    a: "To ensure a safe and trustworthy community, we verify all profiles. You can verify your profile by submitting a valid Government ID (Aadhaar, Passport, etc.) in the 'Settings' section. Once our team approves it, a 'Verified' badge will appear on your profile.",
  },
  {
    category: "registration",
    q: "How do I temporarily hide or permanently delete my profile?",
    a: "If you have found your life partner or wish to take a break, you can hide or delete your profile from the 'Settings' page. Hiding your profile will remove it from search results and recommendations, while deleting will permanently erase your data.",
  },

  // ── Matches & Search ──
  {
    category: "matches",
    q: "How does the 'Daily Recommendations' feature work?",
    a: "Our advanced algorithm analyzes your partner preferences (age, height, religion, education, etc.) and suggests a curated list of highly compatible profiles every day. You have 24 hours to review and send interest to your daily recommendations.",
  },
  {
    category: "matches",
    q: "What happens when I 'Shortlist' a profile?",
    a: "Shortlisting a profile is a great way to save them for later review without alerting them immediately. You can view all your shortlisted profiles from the sidebar in the Matches section.",
  },
  {
    category: "matches",
    q: "Why am I not getting enough relevant matches?",
    a: "If your matches are too few, try broadening your 'Partner Preferences'. Being too strict with criteria like exact height, specific sub-caste, or income can limit your results. Make sure your own profile is 100% complete and includes a clear photo to attract more interests.",
  },
  {
    category: "matches",
    q: "How can I express interest in someone?",
    a: "When viewing a profile or a match card, simply click the 'Send Interest' button. The member will receive a notification. If they accept your interest, you can start messaging or view their contact details.",
  },

  // ── Premium Memberships ──
  {
    category: "premium",
    q: "What is the difference between a Free and a Premium membership?",
    a: "Free members can create a profile, search for matches, and receive interests. Premium members (Gold, Diamond, Platinum) unlock exclusive features such as initiating messages, viewing hidden contact numbers, prioritizing their profile in search results, and accessing advanced horoscope matching.",
  },
  {
    category: "premium",
    q: "How many contact reveals do I get?",
    a: "Contact limits depend on your membership tier. For instance, the Gold plan may offer up to 40 contact reveals per month, while higher tiers like Platinum offer unlimited contact access. You can track your usage in the Profile view section.",
  },
  {
    category: "premium",
    q: "What are the 'Prime' and 'Till U Marry' plans?",
    a: "'Prime' plans offer priority customer support and a dedicated relationship manager to assist in your search. The 'Till U Marry' plan is a specialized subscription that remains active without renewals until you successfully find your life partner through our platform.",
  },
  {
    category: "premium",
    q: "Can I upgrade my membership plan later?",
    a: "Yes, you can seamlessly upgrade your plan at any time. If you upgrade while an existing subscription is active, the pro-rated value of your current plan will be adjusted against the new plan's cost.",
  },

  // ── Trust & Safety ──
  {
    category: "safety",
    q: "Is my contact number visible to everyone?",
    a: "No! Your privacy is our top priority. By default, your contact number is hidden from free members and search engines. Only Premium members who use one of their 'Contact Reveals' can view your number, and you will be notified when someone views it.",
  },
  {
    category: "safety",
    q: "Who can see my profile photos?",
    a: "Your photos are visible to registered and logged-in members of Elite Tamil Matrimony. For added privacy, you can configure your Photo Privacy settings to show your photos only to members you have sent or accepted interest from.",
  },
  {
    category: "safety",
    q: "What should I do if I encounter a fake or suspicious profile?",
    a: "If you notice a profile with inappropriate content, stock photos, or someone asking for money, please click the 'Report / Block' option found on their profile or in the messaging menu. Our Trust & Safety team will investigate and take immediate action.",
  },
];

// ── COMPONENT ───────────────────────────────────────────────────
export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
            if (typeof window !== "undefined") {
      const resetScroll = () => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const vp = document.getElementById("app-scroll-viewport");
        if (vp) vp.scrollTop = 0;
      };
      resetScroll();
      const t1 = setTimeout(resetScroll, 10);
      const t2 = setTimeout(resetScroll, 50);
      const t3 = setTimeout(() => { document.documentElement.style.scrollBehavior = ""; }, 100);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [activeCategory]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Filter logic
  const filteredFAQs = NEW_FAQ_DATA.filter((faq) => {
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader 
          title="❓ FAQ" 
          subtitle="Frequently Asked Questions" 
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.25rem 0" }}>

          {/* Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              borderRadius: "50px",
              padding: "0.5rem 1.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "1px solid #E5D5C5",
              marginBottom: "2rem",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            className="faq-search-wrapper"
          >
            <Search size={20} color="#888" />
            <input
              type="text"
              placeholder="Search for answers (e.g. 'membership', 'hide profile')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "0.75rem 1rem",
                fontSize: "1rem",
                fontFamily: "var(--font-sans)",
                background: "transparent",
                color: "#111",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexDirection: "row" }} className="faq-layout">
            
            {/* ── SIDEBAR TABS ── */}
            <div
              className="faq-sidebar"
              style={{
                width: "280px",
                flexShrink: 0,
                background: "#fff",
                borderRadius: "16px",
                padding: "1rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "1px solid #E8D5B7",
                position: "sticky",
                top: "100px",
              }}
            >
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0.5rem 1rem 1rem" }}>
                Categories
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {FAQ_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.id); setOpenIndex(null); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        width: "100%",
                        padding: "0.875rem 1rem",
                        borderRadius: "10px",
                        border: "none",
                        background: isActive ? "#FFF0F5" : "transparent",
                        color: isActive ? "#6B1A2A" : "#444",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.9375rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                        fontFamily: "var(--font-sans)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "#fafafa";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <Icon size={18} color={isActive ? "#6B1A2A" : "#888"} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── FAQ LIST ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              
              {filteredFAQs.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: "16px", padding: "4rem 2rem", textAlign: "center", border: "1px solid #e0e0e0" }}>
                  <div style={{ width: "64px", height: "64px", background: "#f5f5f5", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                    <Search size={28} color="#aaa" />
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111", marginBottom: "0.5rem" }}>No results found</h3>
                  <p style={{ color: "#888" }}>We couldn't find any FAQs matching "{searchQuery}".</p>
                  <button onClick={() => { setSearchQuery(""); setActiveCategory("all"); }} className="btn btn-outline" style={{ marginTop: "1.5rem" }}>
                    View all questions
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {filteredFAQs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                      <div
                        key={index}
                        style={{
                          background: "#fff",
                          borderRadius: "12px",
                          border: isOpen ? "1px solid #C8973A" : "1px solid #E8D5B7",
                          boxShadow: isOpen ? "0 4px 20px rgba(200,151,58,0.1)" : "0 2px 8px rgba(0,0,0,0.02)",
                          overflow: "hidden",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : index)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1.25rem 1.5rem",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            color: isOpen ? "#6B1A2A" : "#111",
                            fontWeight: 700,
                            fontSize: "1.0625rem",
                            fontFamily: "var(--font-sans)",
                          }}
                        >
                          <span style={{ paddingRight: "1rem", lineHeight: 1.4 }}>{faq.q}</span>
                          <div
                            style={{
                              background: isOpen ? "#FFF0F5" : "#f9f9f9",
                              borderRadius: "50%",
                              width: "32px",
                              height: "32px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                              transition: "transform 0.3s ease, background 0.3s ease",
                            }}
                          >
                            <ChevronDown size={18} color={isOpen ? "#6B1A2A" : "#888"} />
                          </div>
                        </button>
                        
                        <div
                          style={{
                            maxHeight: isOpen ? "500px" : "0",
                            opacity: isOpen ? 1 : 0,
                            overflow: "hidden",
                            transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
                          }}
                        >
                          <div
                            style={{
                              padding: "0 1.5rem 1.5rem",
                              color: "#444",
                              fontSize: "0.9375rem",
                              lineHeight: 1.6,
                              borderTop: "1px solid transparent",
                            }}
                          >
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── STILL NEED HELP? ── */}
              <div
                style={{
                  marginTop: "3rem",
                  background: "linear-gradient(135deg, #fff 0%, #FFF8F0 100%)",
                  borderRadius: "16px",
                  padding: "2rem",
                  border: "1px solid #E8D5B7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111", margin: "0 0 0.5rem" }}>Still have questions?</h3>
                  <p style={{ color: "#666", margin: 0, fontSize: "0.9375rem", maxWidth: "400px" }}>
                    Can't find the answer you're looking for? Our dedicated support team is here to help you 24/7.
                  </p>
                </div>
                <Link
                  href="/contact"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#6B1A2A",
                    color: "#fff",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "30px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    boxShadow: "0 4px 12px rgba(107, 26, 42, 0.2)",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <MessageCircle size={18} />
                  Contact Support
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      <style>{`
        .faq-search-wrapper:focus-within {
          box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .faq-layout {
            flex-direction: column !important;
          }
          .faq-sidebar {
            width: 100% !important;
            position: relative !important;
            top: 0 !important;
            margin-bottom: 1rem;
          }
        }
      `}</style>
      <CompactFooter />
    </>
  );
}
