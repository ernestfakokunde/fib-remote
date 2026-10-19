export const formatCurrency = (value) => {
  const num = value === undefined || value === null || value === '' ? 0 : Number(value);
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (value) => {
  const num = value === undefined || value === null || value === '' ? 0 : Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : '—';
};

export const localDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const localDateBoundary = (day, endOfDay = false) => {
  const [year, month, date] = String(day).split('-').map(Number);
  const boundary = new Date(year, month - 1, date, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return boundary.toISOString();
};
