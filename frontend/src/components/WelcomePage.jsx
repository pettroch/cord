import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const WelcomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token="));
    if (token) {
      setIsAuthenticated(true); // Если токен есть, перенаправляем на главную страницу
    }
  }, [navigate]);

  const handleStartChat = () => {
    // Если пользователь авторизован, перенаправляем на страницу /channels
    navigate("/channels");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white text-center py-12 px-4">
      <h1 className="text-5xl font-bold mb-4">Добро пожаловать в PetroCord!</h1>
      <p className="text-lg mb-6">
        Здесь вы можете общаться с друзьями, обмениваться сообщениями, делиться
        моментами и всегда быть на связи.
      </p>
      <p className="text-lg mb-6">
        Зарегистрируйтесь, чтобы стать частью сообщества, или войдите, если у
        вас уже есть аккаунт.
      </p>

      <div className="space-x-4">
        {isAuthenticated ? (
          // Если пользователь авторизован, показываем кнопку для перехода в чат
          <button
            onClick={handleStartChat}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Приступить к общению
          </button>
        ) : (
          <>
            {/* Кнопки для перехода на страницы регистрации и входа */}
            <Link
              to="/registration"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Зарегистрироваться
            </Link>
            <Link
              to="/login"
              className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Войти
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default WelcomePage;
