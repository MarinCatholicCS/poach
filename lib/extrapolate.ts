import type { Archetype } from './generateCrowd'
import type { Reaction } from './simulateReactions'

export interface ExtrapolationResult {
  totalInvest: number
  totalPass: number
  totalMaybe: number
  capitalCommitted: number
  investorTypeBreakdown: {
    techVCs: number
    consumerVCs: number
    angels: number
    international: number
  }
  topObjections: string[]
  bestQuote: string
}

const CROWD_SIZE = 1000

const CROWD_WEIGHT: Record<string, number> = {
  angel: 0.40,
  seed: 0.35,
  series_a_plus: 0.25,
}

// Per-individual check size in a crowded simulated room (not lead investment)
const CHECK_AMOUNT: Record<string, number> = {
  angel: 5_000,
  seed: 25_000,
  series_a_plus: 100_000,
}

const CONSUMER_KEYWORDS = ['consumer', 'marketplace', 'retail', 'fashion', 'food', 'health', 'social', 'd2c', 'creator', 'gaming']
const INTL_GEOS = ['london', 'berlin', 'singapore', 'tokyo', 'dubai', 'india', 'europe', 'asia', 'latam', 'toronto', 'sydney']

export function extrapolate(archetypes: Archetype[], reactions: Reaction[]): ExtrapolationResult {
  type Group = { archetype: Archetype; reaction: Reaction }
  const groups: Record<string, Group[]> = { angel: [], seed: [], series_a_plus: [] }

  for (let i = 0; i < archetypes.length; i++) {
    const key = archetypes[i].checkSize
    groups[key].push({ archetype: archetypes[i], reaction: reactions[i] })
  }

  let totalInvest = 0
  let totalPass = 0
  let totalMaybe = 0
  let capitalCommitted = 0
  let techVCs = 0
  let consumerVCs = 0
  let angels = 0
  let international = 0

  for (const [checkSize, groupPairs] of Object.entries(groups)) {
    if (groupPairs.length === 0) continue

    const crowdSlice = Math.round(CROWD_SIZE * CROWD_WEIGHT[checkSize])
    const totalSkepticism = groupPairs.reduce((s, p) => s + p.archetype.skepticismLevel, 0)

    for (const { archetype, reaction } of groupPairs) {
      // Higher skepticism = more common in real world = higher crowd weight
      const weight = archetype.skepticismLevel / totalSkepticism
      const crowdCount = Math.round(crowdSlice * weight)

      if (reaction.verdict === 'invest') {
        totalInvest += crowdCount
        capitalCommitted += crowdCount * CHECK_AMOUNT[checkSize]

        const focusStr = archetype.focusAreas.join(' ').toLowerCase()
        const geoStr = archetype.geography.toLowerCase()

        if (INTL_GEOS.some(g => geoStr.includes(g))) {
          international += crowdCount
        } else if (checkSize === 'angel') {
          angels += crowdCount
        } else if (CONSUMER_KEYWORDS.some(k => focusStr.includes(k))) {
          consumerVCs += crowdCount
        } else {
          techVCs += crowdCount
        }
      } else if (reaction.verdict === 'maybe') {
        // ~30% of maybes eventually convert
        const convertedMaybe = Math.round(crowdCount * 0.3)
        totalInvest += convertedMaybe
        totalMaybe += crowdCount - convertedMaybe
        capitalCommitted += convertedMaybe * CHECK_AMOUNT[checkSize]
      } else {
        totalPass += crowdCount
      }
    }
  }

  const topObjections = reactions
    .filter(r => r.top_objection)
    .map(r => r.top_objection)
    .slice(0, 5)

  const best = reactions.reduce((a, b) =>
    a.excitement_score > b.excitement_score ? a : b
  )

  return {
    totalInvest,
    totalPass,
    totalMaybe,
    capitalCommitted,
    investorTypeBreakdown: { techVCs, consumerVCs, angels, international },
    topObjections,
    bestQuote: best.quote,
  }
}
