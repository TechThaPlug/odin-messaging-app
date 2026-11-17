const express = require("express");
const passport = require("../config/passport");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/register", authController.register);

router.post(
  "/login",
  passport.authenticate("local"),
  authController.login
);

router.post("/logout", authController.logout);

router.get("/me", (req, res) => {
  authController.currentUser(req, res);
});

module.exports = router;