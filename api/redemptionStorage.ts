import { Platform } from 'react-native';

const REDEMPTION_KEY = 'dinepanel.active-redemption';
const PAYLOAD_PREFIX = 'dinepanel://rewards/redeem/';

export type StoredRewardRedemption = {
  id: string;
  qrPayload: string;
};

function parseStored(value: string | null): StoredRewardRedemption | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredRewardRedemption>;
    if (
      typeof parsed.id !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(parsed.id)
      || typeof parsed.qrPayload !== 'string'
      || !parsed.qrPayload.startsWith(PAYLOAD_PREFIX)
      || parsed.qrPayload.length > 300
    ) return null;
    return { id: parsed.id, qrPayload: parsed.qrPayload };
  } catch {
    return null;
  }
}

async function removeStoredValue() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(REDEMPTION_KEY);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(REDEMPTION_KEY);
}

export async function getStoredRewardRedemption() {
  let stored: string | null = null;
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') stored = window.sessionStorage.getItem(REDEMPTION_KEY);
  } else {
    const SecureStore = await import('expo-secure-store');
    stored = await SecureStore.getItemAsync(REDEMPTION_KEY);
  }
  const parsed = parseStored(stored);
  if (stored && !parsed) await removeStoredValue();
  return parsed;
}

export async function storeRewardRedemption(value: StoredRewardRedemption) {
  const serialized = JSON.stringify(value);
  if (!parseStored(serialized)) throw new Error('Reward code could not be stored safely.');
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(REDEMPTION_KEY, serialized);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(REDEMPTION_KEY, serialized);
}

export const clearStoredRewardRedemption = removeStoredValue;
