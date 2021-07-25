const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
//const cors = require("cors");

const { v4:uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");

server.listen(process.env.PORT || 3030, () => {
  console.log("Server started");
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/peer"
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(peerServer);
app.use(express.json());
//app.use(cors());

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

// app.get("/:room", (req, res) => {
//   res.render("room", {roomId: req.params.room});
// });

app.get("/:room/:email", (req, res) => {
    res.render("room", {roomId: req.params.room, email: req.params.email});
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("user-connected", userId);
  
      socket.on("message", (message) => {
        io.to(roomId).emit("createMessage", message);
      });

      socket.on("disconnect", () => {
        socket.broadcast.to(roomId).emit("user-disconnected", userId);
      });

      socket.on("share-disconnect",(shareId) => {
        socket.broadcast.to(roomId).emit("share-disconnected", shareId);
      })
    });
    
});