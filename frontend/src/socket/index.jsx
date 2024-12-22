import { io } from "socket.io-client";

const options = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io("https://petrocord.ru:3001", options);

export default socket;
