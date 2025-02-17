import { useState, useEffect } from "react";
import { ImageComparison } from "@/components/ImageComparison";
import { Stats } from "@/components/Stats";
import { ImageRating, updateRatings } from "@/utils/elo";
import { selectNextPairForComparison } from "@/utils/pairSelection";
import { Button } from "@/components/ui/button";
import { Eye, Lock } from "lucide-react";
import { UserRegistration } from "@/components/UserRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import sirusImage from "@/assets/images/sirus.jpeg";
import { toast } from "sonner";
import { useSwipeCount } from "@/hooks/use-swipe-count";

const RANDOM_PHASE_LIMIT = 20;       // # of initial votes for purely random
const RATING_DIFF_THRESHOLD = 50;    // consider images with <50 Elo diff
const PARTIAL_RANDOM_CHANCE = 0.30;  // 15% chance to pick random in adaptive

const Index = () => {
  const [showStats, setShowStats] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [userData, setUserData] = useState<{ name: string; gender: string } | null>(null);
  const queryClient = useQueryClient();
  const { isUnlocked, remainingSwipes, incrementSwipeCount, userId, deviceType } = useSwipeCount();

  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('rating_overall', { ascending: false });

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
        PARTIAL_RANDOM_CHANCE,
        userData?.gender
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

      if (userData.name) {
        const { data: currentData } = await supabase
          .from('user_votes')
          .select('vote_count')
          .eq('device_id', userId)
          .maybeSingle();

        const currentVoteCount = currentData?.vote_count || 0;

        const { error: voteError } = await supabase
          .from('user_votes')
          .update({ vote_count: currentVoteCount + 1 })
          .eq('device_id', userId);

        if (voteError) {
          console.error('Error updating vote count:', voteError);
        }
      }

      incrementSwipeCount();
      await queryClient.invalidateQueries({ queryKey: ['images'] });

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
      <header className="py-4 px-10">
        <a 
          href="/" 
          className="font-['PP Neue Montreal'] font-thin text-[#0A0A0A] hover:scale-[1.02] active:scale-[0.99] transition-all duration-250 inline-block" 
          onClick={(e) => {
            e.preventDefault();
            setShowStats(false);
            setShowVoting(false);
          }}
        >
          Sirus.nyc
        </a>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto py-12 px-4 flex items-center justify-center">
        {!showStats && !showVoting ? (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-['PP_Editorial_New'] font-normal max-w-2xl mx-auto leading-tight text-center">
                <div className="flex items-center justify-center gap-3 sm:gap-5 mb-2">
                  <img src={sirusImage} alt="Sirus" className="w-[0.8em] sm:w-[1em] h-[0.8em] sm:h-[1em] rounded-md -translate-y-1.0 object-cover" />
                  <span>Sirus is</span>
                </div>
                <div className="text-center">
                  (unfortunately)<br />on the dating apps.
                </div>
              </h1>
              <p className="text-lg font-['PP Neue Montreal'] font-thin">Help him find his <strong>wife</strong> by choosing the perfect photos.</p>
              <p className="text-lg font-['PP Neue Montreal'] font-thin">Can you help him?</p>
            </div>

            <div className="flex justify-center gap-4">
              <UserRegistration 
                onSubmit={handleUserSubmit} 
                userId={userId}
                deviceType={deviceType}
              />
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="mx-auto flex items-center gap-2 relative px-[30px] py-2 rounded-full bg-[#F0F0F0] border border-black/10 hover:bg-[#E8E8E8] transition-colors"
              onClick={() => isUnlocked && setShowStats(true)}
              disabled={!isUnlocked}
            >
              {isUnlocked ? (
                <>
                  <Eye size={16} />
                  see the data
                </>
              ) : (
                <>
                  <Lock size={16} />
                  {remainingSwipes} more swipes to see the data
                </>
              )}
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
              isUnlocked={isUnlocked}
              remainingSwipes={remainingSwipes}
              onStatsClick={() => {
                setShowVoting(false);
                setShowStats(true);
              }}
            />
          </div>
        ) : (
          <Stats 
            ratings={ratings} 
            totalComparisons={ratings.reduce((sum, img) => sum + img.comparisons_overall, 0)} 
          />
        )}
      </main>
    </div>
  );
};

export default Index;
