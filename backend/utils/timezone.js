export const resolveTimeZone = (value) => {
  if (typeof value !== 'string' || value.length > 80) return 'UTC';
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};
