const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");

const userController = require("../controllers/users.js");

router.post("/signup", wrapAsync(userController.signup));

router.post("/login", wrapAsync(userController.login));

router.get("/logout", userController.logout);
router.get("/currUser", userController.currUser);

module.exports = router;