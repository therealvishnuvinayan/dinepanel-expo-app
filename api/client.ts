const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredUrl || 'http://localhost:8000').replace(/\/$/, '');

let accessToken: string | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

const knownMessages: Record<string, string> = {
  'Invalid verification code': 'That code is incorrect or has expired.',
  'OTP authentication is unavailable': 'Sign-in is temporarily unavailable. Please try again later.',
  'Please wait before requesting another code': 'Please wait before requesting another code.',
  'Too many code requests. Try again later': 'Too many code requests. Please try again later.',
  'Too many verification attempts. Try again later': 'Too many verification attempts. Please try again later.',
  'Claim code is invalid': 'This claim code could not be found.',
  'Claim code has expired': 'This claim code has expired.',
  'Claim code has already been used': 'This reward has already been claimed.',
  'Claim code is no longer active': 'This claim code is no longer active.',
  'Bill has already been claimed': 'This reward has already been claimed.',
  'Bill has been cancelled': 'This bill was cancelled and cannot be claimed.',
  'Restaurant is not currently active': 'This restaurant is not currently available.',
  'Restaurant not found': 'This restaurant is not available.',
  'Reward transaction not found': 'This reward activity is not available.',
};

function stringDetail(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('detail' in payload)) return null;
  return typeof payload.detail === 'string' ? payload.detail : null;
}

export function normalizeApiError(path: string, status: number, payload: unknown) {
  const detail = stringDetail(payload);
  if (detail && knownMessages[detail]) return knownMessages[detail];
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have access to this action.';
  if (status === 404 && path.startsWith('/claims/')) return 'This claim code could not be found.';
  if (status === 409 && path.startsWith('/claims/')) return 'This reward cannot be claimed again.';
  if (status === 410 && path.startsWith('/claims/')) return 'This claim code has expired.';
  if (status === 422) return 'Check the information entered and try again.';
  if (status === 429) return 'Please wait a moment before trying again.';
  if (status === 503 && path.startsWith('/auth/')) {
    return 'Sign-in is temporarily unavailable. Please try again later.';
  }
  return 'Something went wrong. Please try again.';
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const requestAccessToken = accessToken;
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (requestAccessToken) headers.set('Authorization', `Bearer ${requestAccessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      'DinePanel could not reach the server. Check the API address and your connection.',
      0,
    );
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload: unknown = isJson ? await response.json() : null;
  const requestId = response.headers.get('x-request-id');

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler && requestAccessToken === accessToken) {
      await unauthorizedHandler();
    }
    throw new ApiError(
      normalizeApiError(path, response.status, payload),
      response.status,
      requestId,
    );
  }

  return payload as T;
}
