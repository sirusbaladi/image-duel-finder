import { useState, useEffect, useRef } from "react";
import { ImageComparison } from "@/components/ImageComparison";
import { Stats } from "@/components/Stats";
import { ImageRating, updateRatings } from "@/utils/elo";
import { selectNextPairForComparison as selectNextPairElo, recordSeenPair as recordSeenPairElo } from "@/utils/pairSelection";
import { selectNextPairForComparison as selectNextPairGlicko, recordSeenPair as recordSeenPairGlicko } from "@/utils/pairSelectionGlicko";
import { Button } from "@/components/ui/button";
import { Eye, Lock, Loader2 } from "lucide-react";
import { UserRegistration } from "@/components/UserRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import sirusImage from "@/assets/images/sirus.jpeg";
import { toast } from "sonner";
import { useSwipeCount } from "@/hooks/use-swipe-count";
import { TopFive } from "@/components/TopFive";

type RatingSystemType = "elo" | "glicko";
const RATING_SYSTEM: RatingSystemType = "glicko" as RatingSystemType; // Toggle between "elo" and "glicko"
const RANDOM_PHASE_LIMIT = 20;
const RATING_DIFF_THRESHOLD = 150;
const PARTIAL_RANDOM_CHANCE = 0.20;
const TEST_MODE = false;

const selectNextPairForComparison: (
  images: ImageRating[],
  randomPhaseLimit: number,
  ratingDiffThresholdOrPartialRandomChance: number,
  partialRandomChanceOrUserGender?: number | string,
  userGenderOrUserId?: string,
  userId?: string
) => [ImageRating, ImageRating] | null = RATING_SYSTEM === "elo"
  ? selectNextPairElo
  : selectNextPairGlicko as any; // Refine type if needed

const recordSeenPair = RATING_SYSTEM === "elo" ? recordSeenPairElo : recordSeenPairGlicko;

