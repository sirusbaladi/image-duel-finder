
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

export const Stats = ({ ratings, totalComparisons }: StatsProps) => {
  const [view, setView] = useState<"best" | "worst" | "best20" | "worst20">("best");
  const sortedRatings = [...ratings].sort((a, b) => b.rating - a.rating);
  
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
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-slide-in">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-serif">See the data.</h1>
        
        <ToggleGroup 
          type="single" 
          value={view} 
          onValueChange={(value) => value && setView(value as typeof view)} 
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

      <div className="space-y-4">
        {displayImages.map((image, index) => (
          <div
            key={image.id}
            className="overflow-hidden rounded-xl bg-secondary"
          >
            <img
              src={image.url}
              alt={`Rank ${index + 1}`}
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="p-4 flex justify-between items-center text-sm">
              <div className="font-mono">
                {image.wins} W / {image.losses} L
              </div>
              <div className="font-mono">
                ELO {Math.round(image.rating)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
