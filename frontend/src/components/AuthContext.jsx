import React, { createContext, useState, useContext, useEffect } from "react";

// Создаем контекст
const AuthContext = createContext();

// Поставщик контекста
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="));
    if (token) {
      const username = localStorage.getItem("userName");
      setIsAuthenticated(true);
      setUserName(username);
    }
  }, []);

  // Функция для логина
  const login = (username, token) => {
    localStorage.setItem("userName", username);
    document.cookie = `access_token=${token}; path=/`; // Записываем реальный токен
    setIsAuthenticated(true);
    setUserName(username);
  };

  const logout = () => {
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
    setUserName("");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = () => useContext(AuthContext);
