import { useState, useEffect } from 'react';

// Number of swipes required to unlock the leaderboard
export const SWIPE_THRESHOLD = 0;
const USER_ID_KEY = 'user_id';
const SWIPE_COUNT_KEY = 'swipe_count';

function generateUserId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function useSwipeCount() {
  const [swipeCount, setSwipeCount] = useState<number>(0);
  const [userId, setUserId] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  useEffect(() => {
    // Initialize user ID if not exists
    let storedUserId = localStorage.getItem(USER_ID_KEY);
    if (!storedUserId) {
      storedUserId = generateUserId();
      localStorage.setItem(USER_ID_KEY, storedUserId);
    }
    setUserId(storedUserId);

    // Load stored swipe count
    const storedCount = Number(localStorage.getItem(SWIPE_COUNT_KEY) || '0');
    setSwipeCount(storedCount);
    setIsUnlocked(storedCount >= SWIPE_THRESHOLD);
  }, []);

  const incrementSwipeCount = () => {
    const newCount = swipeCount + 1;
    setSwipeCount(newCount);
    localStorage.setItem(SWIPE_COUNT_KEY, newCount.toString());
    setIsUnlocked(newCount >= SWIPE_THRESHOLD);
  };

  const remainingSwipes = Math.max(0, SWIPE_THRESHOLD - swipeCount);

  return {
    swipeCount,
    userId,
    isUnlocked,
    remainingSwipes,
    incrementSwipeCount,
  };
}