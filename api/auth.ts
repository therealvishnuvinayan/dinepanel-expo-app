import { apiRequest } from '@/api/client';
import type { ApiUser } from '@/api/types';

export type VerifyOtpResponse = {
  access_token: string;
  token_type: 'bearer';
  user: ApiUser;
};

export function requestOtp(phone: string) {
  return apiRequest<{ message: string }>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, otp: string) {
  return apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
}

export function getMe() {
  return apiRequest<ApiUser>('/me');
}
