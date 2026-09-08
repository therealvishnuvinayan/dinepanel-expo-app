import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  clearPendingClaimToken,
  getPendingClaimToken,
  storePendingClaimToken,
} from '@/api/claimContinuationStorage';
import * as claimsApi from '@/api/claims';
import * as restaurantsApi from '@/api/restaurants';
import * as rewardsApi from '@/api/rewards';
import type { ApiRestaurant, ApiRewardTransaction } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import type { ClaimBill, Restaurant, RewardClaimResult, RewardTransaction } from '@/types';

type RewardsContextValue = {
  balance: number | null;
  monthlyEarned: number | null;
  transactions: RewardTransaction[];
  restaurants: Restaurant[];
  currentBill: ClaimBill | null;
  lastClaim: RewardClaimResult | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshIfStale: () => Promise<void>;
  getRestaurant: (idOrSlug: string | undefined) => Restaurant | undefined;
  loadRestaurant: (idOrSlug: string) => Promise<Restaurant>;
  previewClaimToken: (token: string) => Promise<ClaimBill>;
  restorePendingClaim: () => Promise<ClaimBill | null>;
  clearPendingClaim: () => Promise<void>;
  claimCurrentBill: () => Promise<RewardClaimResult>;
  loadClaimResult: (transactionId: string) => Promise<RewardClaimResult>;
  clearError: () => void;
};

const RewardsContext = createContext<RewardsContextValue | null>(null);
const fallbackImage = require('../assets/images/dinepanel-icon.png');
const STALE_AFTER_MS = 30_000;

export function mapApiRestaurant(restaurant: ApiRestaurant): Restaurant {
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    rewardPercent: Number(restaurant.reward_percentage),
    image: restaurant.image_url ? { uri: restaurant.image_url } : fallbackImage,
    description: restaurant.description,
    address: restaurant.address,
    area: restaurant.area,
    city: restaurant.city,
    latitude: restaurant.latitude === null ? null : Number(restaurant.latitude),
    longitude: restaurant.longitude === null ? null : Number(restaurant.longitude),
  };
}

function formatTransactionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-AE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function transactionLabel(transaction: ApiRewardTransaction) {
  if (transaction.status === 'PENDING') {
    if (transaction.type === 'EARN') return 'Reward pending';
    if (transaction.type === 'REDEEM') return 'Reward use pending';
    return 'Adjustment pending';
  }
  if (transaction.status === 'REVERSED' || transaction.type === 'REVERSAL') {
    return 'Reward reversed';
  }
  if (transaction.type === 'EARN') return 'Reward earned';
  if (transaction.type === 'REDEEM') return 'Reward used';
  return 'Balance adjustment';
}

export function mapApiTransaction(transaction: ApiRewardTransaction): RewardTransaction {
  return {
    id: transaction.id,
    restaurantId: transaction.restaurant?.id ?? null,
    restaurantName: transaction.restaurant?.name ?? 'DinePanel rewards',
    cuisine: transaction.restaurant?.cuisine ?? 'Account activity',
    amount: Number(transaction.amount),
    date: formatTransactionDate(transaction.created_at),
    createdAt: transaction.created_at,
    kind: transaction.type.toLowerCase() as RewardTransaction['kind'],
    status: transaction.status.toLowerCase() as RewardTransaction['status'],
    label: transactionLabel(transaction),
  };
}

