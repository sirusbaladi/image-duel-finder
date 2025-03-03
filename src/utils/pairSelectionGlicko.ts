// PairSelectionGlicko.ts
import { ImageRating } from "./elo";

// Constants for Glicko calculations
const Q = Math.log(10) / 400; // ≈ 0.005756
const g = (rd: number): number => {
  return 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI));
};

// Create a key function to consistently identify a pair regardless of order
const createPairKey = (id1: string, id2: string): string => {
  return [id1, id2].sort().join('_');
};

// Get seen pairs from localStorage
const getSeenPairs = (userId: string): Set<string> => {
  const seenPairs = localStorage.getItem(`seen_pairs_${userId}`);
  return seenPairs ? new Set(JSON.parse(seenPairs)) : new Set();
};

// Save seen pair to localStorage
const saveSeenPair = (userId: string, id1: string, id2: string) => {
  const seenPairs = getSeenPairs(userId);
  seenPairs.add(createPairKey(id1, id2));
  localStorage.setItem(`seen_pairs_${userId}`, JSON.stringify([...seenPairs]));
};

/**
 * Returns true if this pair has been seen by the user
 */
export const hasPairBeenSeen = (userId: string, id1: string, id2: string): boolean => {
  const seenPairs = getSeenPairs(userId);
  return seenPairs.has(createPairKey(id1, id2));
};

/**
 * Interface for precomputed pair data
 */
interface PairData {
  pair: [ImageRating, ImageRating];
  uncertaintyScore: number; // |E - 0.5|
  minComparisons: number; // Minimum comparisons of the two images
}

/**
 * Returns a pair of images that hasn't been seen by this user, optimized for Glicko
 */
export function selectNextPairForComparison(
  images: ImageRating[],
  randomPhaseLimit: number = 50,
  partialRandomChance: number = 0.2,
  userGender?: string,
  userId?: string,
  minComparisonsThreshold: number = 5
): [ImageRating, ImageRating] | null {
  if (images.length < 2) {
    throw new Error("Not enough images to compare");
  }

  if (!userId) {
    // Fallback to random selection if no user ID
    const indices = new Set<number>();
    while (indices.size < 2) {
      indices.add(Math.floor(Math.random() * images.length));
    }
    const [i1, i2] = Array.from(indices);
    return [images[i1], images[i2]];
  }

  // Determine gender-specific keys
  const ratingKey = userGender
    ? userGender === 'Woman'
      ? 'glicko_rating_female'
      : 'glicko_rating_male'
    : 'glicko_rating_overall';
  const rdKey = userGender
    ? userGender === 'Woman'
      ? 'glicko_female_rd'
      : 'glicko_male_rd'
    : 'glicko_overall_rd';
  const comparisonsKey = userGender
    ? userGender === 'Woman'
      ? 'comparisons_female'
      : 'comparisons_male'
    : 'comparisons_overall';

  // Calculate total votes so far
  const totalComparisons = images.reduce(
    (sum, img) => sum + (img[comparisonsKey] as number),
    0
  );
  const totalVotesSoFar = Math.floor(totalComparisons / 2);

  // Get seen pairs
  const seenPairs = getSeenPairs(userId);

  // Precompute all pairs with their uncertainty scores
  const allPairsData: PairData[] = images
    .flatMap((img1, i) =>
      images.slice(i + 1).map(img2 => {
        const mu1 = img1[ratingKey] as number;
        const mu2 = img2[ratingKey] as number;
        const rd2 = img2[rdKey] as number;
        const g_rd2 = g(rd2);
        const E = 1 / (1 + Math.pow(10, ((mu2 - mu1) * g_rd2) / 400));
        const uncertaintyScore = Math.abs(E - 0.5);
        const minComparisons = Math.min(
          img1[comparisonsKey] as number,
          img2[comparisonsKey] as number
        );
        return {
          pair: [img1, img2] as [ImageRating, ImageRating],
          uncertaintyScore,
          minComparisons,
        };
      })
    )
    .filter(data => !seenPairs.has(createPairKey(data.pair[0].id, data.pair[1].id)));

  if (allPairsData.length === 0) {
    return null;
  }

  // Random phase or random chance
  if (totalVotesSoFar < randomPhaseLimit || Math.random() < partialRandomChance) {
    const randomIndex = Math.floor(Math.random() * allPairsData.length);
    return allPairsData[randomIndex].pair;
  }

  // Adaptive phase: Prioritize under-compared pairs first
  const underComparedPairs = allPairsData.filter(
    data => data.minComparisons < minComparisonsThreshold
  );

  if (underComparedPairs.length > 0) {
    // Sort by uncertaintyScore (ascending) to get the most uncertain pair
    underComparedPairs.sort((a, b) => a.uncertaintyScore - b.uncertaintyScore);
    return underComparedPairs[0].pair;
  }

  // If no under-compared pairs, select the most uncertain pair overall
  allPairsData.sort((a, b) => a.uncertaintyScore - b.uncertaintyScore);
  return allPairsData[0].pair;
}

/**
 * Records a seen pair
 */
export function recordSeenPair(userId: string, imageA: ImageRating, imageB: ImageRating) {
  saveSeenPair(userId, imageA.id, imageB.id);
}