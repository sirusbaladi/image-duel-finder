
export interface ImageRating {
  id: string;
  url: string;
  rating_overall: number;
  rating_male: number;
  rating_female: number;
  comparisons_overall: number;
  comparisons_male: number;
  comparisons_female: number;
  wins_overall: number;
  wins_male: number;
  wins_female: number;
  losses_overall: number;
  losses_male: number;
  losses_female: number;
}

const K_FACTOR = 32;
const INITIAL_RATING = 1500;

export const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

export const updateRatings = (
  winner: ImageRating,
  loser: ImageRating,
  gender: 'Woman' | 'Man' | 'Other'
): [ImageRating, ImageRating] => {
  // Helper function to update specific rating category
  const updateRatingCategory = (
    winnerRating: number,
    loserRating: number,
    winnerStats: { comparisons: number; wins: number },
    loserStats: { comparisons: number; losses: number }
  ) => {
    const expectedWinner = calculateExpectedScore(winnerRating, loserRating);
    const expectedLoser = 1 - expectedWinner;

    return {
      newWinnerRating: Math.round(winnerRating + K_FACTOR * (1 - expectedWinner)),
      newLoserRating: Math.round(loserRating + K_FACTOR * (0 - expectedLoser)),
      newWinnerStats: {
        comparisons: winnerStats.comparisons + 1,
        wins: winnerStats.wins + 1
      },
      newLoserStats: {
        comparisons: loserStats.comparisons + 1,
        losses: loserStats.losses + 1
      }
    };
  };

  // Update overall ratings
  const overall = updateRatingCategory(
    winner.rating_overall,
    loser.rating_overall,
    { 
      comparisons: winner.comparisons_overall, 
      wins: winner.wins_overall 
    },
    { 
      comparisons: loser.comparisons_overall, 
      losses: loser.losses_overall 
    }
  );

  // Update gender-specific ratings
  const genderKey = gender === 'Woman' ? 'female' : 'male';
  const genderRatings = updateRatingCategory(
    winner[`rating_${genderKey}`],
    loser[`rating_${genderKey}`],
    { 
      comparisons: winner[`comparisons_${genderKey}`], 
      wins: winner[`wins_${genderKey}`] 
    },
    { 
      comparisons: loser[`comparisons_${genderKey}`], 
      losses: loser[`losses_${genderKey}`] 
    }
  );

  return [
    {
      ...winner,
      rating_overall: overall.newWinnerRating,
      [`rating_${genderKey}`]: genderRatings.newWinnerRating,
      comparisons_overall: overall.newWinnerStats.comparisons,
      [`comparisons_${genderKey}`]: genderRatings.newWinnerStats.comparisons,
      wins_overall: overall.newWinnerStats.wins,
      [`wins_${genderKey}`]: genderRatings.newWinnerStats.wins,
    },
    {
      ...loser,
      rating_overall: overall.newLoserRating,
      [`rating_${genderKey}`]: genderRatings.newLoserRating,
      comparisons_overall: overall.newLoserStats.comparisons,
      [`comparisons_${genderKey}`]: genderRatings.newLoserStats.comparisons,
      losses_overall: overall.newLoserStats.losses,
      [`losses_${genderKey}`]: genderRatings.newLoserStats.losses,
    },
  ];
};
