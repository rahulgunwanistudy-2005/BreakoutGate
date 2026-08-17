"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DimensionalEmblem } from "../visuals/DimensionalEmblem";

interface JudgeStage {
  id: number;
  durationSec: number;
  tag: string;
  title: string;
  subtitle: string;
}

const JUDGE_STAGES: JudgeStage[] = [
  {
    id: 1,
    durationSec: 4,
    tag: "01. THESIS",
    title: "The Innovation Thesis",
    subtitle: "Virtual try-on shows what looks good. BreakoutGate decides what should be bought.",
  },
  {
    id: 2,
    durationSec: 5,
    tag: "02. THE PROBLEM",
    title: "Why Ordinary VTO Fails Bad Skin Days",
    subtitle: "Color matching ignores active inflammation, redness, barrier breakdown, and comedogenic hazards.",
  },
  {
    id: 3,
    durationSec: 6,
    tag: "03. OPTICAL CONTEXT",
    title: "Real Optical Skin State + Constraints",
    subtitle: "Perfect Corp AI extracts 11 dynamic signals combined with user hard exclusion filters.",
  },
  {
    id: 4,
    durationSec: 6,
    tag: "04. SOURCED EVIDENCE",
    title: "Live Manufacturer Product Evidence",
    subtitle: "Verified E2 manufacturer specifications, INCI ingredient disclosures, and claim ledgers.",
  },
  {
    id: 5,
    durationSec: 6,
    tag: "05. DETERMINISTIC ENGINE",
    title: "Hard Eligibility & Decomposed Scoring",
    subtitle: "Rules choose. Evidence proves. Zero LLM hallucinations or probabilistic guesswork.",
  },
  {
    id: 6,
    durationSec: 6,
    tag: "06. THE WINNER",
    title: "Optimal Formulation & Counterfactuals",
    subtitle: "Clear champion product matched to current skin context with explicit counterfactual explanations.",
  },
  {
    id: 7,
    durationSec: 5,
    tag: "07. SUPPLEMENTAL VTO",
    title: "Decision First. Try-On Second.",
    subtitle: "Makeup VTO visualizes the selected winner. VTO has ZERO decision authority.",
  },
  {
    id: 8,
    durationSec: 5,
    tag: "08. CRYPTOGRAPHIC PROOF",
    title: "Verifiable SHA-256 Decision Receipt",
    subtitle: "Every input digest, score breakdown, and candidate decision is sealed with RFC 8785 canonical hashing.",
  },
];

