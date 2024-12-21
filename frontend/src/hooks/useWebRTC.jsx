import { useEffect, useRef, useCallback, useState } from "react";
import freeice from "freeice";
import useStateWithCallback from "./useStateWithCallback";
import socket from "../socket";

export const LOCAL_AUDIO = "LOCAL_AUDIO";

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
};

export default function useWebRTC(roomID, username) {
  const [clients, updateClients] = useStateWithCallback([]);
  const [localStreamReady, setLocalStreamReady] = useState(false);

  const addNewClient = useCallback(
    (newClient, cb) => {
      updateClients((list) => {
        if (!list.includes(newClient)) {
          return [...list, newClient];
        }

        return list;
      }, cb);
    },
    [clients, updateClients]
  );

  const peerConnections = useRef({});
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL_AUDIO]: null,
  });

  // Функция для получения локального потока с повторными попытками
  async function getLocalStream(attempts = 0) {
    try {
      // Если уже есть активный поток, остановим его
      if (localMediaStream.current) {
        localMediaStream.current.getTracks().forEach((track) => track.stop());
        console.log("Остановлен старый поток");
      }

      // Запрашиваем доступ к аудио (или видео)
      localMediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false, // Или 'video: true' для видео
      });

      console.log("Новый поток:", localMediaStream.current);
      setLocalStreamReady(true);
      return localMediaStream.current;
    } catch (error) {
      console.error("Ошибка при получении локального потока:", error);
      if (attempts < 3) {
        // Повторяем попытку получения потока (до 3 раз)
        return getLocalStream(attempts + 1);
      } else {
        throw new Error(
          "Не удалось получить локальный поток после нескольких попыток"
        );
      }
    }
  }

  useEffect(() => {
    async function startCapture() {
      try {
        await getLocalStream(); // Попробуем получить поток с повторными попытками
        addNewClient(LOCAL_AUDIO, () => {
          const localAudioElement = peerMediaElements.current[LOCAL_AUDIO];
          if (localAudioElement) {
            localAudioElement.volume = 0; // Заглушаем локальное воспроизведение
            localAudioElement.srcObject = localMediaStream.current;
          }
        });

        // Сообщаем серверу о подключении
        if (localStreamReady) {
          socket.emit(ACTIONS.JOIN, { room: roomID, username });
        }
      } catch (error) {
        console.error(
          "Не удалось захватить поток после нескольких попыток:",
          error
        );
      }
    }

    startCapture();

    return () => {
      // Проверяем перед остановкой потоков
      if (localMediaStream.current) {
        localMediaStream.current.getTracks().forEach((track) => track.stop());
      }

      // Сообщаем серверу о выходе
      socket.emit(ACTIONS.LEAVE);
    };
  }, [roomID, localStreamReady]);

  // Логика для обработки новых пиров, сессий и ICE кандидатов
  useEffect(() => {
    async function handleNewPeer({ peerID, createOffer }) {
      if (peerID in peerConnections.current) {
        return console.warn(`Already connected to peer ${peerID}`);
      }

      peerConnections.current[peerID] = new RTCPeerConnection({
        iceServers: freeice(),
      });

      peerConnections.current[peerID].onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit(ACTIONS.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      };
      let tracksNumber = 0;
      peerConnections.current[peerID].ontrack = ({
        streams: [remoteStream],
      }) => {
        tracksNumber = 1;
        if (tracksNumber === 1) {
          tracksNumber = 0;
          addNewClient(peerID, () => {
            if (peerMediaElements.current[peerID]) {
              peerMediaElements.current[peerID].srcObject = remoteStream;
            } else {
              let settled = false;
              const interval = setInterval(() => {
                if (peerMediaElements.current[peerID]) {
                  const audioElement = peerMediaElements.current[peerID];
                  audioElement.srcObject = remoteStream;
                  audioElement.autoPlay = true;
                  settled = true;
                }
                if (settled) {
                  clearInterval(interval);
                }
              }, 1000);
            }
          });
        }
      };

      // Убедитесь, что localMediaStream доступен перед добавлением треков
      if (localMediaStream.current) {
        localMediaStream.current.getTracks().forEach((track) => {
          console.log("Добавление трека:", track);
          peerConnections.current[peerID].addTrack(
            track,
            localMediaStream.current
          );
        });
      } else {
        console.error("Локальный медиа-поток недоступен");
      }

      if (createOffer) {
        const offer = await peerConnections.current[peerID].createOffer();
        await peerConnections.current[peerID].setLocalDescription(offer);

        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: offer,
        });
      }
    }

    socket.on(ACTIONS.ADD_PEER, handleNewPeer);

    return () => {
      socket.off(ACTIONS.ADD_PEER);
    };
  }, []);

  useEffect(() => {
    async function setRemoteMedia({
      peerID,
      sessionDescription: remoteDescription,
    }) {
      await peerConnections.current[peerID]?.setRemoteDescription(
        new RTCSessionDescription(remoteDescription)
      );

      if (remoteDescription.type === "offer") {
        const answer = await peerConnections.current[peerID].createAnswer();

        await peerConnections.current[peerID].setLocalDescription(answer);

        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: answer,
        });
      }
    }

    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);

    return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION);
    };
  }, []);

  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }) => {
      console.log("Добавление ICE-кандидата:", iceCandidate);
      peerConnections.current[peerID]?.addIceCandidate(
        new RTCIceCandidate(iceCandidate)
      );
    });

    return () => {
      socket.off(ACTIONS.ICE_CANDIDATE);
    };
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({ peerID }) => {
      if (peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }

      delete peerConnections.current[peerID];
      delete peerMediaElements.current[peerID];

      updateClients((list) => list.filter((c) => c !== peerID));
    };

    socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

    return () => {
      socket.off(ACTIONS.REMOVE_PEER);
    };
  }, []);

  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, []);

  return {
    clients,
    provideMediaRef,
  };
}
