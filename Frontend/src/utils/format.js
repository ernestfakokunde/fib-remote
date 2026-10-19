export const formatCurrency = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
};

export const formatNumber = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString();
};
