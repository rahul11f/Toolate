export interface LifestyleProfile {
  sleepSchedule: 'EARLY_BIRD' | 'NIGHT_OWL' | 'FLEXIBLE';
  cleanliness: 'MESSY' | 'MODERATE' | 'NEAT_FREAK';
  guests: 'NEVER' | 'WEEKENDS' | 'ANYTIME';
  workStyle: 'OFFICE' | 'WFH' | 'STUDENT';
  smoking: 'SMOKER' | 'NON_SMOKER' | 'TOLERANT';
  diet: 'VEG' | 'NON_VEG' | 'JAIN' | 'EAT_OUT';
  noiseTolerance: 'QUIET' | 'MODERATE' | 'LOUD';
  budget?: number;
}

/**
 * Calculates compatibility percentage (0 - 100) between two roommate lifestyle profiles
 */
export function calculateCompatibility(
  p1: LifestyleProfile | null,
  p2: LifestyleProfile | null
): number | null {
  if (!p1 || !p2) return null;

  let score = 0;
  let maxScore = 100;

  // 1. Sleep Schedule (Weight: 15)
  if (p1.sleepSchedule === p2.sleepSchedule) {
    score += 15;
  } else if (p1.sleepSchedule === 'FLEXIBLE' || p2.sleepSchedule === 'FLEXIBLE') {
    score += 10;
  } else {
    // Early Bird vs Night Owl
    score += 0;
  }

  // 2. Cleanliness Level (Weight: 20)
  if (p1.cleanliness === p2.cleanliness) {
    score += 20;
  } else if (
    (p1.cleanliness === 'MODERATE') ||
    (p2.cleanliness === 'MODERATE')
  ) {
    score += 12;
  } else {
    // Messy vs Neat Freak
    score -= 5;
  }

  // 3. Guests Preference (Weight: 15)
  if (p1.guests === p2.guests) {
    score += 15;
  } else if (p1.guests === 'WEEKENDS' || p2.guests === 'WEEKENDS') {
    score += 10;
  } else {
    // Never vs Anytime
    score += 2;
  }

  // 4. Smoking Habits (Weight: 20)
  if (p1.smoking === p2.smoking) {
    score += 20;
  } else if (p1.smoking === 'TOLERANT' || p2.smoking === 'TOLERANT') {
    score += 15;
  } else {
    // Smoker vs Non-Smoker conflict
    score -= 10;
  }

  // 5. Diet compatibility (Weight: 15)
  if (p1.diet === p2.diet) {
    score += 15;
  } else if (p1.diet === 'EAT_OUT' || p2.diet === 'EAT_OUT') {
    score += 10;
  } else if (
    (p1.diet === 'VEG' && p2.diet === 'JAIN') ||
    (p1.diet === 'JAIN' && p2.diet === 'VEG')
  ) {
    score += 12;
  } else {
    // Veg vs Non-Veg
    score += 5;
  }

  // 6. Noise Tolerance (Weight: 15)
  if (p1.noiseTolerance === p2.noiseTolerance) {
    score += 15;
  } else if (p1.noiseTolerance === 'MODERATE' || p2.noiseTolerance === 'MODERATE') {
    score += 10;
  } else {
    // Quiet vs Loud
    score -= 5;
  }

  // Bound the score between 0 and 100
  const finalPercentage = Math.max(0, Math.min(100, score));
  return finalPercentage;
}
