import { createContext, useState, useEffect, useContext } from "react";
import API from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const GlobalContext = createContext();

export const useGlobalContext = () => {
    return useContext(GlobalContext);
}

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start as true to prevent UI flicker
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await API.get('/users/profile');
          setUser(res.data);
        } catch (error) {
          // Invalid token, log them out
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

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
      const { user: userData, token: userToken } = res.data;
      
      localStorage.setItem("token", userToken);
      API.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      
      setUser(userData);
      toast.success("Login successful");
      setLoading(false);
      navigate('/');
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || "Login failed";
      toast.error(message);
      throw error; // Re-throw to be caught in the component
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
  };

  // Settings APIs
  const updateProfile = async (data) => {
    const res = await API.put('/users/profile', data);
    const updatedUser = res.data?.user;
    if (updatedUser) {
      setUser(updatedUser);
    }
    return res;
  };

  const changePassword = async (data) => {
    return API.put('/users/change-password', data);
  };

    //Dashboard Data one by one

    const getProducts = (params = {}) => API.get("/products", { params });
    const createProduct = (data) => API.post("/products", data);
    const getCategories = (params = {}) => API.get("/categories", { params });
    const createCategory = (data) => API.post("/categories", data);

    // Sales API
    const createSale = (data) => API.post('/sales/createSale', data);
    const getSales = (params = {}) => API.get('/sales/getAllSales', { params });
    const getSalesPerDay = (params = {}) => API.get('/sales/sales-per-day', { params });
    const getMonthlyProfit = (params = {}) => API.get('/analytics/monthly-profit', { params });
    const getReports = (params = {}) => API.get('/reports', { params });
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


  const value = {
    user,
    loading,
    Register,
    Login,
    logout,
    updateProfile,
    changePassword,
    dashboardMetrics,
    fetchDashboardMetrics,
    getProducts,
    createProduct,
    getCategories,
    createCategory,
    createSale,
    	getSales,
    	getSalesPerDay,
    getMonthlyProfit,
    getReports,
    // Expenses
    createExpense,
    getExpenses,
    deleteExpense,
    getExpensesSummary,
    // Purchases API
    createPurchase,
    getPurchases,
    getProductsDropdown,
    // sidebar controls
    sidebarOpen,
    toggleSidebar,
  };

  return (
      <GlobalContext.Provider value={value}>
        {children}
      </GlobalContext.Provider>
  );
};