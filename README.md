# BreakoutGate — Complexion Decision Engine

> **Core Thesis:** Bad skin day. Big moment. Make the better makeup decision.

BreakoutGate is a deterministic beauty-tech recommendation and verification engine that changes the cosmetic buying decision based on dynamic optical skin condition before virtual try-on. Powered by Perfect Corp / YouCam AI server-to-server APIs, source-backed product evidence, and cryptographically verifiable SHA-256 decision receipts.

---

## 🌟 Architectural Differentiator

| Ordinary Virtual Try-On | BreakoutGate Architecture |
|---|---|
| Overlays color shades on surface pixels without understanding skin health. | Measures 11 real-time optical signals (redness, spots, texture, oiliness, hydration) via Perfect Corp AI. |
| Recommends pore-clogging formulas containing known irritants. | Enforces strict, fail-safe hard exclusion rules (fragrance avoidance, excluded ingredient tags). |
| Uses opaque, probabilistic ranking or LLM hallucinations. | 100% pure, deterministic mathematical scoring and ranking with zero LLM decision authority. |
| Unverifiable recommendations. | Cryptographically verifiable `DecisionReceipt` with RFC 8785 canonical SHA-256 integrity hash. |
| Try-on decides the winner. | **Decision first. Try-on second.** Supplemental VTO visualizes the winner without modifying rank. |

---

## 🚀 Interactive Judge Mode (38 Seconds)

For hackathon judges and reviewers, a dedicated 38-second interactive timeline demo is available at:
```
http://localhost:3000/judge
```
- **Timeline**: 8 automated story chapters (Thesis $\to$ The Problem $\to$ Optical Context $\to$ Product Evidence $\to$ Deterministic Engine $\to$ The Winner $\to$ Supplemental VTO $\to$ Cryptographic Proof).
- **Controls**: Autoplay, Play/Pause, Step Next/Prev, Restart, Keyboard shortcuts (`Space` to pause, Arrow keys to step).

---

## 🛠️ Technology Stack

- **Runtime & Framework**: Node.js 22+, Next.js 15.5 (App Router, React 19, TypeScript 5.9 Strict)
- **Styling**: Vanilla CSS Design Tokens (Editorial Luxury Beauty-Tech, WCAG AA Accessible)
- **3D Visualization**: Three.js (Dimensional Optical Crystal Spectrum Emblem with pure-CSS fallback)
- **AI Provider**: Perfect Corp / YouCam Server-to-Server (S2S) REST APIs (Skin Analysis & Makeup VTO)
- **Validation & Serialization**: Zod 3.25, RFC 8785 Canonical JSON Serialization, SHA-256 Hashes
- **Testing & Quality**: Vitest 2.1 (115 passing tests across 33 test suites), ESLint 10

---

## 🚦 Getting Started

### 1. Environment Configuration

Create a `.env.local` file from `.env.example`:

```bash
cp .env.example .env.local
```

Configure your Perfect Corp credentials:
```env
YOUCAM_API_KEY="your_api_key_here"
YOUCAM_API_SECRET="your_api_secret_here"
YOUCAM_BASE_URL="https://yce-api-01.makeupar.com"
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the main application or [http://localhost:3000/judge](http://localhost:3000/judge) for Judge Mode.

---

## 🧪 Quality & Verification Commands

```bash
# Run full automated test suite (115 tests across 33 files)
pnpm test

# Run ESLint (0 errors, 0 warnings)
pnpm lint

# Run strict TypeScript compilation check (0 errors)
pnpm typecheck

# Build production Next.js optimized bundle
pnpm build
```

---

## 📜 Cryptographic Decision Receipts

Every recommendation produces an immutable `DecisionReceipt` containing:
- `engineVersion`: Version of the deterministic engine (`1.0.0`).
- `inputs`: SHA-256 digests of `SkinState`, `UserConstraints`, and `ProductEvidence`.
- `result`: Winner ID, candidate ranks, decomposed score breakdown, reason codes, counterfactuals.
- `integrity.canonicalHash`: Canonical RFC 8785 JSON representation hashed with SHA-256.

The frontend includes an interactive **"Run Cryptographic Hash Verification"** tool allowing clients to verify zero receipt tampering locally.

---

## 🔒 Security & Privacy Guarantees

1. **Zero Secret Exposure**: `YOUCAM_API_KEY` and `YOUCAM_API_SECRET` are strictly server-side (zero `NEXT_PUBLIC_` leaks).
2. **Biometric Privacy**: Raw biometric facial images are never stored in decision receipts, server logs, or databases.
3. **No LLM Decision Authority**: All eligibility and ranking decisions are strictly mathematical and rule-based.
