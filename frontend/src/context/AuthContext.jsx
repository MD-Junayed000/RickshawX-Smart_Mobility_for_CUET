import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearToken, getToken, setToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check login status on app load
  const fetchProfile = async (token) => {
    const res = await apiFetch("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load profile");
    }
    return data.user;
  };

  const setSession = (token, userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setToken(token);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("user", JSON.stringify(userData));
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const bootstrap = async () => {
      try {
        const profile = await fetchProfile(token);
        setSession(token, profile);
      } catch (error) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setIsLoggedIn(true);
          setUser(JSON.parse(storedUser));
          return;
        }
        clearToken();
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
      }
    };

    bootstrap();
  }, []);

  const login = async (token, fallbackUser) => {
    const profile = await fetchProfile(token).catch(() => fallbackUser);
    setSession(token, profile);
    navigate("/dashboard");
  };

  const register = async (token, fallbackUser) => {
    const profile = await fetchProfile(token).catch(() => fallbackUser);
    setSession(token, profile);
    navigate("/dashboard");
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    clearToken();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
