import { ImageRating } from "./elo";

/**
 * Selects the next pair for comparison.
 * Now accepts an optional `userGender` parameter to use gender-specific ratings.
 *
 * @param images - list of image ratings
 * @param randomPhaseLimit - threshold for using random selection
 * @param ratingDiffThreshold - maximum allowed rating difference for adaptive selection
 * @param partialRandomChance - chance to pick random even in adaptive phase
 * @param userGender - (optional) user’s gender to base the selection on ('Woman' or any other value for 'Man')
 */
export function selectNextPairForComparison(
  images: ImageRating[],
  randomPhaseLimit: number,
  ratingDiffThreshold: number,
  partialRandomChance = 0.15,
  userGender?: string
): [ImageRating, ImageRating] {
  // Determine keys based on userGender (default to overall if not provided)
  const ratingKey = userGender ? (userGender === 'Woman' ? 'rating_female' : 'rating_male') : 'rating_overall';
  const comparisonsKey = userGender ? (userGender === 'Woman' ? 'comparisons_female' : 'comparisons_male') : 'comparisons_overall';

  // Compute total votes from images using the appropriate comparisons field
  const totalComparisons = images.reduce((sum, img) => sum + (img[comparisonsKey] as number), 0);
  const totalVotesSoFar = Math.floor(totalComparisons / 2);

  // 1. Early Random Phase
  if (totalVotesSoFar < randomPhaseLimit) {
    return selectRandomPair(images);
  }

  // 2. Partial Random even in adaptive phase
  if (Math.random() < partialRandomChance) {
    return selectRandomPair(images);
  }

  // 3. Adaptive selection using gender-specific ratings if available
  return selectAdaptivePair(images, ratingDiffThreshold, userGender);
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
 * Returns a pair of images whose rating difference is within the threshold.
 * Accepts an optional `userGender` parameter to use gender-specific ratings.
 */
export function selectAdaptivePair(
  images: ImageRating[],
  ratingDiffThreshold: number,
  userGender?: string,
  underComparisonThreshold: number = 10
): [ImageRating, ImageRating] {
  const ratingKey = userGender ? (userGender === 'Woman' ? 'rating_female' : 'rating_male') : 'rating_overall';

  // First try to force a pairing involving an under-compared image
  const underComparedPair = selectUnderComparedPair(images, ratingDiffThreshold, userGender, underComparisonThreshold);
  if (underComparedPair) {
    return underComparedPair;
  }

  // Otherwise, use standard adaptive logic by collecting candidate pairs with acceptable rating difference
  const candidatePairs: Array<[ImageRating, ImageRating]> = [];
  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const ratingI = (images[i] as any)[ratingKey] as number;
      const ratingJ = (images[j] as any)[ratingKey] as number;
      const diff = Math.abs(ratingI - ratingJ);
      if (diff <= ratingDiffThreshold) {
        candidatePairs.push([images[i], images[j]]);
      }
    }
  }

  if (candidatePairs.length === 0) {
    // Fallback to random selection if no candidate pairs are found
    return selectRandomPair(images);
  }

  // Return a random candidate pair from the list
  const idx = Math.floor(Math.random() * candidatePairs.length);
  return candidatePairs[idx];
}

/**
 * Selects a pair where at least one image has fewer than `underComparisonThreshold` comparisons.
 * Uses gender-specific comparisons/ratings if `userGender` is provided.
 */
export function selectUnderComparedPair(
  images: ImageRating[],
  ratingDiffThreshold: number,
  userGender?: string,
  underComparisonThreshold: number = 5
): [ImageRating, ImageRating] | null {
  const ratingKey = userGender ? (userGender === 'Woman' ? 'rating_female' : 'rating_male') : 'rating_overall';
  const comparisonsKey = userGender ? (userGender === 'Woman' ? 'comparisons_female' : 'comparisons_male') : 'comparisons_overall';

  // Filter images that haven't been compared enough based on the selected comparisons key
  const underCompared = images.filter(img => (img[comparisonsKey] as number) < underComparisonThreshold);
  if (underCompared.length === 0) return null;

  // Pick a random under-compared image
  const image = underCompared[Math.floor(Math.random() * underCompared.length)];

  // Find candidate partners whose gender-specific rating difference is within the threshold
  const candidatePartners = images.filter(
    partner =>
      partner.id !== image.id &&
      Math.abs(((partner as any)[ratingKey] as number) - ((image as any)[ratingKey] as number)) <= ratingDiffThreshold
  );

  if (candidatePartners.length > 0) {
    // Return the pair with a randomly selected partner from the candidates
    const partner = candidatePartners[Math.floor(Math.random() * candidatePartners.length)];
    return [image, partner];
  }

  // Fallback: if no candidate meets the threshold, pick any other random image
  let partner: ImageRating;
  do {
    partner = images[Math.floor(Math.random() * images.length)];
  } while (partner.id === image.id);
  return [image, partner];
}