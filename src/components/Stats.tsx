
import { useState } from "react";
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

export const Stats = ({ ratings, totalComparisons }: StatsProps) => {
  const [view, setView] = useState<ViewMode>("best");
  const [category, setCategory] = useState<RatingCategory>("overall");
  
  const getRatingKey = (category: RatingCategory) => `rating_${category}` as keyof ImageRating;
  
  const sortedRatings = [...ratings].sort((a, b) => 
    b[getRatingKey(category)] - a[getRatingKey(category)]
  );
  
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-slide-in flex flex-col items-center">
      <div className="text-center space-y-8 w-full">
        <h1 className="text-6xl font-serif">See the data.</h1>
        
        <div className="space-y-4">
          <ToggleGroup 
            type="single" 
            value={category} 
            onValueChange={(value) => value && setCategory(value as RatingCategory)} 
            className="justify-center"
          >
            <ToggleGroupItem value="overall" className="px-6 py-2 rounded-full">
              Overall
            </ToggleGroupItem>
            <ToggleGroupItem value="male" className="px-6 py-2 rounded-full">
              Male votes
            </ToggleGroupItem>
            <ToggleGroupItem value="female" className="px-6 py-2 rounded-full">
              Female votes
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup 
            type="single" 
            value={view} 
            onValueChange={(value) => value && setView(value as ViewMode)} 
            className="justify-center"
          >
            <ToggleGroupItem value="best" className="px-6 py-2 rounded-full">
              Best profile
            </ToggleGroupItem>
            <ToggleGroupItem value="worst" className="px-6 py-2 rounded-full">
              Worst profile
            </ToggleGroupItem>
            <ToggleGroupItem value="best20" className="px-6 py-2 rounded-full">
              Best 20
            </ToggleGroupItem>
            <ToggleGroupItem value="worst20" className="px-6 py-2 rounded-full">
              Worst 20
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="space-y-4 flex flex-col items-center">
        {displayImages.map((image, index) => {
          const ratingKey = getRatingKey(category);
          const comparisonsKey = `comparisons_${category}` as keyof ImageRating;
          const winsKey = `wins_${category}` as keyof ImageRating;
          const lossesKey = `losses_${category}` as keyof ImageRating;

          return (
            <div
              key={image.id}
              className="w-fit h-fit"
            >
              <div className="flex flex-col overflow-hidden rounded-[20px]">
                <div className="relative">
                  <div className="relative size-[240px] sm:size-[288px] overflow-hidden bg-gray-100 border border-gray-300 transition-transform duration-200 touch-auto cursor-default sm:hover:scale-[unset] sm:active:scale-[unset] rounded-none sm:rounded-none">
                    <div className="relative aspect-square bg-gray-100 overflow-hidden transition-opacity duration-300">
                      <img
                        src={image.url}
                        alt={`Rank ${index + 1}`}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: '50%', top: '50%', transform: 'translate(calc(-50%), calc(-33.483%)) scale(1)', transformOrigin: 'center center', willChange: 'transform' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-[#e8e8e8] border-[#0000001A] border-t-[1px] px-[18px] py-[9px]" style={{ willChange: 'transform' }}>
                  <div className="flex flex-row justify-between font-ibm-plex-mono text-[10px]">
                    <div className="text-[#000000]">
                      {image[winsKey]} W / {image[lossesKey]} L
                    </div>
                    <div className="text-[#000000]">
                      ELO {Math.round(image[ratingKey])}
                    </div>
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
