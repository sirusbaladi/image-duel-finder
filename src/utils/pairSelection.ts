import { ImageRating } from "./elo";

/**
 * Selects the next pair for comparison:
 *  1) If totalVotes < randomPhaseLimit, choose random pair.
 *  2) Otherwise, with some small chance (partialRandomChance), still do random.
 *  3) Otherwise, pick an adaptive pair (rating difference < threshold).
 *
 * totalVotes can be the sum of all images' comparisons / 2.
 */
export function selectNextPairForComparison(
    images: ImageRating[],
    randomPhaseLimit: number,
    ratingDiffThreshold: number,
    partialRandomChance = 0.15
  ): [ImageRating, ImageRating] {
    // Compute total votes from images array
    // Each vote increments comparisons by 1 on each of the two images in the pair.
    // So we sum them up and divide by 2 to get the total number of pairwise votes.
    const totalComparisons = images.reduce((sum, img) => sum + img.comparisons, 0);
    const totalVotesSoFar = Math.floor(totalComparisons / 2);
  
    // 1. Early Random Phase
    if (totalVotesSoFar < randomPhaseLimit) {
      return selectRandomPair(images);
    }
  
    // 2. Partial Random even in adaptive phase
    if (Math.random() < partialRandomChance) {
      return selectRandomPair(images);
    }
  
    // 3. Adaptive
    return selectAdaptivePair(images, ratingDiffThreshold);
  }

/**
 * Returns a purely random pair of distinct images.
 */
export function selectRandomPair(images: ImageRating[]): [ImageRating, ImageRating] {
  if (images.length < 2) {
    throw new Error("Not enough images to compare");
  }
  const indices = new Set<number>();
  while (indices.size < 2) {
    indices.add(Math.floor(Math.random() * images.length));
  }
  const [i1, i2] = Array.from(indices);
  return [images[i1], images[i2]];
}

/**
 * Returns a pair of images whose rating difference <= ratingDiffThreshold.
 * If none found, returns a random pair.
 */
export function selectAdaptivePair(
  images: ImageRating[],
  ratingDiffThreshold: number
): [ImageRating, ImageRating] {
  const candidatePairs: Array<[ImageRating, ImageRating]> = [];

  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const diff = Math.abs(images[i].rating - images[j].rating);
      if (diff <= ratingDiffThreshold) {
        candidatePairs.push([images[i], images[j]]);
      }
    }
  }

  if (candidatePairs.length === 0) {
    // fallback to random if no close pairs
    return selectRandomPair(images);
  }

  // pick a random candidate from the list
  const idx = Math.floor(Math.random() * candidatePairs.length);
  return candidatePairs[idx];
}