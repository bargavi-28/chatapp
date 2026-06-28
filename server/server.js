require("dotenv").config();

const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");  
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); 
app.use("/api/messages", messageRoutes);
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
const onlineUsers = {};
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join", (userId) => {
  socket.join(userId);

  onlineUsers[userId] = socket.id;

  io.emit("online_users", Object.keys(onlineUsers));

  console.log(`${userId} joined`);
});

  socket.on("send_message", (data) => {
    io.to(data.sender).emit("receive_message", data);
    io.to(data.receiver).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
  for (const userId in onlineUsers) {
    if (onlineUsers[userId] === socket.id) {
      delete onlineUsers[userId];
      break;
    }
  }

  io.emit("online_users", Object.keys(onlineUsers));

  console.log("User Disconnected:", socket.id);
});
});
app.get("/", (req, res) => {
  res.send("Backend Server Running");
});
connectDB();

server.listen(process.env.PORT || 8000, () => {
  console.log("Server running on port 8000");
});