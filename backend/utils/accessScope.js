export const getWorkspaceOwnerId = (user) => {
  if (!user) return null;
  if (user.role === "salesperson" && user.ownerAdmin) {
    return user.ownerAdmin;
  }
  return user._id || user.id || null;
};

export const PLAN_ENTITLEMENTS = {
  free: { products: 20, team: 5, snapsPerDay: 0, introPriceUsd: 0, regularPriceUsd: 0 },
  pro: { products: 150, team: 20, snapsPerDay: 50, introPriceUsd: 3.5, regularPriceUsd: 5 },
  enterprise: { products: null, team: null, snapsPerDay: 50, introPriceUsd: 7, regularPriceUsd: 9 },
};

export const getPlanEntitlements = (plan) => PLAN_ENTITLEMENTS[plan] || PLAN_ENTITLEMENTS.free;
export const getProductLimit = (plan) => getPlanEntitlements(plan).products;

export const buildPermissions = (role) => {
  const normalizedRole = role === "admin" ? "manager" : role;
  const isManager = normalizedRole === "manager";

  return {
    canManageProducts: isManager,
    canCreateProduct: isManager,
    canManageCategories: isManager,
    canAccessExpenses: isManager,
    canAccessReports: isManager,
    canAccessSettings: isManager,
    canManagePremium: isManager,
    canViewPremium: isManager,
    canRecordSales: true,
    canRecordStockIn: true,
    canViewProducts: true,
  };
};
