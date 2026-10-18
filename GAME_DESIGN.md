# Peony Hanabi: design notes

**Pillars.** The joy of one choice setting off a sky full of fireworks. A pure logic puzzle (which shells can nothing else reach?) wrapped in the most spectacular payoff we can draw. There are no timers, and a failed night simply begins again.

**Rules.**
- The sky is 6 × 9 units. Shell i lights shell j if j is within i's reach:
  - **Peony:** distance ≤ r (1.35 small, 2.0 large).
  - **Comet:** along one of 8 directions, up to 4.2 units, within 0.42 of the line.
  - **Crossette:** the same along 4 directions (+ or ×), 2.3 units.
- Lit shells are spent and relay nothing more.
- A night has exactly as many matches as the minimum needed.

**Theory.** The fewest matches equals the number of source components: strongly connected groups that no other group reaches (Tarjan). Any shell in a source group works; every source group needs its own match. The player's task is to see the reach graph.

**Generation (`tools/gen.ts`).**
- Scatter shells at least 1.05 apart, drawing kinds from the chapter's mix.
- Keep the sky only if:
  - the minimum equals the template's match count;
  - no shell is isolated (reaching nothing and reached by nothing);
  - every kind in the mix appears.
- Luck: the share of 600 random playouts (random unlit shells, exactly enough matches) that light the sky. For each level, the candidate whose luck is nearest the target (log scale) is kept. Targets fall from 0.3 to 0.008.

**Timing.** A burst reaches a shell after 0.32 + 0.1 × distance seconds. Chains are scheduled Dijkstra-style, and a glowing fuse draws each link.

**Hints.**
- If the remaining source groups outnumber the matches, restart the night (counted as a try).
- Then select the best member (the one that lights the most) of the source group with the biggest chain.

**Stars.** 3 on the first try without a hint. 2 for tries 2–3, or with one hint. Otherwise 1.

**Accessibility.**
- Two-tap lighting with a full reach preview, so there are no accidental strikes.
- Reduced motion trims particle counts and removes bobbing and pulses.
- Booms duck when many overlap.
- Every control is 46 px+ and aria-labelled.
- Plays fully offline.
