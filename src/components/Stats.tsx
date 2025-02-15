
import { ImageRating } from "@/utils/elo";
import { Trophy } from "lucide-react";

interface StatsProps {
  ratings: ImageRating[];
  totalComparisons: number;
}

export const Stats = ({ ratings, totalComparisons }: StatsProps) => {
  const sortedRatings = [...ratings].sort((a, b) => b.rating - a.rating);
  const topImages = sortedRatings.slice(0, 5);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-slide-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif">Photo Rankings</h2>
        <p className="text-muted-foreground">
          Based on {totalComparisons} comparisons
        </p>
      </div>

      <div className="space-y-4">
        {topImages.map((image, index) => (
          <div
            key={image.id}
            className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg"
          >
            <div className="relative w-20 h-20">
              <img
                src={image.url}
                alt={`Rank ${index + 1}`}
                className="w-full h-full object-cover rounded-md"
              />
              {index === 0 && (
                <Trophy
                  className="absolute -top-2 -right-2 text-primary"
                  size={24}
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-medium">Rank {index + 1}</span>
                <span className="text-sm text-muted-foreground">
                  Rating: {Math.round(image.rating)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Selected in {image.comparisons} comparisons
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
