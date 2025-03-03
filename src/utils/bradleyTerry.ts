// bradleyTerry.ts
import { Tables } from "../integrations/supabase/types";

export interface BradleyTerryResult { 
  rankings: { imageId: string; score: number; rank: number }[];
  top5Probabilities: { [imageId: string]: number };
  exactRankProbabilities: { [imageId: string]: number };
}

export function computeBradleyTerry(
  comparisons: Tables<"image_comparisons">[],
  category: "overall" | "male" | "female" = "overall",
  numBootstrapSamples: number = 1000
): BradleyTerryResult {
  // Filter comparisons based on category
  let filteredComparisons = comparisons;
  if (category === "male") {
    filteredComparisons = comparisons.filter((c) => c.user_gender === "Man");
  } else if (category === "female") {
    filteredComparisons = comparisons.filter((c) => c.user_gender === "Woman");
  }

  // Extract unique image IDs from comparisons
  const imageIds = Array.from(
    new Set(filteredComparisons.flatMap((c) => [c.image_a_id, c.image_b_id]))
  );

  // Build win matrix: winMatrix[winner][loser] = number of times winner beats loser
  const winMatrix: { [winner: string]: { [loser: string]: number } } = {};
  for (const comp of filteredComparisons) {
    const { image_a_id, image_b_id, winner_id } = comp;
    const loser_id = winner_id === image_a_id ? image_b_id : image_a_id;
    if (!winMatrix[winner_id]) winMatrix[winner_id] = {};
    winMatrix[winner_id][loser_id] =
      (winMatrix[winner_id][loser_id] || 0) + 1;
  }

  // Estimate original Bradley-Terry scores
  const originalScores = estimateScores(winMatrix, imageIds);
  const originalRankings = imageIds
    .slice()
    .sort((a, b) => originalScores[b] - originalScores[a]);

  // Bootstrap resampling
  const numComparisons = filteredComparisons.length;
  const top5Counts: { [id: string]: number } = {};
  const rankCounts: { [id: string]: { [rank: number]: number } } = {};

  // Initialize counts
  imageIds.forEach((id) => {
    top5Counts[id] = 0;
    rankCounts[id] = {};
    for (let r = 1; r <= imageIds.length; r++) {
      rankCounts[id][r] = 0;
    }
  });

  // Perform bootstrap iterations
  for (let b = 0; b < numBootstrapSamples; b++) {
    // Resample comparisons with replacement
    const resampledComparisons = Array.from(
      { length: numComparisons },
      () => filteredComparisons[Math.floor(Math.random() * numComparisons)]
    );
    const resampledWinMatrix: {
      [winner: string]: { [loser: string]: number };
    } = {};
    for (const comp of resampledComparisons) {
      const { image_a_id, image_b_id, winner_id } = comp;
      const loser_id = winner_id === image_a_id ? image_b_id : image_a_id;
      if (!resampledWinMatrix[winner_id]) resampledWinMatrix[winner_id] = {};
      resampledWinMatrix[winner_id][loser_id] =
        (resampledWinMatrix[winner_id][loser_id] || 0) + 1;
    }
    const scores = estimateScores(resampledWinMatrix, imageIds);
    const rankings = imageIds.slice().sort((a, b) => scores[b] - scores[a]);
    const top5 = rankings.slice(0, 5);
    top5.forEach((id) => top5Counts[id]++);
    rankings.forEach((id, index) => {
      const rank = index + 1;
      rankCounts[id][rank]++;
    });
  }

  // Calculate probabilities
  const top5Probabilities = Object.fromEntries(
    Object.entries(top5Counts).map(([id, count]) => [
      id,
      count / numBootstrapSamples,
    ])
  );

  const exactRankProbabilities = Object.fromEntries(
    imageIds.map((id) => {
      const originalRank = originalRankings.indexOf(id) + 1;
      const count = rankCounts[id][originalRank] || 0;
      return [id, count / numBootstrapSamples];
    })
  );

  // Prepare rankings with normalized scores
  const rankings = originalRankings.map((imageId, index) => ({
    imageId,
    score: originalScores[imageId],
    rank: index + 1,
  }));

  return { rankings, top5Probabilities, exactRankProbabilities };
}

function estimateScores(
  winMatrix: { [winner: string]: { [loser: string]: number } },
  imageIds: string[],
  maxIterations = 1000,
  tolerance = 1e-6
): { [id: string]: number } {
  let scores: { [id: string]: number } = {};
  imageIds.forEach((id) => (scores[id] = 1));

  // MM algorithm iteration
  for (let iter = 0; iter < maxIterations; iter++) {
    const newScores: { [id: string]: number } = {};
    let maxDiff = 0;
    imageIds.forEach((i) => {
      let numerator = 0;
      let denominator = 0;
      const opponents = new Set([
        ...(winMatrix[i] ? Object.keys(winMatrix[i]) : []),
        ...Object.keys(winMatrix).filter((j) => winMatrix[j][i]),
      ]);
      opponents.forEach((j) => {
        const w_ij = winMatrix[i]?.[j] || 0;
        const w_ji = winMatrix[j]?.[i] || 0;
        const n_ij = w_ij + w_ji;
        if (n_ij > 0) {
          numerator += w_ij;
          denominator += n_ij / (scores[i] + scores[j]);
        }
      });
      if (denominator > 0) {
        newScores[i] = numerator / denominator;
      } else {
        newScores[i] = scores[i]; // No comparisons, keep initial score
      }
      const diff = Math.abs(newScores[i] - scores[i]);
      if (diff > maxDiff) maxDiff = diff;
    });
    scores = newScores;
    if (maxDiff < tolerance) break;
  }

  // Normalize scores to sum to number of images
  const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
  const scale = imageIds.length / total;
  Object.keys(scores).forEach((id) => (scores[id] *= scale));

  return scores;
}