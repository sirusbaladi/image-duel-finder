import { useState, useEffect } from "react";
import { ImageRating } from "@/utils/elo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Interface for image with Bradley-Terry strength
interface ImageWithStrength extends ImageRating {
  strength: number;
}

interface TopFiveProps {
  onBackClick?: () => void;
}

export const TopFive = ({ onBackClick }: TopFiveProps = {}) => {
  const [rankedImages, setRankedImages] = useState<ImageWithStrength[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const computeRankings = async () => {
      try {
        // Step 1: Fetch all images
        const { data: imagesData, error: imagesError } = await supabase
          .from('images')
          .select('*');

        if (imagesError) {
          console.error('Error fetching images:', imagesError);
          return;
        }

        const images = imagesData.map(img => ({
          ...img,
          id: img.id.toString()
        })) as ImageRating[];

        // Step 2: Fetch all comparisons
        const { data: comparisons, error: comparisonsError } = await supabase
          .from('image_comparisons')
          .select('image_a_id, image_b_id, winner_id');

        if (comparisonsError) {
          console.error('Error fetching comparisons:', comparisonsError);
          return;
        }

        // Step 3: Initialize strengths to 1.0 for all images
        const imageIds = images.map(img => img.id);
        const strengths: Record<string, number> = {};
        imageIds.forEach(id => {
          strengths[id] = 1.0;
        });

        // Step 4: Compute wins and comparisons per image
        const wins: Record<string, number> = {};
        const comparisonsList: Record<string, Array<{opponent: string, won: boolean}>> = {};

        // Initialize counts and lists
        imageIds.forEach(id => {
          wins[id] = 0;
          comparisonsList[id] = [];
        });

        // Process each comparison
        comparisons.forEach(comp => {
          const a = comp.image_a_id.toString();
          const b = comp.image_b_id.toString();
          const winner = comp.winner_id.toString();

          // Record comparison details
          comparisonsList[a].push({ opponent: b, won: winner === a });
          comparisonsList[b].push({ opponent: a, won: winner === b });

          // Increment wins
          if (winner === a) wins[a]++;
          else if (winner === b) wins[b]++;
        });

        // Step 5: Iterate until convergence
        let iterations = 0;
        const maxIterations = 1000;
        const threshold = 0.0001;
        let hasConverged = false;

        while (iterations < maxIterations && !hasConverged) {
          const newStrengths = { ...strengths };

          Object.keys(strengths).forEach(imageId => {
            const W_i = wins[imageId]; // Total wins for this image
            let sumDenominator = 0;

            // Sum the expected outcomes for all comparisons
            comparisonsList[imageId].forEach(comp => {
              const opponent = comp.opponent;
              const strength_i = strengths[imageId];
              const strength_j = strengths[opponent];
              sumDenominator += 1 / (strength_i + strength_j);
            });

            // Update strength (avoid division by zero)
            newStrengths[imageId] = sumDenominator > 0 ? W_i / sumDenominator : strengths[imageId];
          });

          // Check if strengths have converged
          const maxChange = Math.max(
            ...Object.keys(newStrengths).map(id => Math.abs(newStrengths[id] - strengths[id]))
          );
          hasConverged = maxChange < threshold;

          // Update strengths for next iteration
          Object.assign(strengths, newStrengths);
          iterations++;
        }

        if (iterations === maxIterations) {
          console.warn("Maximum iterations reached; results may not be fully converged.");
        }

        // Step 6: Create ranked images with strengths
        const imagesWithStrength = images.map(img => ({
          ...img,
          strength: strengths[img.id] || 1.0
        }));

        // Sort by strength descending
        const sortedImages = imagesWithStrength.sort((a, b) => b.strength - a.strength);
        setRankedImages(sortedImages);
      } catch (error) {
        console.error('Error computing rankings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    computeRankings();
  }, []);

  const topFive = rankedImages.slice(0, 5);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-slide-in flex flex-col items-center">
      <div className="flex justify-between items-center w-full px-2">
        <div className="flex-1">
          {/* Removed Sirus.nyc text */}
        </div>
        <div className="text-center flex-grow">
          <h1 className="text-4xl sm:text-6xl font-serif">Top 5 Photos</h1>
          <p className="text-lg font-['PP Neue Montreal'] font-thin">Based on Bradley-Terry model from all votes</p>
        </div>
        <div className="flex-1 flex justify-end">
          {onBackClick && (
            <Button 
              variant="ghost" 
              className="font-['PP Neue Montreal'] font-thin text-[#0A0A0A] hover:scale-[1.02] active:scale-[0.99] transition-all duration-250"
              onClick={onBackClick}
            >
              Back to Stats
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 sm:max-w-xl lg:max-w-3xl mx-auto">
        {topFive.map((image, index) => (
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
                <div className="flex flex-row justify-between font-ibm-plex-mono text-[10px] sm:text-[12px]">
                  <div className="text-[#000000]">
                    Rank #{index + 1}
                  </div>
                  <div className="text-[#000000]">
                    Strength {image.strength.toFixed(4)}
                  </div>
                </div>
                <div className="flex flex-row justify-between font-ibm-plex-mono text-[10px] sm:text-[12px] mt-1">
                  <div className="text-[#000000]">
                    {image.wins_overall} W / {image.losses_overall} L
                  </div>
                  <div className="text-[#000000]">
                    {image.comparisons_overall} comparisons
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};