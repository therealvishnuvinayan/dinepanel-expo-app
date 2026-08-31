export const formatAed = (value: string | number): string => {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const formatDateTime = (value: string): string =>
  new Intl.DateTimeFormat("en-AE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const secondsRemaining = (expiresAt: string, now = Date.now()): number =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
