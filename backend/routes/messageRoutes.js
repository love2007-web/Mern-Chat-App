const messageRoutes = require("express").Router();
const { protect } = require("../middleware/auth");
const {
  sendMessage,
  allMessages,
  editMessage,
} = require("../controllers/messages.controller");

messageRoutes.route("/").post(protect, sendMessage);
messageRoutes.route("/:chatId").get(protect, allMessages);
messageRoutes.route("/:messageId").put(protect, editMessage);

module.exports = messageRoutes;
