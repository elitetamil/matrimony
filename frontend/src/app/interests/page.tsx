"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import CompactFooter from "@/components/layout/CompactFooter";
import PlanTabs from "@/components/ui/PlanTabs";

import { useAuth } from "@/context/AuthContext";
import {
  getInterestsReceived,
  getInterestsSent,
  acceptInterest,
  declineInterest,
  withdrawInterest,
  sendInterest,
  type InterestRow,
} from "@/lib/auth-store";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Search, MoreVertical, MessageSquare, CheckCircle, XCircle, Undo2 } from "lucide-react";

type ReceivedFilter = "all" | "pending" | "accepted" | "declined";
type SentFilter = "all" | "pending" | "accepted" | "declined";
type ActiveSection = "received" | "sent";

// ── SVG Avatar (no stock photos) ─────────────────────────────────────
function GenderAvatar({ gender, size = 200 }: { gender?: string; size?: number }) {
  return (
    <div style={{
      width: "148px", height: `${size}px`,
      background: "#DFDFDF",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      flexShrink: 0,
      overflow: "hidden"
    }}>
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" style={{ marginBottom: "-6px" }}>
        <circle cx="12" cy="8" r="5" fill="#FFFFFF" />
        <path d="M4 22c0-4.5 3.5-8 8-8s8 3.5 8 8" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

// ── Format date ───────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
    .replace(/ /g, " ");
}

// ── Paid Member badge ─────────────────────────────────────────────────
function PaidBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: "#fff3e0",
        border: "1px solid var(--primary)",
        borderRadius: "3px",
        padding: "1px 7px",
        fontSize: "0.6875rem",
        fontWeight: 700,
        color: "var(--primary)",
      }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--primary)">
        <path d="M12 1l3 8H23l-7 5 3 8-7-5-7 5 3-8-7-5h8z"/>
      </svg>
      Paid Member
    </span>
  );
}

// ── Online dot ────────────────────────────────────────────────────────
function OnlineDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#4CAF50",
        marginRight: "3px",
        verticalAlign: "middle",
      }}
    />
  );
}

