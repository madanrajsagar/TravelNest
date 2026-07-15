const jwt = require("jsonwebtoken");
const User = require("../models/user");

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET || process.env.SECRET || "fallbacksecret";
  console.log("Signing token with secret source:", process.env.JWT_SECRET ? "JWT_SECRET" : process.env.SECRET ? "SECRET" : "fallback");
  return jwt.sign({ id: userId }, secret, {
    expiresIn: "7d"
  });
};

const sendTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  console.log("Token cookie set successfully");
};

module.exports.signup = async (req, res, next) => {
  console.log("\n--- SIGNUP REQUEST RECEIVED ---");
  console.log("Request Body:", req.body);
  try {
    let { username, email, password } = req.body;
    if (username) username = username.trim();
    if (email) email = email.trim();

    if (!username || !email || !password) {
      console.warn("Signup failed: Missing required fields");
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    // Check if username or email already exists in DB
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.warn(`Signup failed: User with username '${username}' or email '${email}' already exists`);
      return res.status(400).json({ success: false, error: "Username or Email already registered" });
    }

    let role = "user";
    if (username.toLowerCase() === "admin" || email.toLowerCase() === "admin@travelnest.com") {
      role = "admin";
    }
    const newUser = new User({ email, username, password, role });
    console.log("Saving new user to MongoDB...");
    await newUser.save();
    console.log("User saved successfully in DB");

    // Send Welcome Email
    const { sendWelcomeEmail } = require("../utils/email");
    sendWelcomeEmail(newUser).catch(err => console.error("Welcome email trigger failed:", err));

    const token = signToken(newUser._id);
    sendTokenCookie(res, token);

    res.json({
      success: true,
      message: "Welcome to TravelNest!",
      token,
      user: { _id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
    });
  } catch (e) {
    console.error("CRITICAL SIGNUP ERROR:", e);
    res.status(400).json({ success: false, error: e.message });
  }
};

module.exports.login = async (req, res) => {
  console.log("\n--- LOGIN REQUEST RECEIVED ---");
  console.log("Request Body:", req.body);
  try {
    let { username, password } = req.body;
    if (username) username = username.trim();
    if (!username || !password) {
      console.warn("Login failed: Missing username or password");
      return res.status(400).json({ success: false, error: "Username and password are required" });
    }

    console.log(`Querying DB for user: '${username}'`);
    const user = await User.findOne({ username });
    if (!user) {
      console.warn(`Login failed: Username '${username}' not found in DB`);
      return res.status(400).json({ success: false, error: "Invalid username or password" });
    }

    if (user.isBanned) {
      console.warn(`Login failed: User @${user.username} is banned`);
      return res.status(400).json({ success: false, error: "Your account has been permanently banned from TravelNest." });
    }

    if (user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      const suspensionDate = new Date(user.suspendedUntil).toLocaleString();
      console.warn(`Login failed: User @${user.username} is suspended until ${suspensionDate}`);
      return res.status(400).json({ success: false, error: `Your account is temporarily suspended until ${suspensionDate}.` });
    }

    console.log("Verifying password hash using bcrypt...");
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn("Login failed: Password mismatch");
      return res.status(400).json({ success: false, error: "Invalid username or password" });
    }
    console.log("Password verified successfully");

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.json({
      success: true,
      message: "Welcome back to TravelNest!",
      token,
      user: { _id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (e) {
    console.error("CRITICAL LOGIN ERROR:", e);
    res.status(500).json({ success: false, error: e.message });
  }
};

module.exports.logout = (req, res) => {
  console.log("\n--- LOGOUT REQUEST RECEIVED ---");
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  console.log("Token cookie cleared");
  res.json({ success: true, message: "You are logged out!" });
};

module.exports.currUser = async (req, res) => {
  console.log("\n--- CURRENT USER SESSION REQUEST ---");
  try {
    let token = req.cookies.token;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      } else {
        token = req.headers.authorization;
      }
    }
    
    if (!token) {
      console.log("No token cookie or Authorization header found");
      return res.json({ user: null });
    }
    console.log("Verifying token...");
    const secret = process.env.JWT_SECRET || process.env.SECRET || "fallbacksecret";
    const decoded = jwt.verify(token, secret);
    
    console.log(`Token verified. Querying DB for User ID: '${decoded.id}'`);
    const user = await User.findById(decoded.id).select("-password");
    console.log("Session User found:", user ? `@${user.username}` : "None");
    res.json({ user: user || null });
  } catch (err) {
    console.warn("Session check token verification failed:", err.message);
    res.json({ user: null });
  }
};