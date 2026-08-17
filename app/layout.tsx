import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BreakoutGate — Skin-Context Complexion Decision Engine",
  description: "Real-time skin-aware makeup decision support powered by Perfect Corp / YouCam AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
