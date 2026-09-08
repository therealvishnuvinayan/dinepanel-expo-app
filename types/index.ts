import type { ImageSourcePropType } from 'react-native';

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  rewardPercent: number;
  image: ImageSourcePropType;
  description: string;
  address: string;
  area: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
};

export type TransactionKind = 'earn' | 'redeem' | 'adjustment' | 'reversal';
export type TransactionStatus = 'pending' | 'completed' | 'reversed';

export type RewardTransaction = {
  id: string;
  restaurantId: string | null;
  restaurantName: string;
  cuisine: string;
  amount: number;
  date: string;
  createdAt: string;
  kind: TransactionKind;
  status: TransactionStatus;
  label: string;
};

export type ClaimBill = {
  id: string;
  restaurant: Restaurant;
  billNumber: string;
  billAmount: number;
  billDate: string;
  rewardPercentage: number;
  rewardAmount: number;
  claimable: boolean;
  expiresAt: string;
};

export type RewardClaimResult = {
  rewardAmount: number;
  transaction: RewardTransaction;
  updatedBalance: number;
  restaurant: Restaurant;
};
