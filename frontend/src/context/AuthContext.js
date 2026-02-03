import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("foodnova_token"));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("foodnova_token");
      if (storedToken) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (response.data.user_type === "customer") {
            setCustomer(response.data.user);
          } else if (response.data.user_type === "admin") {
            setAdmin(response.data.user);
          }
          setToken(storedToken);
        } catch (error) {
          console.error("Auth init error:", error);
          localStorage.removeItem("foodnova_token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const sendOtp = async (phone) => {
    const response = await axios.post(`${API}/auth/send-otp`, { phone });
    return response.data;
  };

  const verifyOtp = async (phone, otp) => {
    const response = await axios.post(`${API}/auth/verify-otp`, { phone, otp });
    const { token: newToken, customer: customerData } = response.data;
    localStorage.setItem("foodnova_token", newToken);
    setToken(newToken);
    setCustomer(customerData);
    return customerData;
  };

  const adminLogin = async (email, password) => {
    const response = await axios.post(`${API}/auth/admin/login`, { email, password });
    const { token: newToken, admin: adminData } = response.data;
    localStorage.setItem("foodnova_token", newToken);
    setToken(newToken);
    setAdmin(adminData);
    return adminData;
  };

  const logout = () => {
    localStorage.removeItem("foodnova_token");
    setToken(null);
    setCustomer(null);
    setAdmin(null);
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{
      customer,
      admin,
      token,
      loading,
      isAuthenticated: !!token,
      isCustomer: !!customer,
      isAdmin: !!admin,
      sendOtp,
      verifyOtp,
      adminLogin,
      logout,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
