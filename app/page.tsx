"use client";

import React, { useState } from "react";
import { Header, ExecutionMode } from "../components/Header";
import { LandingView } from "../components/screens/LandingView";
import { ImageCaptureView } from "../components/screens/ImageCaptureView";
import { ConstraintsPickerView } from "../components/screens/ConstraintsPickerView";
import { AnalysisProgressView } from "../components/screens/AnalysisProgressView";
import { RecommendationView } from "../components/screens/RecommendationView";
import { ReceiptViewerModal } from "../components/modals/ReceiptViewerModal";
import { DecisionResponse } from "../packages/orchestration/types";
import { SkinState, UserConstraints } from "@contracts";
import { createKnownEvidenceField } from "@contracts/evidence";

type AppScreen = "landing" | "image_input" | "constraints" | "analyzing" | "recommendation";

const sampleDemoProvenance = {
  sourceType: "youcam" as const,
  retrievedAt: "2026-08-17T12:00:00.000Z",
  confidence: 1,
};

const sampleDemoSkinState: SkinState = {
  version: "1.0.0",
  analysisId: "an_demo_user_01",
  signals: {
    spots: createKnownEvidenceField(0.75, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    wrinkles: createKnownEvidenceField(0.79, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    texture: createKnownEvidenceField(0.77, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    dark_circles: createKnownEvidenceField(0.78, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    redness: createKnownEvidenceField(0.88, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    oiliness: createKnownEvidenceField(0.69, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    moisture: createKnownEvidenceField(0.69, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    pores: createKnownEvidenceField(0.61, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    radiance: createKnownEvidenceField(0.73, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    firmness: createKnownEvidenceField(0.77, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
    acne: createKnownEvidenceField(0.91, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
  },
  overallQuality: createKnownEvidenceField(0.76, "E1_PROVIDER_MEASURED", sampleDemoProvenance),
  providerMetadata: {
    provider: "youcam",
    providerTaskId: "tsk_demo_01",
  },
  provenance: sampleDemoProvenance,
  capturedAt: "2026-08-17T12:00:00.000Z",
};

export default function BreakoutGateApp() {
  const [screen, setScreen] = useState<AppScreen>("landing");
  const [mode, setMode] = useState<ExecutionMode>("live");
  const [imagePayload, setImagePayload] = useState<{ base64: string; previewUrl: string } | null>(null);
  const [_userConstraints, setUserConstraints] = useState<UserConstraints | null>(null);
  const [decisionResponse, setDecisionResponse] = useState<DecisionResponse | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartLive = () => {
    setMode("live");
    setScreen("image_input");
    setErrorMessage(null);
  };

  const handleStartDemo = () => {
    setMode("demo");
    setScreen("image_input");
    setErrorMessage(null);
  };

  const handleImageSelected = (base64: string, previewUrl: string) => {
    setImagePayload({ base64, previewUrl });
    setScreen("constraints");
  };

  const handleConstraintsSubmit = async (constraints: UserConstraints) => {
    setUserConstraints(constraints);
    setScreen("analyzing");
    setErrorMessage(null);

    try {
      const requestPayload =
        mode === "live"
          ? {
              mode: "live",
              userConstraints: constraints,
              imageBase64: imagePayload?.base64,
            }
          : {
              mode: "demo",
              userConstraints: constraints,
              testSkinState: sampleDemoSkinState,
              options: {
                mockVto: true,
              },
            };

      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      const data: DecisionResponse = await response.json();

      if (!data.success || !data.decision) {
        setErrorMessage(data.error?.message ?? "An error occurred during decision calculation.");
        setScreen("constraints");
        return;
      }

      setDecisionResponse(data);
      setScreen("recommendation");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Network error contacting decision engine.");
      setScreen("constraints");
    }
  };

  const handleReset = () => {
    setScreen("landing");
    setImagePayload(null);
    setUserConstraints(null);
    setDecisionResponse(null);
    setIsReceiptModalOpen(false);
    setErrorMessage(null);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        currentMode={mode}
        onModeChange={(newMode) => setMode(newMode)}
        onReset={handleReset}
        onOpenReceipt={() => setIsReceiptModalOpen(true)}
        hasActiveReceipt={Boolean(decisionResponse?.receipt)}
      />

      <main style={{ flex: 1 }}>
        {errorMessage && screen !== "analyzing" && (
          <div className="container" style={{ paddingTop: "1.5rem" }}>
            <div
              style={{
                padding: "1rem",
                borderRadius: "var(--radius-sm)",
                background: "rgba(229, 62, 62, 0.15)",
                border: "1px solid rgba(229, 62, 62, 0.4)",
                color: "#f56565",
                fontSize: "0.9rem",
              }}
            >
              <strong>Error:</strong> {errorMessage}
            </div>
          </div>
        )}

        {screen === "landing" && (
          <LandingView onStart={handleStartLive} onStartDemo={handleStartDemo} />
        )}

        {screen === "image_input" && (
          <ImageCaptureView
            onImageSelected={handleImageSelected}
            onBack={() => setScreen("landing")}
            isDemoMode={mode === "demo"}
          />
        )}

        {screen === "constraints" && (
          <ConstraintsPickerView
            onSubmit={handleConstraintsSubmit}
            onBack={() => setScreen("image_input")}
          />
        )}

        {screen === "analyzing" && <AnalysisProgressView />}

        {screen === "recommendation" && decisionResponse?.decision && (
          <RecommendationView
            decision={decisionResponse.decision}
            receipt={decisionResponse.receipt}
            sourceImagePreview={imagePayload?.previewUrl}
            onOpenReceipt={() => setIsReceiptModalOpen(true)}
            onRestart={handleReset}
          />
        )}
      </main>

      {/* Cryptographic Decision Receipt Modal */}
      {isReceiptModalOpen && decisionResponse?.receipt && (
        <ReceiptViewerModal
          receipt={decisionResponse.receipt}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
}
