
import { ImageRating } from "@/utils/elo";
import { Button } from "@/components/ui/button";
import { Eye, Lock } from "lucide-react";

interface ImageComparisonProps {
  imageA: ImageRating;
  imageB: ImageRating;
  onSelect: (winner: ImageRating, loser: ImageRating) => void;
  isUnlocked: boolean;
  remainingSwipes: number;
  onStatsClick: () => void;
}

export const ImageComparison = ({ imageA, imageB, onSelect, isUnlocked, remainingSwipes, onStatsClick }: ImageComparisonProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 items-center justify-center">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-center justify-center w-full">
        <div className="relative group w-full md:w-auto">
          <button
            onClick={() => onSelect(imageA, imageB)}
            className="relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none w-full md:w-auto"
          >
            <img
              src={imageA.url}
              alt="Option A"
              className="w-full md:w-[400px] h-[300px] md:h-[400px] object-cover"
            />
          </button>
        </div>

        <div className="font-medium text-muted-foreground">or</div>

        <div className="relative group w-full md:w-auto">
          <button
            onClick={() => onSelect(imageB, imageA)}
            className="relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none w-full md:w-auto"
          >
            <img
              src={imageB.url}
              alt="Option B"
              className="w-full md:w-[400px] h-[300px] md:h-[400px] object-cover"
            />
          </button>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => isUnlocked && onStatsClick()}
        disabled={!isUnlocked}
        className="mx-auto flex items-center gap-2 relative px-[20px] sm:px-[30px] py-2 rounded-full bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors text-[12px] sm:text-[14px]"
      >
        {isUnlocked ? (
          <>
            <Eye size={14} className="sm:size-4" />
            see the data
          </>
        ) : (
          <>
            <Lock size={14} className="sm:size-4" />
            {remainingSwipes} more swipes to see the data
          </>
        )}
      </Button>
    </div>
  );
};
