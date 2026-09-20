"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import {
  Search, MoreVertical,
  Send, CheckCheck, Check, Crown, MessageCircle, ArrowLeft, UserCircle, Flag,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  getConversations,
  getMessages,
  sendMessage,
  getUserById,
  type ConversationSummary,
  type MessageRow,
} from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

// ── FORMAT HELPERS ─────────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatLastSeen(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── AVATAR ────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      background: "#F5E6E9", display: "flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid #E8D5B7", flexShrink: 0,
    }}>
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: size * 0.35, fontWeight: 700, color: "#6B1A2A", fontFamily: "var(--font-sans)" }}>{initials}</span>
      }
    </div>
  );
}

// ── CONVERSATION ITEM ─────────────────────────────────────────────────
function ConversationItem({
  conv, selected, onClick,
}: {
  conv: ConversationSummary;
  selected: boolean;
  onClick: () => void;
}) {
  const profile = conv.partnerProfile;
  const name = profile?.name || "Unknown Member";
  const photo = profile?.photoUrl;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.875rem 1rem", background: selected ? "#FFF0F5" : "#fff",
        border: "none", borderLeft: selected ? "3px solid #6B1A2A" : "3px solid transparent",
        cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)",
        borderBottom: "1px solid #F2E8D6", transition: "background 0.12s",
        minHeight: "72px",
      }}
    >
      <Avatar src={photo} name={name} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </span>
          {profile?.isPremium && (
            <Crown size={11} style={{ color: "#C8973A", flexShrink: 0 }} fill="#C8973A" />
          )}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conv.lastMessage || "No messages yet"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
        <span style={{ fontSize: "0.6875rem", color: "#aaa" }}>{formatLastSeen(conv.lastMessageAt)}</span>
        {conv.unreadCount > 0 && (
          <div style={{
            background: "#6B1A2A", color: "#fff", borderRadius: "50%",
            width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.6rem", fontWeight: 700,
          }}>
            {conv.unreadCount}
          </div>
        )}
      </div>
    </button>
  );
}

