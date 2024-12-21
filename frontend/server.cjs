const path = require("path");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const { version, validate } = require("uuid");

const ACTIONS = require("./src/socket/actions.cjs");
const PORT = process.env.PORT || 3001;

const socketUsernames = {};

io.on("connection", (socket) => {
  socket.on(ACTIONS.JOIN, (config) => {
    const { room: roomID, username } = config;
    const { rooms: joinedRooms } = socket;

    /* if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    } */

    if (Object.values(socketUsernames).includes(username)) {
      socket.emit("already-joined");
      return;
    }

    const clientsInRoom = Array.from(
      io.sockets.adapter.rooms.get(roomID) || []
    );
    if (clientsInRoom.includes(socket.id)) {
      return console.warn(`Client ${socket.id} is already in the room.`);
    }

    clientsInRoom.forEach((clientID) => {
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false,
      });

      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });

    socketUsernames[socket.id] = username;

    socket.emit(ACTIONS.UPDATE_USER_LIST, socketUsernames);
    socket.to(roomID).emit(ACTIONS.UPDATE_USER_LIST, socketUsernames);

    socket.emit("joined");
    socket.join(roomID);
  });

  function leaveRoom() {
    const { rooms } = socket;

    Array.from(rooms)
      // LEAVE ONLY CLIENT CREATED ROOM
      .filter((roomID) => validate(roomID) && version(roomID) === 4)
      .forEach((roomID) => {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

        clients.forEach((clientID) => {
          io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
            peerID: socket.id,
          });

          socket.emit(ACTIONS.REMOVE_PEER, {
            peerID: clientID,
          });

          delete socketUsernames[socket.id];

          io.to(roomID).emit(ACTIONS.UPDATE_USER_LIST, socketUsernames);
        });

        socket.leave(roomID);
      });
  }

  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on("disconnecting", leaveRoom);

  socket.on(ACTIONS.RELAY_SDP, ({ peerID, sessionDescription }) => {
    io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: socket.id,
      sessionDescription,
    });
  });

  socket.on(ACTIONS.RELAY_ICE, ({ peerID, iceCandidate }) => {
    io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: socket.id,
      iceCandidate,
    });
  });
});

const publicPath = path.join(__dirname, "build");

app.use(express.static(publicPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

server.listen(PORT, () => {
  console.log("Server Started!");
});
