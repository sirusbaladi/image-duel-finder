
import { useState } from "react";
import { ImageRating } from "@/utils/elo";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ImageComparisonProps {
  imageA: ImageRating;
  imageB: ImageRating;
  onSelect: (winner: ImageRating, loser: ImageRating) => void;
}

export const ImageComparison = ({ imageA, imageB, onSelect }: ImageComparisonProps) => {
  const [hoveredImage, setHoveredImage] = useState<"A" | "B" | null>(null);

  const handleSelect = (winner: ImageRating, loser: ImageRating) => {
    onSelect(winner, loser);
    setHoveredImage(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
        <div
          className={`relative group cursor-pointer transition-all duration-300 ${
            hoveredImage === "A" ? "scale-105" : "scale-100"
          }`}
          onMouseEnter={() => setHoveredImage("A")}
          onMouseLeave={() => setHoveredImage(null)}
          onClick={() => handleSelect(imageA, imageB)}
        >
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img
              src={imageA.url}
              alt="Option A"
              className="w-full md:w-[400px] h-[300px] object-cover animate-image-fade-in"
            />
            <div
              className={`absolute inset-0 bg-primary/10 transition-opacity duration-300 ${
                hoveredImage === "A" ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
          <ArrowLeft
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-primary transition-opacity duration-300 ${
              hoveredImage === "A" ? "opacity-100" : "opacity-0"
            }`}
            size={32}
          />
        </div>

        <div className="text-2xl font-semibold text-muted-foreground">vs</div>

        <div
          className={`relative group cursor-pointer transition-all duration-300 ${
            hoveredImage === "B" ? "scale-105" : "scale-100"
          }`}
          onMouseEnter={() => setHoveredImage("B")}
          onMouseLeave={() => setHoveredImage(null)}
          onClick={() => handleSelect(imageB, imageA)}
        >
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img
              src={imageB.url}
              alt="Option B"
              className="w-full md:w-[400px] h-[300px] object-cover animate-image-fade-in"
            />
            <div
              className={`absolute inset-0 bg-primary/10 transition-opacity duration-300 ${
                hoveredImage === "B" ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>
          <ArrowRight
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-primary transition-opacity duration-300 ${
              hoveredImage === "B" ? "opacity-100" : "opacity-0"
            }`}
            size={32}
          />
        </div>
      </div>
    </div>
  );
};
