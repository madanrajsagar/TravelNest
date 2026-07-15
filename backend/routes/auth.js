const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const wrapAsync = require("../utils/wrapAsync");

// Initialize Google OAuth2 Client
// Make sure to set GOOGLE_CLIENT_ID in your backend .env file!
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET || process.env.SECRET || "fallbacksecret";
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
};

// POST /api/auth/google
router.post(
  "/google",
  wrapAsync(async (req, res) => {
    console.log("\n--- GOOGLE SIGNIN REQUEST RECEIVED ---");
    const { credential } = req.body;
    if (!credential) {
      console.warn("Google sign-in failed: Missing credential token");
      return res.status(400).json({ success: false, error: "Google credential is required" });
    }

    // Bypass check for local simulation
    if (credential === "mock_google_token_madanrajsagar83") {
      console.log("Mock Google token detected. Creating/Logging in simulated user...");
      let user = await User.findOne({ email: "madanrajsagar83@gmail.com" });
      if (!user) {
        user = new User({
          username: "madanrajsagar83",
          email: "madanrajsagar83@gmail.com",
          googleId: "mock_google_id_838383",
          avatar: "https://lh3.googleusercontent.com/a/default-user"
        });
        await user.save();
      }
      const token = signToken(user._id);
      sendTokenCookie(res, token);
      console.log("Mock Google session JWT issued successfully");
      return res.json({
        success: true,
        message: "Welcome to TravelNest (Simulated Google Login)!",
        token,
        user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar }
      });
    }

    try {
      console.log("Verifying Google ID Token with Google API...");
      // Verify ID token
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      
      const { sub: googleId, email, name, picture } = payload;
      console.log(`Token verified: Name: '${name}', Email: '${email}', Google ID: '${googleId}'`);

      // Find user by Google ID or by Email
      let user = await User.findOne({ $or: [{ googleId }, { email }] });

      if (user) {
        console.log("User already exists in DB");
        // Link Google ID if registered previously via email/password
        if (!user.googleId) {
          console.log("Linking Google ID to existing email account");
          user.googleId = googleId;
          if (picture && !user.avatar) user.avatar = picture;
          await user.save();
        }
      } else {
        console.log("No existing user found. Registering new Google SSO account...");
        
        // Generate a random, unique username from their name
        let baseUsername = name.replace(/\s+/g, "").toLowerCase();
        let uniqueUsername = baseUsername;
        let count = 1;
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${baseUsername}${count}`;
          count++;
        }

        user = new User({
          username: uniqueUsername,
          email,
          googleId,
          avatar: picture || ""
        });
        await user.save();
        console.log(`New user created: @${user.username}`);
      }

      // Generate custom backend JWT token
      const token = signToken(user._id);
      sendTokenCookie(res, token);
      console.log("Google session JWT issued successfully");

      res.json({
        success: true,
        message: "Welcome to TravelNest!",
        token,
        user: { _id: user._id, username: user.username, email: user.email, avatar: user.avatar }
      });

    } catch (verifyError) {
      console.error("Google ID Token verification failed:", verifyError);
      res.status(401).json({ success: false, error: "Google verification failed. Invalid token." });
    }
  })
);

module.exports = router;
