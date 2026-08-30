import { apiRequest } from '@/api/client';
import type { ApiRewardTransaction } from '@/api/types';

export function getRewardBalance() {
  return apiRequest<{ balance: string; currency: 'AED' }>('/rewards/balance');
}

export function getRewardTransactions() {
  return apiRequest<ApiRewardTransaction[]>('/rewards/transactions');
}

export function getRewardTransaction(id: string) {
  return apiRequest<ApiRewardTransaction>(`/rewards/transactions/${encodeURIComponent(id)}`);
}
