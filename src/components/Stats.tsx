
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
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6 animate-slide-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Rankings</h2>
        <p className="text-muted-foreground">
          Total comparisons: {totalComparisons}
        </p>
      </div>

      <div className="space-y-4">
        {topImages.map((image, index) => (
          <div
            key={image.id}
            className="flex items-center gap-4 p-4 bg-secondary rounded-lg shadow-sm"
          >
            <div className="relative w-16 h-16">
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
                Comparisons: {image.comparisons}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
