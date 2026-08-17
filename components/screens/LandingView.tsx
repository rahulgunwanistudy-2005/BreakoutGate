"use client";

import React from "react";
import { DimensionalEmblem } from "../visuals/DimensionalEmblem";

interface LandingViewProps {
  onStart: () => void;
  onStartDemo?: () => void;
}

export function LandingView({ onStart, onStartDemo: _onStartDemo }: LandingViewProps) {
  return (
    <div className="container animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Hero Section */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "4rem 1rem 3rem",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <DimensionalEmblem size={280} />
        </div>

        <div className="badge badge-gold" style={{ marginBottom: "1.25rem" }}>
          Next-Generation Cosmetic Decision Architecture
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            maxWidth: "900px",
          }}
        >
          Bad skin day. Big moment. <br />
          <span className="text-gold">Make the better decision.</span>
        </h1>

        <p
          className="text-secondary"
          style={{
            fontSize: "1.2rem",
            maxWidth: "680px",
            marginBottom: "2.5rem",
            lineHeight: 1.6,
          }}
        >
          BreakoutGate changes the makeup buying decision based on dynamic skin context
          before virtual try-on. Powered by Perfect Corp AI skin analysis and deterministic evidence scoring.
        </p>

        <div className="flex gap-4" style={{ flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={onStart} className="btn btn-primary" style={{ padding: "0.9rem 2.2rem", fontSize: "1.05rem" }}>
            Begin Skin Analysis &rarr;
          </button>
          <a href="/judge" className="btn btn-secondary" style={{ padding: "0.9rem 1.8rem" }}>
            ⚡ 38s Interactive Judge Demo
          </a>
        </div>
      </section>

      {/* Differentiator Architecture Grid */}
      <section style={{ marginTop: "3rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Why Ordinary Makeup Recommendation Fails
          </h2>
          <p className="text-muted" style={{ maxWidth: "600px", margin: "0 auto" }}>
            Virtual try-on alone merely previews colors over inflammation. BreakoutGate evaluates optical condition, ingredient safety, and evidence provenance first.
          </p>
        </div>

        <div className="grid-3">
          <div className="card">
            <div style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>🔬</div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>1. Dynamic Optical Context</h3>
            <p className="text-secondary" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Perfect Corp AI measures 11 real-time optical dimensions (spots, redness, texture, hydration, oiliness). We adapt product formulation choices to your skin's immediate condition.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>🛡️</div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>2. Hard Safety Gates</h3>
            <p className="text-secondary" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Fragrance avoidance and excluded ingredients are hard filters. In BreakoutGate, missing disclosures are never assumed safe (UNKNOWN triggers fail-safe exclusion).
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>📜</div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>3. Verifiable Decision Receipt</h3>
            <p className="text-secondary" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              Every recommendation generates a cryptographic SHA-256 DecisionReceipt recording input digests, score decomposition, and counterfactuals with zero LLM hallucinations.
            </p>
          </div>
        </div>
      </section>

      {/* Decision Flow Pipeline Diagram */}
      <section style={{ marginTop: "4rem" }}>
        <div className="card card-elevated" style={{ padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span className="badge badge-gold" style={{ marginBottom: "0.75rem" }}>Execution Sequence</span>
            <h3 style={{ fontSize: "1.6rem" }}>The BreakoutGate Decision Pipeline</h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              textAlign: "center",
            }}
          >
            <div style={{ padding: "1rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontWeight: 700, color: "var(--accent-gold)", marginBottom: "0.25rem" }}>STAGE 01</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>Skin AI Capture</div>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>11 optical signals</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontWeight: 700, color: "var(--accent-gold)", marginBottom: "0.25rem" }}>STAGE 02</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>Evidence Filter</div>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Hard constraint gates</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontWeight: 700, color: "var(--accent-gold)", marginBottom: "0.25rem" }}>STAGE 03</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>Pure Decision</div>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Decomposed scoring</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontWeight: 700, color: "var(--accent-gold)", marginBottom: "0.25rem" }}>STAGE 04</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>Try-On &amp; Receipt</div>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>VTO + SHA-256 audit</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
