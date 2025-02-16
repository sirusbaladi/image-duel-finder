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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4">
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
                  <div className="relative w-full aspect-square overflow-hidden bg-gray-100 border border-gray-300 transition-transform duration-200">
                    <img
                      src={image.url}
                      alt={`Rank ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="bg-[#e8e8e8] border-[#0000001A] border-t-[1px] px-[18px] py-[9px]">
                  <div className="flex flex-row justify-between font-ibm-plex-mono text-[10px] sm:text-[12px]">
                    <div className="text-[#000000]">
                      {image[winsKey]} W / {image[lossesKey]} L
                    </div>
                    <div className="text-[#000000]">
                      ELO {Math.round(Number(image[ratingKey]))}
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
