export type ClaimStatus = "UNCLAIMED" | "CLAIMED" | "EXPIRED" | "CANCELLED";

export interface Restaurant {
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
}

export interface Membership {
  id: string;
  role: "OWNER" | "MANAGER" | "CASHIER";
  is_active: boolean;
  restaurant: Restaurant;
}

export interface MerchantProfile {
  user: { id: string; phone: string; name: string | null };
  memberships: Membership[];
}

export interface MerchantBill {
  id: string;
  restaurant: Restaurant;
  bill_number: string;
  bill_amount: string;
  bill_date: string;
  reward_percentage: string;
  reward_amount: string;
  source: "MERCHANT";
  claim_status: ClaimStatus;
  created_at: string;
  claimed_at: string | null;
}

export interface ClaimCode {
  token: string;
  claim_url: string;
  expires_at: string;
}

export interface CreatedBill {
  bill: MerchantBill;
  claim: ClaimCode;
}

export interface Dashboard {
  today_bills: number;
  today_claimed_bills: number;
  today_unclaimed_bills: number;
  today_sales_tracked: string;
  today_rewards_issued: string;
  recent_bills: MerchantBill[];
}

export interface BillPage {
  items: MerchantBill[];
  total: number;
  limit: number;
  offset: number;
}
