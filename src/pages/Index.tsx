
import { useState, useEffect } from "react";
import { ImageComparison } from "@/components/ImageComparison";
import { Stats } from "@/components/Stats";
import { ImageRating, updateRatings } from "@/utils/elo";
import { selectNextPairForComparison } from "@/utils/pairSelection";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { UserRegistration } from "@/components/UserRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import sirusImage from "@/assets/images/sirus.jpeg";
import { toast } from "sonner";

// Some constants for your adaptive logic
const RANDOM_PHASE_LIMIT = 5;       // # of initial votes for purely random
const RATING_DIFF_THRESHOLD = 50;    // consider images with <50 Elo diff
const PARTIAL_RANDOM_CHANCE = 0.15;  // 15% chance to pick random in adaptive

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

  const [currentPair, setCurrentPair] = useState<[ImageRating, ImageRating] | null>(null);

  useEffect(() => {
    if (ratings.length >= 2) {
    const pair = selectNextPairForComparison(
      ratings,
      RANDOM_PHASE_LIMIT,
      RATING_DIFF_THRESHOLD,
      PARTIAL_RANDOM_CHANCE
    );
    setCurrentPair(pair);
    }
  }, [ratings]);

  const handleSelection = async (winner: ImageRating, loser: ImageRating) => {
    if (!userData?.gender) {
      toast.error('Please select your gender before voting');
      return;
    }

    const [updatedWinner, updatedLoser] = updateRatings(winner, loser, userData.gender as 'Woman' | 'Man' | 'Other');

    try {
      // Update winner
      const { error: winnerError } = await supabase
        .from('images')
        .update({
          rating_overall: updatedWinner.rating_overall,
          rating_male: updatedWinner.rating_male,
          rating_female: updatedWinner.rating_female,
          comparisons_overall: updatedWinner.comparisons_overall,
          comparisons_male: updatedWinner.comparisons_male,
          comparisons_female: updatedWinner.comparisons_female,
          wins_overall: updatedWinner.wins_overall,
          wins_male: updatedWinner.wins_male,
          wins_female: updatedWinner.wins_female,
          losses_overall: updatedWinner.losses_overall,
          losses_male: updatedWinner.losses_male,
          losses_female: updatedWinner.losses_female
        })
        .eq('id', winner.id);

      if (winnerError) throw winnerError;

      // Update loser
      const { error: loserError } = await supabase
        .from('images')
        .update({
          rating_overall: updatedLoser.rating_overall,
          rating_male: updatedLoser.rating_male,
          rating_female: updatedLoser.rating_female,
          comparisons_overall: updatedLoser.comparisons_overall,
          comparisons_male: updatedLoser.comparisons_male,
          comparisons_female: updatedLoser.comparisons_female,
          wins_overall: updatedLoser.wins_overall,
          wins_male: updatedLoser.wins_male,
          wins_female: updatedLoser.wins_female,
          losses_overall: updatedLoser.losses_overall,
          losses_male: updatedLoser.losses_male,
          losses_female: updatedLoser.losses_female
        })
        .eq('id', loser.id);

      if (loserError) throw loserError;

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['images'] });

      // Select new pair
      if (ratings.length >= 2) {
        const nextPair = selectNextPairForComparison(
          ratings,
          RANDOM_PHASE_LIMIT,
          RATING_DIFF_THRESHOLD,
          PARTIAL_RANDOM_CHANCE
        );
        setCurrentPair(nextPair);      
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
        <a 
          href="/" 
          className="font-['PP Neue Montreal'] font-thin text-[#0A0A0A] hover:scale-[1.02] active:scale-[0.99] transition-all duration-250" 
          onClick={(e) => {
            e.preventDefault();
            setShowStats(false);
            setShowVoting(false);
          }}
        >
          Sirus.nyc
        </a>
        <Button 
          variant="ghost" 
          className="font-['PP Neue Montreal'] font-thin text-[#0A0A0A] hover:scale-[1.02] active:scale-[0.99] transition-all duration-250" 
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
              <h1 className="text-2xl font-['PP Neue Montreal'] font-thin">Click to choose the better photo!</h1>
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
