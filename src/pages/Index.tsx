
import { useState, useEffect } from "react";
import { ImageComparison } from "@/components/ImageComparison";
import { Stats } from "@/components/Stats";
import { ImageRating, getInitialRatings, selectPairForComparison, updateRatings } from "@/utils/elo";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { UserRegistration } from "@/components/UserRegistration";
import sirusImage from "@/assets/images/sirus.jpeg";

// Example images (replace with your actual images)
const sampleImages = ["https://picsum.photos/800/600?random=1", "https://picsum.photos/800/600?random=2", "https://picsum.photos/800/600?random=3", "https://picsum.photos/800/600?random=4", "https://picsum.photos/800/600?random=5"
// Add more images here
];

const Index = () => {
  const [ratings, setRatings] = useState<ImageRating[]>(() => getInitialRatings(sampleImages));
  const [currentPair, setCurrentPair] = useState<[ImageRating, ImageRating]>([ratings[0], ratings[1]]);
  const [totalComparisons, setTotalComparisons] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [userData, setUserData] = useState<{ name: string; gender: string } | null>(null);

  useEffect(() => {
    const pair = selectPairForComparison(ratings, totalComparisons);
    setCurrentPair(pair);
  }, [totalComparisons]);

  const handleSelection = (winner: ImageRating, loser: ImageRating) => {
    const [updatedWinner, updatedLoser] = updateRatings(winner, loser);
    setRatings(prevRatings => prevRatings.map(rating => {
      if (rating.id === winner.id) return updatedWinner;
      if (rating.id === loser.id) return updatedLoser;
      return rating;
    }));
    setTotalComparisons(prev => prev + 1);
  };

  const handleUserSubmit = (data: { name: string; gender: string }) => {
    setUserData(data);
    setShowVoting(true);
  };

  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 flex justify-between items-center">
        <span className="font-semibold text-lg"></span>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setShowStats(prev => !prev)}>
          {showStats ? "Back to voting" : "Leaderboard"}
        </Button>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto py-12 px-4 flex items-center justify-center">
        {!showStats && !showVoting ? <div className="space-y-12">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-['PP_Editorial_New'] font-normal max-w-2xl mx-auto leading-tight text-center">
                <div className="flex items-center justify-center gap-5 mb-2">
                  <img src={sirusImage} alt="Sirus" className="w-[1em] h-[1em] rounded-md -translate-y-1.0 object-cover" />
                  <span>Sirus is</span>
                </div>
                <div className="text-center">
                  (unfortunately)<br />on the dating apps.
                </div>
              </h1>
              <p className="text-lg font-['PP Neue Montreal'] font-thin">His biggest struggle is choosing the perfect photo.</p>
              <p className="text-lg font-['PP Neue Montreal'] font-thin">Can you help him?</p>
            </div>

            <div className="flex justify-center gap-4">
              <UserRegistration onSubmit={handleUserSubmit} />
            </div>

            <Button variant="ghost" size="sm" className="mx-auto flex items-center gap-2" onClick={() => setShowStats(true)}>
              <Eye size={16} />
              see the data
            </Button>
          </div> : showVoting ? <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-medium">Click to choose the better photo. Rank up on our leaderboard.</h1>
            </div>
            <ImageComparison imageA={currentPair[0]} imageB={currentPair[1]} onSelect={handleSelection} />
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">{totalComparisons} swipes • {Math.round(totalComparisons / 0.5)}% seen</p>
              <Button variant="secondary" size="sm" onClick={() => setShowStats(true)}>
                {50 - totalComparisons} more swipes to see the data
              </Button>
            </div>
          </div> : <Stats ratings={ratings} totalComparisons={totalComparisons} />}
      </main>
    </div>;
};

export default Index;
