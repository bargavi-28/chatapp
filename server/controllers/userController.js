const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Message = require("../models/Message");


const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ name: 1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


const updateName = async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { new: true }
    ).select("-password");
    res.status(200).json({ message: "Name updated", user });
  } catch (error) {
    console.error("Update name error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { userId, password } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getUsers, updateName, changePassword, deleteAccount };