
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
          className="relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <img
            src={imageA.url}
            alt="Option A"
            className="w-full md:w-[400px] h-[400px] object-cover"
          />
          <div className="absolute inset-x-0 top-0 p-4 flex items-center gap-2">
            <span className="font-medium text-white">Josh</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-white/90">Active now</span>
            </span>
          </div>
        </button>
      </div>

      <div className="font-medium text-muted-foreground">or</div>

      <div className="relative group">
        <button
          onClick={() => onSelect(imageB, imageA)}
          className="relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <img
            src={imageB.url}
            alt="Option B"
            className="w-full md:w-[400px] h-[400px] object-cover"
          />
          <div className="absolute inset-x-0 top-0 p-4 flex items-center gap-2">
            <span className="font-medium text-white">Josh</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-white/90">Active now</span>
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
