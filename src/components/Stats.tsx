import { useState, useEffect, useMemo } from "react";
import { ImageRating } from "@/utils/elo";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { MonteCarloResult, randomNormalSample, runMonteCarloSimulation } from "@/utils/glickoUtils";
import { BradleyTerryResult, computeBradleyTerry } from "@/utils/bradleyTerry";
import { supabase } from "@/integrations/supabase/client";

interface StatsProps {
  ratings: ImageRating[];
  totalComparisons: number;
}

type ViewMode = "best" | "worst" | "best20" | "worst20";
type RatingCategory = "overall" | "male" | "female";
type RatingSystem = "elo" | "glicko" | "bradley-terry";

export const Stats = ({ ratings, totalComparisons }: StatsProps) => {
  const [view, setView] = useState<ViewMode>("best");
  const [category, setCategory] = useState<RatingCategory>("overall");
  const [ratingSystem, setRatingSystem] = useState<RatingSystem>("elo");
  const [monteCarloResults, setMonteCarloResults] = useState<MonteCarloResult | null>(null);
  const [bradleyTerryResults, setBradleyTerryResults] = useState<BradleyTerryResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  
  const getRatingKey = (category: RatingCategory) => {
    const baseKey = ratingSystem === "elo" ? "rating" : "glicko_rating";
    return `${baseKey}_${category}` as keyof ImageRating;
  };
  
  const sortedRatings = useMemo(() => {
    if (ratingSystem === "bradley-terry" && bradleyTerryResults) {
      const ratingMap = new Map(bradleyTerryResults.rankings.map(r => [r.imageId, r.score]));
      return [...ratings].sort((a, b) => (ratingMap.get(b.id) || 0) - (ratingMap.get(a.id) || 0));
    }
    return [...ratings].sort((a, b) => {
      const aRating = a[getRatingKey(category)] as number;
      const bRating = b[getRatingKey(category)] as number;
      return bRating - aRating;
    });
  }, [ratings, category, ratingSystem, bradleyTerryResults]);
  
  const getDisplayImages = () => {
    switch (view) {
      case "best":
        return sortedRatings.slice(0, 5);
      case "worst":
        return [...sortedRatings].reverse().slice(0, 5);
      case "best20":
        return sortedRatings.slice(0, 40);
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
      runMonteCarloSimulationWrapper();
    } else if (ratingSystem === 'bradley-terry') {
      runBradleyTerrySimulation();
    }
  }, [ratingSystem, category, view]);
  
  // Wrapper function to run Monte Carlo simulation
  const runMonteCarloSimulationWrapper = () => {
    if (ratingSystem !== 'glicko') return;
    
    setIsSimulating(true);
    
    // Check if we're in a worst view mode
    const isWorstView = view === "worst" || view === "worst20";
    
    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      const results = runMonteCarloSimulation(ratings, category, displayImages, 50000, isWorstView);
      setMonteCarloResults(results);
      setIsSimulating(false);
    }, 0);
  };

  // Function to run Bradley-Terry simulation
  const runBradleyTerrySimulation = async () => {
    setIsSimulating(true);
    try {
      const { data: comparisons } = await supabase
        .from('image_comparisons')
        .select('*');
      
      if (comparisons) {
        setTimeout(() => {
          const results = computeBradleyTerry(comparisons, category);
          setBradleyTerryResults(results);
          setIsSimulating(false);
        }, 0);
      }
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      setIsSimulating(false);
    }
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
            <ToggleGroupItem value="bradley-terry" className="px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-sm">
              Bradley-Terry
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
              <div className={`flex flex-col overflow-hidden rounded-[20px] ${!image.active ? 'opacity-60' : ''}`}>
                <div className="relative">
                  <div className="relative w-[288px] h-[288px] overflow-hidden bg-gray-100 border border-gray-300 transition-transform duration-200">
                    <img
                      src={image.url}
                      alt={`Rank ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover filter-none [filter:blur(0)] [-webkit-filter:blur(0)] [transform:translateZ(0)] [-webkit-transform:translateZ(0)] ${!image.active ? 'grayscale' : ''}`}
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
                        {ratingSystem === "bradley-terry" 
                          ? `BT ${(bradleyTerryResults?.rankings.find(r => r.imageId === image.id)?.score || 0).toFixed(2)}`
                          : `${ratingSystem.toUpperCase()} ${Math.round(Number(image[ratingKey]))}`}
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
                                : `${Math.round(monteCarloResults.exactRankProbabilities[image.id] * 100)}% chance of rank #${(view === "worst" || view === "worst20") ? ratings.length - index : index + 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {ratingSystem === 'bradley-terry' && bradleyTerryResults && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-grow h-1.5 bg-[#00000015] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-black transition-all duration-300 ease-out rounded-full"
                              style={{
                                width: `${bradleyTerryResults.top5Probabilities[image.id] 
                                  ? Math.max(0, Math.min(100, bradleyTerryResults.top5Probabilities[image.id] * 100))
                                  : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-black/60 font-ibm-plex-mono">
                            {isSimulating 
                              ? "Calculating..." 
                              : `${Math.round((bradleyTerryResults.top5Probabilities[image.id] || 0) * 100)}% top 5 probability`}
                          </span>
                        </div>
                        {bradleyTerryResults.exactRankProbabilities[image.id] && (
                          <div className="flex items-center gap-2">
                            <div className="flex-grow h-1.5 bg-[#00000015] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-black transition-all duration-300 ease-out rounded-full"
                                style={{
                                  width: `${Math.round(bradleyTerryResults.exactRankProbabilities[image.id] * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-black/60 font-ibm-plex-mono">
                              {isSimulating 
                                ? "" 
                                : `${Math.round(bradleyTerryResults.exactRankProbabilities[image.id] * 100)}% chance of rank #${(view === "worst" || view === "worst20") ? ratings.length - index : index + 1}`}
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