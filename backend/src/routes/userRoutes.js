
const express = require("express");
const controller = require("../controllers/userController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);
router.get("/", controller.searchUsers);

module.exports = router;
