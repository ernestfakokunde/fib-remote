export const getWorkspaceOwnerId = (user) => {
  if (!user) return null;
  if (user.role === "salesperson" && user.ownerAdmin) {
    return user.ownerAdmin;
  }
  return user._id || user.id || null;
};

export const getProductLimit = (plan) => {
  if (plan === "free") return 20;
  if (plan === "pro") return 100;
  if (plan === "enterprise") return null;
  return 20;
};

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
    canViewPremium: true,
    canRecordSales: true,
    canRecordStockIn: true,
    canViewProducts: true,
  };
};
