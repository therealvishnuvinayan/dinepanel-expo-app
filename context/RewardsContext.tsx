import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { demoBillTransaction, initialTransactions } from '@/data/mockTransactions';
import type { RewardTransaction } from '@/types';

type RewardsContextValue = {
  balance: number;
  monthlyEarned: number;
  transactions: RewardTransaction[];
  hasClaimedDemoBill: boolean;
  claimDemoBill: () => void;
  resetDemo: () => void;
};

const RewardsContext = createContext<RewardsContextValue | null>(null);

export function RewardsProvider({ children }: PropsWithChildren) {
  const [hasClaimedDemoBill, setHasClaimedDemoBill] = useState(false);

  const value = useMemo<RewardsContextValue>(() => {
    const transactions = hasClaimedDemoBill
      ? [demoBillTransaction, ...initialTransactions]
      : initialTransactions;

    return {
      balance: hasClaimedDemoBill ? 52.5 : 42.5,
      monthlyEarned: hasClaimedDemoBill ? 28 : 18,
      transactions,
      hasClaimedDemoBill,
      claimDemoBill: () => setHasClaimedDemoBill(true),
      resetDemo: () => setHasClaimedDemoBill(false),
    };
  }, [hasClaimedDemoBill]);

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}

export function useRewards() {
  const context = useContext(RewardsContext);

  if (!context) {
    throw new Error('useRewards must be used inside RewardsProvider');
  }

  return context;
}

