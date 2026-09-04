const { Chat } = require("../models/chats.models");
const { Message } = require("../models/message.model");
const { User } = require("../models/user.model");

const sendMessage = async (req, res, next) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ message: "Content and chatId are required" });
  }

  try {
    let message = await Message.create({
      sender: req.user._id,
      content,
      chat: chatId,
    });

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

const allMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, allMessages };
