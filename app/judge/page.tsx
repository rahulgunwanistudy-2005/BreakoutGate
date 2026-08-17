import React from "react";
import type { Metadata } from "next";
import { JudgeTimelineView } from "../../components/judge/JudgeTimelineView";

export const metadata: Metadata = {
  title: "BreakoutGate — 38-Second Interactive Judge Mode",
  description: "High-density 38-second product and architectural demonstration for hackathon judges.",
};

export default function JudgePage() {
  return <JudgeTimelineView />;
}
