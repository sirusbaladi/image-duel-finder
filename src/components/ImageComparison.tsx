
import { useState } from "react";
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
  const [imagesLoaded, setImagesLoaded] = useState({ a: false, b: false });
  const [selectedImage, setSelectedImage] = useState<"a" | "b" | null>(null);

  const handleImageLoad = (image: "a" | "b") => {
    setImagesLoaded(prev => ({ ...prev, [image]: true }));
  };

  const handleSelect = (winner: ImageRating, loser: ImageRating, selected: "a" | "b") => {
    setSelectedImage(selected);
    onSelect(winner, loser);
    // Reset the selection after animation
    setTimeout(() => setSelectedImage(null), 300);
  };

  const allImagesLoaded = imagesLoaded.a && imagesLoaded.b;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 items-center justify-center">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-center justify-center w-full">
        <div className="relative group w-full md:w-auto">
          <button
            onClick={() => handleSelect(imageA, imageB, "a")}
            className={`relative overflow-hidden rounded-2xl transition-all duration-200 hover:scale-[1.02] focus:outline-none w-full md:w-auto ${
              selectedImage === "a" ? "ring-4 ring-primary ring-offset-2" : ""
            }`}
            style={{ opacity: allImagesLoaded ? 1 : 0, transition: "opacity 0.3s ease-in-out" }}
          >
            <div className={`absolute inset-0 bg-white/80 flex items-center justify-center z-10 ${
              !allImagesLoaded ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-300`}>
              <div className="animate-pulse">Loading...</div>
            </div>
            <img
              src={imageA.url}
              alt="Option A"
              className="w-full md:w-[400px] h-[300px] md:h-[400px] object-cover"
              onLoad={() => handleImageLoad("a")}
            />
          </button>
        </div>

        <div className="font-medium text-muted-foreground">or</div>

        <div className="relative group w-full md:w-auto">
          <button
            onClick={() => handleSelect(imageB, imageA, "b")}
            className={`relative overflow-hidden rounded-2xl transition-all duration-200 hover:scale-[1.02] focus:outline-none w-full md:w-auto ${
              selectedImage === "b" ? "ring-4 ring-primary ring-offset-2" : ""
            }`}
            style={{ opacity: allImagesLoaded ? 1 : 0, transition: "opacity 0.3s ease-in-out" }}
          >
            <div className={`absolute inset-0 bg-white/80 flex items-center justify-center z-10 ${
              !allImagesLoaded ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-300`}>
              <div className="animate-pulse">Loading...</div>
            </div>
            <img
              src={imageB.url}
              alt="Option B"
              className="w-full md:w-[400px] h-[300px] md:h-[400px] object-cover"
              onLoad={() => handleImageLoad("b")}
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
