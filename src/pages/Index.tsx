
import { useState, useEffect } from "react";
import { ImageComparison } from "@/components/ImageComparison";
import { Stats } from "@/components/Stats";
import { ImageRating, updateRatings } from "@/utils/elo";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { UserRegistration } from "@/components/UserRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import sirusImage from "@/assets/images/sirus.jpeg";
import { toast } from "sonner";

const Index = () => {
  const [showStats, setShowStats] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [userData, setUserData] = useState<{ name: string; gender: string } | null>(null);
  const queryClient = useQueryClient();

  // Fetch all images and their ratings
  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('rating', { ascending: false });

      if (error) {
        toast.error('Failed to load images');
        throw error;
      }

      return data.map(img => ({
        ...img,
        id: img.id.toString()
      })) as ImageRating[];
    }
  });

  const selectPairForComparison = (images: ImageRating[]): [ImageRating, ImageRating] => {
    const indices = new Set<number>();
    while (indices.size < 2) {
      indices.add(Math.floor(Math.random() * images.length));
    }
    const [i1, i2] = Array.from(indices);
    return [images[i1], images[i2]];
  };

  const [currentPair, setCurrentPair] = useState<[ImageRating, ImageRating] | null>(null);

  useEffect(() => {
    if (ratings.length >= 2) {
      setCurrentPair(selectPairForComparison(ratings));
    }
  }, [ratings]);

  const handleSelection = async (winner: ImageRating, loser: ImageRating) => {
    const [updatedWinner, updatedLoser] = updateRatings(winner, loser);

    try {
      // Update winner
      const { error: winnerError } = await supabase
        .from('images')
        .update({
          rating: updatedWinner.rating,
          comparisons: updatedWinner.comparisons,
          wins: updatedWinner.wins
        })
        .eq('id', winner.id);

      if (winnerError) throw winnerError;

      // Update loser
      const { error: loserError } = await supabase
        .from('images')
        .update({
          rating: updatedLoser.rating,
          comparisons: updatedLoser.comparisons,
          losses: updatedLoser.losses
        })
        .eq('id', loser.id);

      if (loserError) throw loserError;

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['images'] });

      // Select new pair
      if (ratings.length >= 2) {
        setCurrentPair(selectPairForComparison(ratings));
      }
    } catch (error) {
      toast.error('Failed to update ratings');
      console.error('Error updating ratings:', error);
    }
  };

  const handleUserSubmit = (data: { name: string; gender: string }) => {
    setUserData(data);
    setShowVoting(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-4 px-6 flex justify-between items-center">
        <span className="font-semibold text-lg"></span>
        <Button 
          variant="ghost" 
          className="text-muted-foreground hover:text-foreground" 
          onClick={() => setShowStats(prev => !prev)}
        >
          {showStats ? "Back to voting" : "Leaderboard"}
        </Button>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto py-12 px-4 flex items-center justify-center">
        {!showStats && !showVoting ? (
          <div className="space-y-12">
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

            <Button 
              variant="ghost" 
              size="sm" 
              className="mx-auto flex items-center gap-2" 
              onClick={() => setShowStats(true)}
            >
              <Eye size={16} />
              see the data
            </Button>
          </div>
        ) : showVoting && currentPair ? (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-medium">Click to choose the better photo. Rank up on our leaderboard.</h1>
            </div>
            <ImageComparison 
              imageA={currentPair[0]} 
              imageB={currentPair[1]} 
              onSelect={handleSelection} 
            />
          </div>
        ) : (
          <Stats 
            ratings={ratings} 
            totalComparisons={ratings.reduce((sum, img) => sum + img.comparisons, 0)} 
          />
        )}
      </main>
    </div>
  );
};

export default Index;
