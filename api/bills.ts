import { apiRequest } from '@/api/client';
import type { ApiClaimResponse, ApiDemoBill } from '@/api/types';

export function createDemoBill(restaurantId: string, billAmount: string) {
  return apiRequest<ApiDemoBill>('/bills/demo', {
    method: 'POST',
    body: JSON.stringify({ restaurant_id: restaurantId, bill_amount: billAmount }),
  });
}

export function claimBill(billId: string) {
  return apiRequest<ApiClaimResponse>(`/bills/${encodeURIComponent(billId)}/claim`, {
    method: 'POST',
  });
}
