
export interface ImageRating {
  id: string;
  url: string;
  rating: number;
  comparisons: number;
  wins: number;
  losses: number;
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
  const expectedLoser = 1 - expectedWinner;

  const newWinnerRating = Math.round(winner.rating + K_FACTOR * (1 - expectedWinner));
  const newLoserRating = Math.round(loser.rating + K_FACTOR * (0 - expectedLoser));

  return [
    {
      ...winner,
      rating: newWinnerRating,
      comparisons: winner.comparisons + 1,
      wins: winner.wins + 1,
    },
    {
      ...loser,
      rating: newLoserRating,
      comparisons: loser.comparisons + 1,
      losses: loser.losses + 1,
    },
  ];
};
