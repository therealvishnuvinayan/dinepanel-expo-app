import { apiRequest } from '@/api/client';
import type { ApiRestaurant } from '@/api/types';

export function getRestaurants() {
  return apiRequest<ApiRestaurant[]>('/restaurants');
}

export function getRestaurant(id: string) {
  return apiRequest<ApiRestaurant>(`/restaurants/${encodeURIComponent(id)}`);
}
