# 01 — Hackathon Ground Truth

## Verified from the official Devpost rules as of 2026-08-14

### Required product shape

A working application must integrate at least one Perfect Corp YouCam API from the Skin or Fashion category and demonstrate clear consumer or retail value.

The project must function consistently on its intended platform and as depicted in the submission video/text.

A repository URL is required, containing source code, assets, and instructions needed to run the project.

A 1–3 minute demo video is required. Judges are not required to watch beyond three minutes.

The video must explain the YouCam API used and show the project functioning on the device for which it was built.

The project must remain available for judging/testing.

### Stage One

Pass/fail viability:
- reasonably fits the theme
- reasonably applies required APIs/SDKs

BreakoutGate easily passes if real Skin Analysis and Makeup VTO are demonstrated.

### Stage Two criteria

Equally weighted:

1. Technological Implementation
2. Design
3. Potential Impact
4. Quality of the Idea

### Tie-breaking

The official rules compare tied projects using the criteria in the listed order.

Implication:
**Technological Implementation is the first tie-breaker.**

This justifies prioritizing:
- non-trivial YouCam integration
- real engineering depth
- testability
- resilience
- inspectable decision logic

---

# Exact strategic interpretation

## Technological Implementation

The sponsor asks whether the code reflects genuine effort and a working, non-trivial implementation.

BreakoutGate should visibly demonstrate:

- two meaningful YouCam capabilities
- asynchronous provider workflow handling
- normalized domain models
- deterministic ranking
- evidence provenance
- receipt generation
- replay/live separation
- error handling
- tests

## Design

“Complete coherent product experience” means the experience must feel finished from capture to decision.

Do not expose architectural complexity as UI clutter.

## Potential Impact

The problem must be credible and specific.

Avoid generic “beauty shopping is hard.”

Use the exact recurring moment:

> A person who says they are acne-prone or sensitive is facing a visibly stressed-skin day and needs complexion makeup for a near-term event.

## Quality of Idea

The novelty cannot be “analyze skin” or “try on makeup.”

The non-obvious mechanism is:
**skin evidence gates and ranks makeup candidates before VTO.**

---

# Submission constraints to build around

- Repository setup must be reproducible.
- Video should front-load the unique idea.
- Live judging may never happen, so screenshots/video/text must independently explain the mechanism.
- A judge may not watch beyond three minutes.
- The app should remain accessible through the judging period.
- Third-party integrations must be authorized/licensed.
- Avoid copyrighted music in the demo.

---

# Current competition reality

Live research during planning found the gallery substantially populated.

Common shapes include:
- skin diary / routine / recommendations
- skin + wardrobe assistants
- color analysis
- “fit confidence” tools
- generic VTO wrappers
- return reduction
- styling agents

Therefore BreakoutGate must never be marketed as:
- “personalized skincare”
- “AI beauty assistant”
- “virtual makeup try-on”
- “skin scanner”
- “product recommender”

Those phrases make the project sound generic.

Preferred category language:

**real-time makeup purchase decision engine**
or
**skin-aware complexion product decision support**

---

# Prior Perfect Corp winner pattern

Verified examples from other 2026 Perfect Corp-sponsored hackathons show a useful pattern:

## FitCast — DeveloperWeek 2026 winner

The project combined real-time weather with YouCam clothes try-on.

Its strength was not API count. It gave VTO a new decision context:
weather → outfit selection → virtual proof.

Lesson for BreakoutGate:
YouCam is strongest when embedded inside a concrete decision loop.

## InclusiFit — Perfect Corp x Startup World Cup winner

The project centered an underserved adaptive-fashion audience and integrated YouCam deeply across relevant shopping needs.

Lesson:
specific audience + strong product story + visibly non-trivial implementation can beat a generic consumer wrapper.

Do not copy either project’s surface features.

Apply the structural lesson:
**context changes the recommendation, and YouCam makes the decision visible.**
