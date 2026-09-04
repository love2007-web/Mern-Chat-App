const { User } = require("../models/user.model");
const { Chat } = require("../models/chats.models");

const accessChat = async (req, res, next) => {
  const { userid } = req.body;

  if (!userid) {
    return res
      .status(400)
      .json({ message: "User ID param not sent with request" });
  }

  try {
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userid } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    if (isChat.length > 0) {
      return res.status(200).json(isChat[0]);
    }

    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userid],
    };

    const createdChat = await Chat.create(chatData);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password",
    );

    res.status(201).json(fullChat);
  } catch (error) {
    next(error);
  }
};

const fetchChats = async (req, res, next) => {
  try {
    let results = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    results = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

const createGroupChat = async (req, res, next) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).json({ message: "Please fill all the fields" });
  }

  let users;
  try {
    users =
      typeof req.body.users === "string"
        ? JSON.parse(req.body.users)
        : req.body.users;
  } catch {
    return res.status(400).json({ message: "Invalid users format" });
  }

  if (users.length < 2) {
    return res
      .status(400)
      .json({ message: "At least 2 other users are required to form a group" });
  }

  users.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(201).json(fullGroupChat);
  } catch (error) {
    next(error);
  }
};

const renameGroup = async (req, res, next) => {
  const { chatId, chatName } = req.body;

  if (!chatId || !chatName) {
    return res
      .status(400)
      .json({ message: "Chat ID and new name are required" });
  }

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true },
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    next(error);
  }
};

const addToGroup = async (req, res, next) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res
      .status(400)
      .json({ message: "Chat ID and User ID are required" });
  }

  try {
    const added = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { users: userId } }, // $addToSet prevents duplicate entries
      { new: true },
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(added);
  } catch (error) {
    next(error);
  }
};

const removeFromGroup = async (req, res, next) => {
  const { chatId, userId } = req.body;

  if (!chatId || !userId) {
    return res
      .status(400)
      .json({ message: "Chat ID and User ID are required" });
  }

  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true },
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(removed);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
