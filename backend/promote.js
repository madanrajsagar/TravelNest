const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function promoteAdmin() {
  console.log("Connecting to MongoDB:", dbUrl);
  await mongoose.connect(dbUrl);

  const allUsers = await User.find({});
  console.log("All usernames in DB:", allUsers.map(u => ({ username: u.username, role: u.role })));

  const adminUser = await User.findOne({ username: 'admin ' });
  if (!adminUser) {
    console.log("User 'admin ' not found in the database.");
    process.exit(0);
  }

  console.log("Found user 'admin ':", adminUser.username);
  console.log("Current role:", adminUser.role);

  console.log("Updating username to 'admin' and promoting to 'admin' role...");
  adminUser.username = 'admin';
  adminUser.role = 'admin';
  await adminUser.save();
  console.log("Success! User has been updated and promoted.");

  await mongoose.connection.close();
  console.log("Database connection closed.");
}

promoteAdmin().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
