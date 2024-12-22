import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "./AuthContext"; // Импортируем useAuth

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Для редиректа после успешного входа
  const { login } = useAuth(); // Используем хук для получения функции login

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="));
    if (token) {
      navigate("/"); // Если токен есть, перенаправляем на главную страницу
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Проверка на пустые поля
    if (!username || !password) {
      toast.error("Пожалуйста, заполните все поля!");
      return;
    }

    setLoading(true); // Включаем загрузку

    try {
      // Отправка данных на сервер
      const response = await fetch("https://petrocord.ru:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Успешный вход, сохраняем токен в cookies или локальное хранилище
        toast.success("Вход успешен!");

        // Используем функцию login из контекста
        login(username, data.access_token); // Передаем токен

        // Перенаправляем пользователя на главную страницу
        navigate("/");
      } else {
        toast.error(data.detail || "Ошибка входа");
      }
    } catch (error) {
      toast.error("Произошла ошибка при входе");
    } finally {
      setLoading(false); // Отключаем загрузку
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white text-center py-12 px-4">
      <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-indigo-500 mb-6">
          Вход в PetroCord
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле ввода имени пользователя */}
          <div>
            <label htmlFor="username" className="block text-lg text-gray-700">
              Имя пользователя
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                @
              </span>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black hover:bg-gray-100 transition duration-300"
                placeholder="Введите ваше имя"
              />
            </div>
          </div>

          {/* Поле ввода пароля */}
          <div>
            <label htmlFor="password" className="block text-lg text-gray-700">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black hover:bg-gray-100 transition duration-300"
              placeholder="Введите пароль"
            />
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            disabled={loading} // Делаем кнопку неактивной во время загрузки
          >
            {loading ? "Загрузка..." : "Войти"}
          </button>
        </form>

        <p className="mt-4 text-center text-lg text-gray-600">
          Нет аккаунта?{" "}
          <Link
            to="/registration"
            className="text-indigo-600 hover:text-indigo-500 font-semibold transition-all duration-300"
          >
            Зарегистрируйтесь
          </Link>
        </p>
      </div>

      {/* Инициализация компонента для отображения уведомлений */}
      <ToastContainer />
    </div>
  );
};

export default LoginPage;
