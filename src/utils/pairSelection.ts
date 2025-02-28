import { ImageRating } from "./elo";

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
 * Returns a pair of images that hasn't been seen by this user
 */
export function selectNextPairForComparison(
  images: ImageRating[],
  randomPhaseLimit: number,
  ratingDiffThreshold: number,
  partialRandomChance = 0.15,
  userGender?: string,
  userId?: string,
  bottomN: number = 2,         // Number of bottom images to consider for exclusion
  exclusionThreshold: number = 20  // Threshold for excluding images (if >= this many comparisons)
): [ImageRating, ImageRating] | null {
  if (!userId) return selectRandomPair(images);

  // Get unseen pairs for the user
  const seenPairs = getSeenPairs(userId);
  const allPairs = images.flatMap((img1, i) =>
    images.slice(i + 1).map(img2 => [img1, img2] as [ImageRating, ImageRating])
  );
  const unseenPairs = allPairs.filter(pair =>
    !seenPairs.has(createPairKey(pair[0].id, pair[1].id))
  );

  if (unseenPairs.length === 0) {
    return null;
  }

  // Determine rating and comparisons keys based on user gender
  const ratingKey = userGender
    ? userGender === 'Woman'
      ? 'rating_female'
      : 'rating_male'
    : 'rating_overall';
  const comparisonsKey = userGender
    ? userGender === 'Woman'
      ? 'comparisons_female'
      : 'comparisons_male'
    : 'comparisons_overall';

  // Calculate total votes to determine phase
  const totalComparisons = images.reduce(
    (sum, img) => sum + (img[comparisonsKey] as number),
    0
  );
  const totalVotesSoFar = Math.floor(totalComparisons / 2);

  // Random phase or random chance: select any unseen pair (no exclusion)
  if (totalVotesSoFar < randomPhaseLimit || Math.random() < partialRandomChance) {
    return unseenPairs[Math.floor(Math.random() * unseenPairs.length)];
  }

  // Adaptive phase
  // Step 1: Identify excluded images (bottom N with >= exclusionThreshold comparisons)
  const sortedImages = [...images].sort((a, b) => a[ratingKey] - b[ratingKey]);
  const bottomImages = sortedImages.slice(0, bottomN);
  const excludedImages = bottomImages.filter(img => img[comparisonsKey] >= exclusionThreshold);
  const excludedIds = new Set(excludedImages.map(img => img.id));

  // Step 2: Select under-compared pairs (at least one image < 5 comparisons)
  const underComparedPairs = unseenPairs.filter(pair => {
    const [img1, img2] = pair;
    return img1[comparisonsKey] < 5 || img2[comparisonsKey] < 5;
  });
  const underComparedAdaptivePairs = underComparedPairs.filter(pair => {
    const [img1, img2] = pair;
    return Math.abs(img1[ratingKey] - img2[ratingKey]) <= ratingDiffThreshold;
  });

  if (underComparedAdaptivePairs.length > 0) {
    return underComparedAdaptivePairs[
      Math.floor(Math.random() * underComparedAdaptivePairs.length)
    ];
  }

  // Step 3: Select adaptive pairs, excluding bottom N with >= exclusionThreshold comparisons
  const adaptivePairs = unseenPairs.filter(pair => {
    const [img1, img2] = pair;
    return (
      !excludedIds.has(img1.id) &&
      !excludedIds.has(img2.id) &&
      Math.abs(img1[ratingKey] - img2[ratingKey]) <= ratingDiffThreshold
    );
  });

  if (adaptivePairs.length > 0) {
    return adaptivePairs[Math.floor(Math.random() * adaptivePairs.length)];
  }

  // Step 4: Fallback to random unseen pair if no adaptive pairs available
  return unseenPairs[Math.floor(Math.random() * unseenPairs.length)];
}
/**
 * Returns a random unseen pair of images
 */
function findUnseenRandomPair(images: ImageRating[], userId: string): [ImageRating, ImageRating] | null {
  const seenPairs = getSeenPairs(userId);
  const shuffled = [...images].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      if (!seenPairs.has(createPairKey(shuffled[i].id, shuffled[j].id))) {
        return [shuffled[i], shuffled[j]];
      }
    }
  }

  return null;
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

export function recordSeenPair(userId: string, imageA: ImageRating, imageB: ImageRating) {
  saveSeenPair(userId, imageA.id, imageB.id);
}