// ── MESSAGE BUBBLE ────────────────────────────────────────────────────
function MessageBubble({ msg, isMe }: { msg: MessageRow; isMe: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.5rem" }}>
      <div style={{ maxWidth: "75%" }}>
        <div style={{
          background: isMe ? "#6B1A2A" : "#f5f5f5",
          color: isMe ? "#fff" : "#1a1a1a",
          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "0.625rem 0.875rem",
          fontSize: "0.875rem", lineHeight: 1.5,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          wordBreak: "break-word",
        }}>
          {msg.content}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: "3px" }}>
          <span style={{ fontSize: "0.625rem", color: "#aaa" }}>{formatTime(msg.sentAt)}</span>
          {isMe && msg.readAt && <CheckCheck size={11} style={{ color: "#C8973A" }} />}
          {isMe && !msg.readAt && <Check size={11} style={{ color: "#aaa" }} />}
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────
function MessagesContent() {
  const { user, loading: authLoading } = useAuth();

  const searchParams = useSearchParams();
  const initPartnerId = searchParams?.get("partnerId");
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initPartnerId || null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [search, setSearch] = useState("");
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedConv = conversations.find((c) => c.partnerId === selectedId);
  const selectedProfile = selectedConv?.partnerProfile;
  const [headerProfile, setHeaderProfile] = useState<import("@/lib/auth-store").RegisteredUser | null>(null);
  const displayProfile = selectedProfile || headerProfile;

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);
    const convs = await getConversations(user.id);

    if (initPartnerId && initPartnerId !== user.id) {
      const exists = convs.find(c => c.partnerId === initPartnerId);
      if (!exists) {
        const p = await getUserById(initPartnerId);
        if (p) {
          convs.unshift({
            partnerId: initPartnerId,
            partnerProfile: p,
            lastMessage: "",
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            isInitiatedByPartner: false,
          });
        }
      }
      setSelectedId(initPartnerId);
      router.replace("/messages");
    }

    setConversations(convs);
    setLoadingConvs(false);
  }, [user?.id, initPartnerId, router]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Whenever a conversation is opened, make sure we have the profile
  useEffect(() => {
    if (!selectedId) { setHeaderProfile(null); return; }
    if (selectedProfile) { setHeaderProfile(selectedProfile); return; }
    // Fallback: fetch directly if not in conversation list yet
    getUserById(selectedId).then(p => { if (p) setHeaderProfile(p); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedProfile?.name]);

  // Load messages when partner changes
  useEffect(() => {
    if (!user || !selectedId) return;
    setLoadingMsgs(true);
    getMessages(user.id, selectedId)
      .then(setMessages)
      .finally(() => setLoadingMsgs(false));
  }, [user?.id, selectedId]);

  // Real-time subscription — listens for both incoming and sent messages
  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (payload: { new: Record<string, unknown> }) => {
      const row = payload.new as Record<string, string>;
      const newMsg: MessageRow = {
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        readAt: row.read_at ?? undefined,
        sentAt: row.sent_at,
      };
      // Only update messages if this conversation is open and deduplicate optimistic
      const isCurrentConv =
        (row.sender_id === selectedId && row.receiver_id === user.id) ||
        (row.sender_id === user.id && row.receiver_id === selectedId);

      if (isCurrentConv) {
        setMessages((prev) => {
          // Remove any optimistic placeholder with same content & sender
          const withoutOptimistic = prev.filter(
            (m) => !(m.id.startsWith("optimistic-") && m.content === newMsg.content && m.senderId === newMsg.senderId)
          );
          // Avoid true duplicates
          if (withoutOptimistic.some((m) => m.id === newMsg.id)) return withoutOptimistic;
          return [...withoutOptimistic, newMsg];
        });
      }
      loadConversations();
    };

    const channel = supabase
      .channel(`messages:user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        handleNewMessage
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        handleNewMessage
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, selectedId, loadConversations]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || !selectedId || sending) return;

    // Optimistic update — show message immediately
    const optimisticMsg: MessageRow = {
      id: `optimistic-${Date.now()}`,
      senderId: user.id,
      receiverId: selectedId,
      content: text,
      sentAt: new Date().toISOString(),
      readAt: undefined,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");

    setSending(true);
    const result = await sendMessage(user.id, selectedId, text);
    setSending(false);

    if (result.error === "upgrade") {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputText(text); // restore text
      toast.error("Upgrade to Premium to send messages first. If they messaged you, you can reply.", {
        duration: 5000,
      });
      return;
    }
    if (result.error) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputText(text); // restore text
      toast.error("Failed to send message. Please try again.");
      return;
    }

    // Refresh from server to get real ID and timestamp
    getMessages(user.id, selectedId).then(setMessages);
    loadConversations();
  };

  const filteredConvs = conversations.filter((c) =>
    (c.partnerProfile?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Mobile: show chat view OR list, not both
  const showChatOnMobile = !!selectedId;

  if (!user) return null;

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
            gap: "1rem",
            alignItems: "stretch",
            flex: 1,
            overflow: "hidden",
          }}
        >

          {/* ── LEFT SIDEBAR: conversation list ── */}
            <aside
              style={{
                width: "100%", maxWidth: "340px", flexShrink: 0,
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                overflowY: "auto",
                overscrollBehavior: "contain",
                alignSelf: "flex-start",
                height: "100%",
              }}
              className={`messages-conv-list ${showChatOnMobile ? "hidden-on-mobile" : ""}`}
            >
              {/* Sidebar Header */}
              <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                <BackButton />
                <span style={{ fontWeight: 800, fontSize: "0.9375rem", color: "#111" }}>Conversations</span>
              </div>
              
              {/* Sidebar search */}
              <div style={{ padding: "0.75rem", borderBottom: "1px solid #F2E8D6" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
                  <input
                    type="text"
                    placeholder="Search conversations…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%", background: "#f9f9f9", border: "1px solid #E8D5B7", borderRadius: "20px",
                      padding: "0.5rem 0.75rem 0.5rem 2.25rem", fontSize: "0.875rem",
                      fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Conversation list */}
              <div style={{ overflowY: "auto", flex: 1 }}>
                {loadingConvs ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "#aaa", fontSize: "0.875rem" }}>
                    Loading conversations…
                  </div>
                ) : filteredConvs.length === 0 ? (
                  <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
                    <MessageCircle size={40} style={{ color: "#E8D5B7", margin: "0 auto 0.75rem" }} />
                    <div style={{ fontWeight: 600, color: "#6B1A2A", fontSize: "0.875rem", marginBottom: "0.5rem" }}>No conversations yet</div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa", lineHeight: 1.5 }}>
                      When a premium member messages you, or you start a conversation, it will appear here.
                    </div>
                    <Link href="/matches" style={{
                      display: "inline-flex", marginTop: "1rem",
                      background: "#6B1A2A", color: "#fff", borderRadius: "20px",
                      padding: "0.5rem 1.25rem", fontSize: "0.75rem",
                      fontWeight: 700, textDecoration: "none",
                    }}>
                      Browse Matches
                    </Link>
                  </div>
                ) : (
                  filteredConvs.map((conv) => (
                    <ConversationItem
                      key={conv.partnerId}
                      conv={conv}
                      selected={selectedId === conv.partnerId}
                      onClick={() => setSelectedId(conv.partnerId)}
                    />
                  ))
                )}
              </div>
            </aside>

            {/* ── RIGHT: CHAT WINDOW ── */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                overflow: "hidden",
              }}
              className={`messages-chat-panel ${!showChatOnMobile ? "hidden-on-mobile" : ""}`}
            >
              {!selectedId ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
                  <MessageCircle size={48} style={{ color: "#E8D5B7", marginBottom: "1rem" }} />
                  <h2 style={{ color: "#6B1A2A", fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.5rem", textAlign: "center" }}>
                    Your Messages
                  </h2>
                  <p style={{ color: "#888", fontSize: "0.875rem", textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>
                    Select a conversation to start chatting. Premium members can initiate conversations.
                  </p>
                  {!user.isPremium && (
                    <Link href="/membership" style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      marginTop: "1.5rem", background: "#6B1A2A", color: "#fff",
                      borderRadius: "20px", padding: "0.625rem 1.5rem",
                      fontSize: "0.875rem", fontWeight: 700, textDecoration: "none",
                    }}>
                      <Crown size={14} /> Upgrade to Message First
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div style={{
                    padding: "0.75rem 1rem", borderBottom: "1px solid #F2E8D6",
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    background: "#fff", flexShrink: 0,
                  }}>
                    {/* Back button — mobile only */}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="messages-back-btn"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#6B1A2A", padding: "4px", display: "flex",
                        alignItems: "center", minHeight: "44px", minWidth: "44px",
                        justifyContent: "center",
                      }}
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <Link href={`/profile/${selectedId}`} style={{ display: "flex", flexShrink: 0 }}>
                      <Avatar src={displayProfile?.photoUrl} name={displayProfile?.name || "Member"} size={38} />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {displayProfile?.name || (loadingConvs ? "Loading…" : "Member")}
                        </span>
                        {displayProfile?.isPremium && (
                          <Crown size={13} style={{ color: "#C8973A", flexShrink: 0 }} fill="#C8973A" />
                        )}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "#888", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {[
                          displayProfile?.occupation,
                          [displayProfile?.city, displayProfile?.state].filter(Boolean).join(", "),
                        ].filter(Boolean).join(" · ") || "View profile →"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0, position: "relative" }}>
                      {/* Three-dot dropdown */}
                      <div style={{ position: "relative" }} ref={moreMenuRef}>
                        <button
                          id="msg-more-btn"
                          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                          style={{
                            background: "none", border: "1px solid #E8D5B7", borderRadius: "50%",
                            width: "36px", height: "36px", display: "flex", alignItems: "center",
                            justifyContent: "center", cursor: "pointer", color: "#6B1A2A",
                          }}
                          aria-label="More options"
                        >
                          <MoreVertical size={15} />
                        </button>
                        {isMoreMenuOpen && (
                          <div
                            id="msg-more-menu"
                            style={{
                              position: "absolute", top: "calc(100% + 6px)", right: 0,
                              background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 200, minWidth: "180px",
                              overflow: "hidden",
                            }}
                            onClick={() => setIsMoreMenuOpen(false)}
                          >
                          <Link
                            href={`/profile/${selectedId}`}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "0.75rem 1rem", color: "#222", textDecoration: "none",
                              fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-sans)",
                              borderBottom: "1px solid #f5f5f5",
                            }}
                          >
                            <UserCircle size={16} style={{ color: "#6B1A2A" }} />
                            View Profile
                          </Link>
                          <button
                            onClick={() => { toast("Report submitted. Our team will review it."); }}
                            style={{
                              display: "flex", alignItems: "center", gap: "10px",
                              padding: "0.75rem 1rem", color: "#C0392B", background: "none",
                              border: "none", width: "100%", textAlign: "left",
                              fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-sans)",
                              cursor: "pointer",
                            }}
                          >
                            <Flag size={16} />
                            Block / Report
                          </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div style={{
                    flex: 1, overflowY: "auto", padding: "1rem",
                    background: "#FAFAF8", display: "flex", flexDirection: "column",
                    WebkitOverflowScrolling: "touch" as const,
                  }}>
                    {loadingMsgs ? (
                      <div style={{ textAlign: "center", color: "#aaa", fontSize: "0.875rem", padding: "2rem" }}>Loading messages…</div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                        <div style={{ color: "#aaa", fontSize: "0.875rem", marginBottom: "0.5rem" }}>No messages yet</div>
                        <div style={{ color: "#bbb", fontSize: "0.75rem" }}>Say hello! 👋</div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          isMe={msg.senderId === user.id}
                        />
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input bar */}
                  <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #F2E8D6", background: "#fff", flexShrink: 0 }}>
                    {!user.isPremium ? (
                      <div style={{ textAlign: "center", padding: "0.5rem" }}>
                        <p style={{ fontSize: "0.8125rem", color: "#1a1a1a", fontWeight: 600, marginBottom: "0.75rem" }}>
                          Upgrade to Gold to unlock messaging
                        </p>
                        <Link
                          href="/membership"
                          style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
                            background: "linear-gradient(135deg, #C8973A 0%, #E8C060 100%)",
                            color: "#fff", fontWeight: 700, fontSize: "0.9375rem",
                            borderRadius: "30px", padding: "0.75rem 1.75rem",
                            textDecoration: "none", boxShadow: "0 4px 16px rgba(200,151,58,0.35)",
                          }}
                        >
                          <Crown size={16} /> Upgrade to Gold
                        </Link>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Type a message…"
                            style={{
                              width: "100%", background: "#f5f5f5", border: "1.5px solid #E8D5B7",
                              borderRadius: "20px", padding: "0.625rem 1rem", fontSize: "1rem",
                              fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
                              minHeight: "44px",
                            }}
                            onFocus={(e) => (e.target.style.borderColor = "#6B1A2A")}
                            onBlur={(e) => (e.target.style.borderColor = "#E8D5B7")}
                          />
                        </div>
                        <button
                          onClick={handleSend}
                          disabled={!inputText.trim() || sending}
                          style={{
                            background: inputText.trim() && !sending ? "#6B1A2A" : "#e0e0e0",
                            border: "none", borderRadius: "50%", width: "44px", height: "44px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: inputText.trim() && !sending ? "pointer" : "default",
                            color: "#fff", flexShrink: 0, transition: "background 0.15s",
                          }}
                          aria-label="Send message"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .messages-conv-list {
            width: 268px !important;
          }
          .messages-chat-panel {
            display: flex !important;
          }
        }
        
        /* Mobile: toggle between list and chat */
        @media (max-width: 767px) {
          .messages-search { display: flex !important; }
          .messages-conv-list { border-radius: 6px !important; }
          .messages-chat-panel {
            height: calc(100vh - 64px - 60px - env(safe-area-inset-bottom, 0px) - 1.5rem) !important;
            max-height: calc(100vh - 64px - 60px - env(safe-area-inset-bottom, 0px) - 1.5rem) !important;
            min-height: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

function MessagesGuard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        Loading...
      </div>
    );
  }

  return <MessagesContent />;
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>Loading messages...</div>}>
      <MessagesGuard />
    </Suspense>
  );
}
