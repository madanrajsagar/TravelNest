
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();

}

const dns = require("dns");
if (dns.getServers().includes("127.0.0.1")) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}


const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const authRouter = require("./routes/auth.js");
const wishlistRouter = require("./routes/wishlist.js");
const bookingRouter = require("./routes/booking.js");
const aiRouter = require("./routes/ai.js");
const aiAssistantRouter = require("./routes/aiAssistant.js");
const travelServicesRouter = require("./routes/travelServices.js");
const analyticsRouter = require("./routes/analytics.js");
const adminRouter = require("./routes/admin.js");
const reportRouter = require("./routes/report.js");
const aiSearchRouter = require("./routes/aiSearch.js");
const superHostRouter = require("./routes/superHost.js");
const cookieParser = require("cookie-parser");
const User = require("./models/user.js");

const dbUrl =
  process.env.ATLASDB_URL ||
  "mongodb://127.0.0.1:27017/wanderlust";

console.log("DB URL:", dbUrl);
main()
  .then(() =>
    console.log(
      `Connected to MongoDB (${dbUrl.startsWith("mongodb+srv://") ? "Atlas" : "local"})`
    )
  )
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

async function main() {
  await mongoose.connect(dbUrl, {
    serverSelectionTimeoutMS: 10000,
  });
}

// CORS setup to allow credentials (cookies)
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieParser());

const notificationRouter = require("./routes/notification.js");
const chatRouter = require("./routes/chat.js");

// API Routes
app.use("/api/listings", listingRouter);
app.use("/api/listings/:id/reviews", reviewRouter);
app.use("/api", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/chat", chatRouter);
app.use("/api/ai", aiRouter);
app.use("/api/ai/assistant", aiAssistantRouter);
app.use("/api/services", travelServicesRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reports", reportRouter);
app.use("/api/ai/search", aiSearchRouter);
app.use("/api/services/hosts", superHostRouter);

// Root Endpoint
app.get("/", (req, res) => {
  res.json({ message: "Welcome to TravelNest API!", status: "active" });
});

// 404 handler
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// JSON Error Middleware
app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;
  console.error("API error handler:", err);
  res.status(status).json({ success: false, error: message });
});

// Create HTTP server for WebSockets Socket.IO support
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[SOCKET CONNECTED] Socket ID: ${socket.id}`);

  socket.on("joinRoom", ({ bookingId }) => {
    socket.join(`booking_${bookingId}`);
    console.log(`[SOCKET ROOM JOIN] Socket ${socket.id} joined room booking_${bookingId}`);
  });

  socket.on("typing", ({ bookingId, username, isTyping }) => {
    socket.to(`booking_${bookingId}`).emit("userTyping", { username, isTyping });
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET DISCONNECTED] Socket ID: ${socket.id}`);
  });
});

server.listen(8080, () => {
  console.log("Server is running on port 8080 (HTTP + Socket.IO)");
});

