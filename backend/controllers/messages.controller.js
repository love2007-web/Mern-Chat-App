const { Chat } = require("../models/chats.models");
const { Message } = require("../models/message.model");
const { User } = require("../models/user.model");

// ... (keep sendMessage and allMessages)

const editMessage = async (req, res, next) => {
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Message content cannot be empty" });
  }

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // 1. Check if the requester is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own messages" });
    }

    // 2. Check if within 15-minute window (15 * 60 * 1000 ms)
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();

    if (messageAge > FIFTEEN_MINUTES) {
      return res.status(400).json({
        message:
          "Editing window expired. Messages can only be edited within 15 minutes of sending.",
      });
    }

    // 3. Update message
    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    let updatedMessage = await Message.findById(messageId)
      .populate("sender", "name pic email")
      .populate("chat");

    updatedMessage = await User.populate(updatedMessage, {
      path: "chat.users",
      select: "name pic email",
    });

    res.status(200).json(updatedMessage);
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, allMessages, editMessage };
