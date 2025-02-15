
import { useState, useEffect } from "react";
import { ImageComparison } from "@/components/ImageComparison";
import { Stats } from "@/components/Stats";
import {
  ImageRating,
  getInitialRatings,
  selectPairForComparison,
  updateRatings,
} from "@/utils/elo";

// Example images (replace with your actual images)
const sampleImages = [
  "https://picsum.photos/800/600?random=1",
  "https://picsum.photos/800/600?random=2",
  "https://picsum.photos/800/600?random=3",
  "https://picsum.photos/800/600?random=4",
  "https://picsum.photos/800/600?random=5",
  // Add more images here
];

const Index = () => {
  const [ratings, setRatings] = useState<ImageRating[]>(() =>
    getInitialRatings(sampleImages)
  );
  const [currentPair, setCurrentPair] = useState<[ImageRating, ImageRating]>([
    ratings[0],
    ratings[1],
  ]);
  const [totalComparisons, setTotalComparisons] = useState(0);

  useEffect(() => {
    const pair = selectPairForComparison(ratings, totalComparisons);
    setCurrentPair(pair);
  }, [totalComparisons]);

  const handleSelection = (winner: ImageRating, loser: ImageRating) => {
    const [updatedWinner, updatedLoser] = updateRatings(winner, loser);
    
    setRatings((prevRatings) =>
      prevRatings.map((rating) => {
        if (rating.id === winner.id) return updatedWinner;
        if (rating.id === loser.id) return updatedLoser;
        return rating;
      })
    );
    
    setTotalComparisons((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Image Duel</h1>
          <p className="text-lg text-muted-foreground">
            Click on the image you prefer
          </p>
        </div>

        <ImageComparison
          imageA={currentPair[0]}
          imageB={currentPair[1]}
          onSelect={handleSelection}
        />

        <Stats ratings={ratings} totalComparisons={totalComparisons} />
      </div>
    </div>
  );
};

export default Index;
