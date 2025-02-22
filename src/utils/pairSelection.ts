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
  userId?: string
): [ImageRating, ImageRating] | null {

//   return [
//     {
//         "id": "4a8462ea-8a8d-48bb-ac24-5bff9b284b08",
//         "url": "https://raw.githubusercontent.com/sirusbaladi/image-duel-finder/refs/heads/main/src/assets/photos/File%2018.webp",
//         "rating_overall": 1504,
//         "comparisons_overall": 70,
//         "wins_overall": 35,
//         "losses_overall": 35,
//         "rating_male": 1492,
//         "comparisons_male": 31,
//         "wins_male": 15,
//         "losses_male": 16,
//         "rating_female": 1516,
//         "comparisons_female": 39,
//         "wins_female": 20,
//         "losses_female": 19
//     },
//     {
//         "id": "06d96d08-0699-4d7a-aab2-3f13510d06a5",
//         "url": "https://raw.githubusercontent.com/sirusbaladi/image-duel-finder/refs/heads/main/src/assets/photos/File%2016.webp",
//         "rating_overall": 1445,
//         "comparisons_overall": 54,
//         "wins_overall": 19,
//         "losses_overall": 35,
//         "rating_male": 1530,
//         "comparisons_male": 33,
//         "wins_male": 17,
//         "losses_male": 16,
//         "rating_female": 1311,
//         "comparisons_female": 21,
//         "wins_female": 2,
//         "losses_female": 19
//     }
// ]


  if (!userId) return selectRandomPair(images);

  const seenPairs = getSeenPairs(userId);
  const allPairs = images.flatMap((img1, i) =>
    images.slice(i + 1).map(img2 => [img1, img2] as [ImageRating, ImageRating])
  );
  const unseenPairs = allPairs.filter(pair => !seenPairs.has(createPairKey(pair[0].id, pair[1].id)));

  if (unseenPairs.length === 0) {
    return null;
  }

  const totalComparisons = images.reduce((sum, img) => {
    const comparisonsKey = userGender === 'Woman' ? 'comparisons_female' : 'comparisons_male';
    return sum + (img[comparisonsKey] as number);
  }, 0);
  const totalVotesSoFar = Math.floor(totalComparisons / 2);

  if (totalVotesSoFar < randomPhaseLimit || Math.random() < partialRandomChance) {
    // Random phase: select any unseen pair
    return unseenPairs[Math.floor(Math.random() * unseenPairs.length)];
  } else {
    // Adaptive phase
    const ratingKey = userGender ? (userGender === 'Woman' ? 'rating_female' : 'rating_male') : 'rating_overall';
    const comparisonsKey = userGender ? (userGender === 'Woman' ? 'comparisons_female' : 'comparisons_male') : 'comparisons_overall';

    // Define under-compared threshold
    const underComparisonThreshold = 5; // or make it a parameter

    // Filter unseen pairs where at least one image is under-compared
    const underComparedPairs = unseenPairs.filter(pair => {
      const [img1, img2] = pair;
      return (img1[comparisonsKey] < underComparisonThreshold) || (img2[comparisonsKey] < underComparisonThreshold);
    });

    // From underComparedPairs, filter those with rating difference within threshold
    const underComparedAdaptivePairs = underComparedPairs.filter(pair => {
      const [img1, img2] = pair;
      const rating1 = img1[ratingKey];
      const rating2 = img2[ratingKey];
      return Math.abs(rating1 - rating2) <= ratingDiffThreshold;
    });

    if (underComparedAdaptivePairs.length > 0) {
      // Select randomly from under-compared adaptive pairs
      return underComparedAdaptivePairs[Math.floor(Math.random() * underComparedAdaptivePairs.length)];
    }

    // If no under-compared adaptive pairs, select from all unseen adaptive pairs
    const adaptivePairs = unseenPairs.filter(pair => {
      const [img1, img2] = pair;
      const rating1 = img1[ratingKey];
      const rating2 = img2[ratingKey];
      return Math.abs(rating1 - rating2) <= ratingDiffThreshold;
    });

    if (adaptivePairs.length > 0) {
      // Select randomly from adaptive pairs
      return adaptivePairs[Math.floor(Math.random() * adaptivePairs.length)];
    }

    // If no adaptive pairs, select randomly from all unseen pairs
    return unseenPairs[Math.floor(Math.random() * unseenPairs.length)];
  }
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
