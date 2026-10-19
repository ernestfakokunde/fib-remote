export const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const isValidMoney = (value) =>
  Number.isFinite(value) && Number.isSafeInteger(Math.round(value * 100));

export const isPositiveWholeQuantity = (value) =>
  Number.isSafeInteger(value) && value > 0;
