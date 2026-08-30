import type { ImageSourcePropType } from 'react-native';

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  rewardPercent: number;
  distance: string;
  neighborhood: string;
  rating: number;
  image: ImageSourcePropType;
  accent: string;
  description: string;
  address: string;
  hours: string;
  offer?: string;
  popular?: boolean;
};

export type TransactionType = 'earned' | 'redeemed';

export type RewardTransaction = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  amount: number;
  date: string;
  createdAt?: string;
  type: TransactionType;
};

export type DemoBill = {
  id: string;
  restaurant: Restaurant;
  billNumber: string;
  billAmount: number;
  billDate: string;
  rewardPercentage: number;
  rewardAmount: number;
  claimable: boolean;
};

export type RewardClaimResult = {
  rewardAmount: number;
  transaction: RewardTransaction;
  updatedBalance: number;
  restaurant: Restaurant;
};

export type Offer = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  title: string;
  detail: string;
  eyebrow: string;
  accent: string;
};
