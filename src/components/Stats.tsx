
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
            <ToggleGroupItem value="overall" className="w-24 h-6 px-2 py-0.5 text-sm rounded-md bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors data-[state=on]:bg-[#E0E0E0] data-[state=on]:border-black/20 data-[state=on]:shadow-sm">
              Overall
            </ToggleGroupItem>
            <ToggleGroupItem value="male" className="w-24 h-6 px-2 py-0.5 text-sm rounded-md bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors data-[state=on]:bg-[#E0E0E0] data-[state=on]:border-black/20 data-[state=on]:shadow-sm">
              Male
            </ToggleGroupItem>
            <ToggleGroupItem value="female" className="w-24 h-6 px-2 py-0.5 text-sm rounded-md bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors data-[state=on]:bg-[#E0E0E0] data-[state=on]:border-black/20 data-[state=on]:shadow-sm">
              Female
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup 
            type="single" 
            value={view} 
            onValueChange={(value) => value && setView(value as ViewMode)} 
            className="justify-center"
          >
            <ToggleGroupItem value="best" className="w-28 px-4 py-1 text-sm rounded-full bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors data-[state=on]:bg-[#E0E0E0] data-[state=on]:border-black/20 data-[state=on]:shadow-sm">
              Best
            </ToggleGroupItem>
            <ToggleGroupItem value="worst" className="w-28 px-4 py-1 text-sm rounded-full bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors data-[state=on]:bg-[#E0E0E0] data-[state=on]:border-black/20 data-[state=on]:shadow-sm">
              Worst
            </ToggleGroupItem>
            <ToggleGroupItem value="best20" className="w-28 px-4 py-1 text-sm rounded-full bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors data-[state=on]:bg-[#E0E0E0] data-[state=on]:border-black/20 data-[state=on]:shadow-sm">
              Best 20
            </ToggleGroupItem>
            <ToggleGroupItem value="worst20" className="w-28 px-4 py-1 text-sm rounded-full bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors data-[state=on]:bg-[#E0E0E0] data-[state=on]:border-black/20 data-[state=on]:shadow-sm">
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
