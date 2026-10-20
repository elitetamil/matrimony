"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  label?: string;
  style?: React.CSSProperties;
  /** If true, renders as a sticky fixed bar at top-left of viewport (below navbar) */
  sticky?: boolean;
  href?: string;
  onClick?: () => void;
}

export default function BackButton({ label, style, sticky, href, onClick }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const hasLabel = Boolean(label);

  const btn = (
    <button
      onClick={handleClick}
      aria-label={label || "Go back"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: hasLabel ? "0.375rem" : "0.125rem",
        background: "#fff",
        border: "1.5px solid #e0e0e0",
        borderRadius: hasLabel ? "20px" : "50%",
        width: hasLabel ? "auto" : "36px",
        minWidth: "36px",
        height: "36px",
        cursor: "pointer",
        color: "#444",
        flexShrink: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.15s, border-color 0.15s, color 0.15s",
        padding: hasLabel ? "0 0.875rem 0 0.5rem" : 0,
        whiteSpace: "nowrap",
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label && <span style={{ fontSize: "0.875rem", fontWeight: 600, fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}>{label}</span>}
    </button>
  );

  return btn;
}
