import { Platform } from 'react-native';

import { parseClaimToken } from '@/utils/claimUrl';

const PENDING_CLAIM_KEY = 'dinepanel.pending-claim-token';

function validatedToken(value: string | null) {
  if (!value) return null;
  try {
    return parseClaimToken(value, true);
  } catch {
    return null;
  }
}

export async function getPendingClaimToken() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    const stored = window.sessionStorage.getItem(PENDING_CLAIM_KEY);
    const token = validatedToken(stored);
    if (stored && !token) window.sessionStorage.removeItem(PENDING_CLAIM_KEY);
    return token;
  }
  const SecureStore = await import('expo-secure-store');
  const stored = await SecureStore.getItemAsync(PENDING_CLAIM_KEY);
  const token = validatedToken(stored);
  if (stored && !token) await SecureStore.deleteItemAsync(PENDING_CLAIM_KEY);
  return token;
}

export async function storePendingClaimToken(value: string) {
  const token = parseClaimToken(value, true);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(PENDING_CLAIM_KEY, token);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(PENDING_CLAIM_KEY, token);
}

export async function clearPendingClaimToken() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(PENDING_CLAIM_KEY);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(PENDING_CLAIM_KEY);
}
