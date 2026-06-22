# Elmer

**Practical Ham Radio · Socratic Tutor**

> You passed the exam. Now what?

Elmer is an AI-powered Socratic tutor for newly licensed amateur radio operators. It doesn't explain things — it asks questions until you figure it out yourself. That's how real operational knowledge gets built.

Live at [elmer.ny0e.com](https://elmer.ny0e.com)

---

## What it does

Most ham radio study tools optimize for passing the exam. Elmer is built for what comes after — the moment you sit down at a real radio and realize you have no idea what you're doing.

Elmer uses the Socratic method: it never lectures, never explains unprompted, and never corrects directly. It asks one question at a time and probes your answers until your mental model is solid enough to actually use on the air.

## Topics

- Making Your First QSO
- Your Antenna System (feedline, SWR, connectors)
- Propagation Intuition
- Working Repeaters
- Troubleshooting Your Station
- VHF/UHF in Practice

## Stack

- Next.js 14 (App Router)
- TypeScript
- Claude Haiku via Anthropic API (server-side)
- Deployed on Vercel

## Setup

```bash
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

## Part of the NY0E suite

- [QRZReady](https://qrzready.com) — Ham radio exam prep
- [CWReady](https://cwready.com) — Morse code trainer
- [Elmer](https://elmer.ny0e.com) — Practical operations tutor

---

*73 de NY0E*
