"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

type OptionItem = string | { value: string; label: string };

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: OptionItem[];
  placeholder?: string;
  disabled?: boolean;
  hideLabel?: boolean;
}

export default function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  hideLabel = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropup, setDropup] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Normalize all options to { value, label }
  const normalized = options.map((o): { value: string; label: string } =>
    typeof o === "string" ? { value: o, label: o } : o
  );

  // Display label for current value
  const displayLabel = normalized.find((o) => o.value === value)?.label ?? value;

  // Close when clicking/touching outside
  useEffect(() => {
    function handleOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, []);

  // Determine dropup direction and scroll into view when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      setDropup(spaceBelow < 260);
      // Scroll into view on mobile so keyboard doesn't hide it
      setTimeout(() => {
        triggerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }, 50);
    }
  }, [isOpen]);

  // Filter: use includes for better searchability, prioritize prefix matches
  const searchLower = search.trim().toLowerCase();
  const filteredOptions = searchLower
    ? normalized
        .filter((opt) =>
          opt.label.toLowerCase().includes(searchLower)
        )
        .sort((a, b) => {
          const aStarts = a.label.toLowerCase().startsWith(searchLower);
          const bStarts = b.label.toLowerCase().startsWith(searchLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return a.label.localeCompare(b.label);
        })
    : normalized;

  return (
    <div ref={containerRef} style={{ position: "relative", marginBottom: "1rem" }}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isOpen) setSearch("");
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        className="form-select"
        style={{
          paddingTop: value ? "1.375rem" : "0.75rem",
          paddingBottom: value ? "0.375rem" : "0.75rem",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          minHeight: "46px",
          background: disabled ? "#F7F7F7" : "#fff",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: value ? "var(--text-dark)" : "var(--text-muted)",
          }}
        >
          {displayLabel || placeholder || `Select ${label}`}
        </span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      </button>

      {/* Floating Label */}
      {value && !hideLabel && (
        <span
          style={{
            position: "absolute",
            top: "0.3125rem",
            left: "0.875rem",
            fontSize: "0.6875rem",
            color: disabled ? "var(--text-muted)" : "var(--primary)",
            fontWeight: 700,
            pointerEvents: "none",
            letterSpacing: "0.02em",
          }}
        >
          {label}
        </span>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          style={{
            position: "absolute",
            ...(dropup
              ? { bottom: "calc(100% + 4px)", top: "auto" }
              : { top: "calc(100% + 4px)", bottom: "auto" }),
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 9999,
            animation: "fadeIn 0.15s ease",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Box */}
          <div
            style={{
              padding: "0.5rem",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#F9FAFB",
            }}
          >
            <Search size={14} style={{ color: "var(--text-muted)", marginLeft: "4px" }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: "16px",
                color: "var(--text-dark)",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>

          {/* Options */}
          <ul
            role="listbox"
            style={{
              maxHeight: "220px",
              overflowY: "auto",
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li key={opt.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === opt.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    style={{
                      width: "100%",
                      padding: "0.625rem 1rem",
                      textAlign: "left",
                      background: value === opt.value ? "var(--primary-light)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--border-light)",
                      fontSize: "0.875rem",
                      color: value === opt.value ? "var(--primary)" : "var(--text-dark)",
                      fontWeight: value === opt.value ? 600 : 400,
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (value !== opt.value) e.currentTarget.style.background = "#F3F4F6";
                    }}
                    onMouseLeave={(e) => {
                      if (value !== opt.value) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            ) : (
              <li
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                No options found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
