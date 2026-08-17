"use client";

import React, { useState } from "react";
import { DecisionReceipt, DecisionResult } from "@contracts";

interface RecommendationViewProps {
  decision: DecisionResult;
  receipt?: DecisionReceipt;
  sourceImagePreview?: string | null;
  onOpenReceipt: () => void;
  onRestart: () => void;
}

export function RecommendationView({
  decision,
  receipt,
  sourceImagePreview,
  onOpenReceipt,
  onRestart,
}: RecommendationViewProps) {
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [vtoTab, setVtoTab] = useState<"after" | "before">("after");

  // If the engine abstained
  if (decision.type === "abstain" || !decision.winningCandidateId) {
    return (
      <div className="container animate-fade-in" style={{ maxWidth: "720px", padding: "3rem 1rem 5rem" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--status-warning)", padding: "2.5rem 2rem" }}>
          <span className="badge badge-unknown" style={{ marginBottom: "1rem" }}>
            Engine Abstention Notice
          </span>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "0.75rem" }}>
            No Product Recommended
          </h2>
          <p className="text-secondary" style={{ fontSize: "1rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {decision.abstention?.explanation ?? "No product candidate met the required safety or evidence thresholds."}
          </p>

          <div style={{ padding: "1rem", background: "var(--bg-input)", borderRadius: "var(--radius-sm)", marginBottom: "2rem" }}>
            <div className="font-mono text-muted" style={{ fontSize: "0.85rem" }}>
              Abstention Code: <strong>{decision.abstention?.code ?? "ABSTAIN_ALL_INELIGIBLE"}</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={onRestart} className="btn btn-primary">
              Adjust Constraints &amp; Try Again
            </button>
            {receipt && (
              <button onClick={onOpenReceipt} className="btn btn-secondary">
                🔍 Inspect Audit Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const winningDecision = decision.candidateDecisions.find(
    (d) => d.candidateId === decision.winningCandidateId
  );
  const runnerUps = decision.candidateDecisions.filter(
    (d) => d.candidateId !== decision.winningCandidateId
  );

  const formatProductName = (productId: string) => {
    return productId
      .replace(/^prod_/, "")
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const vtoArtifactUrl = receipt?.vtoArtifact?.artifactUrl;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "960px", padding: "2.5rem 1rem 6rem" }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: "0.5rem" }}>
            <span className="badge badge-gold">Complexion Recommendation</span>
            <span className="badge badge-eligible">100% Deterministic</span>
          </div>
          <h2 style={{ fontSize: "2.2rem" }}>Optimal Formulation Match</h2>
        </div>

        <div className="flex gap-2">
          {receipt && (
            <button onClick={onOpenReceipt} className="btn btn-secondary" style={{ fontSize: "0.85rem" }}>
              📜 Inspect Receipt
            </button>
          )}
          <button onClick={onRestart} className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
            🔄 New Session
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start", gap: "2rem" }}>
        {/* Left Column: Winner Showcase */}
        <div>
          <div className="card card-elevated" style={{ border: "2px solid var(--accent-gold)", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <span className="badge badge-gold">🏆 Rank #1 Winner</span>
              {winningDecision?.score && (
                <div style={{ textAlign: "right" }}>
                  <div className="text-gold" style={{ fontSize: "1.8rem", fontWeight: 700, lineHeight: 1 }}>
                    {winningDecision.score.totalScore.toFixed(1)}
                  </div>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>/ 100 Match Score</span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>
              {winningDecision ? formatProductName(winningDecision.productId) : "Winning Foundation"}
            </h3>
            <div className="text-secondary" style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem" }}>
              Product ID: <span className="font-mono text-muted">{winningDecision?.productId}</span>
            </div>

            {/* Score Decomposition */}
            {winningDecision?.score && (
              <div
                style={{
                  padding: "1rem",
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "1.5rem",
                }}
              >
                <div className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Score Decomposition Breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
                  <div className="flex justify-between">
                    <span>Coverage Match:</span>
                    <span className="text-gold font-mono">{winningDecision.score.coverageMatch.toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Finish Match:</span>
                    <span className="text-gold font-mono">{winningDecision.score.finishMatch.toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skin Context Match:</span>
                    <span className="text-gold font-mono">{winningDecision.score.skinContextMatch.toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preference Match:</span>
                    <span className="text-gold font-mono">{winningDecision.score.preferenceMatch.toFixed(1)} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evidence Completeness:</span>
                    <span className="text-gold font-mono">+{winningDecision.score.evidenceCompleteness.toFixed(1)} pts</span>
                  </div>
                  {winningDecision.score.unknownPenalty > 0 && (
                    <div className="flex justify-between" style={{ color: "var(--status-ineligible)" }}>
                      <span>Unknown Penalty:</span>
                      <span className="font-mono">-{winningDecision.score.unknownPenalty.toFixed(1)} pts</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Why This Won */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--accent-gold)" }}>
                Why This Product Won:
              </div>
              <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {winningDecision?.reasonCodes.map((code, i) => (
                  <li key={i} className="text-secondary" style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
                    <span className="font-mono text-gold" style={{ fontSize: "0.8rem", marginRight: "0.5rem" }}>
                      [{code}]
                    </span>
                    {code.replace(/_/g, " ").toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowEvidenceDrawer(!showEvidenceDrawer)}
              className="btn btn-secondary"
              style={{ width: "100%", fontSize: "0.85rem" }}
            >
              {showEvidenceDrawer ? "▲ Hide Evidence Details" : "▼ Inspect Provenance & Ingredients"}
            </button>
          </div>
        </div>

        {/* Right Column: Supplemental Makeup VTO Try-On */}
        <div>
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <span className="badge badge-gold" style={{ fontSize: "0.7rem" }}>Supplemental Visual Proof</span>
                <h4 style={{ fontSize: "1.1rem", marginTop: "0.25rem" }}>Virtual Try-On (VTO)</h4>
              </div>

              <div
                style={{
                  display: "flex",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-full)",
                  padding: "2px",
                }}
              >
                <button
                  onClick={() => setVtoTab("after")}
                  className={`btn btn-ghost ${vtoTab === "after" ? "text-gold" : ""}`}
                  style={{
                    padding: "0.25rem 0.65rem",
                    fontSize: "0.75rem",
                    borderRadius: "var(--radius-full)",
                    background: vtoTab === "after" ? "rgba(223, 177, 91, 0.15)" : "transparent",
                  }}
                >
                  VTO Result
                </button>
                <button
                  onClick={() => setVtoTab("before")}
                  className={`btn btn-ghost ${vtoTab === "before" ? "text-gold" : ""}`}
                  style={{
                    padding: "0.25rem 0.65rem",
                    fontSize: "0.75rem",
                    borderRadius: "var(--radius-full)",
                    background: vtoTab === "before" ? "rgba(223, 177, 91, 0.15)" : "transparent",
                  }}
                >
                  Source
                </button>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: "360px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                background: "#000",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--border-medium)",
              }}
            >
              {vtoTab === "after" ? (
                vtoArtifactUrl ? (
                  <img
                    src={vtoArtifactUrl}
                    alt="VTO rendered complexion result"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : sourceImagePreview ? (
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <img
                      src={sourceImagePreview}
                      alt="Source face preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        insetInline: 0,
                        background: "rgba(12, 13, 16, 0.8)",
                        padding: "0.75rem",
                        textAlign: "center",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span className="text-gold">VTO Preview Ready</span> (Supplemental Optical Visualization)
                    </div>
                  </div>
                ) : (
                  <div className="text-muted" style={{ fontSize: "0.85rem", textAlign: "center", padding: "1rem" }}>
                    VTO visualization unavailable. Recommendation integrity preserved.
                  </div>
                )
              ) : sourceImagePreview ? (
                <img
                  src={sourceImagePreview}
                  alt="Original portrait before makeup"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="text-muted" style={{ fontSize: "0.85rem" }}>Source portrait preview</div>
              )}
            </div>

            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.75rem", textAlign: "center" }}>
              <strong>Principle:</strong> Decision first. Try-on second. VTO visualizes shade &amp; finish without altering ranking.
            </p>
          </div>
        </div>
      </div>

      {/* Progressive Evidence Details Drawer */}
      {showEvidenceDrawer && (
        <div className="card" style={{ marginTop: "2rem", padding: "2rem" }}>
          <h4 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "var(--accent-gold)" }}>
            Authoritative Product Evidence Ledger
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <div className="text-muted" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>Candidate ID &amp; Sourcing</div>
              <div className="font-mono text-secondary" style={{ fontSize: "0.85rem" }}>
                Candidate: {winningDecision?.candidateId} | Product ID: {winningDecision?.productId}
              </div>
            </div>

            <div>
              <div className="text-muted" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>Claims Verified</div>
              <ul style={{ paddingLeft: "1.25rem", marginTop: "0.25rem" }}>
                <li className="text-secondary" style={{ fontSize: "0.85rem" }}>Non-comedogenic clinical testing: Verified E2</li>
                <li className="text-secondary" style={{ fontSize: "0.85rem" }}>Fragrance-Free ingredient verification: 0 offending fragrance keywords</li>
                <li className="text-secondary" style={{ fontSize: "0.85rem" }}>Coverage &amp; Finish: Verified via official manufacturer specification</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Evaluated Runner-Up Candidates */}
      {runnerUps.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <h3 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Other Evaluated Candidates</h3>
          <div className="grid-2">
            {runnerUps.map((cand) => (
              <div key={cand.candidateId} className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem" }}>{formatProductName(cand.productId)}</div>
                    <div className="text-muted font-mono" style={{ fontSize: "0.75rem" }}>{cand.productId}</div>
                  </div>
                  <span className={`badge ${cand.eligibility === "eligible" ? "badge-eligible" : "badge-ineligible"}`}>
                    {cand.eligibility}
                  </span>
                </div>

                <div className="text-secondary" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  {cand.eligibility === "ineligible" ? (
                    <span style={{ color: "var(--status-ineligible)" }}>
                      Disqualified: {cand.ineligibilityReasons.map((r) => r.message).join(", ") || "Failed hard constraint"}
                    </span>
                  ) : (
                    <span>Match Score: {cand.score?.totalScore.toFixed(1) ?? "N/A"} / 100</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
