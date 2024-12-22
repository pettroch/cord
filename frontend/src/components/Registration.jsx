import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClipLoader from "react-spinners/ClipLoader"; // Импортируем лоадер

const RegistrationPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); // Состояние для показа модального окна
  const [isRedirecting, setIsRedirecting] = useState(false); // Состояние для управления редиректом
  const navigate = useNavigate();

  // Регулярное выражение для проверки имени пользователя
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;

  // Регулярное выражение для проверки пароля
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  // Проверка, авторизован ли пользователь
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
    if (!username || !password || !confirmPassword) {
      return; // Просто выходим, если поля пустые, без тостов
    }

    // Проверка на соответствие имени пользователя правилам
    if (!usernameRegex.test(username)) {
      toast.error("Имя пользователя может содержать a-z, A-Z, 0-9 . _ -");
      return;
    }

    // Проверка на совпадение паролей
    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают!");
      return;
    }

    // Проверка на соответствие пароля правилам
    if (!passwordRegex.test(password)) {
      toast.error(
        "Пароль должен быть минимум 8 символов и содержать одну прописную букву, одну заглавную, цифу"
      );
      return;
    }

    // Устанавливаем состояние загрузки в true и показываем модальное окно
    setLoading(true);
    setShowModal(true);

    try {
      // Отправляем пароль в незашифрованном виде на сервер
      const response = await fetch("https://petrocord.ru:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password, // Отправляем пароль в открытом виде
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // После успешной регистрации сразу выполняем редирект
        setIsRedirecting(true); // Устанавливаем флаг для редиректа
        console.log(data);
      } else {
        setShowModal(false); // Скрываем модальное окно, если что-то пошло не так
        toast.error(data.detail || "Ошибка регистрации");
      }
    } catch (error) {
      setShowModal(false); // Скрываем модальное окно в случае ошибки
      toast.error("Произошла ошибка при отправке данных");
    } finally {
      setLoading(false);
    }
  };

  // Выполняем редирект, когда флаг isRedirecting равен true
  if (isRedirecting) {
    navigate("/login"); // Перенаправление на страницу входа
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white text-center py-12 px-4">
      {/* Модальное окно с лоадером */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center justify-center">
            <ClipLoader size={50} color={"#4F46E5"} loading={loading} />
          </div>
        </div>
      )}

      <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-indigo-500 mb-6">
          Регистрация на PetroCord
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле ввода имени с фиксированным @ */}
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black hover:bg-gray-100 transition duration-300"
                placeholder="Введите пароль"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12c0 3.866-3.134 7-7 7s-7-3.134-7-7 3.134-7 7-7 7 3.134 7 7zm0 0l4.243-4.243M19 5l-4.243 4.243"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.724 7.632 5 12 5c4.368 0 8.268 2.724 9.542 7-1.274 4.276-5.174 7-9.542 7-4.368 0-8.268-2.724-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Поле ввода подтверждения пароля */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-lg text-gray-700"
            >
              Подтверждение пароля
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black hover:bg-gray-100 transition duration-300"
              placeholder="Подтвердите пароль"
            />
          </div>

          {/* Кнопка регистрации */}
          <div className="mt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white p-3 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            >
              {loading ? (
                <ClipLoader size={24} color={"#fff"} loading={loading} />
              ) : (
                "Зарегистрироваться"
              )}
            </button>
          </div>

          {/* Ссылка на страницу входа */}
          <div className="mt-4">
            <p className="text-gray-700">
              Уже есть аккаунт?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-500 font-semibold transition-all duration-300"
              >
                Войти
              </Link>
            </p>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default RegistrationPage;
