"use client";

import React, { useState } from "react";
import { DecisionReceipt } from "@contracts";
import { verifyDecisionReceipt } from "@receipt";

interface ReceiptViewerModalProps {
  receipt: DecisionReceipt;
  onClose: () => void;
}

export function ReceiptViewerModal({ receipt, onClose }: ReceiptViewerModalProps) {
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    tampered: boolean;
  } | null>(null);

  const handleVerify = () => {
    const res = verifyDecisionReceipt(receipt);
    setVerificationResult({
      tested: true,
      isValid: res.isValid,
      tampered: res.tampered,
    });
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div className="flex items-center gap-2">
            <span className="badge badge-gold">Cryptographic Audit</span>
            <h3 style={{ fontSize: "1.4rem" }}>Decision Receipt</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: "1.2rem", padding: "0.25rem 0.5rem" }}>
            &times;
          </button>
        </div>

        {/* Human Readable Summary */}
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
            <div>
              <span className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Decision ID</span>
              <div className="font-mono text-secondary">{receipt.decisionId}</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Execution Mode</span>
              <div className="font-mono text-gold">{receipt.mode.toUpperCase()}</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Engine Version</span>
              <div className="font-mono text-secondary">{receipt.engineVersion}</div>
            </div>
            <div>
              <span className="text-muted" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>Generated At</span>
              <div className="font-mono text-secondary">{receipt.generatedAt}</div>
            </div>
          </div>
        </div>

        {/* Technical Digest & Cryptographic Block */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--accent-gold)" }}>
            Canonical SHA-256 Digest &amp; Input Hashes
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ background: "var(--bg-input)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
              <div className="text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                Receipt Canonical Hash (SHA-256)
              </div>
              <div className="font-mono" style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", wordBreak: "break-all" }}>
                {receipt.integrity.canonicalHash}
              </div>
            </div>

            {receipt.inputs?.skinStateDigest && (
              <div style={{ background: "var(--bg-input)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                <div className="text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                  SkinState Input Digest
                </div>
                <div className="font-mono text-secondary" style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
                  {receipt.inputs.skinStateDigest}
                </div>
              </div>
            )}

            {receipt.inputs?.userConstraintsDigest && (
              <div style={{ background: "var(--bg-input)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                <div className="text-muted" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                  User Constraints Digest
                </div>
                <div className="font-mono text-secondary" style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
                  {receipt.inputs.userConstraintsDigest}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Trigger */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={handleVerify} className="btn btn-primary" style={{ fontSize: "0.9rem" }}>
            🔒 Run Cryptographic Hash Verification
          </button>

          {verificationResult?.tested && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: verificationResult.isValid ? "var(--status-eligible)" : "var(--status-ineligible)",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              {verificationResult.isValid ? "✓ INTEGRITY VERIFIED (0 TAMPERING)" : "✗ TAMPER DETECTED"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
