
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
    const totalComparisons = images.reduce((sum, img) => sum + img.comparisons_overall, 0);
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
 * It first attempts to force a pairing involving an under-compared image.
 * If no such image exists, it falls back to the regular adaptive selection.
 */
export function selectAdaptivePair(
  images: ImageRating[],
  ratingDiffThreshold: number,
  underComparisonThreshold: number = 10
): [ImageRating, ImageRating] {
  // Attempt to select a pair with an under-compared image
  const underComparedPair = selectUnderComparedPair(images, ratingDiffThreshold, underComparisonThreshold);
  if (underComparedPair) {
    return underComparedPair;
  }

  // If no under-compared pair is available, continue with standard adaptive logic
  const candidatePairs: Array<[ImageRating, ImageRating]> = [];
  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const diff = Math.abs(images[i].rating_overall - images[j].rating_overall);
      if (diff <= ratingDiffThreshold) {
        candidatePairs.push([images[i], images[j]]);
      }
    }
  }
  
  if (candidatePairs.length === 0) {
    // fallback to random if no close pairs are found
    return selectRandomPair(images);
  }
  
  // Return a random candidate from the list
  const idx = Math.floor(Math.random() * candidatePairs.length);
  return candidatePairs[idx];
}

/**
 * Selects a pair where at least one image has fewer than `underComparisonThreshold` comparisons.
 * If such an image exists, it picks one and finds a partner within the rating diff threshold.
 * Returns null if no under-compared images are available.
 */
export function selectUnderComparedPair(
  images: ImageRating[],
  ratingDiffThreshold: number,
  underComparisonThreshold: number = 5
): [ImageRating, ImageRating] | null {
  // Filter images that haven't been compared enough
  const underCompared = images.filter(img => img.comparisons_overall < underComparisonThreshold);
  if (underCompared.length === 0) return null;

  // Pick a random under-compared image
  const image = underCompared[Math.floor(Math.random() * underCompared.length)];

  // Find candidate partners within the acceptable rating difference
  const candidatePartners = images.filter(
    partner =>
      partner.id !== image.id &&
      Math.abs(partner.rating_overall - image.rating_overall) <= ratingDiffThreshold
  );

  if (candidatePartners.length > 0) {
    // Return the pair with a randomly selected partner from the candidates
    const partner = candidatePartners[Math.floor(Math.random() * candidatePartners.length)];
    return [image, partner];
  }

  // Fallback: if no candidate meets the rating threshold, pick any other random image
  let partner: ImageRating;
  do {
    partner = images[Math.floor(Math.random() * images.length)];
  } while (partner.id === image.id);
  return [image, partner];
}