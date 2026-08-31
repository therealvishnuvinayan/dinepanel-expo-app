import { apiRequest } from '@/api/client';
import type { ApiClaimPreviewResponse, ApiTokenClaimResponse } from '@/api/types';

export function previewClaim(token: string) {
  return apiRequest<ApiClaimPreviewResponse>('/claims/preview', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function claimToken(token: string) {
  return apiRequest<ApiTokenClaimResponse>('/claims/claim', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
