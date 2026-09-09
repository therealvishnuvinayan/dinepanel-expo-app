export type ApiUser = {
  id: string;
  phone: string;
  name: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiRestaurant = {
  id: string;
  name: string;
  slug: string;
  description: string;
  cuisine: string;
  reward_percentage: string;
  image_url: string | null;
  address: string;
  area: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiTransactionType = 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'REVERSAL';
export type ApiTransactionStatus = 'PENDING' | 'COMPLETED' | 'REVERSED';

export type ApiRewardTransaction = {
  id: string;
  restaurant: ApiRestaurant | null;
  bill_id: string | null;
  type: ApiTransactionType;
  amount: string;
  status: ApiTransactionStatus;
  description: string;
  created_at: string;
};

export type ApiMerchantBill = {
  id: string;
  restaurant: ApiRestaurant;
  bill_number: string;
  bill_amount: string;
  bill_date: string;
  reward_percentage: string;
  reward_amount: string;
  source: 'MERCHANT';
  claim_status: 'UNCLAIMED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
  claimed_at: string | null;
};

export type ApiClaimPreviewResponse = {
  bill: ApiMerchantBill;
  restaurant: ApiRestaurant;
  reward_percentage: string;
  reward_amount: string;
  expires_at: string;
};

export type ApiTokenClaimResponse = {
  reward_amount: string;
  transaction: ApiRewardTransaction;
  updated_balance: string;
  restaurant: ApiRestaurant;
  bill: ApiMerchantBill;
};

export type ApiRewardRedemptionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED';

export type ApiRewardRedemption = {
  id: string;
  restaurant: ApiRestaurant;
  amount: string;
  status: ApiRewardRedemptionStatus;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  reward_transaction_id: string | null;
  current_balance: string;
};

export type ApiCreatedRewardRedemption = ApiRewardRedemption & {
  qr_payload: string;
};
