"use client";

import React, { useEffect, useState } from "react";

interface AnalysisProgressViewProps {
  currentStageName?: string;
}

const STAGES = [
  { id: 1, name: "Image Payload Verification", detail: "MIME and dimension security check" },
  { id: 2, name: "Perfect Corp S2S Skin AI", detail: "11-dimension optical signal extraction" },
  { id: 3, name: "Canonical SkinState Mapping", detail: "Multi-signal normalization & provenance" },
  { id: 4, name: "Product Evidence Resolution", detail: "Live manufacturer specifications & claims" },
  { id: 5, name: "Hard Eligibility Filter", detail: "Fragrance & ingredient fail-safe rules" },
  { id: 6, name: "Deterministic Decision Engine", detail: "Decomposed mathematical score & ranking" },
  { id: 7, name: "Supplemental Makeup VTO", detail: "Photorealistic complexion preview" },
  { id: 8, name: "Decision Receipt Hashing", detail: "RFC 8785 canonical SHA-256 audit digest" },
];

export function AnalysisProgressView({ currentStageName }: AnalysisProgressViewProps) {
  const [activeStage, setActiveStage] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev < 8 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "680px", padding: "4rem 1rem 6rem", textAlign: "center" }}>
      <div className="badge badge-gold" style={{ marginBottom: "1rem" }}>
        Executing Decision Pipeline
      </div>

      <h2 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>
        Computing Complexion Decision
      </h2>

      <p className="text-muted" style={{ marginBottom: "2.5rem", fontSize: "0.95rem" }}>
        Evaluating skin metrics, verifying product evidence, and sealing cryptographic receipt...
      </p>

      <div className="card" style={{ textAlign: "left", padding: "1.5rem 2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {STAGES.map((stage) => {
            const isCompleted = activeStage > stage.id;
            const isCurrent = activeStage === stage.id;

            return (
              <div
                key={stage.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  background: isCurrent ? "rgba(223, 177, 91, 0.08)" : "transparent",
                  border: isCurrent ? "1px solid rgba(223, 177, 91, 0.25)" : "1px solid transparent",
                  opacity: isCompleted || isCurrent ? 1 : 0.4,
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: isCompleted ? "var(--status-eligible)" : isCurrent ? "var(--accent-gold)" : "var(--bg-card)",
                      color: isCompleted || isCurrent ? "#0c0d10" : "var(--text-muted)",
                    }}
                  >
                    {isCompleted ? "✓" : stage.id}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: isCurrent ? 600 : 400, color: isCurrent ? "var(--accent-gold)" : "var(--text-primary)" }}>
                      {stage.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>{stage.detail}</div>
                  </div>
                </div>

                <div className="font-mono text-muted" style={{ fontSize: "0.75rem" }}>
                  {isCompleted ? "DONE" : isCurrent ? "PROCESSING..." : "QUEUED"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {currentStageName && (
        <div className="text-muted font-mono" style={{ fontSize: "0.8rem", marginTop: "1.5rem" }}>
          Backend Trace: {currentStageName}
        </div>
      )}
    </div>
  );
}
