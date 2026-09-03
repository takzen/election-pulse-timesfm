/**
 * D'Hondt seat allocation algorithm for Polish parliamentary elections (Sejm RP).
 * - Total seats: 460 (231 needed for absolute majority).
 * - Statutory threshold: 5.0% for individual political parties.
 * - Non-partisan options (e.g. Niezdecydowani) do not participate in seat distribution.
 */

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
    ([key, p]) => key !== "Niezdecydowani" && p.forecast >= threshold
  );

  const seatsByParty: Record<string, number> = {};
  const isAboveThreshold: Record<string, boolean> = {};

  for (const [key, p] of Object.entries(partiesMeta)) {
    seatsByParty[key] = 0;
    isAboveThreshold[key] = key !== "Niezdecydowani" && p.forecast >= threshold;
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
