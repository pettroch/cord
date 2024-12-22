import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCopy } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import useWebRTC, { LOCAL_AUDIO } from "../hooks/useWebRTC";
import socket from "../socket";
import { useAuth } from "./AuthContext";

const ACTIONS = {
  JOIN: "join",
  LEAVE: "leave",
  SHARE_ROOMS: "share-rooms",
  ADD_PEER: "add-peer",
  RELAY_SDP: "relay-sdp",
  RELAY_ICE: "relay-ice",
  ICE_CANDIDATE: "ice-candidate",
  REMOVE_PEER: "remove-peer",
  SESSION_DESCRIPTION: "session-description",
  UPDATE_USER_LIST: "update-user-list",
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
};

const ChannelPage = () => {
  const { uuid } = useParams();
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState("");
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();
  const token = getCookie("access_token");
  const { userName } = useAuth();
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);

  const { clients, provideMediaRef } = useWebRTC(uuid, userName);
  const [usernames, setUsernames] = useState({}); // Объект для хранения имен пользователей
  const [localStreamReady, setLocalStreamReady] = useState(false);

  useEffect(() => {
    socket.on("already-joined", () => {
      setIsAlreadyJoined(true);
    });

    // Очищаем подписку при размонтировании компонента
    return () => {
      socket.off("already-joined");
    };
  }, [socket]);

  useEffect(() => {
    socket.on(ACTIONS.UPDATE_USER_LIST, (usernames) => {
      setUsernames(usernames); // Обновляем список пользователей
    });

    return () => {
      socket.off(ACTIONS.UPDATE_USER_LIST); // Очищаем обработчик при размонтировании
    };
  }, []);

  // Обработчик для обновления состояния после успешного подключения
  useEffect(() => {
    socket.on("joined", () => {
      setIsJoined(true);
    });

    return () => {
      socket.off("joined"); // Очищаем обработчик при размонтировании
    };
  }, []);

  useEffect(() => {
    if (localStreamReady && !isJoined) {
      joinRoom(); // Подключаемся, только если локальный поток готов
    }
  }, [localStreamReady, isJoined, uuid]); // Подключаемся только если поток готов

  const checkAuth = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("Токен отсутствует");
      }

      const url = `https://petrocord.ru:5000/api/check_auth/?token=${token}`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        toast.error("Необходим токен для подключения!");
        throw new Error("Неавторизован");
      }

      const data = await response.json();
      if (data.message !== "Authenticated") {
        toast.error("Необходим токен для подключения!");
        throw new Error("Неавторизован");
      }
    } catch (error) {
      console.error(error.message || "Ошибка авторизации");
      navigate("/login");
    }
  };

  const fetchChannel = async () => {
    try {
      const response = await fetch(
        `https://petrocord.ru:5000/api/rooms/${uuid}`
      );
      if (!response.ok) {
        throw new Error("Канал не найден");
      }
      const data = await response.json();
      setRoomName(data.name);
    } catch (err) {
      console.log(err);
      setError("Похоже, что такого канала не существует");
    }
  };

  useEffect(() => {
    const checkRoom = async () => {
      try {
        // Проверка, есть ли уже эта комната у пользователя
        const checkResponse = await fetch(
          `https://petrocord.ru:5000/api/rooms/check?room_id=${uuid}`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ room_id: uuid }),
          }
        );

        const checkData = await checkResponse.json(); // Ожидаем ответ в формате JSON
        if (checkData.message === "Комната не найдена у пользователя.") {
          // Если комната не найдена, добавляем ее
          const addResponse = await fetch(
            `https://petrocord.ru:5000/api/rooms/add?room_id=${uuid}`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ room_id: uuid }),
            }
          );

          const addData = await addResponse.json(); // Ожидаем ответ в формате JSON
          if (addData.message.includes("успешно добавлена")) {
            toast.success("Комната успешно добавлена!");
          } else {
            toast.error("Ошибка при добавлении комнаты.");
          }
        }

        setIsJoined(true);
      } catch (error) {
        toast.error("Ошибка при запросе к серверу.");
      }
    };

    checkRoom();
  }, [uuid]);

  const handleLeaveChannel = () => {
    socket.emit(ACTIONS.LEAVE);

    navigate("/channels");

    toast.success("Вы покинули комнату!");
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        toast.success("Ссылка скопирована в буфер обмена!");
      })
      .catch((error) => {
        toast.error("Не удалось скопировать ссылку.");
      });
  };

  useEffect(() => {
    checkAuth();
    fetchChannel();
    if (isJoined) {
    }
  }, [isJoined, uuid, token]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="text-center p-8 bg-white shadow-lg rounded-3xl">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Ошибка</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate("/channels")}
            className="w-full bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-500 transition duration-300 hover:shadow-lg"
          >
            Вернуться к списку комнат
          </button>
        </div>
      </div>
    );
  }

  if (isAlreadyJoined) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white">
        <div className="bg-white text-black p-8 rounded-3xl shadow-2xl w-3/4 md:w-1/3">
          <h1 className="text-2xl font-bold text-center text-red-600 mb-4">
            Ошибка подключения
          </h1>
          <p className="text-gray-800 text-center mb-6">
            Вы уже подключены к этой комнате
          </p>
          <button
            onClick={() => navigate("/channels")}
            className="w-full bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-500 transition duration-300 hover:shadow-lg"
          >
            Вернуться к списку комнат
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 text-white">
      <div className="bg-white bg-opacity-90 rounded-3xl shadow-2xl p-8 w-3/4 md:w-1/2">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-center text-indigo-600 flex items-center">
            Комната: {roomName}
            <FaCopy
              onClick={handleCopyLink}
              className="w-6 h-6 ml-2 bg-transparent text-indigo-500 hover:cursor-pointer hover:text-indigo-400 text-2xl transform transition-all duration-300 ease-in-out hover:scale-110"
              size={20}
            />
          </h2>
        </div>

        {/*
        {isJoined && onlineUsers.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-700">
              Участники
            </h3>
            <ul className="list-disc pl-5">
              {onlineUsers.map((user) => (
                <li
                  key={user}
                  className="text-gray-700 mb-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-center">
                    <span
                      className={`w-2 h-2 rounded-full mr-2 ${
                        onlineUsers.includes(user)
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    ></span>
                    <span className="text-lg">{user}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        */}

        {clients.map((clientID) => (
          <audio
            key={clientID}
            ref={(instance) => {
              provideMediaRef(clientID, instance);
            }}
            autoPlay
            muted={clientID === LOCAL_AUDIO}
          />
        ))}

        <ul>
          {clients.map((clientID) => (
            <li key={clientID} className="text-black font-semibold">
              {usernames[clientID]} {clientID === LOCAL_AUDIO ? "(Вы)" : ""}
            </li>
          ))}
        </ul>

        <button
          onClick={handleLeaveChannel}
          className="w-full bg-red-600 text-white p-3 rounded-2xl mt-6 hover:bg-red-500 transition duration-300 hover:shadow-lg"
        >
          Отключиться
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ChannelPage;
