/**
 * D'Hondt seat allocation for the Sejm: 460 seats, 231 for a majority, 5% threshold.
 *
 * The percentages handed in must already be shares of **decided voters**, which is how
 * the payload exports them. That matters for the threshold: it is set on valid votes
 * cast, and undecided respondents cast none. Computing it on a base that still included
 * them would understate every party by roughly a tenth of its own value and could zero
 * out a party sitting just under 5%.
 *
 * Excluded from the allocation: the undecided group (not a party) and the aggregate of
 * remaining parties, which is several parties summed and so can never be awarded seats
 * as though it were one list.
 */
const NON_ALLOCATABLE = new Set(["Niezdecydowani", "Inne_partie"]);

export interface ParliamentSimulation {
  seatsByParty: Record<string, number>;
  isAboveThreshold: Record<string, boolean>;
  coalitionSeats: number;
  oppositionSeats: number;
  totalSeats: number;
  threshold: number;
}

export const COALITION_PARTIES = ["KO", "PSL", "Polska_2050", "Lewica"];
export const OPPOSITION_PARTIES = ["PiS", "Konfederacja", "KKP", "Rozwoj_Plus", "Razem"];

export function calculateDhondtSeats(
  partiesMeta: Record<string, { forecast: number }>,
  totalSeats: number = 460,
  threshold: number = 5.0
): ParliamentSimulation {
  const eligibleParties = Object.entries(partiesMeta).filter(
    ([key, p]) => !NON_ALLOCATABLE.has(key) && p.forecast >= threshold
  );

  const seatsByParty: Record<string, number> = {};
  const isAboveThreshold: Record<string, boolean> = {};

  for (const [key, p] of Object.entries(partiesMeta)) {
    seatsByParty[key] = 0;
    isAboveThreshold[key] = !NON_ALLOCATABLE.has(key) && p.forecast >= threshold;
  }

  if (eligibleParties.length > 0) {
    // Generate quotients: vote / divisor
    const quotients: { partyKey: string; quotient: number }[] = [];
    for (const [key, p] of eligibleParties) {
      for (let divisor = 1; divisor <= totalSeats; divisor++) {
        quotients.push({
          partyKey: key,
          quotient: p.forecast / divisor,
        });
      }
    }

    // Sort descending
    quotients.sort((a, b) => b.quotient - a.quotient);

    // Assign top totalSeats quotients
    for (let i = 0; i < totalSeats && i < quotients.length; i++) {
      const winner = quotients[i].partyKey;
      seatsByParty[winner] = (seatsByParty[winner] || 0) + 1;
    }
  }

  let coalitionSeats = 0;
  let oppositionSeats = 0;

  for (const p of COALITION_PARTIES) {
    coalitionSeats += seatsByParty[p] || 0;
  }

  for (const p of OPPOSITION_PARTIES) {
    oppositionSeats += seatsByParty[p] || 0;
  }

  return {
    seatsByParty,
    isAboveThreshold,
    coalitionSeats,
    oppositionSeats,
    totalSeats,
    threshold,
  };
}
