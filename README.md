# POACH — AI Pitch Coach

Run your startup pitch in front of 1,000 simulated investors. Get structured coaching in seconds.



## What it does

POACH runs 15 parallel Claude agents (investor archetypes) to react to your spoken pitch, extrapolates to 1,000 simulated investors, and returns structured coaching feedback — capital committed, verdict breakdown, top objections, and a Poach Rating.

Built at the **Agent Master Hackathon — April 4, 2026, Entrepreneurs First, San Francisco**.

## Agent Pipeline

| Step | Action | Model | Calls |
|------|--------|-------|-------|
| 1 | VIP Judge Research | Haiku 4.5 | N (parallel) |
| 2 | Crowd Generation | Haiku 4.5 | 1 |
| 3 | Parallel Reaction Simulation | Haiku 4.5 | 15 (Promise.all) |
| 4 | Extrapolation to 1,000 | — | 0 (math only) |
| 5 | Results Synthesis + Coaching | Sonnet 4.6 | 1 |

~17 API calls, ~5–10 second runtime, ~$0.05 per pitch.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`) — raw API + `Promise.all`
- **Data Viz:** Recharts v3
- **Speech-to-Text:** Web Speech API (browser-native)
- **Deployment:** Vercel

## Project Structure

```
/app
  page.tsx                  — screen router (Setup → Pitch → Simulation → Results)
  api/research/route.ts     — VIP judge research (server-side)
  api/simulate/route.ts     — main simulation endpoint (server-side)

/components
  SetupScreen.tsx           — product input, timer, VIP judge input, dev JSON loader
  PitchScreen.tsx           — countdown timer + mic + live transcript
  SimulationScreen.tsx      — animated loading with 0→1000 investor counter
  ResultsScreen.tsx         — all data viz + coaching panel + raw JSON dev panel
  InvestorTypeBreakdown.tsx — tabbed segment view (Tech VCs / Consumer VCs / Angels / International)
  CoachingPanel.tsx         — what landed / what to cut / how to reframe
  JudgeCard.tsx             — individual VIP judge result card

/lib
  generateCrowd.ts          — crowd generation agent (15 archetypes)
  simulateReactions.ts      — parallel reaction simulation (15 calls)
  extrapolate.ts            — math + investor type grouping (no API)
  synthesize.ts             — results synthesis + coaching
  products.ts               — random product bank (50 items)
  demoCache.ts              — pre-cached result for demo fallback
```

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your Anthropic API key:

```
ANTHROPIC_API_KEY=your_key_here
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge (required for Web Speech API).

## Demo Fallback

If live simulation lags, paste the pre-cached JSON from `/lib/demoCache.ts` into the dev loader on the Setup screen to jump directly to Results.

**Demo pitch:** "We're building the Stripe for space logistics..."

## Deployment

Deploy to Vercel. Set `ANTHROPIC_API_KEY` in your Vercel environment variables.

```bash
vercel deploy
```