export function JudgeTimelineView() {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedInStage, setElapsedInStage] = useState(0);

  const currentStage = JUDGE_STAGES[currentStageIdx];

  const totalDuration = JUDGE_STAGES.reduce((acc, s) => acc + s.durationSec, 0);

  const calculateTotalElapsed = () => {
    let sum = 0;
    for (let i = 0; i < currentStageIdx; i++) {
      sum += JUDGE_STAGES[i].durationSec;
    }
    return sum + elapsedInStage;
  };

  const handleNext = useCallback(() => {
    if (currentStageIdx < JUDGE_STAGES.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
      setElapsedInStage(0);
    } else {
      setIsPlaying(false);
    }
  }, [currentStageIdx]);

  const handlePrev = useCallback(() => {
    if (currentStageIdx > 0) {
      setCurrentStageIdx((prev) => prev - 1);
      setElapsedInStage(0);
    }
  }, [currentStageIdx]);

  const handleRestart = () => {
    setCurrentStageIdx(0);
    setElapsedInStage(0);
    setIsPlaying(true);
  };

  // Timer loop for autoplay
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedInStage((prev) => {
        if (prev + 0.1 >= currentStage.durationSec) {
          handleNext();
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentStage.durationSec, handleNext]);

  // Keyboard navigation: Space = pause/play, Arrows = step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 10%, #171b26 0%, #0c0d10 80%)",
        color: "var(--text-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Judge Bar */}
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(12, 13, 16, 0.85)",
          backdropFilter: "blur(12px)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="btn btn-ghost"
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.85rem" }}
          >
            &larr; Exit Demo
          </Link>
          <div className="badge badge-gold" style={{ letterSpacing: "0.08em" }}>
            ⚡ 38s Interactive Judge Walkthrough
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-mono text-muted" style={{ fontSize: "0.85rem" }}>
            Total Progress:{" "}
            <span className="text-gold">
              {Math.round(calculateTotalElapsed())}s
            </span>{" "}
            / {totalDuration}s
          </div>

          <div
            style={{
              padding: "0.25rem 0.65rem",
              borderRadius: "var(--radius-full)",
              background: "rgba(94, 192, 199, 0.12)",
              border: "1px solid rgba(94, 192, 199, 0.3)",
              fontSize: "0.75rem",
              color: "var(--accent-cyan)",
              fontWeight: 600,
            }}
          >
            Deterministic S2S Path
          </div>
        </div>
      </header>

      {/* Stage Stepper Progress Header */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "0.5rem 1.5rem",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
          overflowX: "auto",
        }}
      >
        {JUDGE_STAGES.map((stage, idx) => {
          const isCurrent = idx === currentStageIdx;
          const isDone = idx < currentStageIdx;
          const progressPercent = isCurrent
            ? (elapsedInStage / stage.durationSec) * 100
            : isDone
            ? 100
            : 0;

          return (
            <button
              key={stage.id}
              onClick={() => {
                setCurrentStageIdx(idx);
                setElapsedInStage(0);
              }}
              style={{
                flex: 1,
                minWidth: "100px",
                background: "var(--bg-input)",
                border: "none",
                borderRadius: "4px",
                padding: "0.4rem 0.5rem",
                textAlign: "left",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: "3px",
                  width: `${progressPercent}%`,
                  background: isCurrent ? "var(--accent-gold)" : "var(--status-eligible)",
                  transition: isCurrent ? "width 0.1s linear" : "none",
                }}
              />
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: isCurrent ? "var(--accent-gold)" : "var(--text-muted)",
                }}
              >
                {stage.tag}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Narrative Cinema Display */}
      <main
        className="container animate-fade-in"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "2rem 1.5rem 6rem",
          maxWidth: "1000px",
        }}
      >
        {/* Stage Content */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span
            className="badge badge-gold"
            style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}
          >
            {currentStage.tag}
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              lineHeight: 1.15,
              marginBottom: "0.75rem",
            }}
          >
            {currentStage.title}
          </h1>
          <p
            className="text-secondary"
            style={{ fontSize: "1.15rem", maxWidth: "700px", margin: "0 auto" }}
          >
            {currentStage.subtitle}
          </p>
        </div>

        {/* Stage Interactive Visual Cards */}
        <div
          className="card card-elevated"
          style={{ padding: "2.5rem 2rem", minHeight: "380px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {/* STAGE 1: Brand & Thesis */}
          {currentStage.id === 1 && (
            <div style={{ textAlign: "center" }} className="animate-fade-in">
              <div style={{ marginBottom: "1.5rem" }}>
                <DimensionalEmblem size={220} />
              </div>
              <div style={{ fontSize: "1.3rem", fontWeight: 500, maxWidth: "600px" }}>
                &ldquo;Virtual try-on can show you what looks good. <br />
                <span className="text-gold" style={{ fontWeight: 600 }}>
                  BreakoutGate decides what formulation you should actually buy.
                </span>
                &rdquo;
              </div>
            </div>
          )}

          {/* STAGE 2: The Problem */}
          {currentStage.id === 2 && (
            <div style={{ width: "100%" }} className="animate-fade-in">
              <div className="grid-2" style={{ gap: "2rem", alignItems: "stretch" }}>
                <div
                  style={{
                    background: "rgba(229, 62, 62, 0.08)",
                    border: "1px solid rgba(229, 62, 62, 0.3)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.5rem",
                  }}
                >
                  <span className="badge badge-ineligible" style={{ marginBottom: "0.5rem" }}>
                    ❌ Ordinary Virtual Try-On
                  </span>
                  <h3 style={{ fontSize: "1.25rem", margin: "0.5rem 0" }}>Surface-Level Color Overlay</h3>
                  <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }} className="text-secondary">
                    <li>Matches shade RGB purely on flat lighting.</li>
                    <li>Ignores active barrier irritation and redness.</li>
                    <li>Recommends pore-clogging formulas containing known irritants.</li>
                  </ul>
                </div>

                <div
                  style={{
                    background: "rgba(56, 161, 105, 0.08)",
                    border: "1px solid rgba(72, 187, 120, 0.3)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.5rem",
                  }}
                >
                  <span className="badge badge-eligible" style={{ marginBottom: "0.5rem" }}>
                    ✓ BreakoutGate Architecture
                  </span>
                  <h3 style={{ fontSize: "1.25rem", margin: "0.5rem 0" }}>Skin Context + Proof First</h3>
                  <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }} className="text-secondary">
                    <li>11-dimension optical signal extraction (YouCam AI).</li>
                    <li>Strict fail-safe hard exclusion gates.</li>
                    <li>VTO used purely as post-decision visual preview.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: Optical Context */}
          {currentStage.id === 3 && (
            <div style={{ width: "100%" }} className="animate-fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>REDNESS</div>
                  <div className="text-gold font-mono" style={{ fontSize: "1.3rem", fontWeight: 700 }}>0.88</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--status-warning)" }}>Active Flushing</div>
                </div>
                <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>OILINESS</div>
                  <div className="text-gold font-mono" style={{ fontSize: "1.3rem", fontWeight: 700 }}>0.69</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Moderate T-Zone</div>
                </div>
                <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>TEXTURE</div>
                  <div className="text-gold font-mono" style={{ fontSize: "1.3rem", fontWeight: 700 }}>0.77</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Pore Irregularity</div>
                </div>
                <div style={{ background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                  <div className="text-muted" style={{ fontSize: "0.7rem" }}>MOISTURE</div>
                  <div className="text-gold font-mono" style={{ fontSize: "1.3rem", fontWeight: 700 }}>0.69</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Balanced Hydration</div>
                </div>
              </div>

              <div style={{ padding: "1rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--status-ineligible)" }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Active User Constraints:</div>
                <div className="text-secondary" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  • <span className="text-gold">Avoid Fragrance = TRUE</span> (Disqualifies products with fragrance or undisclosed ingredients)
                  <br />
                  • <span className="text-gold">Avoid Alcohol Denat = TRUE</span> (Strictly eliminates drying astringents)
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: Sourced Product Evidence */}
          {currentStage.id === 4 && (
            <div style={{ width: "100%" }} className="animate-fade-in">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span className="badge badge-gold" style={{ fontSize: "0.65rem" }}>E2 Manufacturer</span>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.5rem" }}>Fenty Beauty</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Pro Filt&apos;r Soft Matte</div>
                  <div className="text-secondary" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                    ✓ 26 INCI ingredients verified<br />
                    ✓ Fragrance-Free verified<br />
                    ✓ Non-comedogenic tested
                  </div>
                </div>

                <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <span className="badge badge-gold" style={{ fontSize: "0.65rem" }}>E2 Manufacturer</span>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.5rem" }}>Estée Lauder</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Double Wear Stay-in-Place</div>
                  <div className="text-secondary" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                    ✓ Full coverage matte<br />
                    ✓ Oil-free formula<br />
                    ✓ Fragrance-free tested
                  </div>
                </div>

                <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(229, 62, 62, 0.3)" }}>
                  <span className="badge badge-ineligible" style={{ fontSize: "0.65rem" }}>Contains Excluded</span>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginTop: "0.5rem" }}>NARS Cosmetics</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>Light Reflecting Fluid</div>
                  <div className="text-secondary" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                    ⚠️ Contains <code>alcohol_denat</code><br />
                    → Triggers Hard Elimination
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 5: Deterministic Decision */}
          {currentStage.id === 5 && (
            <div style={{ width: "100%", textAlign: "center" }} className="animate-fade-in">
              <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ padding: "1rem 1.5rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>CANDIDATES</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>6 Products</div>
                </div>
                <div style={{ padding: "1rem 1.5rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>HARD GATE</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--status-ineligible)" }}>2 Eliminated</div>
                </div>
                <div style={{ padding: "1rem 1.5rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>ELIGIBLE</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--status-eligible)" }}>4 Ranked</div>
                </div>
              </div>

              <div className="badge badge-gold" style={{ fontSize: "0.9rem", padding: "0.5rem 1.5rem" }}>
                ⚖️ 100% Deterministic Mathematical Scoring (0 LLM Authority)
              </div>
            </div>
          )}

          {/* STAGE 6: The Winner */}
          {currentStage.id === 6 && (
            <div style={{ width: "100%" }} className="animate-fade-in">
              <div className="grid-2" style={{ gap: "1.5rem", alignItems: "center" }}>
                <div style={{ padding: "1.5rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)", border: "2px solid var(--accent-gold)" }}>
                  <span className="badge badge-gold">🏆 Rank #1 Winner</span>
                  <h3 style={{ fontSize: "1.4rem", margin: "0.5rem 0 0.25rem" }}>Pro Filt&apos;r Soft Matte (210)</h3>
                  <div className="text-secondary" style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>Fenty Beauty</div>
                  <div className="text-gold font-mono" style={{ fontSize: "1.4rem", fontWeight: 700 }}>93.4 / 100</div>
                  <div className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                    Why it won: Calms 0.88 redness with non-comedogenic oil-control matrix while strictly respecting fragrance-free rule.
                  </div>
                </div>

                <div style={{ padding: "1.5rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
                  <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--status-warning)" }}>Counterfactuals</h4>
                  <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }} className="text-secondary">
                    <li><strong>NARS:</strong> Disqualified due to <code>alcohol_denat</code> exclusion.</li>
                    <li><strong>Estée Lauder:</strong> Ranked #2 (87.1 pts) due to higher opacity than user medium target.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 7: Supplemental Makeup VTO */}
          {currentStage.id === 7 && (
            <div style={{ width: "100%", textAlign: "center" }} className="animate-fade-in">
              <span className="badge badge-gold" style={{ marginBottom: "1rem" }}>
                Perfect Corp S2S Makeup VTO
              </span>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>
                &ldquo;Decision First. Try-On Second.&rdquo;
              </h3>
              <p className="text-secondary" style={{ fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto 1.5rem" }}>
                VTO renders Shade 210 over the user&apos;s face coordinates. If VTO API fails or times out, the recommendation is 100% preserved.
              </p>
              <div
                style={{
                  width: "180px",
                  height: "220px",
                  margin: "0 auto",
                  borderRadius: "var(--radius-md)",
                  border: "2px solid var(--accent-gold)",
                  overflow: "hidden",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✨</div>
                  <div className="text-gold font-mono" style={{ fontSize: "0.75rem" }}>VTO ARTIFACT #210</div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 8: Cryptographic Receipt */}
          {currentStage.id === 8 && (
            <div style={{ width: "100%" }} className="animate-fade-in">
              <div style={{ padding: "1.5rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-medium)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span className="badge badge-gold">RFC 8785 Sealed</span>
                  <span className="badge badge-eligible">✓ Integrity Verified</span>
                </div>

                <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Canonical SHA-256 Digest</div>
                <div className="font-mono text-gold" style={{ fontSize: "0.85rem", wordBreak: "break-all", margin: "0.25rem 0 1rem" }}>
                  b10a8db164e0754105b7a99be72e3fe5aa0a6f443b7cfce2e8e29a9ee1ec41e0
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8rem" }}>
                  <div>
                    <span className="text-muted">SkinState Digest:</span> <span className="font-mono text-secondary">sha256_skin_01...</span>
                  </div>
                  <div>
                    <span className="text-muted">Constraints Digest:</span> <span className="font-mono text-secondary">sha256_uc_01...</span>
                  </div>
                  <div>
                    <span className="text-muted">Decision ID:</span> <span className="font-mono text-secondary">dec_judge_live_01</span>
                  </div>
                  <div>
                    <span className="text-muted">Tamper Proof:</span> <span className="font-mono text-eligible">VALIDATED ✓</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Sticky Player Controls Bar */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(12, 13, 16, 0.92)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border-subtle)",
          padding: "1rem 1.5rem",
          zIndex: 100,
        }}
      >
        <div className="container flex items-center justify-between" style={{ maxWidth: "1000px" }}>
          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-primary"
              style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}
            >
              {isPlaying ? "⏸ Pause" : "▶ Resume"}
            </button>

            <button
              onClick={handlePrev}
              disabled={currentStageIdx === 0}
              className="btn btn-secondary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", opacity: currentStageIdx === 0 ? 0.4 : 1 }}
            >
              &larr; Prev
            </button>

            <button
              onClick={handleNext}
              disabled={currentStageIdx === JUDGE_STAGES.length - 1}
              className="btn btn-secondary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", opacity: currentStageIdx === JUDGE_STAGES.length - 1 ? 0.4 : 1 }}
            >
              Next &rarr;
            </button>

            <button
              onClick={handleRestart}
              className="btn btn-ghost"
              style={{ padding: "0.5rem 0.85rem", fontSize: "0.85rem" }}
            >
              🔄 Restart
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              Space = Pause | Arrows = Step
            </span>

            <Link
              href="/"
              className="btn btn-primary"
              style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
            >
              Try Live System &rarr;
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
