import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import * as billsApi from '@/api/bills';
import * as restaurantsApi from '@/api/restaurants';
import * as rewardsApi from '@/api/rewards';
import type { ApiDemoBill, ApiRestaurant, ApiRewardTransaction } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { restaurantPresentation } from '@/data/restaurantPresentation';
import type { DemoBill, Restaurant, RewardClaimResult, RewardTransaction } from '@/types';

type RewardsContextValue = {
  balance: number;
  monthlyEarned: number;
  transactions: RewardTransaction[];
  restaurants: Restaurant[];
  currentBill: DemoBill | null;
  lastClaim: RewardClaimResult | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getRestaurant: (idOrSlug: string | undefined) => Restaurant | undefined;
  loadRestaurant: (idOrSlug: string) => Promise<Restaurant>;
  createDemoBill: () => Promise<DemoBill>;
  claimCurrentBill: () => Promise<RewardClaimResult>;
  clearError: () => void;
};

const RewardsContext = createContext<RewardsContextValue | null>(null);
const fallbackImage = require('../assets/images/dinepanel-icon.png');

export function mapApiRestaurant(restaurant: ApiRestaurant): Restaurant {
  const presentation = restaurantPresentation[restaurant.slug];
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    rewardPercent: Number(restaurant.reward_percentage),
    distance: presentation?.distance ?? restaurant.area,
    neighborhood: restaurant.area,
    rating: presentation?.rating ?? 4.8,
    image: restaurant.image_url ? { uri: restaurant.image_url } : presentation?.image ?? fallbackImage,
    accent: presentation?.accent ?? '#EAF7F0',
    description: restaurant.description,
    address: `${restaurant.address}, ${restaurant.city}`,
    hours: presentation?.hours ?? 'Hours available at the restaurant',
    offer: presentation?.offer,
    popular: presentation?.popular,
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

export function mapApiTransaction(transaction: ApiRewardTransaction): RewardTransaction {
  const amount = Number(transaction.amount);
  const earned = transaction.type === 'EARN' || (transaction.type === 'ADJUSTMENT' && amount > 0);
  return {
    id: transaction.id,
    restaurantId: transaction.restaurant?.id ?? '',
    restaurantName: transaction.restaurant?.name ?? 'DinePanel adjustment',
    cuisine: transaction.restaurant?.cuisine ?? 'Rewards',
    amount,
    date: formatTransactionDate(transaction.created_at),
    createdAt: transaction.created_at,
    type: earned ? 'earned' : 'redeemed',
  };
}

function mapApiBill(bill: ApiDemoBill): DemoBill {
  return {
    id: bill.id,
    restaurant: mapApiRestaurant(bill.restaurant),
    billNumber: bill.bill_number,
    billAmount: Number(bill.bill_amount),
    billDate: bill.bill_date,
    rewardPercentage: Number(bill.reward_percentage),
    rewardAmount: Number(bill.reward_amount),
    claimable: bill.claimable,
  };
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function RewardsProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentBill, setCurrentBill] = useState<DemoBill | null>(null);
  const [lastClaim, setLastClaim] = useState<RewardClaimResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (refreshing = false) => {
      if (!isAuthenticated) return;
      refreshing ? setIsRefreshing(true) : setIsLoading(true);
      setError(null);
      try {
        const [balanceResponse, restaurantResponse, transactionResponse] = await Promise.all([
          rewardsApi.getRewardBalance(),
          restaurantsApi.getRestaurants(),
          rewardsApi.getRewardTransactions(),
        ]);
        setBalance(Number(balanceResponse.balance));
        setRestaurants(restaurantResponse.map(mapApiRestaurant));
        setTransactions(transactionResponse.map(mapApiTransaction));
      } catch (loadError) {
        setError(messageFrom(loadError));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setBalance(0);
      setTransactions([]);
      setRestaurants([]);
      setCurrentBill(null);
      setLastClaim(null);
      setError(null);
    }
  }, [isAuthenticated, loadData, user?.id]);

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
      if (!matched) throw new Error('Restaurant not found');
      return matched;
    },
    [restaurants],
  );

  const createDemoBill = useCallback(async () => {
    setError(null);
    try {
      let greenChilli = restaurants.find((restaurant) => restaurant.slug === 'green-chilli');
      if (!greenChilli) {
        const loadedRestaurants = (await restaurantsApi.getRestaurants()).map(mapApiRestaurant);
        setRestaurants(loadedRestaurants);
        greenChilli = loadedRestaurants.find((restaurant) => restaurant.slug === 'green-chilli');
      }
      if (!greenChilli) throw new Error('Green Chilli is not available right now.');

      const bill = mapApiBill(await billsApi.createDemoBill(greenChilli.id, '500.00'));
      setCurrentBill(bill);
      setLastClaim(null);
      return bill;
    } catch (createError) {
      setError(messageFrom(createError));
      throw createError;
    }
  }, [restaurants]);

  const claimCurrentBill = useCallback(async () => {
    if (!currentBill) throw new Error('Create a demo bill before claiming a reward.');
    setError(null);
    try {
      const response = await billsApi.claimBill(currentBill.id);
      const result: RewardClaimResult = {
        rewardAmount: Number(response.reward_amount),
        transaction: mapApiTransaction(response.transaction),
        updatedBalance: Number(response.updated_balance),
        restaurant: currentBill.restaurant,
      };
      setBalance(result.updatedBalance);
      setTransactions((items) => [
        result.transaction,
        ...items.filter((item) => item.id !== result.transaction.id),
      ]);
      setCurrentBill((bill) => (bill ? { ...bill, claimable: false } : bill));
      setLastClaim(result);
      return result;
    } catch (claimError) {
      setError(messageFrom(claimError));
      throw claimError;
    }
  }, [currentBill]);

  const monthlyEarned = useMemo(
    () => {
      const now = new Date();
      return transactions
        .filter((transaction) => {
          if (transaction.type !== 'earned') return false;
          if (!transaction.createdAt) return true;
          const created = new Date(transaction.createdAt);
          return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
        })
        .reduce((total, transaction) => total + Math.max(transaction.amount, 0), 0);
    },
    [transactions],
  );

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
      refresh: () => loadData(true),
      getRestaurant,
      loadRestaurant,
      createDemoBill,
      claimCurrentBill,
      clearError: () => setError(null),
    }),
    [
      balance,
      claimCurrentBill,
      createDemoBill,
      currentBill,
      error,
      getRestaurant,
      isLoading,
      isRefreshing,
      lastClaim,
      loadRestaurant,
      loadData,
      monthlyEarned,
      restaurants,
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
