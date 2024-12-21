import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Импортируем хук для работы с контекстом
import { FaDiscord } from "react-icons/fa"; // Импортируем иконку Discord

const Header = () => {
  const { isAuthenticated, userName, logout } = useAuth(); // Получаем состояние и функции из контекста
  const navigate = useNavigate();

  // Логаут пользователя
  const handleLogout = () => {
    logout(); // Вызов функции логаута из контекста
    navigate("/"); // Перенаправление на страницу входа
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-700 text-white">
      {/* Переносим "PetroCord" вправо и добавляем активность */}
      <h1
        onClick={() => navigate("/")}
        className="ml-48 text-2xl font-bold cursor-pointer transform transition-all duration-300 hover:text-indigo-300 hover:scale-105 flex items-center"
      >
        {/* Иконка перед текстом */}
        <FaDiscord className="mr-2 text-3xl" /> {/* Иконка Discord */}
        PetroCord
      </h1>

      <div>
        {isAuthenticated ? (
          <div className="flex items-center">
            <span className="mr-4 font-semibold">{userName}</span>
            <button
              onClick={handleLogout}
              className="bg-purple-600 hover:bg-purple-500 transition duration-300 hover:shadow-lg text-white px-4 py-2 rounded-xl"
            >
              Выйти
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <Link
              to="/login"
              className="mr-4 text-zinc-100 hover:text-zinc-200 transition-all duration-300 ease-in-out transform"
            >
              Войти
            </Link>
            <Link
              to="/registration"
              className="mr-4 text-zinc-100 hover:text-zinc-200 transition-all duration-300 ease-in-out transform"
            >
              Зарегистрироваться
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