// ── Interest Card — Received ──────────────────────────────────────────
function ReceivedCard({
  row,
  idx,
  onAccept,
  onDecline,
  loading,
}: {
  row: InterestRow;
  idx: number;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}) {
  const p = row.profile;
  if (!p) return null;

  const age = p.dob
    ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
  const photo = p.photoUrl || null;
  const profileCode = `M${p.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const attrs = [
    age > 0 ? `${age} yrs` : null,
    p.height,
    p.caste,
    p.education,
    p.occupation,
    p.income ? `₹ ${p.income}` : null,
    p.city,
  ].filter(Boolean);

  const genderPronoun = p.gender === "male" ? "He" : "She";

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        display: "flex",
        gap: 0,
        overflow: "hidden",
        marginBottom: "1rem",
        position: "relative",
      }}
    >
      {/* Photo */}
      <Link href={`/profile/${p.id}?from=interests`} style={{ display: "block", flexShrink: 0, width: "148px" }}>
        {photo
          ? <img src={photo} alt={p.name} style={{ width: "148px", height: "200px", objectFit: "cover", objectPosition: "top", display: "block" }} />
          : <GenderAvatar gender={p.gender} size={200} />}
      </Link>

      {/* Content */}
      <div style={{ flex: 1, padding: "0.875rem 1rem", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top: badge + 3-dot menu */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
          <PaidBadge />
          <button
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#aaa" }}
            title="More options"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Name */}
        <Link
          href={`/profile/${p.id}?from=interests`}
          style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#111", textDecoration: "none", marginBottom: "2px" }}
        >
          {p.name}
        </Link>

        {/* Profile code + online */}
        <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.5rem" }}>
          {profileCode} &nbsp;|&nbsp; <OnlineDot /><span style={{ color: "#4CAF50", fontWeight: 600 }}>Online</span>
        </div>

        {/* Attributes */}
        <p style={{ fontSize: "0.8125rem", color: "#555", margin: "0 0 0.625rem", lineHeight: 1.5 }}>
          {attrs.map((a, i) => (
            <span key={i}>
              {a}
              {i < attrs.length - 1 && <span style={{ color: "#ccc", margin: "0 5px" }}>•</span>}
            </span>
          ))}
        </p>

        {/* "He/She sent you an interest" */}
        {row.status === "pending" && (
          <p style={{ fontSize: "0.8125rem", color: "#555", marginBottom: "4px" }}>
            <strong>{genderPronoun} sent you an interest</strong> - {fmtDate(row.createdAt)}
          </p>
        )}
        {row.status === "pending" && (
          <p style={{ fontSize: "0.75rem", color: "#888", marginBottom: "0.75rem" }}>
            Accept {genderPronoun.toLowerCase()} interest to start a conversation
          </p>
        )}
        {row.status === "accepted" && (
          <p style={{ fontSize: "0.8125rem", color: "#2e7d32", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}>
            <CheckCircle size={14} /> Interest Accepted
          </p>
        )}
        {row.status === "declined" && (
          <p style={{ fontSize: "0.8125rem", color: "#c62828", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}>
            <XCircle size={14} /> Interest Declined
          </p>
        )}

        {/* Actions */}
        {row.status === "pending" && (
          <div style={{ display: "flex", gap: "0.625rem", marginTop: "auto" }}>
            <button
              onClick={onDecline}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "0.4375rem 1.125rem",
                border: "1.5px solid #ccc",
                borderRadius: "20px",
                background: "#fff",
                color: "#555",
                fontSize: "0.8125rem", fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Decline
            </button>
            <button
              onClick={onAccept}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "0.4375rem 1.25rem",
                border: "none",
                borderRadius: "20px",
                background: "var(--primary)",
                color: "#fff",
                fontSize: "0.8125rem", fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              Accept Interest
            </button>
          </div>
        )}

        {row.status === "accepted" && (
          <div style={{ display: "flex", gap: "0.625rem", marginTop: "auto" }}>
            <Link
              href={`/messages?to=${p.id}`}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "0.4375rem 1.25rem",
                border: "none", borderRadius: "20px",
                background: "var(--primary)", color: "#fff",
                fontSize: "0.8125rem", fontWeight: 700,
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              <MessageSquare size={13} /> Send Message
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Interest Card — Sent ──────────────────────────────────────────────
function SentCard({
  row,
  idx,
  onWithdraw,
  loading,
}: {
  row: InterestRow;
  idx: number;
  onWithdraw: () => void;
  loading: boolean;
}) {
  const p = row.profile;
  if (!p) return null;

  const age = p.dob
    ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
  const photo = p.photoUrl || null;
  const profileCode = `M${p.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const attrs = [
    age > 0 ? `${age} yrs` : null,
    p.height,
    p.caste,
    p.education,
    p.occupation,
    p.income ? `₹ ${p.income}` : null,
    p.city,
  ].filter(Boolean);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        display: "flex",
        gap: 0,
        overflow: "hidden",
        marginBottom: "1rem",
        position: "relative",
      }}
    >
      {/* Photo */}
      <Link href={`/profile/${p.id}?from=interests`} style={{ display: "block", flexShrink: 0, width: "148px" }}>
        {photo
          ? <img src={photo} alt={p.name} style={{ width: "148px", height: "200px", objectFit: "cover", objectPosition: "top", display: "block" }} />
          : <GenderAvatar gender={p.gender} size={200} />}
      </Link>

      {/* Content */}
      <div style={{ flex: 1, padding: "0.875rem 1rem", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top: badge + 3-dot menu */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
          <PaidBadge />
          <button
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "#aaa" }}
            title="More options"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Name */}
        <Link
          href={`/profile/${p.id}?from=interests`}
          style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#111", textDecoration: "none", marginBottom: "2px" }}
        >
          {p.name}
        </Link>

        {/* Profile code */}
        <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.5rem" }}>
          {profileCode}
        </div>

        {/* Attributes */}
        <p style={{ fontSize: "0.8125rem", color: "#555", margin: "0 0 0.625rem", lineHeight: 1.5 }}>
          {attrs.map((a, i) => (
            <span key={i}>
              {a}
              {i < attrs.length - 1 && <span style={{ color: "#ccc", margin: "0 5px" }}>•</span>}
            </span>
          ))}
        </p>

        {/* Status info */}
        <p style={{ fontSize: "0.8125rem", color: "#555", marginBottom: "4px" }}>
          <strong>Interest sent</strong> — {fmtDate(row.createdAt)}
        </p>

        {row.status === "pending" && (
          <p style={{ fontSize: "0.75rem", color: "#888", marginBottom: "0.75rem" }}>
            Awaiting response
          </p>
        )}
        {row.status === "accepted" && (
          <p style={{ fontSize: "0.8125rem", color: "#2e7d32", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}>
            <CheckCircle size={14} /> Interest Accepted — You can now message each other
          </p>
        )}
        {row.status === "declined" && (
          <p style={{ fontSize: "0.8125rem", color: "#c62828", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "5px" }}>
            <XCircle size={14} /> Interest Declined
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.625rem", marginTop: "auto", flexWrap: "wrap" }}>
          {/* Message — only if accepted */}
          {row.status === "accepted" && (
            <Link
              href={`/messages?to=${p.id}`}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "0.4375rem 1.125rem",
                border: "none", borderRadius: "20px",
                background: "var(--primary)", color: "#fff",
                fontSize: "0.8125rem", fontWeight: 700,
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
              }}
            >
              <MessageSquare size={13} /> Send Message
            </Link>
          )}

          {/* View Profile */}
          <Link
            href={`/profile/${p.id}?from=interests`}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "0.4375rem 1.125rem",
              border: "1.5px solid #ccc",
              borderRadius: "20px",
              background: "#fff", color: "#444",
              fontSize: "0.8125rem", fontWeight: 600,
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            View Profile
          </Link>

          {/* Withdraw — only if pending */}
          {row.status === "pending" && (
            <button
              onClick={onWithdraw}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "0.4375rem 1rem",
                border: "1.5px solid #eee",
                borderRadius: "20px",
                background: "#fff", color: "#999",
                fontSize: "0.8125rem", fontWeight: 500,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "var(--font-sans)",
              }}
              title="Withdraw interest"
            >
              <Undo2 size={12} /> Withdraw
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", display: "flex", marginBottom: "1rem", overflow: "hidden", height: "200px" }}>
      <div style={{ width: "148px", background: "#f0f0f0", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ width: "80px", height: "18px", background: "#f0f0f0", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "180px", height: "22px", background: "#f0f0f0", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "60%", height: "14px", background: "#f0f0f0", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "80%", height: "14px", background: "#f0f0f0", borderRadius: "4px", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

// ── Sidebar link ──────────────────────────────────────────────────────
function SidebarLink({
  label,
  count,
  active,
  onClick,
  color,
}: {
  label: string;
  count?: number | null;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "5px",
        padding: "0.375rem 0.875rem",
        background: "none", border: "none",
        textAlign: "left", width: "100%",
        cursor: "pointer", fontFamily: "var(--font-sans)",
        fontSize: "0.875rem",
        fontWeight: active ? 700 : 400,
        color: color || (active ? "var(--primary)" : "#333"),
        borderLeft: active ? "3px solid var(--primary)" : "3px solid transparent",
        transition: "all 0.12s",
      }}
    >
      {label}
      {count !== undefined && (
        <span
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "18px", height: "18px",
            background: "var(--primary)", color: "#fff",
            borderRadius: "50%", fontSize: "0.625rem", fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {count || "--"}
        </span>
      )}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
function InterestsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Restore section/filter from sessionStorage
  const [section, setSection] = useState<ActiveSection>(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem("interests_section") as ActiveSection) || "received";
    }
    return "received";
  });
  const [receivedFilter, setReceivedFilter] = useState<ReceivedFilter>(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem("interests_receivedFilter") as ReceivedFilter) || "pending";
    }
    return "pending";
  });
  const [sentFilter, setSentFilter] = useState<SentFilter>(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem("interests_sentFilter") as SentFilter) || "all";
    }
    return "all";
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const [received, setReceived] = useState<InterestRow[]>([]);
  const [sent, setSent] = useState<InterestRow[]>([]);

  // Count cache — null means not yet loaded (show '--')
  const [receivedCounts, setReceivedCounts] = useState<{ all: number | null; pending: number | null; accepted: number | null; declined: number | null }>({ all: null, pending: null, accepted: null, declined: null });
  const [sentCounts, setSentCounts] = useState<{ all: number | null; pending: number | null; accepted: number | null; declined: number | null }>({ all: null, pending: null, accepted: null, declined: null });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Persist section/filter changes
  useEffect(() => { sessionStorage.setItem("interests_section", section); }, [section]);
  useEffect(() => { sessionStorage.setItem("interests_receivedFilter", receivedFilter); }, [receivedFilter]);
  useEffect(() => { sessionStorage.setItem("interests_sentFilter", sentFilter); }, [sentFilter]);

  // Restore sidebar scroll position
  useEffect(() => {
    if (sidebarOpen && sidebarRef.current) {
      sidebarRef.current.scrollTop = 0;
    }
  }, [sidebarOpen]);



  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load all for counts, then filter client-side
      const [allRec, allSent] = await Promise.all([
        getInterestsReceived(user.id, "all"),
        getInterestsSent(user.id, "all"),
      ]);

      setReceivedCounts({
        all: allRec.length,
        pending: allRec.filter((r) => r.status === "pending").length,
        accepted: allRec.filter((r) => r.status === "accepted").length,
        declined: allRec.filter((r) => r.status === "declined").length,
      });
      setSentCounts({
        all: allSent.length,
        pending: allSent.filter((r) => r.status === "pending").length,
        accepted: allSent.filter((r) => r.status === "accepted").length,
        declined: allSent.filter((r) => r.status === "declined").length,
      });

      setReceived(allRec);
      setSent(allSent);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user?.id]);

  const handleAccept = async (interestId: string) => {
    setActionLoading(interestId);
    const { error } = await acceptInterest(interestId);
    setActionLoading(null);
    if (error) { toast.error("Failed to accept. Try again."); return; }
    toast.success("Interest accepted! You can now message each other.");
    setReceived((prev) =>
      prev.map((r) => r.id === interestId ? { ...r, status: "accepted" } : r)
    );
    setReceivedCounts((c) => ({ ...c, pending: (c.pending ?? 0) - 1, accepted: (c.accepted ?? 0) + 1 }));
  };

  const handleDecline = async (interestId: string) => {
    setActionLoading(interestId);
    const { error } = await declineInterest(interestId);
    setActionLoading(null);
    if (error) { toast.error("Failed to decline. Try again."); return; }
    toast("Interest declined.");
    setReceived((prev) =>
      prev.map((r) => r.id === interestId ? { ...r, status: "declined" } : r)
    );
    setReceivedCounts((c) => ({ ...c, pending: (c.pending ?? 0) - 1, declined: (c.declined ?? 0) + 1 }));
  };

  const handleWithdraw = async (interestId: string) => {
    setActionLoading(interestId);
    const { error } = await withdrawInterest(interestId);
    setActionLoading(null);
    if (error) { toast.error("Failed to withdraw."); return; }
    toast("Interest withdrawn.");
    setSent((prev) => prev.filter((r) => r.id !== interestId));
    setSentCounts((c) => ({ ...c, all: (c.all ?? 0) - 1, pending: (c.pending ?? 0) - 1 }));
  };

  // Filter + search applied client-side
  const filteredReceived = received
    .filter((r) => receivedFilter === "all" || r.status === receivedFilter)
    .filter((r) => !searchQuery || r.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredSent = sent
    .filter((r) => sentFilter === "all" || r.status === sentFilter)
    .filter((r) => !searchQuery || r.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const displayed = section === "received" ? filteredReceived : filteredSent;
  const currentFilter = section === "received" ? receivedFilter : sentFilter;

  const headingMap: Record<string, string> = {
    pending: "Pending interests",
    accepted: "Accepted interests",
    declined: "Declined interests",
    all: "All interests",
  };

  const subtitleMap: Record<string, Record<string, string>> = {
    received: {
      pending: "Interests from members awaiting your response",
      accepted: "Interests you have accepted",
      declined: "Interests you have declined",
      all: "All interests received",
    },
    sent: {
      pending: "Interests you sent, awaiting their response",
      accepted: "Interests they accepted",
      declined: "Interests they declined",
      all: "All interests you sent",
    },
  };

  return (
    <>
      <Navbar />
      <PlanTabs />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 479px) {
          .interest-card { flex-direction: column !important; }
          .interest-card-photo-wrap { width: 100% !important; }
          .interest-card-photo { height: 200px !important; }
        }
        @media (min-width: 480px) {
          .interest-card { flex-direction: row !important; }
          .interest-card-photo-wrap { width: 130px !important; flex-shrink: 0 !important; }
          .interest-card-photo { width: 130px !important; height: 100% !important; min-height: 180px !important; }
        }
        @media (min-width: 768px) {
          .interest-card-photo-wrap { width: 148px !important; }
          .interest-card-photo { width: 148px !important; min-height: 200px !important; }
        }
        @media (min-width: 900px) {
          .interests-sidebar { display: block !important; position: sticky !important; transform: none !important; }
          .interests-sidebar-btn { display: none !important; }
        }
        @media (max-width: 899px) {
          .interests-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 85vw !important;
            max-width: 300px !important;
            z-index: 160 !important;
            max-height: 100vh !important;
            border-radius: 0 12px 12px 0 !important;
            overflow-y: auto !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.15) !important;
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            transition: transform 0.25s ease !important;
          }
        }
      `}</style>

      <main style={{ background: "#f2f2f2", minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
            padding: "0.75rem",
            display: "flex",
            gap: "1rem",
            alignItems: "stretch",
            flex: 1,
            overflow: "hidden",
          }}
        >

          {/* ── Mobile overlay ── */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 150 }}
            />
          )}

          {/* ── SIDEBAR ── */}
          <aside
            ref={sidebarRef}
            className="interests-sidebar"
            style={{
              width: "268px", flexShrink: 0,
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              overflowY: "auto",
              overscrollBehavior: "contain",
              alignSelf: "flex-start",
              height: "100%",
            }}
          >
            {/* Interests Received */}
            <div style={{ padding: "0.625rem 0.875rem 0.25rem", fontSize: "0.875rem", fontWeight: 700, color: "#111" }}>
              Interests Received
            </div>
            {(["all", "pending", "accepted", "declined"] as ReceivedFilter[]).map((f) => (
              <SidebarLink
                key={f}
                label={f === "accepted" ? "Accepted/Replied" : f.charAt(0).toUpperCase() + f.slice(1)}
                count={f === "pending" ? receivedCounts.pending : undefined}
                active={section === "received" && receivedFilter === f}
                onClick={() => { setSection("received"); setReceivedFilter(f); setSidebarOpen(false); }}
                color={f === "declined" ? "var(--primary)" : undefined}
              />
            ))}

            {/* Divider */}
            <div style={{ height: "1px", background: "#eee", margin: "0.5rem 0" }} />

            {/* Interests Sent */}
            <div style={{ padding: "0.625rem 0.875rem 0.25rem", fontSize: "0.875rem", fontWeight: 700, color: "#111" }}>
              Interests Sent
            </div>
            {(["all", "pending", "accepted", "declined"] as SentFilter[]).map((f) => (
              <SidebarLink
                key={`sent-${f}`}
                label={f === "accepted" ? "Accepted/Replied" : f.charAt(0).toUpperCase() + f.slice(1)}
                count={f === "pending" ? sentCounts.pending : undefined}
                active={section === "sent" && sentFilter === f}
                onClick={() => { setSection("sent"); setSentFilter(f); setSidebarOpen(false); }}
                color={f === "declined" ? "var(--primary)" : undefined}
              />
            ))}

            <div style={{ height: "0.5rem" }} />
          </aside>

          {/* ── MAIN ── */}
          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden", paddingRight: "2px", paddingBottom: "2rem" }}>
            
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#f2f2f2", paddingTop: "0.25rem", paddingBottom: "0.5rem" }}>
              {/* Mobile category button & Header */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <BackButton />
              <button
                onClick={() => setSidebarOpen(true)}
                className="interests-sidebar-btn"
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "0.5rem 0.875rem", border: "1.5px solid var(--primary)",
                  borderRadius: "20px", background: "#fff", color: "var(--primary)",
                  fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer",
                  fontFamily: "var(--font-sans)", minHeight: "40px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                {headingMap[currentFilter]}
              </button>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div>
                  <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111", margin: "0 0 3px", fontFamily: "var(--font-sans)" }}>
                    {headingMap[currentFilter]}{" "}
                    <span style={{ color: "var(--primary)" }}>
                      ({loading
                        ? "--"
                        : section === "received"
                          ? (receivedCounts[receivedFilter] || "--")
                          : (sentCounts[sentFilter] || "--")})
                    </span>
                  </h1>
                  <p style={{ fontSize: "0.8125rem", color: "#888", margin: 0 }}>
                    {subtitleMap[section][currentFilter]}
                  </p>
                </div>
              </div>
            </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                {/* Search toggle */}
                {showSearch ? (
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      padding: "0.3125rem 0.75rem",
                      border: "1.5px solid #ccc",
                      borderRadius: "20px",
                      fontSize: "0.8125rem",
                      fontFamily: "var(--font-sans)",
                      outline: "none",
                      width: "180px",
                    }}
                    onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                  />
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "0.3125rem 0.75rem",
                      border: "1.5px solid #ccc",
                      borderRadius: "20px",
                      background: "#fff", color: "#555",
                      fontSize: "0.8125rem", fontWeight: 500,
                      cursor: "pointer", fontFamily: "var(--font-sans)",
                    }}
                  >
                    <Search size={13} /> Search in Interests
                  </button>
                )}

                {/* Filter button */}
                <button
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "0.3125rem 0.75rem",
                    border: "1.5px solid #ccc",
                    borderRadius: "6px",
                    background: "#fff", color: "#555",
                    fontSize: "0.8125rem", fontWeight: 500,
                    cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}
                >
                  <SlidersHorizontal size={13} /> Filter
                </button>
              </div>
            </div>

            {/* Cards */}
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : !user
              ? (
                <div style={{ background: "#fff", borderRadius: "8px", padding: "3rem", textAlign: "center", border: "1px solid #e0e0e0" }}>
                  <p style={{ color: "#888" }}>Please <Link href="/login" style={{ color: "var(--primary)" }}>log in</Link> to view interests.</p>
                </div>
              )
              : displayed.length === 0
              ? (
                <div style={{ background: "#fff", borderRadius: "8px", padding: "3rem 2rem", textAlign: "center", border: "1px solid #e0e0e0" }}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.2" style={{ margin: "0 auto 1rem", display: "block" }}>
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  <p style={{ fontWeight: 700, color: "#555", fontSize: "1rem", margin: "0 0 0.5rem" }}>
                    No interests {section === "received" ? "received" : "sent"} yet
                  </p>
                  <p style={{ color: "#aaa", fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
                    {section === "received"
                      ? "When someone sends you interest, it will appear here."
                      : "Browse matches and send interest to start connecting."}
                  </p>
                  <Link
                    href="/matches"
                    style={{
                      display: "inline-block", padding: "0.5rem 1.5rem",
                      background: "var(--primary)", color: "#fff", borderRadius: "20px",
                      textDecoration: "none", fontWeight: 700, fontSize: "0.875rem",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    Browse Matches
                  </Link>
                </div>
              )
              : section === "received"
              ? filteredReceived.map((row, idx) => (
                  <ReceivedCard
                    key={row.id}
                    row={row}
                    idx={idx}
                    onAccept={() => handleAccept(row.id)}
                    onDecline={() => handleDecline(row.id)}
                    loading={actionLoading === row.id}
                  />
                ))
              : filteredSent.map((row, idx) => (
                  <SentCard
                    key={row.id}
                    row={row}
                    idx={idx}
                    onWithdraw={() => handleWithdraw(row.id)}
                    loading={actionLoading === row.id}
                  />
                ))
            }
          </div>
        </div>
      </main>
      <CompactFooter />
    </>
  );
}

function InterestsGuard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div style={{ background: "#FDF8F5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
          Loading...
        </div>
        <CompactFooter />
      </div>
    );
  }

  return <InterestsContent />;
}

export default function InterestsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-page)" }} />}>
      <InterestsGuard />
    </Suspense>
  );
}
