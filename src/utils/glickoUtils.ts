// glickoUtils.ts
// Utility functions for Glicko rating system and Monte Carlo simulations

// Interface for Monte Carlo simulation results
export interface MonteCarloResult {
  topProbabilities: Record<string, number>;
  medianRank: Record<string, number>;
  exactRankProbabilities: Record<string, number>;
}

/**
 * Generates a random number from a normal distribution using the Box-Muller transform
 * @returns A random number from a standard normal distribution (mean 0, stdDev 1)
 */
export const randomNormal = (): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

/**
 * Generates a random sample from a normal distribution with given mean and standard deviation
 * @param mean The mean of the normal distribution
 * @param stdDev The standard deviation of the normal distribution
 * @returns A random sample from the specified normal distribution
 */
export const randomNormalSample = (mean: number, stdDev: number): number => {
  return mean + stdDev * randomNormal();
};

/**
 * Runs a Monte Carlo simulation to estimate probabilities for image rankings
 * @param images Array of images with their Glicko ratings and RDs
 * @param category The rating category to use (overall, male, female)
 * @param displayImages The currently displayed images
 * @param numTrials Number of trials to run (will be reduced on mobile)
 * @returns Monte Carlo simulation results including probabilities
 */
export const runMonteCarloSimulation = (
  images: any[],
  category: string,
  displayImages: any[],
  numTrials: number = 50000,
  isWorstView: boolean = false
): MonteCarloResult => {
  // For mobile devices, reduce the number of trials
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const actualTrials = isMobile ? 5000 : numTrials;
  
  // Get all images for simulation
  const allImages = [...images];
  const imageIds = allImages.map(img => img.id);
  
  // Initialize counters for rank probabilities
  const rankCounts: Record<string, number[]> = {};
  imageIds.forEach(id => {
    rankCounts[id] = Array(allImages.length).fill(0);
  });
  
  // Run the simulation
  for (let trial = 0; trial < actualTrials; trial++) {
    // For each trial, sample a rating for each image from its distribution
    const sampledRatings = allImages.map(image => {
      const rating = image[`glicko_rating_${category}`] as number;
      const rd = image[`glicko_${category}_rd`] as number;
      
      // Sample from normal distribution with mean=rating and stdDev=rd
      const sampledRating = randomNormalSample(rating, rd);
      
      return {
        id: image.id,
        sampledRating
      };
    });
    
    // Sort the sampled ratings to get ranks for this trial
    const sortedSamples = [...sampledRatings].sort((a, b) => b.sampledRating - a.sampledRating);
    
    // Record the rank for each image in this trial
    sortedSamples.forEach((sample, rank) => {
      rankCounts[sample.id][rank]++;
    });
  }
  
  // Calculate probabilities and statistics
  const topProbabilities: Record<string, number> = {};
  const medianRank: Record<string, number> = {};
  const exactRankProbabilities: Record<string, number> = {};
  
  // Get current ranks of images in the display
  const currentRanks: Record<string, number> = {};
  displayImages.forEach((image, index) => {
    // For worst views, we need to calculate the rank from the bottom
    currentRanks[image.id] = isWorstView ? allImages.length - 1 - index : index;
  });
  
  imageIds.forEach(id => {
    // Calculate probability of being in top 5
    const top5Count = rankCounts[id].slice(0, 5).reduce((sum, count) => sum + count, 0);
    topProbabilities[id] = top5Count / actualTrials;
    
    // Calculate median rank
    let cumulativeCount = 0;
    let medianIdx = 0;
    while (cumulativeCount < actualTrials / 2 && medianIdx < rankCounts[id].length) {
      cumulativeCount += rankCounts[id][medianIdx];
      medianIdx++;
    }
    medianRank[id] = medianIdx;
    
    // Calculate probability of exact rank
    // If the image is in displayImages, use its current rank
    if (id in currentRanks) {
      const currentRank = currentRanks[id];
      exactRankProbabilities[id] = rankCounts[id][currentRank] / actualTrials;
    }
  });
  
  return {
    topProbabilities,
    medianRank,
    exactRankProbabilities
  };
};