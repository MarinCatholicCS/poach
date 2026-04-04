import { generateCrowd } from './lib/generateCrowd'
import { simulateReactions } from './lib/simulateReactions'
import { extrapolate } from './lib/extrapolate'
import { synthesize } from './lib/synthesize'

const PITCH = "We're building an AI pitch coach that simulates 1000 investors reacting to your pitch in 5 seconds. We charge $49/month and have 3 design partners."

async function main() {
  console.log('=== POACH PIPELINE TEST ===\n')
  console.log('Pitch:', PITCH, '\n')

  // Step 2: Generate crowd
  console.log('--- Step 2: generateCrowd ---')
  const archetypes = await generateCrowd(PITCH)
  console.log(`Generated ${archetypes.length} archetypes`)
  console.log(JSON.stringify(archetypes, null, 2))

  // Step 3: Simulate reactions
  console.log('\n--- Step 3: simulateReactions (15 parallel calls) ---')
  const reactions = await simulateReactions(archetypes, PITCH)
  console.log(`Got ${reactions.length} reactions`)
  console.log(JSON.stringify(reactions, null, 2))

  // Step 4: Extrapolate
  console.log('\n--- Step 4: extrapolate (no API call) ---')
  const distribution = extrapolate(archetypes, reactions)
  console.log(JSON.stringify(distribution, null, 2))

  // Step 5: Synthesize
  console.log('\n--- Step 5: synthesize ---')
  const synthesis = await synthesize(distribution, PITCH)
  console.log(JSON.stringify(synthesis, null, 2))

  console.log('\n=== PIPELINE COMPLETE ===')
  console.log(`POACH Rating: ${synthesis.poachRating}/10`)
  console.log(`Capital Committed: $${distribution.capitalCommitted.toLocaleString()}`)
  console.log(`Invest: ${distribution.totalInvest} | Maybe: ${distribution.totalMaybe} | Pass: ${distribution.totalPass}`)
}

main().catch(err => {
  console.error('Pipeline failed:', err)
  process.exit(1)
})
