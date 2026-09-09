import { apiRequest } from '@/api/client';
import type { ApiCreatedRewardRedemption, ApiRewardRedemption } from '@/api/types';

export function createRewardRedemption(restaurantId: string, amount: string) {
  return apiRequest<ApiCreatedRewardRedemption>('/rewards/redemptions', {
    method: 'POST',
    body: JSON.stringify({ restaurant_id: restaurantId, amount }),
  });
}

export function getActiveRewardRedemption() {
  return apiRequest<ApiRewardRedemption | null>('/rewards/redemptions/active');
}

export function getRewardRedemption(id: string) {
  return apiRequest<ApiRewardRedemption>(
    `/rewards/redemptions/${encodeURIComponent(id)}`,
  );
}

export function cancelRewardRedemption(id: string) {
  return apiRequest<ApiRewardRedemption>(
    `/rewards/redemptions/${encodeURIComponent(id)}/cancel`,
    { method: 'POST' },
  );
}
