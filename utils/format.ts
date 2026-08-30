export const formatAED = (amount: number, withCurrency = true) => {
  const formatted = amount.toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return withCurrency ? `AED ${formatted}` : formatted;
};

