"use client";

import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";
import ProfileCard from "@/components/ui/ProfileCard";
import { BookmarkPlus, Trash2, Heart } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { getShortlistedProfiles, removeShortlist, type RegisteredUser } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

function ShortlistedContent() {
  const { user, loading: authLoading } = useAuth();
  const [shortlisted, setShortlisted] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadShortlisted();
  }, [user]);

  const loadShortlisted = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profiles = await getShortlistedProfiles(user.id);
      setShortlisted(profiles);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load shortlisted profiles");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!user) return;
    try {
      await removeShortlist(user.id, id);
      setShortlisted((v) => v.filter((p) => p.id !== id));
      toast.success("Removed from shortlist");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove shortlist");
    }
  };

  const handleClearAll = async () => {
    if (!user) return;
    try {
      for (const p of shortlisted) {
        await removeShortlist(user.id, p.id);
      }
      setShortlisted([]);
      toast.success("Shortlist cleared");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear shortlists");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ background: "var(--cream-bg)", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div>Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ background: "var(--cream-bg)", minHeight: "100vh" }}>
        <div className="container" style={{ paddingTop: "1.25rem", paddingBottom: "2rem" }}>
          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ marginTop: "14px" }}><BackButton /></div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <BookmarkPlus size={18} style={{ color: "var(--gold-accent)" }} />
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--gold-dark)" }}>
                    Saved Profiles
                  </span>
                </div>
                <h1 style={{ fontSize: "clamp(1.125rem, 4vw, 1.5rem)", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Shortlisted
              </h1>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                {shortlisted.length} profile{shortlisted.length !== 1 ? "s" : ""} saved
              </p>
            </div>
            </div>
            {shortlisted.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "none", border: "1px solid #e0e0e0", borderRadius: "20px",
                  padding: "0.4375rem 0.875rem", cursor: "pointer",
                  fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "var(--font-sans)",
                  minHeight: "40px", touchAction: "manipulation",
                }}
              >
                <Trash2 size={14} />
                Clear all
              </button>
            )}
          </div>

          {shortlisted.length === 0 ? (
            <div style={{
              background: "var(--bg-white)", borderRadius: "var(--radius-xl)",
              padding: "3rem 1rem", textAlign: "center",
              border: "1px solid var(--border-light)",
            }}>
              <BookmarkPlus size={44} style={{ color: "var(--border)", margin: "0 auto 1rem" }} />
              <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem", fontSize: "1rem" }}>
                No shortlisted profiles
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
                Save profiles you like and come back to review them.
              </p>
              <Link href="/matches" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Heart size={16} />
                Browse Matches
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.75rem",
              }}
            >
              <style>{`
                @media (max-width: 359px) { .shortlisted-grid { grid-template-columns: 1fr !important; } }
                @media (min-width: 640px) { .shortlisted-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 1rem !important; } }
                @media (min-width: 1024px) { .shortlisted-grid { grid-template-columns: repeat(4, 1fr) !important; } }
              `}</style>
              {shortlisted.map((profile) => (
                <div key={profile.id} style={{ position: "relative" }}>
                  {/* @ts-ignore */}
                  <ProfileCard profile={profile} variant="full" from="shortlisted" />
                  <button
                    onClick={() => remove(profile.id)}
                    style={{
                      position: "absolute", top: "8px", left: "8px",
                      width: "36px", height: "36px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(255,255,255,0.95)", boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                      border: "none", cursor: "pointer", color: "#888",
                      touchAction: "manipulation",
                    }}
                    aria-label="Remove from shortlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function ShortlistedGuard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <>
        <Navbar />
        <main style={{ background: "var(--cream-bg)", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div>Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  return <ShortlistedContent />;
}

export default function ShortlistedPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "var(--cream-bg)", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading...
      </div>
    }>
      <ShortlistedGuard />
    </Suspense>
  );
}
