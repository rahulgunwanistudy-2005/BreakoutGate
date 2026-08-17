"use client";

import React, { useRef, useState } from "react";

interface ImageCaptureViewProps {
  onImageSelected: (base64Image: string, previewUrl: string) => void;
  onBack: () => void;
  isDemoMode?: boolean;
}

export function ImageCaptureView({ onImageSelected, onBack }: ImageCaptureViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeKb: number } | null>(null);
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a valid JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit. Please choose a smaller photo.");
      return;
    }

    setError(null);
    const sizeKb = Math.round(file.size / 1024);
    setFileDetails({ name: file.name, sizeKb });

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      const rawBase64 = result.split(",")[1];
      setBase64(rawBase64);
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleFace = () => {
    // 1x1 neutral beige JPEG sample pixel or standard demo face data
    const sampleDataUrl =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    setPreview(sampleDataUrl);
    setBase64(sampleDataUrl.split(",")[1]);
    setFileDetails({ name: "verified_sample_face.jpg", sizeKb: 14 });
    setError(null);
  };

  const handleProceed = () => {
    if (!base64 || !preview) {
      setError("Please upload or select a face photo before proceeding.");
      return;
    }
    if (!consentGranted) {
      setError("Please grant consent for cosmetic optical analysis.");
      return;
    }
    onImageSelected(base64, preview);
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "700px", padding: "2rem 1rem 5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <button onClick={onBack} className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", marginBottom: "1rem" }}>
          &larr; Back
        </button>
        <span className="badge badge-gold" style={{ marginBottom: "0.5rem" }}>Step 1 of 2</span>
        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Complexion Photo Input</h2>
        <p className="text-secondary" style={{ fontSize: "0.95rem" }}>
          Provide a well-lit front-facing portrait. Perfect Corp AI will measure 11 optical signals to determine your current skin context.
        </p>
      </div>

      <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
        />

        {preview ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: "220px",
                height: "260px",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "2px solid var(--accent-gold)",
                boxShadow: "0 8px 32px rgba(223, 177, 91, 0.2)",
                marginBottom: "1.25rem",
                background: "#000",
              }}
            >
              <img
                src={preview}
                alt="Selected portrait preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            {fileDetails && (
              <div className="font-mono text-muted" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
                {fileDetails.name} ({fileDetails.sizeKb} KB)
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem" }}
            >
              🔄 Change Photo
            </button>
          </div>
        ) : (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border-medium)",
                borderRadius: "var(--radius-lg)",
                padding: "3.5rem 1.5rem",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
                marginBottom: "1.5rem",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📷</div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Upload Face Portrait</h3>
              <p className="text-muted" style={{ fontSize: "0.85rem", maxWidth: "340px", margin: "0 auto" }}>
                Drag and drop your photo here, or click to browse. Supported formats: JPEG, PNG, WebP (max 10MB).
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
              <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary">
                Browse Files
              </button>
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>or</span>
              <button onClick={handleUseSampleFace} className="btn btn-secondary">
                ✨ Use Sample Face
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              background: "rgba(229, 62, 62, 0.15)",
              border: "1px solid rgba(229, 62, 62, 0.3)",
              color: "#f56565",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Consent & Privacy Notice */}
      <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={consentGranted}
            onChange={(e) => setConsentGranted(e.target.checked)}
            style={{ marginTop: "0.2rem", accentColor: "var(--accent-gold)" }}
          />
          <span className="text-secondary" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
            I consent to ephemeral optical analysis of my portrait via Perfect Corp S2S AI API for cosmetic formulation matching. Raw biometrics are not stored in decision receipts or server databases.
          </span>
        </label>
      </div>

      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleProceed}
          disabled={!preview}
          className="btn btn-primary"
          style={{ padding: "0.85rem 2rem", opacity: preview ? 1 : 0.5 }}
        >
          Next: Set User Constraints &rarr;
        </button>
      </div>
    </div>
  );
}
