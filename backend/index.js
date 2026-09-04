const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

// Routes & Middleware
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

dotenv.config();
const app = express();

// 1. CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL, // e.g. https://your-frontend.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);

// 2. Body Parsing (Built-in Express)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health check route
app.get("/", (req, res) => {
  res.json({ status: "API is running successfully" });
});

// 4. API Routes
app.use("/users", userRoutes);
app.use("/chat", chatRoutes);
app.use("/message", messageRoutes);

// 5. Error Handling Middleware (MUST BE AT THE END)
app.use(notFound);
app.use(errorHandler);

// 6. Database Connection & Server Startup
const PORT = process.env.PORT || 5000;
const uri = process.env.URI;

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected successfully");
    const server = app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`),
    );

    // 7. Socket.IO Setup
    const io = require("socket.io")(server, {
      pingTimeout: 60000,
      cors: {
        origin: allowedOrigins.length ? allowedOrigins : "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Setup user room
      socket.on("setup", (userData) => {
        if (!userData?._id) return;
        socket.join(userData._id);
        socket.emit("connected");
      });

      // Join chat room
      socket.on("join chat", (room) => {
        if (!room) return;
        socket.join(room);
      });

      // Typing indicators
      socket.on("typing", (room) => socket.in(room).emit("typing"));
      socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

      // Real-time message dispatch
      socket.on("new message", (newMessageReceived) => {
        const chat = newMessageReceived?.chat;
        if (!chat?.users) return;

        chat.users.forEach((user) => {
          // Do not send message back to sender
          if (user._id === newMessageReceived.sender?._id) return;
          socket.in(user._id).emit("message recieved", newMessageReceived);
        });
      });

      // Disconnect handling
      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
