import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("auth_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token && !user) {
      api
        .get("/user")
        .then((res) => {
          setUser(res.data);
          localStorage.setItem("auth_user", JSON.stringify(res.data));
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/login", { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    setUser(userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      // Abaikan jika token kadaluwarsa
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setUser(null);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
