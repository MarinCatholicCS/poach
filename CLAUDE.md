@AGENTS.md

# POACH — AI Pitch Coach

## Project Overview

Poach is an AI pitch coach that runs 15 parallel Claude agents (investor archetypes) to react to a spoken pitch, extrapolates to 1,000 simulated investors, and gives structured coaching feedback.

**Event:** Agent Master Hackathon — April 4, 2026, Entrepreneurs First, San Francisco  
**Build window:** 7 hours (9:00 AM – 4:00 PM)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`) — raw API + `Promise.all`, no LangChain/Mastra
- **Data Viz:** Recharts v3 (donut chart, segment bars)
- **Speech-to-Text:** Web Speech API (browser-native, Chrome/Edge)
- **Deployment:** Vercel

## Project Structure

```
/app
  page.tsx                  — screen router (Setup → Pitch → Simulation → Results)
  api/research/route.ts     — VIP judge research endpoint (server-side, API key protected)
  api/simulate/route.ts     — main simulation endpoint (server-side, API key protected)

/components
  SetupScreen.tsx           — product input, timer selection, VIP judge input, dev JSON loader
  PitchScreen.tsx           — countdown timer + microphone + live Web Speech API transcript
  SimulationScreen.tsx      — animated loading with 0→1000 investor counter + retry logic
  ResultsScreen.tsx         — all data viz + coaching panel + raw JSON dev panel
  InvestorTypeBreakdown.tsx — tabbed segment view (Tech VCs / Consumer VCs / Angels / International)
  CoachingPanel.tsx         — what landed / what to cut / how to reframe
  JudgeCard.tsx             — individual VIP judge result card

/lib
  generateCrowd.ts          — Step 2: crowd generation agent (1 Claude call → 15 archetypes)
  simulateReactions.ts      — Step 3: parallel reaction simulation (15 calls via Promise.all)
  extrapolate.ts            — Step 4: math + investor type grouping (pure function, no API)
  synthesize.ts             — Step 5: results synthesis + coaching (1 Sonnet call)
  products.ts               — random product bank (50 items)