const Index = () => {
  const hasSetInitialPair = useRef(false);
  const [showStats, setShowStats] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [showHi, setShowHi] = useState(false);
  const [isLoadingPair, setIsLoadingPair] = useState(false);
  const [userData, setUserData] = useState<{ name: string; gender: string } | null>(null);
  const queryClient = useQueryClient();
  const { isUnlocked, remainingSwipes, incrementSwipeCount, userId, deviceType } = useSwipeCount();
  const [isTransitioning, setIsTransitioning] = useState(false);

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
        id: img.id.toString(),
        active: img.active ?? true,
        glicko_rating_overall: img.glicko_rating_overall ?? 1500,
        glicko_rating_male: img.glicko_rating_male ?? 1500,
        glicko_rating_female: img.glicko_rating_female ?? 1500,
        glicko_overall_rd: img.glicko_overall_rd ?? 350,
        glicko_male_rd: img.glicko_male_rd ?? 350,
        glicko_female_rd: img.glicko_female_rd ?? 350,
      })) as ImageRating[];
    }
  });

  const activeRatings = ratings.filter(img => img.active);

  const [currentPair, setCurrentPair] = useState<[ImageRating, ImageRating] | null>(null);

  useEffect(() => {
    if (
      showVoting &&
      activeRatings.length >= 2 &&
      userData?.gender &&
      !hasSetInitialPair.current
    ) {
      hasSetInitialPair.current = true;
      setIsLoadingPair(true);
      const pair = selectNextPairForComparison(
        activeRatings,
        RANDOM_PHASE_LIMIT,
        RATING_SYSTEM === "elo" ? RATING_DIFF_THRESHOLD : PARTIAL_RANDOM_CHANCE,
        RATING_SYSTEM === "elo" ? PARTIAL_RANDOM_CHANCE : userData.gender,
        RATING_SYSTEM === "elo" ? userData.gender : userId,
        RATING_SYSTEM === "elo" ? userId : undefined
      );
      if (!pair) {
        toast.info("You've seen all possible image combinations!");
        setShowStats(true);
        setShowVoting(false);
        return;
      }
      setCurrentPair(pair);
      setIsLoadingPair(false);
    }
  }, [ratings, userData?.gender, userId, showVoting]);

  useEffect(() => {
    if (!showVoting) {
      hasSetInitialPair.current = false;
    }
  }, [showVoting]);

  const preloadImage = (url: string) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = resolve;
      img.onerror = reject;
    });
  };

  const handleSelection = async (winner: ImageRating, loser: ImageRating) => {
    if (!userData?.gender) {
      toast.error('Please select your gender before voting');
      return;
    }

    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, 150));

    if (userId) {
      recordSeenPair(userId, winner, loser);
    }

    const [updatedWinner, updatedLoser] = updateRatings(
      winner,
      loser,
      userData.gender as 'Woman' | 'Man' | 'Other'
    );

    try {
      if (ratings.length >= 2) {
        const nextPair = selectNextPairForComparison(
          activeRatings,
          RANDOM_PHASE_LIMIT,
          RATING_SYSTEM === "elo" ? RATING_DIFF_THRESHOLD : PARTIAL_RANDOM_CHANCE,
          RATING_SYSTEM === "elo" ? PARTIAL_RANDOM_CHANCE : userData.gender,
          RATING_SYSTEM === "elo" ? userData.gender : userId,
          RATING_SYSTEM === "elo" ? userId : undefined
        );
        if (!nextPair) {
          toast.info("You've seen all possible image combinations!");
          setShowStats(true);
          setShowVoting(false);
          setIsTransitioning(false);
          return;
        }
        try {
          await Promise.all([
            preloadImage(nextPair[0].url),
            preloadImage(nextPair[1].url),
          ]);
        } catch (error) {
          console.error('Error preloading images:', error);
        }
        setCurrentPair(nextPair);
        setIsTransitioning(false);
      }

      if (!TEST_MODE) {
        const { error: winnerError } = await supabase
          .from('images')
          .update({
            rating_overall: updatedWinner.rating_overall,
            rating_male: updatedWinner.rating_male,
            rating_female: updatedWinner.rating_female,
            glicko_rating_overall: updatedWinner.glicko_rating_overall,
            glicko_rating_male: updatedWinner.glicko_rating_male,
            glicko_rating_female: updatedWinner.glicko_rating_female,
            glicko_overall_rd: updatedWinner.glicko_overall_rd,
            glicko_male_rd: updatedWinner.glicko_male_rd,
            glicko_female_rd: updatedWinner.glicko_female_rd,
            comparisons_overall: updatedWinner.comparisons_overall,
            comparisons_male: updatedWinner.comparisons_male,
            comparisons_female: updatedWinner.comparisons_female,
            wins_overall: updatedWinner.wins_overall,
            wins_male: updatedWinner.wins_male,
            wins_female: updatedWinner.wins_female,
            losses_overall: updatedWinner.losses_overall,
            losses_male: updatedWinner.losses_male,
            losses_female: updatedWinner.losses_female,
            active: updatedWinner.active
          })
          .eq('id', winner.id);

        if (winnerError) throw winnerError;

        const { error: loserError } = await supabase
          .from('images')
          .update({
            rating_overall: updatedLoser.rating_overall,
            rating_male: updatedLoser.rating_male,
            rating_female: updatedLoser.rating_female,
            glicko_rating_overall: updatedLoser.glicko_rating_overall,
            glicko_rating_male: updatedLoser.glicko_rating_male,
            glicko_rating_female: updatedLoser.glicko_rating_female,
            glicko_overall_rd: updatedLoser.glicko_overall_rd,
            glicko_male_rd: updatedLoser.glicko_male_rd,
            glicko_female_rd: updatedLoser.glicko_female_rd,
            comparisons_overall: updatedLoser.comparisons_overall,
            comparisons_male: updatedLoser.comparisons_male,
            comparisons_female: updatedLoser.comparisons_female,
            wins_overall: updatedLoser.wins_overall,
            wins_male: updatedLoser.wins_male,
            wins_female: updatedLoser.wins_female,
            losses_overall: updatedLoser.losses_overall,
            losses_male: updatedLoser.losses_male,
            losses_female: updatedLoser.losses_female,
            active: updatedLoser.active
          })
          .eq('id', loser.id);

        if (loserError) throw loserError;

        const [imageA, imageB] = [winner, loser].sort((a, b) => a.id.localeCompare(b.id));
        const { error: comparisonError } = await supabase
          .from('image_comparisons')
          .insert({
            user_id: userId,
            image_a_id: imageA.id,
            image_b_id: imageB.id,
            winner_id: winner.id,
            user_gender: userData.gender,
          });

        if (comparisonError) {
          console.error('Error recording comparison:', comparisonError);
        }
      }

      if (userId) {
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

      if (!TEST_MODE) {
        await queryClient.invalidateQueries({ queryKey: ['images'] });
      }
    } catch (error) {
      toast.error('Failed to update ratings');
      console.error('Error updating ratings:', error);
      setIsTransitioning(false);
    }
  };

  const handleUserSubmit = (data: { name: string; gender: string }) => {
    setUserData(data);
    setShowVoting(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-4 px-10 flex justify-between items-center">
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
        {showStats && (
          <a 
            href="#" 
            className="font-['PP Neue Montreal'] font-thin text-[#0A0A0A] hover:scale-[1.02] active:scale-[0.99] transition-all duration-250 inline-block"
            onClick={(e) => {
              e.preventDefault();
              setShowStats(false);
              setShowVoting(false);
              setShowHi(true);
            }}
          >
            Get Top 5
          </a>
        )}
      </header>

      <main className="flex-1 container max-w-5xl mx-auto py-12 px-4 flex items-center justify-center">
        {showHi ? (
          <TopFive 
            onBackClick={() => {
              setShowHi(false);
              setShowStats(true);
            }}
          />
        ) : !showStats && !showVoting ? (
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
        ) : showVoting ? (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-['PP Neue Montreal'] font-thin">Click to choose the better photo!</h1>
            </div>
            {isLoadingPair ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : currentPair ? (
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
                isTransitioning={isTransitioning}
              />
            ) : null}
          </div>
        ) : (
          <Stats 
            ratings={ratings} 
            totalComparisons={ratings.reduce((sum, img) => sum + (img.comparisons_overall ?? 0), 0)} 
          />
        )}
      </main>
    </div>
  );
};

export default Index;