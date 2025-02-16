
import { ImageRating } from "@/utils/elo";

interface ImageComparisonProps {
  imageA: ImageRating;
  imageB: ImageRating;
  onSelect: (winner: ImageRating, loser: ImageRating) => void;
}

export const ImageComparison = ({ imageA, imageB, onSelect }: ImageComparisonProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-center justify-center">
      <div className="relative group">
        <button
          onClick={() => onSelect(imageA, imageB)}
          className="relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
        >
          <img
            src={imageA.url}
            alt="Option A"
            className="w-full md:w-[400px] h-[400px] object-cover"
          />

        </button>
      </div>

      <div className="font-medium text-muted-foreground">or</div>

      <div className="relative group">
        <button
          onClick={() => onSelect(imageB, imageA)}
          className="relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none"
        >
          <img
            src={imageB.url}
            alt="Option B"
            className="w-full md:w-[400px] h-[400px] object-cover"
          />

        </button>
      </div>
    </div>
  );
};
