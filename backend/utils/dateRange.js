export const parseDateBoundary = (value, endOfDay = false) => {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (dateOnly) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date;
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

export const buildDateRange = (startValue, endValue) => {
  const start = startValue ? parseDateBoundary(startValue) : null;
  const end = endValue ? parseDateBoundary(endValue, true) : null;
  if ((startValue && !start) || (endValue && !end)) return { error: 'Date range is invalid' };
  if (start && end && start > end) return { error: 'Start date must be on or before end date' };
  return { range: { ...(start && { $gte: start }), ...(end && { $lte: end }) } };
};
