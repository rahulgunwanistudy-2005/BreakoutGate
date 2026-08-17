"use client";

import React from "react";

export type ExecutionMode = "live" | "demo" | "replay";

interface HeaderProps {
  currentMode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
  onReset: () => void;
  onOpenReceipt?: () => void;
  hasActiveReceipt?: boolean;
}

export function Header({
  currentMode,
  onModeChange,
  onReset,
  onOpenReceipt,
  hasActiveReceipt,
}: HeaderProps) {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(12, 13, 16, 0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container flex items-center justify-between"
        style={{ height: "4rem" }}
      >
        {/* Brand Logo */}
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, var(--accent-gold), #b88d3b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "#0c0d10",
            }}
          >
            BG
          </div>
          <div>
            <span style={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
              Breakout<span style={{ color: "var(--accent-gold)" }}>Gate</span>
            </span>
            <span
              style={{
                display: "block",
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Precision Decision Engine
            </span>
          </div>
        </button>

        {/* Mode Selector & Controls */}
        <div className="flex items-center gap-4">
          <div
            style={{
              display: "flex",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-full)",
              padding: "2px",
            }}
          >
            <button
              onClick={() => onModeChange("live")}
              className={`btn btn-ghost ${currentMode === "live" ? "text-gold" : ""}`}
              style={{
                padding: "0.35rem 0.85rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                borderRadius: "var(--radius-full)",
                background: currentMode === "live" ? "rgba(223, 177, 91, 0.15)" : "transparent",
              }}
            >
              LIVE
            </button>
            <button
              onClick={() => onModeChange("demo")}
              className={`btn btn-ghost ${currentMode === "demo" ? "text-gold" : ""}`}
              style={{
                padding: "0.35rem 0.85rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                borderRadius: "var(--radius-full)",
                background: currentMode === "demo" ? "rgba(223, 177, 91, 0.15)" : "transparent",
              }}
            >
              DEMO
            </button>
          </div>

          {hasActiveReceipt && onOpenReceipt && (
            <button
              onClick={onOpenReceipt}
              className="btn btn-secondary"
              style={{ padding: "0.45rem 1rem", fontSize: "0.8rem" }}
            >
              <span>🔍</span> Verify Receipt
            </button>
          )}

          <a
            href="/judge"
            className="btn btn-secondary"
            style={{
              padding: "0.35rem 0.85rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              borderRadius: "var(--radius-full)",
              borderColor: "var(--accent-gold)",
              color: "var(--accent-gold)",
              background: "rgba(223, 177, 91, 0.1)",
            }}
          >
            ⚡ 38s Judge Mode
          </a>

          <div
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "var(--radius-full)",
              background: "rgba(94, 192, 199, 0.1)",
              border: "1px solid rgba(94, 192, 199, 0.3)",
              fontSize: "0.75rem",
              color: "var(--accent-cyan)",
              fontWeight: 600,
            }}
          >
            YouCam AI S2S
          </div>
        </div>
      </div>
    </header>
  );
}
