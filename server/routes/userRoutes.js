const express = require("express");
const router = express.Router();
const { getUsers, updateName, changePassword, deleteAccount } = require("../controllers/userController");

router.get("/", getUsers);
router.put("/update-name", updateName);
router.put("/change-password", changePassword);
router.delete("/delete-account", deleteAccount);

module.exports = router;