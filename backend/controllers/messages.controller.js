const { Chat } = require("../models/chats.models");
const { Message } = require("../models/message.model");
const { User } = require("../models/user.model");

const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    
console.log(message);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });
    console.log(message);

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    console.log(error);
    res.status(400);
    // throw new Error(error.message);
  }
};

const allMessages = async (req, res) => {
  try {
    console.log(req.params.chatId);
    const messages = await Message.find({chat: req.params.chatId})
      .populate("sender", "name pic email")
      .populate("chat");

      res.json(messages)
  } catch (error) {
    console.log(error);
    res.status(400);
    throw new Error(error.message);
  }
};

module.exports = { sendMessage, allMessages };