```

## Screen Flow

```
SetupScreen → PitchScreen → SimulationScreen → ResultsScreen
```

- `SimulationScreen` owns all API calls (research + simulate). It receives `transcript` and `vipInputs` as props and calls `onComplete(results)` when done.
- `SetupScreen` has a hidden dev panel to paste raw API JSON and jump directly to ResultsScreen (bypasses all API calls — use for testing).

## Agent Pipeline (~17 API calls, ~5–10 second runtime)

| Step | Action | Model | Calls |
|------|--------|-------|-------|
| 1 | VIP Judge Research | Haiku 4.5 | N (parallel, only if VIPs entered) |
| 2 | Crowd Generation | Haiku 4.5 | 1 |
| 3 | Parallel Reaction Simulation | Haiku 4.5 | 15 (Promise.all) |
| 4 | Extrapolation to 1,000 | — | 0 (math only) |
| 5 | Results Synthesis + Coaching | Sonnet 4.6 | 1 |

**Models:**
- Steps 1–3: `claude-haiku-4-5-20251001`
- Step 5 (synthesis): `claude-sonnet-4-6`

**Cost:** ~$0.05 per pitch

## Key Data Schemas

### Archetype (output of Step 2)
```ts
{
  id: number
  name: string
  firm: string
  style: "data-driven" | "gut-feel" | "trend-chaser" | "contrarian" | "operator-minded"
  checkSize: "angel" | "seed" | "series_a_plus"
  skepticismLevel: number  // 1–10
  focusAreas: string[]
  geography: string
}
```

### Reaction (output of Step 3 per archetype)
```ts
{
  archetypeId: number
  verdict: "invest" | "pass" | "maybe"
  amount: number
  quote: string
  top_objection: string
  excitement_score: number  // 1–10
}
```

### VIP Persona (output of Step 1)
```ts
{
  name: string
  firm: string
  thesis: string
  portfolio: string[]
  style: string
  skepticismLevel: number  // 1–10
  focusAreas: string[]
}
```

### VIP Reaction (returned alongside crowd results)
```ts
{
  persona: VIPPersona
  verdict: "invest" | "pass" | "maybe"
  amount: number
  quote: string
  top_objection: string
  excitement_score: number
}
```

### Synthesis Output (Step 5)
```ts
{
  poachRating: number           // 1–10
  bestCrowdQuote: string
  objectionClusters: { theme: string; count: number }[]
  coaching: {
    landed: string              // what resonated
    cut: string                 // language to remove
    reframe: string             // concrete rewrite of weakest sentence
  }
}
```

### Full API Response (from POST /api/simulate)
```ts
{
  archetypes: Archetype[]
  reactions: Reaction[]
  distribution: ExtrapolationResult
  synthesis: SynthesisResult
  vipReactions: VIPReaction[]
}
```

## API Routes

Both routes are server-side — Anthropic API key never exposed to client.

- `POST /api/research` — body: `{ inputs: string[] }`, returns `VIPPersona[]`
- `POST /api/simulate` — body: `{ transcript: string, vipPersonas: VIPPersona[] }`, runs Steps 2–5, returns full results JSON

## Extrapolation Logic (`lib/extrapolate.ts`)

- **Crowd weights:** Angel 40%, Seed 35%, Series A+ 25%
- **Within each check-size group:** higher `skepticismLevel` → higher crowd weight
- **Verdict handling:**
  - `invest` → full crowd count added to capital
  - `maybe` → 10% convert to invest (soft interest, not conviction)
  - `pass` → no capital
- **Capital multiplier:** `capitalCommitted × investRate^0.37` — penalises low invest rates heavily, tapers off above ~10%
- **Check sizes (per individual):** Angel $2,500 · Seed $5,000 · Series A+ $30,000
- **Investor type breakdown:** classified by geography first (international), then checkSize (angels), then focusAreas (consumer keywords), then default (tech VCs). Applies to both invest and converted-maybe counts.

## Archetype Generation (`lib/generateCrowd.ts`)

Prompt explicitly requests this distribution — do not change without updating the classification logic:
- 4 Tech VCs — SF/NYC/Chicago/Austin, enterprise/infra focus
- 4 Consumer VCs — SF/NYC/LA/Boston, consumer/marketplace/social focus
- 4 Angels — US cities only, operator background, lower skepticism (4–7)
- 3 International — London/Berlin/Singapore/Tel Aviv/Toronto

## Prompt Engineering Rules

- Always instruct "respond ONLY in JSON, no preamble, no markdown backticks"
- Parse with `try/catch`; always have a fallback default response
- Strip markdown code fences before parsing (models ignore the no-backticks instruction)
- Set `max_tokens` on every call:
  - Crowd generation: 1,500
  - Reaction calls: 500 each
  - VIP research: 600 each
  - Synthesis: 1,000

## SimulationScreen Behaviour

- API calls fire on mount via `useRef` guard (prevents React StrictMode double-invoke)
- Step labels fade in via CSS `animation-delay` (not `setTimeout`) — immune to StrictMode cleanup
- Investor counter animates 0→999 with `Math.pow(t, 1.1)` easing over 9s, snaps to 1,000 on completion
- On failure: shows retry screen (up to 2 retries) before falling through to ResultsScreen with error

## ResultsScreen Sections

1. Capital hero — animated counter (ease-out cubic, 1.5s)
2. Verdict donut — Recharts PieChart, center label overlaid with CSS
3. InvestorTypeBreakdown — 4 tabs, percentages from raw 15 archetypes, footnoted as sampled
4. Top objections — attributed to matching archetype (name · firm · check size · style · simulated)
5. Best crowd quote — pull-quote from synthesis
6. CoachingPanel — landed (green) / cut (red) / reframe (violet) accent bars
7. Poach Rating — ringed badge, red <5 / amber 5–7 / green 8–10
8. VIP Judges — JudgeCard grid, CTA if none simulated
9. Raw JSON — `<details>` collapsible at bottom for testing

## Speech-to-Text (Web Speech API)

```ts
const recognition = new webkitSpeechRecognition()
recognition.continuous = true
recognition.interimResults = true
recognition.onresult = (e) => setTranscript(e.results[...])
```

- Interim results in gray, final in white
- Auto-stop when timer hits zero
- Fallback textarea always visible beneath mic button

## Demo Fallback

Pre-cache a complete result for "Stripe for Space Logistics" (the demo pitch). If live simulation lags during judging, paste the cached JSON into the dev loader on SetupScreen. Keep it in `/lib/demoCache.ts`.

**Demo pitch:**
> "We're building the Stripe for space logistics. Right now, launching a small satellite costs $500,000 in paperwork, regulatory filings, and launch coordination — before you even touch hardware. We've built an API that handles all of it: frequency allocation, launch slot booking, orbital debris compliance, and re-entry licensing, in a single integration. The next 500 satellite operators coming to market cannot afford to build what the incumbents built internally over 10 years — we give them that same operational infrastructure on day one, at 1% of the cost, so compliance never blocks a launch window. We have two customers live and three more in onboarding, each paying $8K/month. Our ask is $2M to reach 20 customers and prove the compliance automation at scale."

## Scope Cuts (intentionally excluded)

- No Firebase Auth / Firestore — removed from active scope
- No actual LinkedIn scraping — web search approximation only
- No mobile optimization — desktop demo only
- No rate limiting or abuse protection
- No multi-language support

## Environment Variables

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```
