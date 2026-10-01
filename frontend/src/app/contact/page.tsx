"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import StaticPageHeader from "@/components/ui/StaticPageHeader";
import Footer from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast.success("Message sent! We'll reply within 24 hours.");
  };

  const CONTACT_INFO = [
    {
      icon: <Mail size={22} />,
      label: "Email Support",
      value: "support@elitetamilmatrimony.com",
      href: "mailto:support@elitetamilmatrimony.com",
      sub: "We reply within 24 hours",
      color: "#6B1A2A",
      bg: "#F5E6E9",
    },
    {
      icon: <Phone size={22} />,
      label: "Phone Support",
      value: "+91 93606 53547",
      href: "tel:+919360653547",
      sub: "Mon–Sat, 9am–6pm IST",
      color: "#2E7D32",
      bg: "#E6F7EC",
    },
    {
      icon: <MapPin size={22} />,
      label: "Office Address",
      value: "Sona Incubation Foundation, Sona College of Technology",
      sub: "Junction Main Rd, Salem, Tamil Nadu 636005",
      color: "#C8973A",
      bg: "#FBF6EC",
    },
    {
      icon: <Clock size={22} />,
      label: "Support Hours",
      value: "Monday – Saturday",
      sub: "9:00 AM – 6:00 PM IST",
      color: "#6B1A2A",
      bg: "#F5E6E9",
    },
  ];

  return (
    <>
      <Navbar />
      <main style={{ background: "#FAF4F0", minHeight: "calc(100vh - 120px)", padding: "0 0 4rem" }}>
        <StaticPageHeader 
          title="✉ Contact Us" 
          subtitle="Our team is here to help. Reach out with questions, feedback, or support requests." 
        />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1.25rem 0" }}>

          {/* Intro Badges */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.875rem", color: "#6B1A2A", fontWeight: 700, marginBottom: "1.5rem", background: "#fff", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #E5D5C5", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>📞 24x7 Customer Support</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>📧 Fast Email Response</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>📍 Salem Headquarters</span>
          </div>

          {/* Main 2-Column Content Grid */}
          <div className="contact-layout-grid">
            {/* Left Column: Contact Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {CONTACT_INFO.map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#fff",
                    border: "1px solid #E5D5C5",
                    borderRadius: "14px",
                    padding: "1.25rem 1.5rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1.125rem",
                  }}
                >
                  {/* Icon Wrapper */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: item.bg,
                      color: item.color,
                      marginTop: "2px",
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Text Information */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#6B1A2A",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "4px",
                      }}
                    >
                      {item.label}
                    </div>
                    {item.href ? (
                      <a
                        href={item.href}
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          color: "#111111",
                          textDecoration: "none",
                          lineHeight: 1.4,
                          display: "block",
                          wordBreak: "break-word",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#6B1A2A")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#111111")}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <div
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          color: "#111111",
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.value}
                      </div>
                    )}
                    <div style={{ fontSize: "0.8125rem", color: "#666666", marginTop: "4px", lineHeight: 1.45 }}>
                      {item.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Contact Message Form */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #E5D5C5",
                borderRadius: "14px",
                padding: "2rem 2.25rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              {submitted ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "#E6F7EC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1.25rem",
                      color: "#2E7D32",
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111", margin: "0 0 0.5rem" }}>
                    Message Sent!
                  </h3>
                  <p style={{ fontSize: "0.9375rem", color: "#555", lineHeight: 1.6, marginBottom: "1.75rem", maxWidth: "420px", margin: "0 auto 1.75rem" }}>
                    Thank you for reaching out. Our support team will reply to <strong>{form.email}</strong> within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
                    }}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #6B1A2A",
                      color: "#6B1A2A",
                      padding: "0.625rem 1.75rem",
                      borderRadius: "30px",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "#6B1A2A",
                      margin: "0 0 1.5rem",
                      paddingBottom: "0.75rem",
                      borderBottom: "1.5px solid #F8ECE8",
                    }}
                  >
                    Send us a message
                  </h2>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
                    {/* Full Name & Email */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600, color: "#333", fontSize: "0.8125rem" }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="Your name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem 1rem",
                            border: "1.5px solid #E5D5C5",
                            borderRadius: "8px",
                            fontSize: "0.9375rem",
                            outline: "none",
                            background: "#fff",
                          }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600, color: "#333", fontSize: "0.8125rem" }}>
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          className="form-input"
                          placeholder="your@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem 1rem",
                            border: "1.5px solid #E5D5C5",
                            borderRadius: "8px",
                            fontSize: "0.9375rem",
                            outline: "none",
                            background: "#fff",
                          }}
                        />
                      </div>
                    </div>

                    {/* Phone & Subject */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600, color: "#333", fontSize: "0.8125rem" }}>
                          Phone (optional)
                        </label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="+91 XXXXX XXXXX"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem 1rem",
                            border: "1.5px solid #E5D5C5",
                            borderRadius: "8px",
                            fontSize: "0.9375rem",
                            outline: "none",
                            background: "#fff",
                          }}
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontWeight: 600, color: "#333", fontSize: "0.8125rem" }}>
                          Subject
                        </label>
                        <select
                          className="form-select"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem 1rem",
                            border: "1.5px solid #E5D5C5",
                            borderRadius: "8px",
                            fontSize: "0.9375rem",
                            outline: "none",
                            background: "#fff",
                          }}
                        >
                          <option value="">Select a topic</option>
                          <option value="account">Account Issues</option>
                          <option value="billing">Billing &amp; Subscription</option>
                          <option value="profile">Profile Help</option>
                          <option value="safety">Safety &amp; Report</option>
                          <option value="verification">Verification</option>
                          <option value="feedback">Feedback</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, color: "#333", fontSize: "0.8125rem" }}>
                        Message *
                      </label>
                      <textarea
                        required
                        className="form-input"
                        rows={5}
                        placeholder="Describe your query or feedback in detail..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "0.75rem 1rem",
                          border: "1.5px solid #E5D5C5",
                          borderRadius: "8px",
                          fontSize: "0.9375rem",
                          outline: "none",
                          background: "#fff",
                          minHeight: "130px",
                          resize: "vertical",
                        }}
                      />
                      <div style={{ fontSize: "0.75rem", color: "#888", textAlign: "right", marginTop: "4px" }}>
                        {form.message.length}/1000
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        background: "#6B1A2A",
                        color: "#fff",
                        padding: "0.875rem 2rem",
                        borderRadius: "30px",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.15s, transform 0.1s",
                        boxShadow: "0 4px 12px rgba(107, 26, 42, 0.2)",
                        marginTop: "0.5rem",
                      }}
                    >
                      {loading ? (
                        <>
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              border: "2.5px solid rgba(255,255,255,0.3)",
                              borderTopColor: "#fff",
                              borderRadius: "50%",
                              animation: "spin 0.75s linear infinite",
                            }}
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        .contact-layout-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 1.75rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .contact-layout-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
