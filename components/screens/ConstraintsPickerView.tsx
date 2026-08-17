"use client";

import React, { useState } from "react";
import { CoverageLevel, FinishType, UserConstraints } from "@contracts";

interface ConstraintsPickerViewProps {
  onSubmit: (constraints: UserConstraints) => void;
  onBack: () => void;
}

export function ConstraintsPickerView({ onSubmit, onBack }: ConstraintsPickerViewProps) {
  // Hard Constraints
  const [avoidFragrance, setAvoidFragrance] = useState<boolean>(true);
  const [avoidIngredientsInput, setAvoidIngredientsInput] = useState<string>("");
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>([]);
  const [requiredCoverage, setRequiredCoverage] = useState<CoverageLevel | "">("");
  const [requiredFinish, setRequiredFinish] = useState<FinishType | "">("");
  const [avoidPoreClogging, setAvoidPoreClogging] = useState<boolean>(false);

  // Soft Preferences
  const [targetCoverage, setTargetCoverage] = useState<CoverageLevel>("medium");
  const [targetFinish, setTargetFinish] = useState<FinishType>("natural");
  const [skinFeel, setSkinFeel] = useState<"lightweight" | "hydrating" | "oil_controlling" | "balancing">("hydrating");
  const [eventContext, setEventContext] = useState<"daily" | "interview" | "wedding" | "date" | "presentation">("daily");
  const [wearTime, setWearTime] = useState<"low" | "medium" | "high">("medium");

  const handleAddIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && avoidIngredientsInput.trim()) {
      e.preventDefault();
      const val = avoidIngredientsInput.trim().toLowerCase();
      if (!avoidIngredients.includes(val)) {
        setAvoidIngredients([...avoidIngredients, val]);
      }
      setAvoidIngredientsInput("");
    }
  };

  const handleRemoveIngredient = (ing: string) => {
    setAvoidIngredients(avoidIngredients.filter((i) => i !== ing));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const canonicalConstraints: UserConstraints = {
      version: "1.0.0",
      constraintId: `uc_${Date.now()}`,
      declaredAt: new Date().toISOString(),
      hardConstraints: {
        avoidFragrance,
        avoidIngredients,
        avoidPoreCloggingClaims: avoidPoreClogging,
        requiredCoverage: requiredCoverage ? (requiredCoverage as CoverageLevel) : undefined,
        requiredFinish: requiredFinish ? (requiredFinish as FinishType) : undefined,
      },
      softPreferences: {
        targetCoverage,
        targetFinish,
        skinFeelPreference: skinFeel,
        eventContext,
        wearTimeImportance: wearTime,
      },
      provenance: {
        sourceType: "user",
        retrievedAt: new Date().toISOString(),
        confidence: 1,
      },
    };

    onSubmit(canonicalConstraints);
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "760px", padding: "2rem 1rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <button onClick={onBack} className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", marginBottom: "1rem" }}>
          &larr; Back to Photo
        </button>
        <span className="badge badge-gold" style={{ marginBottom: "0.5rem" }}>Step 2 of 2</span>
        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>User Constraints &amp; Preferences</h2>
        <p className="text-secondary" style={{ fontSize: "0.95rem" }}>
          Define hard exclusion rules (strictly eliminates candidates) and soft preference weights for formulation scoring.
        </p>
      </div>

      <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Section 1: Hard Constraints */}
        <div className="card" style={{ borderLeft: "4px solid var(--status-ineligible)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <span className="badge badge-ineligible">Hard Exclusions</span>
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>Candidates failing these rules are strictly disqualified.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Fragrance Avoidance */}
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Avoid Fragrance &amp; Essential Oils</div>
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                  Disqualifies products with fragrance or undisclosed ingredients (fail-safe policy).
                </div>
              </div>
              <input
                type="checkbox"
                checked={avoidFragrance}
                onChange={(e) => setAvoidFragrance(e.target.checked)}
                style={{ width: "20px", height: "20px", accentColor: "var(--accent-gold)" }}
              />
            </label>

            {/* Avoid Pore-Clogging Claims */}
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Require Non-Comedogenic Claim</div>
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                  Disqualifies products without verified non-comedogenic testing.
                </div>
              </div>
              <input
                type="checkbox"
                checked={avoidPoreClogging}
                onChange={(e) => setAvoidPoreClogging(e.target.checked)}
                style={{ width: "20px", height: "20px", accentColor: "var(--accent-gold)" }}
              />
            </label>

            {/* Strictly Required Coverage */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                  Strictly Required Coverage (Hard Filter)
                </label>
                <select
                  value={requiredCoverage}
                  onChange={(e) => setRequiredCoverage(e.target.value as CoverageLevel | "")}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                  }}
                >
                  <option value="">Any Coverage (Flexible)</option>
                  <option value="sheer">Must be Sheer</option>
                  <option value="light">Must be Light</option>
                  <option value="medium">Must be Medium</option>
                  <option value="full">Must be Full</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                  Strictly Required Finish (Hard Filter)
                </label>
                <select
                  value={requiredFinish}
                  onChange={(e) => setRequiredFinish(e.target.value as FinishType | "")}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                  }}
                >
                  <option value="">Any Finish (Flexible)</option>
                  <option value="matte">Must be Matte</option>
                  <option value="natural">Must be Natural</option>
                  <option value="satin">Must be Satin</option>
                  <option value="dewy">Must be Dewy</option>
                  <option value="radiant">Must be Radiant</option>
                </select>
              </div>
            </div>

            {/* Excluded Ingredients Tags */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.35rem" }}>
                Specific Excluded Ingredients
              </label>
              <div className="text-muted" style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                Type an ingredient (e.g. alcohol_denat, salicylic_acid) and press Enter to exclude.
              </div>
              <input
                type="text"
                placeholder="Add excluded ingredient and press Enter..."
                value={avoidIngredientsInput}
                onChange={(e) => setAvoidIngredientsInput(e.target.value)}
                onKeyDown={handleAddIngredient}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                }}
              />
              {avoidIngredients.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {avoidIngredients.map((ing) => (
                    <span
                      key={ing}
                      style={{
                        padding: "0.25rem 0.65rem",
                        background: "rgba(229, 62, 62, 0.2)",
                        border: "1px solid rgba(229, 62, 62, 0.4)",
                        borderRadius: "var(--radius-full)",
                        color: "#f56565",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      {ing}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(ing)}
                        style={{ background: "none", border: "none", color: "#f56565", cursor: "pointer" }}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Soft Preferences */}
        <div className="card" style={{ borderLeft: "4px solid var(--accent-gold)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <span className="badge badge-gold">Target Preferences</span>
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>Adjusts mathematical score weighting among eligible products.</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            {/* Target Coverage */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                Target Coverage
              </label>
              <select
                value={targetCoverage}
                onChange={(e) => setTargetCoverage(e.target.value as CoverageLevel)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                }}
              >
                <option value="sheer">Sheer (Minimalist Tint)</option>
                <option value="light">Light (Breathable)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="full">Full (High Opacity)</option>
              </select>
            </div>

            {/* Target Finish */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                Target Finish
              </label>
              <select
                value={targetFinish}
                onChange={(e) => setTargetFinish(e.target.value as FinishType)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                }}
              >
                <option value="matte">Matte (Anti-Shine)</option>
                <option value="natural">Natural (Skin-Like)</option>
                <option value="satin">Satin (Velvet Smooth)</option>
                <option value="dewy">Dewy (Glow &amp; Hydration)</option>
                <option value="radiant">Radiant (Luminous)</option>
              </select>
            </div>

            {/* Skin Feel */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                Skin Feel Priority
              </label>
              <select
                value={skinFeel}
                onChange={(e) => setSkinFeel(e.target.value as "lightweight" | "hydrating" | "oil_controlling" | "balancing")}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                }}
              >
                <option value="hydrating">Hydrating (Comfort Moisture)</option>
                <option value="oil_controlling">Oil-Controlling (Sebum Absorption)</option>
                <option value="lightweight">Lightweight (Bare Sensation)</option>
                <option value="balancing">Balancing (Adaptive)</option>
              </select>
            </div>

            {/* Event Context */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                Occasion Context
              </label>
              <select
                value={eventContext}
                onChange={(e) => setEventContext(e.target.value as "daily" | "interview" | "wedding" | "date" | "presentation")}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                }}
              >
                <option value="daily">Daily Wear</option>
                <option value="interview">Professional Interview</option>
                <option value="wedding">Wedding / High Stakes</option>
                <option value="date">Evening / Date</option>
                <option value="presentation">Stage / Presentation</option>
              </select>
            </div>

            {/* Wear Time */}
            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                Wear Time Expectation
              </label>
              <select
                value={wearTime}
                onChange={(e) => setWearTime(e.target.value as "low" | "medium" | "high")}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                }}
              >
                <option value="low">Standard / Touch-ups OK</option>
                <option value="medium">Workday (8 Hours)</option>
                <option value="high">All-Day Longwear (12+ Hours)</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "0.9rem 2.5rem", fontSize: "1.05rem" }}>
            Execute Deterministic Decision &rarr;
          </button>
        </div>
      </form>
    </div>
  );
}
