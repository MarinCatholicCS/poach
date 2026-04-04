@AGENTS.md

# POACH — AI Pitch Coach

## Project Overview

Poach is an AI pitch coach that runs 15 parallel Claude agents (investor archetypes) to react to a spoken pitch, extrapolates to 1,000 simulated investors, and gives structured coaching feedback.

**Event:** Agent Master Hackathon — April 4, 2026, Entrepreneurs First, San Francisco  
**Build window:** 7 hours (9:00 AM – 4:00 PM)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`) — raw API + `Promise.all`, no LangChain/Mastra
- **Data Viz:** Recharts (donut chart, histogram, segment bars)
- **Backend:** Firebase Auth (Google Sign-In) + Firestore
- **Speech-to-Text:** Web Speech API (browser-native, Chrome/Edge)
- **Deployment:** Vercel

## Project Structure

```
/app
  page.tsx                  — screen router (Setup → Pitch → Simulation → Results)
  history/page.tsx          — pitch history (authenticated users only)
  api/research/route.ts     — VIP judge research endpoint (server-side, API key protected)
  api/simulate/route.ts     — main simulation endpoint (server-side, API key protected)

/components
  SetupScreen.tsx           — product input, timer selection, VIP judge URL paste
  PitchScreen.tsx           — countdown timer + microphone + live Web Speech API transcript
  SimulationScreen.tsx      — animated loading ("Polling 1,000 investors...")
  ResultsScreen.tsx         — all data viz + coaching panel
  InvestorTypeBreakdown.tsx — tabbed segment view by investor category
  CoachingPanel.tsx         — what landed / what to cut / how to reframe
  JudgeCard.tsx             — individual VIP judge result card

/lib
  researchLinkedIn.ts       — Step 1: VIP judge research agent (1 Claude call per VIP)
  generateCrowd.ts          — Step 2: crowd generation agent (1 Claude call → 15 archetypes)
  simulateReactions.ts      — Step 3: parallel reaction simulation (15 calls via Promise.all)
  extrapolate.ts            — Step 4: math + investor type grouping (client-side, no API)
  synthesize.ts             — Step 5: results synthesis + coaching (1 Sonnet call)
  firebase.ts               — Firebase init + auth + Firestore helpers
  products.ts               — random product bank (50 items)
```

## Agent Pipeline (~17 API calls, ~5 second runtime)

| Step | Action | Model | Calls |
|------|--------|-------|-------|
| 1 | VIP Judge Research | Haiku 4.5 | N (parallel) |
| 2 | Crowd Generation | Haiku 4.5 | 1 |
| 3 | Parallel Reaction Simulation | Haiku 4.5 | 15 (Promise.all) |
| 4 | Extrapolation to 1,000 | — | 0 (math only) |
| 5 | Results Synthesis + Coaching | Sonnet 4.6 | 1 |

**Models:**
- Steps 1–4: `claude-haiku-4-5-20251001`
- Step 5 (synthesis): `claude-sonnet-4-6`

**Cost:** ~$0.05 per pitch

## Key Data Schemas

### Archetype (output of Step 2)
```ts
{
  name: string
  firm: string
  thesis: string
  portfolio: string[]
  style: string           // "data-driven" | "gut-feel" | "trend-chaser" | "contrarian" | "operator-minded"
  skepticism_level: number // 1–10
  focus_areas: string[]
  check_size: "angel" | "seed" | "series_a_plus"
  geography: string
}
```

### Reaction (output of Step 3 per archetype)
```ts
{
  verdict: "invest" | "pass" | "maybe"
  amount: number
  quote: string
  top_objection: string
  excitement_score: number // 1–10
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
  skepticism_level: number // 1–10
  focus_areas: string[]
}
```

### Synthesis Output (Step 5)
```ts
{
  poachRating: number
  bestCrowdQuote: string
  objectionClusters: { theme: string; frequency: number }[]
  coaching: {
    landed: string[]   // 1–2 strongest pitch elements
    cut: string[]      // language/claims to remove
    reframe: string    // one concrete rewrite of weakest sentence
  }
}
```

### Firestore Schema
```
users/{uid}/pitches/{pitchId}
  product: string
  transcript: string
  duration: 30 | 60
  poachRating: number
  capitalCommitted: number
  verdictSplit: { invest: number, pass: number, maybe: number }
  coachingAdvice: { landed: string[], cut: string[], reframe: string }
  createdAt: timestamp
```

## API Routes

Both routes are server-side — Anthropic API key never exposed to client.

- `POST /api/research` — body: `{ vips: string[] }`, returns `VIPPersona[]`
- `POST /api/simulate` — body: `{ pitch: string, personas: VIPPersona[] }`, runs Steps 2–5, returns full results JSON

## Prompt Engineering Rules

- Always instruct "respond ONLY in JSON, no preamble, no markdown backticks"
- Parse with try/catch; have a fallback default response for each archetype
- Validate required fields before passing downstream
- Set `max_tokens` on every call:
  - Crowd generation: 1,500
  - Reaction calls: 500 each
  - VIP research: 600 each
  - Synthesis: 1,000

## Extrapolation Logic

- Archetypes with higher `skepticism_level` get higher crowd weight (more realistic)
- Angel: ~40% of crowd, Seed: ~35%, Series A+: ~25%
- Total capital = sum of (weighted investors × individual check size)
- Investor type groups: Tech VCs, Consumer VCs, Angels, International

## VIP Judge Fallbacks

If no VIPs entered, always use these hardcoded personas:
- Sam Altman — OpenAI CEO; thesis: AI-first, B2C scale, contrarian bets
- Garry Tan — YC President; thesis: technical founders, early infrastructure
- YC Partner (generic) — thesis: strong team, large market, simple idea
- EF Partner — thesis: exceptional individuals, founder-market fit, deep tech

## Firebase Auth

- Google Sign-In only (one button)
- Anonymous fallback — app works without login, results not saved

## Speech-to-Text (Web Speech API)

```ts
const recognition = new webkitSpeechRecognition()
recognition.continuous = true
recognition.interimResults = true
recognition.onresult = (e) => setTranscript(e.results[...])
```

- Interim results in gray, final in white/black
- Auto-stop when timer hits zero
- Always show fallback textarea beneath mic button

## Scope Cuts (intentionally excluded)

- No actual LinkedIn scraping — web search approximation only
- No mobile optimization — desktop demo only
- No rate limiting or abuse protection
- No multi-language support
- No team/collaborative accounts
- No pitch sharing or public links

## Demo Fallback

Pre-cache a complete result for a known product (e.g. Airbnb). If live simulation lags during judging, switch to cached result instantly. Keep it in `/lib/demoCache.ts`.

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
