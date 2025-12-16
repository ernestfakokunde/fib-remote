export const formatCurrency = (value) => {
  const num = Number(value || 0);
  return `NGN ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatNumber = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString();
};
