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

    //Dashboard Data one by one

    const getProducts = () => {
      return API.get("/products")
    }

    const createProduct = (data)=>{
     return API.post('/products', data)
    }


     const [dashboardMetrics, setDashboardMetrics] = useState({
    totalSalesToday: 0,
    totalPurchasesToday: 0,
    totalProfitToday: 0,
    lowStockCount: 0,
});
    const fetchDashboardMetrics = async () => {
  try {
    const [sales, purchases, profit, lowStock] = await Promise.all([
      API.get("/dashboard/sales/today"),
      API.get("/dashboard/purchases/today"),
      API.get("/dashboard/profit/today"),
      API.get("/dashboard/inventory/low-stock"),
    ]);

    setDashboardMetrics({
      totalSalesToday: sales.data.totalSalesToday,
      totalPurchasesToday: purchases.data.totalPurchasesToday,
      totalProfitToday: profit.data.totalProfitToday,
      lowStockCount: lowStock.data.lowStockCount,
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
    dashboardMetrics,
    fetchDashboardMetrics,
    getProducts,
    createProduct
  };

  return (
      <GlobalContext.Provider value={value}>
        {children}
      </GlobalContext.Provider>
  );
};