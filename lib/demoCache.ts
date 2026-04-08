// Pre-cached result for the "Stripe for Space Logistics" demo pitch.
// Use if live simulation lags during judging: copy DEMO_RESULT to JSON,
// then paste into the dev loader on the HeroScreen.

export const DEMO_RESULT = {
  archetypes: [
    // Tech VCs
    { id: 1,  name: 'Marcus Chen',     firm: 'Sequoia Capital',       style: 'data-driven',     checkSize: 'series_a_plus', skepticismLevel: 8, focusAreas: ['enterprise SaaS', 'developer tools', 'infrastructure'], geography: 'San Francisco, CA' },
    { id: 2,  name: 'Priya Sharma',    firm: 'Andreessen Horowitz',   style: 'trend-chaser',    checkSize: 'series_a_plus', skepticismLevel: 6, focusAreas: ['API-first businesses', 'fintech', 'enterprise'],         geography: 'New York, NY' },
    { id: 3,  name: 'Derek Walsh',     firm: 'MATH Ventures',         style: 'operator-minded', checkSize: 'seed',          skepticismLevel: 7, focusAreas: ['B2B SaaS', 'logistics tech', 'vertical software'],      geography: 'Chicago, IL' },
    { id: 4,  name: 'Amber Liu',       firm: 'LiveOak Venture Partners', style: 'contrarian',   checkSize: 'seed',          skepticismLevel: 9, focusAreas: ['deep tech', 'defense', 'space'],                        geography: 'Austin, TX' },
    // Consumer VCs
    { id: 5,  name: 'Sofia Reyes',     firm: 'Lightspeed Ventures',   style: 'gut-feel',        checkSize: 'series_a_plus', skepticismLevel: 5, focusAreas: ['consumer marketplace', 'social', 'creator economy'],    geography: 'San Francisco, CA' },
    { id: 6,  name: 'James Park',      firm: 'Forerunner Ventures',   style: 'trend-chaser',    checkSize: 'seed',          skepticismLevel: 6, focusAreas: ['consumer', 'retail tech', 'brand'],                     geography: 'New York, NY' },
    { id: 7,  name: 'Nina Torres',     firm: 'M13',                   style: 'data-driven',     checkSize: 'seed',          skepticismLevel: 7, focusAreas: ['marketplace', 'consumer health', 'social commerce'],    geography: 'Los Angeles, CA' },
    { id: 8,  name: 'Ben Hawkins',     firm: 'Accomplice VC',         style: 'operator-minded', checkSize: 'seed',          skepticismLevel: 5, focusAreas: ['consumer apps', 'gaming', 'social'],                    geography: 'Boston, MA' },
    // Angels
    { id: 9,  name: 'Rachel Kim',      firm: 'Independent Angel',     style: 'gut-feel',        checkSize: 'angel',         skepticismLevel: 4, focusAreas: ['aerospace', 'deep tech', 'hardware'],                   geography: 'Seattle, WA' },
    { id: 10, name: 'Omar Hassan',     firm: 'Independent Angel',     style: 'operator-minded', checkSize: 'angel',         skepticismLevel: 5, focusAreas: ['B2B SaaS', 'enterprise', 'regulatory tech'],            geography: 'Denver, CO' },
    { id: 11, name: 'Claire Dubois',   firm: 'Independent Angel',     style: 'data-driven',     checkSize: 'angel',         skepticismLevel: 6, focusAreas: ['logistics', 'supply chain', 'infrastructure'],          geography: 'Miami, FL' },
    { id: 12, name: 'Trey Johnson',    firm: 'Independent Angel',     style: 'contrarian',      checkSize: 'angel',         skepticismLevel: 7, focusAreas: ['space tech', 'hard tech', 'defense'],                   geography: 'Houston, TX' },
    // International
    { id: 13, name: 'Lena Fischer',    firm: 'HV Capital',            style: 'data-driven',     checkSize: 'seed',          skepticismLevel: 7, focusAreas: ['B2B SaaS', 'proptech', 'fintech'],                     geography: 'Berlin, Germany' },
    { id: 14, name: 'Raj Mehta',       firm: 'Jungle Ventures',       style: 'trend-chaser',    checkSize: 'seed',          skepticismLevel: 6, focusAreas: ['enterprise', 'logistics', 'emerging markets'],          geography: 'Singapore' },
    { id: 15, name: 'Oliver Grant',    firm: 'Seedcamp',              style: 'operator-minded', checkSize: 'angel',         skepticismLevel: 5, focusAreas: ['API businesses', 'regulatory tech', 'developer tools'], geography: 'London, UK' },
  ],
  reactions: [
    { archetypeId: 1,  verdict: 'invest', amount: 500000, quote: 'API-first compliance is a massive unlock for the next wave of space operators — this is exactly the right wedge.', top_objection: 'Regulatory moat could erode if incumbents open their APIs', excitement_score: 8 },
    { archetypeId: 2,  verdict: 'invest', amount: 250000, quote: 'Stripe for space logistics is the right analogy — the timing on satellite operator growth makes this a generational opportunity.', top_objection: 'Go-to-market beyond early design partners needs proof', excitement_score: 7 },
    { archetypeId: 3,  verdict: 'invest', amount: 100000, quote: 'Two live customers at $8K/month in a nascent market is meaningful traction — I want to see the pipeline.', top_objection: 'Sales cycle for regulatory products can be brutally slow', excitement_score: 7 },
    { archetypeId: 4,  verdict: 'pass',   amount: 0,      quote: 'Interesting thesis but the incumbents will build this when the market is large enough — where is the defensibility?', top_objection: 'No clear technical moat once market validates the idea', excitement_score: 4 },
    { archetypeId: 5,  verdict: 'pass',   amount: 0,      quote: 'Not my category but the clarity of the problem and the ask is excellent.', top_objection: 'Outside consumer investment mandate', excitement_score: 5 },
    { archetypeId: 6,  verdict: 'pass',   amount: 0,      quote: 'Fascinating market, not something we can lead given our focus, but I would syndicate if the right lead comes in.', top_objection: 'Too early-stage for our fund size', excitement_score: 6 },
    { archetypeId: 7,  verdict: 'pass',   amount: 0,      quote: 'Not consumer, but the B2B compliance automation angle is compelling in the abstract.', top_objection: 'Outside our thesis', excitement_score: 4 },
    { archetypeId: 8,  verdict: 'pass',   amount: 0,      quote: 'Wouldn\'t fit our portfolio, but this is a crisp pitch with real paying customers.', top_objection: 'Space tech outside our consumer mandate', excitement_score: 5 },
    { archetypeId: 9,  verdict: 'invest', amount: 25000,  quote: 'The next 500 satellite operators are real and the paperwork hell is real — I\'ve seen it firsthand.', top_objection: 'Team background in regulatory domain not yet established', excitement_score: 9 },
    { archetypeId: 10, verdict: 'invest', amount: 25000,  quote: 'Compliance automation at 1% of the internal build cost is a no-brainer for any operator coming to market.', top_objection: 'Switching costs may be low once operators are established', excitement_score: 8 },
    { archetypeId: 11, verdict: 'invest', amount: 25000,  quote: 'The unit economics are tight and the market timing is excellent given launch cost curves.', top_objection: 'Concentration risk with only 2 live customers', excitement_score: 7 },
    { archetypeId: 12, verdict: 'pass',   amount: 0,      quote: 'Interesting approach but the regulatory environment could change under new administrations.', top_objection: 'Policy risk and government dependency are significant unknowns', excitement_score: 5 },
    { archetypeId: 13, verdict: 'invest', amount: 100000, quote: 'The API abstraction layer for compliance is exactly the pattern we\'ve backed in other regulated verticals.', top_objection: 'European launch slot regulations differ significantly — international expansion is complex', excitement_score: 7 },
    { archetypeId: 14, verdict: 'invest', amount: 100000, quote: 'Emerging market satellite operators are desperate for this — Southeast Asia alone has 40+ operators coming online.', top_objection: 'Geographic focus unclear — are they US-only at first?', excitement_score: 8 },
    { archetypeId: 15, verdict: 'invest', amount: 25000,  quote: 'Regulatory API businesses have enormous retention once integrated — churn should be near zero.', top_objection: 'UK and EU regulatory frameworks would require substantial localisation', excitement_score: 8 },
  ],
  distribution: {
    totalInvest: 427,
    totalPass: 573,
    capitalCommitted: 2143000,
    investorTypeBreakdown: {
      techVCs: 172,
      consumerVCs: 0,
      angels: 148,
      international: 107,
    },
    topObjections: [
      'No clear technical moat once market validates',
      'Sales cycle for regulatory products is slow',
      'Policy and regulatory risk',
    ],
    bestQuote: 'The next 500 satellite operators are real and the paperwork hell is real — I\'ve seen it firsthand.',
  },
  synthesis: {
    poachRating: 7.2,
    bestCrowdQuote: 'API-first compliance is a massive unlock for the next wave of space operators — this is exactly the right wedge.',
    objectionClusters: [
      { theme: 'Defensibility and competitive moat', count: 9 },
      { theme: 'Customer concentration risk', count: 7 },
      { theme: 'Policy and regulatory change risk', count: 6 },
      { theme: 'Sales cycle and go-to-market speed', count: 5 },
      { theme: 'Geographic and international expansion complexity', count: 4 },
    ],
    coaching: {
      landed: 'The "Stripe for X" analogy worked — investors immediately grasped the abstraction layer. Two live paying customers at $8K/month gave the pitch real credibility. The market sizing rationale (500 incoming operators) landed clearly.',
      cut: 'Avoid "before you even touch hardware" — it reads as insider jargon that slows down non-space investors. Cut the build time comparison (10 years) without evidence; it sounds like a guess.',
      reframe: 'Instead of "we handle frequency allocation, launch slots, debris compliance, and re-entry licensing" — try "one API call replaces six months of regulatory back-and-forth across four agencies." Specificity over enumeration.',
    },
  },
  vipReactions: [],
}
