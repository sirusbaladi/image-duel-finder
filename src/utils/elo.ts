// elo.ts
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
  glicko_rating_overall: number;
  glicko_rating_male: number;
  glicko_rating_female: number;
  glicko_overall_rd: number;
  glicko_male_rd: number;
  glicko_female_rd: number;
}

const K_FACTOR = 32;
const Q = Math.log(10) / 400; // Glicko constant

export const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

// Glicko g function
const g = (rd: number): number => {
  return 1 / Math.sqrt(1 + 3 * Q * Q * rd * rd / (Math.PI * Math.PI));
};

// Update a single Glicko rating and RD
const updateGlickoRating = (
  mu: number,
  rd: number,
  mu_opp: number,
  rd_opp: number,
  s: number // 1 for win, 0 for loss
): [number, number] => {
  const g_opp = g(rd_opp);
  const E = 1 / (1 + Math.pow(10, (mu_opp - mu) * g_opp / 400));
  const variance_inv = Q * Q * g_opp * g_opp * E * (1 - E);
  const delta_mu = (Q * g_opp * (s - E)) / (1 / (rd * rd) + variance_inv);
  const new_mu = mu + delta_mu;
  const new_rd = Math.sqrt(1 / (1 / (rd * rd) + variance_inv));
  return [new_mu, new_rd];
};

export const updateRatings = (
  winner: ImageRating,
  loser: ImageRating,
  gender: 'Woman' | 'Man' | 'Other'
): [ImageRating, ImageRating] => {
  // Elo update helper
  const updateEloCategory = (
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
        wins: winnerStats.wins + 1,
      },
      newLoserStats: {
        comparisons: loserStats.comparisons + 1,
        losses: loserStats.losses + 1,
      },
    };
  };

  // Update Elo overall
  const eloOverall = updateEloCategory(
    winner.rating_overall,
    loser.rating_overall,
    { comparisons: winner.comparisons_overall, wins: winner.wins_overall },
    { comparisons: loser.comparisons_overall, losses: loser.losses_overall }
  );

  // Update Glicko overall
  const [glickoOverallWinner, glickoOverallRdWinner] = updateGlickoRating(
    winner.glicko_rating_overall,
    winner.glicko_overall_rd,
    loser.glicko_rating_overall,
    loser.glicko_overall_rd,
    1
  );
  const [glickoOverallLoser, glickoOverallRdLoser] = updateGlickoRating(
    loser.glicko_rating_overall,
    loser.glicko_overall_rd,
    winner.glicko_rating_overall,
    winner.glicko_overall_rd,
    0
  );

  // Initialize updated images
  let updatedWinner: ImageRating = {
    ...winner,
    rating_overall: eloOverall.newWinnerRating,
    glicko_rating_overall: glickoOverallWinner,
    glicko_overall_rd: glickoOverallRdWinner,
    comparisons_overall: eloOverall.newWinnerStats.comparisons,
    wins_overall: eloOverall.newWinnerStats.wins,
  };

  let updatedLoser: ImageRating = {
    ...loser,
    rating_overall: eloOverall.newLoserRating,
    glicko_rating_overall: glickoOverallLoser,
    glicko_overall_rd: glickoOverallRdLoser,
    comparisons_overall: eloOverall.newLoserStats.comparisons,
    losses_overall: eloOverall.newLoserStats.losses,
  };

  // Update gender-specific ratings
  if (gender === 'Woman') {
    // Elo female
    const eloFemale = updateEloCategory(
      winner.rating_female,
      loser.rating_female,
      { comparisons: winner.comparisons_female, wins: winner.wins_female },
      { comparisons: loser.comparisons_female, losses: loser.losses_female }
    );
    // Glicko female
    const [glickoFemaleWinner, glickoFemaleRdWinner] = updateGlickoRating(
      winner.glicko_rating_female,
      winner.glicko_female_rd,
      loser.glicko_rating_female,
      loser.glicko_female_rd,
      1
    );
    const [glickoFemaleLoser, glickoFemaleRdLoser] = updateGlickoRating(
      loser.glicko_rating_female,
      loser.glicko_female_rd,
      winner.glicko_rating_female,
      winner.glicko_female_rd,
      0
    );
    updatedWinner = {
      ...updatedWinner,
      rating_female: eloFemale.newWinnerRating,
      glicko_rating_female: glickoFemaleWinner,
      glicko_female_rd: glickoFemaleRdWinner,
      comparisons_female: eloFemale.newWinnerStats.comparisons,
      wins_female: eloFemale.newWinnerStats.wins,
    };
    updatedLoser = {
      ...updatedLoser,
      rating_female: eloFemale.newLoserRating,
      glicko_rating_female: glickoFemaleLoser,
      glicko_female_rd: glickoFemaleRdLoser,
      comparisons_female: eloFemale.newLoserStats.comparisons,
      losses_female: eloFemale.newLoserStats.losses,
    };
  } else if (gender === 'Man') {
    // Elo male
    const eloMale = updateEloCategory(
      winner.rating_male,
      loser.rating_male,
      { comparisons: winner.comparisons_male, wins: winner.wins_male },
      { comparisons: loser.comparisons_male, losses: loser.losses_male }
    );
    // Glicko male
    const [glickoMaleWinner, glickoMaleRdWinner] = updateGlickoRating(
      winner.glicko_rating_male,
      winner.glicko_male_rd,
      loser.glicko_rating_male,
      loser.glicko_male_rd,
      1
    );
    const [glickoMaleLoser, glickoMaleRdLoser] = updateGlickoRating(
      loser.glicko_rating_male,
      loser.glicko_male_rd,
      winner.glicko_rating_male,
      winner.glicko_male_rd,
      0
    );
    updatedWinner = {
      ...updatedWinner,
      rating_male: eloMale.newWinnerRating,
      glicko_rating_male: glickoMaleWinner,
      glicko_male_rd: glickoMaleRdWinner,
      comparisons_male: eloMale.newWinnerStats.comparisons,
      wins_male: eloMale.newWinnerStats.wins,
    };
    updatedLoser = {
      ...updatedLoser,
      rating_male: eloMale.newLoserRating,
      glicko_rating_male: glickoMaleLoser,
      glicko_male_rd: glickoMaleRdLoser,
      comparisons_male: eloMale.newLoserStats.comparisons,
      losses_male: eloMale.newLoserStats.losses,
    };
  }

  return [updatedWinner, updatedLoser];
};