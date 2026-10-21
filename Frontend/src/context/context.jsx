import { createContext, useState, useEffect, useContext, useCallback } from "react";
import API from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// eslint-disable-next-line react-refresh/only-export-components
export const GlobalContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalContext = () => {
    return useContext(GlobalContext);
}

const defaultPermissions = {
  canManageProducts: false,
  canCreateProduct: false,
  canManageCategories: false,
  canAccessExpenses: false,
  canAccessReports: false,
  canAccessSettings: false,
  canManagePremium: false,
  canViewPremium: false,
  canRecordSales: true,
  canRecordStockIn: true,
  canViewProducts: true,
};

const getEffectiveRole = (user) => {
  if (!user) return "manager";
  if (user.role === "admin") return "manager";
  if (user.role) return user.role;
  if (user.isAdmin === false) return "salesperson";
  return "manager";
};

const buildPermissionsFromRole = (role) => {
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

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start as true to prevent UI flicker
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'white';
    }
    return 'white';
  });

  const toggleSidebar = () => setSidebarOpen((s) => !s);
  const toggleTheme = () => setTheme((t) => t === 'white' ? 'dark' : 'white');
  const openPalette = () => setIsPaletteOpen(true);
  const closePalette = () => setIsPaletteOpen(false);

  const navigate = useNavigate();

  const logout = useCallback(() => {
    const isPlatformOwner = window.location.pathname.startsWith('/admin');
    localStorage.removeItem("token");
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    navigate(isPlatformOwner ? '/admin/login' : '/login');
  }, [navigate]);

  //create reusable profile fetch functions

  const fetchUserProfile = useCallback(async () =>{
    const res = await API.get('/users/profile');
    setUser(res.data);
    return res.data;
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          await fetchUserProfile();
        } catch {
          // Invalid token, log them out
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [fetchUserProfile, logout]);

  useEffect(() => {
    document.documentElement.classList.remove('theme-white', 'theme-blue', 'theme-blue-black', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const Register = async (formData) => {
    setLoading(true);
    try {
      await API.post('/users/register', formData);
      toast.success("Registration successful");
      setLoading(false);
      navigate('/login');
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || "Registration failed";
      toast.error(message);
      throw error; // Re-throw to be caught in the component
    }
  };

  const Login = async (formData) => {
    setLoading(true);
    try {
      const res = await API.post('/users/login', formData);
      const { token: userToken } = res.data;
      
      localStorage.removeItem("token");
      delete API.defaults.headers.common['Authorization'];
      localStorage.setItem("token", userToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

      // The login response already contains the authenticated profile. Use it
      // directly so a profile refresh failure cannot strand a valid login.
      setUser(res.data.user);
      toast.success("Login successful");
      setLoading(false);
      navigate(res.data?.user?.role === 'superadmin' ? '/admin' : '/');

    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || "Login failed";
      toast.error(message);
      throw error; // Re-throw to be caught in the component
    }
  };

  //get user profile and update user state with the latest info from the backend to display in the profile page


  // Settings APIs
  const updateProfile = async (data) => {
    const res = await API.put('/users/profile', data);
     await fetchUserProfile(); // Refresh user data after profile update
     toast.success("Profile updated successfully");
    return res;
  };

  const changePassword = async (data) => {
    return API.put('/users/change-password', data);
  };

    //Dashboard Data one by one

    const getProducts = (params = {}) => API.get("/products", { params });
    const createProduct = async (data) =>{ 
      const res = await API.post("/products", data);
      await fetchUserProfile(); // Refresh user data after product creation to update product count in profile
      return res;
    }
    const analyzeProductImage = (file) => {
      const body = new FormData();
      body.append('image', file);
      return API.post('/products/snap-to-add', body, { headers: { 'Content-Type': 'multipart/form-data' } });
    };
    const deleteProduct = async (id) => {
      const res = await API.delete(`/products/${id}`);
      await fetchUserProfile();
      return res;
    };

    const getCategories = (params = {}) => API.get("/categories", { params });
    const createCategory = (data) => API.post("/categories", data);
    const createSalesperson = (data) => API.post("/users/salespeople", data);
    const getSalespeople = () => API.get("/users/salespeople");

    // Sales API
    const createSale = (data) => API.post('/sales/createSale', data);
    const getSales = (params = {}) => API.get('/sales/getAllSales', { params });
    const getSalesPerDay = (params = {}) => API.get('/sales/sales-per-day', { params });
    const getMonthlyProfit = (params = {}) => API.get('/analytics/monthly-profit', { params });
    const getDashboardOverview = (params = {}) => API.get('/dashboard/overview', { params });
    const getReports = (params = {}) => API.get('/reports', { params });
    const initializeSubscription = (plan) => API.post('/subscriptions/initialize', { plan });
    const verifySubscription = (reference) => API.post('/subscriptions/verify', { reference });
    const getAdminOverview = useCallback(() => API.get('/admin/overview'), []);
    // Purchases API
    const createPurchase = (data) => API.post('/purchases/addPurchase', data);
    const getPurchases = (params = {}) => API.get('/purchases/getAllPurchases', { params });
    const getProductsDropdown = (params = {}) => API.get('/purchases/getProductsDropdown', { params });
    // Expenses API
    const createExpense = (data) => API.post('/expenses/addExpense', data);
    const getExpenses = (params = {}) => API.get('/expenses/getAllExpenses', { params });
    const deleteExpense = (id) => API.delete(`/expenses/delete/${id}`);
    const getExpensesSummary = (params = {}) => API.get('/expenses/summary', { params });

    
    


     const [dashboardMetrics, setDashboardMetrics] = useState({
    totalSalesToday: 0,
    totalPurchasesToday: 0,
    totalProfitToday: 0,
    lowStockCount: 0,
    totalProducts: 0,
});
    const fetchDashboardMetrics = async () => {
  try {
    const [sales, purchases, profit, lowStock, totalProducts] = await Promise.all([
      API.get("/dashboard/sales/today"),
      API.get("/dashboard/purchases/today"),
      API.get("/dashboard/profit/today"),
      API.get("/dashboard/inventory/low-stock"),
      API.get("/dashboard/products/total"),
    ]);

    setDashboardMetrics({
      totalSalesToday: sales.data.totalSalesToday,
      totalPurchasesToday: purchases.data.totalPurchasesToday,
      totalProfitToday: profit.data.totalProfitToday,
      lowStockCount: lowStock.data.lowStockCount,
      totalProducts: totalProducts.data.totalProducts,
    });
  } catch (error) {
    console.log(error);
  }
};

  const role = getEffectiveRole(user);
  const permissions = user?.permissions || buildPermissionsFromRole(role) || defaultPermissions;
  const isAdmin = role === "manager";
  const isSalesperson = role === "salesperson";
  const isSuperAdmin = Boolean(user?.isSuperAdmin);

  const value = {
    user,
    isSuperAdmin,
    loading,
    role,
    isAdmin,
    isSalesperson,
    permissions,
    Register,
    Login,
    logout,
    updateProfile,
    fetchUserProfile,
    changePassword,
    dashboardMetrics,
    fetchDashboardMetrics,
    getProducts,
    createProduct,
    analyzeProductImage,
    deleteProduct,
    getCategories,
    createCategory,
    createSalesperson,
    getSalespeople,
    createSale,
    	getSales,
    	getSalesPerDay,
    getMonthlyProfit,
    getDashboardOverview,
    getReports,
    initializeSubscription,
    verifySubscription,
    getAdminOverview,
    // Expenses
    createExpense,
    getExpenses,
    deleteExpense,
    getExpensesSummary,
    // Purchases API
    createPurchase,
    getPurchases,
    getProductsDropdown,
    // theme controls
    theme,
    toggleTheme,
    sidebarOpen,
    toggleSidebar,
    isPaletteOpen,
    openPalette,
    closePalette,
  };

  return (
      <GlobalContext.Provider value={value}>
        {children}
      </GlobalContext.Provider>
  );
};
