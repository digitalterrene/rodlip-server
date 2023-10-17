const mongoose = require("mongoose");
const express = require("express");
const {
  registerUser,
  loginUser,
  fetchUser,
  fetchAllUsers,
  searchUsers,
  updateUser,
  deleteUser,
} = require("../controllers/usersController");
// Handling Files

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", fetchUser);
router.get("/", fetchAllUsers);
router.get("/search/:search_key", searchUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
// Updating an cubical

module.exports = router;