function mapClaimPreview(response: Awaited<ReturnType<typeof claimsApi.previewClaim>>): ClaimBill {
  return {
    id: response.bill.id,
    restaurant: mapApiRestaurant(response.restaurant),
    billNumber: response.bill.bill_number,
    billAmount: Number(response.bill.bill_amount),
    billDate: response.bill.bill_date,
    rewardPercentage: Number(response.reward_percentage),
    rewardAmount: Number(response.reward_amount),
    claimable: response.bill.claim_status === 'UNCLAIMED',
    expiresAt: response.expires_at,
  };
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function RewardsProvider({ children }: PropsWithChildren) {
  const { authStatus, user } = useAuth();
  const authIdentity = authStatus === 'AUTHENTICATED' ? user?.id ?? null : null;
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentBill, setCurrentBill] = useState<ClaimBill | null>(null);
  const [currentClaimToken, setCurrentClaimToken] = useState<string | null>(null);
  const [lastClaim, setLastClaim] = useState<RewardClaimResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedAt = useRef(0);
  const authIdentityRef = useRef<string | null>(authIdentity);
  const inFlight = useRef<{ identity: string; promise: Promise<void> } | null>(null);
  const pendingRestoreInFlight = useRef<{
    identity: string;
    promise: Promise<ClaimBill | null>;
  } | null>(null);
  const claimResultInFlight = useRef(new Map<string, Promise<RewardClaimResult>>());
  authIdentityRef.current = authIdentity;

  const loadData = useCallback(
    (refreshing = false, force = true): Promise<void> => {
      if (!authIdentity) return Promise.resolve();
      if (!force && Date.now() - lastLoadedAt.current < STALE_AFTER_MS) {
        return Promise.resolve();
      }
      if (inFlight.current?.identity === authIdentity) return inFlight.current.promise;

      const requestIdentity = authIdentity;
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setError(null);
      let request!: Promise<void>;
      request = Promise.all([
        rewardsApi.getRewardBalance(),
        restaurantsApi.getRestaurants(),
        rewardsApi.getRewardTransactions(),
      ])
        .then(([balanceResponse, restaurantResponse, transactionResponse]) => {
          if (authIdentityRef.current !== requestIdentity) return;
          setBalance(Number(balanceResponse.balance));
          setRestaurants(restaurantResponse.map(mapApiRestaurant));
          setTransactions(transactionResponse.map(mapApiTransaction));
          lastLoadedAt.current = Date.now();
        })
        .catch((loadError: unknown) => {
          if (authIdentityRef.current === requestIdentity) setError(messageFrom(loadError));
        })
        .finally(() => {
          if (authIdentityRef.current === requestIdentity) {
            setIsLoading(false);
            setIsRefreshing(false);
          }
          if (inFlight.current?.promise === request) inFlight.current = null;
        });
      inFlight.current = { identity: requestIdentity, promise: request };
      return request;
    },
    [authIdentity],
  );

  useEffect(() => {
    if (authStatus === 'AUTHENTICATED') {
      void loadData();
    } else if (authStatus === 'UNAUTHENTICATED') {
      setBalance(null);
      setTransactions([]);
      setRestaurants([]);
      setCurrentBill(null);
      setCurrentClaimToken(null);
      setLastClaim(null);
      setError(null);
      setIsLoading(false);
      setIsRefreshing(false);
      lastLoadedAt.current = 0;
      inFlight.current = null;
      pendingRestoreInFlight.current = null;
      claimResultInFlight.current.clear();
    }
  }, [authStatus, loadData, user?.id]);

  const getRestaurant = useCallback(
    (idOrSlug: string | undefined) =>
      restaurants.find(
        (restaurant) => restaurant.id === idOrSlug || restaurant.slug === idOrSlug,
      ),
    [restaurants],
  );

  const loadRestaurant = useCallback(
    async (idOrSlug: string) => {
      const existing = restaurants.find(
        (restaurant) => restaurant.id === idOrSlug || restaurant.slug === idOrSlug,
      );
      if (existing) return existing;

      if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(idOrSlug)) {
        const loaded = mapApiRestaurant(await restaurantsApi.getRestaurant(idOrSlug));
        setRestaurants((items) => [loaded, ...items.filter((item) => item.id !== loaded.id)]);
        return loaded;
      }

      const loadedRestaurants = (await restaurantsApi.getRestaurants()).map(mapApiRestaurant);
      setRestaurants(loadedRestaurants);
      const matched = loadedRestaurants.find((restaurant) => restaurant.slug === idOrSlug);
      if (!matched) throw new Error('This restaurant is not available.');
      return matched;
    },
    [restaurants],
  );

  const previewClaimToken = useCallback(async (token: string) => {
    if (!authIdentity) throw new Error('Sign in before previewing this bill.');
    const requestIdentity = authIdentity;
    setError(null);
    try {
      const response = await claimsApi.previewClaim(token);
      if (authIdentityRef.current !== requestIdentity) {
        throw new Error('Your session changed while the bill was loading.');
      }
      const bill = mapClaimPreview(response);
      await storePendingClaimToken(token);
      if (authIdentityRef.current !== requestIdentity) {
        throw new Error('Your session changed while the bill was loading.');
      }
      setCurrentBill(bill);
      setCurrentClaimToken(token);
      setLastClaim(null);
      return bill;
    } catch (previewError) {
      if (authIdentityRef.current === requestIdentity) setError(messageFrom(previewError));
      throw previewError;
    }
  }, [authIdentity]);

  const restorePendingClaim = useCallback(() => {
    if (!authIdentity) return Promise.reject(new Error('Sign in before restoring this bill.'));
    if (pendingRestoreInFlight.current?.identity === authIdentity) {
      return pendingRestoreInFlight.current.promise;
    }

    const requestIdentity = authIdentity;
    let request!: Promise<ClaimBill | null>;
    request = (async () => {
      const token = await getPendingClaimToken();
      if (authIdentityRef.current !== requestIdentity) {
        throw new Error('Your session changed while the bill was loading.');
      }
      if (!token) return null;
      return previewClaimToken(token);
    })().finally(() => {
      if (pendingRestoreInFlight.current?.promise === request) {
        pendingRestoreInFlight.current = null;
      }
    });
    pendingRestoreInFlight.current = { identity: requestIdentity, promise: request };
    return request;
  }, [authIdentity, previewClaimToken]);

  const clearPendingClaim = useCallback(async () => {
    await clearPendingClaimToken();
    setCurrentBill(null);
    setCurrentClaimToken(null);
  }, []);

  const claimCurrentBill = useCallback(async () => {
    if (!authIdentity) throw new Error('Sign in before claiming this reward.');
    if (!currentBill || !currentClaimToken) {
      throw new Error('Scan a bill before claiming a reward.');
    }
    const requestIdentity = authIdentity;
    setError(null);
    try {
      const response = await claimsApi.claimToken(currentClaimToken);
      if (authIdentityRef.current !== requestIdentity) {
        throw new Error('Your session changed while the reward was being claimed.');
      }
      const result: RewardClaimResult = {
        rewardAmount: Number(response.reward_amount),
        transaction: mapApiTransaction(response.transaction),
        updatedBalance: Number(response.updated_balance),
        restaurant: mapApiRestaurant(response.restaurant),
      };
      setBalance(result.updatedBalance);
      setTransactions((items) => [
        result.transaction,
        ...items.filter((item) => item.id !== result.transaction.id),
      ]);
      setCurrentBill((bill) => (bill ? { ...bill, claimable: false } : bill));
      setCurrentClaimToken(null);
      setLastClaim(result);
      void clearPendingClaimToken().catch(() => undefined);
      return result;
    } catch (claimError) {
      if (authIdentityRef.current === requestIdentity) setError(messageFrom(claimError));
      throw claimError;
    }
  }, [authIdentity, currentBill, currentClaimToken]);

  const loadClaimResult = useCallback((transactionId: string) => {
    if (!authIdentity) return Promise.reject(new Error('Sign in before restoring this reward receipt.'));
    const requestIdentity = authIdentity;
    const requestKey = `${requestIdentity}:${transactionId}`;
    const existing = claimResultInFlight.current.get(requestKey);
    if (existing) return existing;

    let request!: Promise<RewardClaimResult>;
    request = Promise.all([
      rewardsApi.getRewardTransaction(transactionId),
      rewardsApi.getRewardBalance(),
    ]).then(([transactionResponse, balanceResponse]) => {
      if (authIdentityRef.current !== requestIdentity) {
        throw new Error('Your session changed while the reward receipt was loading.');
      }
      if (
        transactionResponse.type !== 'EARN' ||
        transactionResponse.status !== 'COMPLETED' ||
        !transactionResponse.bill_id ||
        !transactionResponse.restaurant
      ) {
        throw new Error('This reward receipt is not available.');
      }
      const result: RewardClaimResult = {
        rewardAmount: Number(transactionResponse.amount),
        transaction: mapApiTransaction(transactionResponse),
        updatedBalance: Number(balanceResponse.balance),
        restaurant: mapApiRestaurant(transactionResponse.restaurant),
      };
      setBalance(result.updatedBalance);
      setLastClaim(result);
      return result;
    }).finally(() => {
      if (claimResultInFlight.current.get(requestKey) === request) {
        claimResultInFlight.current.delete(requestKey);
      }
    });
    claimResultInFlight.current.set(requestKey, request);
    return request;
  }, [authIdentity]);

  const refresh = useCallback(() => loadData(true), [loadData]);
  const refreshIfStale = useCallback(() => loadData(true, false), [loadData]);

  const monthlyEarned = useMemo(() => {
    if (balance === null) return null;
    const now = new Date();
    return transactions
      .filter((transaction) => {
        if (transaction.kind !== 'earn' || transaction.status !== 'completed') return false;
        const created = new Date(transaction.createdAt);
        return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
      })
      .reduce((total, transaction) => total + Math.max(transaction.amount, 0), 0);
  }, [balance, transactions]);

  const value = useMemo<RewardsContextValue>(
    () => ({
      balance,
      monthlyEarned,
      transactions,
      restaurants,
      currentBill,
      lastClaim,
      isLoading,
      isRefreshing,
      error,
      refresh,
      refreshIfStale,
      getRestaurant,
      loadRestaurant,
      previewClaimToken,
      restorePendingClaim,
      clearPendingClaim,
      claimCurrentBill,
      loadClaimResult,
      clearError: () => setError(null),
    }),
    [
      balance,
      claimCurrentBill,
      clearPendingClaim,
      currentBill,
      error,
      getRestaurant,
      isLoading,
      isRefreshing,
      lastClaim,
      loadClaimResult,
      loadData,
      loadRestaurant,
      monthlyEarned,
      previewClaimToken,
      refresh,
      refreshIfStale,
      restaurants,
      restorePendingClaim,
      transactions,
    ],
  );

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}

export function useRewards() {
  const context = useContext(RewardsContext);
  if (!context) throw new Error('useRewards must be used inside RewardsProvider');
  return context;
}
