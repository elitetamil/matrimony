"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?: string;
  style?: React.CSSProperties;
  /** If true, renders as a sticky fixed bar at top-left of viewport (below navbar) */
  sticky?: boolean;
}

export default function BackButton({ label, style, sticky }: BackButtonProps) {
  const router = useRouter();

  const btn = (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.125rem",
        background: "#fff",
        border: "1.5px solid #e0e0e0",
        borderRadius: "50%",
        width: "36px",
        height: "36px",
        cursor: "pointer",
        color: "#444",
        flexShrink: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.15s, border-color 0.15s",
        padding: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#6B1A2A";
        (e.currentTarget as HTMLButtonElement).style.color = "#6B1A2A";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#e0e0e0";
        (e.currentTarget as HTMLButtonElement).style.color = "#444";
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label && <span style={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-sans)", paddingRight: "6px" }}>{label}</span>}
    </button>
  );

  return btn;
}
