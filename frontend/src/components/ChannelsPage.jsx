import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader"; // Импортируем ClipLoader
import "react-toastify/dist/ReactToastify.css";
import { FaCopy, FaAngleRight, FaTrashAlt, FaPlus } from "react-icons/fa";

const ChannelsPage = () => {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [loading, setLoading] = useState(false); // Состояние для отслеживания загрузки
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      // Получаем токен из куки
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("Токен отсутствует");
      }

      // Формируем URL с токеном
      const url = `http://127.0.0.1:5000/api/check_auth/?token=${token}`;

      // Отправляем GET-запрос
      const response = await fetch(url, {
        method: "GET",
        credentials: "include", // Отправляем куки, если требуется
      });

      if (!response.ok) {
        throw new Error("Неавторизован");
      }

      const data = await response.json();

      if (data.message !== "Authenticated") {
        throw new Error("Неавторизован");
      }
    } catch (error) {
      console.error(error.message || "Ошибка авторизации");
      navigate("/login"); // Перенаправляем на страницу логина
    }
  };

  // Функция для получения комнат текущего пользователя с сервера
  const fetchUserChannels = async () => {
    setLoading(true); // Включаем индикатор загрузки
    try {
      const response = await fetch("http://localhost:5000/api/rooms/user", {
        method: "GET",
        credentials: "include", // Указываем, что куки должны быть отправлены
      });

      if (!response.ok) {
        throw new Error("Не удалось загрузить комнаты.");
      }

      const data = await response.json();
      setChannels(data); // Устанавливаем комнаты в состояние
    } catch (error) {
      console.log(error.message || "Не удалось загрузить комнаты.");
    } finally {
      setLoading(false); // Останавливаем индикатор загрузки
    }
  };

  useEffect(() => {
    checkAuth();
    fetchUserChannels(); // Получаем комнаты при монтировании компонента
  }, []);

  // Функция для создания новой комнаты
  const handleCreateChannel = async () => {
    if (newChannelName.trim()) {
      setLoading(true); // Включаем индикатор загрузки
      try {
        const response = await fetch("http://localhost:5000/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ room_name: newChannelName }),
          credentials: "include", // Отправляем куки, если они нужны для авторизации
        });

        if (!response.ok) {
          throw new Error("Не удалось создать комнату.");
        }

        const data = await response.json(); // Получаем данные о комнате
        console.log("Ответ от сервера:", data); // Логируем данные

        const newChannel = {
          room_id: data.room_id, // Используем room_id из ответа
          room_name: data.room_name,
        };

        setChannels((prevChannels) => {
          const newChannel = {
            room_uuid: data.room_id, // Обязательно используйте room_id
            room_name: data.room_name,
          };

          const updatedChannels = [...prevChannels, newChannel];
          console.log("Обновленное состояние каналов:", updatedChannels); // Логируем обновленное состояние
          return updatedChannels;
        });

        setNewChannelName(""); // Очищаем поле ввода
        toast.success("Комната успешно создана!");
      } catch (error) {
        toast.error(error.message || "Не удалось создать комнату.");
      } finally {
        setLoading(false); // Останавливаем индикатор загрузки
      }
    } else {
      toast.error("Введите имя комнаты!");
    }
  };

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
  };

  const handleCopyLink = (room_id) => {
    if (!room_id) {
      console.error("Комната не имеет room_id!");
      return;
    }
    console.log("Комната ID при копировании:", room_id);
    const link = `${window.location.origin}/channel/${room_id}`;
    navigator.clipboard.writeText(link);
    toast.success("Ссылка на комнату скопирована!");
  };

  const handleJoinChannel = (uuid) => {
    navigate(`/channel/${uuid}`);
  };

  const handleDeleteChannel = async (uuid) => {
    setLoading(true); // Включаем индикатор загрузки
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/${uuid}`, {
        method: "DELETE",
        credentials: "include", // Отправляем куки, если они нужны для авторизации
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить комнату.");
      }

      const data = await response.json();
      if (data.message === "deleted") {
        // Если комната успешно удалена
        const updatedChannels = channels.filter(
          (channel) => channel.room_uuid !== uuid
        ); // Фильтруем по room_uuid, чтобы удалить комнату из списка
        setChannels(updatedChannels); // Обновляем список каналов
        setSelectedChannel(null); // Снимаем выбор с текущей комнаты
        toast.success("Комната успешно удалена!"); // Показываем уведомление
      }
    } catch (error) {
      toast.error(error.message || "Не удалось удалить комнату.");
    } finally {
      setLoading(false); // Останавливаем индикатор загрузки
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white">
      <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 w-3/4 md:w-1/2">
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          Комнаты
        </h2>
        <div className="flex">
          {/* Левая колонка с каналами */}
          <div className="w-1/3 pr-4">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-gray-700">
                Мои комнаты
              </h1>
              <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-100">
                {channels.length === 0 ? (
                  <div className="text-center text-gray-500">
                    Создайте новую комнату
                  </div>
                ) : (
                  channels.map((channel) => (
                    <div
                      key={channel.room_uuid}
                      onClick={() => handleSelectChannel(channel)}
                      className={`cursor-pointer p-3 rounded-xl mb-2 transition-colors duration-300 ${
                        selectedChannel?.room_uuid === channel.room_uuid
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-50 text-black hover:bg-gray-100"
                      }`}
                    >
                      {channel.room_name}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="p-2 w-full text-gray-500 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0 focus:ring-offset-0 focus:outline-none"
                  placeholder="Название комнаты"
                />
                <button
                  onClick={handleCreateChannel}
                  className="mt-2 w-full bg-indigo-600 font-medium text-white p-3 rounded-xl hover:bg-indigo-500 transition duration-300 hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <ClipLoader size={20} color="white" />
                  ) : (
                    <>
                      <FaPlus className="h-4 w-4" />
                      <span>Создать комнату</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Правая колонка с анимацией */}
          <div className="w-2/3 pl-4">
            <div
              className={`transition-all duration-300 ease-in-out transform ${
                selectedChannel
                  ? "opacity-100 translate-x-0"
                  : "opacity-100 -translate-x-10"
              }`}
            >
              {channels.length === 0 ? (
                <div className="flex justify-center items-center text-center h-full">
                  <p className="text-gray-500 text-lg font-medium max-w-md mx-auto">
                    У вас отсутствуют комнаты. Вступите в комнату друзей по
                    ссылке или создайте собственную для общения и делитесь ей с
                    друзьями.
                  </p>
                </div>
              ) : selectedChannel ? (
                <div>
                  <h3 className="text-2xl text-gray-700 font-bold mb-4">
                    {selectedChannel.room_name}
                    <button
                      onClick={() => handleCopyLink(selectedChannel.room_uuid)}
                      className="ml-2 bg-transparent text-indigo-500 hover:text-indigo-400 text-2xl transform transition-all duration-300 ease-in-out hover:scale-110"
                    >
                      <FaCopy />
                    </button>
                  </h3>
                  <div className="mb-4">
                    <button
                      className="w-full bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-500 transition duration-300 hover:shadow-lg flex items-center justify-center space-x-2 mb-1"
                      onClick={() =>
                        handleJoinChannel(selectedChannel.room_uuid)
                      }
                    >
                      <FaAngleRight className="text-white w-5 h-5 text-2xl" />
                      <span>Зайти в комнату</span>
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteChannel(selectedChannel.room_uuid)
                      }
                      className="w-full bg-red-500 text-white p-3 rounded-xl hover:bg-red-400 transition duration-300 hover:shadow-lg flex items-center justify-center space-x-2"
                    >
                      <FaTrashAlt className="text-white w-4 h-4 text-2xl" />
                      <span>Удалить</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center text-center h-full">
                  <p className="text-gray-500 text-lg font-medium max-w-md mx-auto">
                    Выберите комнату для общения
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ChannelsPage;
