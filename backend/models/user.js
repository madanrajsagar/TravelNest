const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String // Optional for Google OAuth users
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing"
  }],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  suspendedUntil: {
    type: Date,
    default: null
  }
});

// Pre-save hook to hash user password
userSchema.pre("save", async function () {
  // Only hash password if it is modified and exists
  if (!this.isModified("password") || !this.password) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// Method to verify passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google users with no password
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
