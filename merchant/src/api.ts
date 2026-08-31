import type {
  BillPage,
  ClaimCode,
  ClaimStatus,
  CreatedBill,
  Dashboard,
  MerchantBill,
  MerchantProfile,
} from "./types";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const TOKEN_KEY = "dinepanel.merchant.token";

export const getStoredToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const storeToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

interface ErrorBody {
  detail?: string | Array<{ msg?: string }>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const request = async <T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    const detail = Array.isArray(body.detail)
      ? body.detail.map((item) => item.msg).filter(Boolean).join(". ")
      : body.detail;
    throw new ApiError(response.status, detail || "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
};

export const api = {
  requestOtp: (phone: string) =>
    request<{ message: string }>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, otp: string) =>
    request<{ access_token: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    }),
  profile: (token: string) => request<MerchantProfile>("/merchant/me", {}, token),
  dashboard: (token: string, restaurantId: string) =>
    request<Dashboard>(`/merchant/restaurants/${restaurantId}/dashboard`, {}, token),
  bills: (token: string, restaurantId: string, claimStatus?: ClaimStatus) => {
    const query = claimStatus ? `?claim_status=${claimStatus}` : "";
    return request<BillPage>(`/merchant/restaurants/${restaurantId}/bills${query}`, {}, token);
  },
  createBill: (token: string, restaurantId: string, billNumber: string, billAmount: string) =>
    request<CreatedBill>(
      `/merchant/restaurants/${restaurantId}/bills`,
      { method: "POST", body: JSON.stringify({ bill_number: billNumber, bill_amount: billAmount }) },
      token,
    ),
  bill: (token: string, billId: string) => request<MerchantBill>(`/merchant/bills/${billId}`, {}, token),
  refreshClaim: (token: string, billId: string) =>
    request<ClaimCode>(`/merchant/bills/${billId}/refresh-claim-token`, { method: "POST" }, token),
};
