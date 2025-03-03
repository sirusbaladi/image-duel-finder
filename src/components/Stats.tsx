import { useState, useEffect, useMemo } from "react";
import { ImageRating } from "@/utils/elo";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

interface StatsProps {
  ratings: ImageRating[];
  totalComparisons: number;
}

type ViewMode = "best" | "worst" | "best20" | "worst20";
type RatingCategory = "overall" | "male" | "female";
type RatingSystem = "elo" | "glicko";

// Function to generate a random number from a normal distribution
const randomNormal = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// Function to generate a random sample from a normal distribution with given mean and standard deviation
const randomNormalSample = (mean: number, stdDev: number) => {
  return mean + stdDev * randomNormal();
};

// Interface for Monte Carlo simulation results
interface MonteCarloResult {
  topProbabilities: Record<string, number>;
  medianRank: Record<string, number>;
  exactRankProbabilities: Record<string, number>;
}

export const Stats = ({ ratings, totalComparisons }: StatsProps) => {
  const [view, setView] = useState<ViewMode>("best");
  const [category, setCategory] = useState<RatingCategory>("overall");
  const [ratingSystem, setRatingSystem] = useState<RatingSystem>("elo");
  const [monteCarloResults, setMonteCarloResults] = useState<MonteCarloResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const getRatingKey = (category: RatingCategory) => {
    const baseKey = ratingSystem === "elo" ? "rating" : "glicko_rating";
    return `${baseKey}_${category}` as keyof ImageRating;
  };
  
  const sortedRatings = [...ratings].sort((a, b) => {
    const aRating = a[getRatingKey(category)] as number;
    const bRating = b[getRatingKey(category)] as number;
    return bRating - aRating;
  });
  
  const getDisplayImages = () => {
    switch (view) {
      case "best":
        return sortedRatings.slice(0, 5);
      case "worst":
        return [...sortedRatings].reverse().slice(0, 5);
      case "best20":
        return sortedRatings.slice(0, 20);
      case "worst20":
        return [...sortedRatings].reverse().slice(0, 20);
      default:
        return sortedRatings.slice(0, 5);
    }
  };

  const displayImages = getDisplayImages();
  
  // Run Monte Carlo simulation when rating system, category, or displayed images change
  useEffect(() => {
    if (ratingSystem === 'glicko' && displayImages.length > 0) {
      runMonteCarloSimulation();
    }
  }, [ratingSystem, category, view]);
  
  // Function to run Monte Carlo simulation
  const runMonteCarloSimulation = () => {
    if (ratingSystem !== 'glicko') return;
    
    setIsSimulating(true);
    
    // Number of trials to run
    const numTrials = 10000;
    // For mobile devices, reduce the number of trials
    const isMobile = window.innerWidth < 768;
    const actualTrials = isMobile ? 5000 : numTrials;
    
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      // Get all images for simulation
      const allImages = [...ratings];
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
        currentRanks[image.id] = index;
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
      
      setMonteCarloResults({
        topProbabilities,
        medianRank,
        exactRankProbabilities
      });
      setIsSimulating(false);
    }, 0);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-slide-in flex flex-col items-center">
      <div className="text-center space-y-6 sm:space-y-8 w-full px-2">
        <h1 className="text-4xl sm:text-6xl font-serif">See the data.</h1>
        
        <div className="space-y-3 sm:space-y-4">
          <ToggleGroup 
            type="single" 
            value={category} 
            onValueChange={(value) => value && setCategory(value as RatingCategory)} 
            className="justify-center flex-wrap gap-2"
          >
            <ToggleGroupItem value="overall" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm">
              Overall
            </ToggleGroupItem>
            <ToggleGroupItem value="male" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm">
              Male votes
            </ToggleGroupItem>
            <ToggleGroupItem value="female" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm">
              Female votes
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup 
            type="single" 
            value={ratingSystem} 
            onValueChange={(value) => value && setRatingSystem(value as RatingSystem)} 
            className="justify-center flex-wrap gap-2"
          >
            <ToggleGroupItem value="elo" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm">
              ELO
            </ToggleGroupItem>
            <ToggleGroupItem value="glicko" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm">
              Glicko
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup 
            type="single" 
            value={view} 
            onValueChange={(value) => value && setView(value as ViewMode)} 
            className="justify-center flex-wrap gap-2"
          >
            <ToggleGroupItem value="best" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm whitespace-nowrap">
              Best profile
            </ToggleGroupItem>
            <ToggleGroupItem value="worst" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm whitespace-nowrap">
              Worst profile
            </ToggleGroupItem>
            <ToggleGroupItem value="best20" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm whitespace-nowrap">
              Best 20
            </ToggleGroupItem>
            <ToggleGroupItem value="worst20" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm whitespace-nowrap">
              Worst 20
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:max-w-xl lg:max-w-3xl mx-auto">
        {displayImages.map((image, index) => {
          const ratingKey = getRatingKey(category);
          const comparisonsKey = `comparisons_${category}` as keyof ImageRating;
          const winsKey = `wins_${category}` as keyof ImageRating;
          const lossesKey = `losses_${category}` as keyof ImageRating;

          return (
            <div
              key={image.id}
              className="w-full h-fit"
            >
              <div className="flex flex-col overflow-hidden rounded-[20px]">
                <div className="relative">
                  <div className="relative w-[288px] h-[288px] overflow-hidden bg-gray-100 border border-gray-300 transition-transform duration-200">
                    <img
                      src={image.url}
                      alt={`Rank ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover filter-none [filter:blur(0)] [-webkit-filter:blur(0)] [transform:translateZ(0)] [-webkit-transform:translateZ(0)]"
                    />
                  </div>
                </div>
                <div className="bg-[#e8e8e8] border-[#0000001A] border-t-[1px] px-[18px] py-[9px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-row justify-between font-ibm-plex-mono text-[10px] sm:text-[12px]">
                      <div className="text-[#000000]">
                        {image[winsKey]} W / {image[lossesKey]} L
                      </div>
                      <div className="text-[#000000]">
                        {ratingSystem.toUpperCase()} {Math.round(Number(image[ratingKey]))}
                      </div>
                    </div>
                    {ratingSystem === 'glicko' && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-grow h-1.5 bg-[#00000015] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-black transition-all duration-300 ease-out rounded-full"
                              style={{
                                width: `${monteCarloResults && monteCarloResults.topProbabilities[image.id] 
                                  ? Math.max(0, Math.min(100, monteCarloResults.topProbabilities[image.id] * 100))
                                  : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-black/60 font-ibm-plex-mono">
                            {isSimulating 
                              ? "Calculating..." 
                              : monteCarloResults && monteCarloResults.topProbabilities[image.id]
                                ? `${Math.round(monteCarloResults.topProbabilities[image.id] * 100)}% top 5 probability`
                                : "Calculating..."}
                          </span>
                        </div>
                        {monteCarloResults && monteCarloResults.exactRankProbabilities && monteCarloResults.exactRankProbabilities[image.id] && (
                          <div className="flex items-center gap-2">
                            <div className="flex-grow h-1.5 bg-[#00000015] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-black transition-all duration-300 ease-out rounded-full"
                                style={{
                                  width: `${Math.round(monteCarloResults.exactRankProbabilities[image.id] * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-black/60 font-ibm-plex-mono">
                              {isSimulating 
                                ? "" 
                                : `${Math.round(monteCarloResults.exactRankProbabilities[image.id] * 100)}% chance of rank #${index + 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};