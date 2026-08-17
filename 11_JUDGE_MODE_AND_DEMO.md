# 11 — Judge Mode and Demo Script Architecture

# 60-second Judge Mode storyboard

## 0–6 seconds

Screen:
Landing.

Voice:
“BreakoutGate is for the moment your skin looks stressed, but you still need makeup tonight.”

Click Judge Mode.

## 6–14 seconds

Replay badge appears.

Show selfie → YouCam current signals.

Voice:
“This is a replay of a real YouCam Skin Analysis run. We normalize only the signals our decision engine needs.”

## 14–28 seconds

Three candidate products appear.

User constraint:
Avoid fragrance.

Animate ranking.

Voice:
“We combine current skin signals, the user’s own sensitivities, and source-backed product facts. We never treat missing evidence as safe.”

Candidate C drops due to hard conflict.
Candidate A loses confidence due to unknown data.
Candidate B rises.

## 28–38 seconds

Decision:
**Try Candidate B first**

Open “Why?”

Voice:
“The recommendation is deterministic. Every factor has a reason code and source.”

## 38–48 seconds

Click:
See it on me.

Before/after Makeup VTO.

Voice:
“Only after a product survives the decision layer do we use YouCam Makeup VTO to prove the look visually.”

## 48–57 seconds

Open Receipt.

Show:
- YouCam signals
- user constraint
- product sources
- reason codes
- receipt hash
- provider trace

Voice:
“This is the Decision Receipt: exactly what the system used, what it did not know, and why it chose this candidate.”

## 57–60 seconds

Close.

Voice:
“BreakoutGate turns Skin AI from a score into a purchase decision.”

---

# 2-minute submission video structure

## 0:00–0:20 Problem

Do not start with tech stack.

Show the human moment.

## 0:20–1:10 Product demo

Run the core flow.

## 1:10–1:35 Technical depth

Very briefly show:
- real YouCam adapters
- deterministic engine
- Decision Receipt
- replay/live separation

## 1:35–1:50 Why it is different

“Most projects analyze skin or preview makeup. BreakoutGate makes skin context change the buying decision before preview.”

## 1:50–2:00 Close

Consumer + retailer value.
No fabricated KPI.

---

# Demo reliability

Preload:
- one polished sample selfie you have rights to use
- three product candidates
- one recorded real Skin Analysis fixture
- one recorded real VTO result
- deterministic receipt

Also keep a visible:
**Run Live API**
button for judge exploration.

---

# Demo anti-patterns

Do not:
- wait 60 seconds for API polling in the video
- scroll code for 30 seconds
- show terminal setup
- show every feature
- explain every skin metric
- claim medical accuracy
- bury the VTO moment
- use copyrighted music
