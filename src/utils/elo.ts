
export interface ImageRating {
  id: string;
  url: string;
  rating: number;
  comparisons: number;
}

const K_FACTOR = 32;
const INITIAL_RATING = 1500;

export const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

export const updateRatings = (
  winner: ImageRating,
  loser: ImageRating
): [ImageRating, ImageRating] => {
  const expectedWinner = calculateExpectedScore(winner.rating, loser.rating);
  const expectedLoser = calculateExpectedScore(loser.rating, winner.rating);

  const newWinnerRating = Math.round(winner.rating + K_FACTOR * (1 - expectedWinner));
  const newLoserRating = Math.round(loser.rating + K_FACTOR * (0 - expectedLoser));

  return [
    {
      ...winner,
      rating: newWinnerRating,
      comparisons: winner.comparisons + 1,
    },
    {
      ...loser,
      rating: newLoserRating,
      comparisons: loser.comparisons + 1,
    },
  ];
};

export const getInitialRatings = (images: string[]): ImageRating[] => {
  return images.map((url, index) => ({
    id: `image-${index + 1}`,
    url,
    rating: INITIAL_RATING,
    comparisons: 0,
  }));
};

export const selectPairForComparison = (
  ratings: ImageRating[],
  totalComparisons: number
): [ImageRating, ImageRating] => {
  // Use random pairing for first 50 comparisons
  if (totalComparisons < 50) {
    const indices = getRandomPair(ratings.length);
    return [ratings[indices[0]], ratings[indices[1]]];
  }

  // After that, use adaptive pairing
  const candidates = [];
  for (let i = 0; i < ratings.length; i++) {
    for (let j = i + 1; j < ratings.length; j++) {
      const ratingDiff = Math.abs(ratings[i].rating - ratings[j].rating);
      if (ratingDiff < 100) {
        candidates.push([i, j]);
      }
    }
  }

  if (candidates.length === 0) {
    return selectPairForComparison(ratings, 0); // Fallback to random
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return [ratings[selected[0]], ratings[selected[1]]];
};

const getRandomPair = (max: number): [number, number] => {
  const first = Math.floor(Math.random() * max);
  let second = Math.floor(Math.random() * (max - 1));
  if (second >= first) second++;
  return [first, second];
};
