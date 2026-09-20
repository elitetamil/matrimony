"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/layout/Footer";
import { Bell, Heart, Eye, MessageCircle, BookmarkPlus, Star, CheckCheck, Trash2, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationRow,
} from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

type NotifType = NotificationRow["type"];

// Notification type config — maroon + gold theme only
const NOTIF_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  interest: {
    icon: <Heart size={16} fill="#6B1A2A" strokeWidth={0} />,
    color: "#6B1A2A",
    bg: "#F5E6E9",
  },
  view: {
    icon: <Eye size={16} color="#8B2535" />,
    color: "#8B2535",
    bg: "#FAF0F2",
  },
  message: {
    icon: <MessageCircle size={16} color="#6B1A2A" />,
    color: "#6B1A2A",
    bg: "#F5E6E9",
  },
  shortlist: {
    icon: <BookmarkPlus size={16} color="#C8973A" />,
    color: "#C8973A",
    bg: "#FBF6EC",
  },
  match: {
    icon: <Star size={16} fill="#C8973A" strokeWidth={0} />,
    color: "#C8973A",
    bg: "#FBF6EC",
  },
  system: {
    icon: <Bell size={16} color="#6B1A2A" />,
    color: "#6B1A2A",
    bg: "#F5E6E9",
  },
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const time = new Date(dateStr).getTime();
  if (isNaN(time)) return "";
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function NotificationsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");



  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch {
      setNotifications([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as Record<string, any>;
          const notif: NotificationRow = {
            id: row.id,
            userId: row.user_id,
            type: row.type,
            title: row.title,
            body: row.body,
            href: row.href ?? undefined,
            read: row.read ?? false,
            data: row.data ?? {},
            createdAt: row.created_at,
          };
          setNotifications((prev) => [notif, ...prev]);
          toast(notif.title);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast("Notification removed");
  };

  const displayed = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;



  return (
    <>
      <Navbar />
      <main style={{ background: "#f2f2f2", height: "calc(100vh - 64px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
            padding: "0.75rem",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "2px",
            paddingBottom: "2rem"
          }}
        >
          {/* Header */}
          <div style={{ position: "sticky", top: "-0.75rem", zIndex: 10, background: "#f2f2f2", paddingTop: "0.75rem", paddingBottom: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1 }}>
              <BackButton />
              <div>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111", margin: 0, fontFamily: "var(--font-sans)" }}>
                  Alerts
                </h1>
                {unreadCount > 0 && (
                  <span style={{ fontSize: "0.8125rem", color: "#666", marginTop: "2px", display: "block" }}>
                    You have <strong style={{ color: "#111" }}>{unreadCount}</strong> unread alerts
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "0.8125rem", color: "#C8973A", fontWeight: 700,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <Link
                href="/settings"
                style={{
                  width: "42px", height: "42px", borderRadius: "50%",
                  background: "#fff", border: "1.5px solid #E8D5B7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#6B1A2A",
                  boxShadow: "0 1px 4px rgba(107,26,42,0.10)",
                  flexShrink: 0,
                }}
              >
                <Settings size={20} />
              </Link>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{
            display: "flex", background: "#fff",
            border: "1px solid #e0e0e0", borderRadius: "6px",
            overflow: "hidden", marginBottom: "1rem",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
          }}>
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flex: 1, padding: "0.625rem 0", border: "none",
                  background: filter === f ? "#6B1A2A" : "#fff",
                  color: filter === f ? "#fff" : "#555",
                  fontWeight: filter === f ? 700 : 400,
                  fontSize: "0.875rem", cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {f === "all" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff", border: "1px solid #E8D5B7",
                    borderRadius: "6px", padding: "0.875rem 1rem",
                    display: "flex", gap: "0.875rem", alignItems: "center",
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#F5E6E9", animation: "pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: "50%", height: 12, background: "#F5E6E9", borderRadius: 4, marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
                    <div style={{ width: "80%", height: 11, background: "#F5E6E9", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div style={{
              background: "#fff", border: "1px solid #E8D5B7",
              borderRadius: "8px", padding: "3rem", textAlign: "center",
            }}>
              <Bell size={40} style={{ color: "#E8D5B7", margin: "0 auto 0.875rem" }} />
              <p style={{ fontWeight: 700, color: "#6B1A2A", marginBottom: "0.375rem" }}>No notifications yet</p>
              <p style={{ fontSize: "0.8125rem", color: "#777" }}>
                {filter === "unread"
                  ? "You've read everything!"
                  : "Activity on your profile will appear here — views, interests, messages, and new matches."}
              </p>
              <Link
                href="/matches"
                style={{
                  display: "inline-flex", marginTop: "1rem",
                  background: "#6B1A2A", color: "#fff",
                  borderRadius: "20px", padding: "0.5rem 1.5rem",
                  fontSize: "0.8125rem", fontWeight: 700, textDecoration: "none",
                }}
              >
                Browse Matches
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {displayed.map((notif) => {
                const config = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.system;
                const content = (
                  <div
                    key={notif.id}
                    style={{
                      background: notif.read ? "#fff" : "#FFF8F0",
                      border: "1px solid #E8D5B7",
                      borderLeft: !notif.read ? "3px solid #6B1A2A" : "3px solid transparent",
                      borderRadius: "6px",
                      padding: "0.875rem 1rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.875rem",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.15s",
                    }}
                    onClick={() => {
                      handleMarkRead(notif.id);
                      if (notif.href) router.push(notif.href);
                    }}
                  >
                    {/* Icon circle */}
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      background: config.bg, color: config.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: notif.read ? 500 : 700, fontSize: "0.875rem", color: "#222", marginBottom: "2px" }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: "0.8125rem", color: "#555", lineHeight: 1.5 }}>{notif.body}</div>
                      <div style={{ fontSize: "0.75rem", color: "#aaa", marginTop: "4px" }}>{timeAgo(notif.createdAt)}</div>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <div style={{
                        width: "8px", height: "8px", borderRadius: "50%",
                        background: "#6B1A2A", flexShrink: 0, marginTop: "4px",
                      }} />
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif.id);
                      }}
                      style={{
                        flexShrink: 0, width: "36px", height: "36px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ccc", opacity: 0.7,
                        touchAction: "manipulation",
                      }}
                      aria-label="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
                return content;
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function NotificationsGuard() {
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
        <main style={{ background: "#FFF8F0", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", margin: "0 auto 1rem", border: "3px solid #E8D5B7", borderTopColor: "#6B1A2A", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <p style={{ color: "#888", fontSize: "0.875rem" }}>Loading notifications…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return <NotificationsContent />;
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#FFF8F0", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading...
      </div>
    }>
      <NotificationsGuard />
    </Suspense>
  );
}
