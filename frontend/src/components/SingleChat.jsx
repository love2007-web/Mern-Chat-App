import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import io from "socket.io-client";

import { chatState } from "../Context/ChatProvider";
import api, { API_BASE_URL } from "../config/api";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./Sub-Components/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import UpdateGroupChat from "./Sub-Components/UpdateGroupChat";

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef(null);
  const selectedChatCompareRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    chatState();

  // Socket Connection Setup
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(API_BASE_URL);
    socketRef.current.emit("setup", user);
    socketRef.current.on("connected", () => setSocketConnected(true));
    socketRef.current.on("typing", () => setIsTyping(true));
    socketRef.current.on("stop typing", () => setIsTyping(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  // Fetch Messages
  const fetchMessages = useCallback(async () => {
    if (!selectedChat?._id || !user?.token) return;

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.get(`/message/${selectedChat._id}`, config);
      setMessages(data);
      socketRef.current?.emit("join chat", selectedChat._id);
    } catch {
      toast({
        title: "Error Occurred!",
        description: "Failed to load messages",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedChat?._id, user?.token, toast]);

  useEffect(() => {
    fetchMessages();
    selectedChatCompareRef.current = selectedChat;
  }, [selectedChat, fetchMessages]);

  // Socket Listeners (Receiving & Editing messages)
  useEffect(() => {
    if (!socketRef.current) return;

    const handleMessageReceived = (newMessageReceived) => {
      if (
        !selectedChatCompareRef.current ||
        selectedChatCompareRef.current._id !== newMessageReceived.chat._id
      ) {
        setNotification((prev) => {
          if (!prev.some((n) => n._id === newMessageReceived._id)) {
            return [newMessageReceived, ...prev];
          }
          return prev;
        });
        if (setFetchAgain) setFetchAgain((prev) => !prev);
      } else {
        setMessages((prev) => [...prev, newMessageReceived]);
      }
    };

    // Real-time update when another user edits a message
    const handleMessageUpdated = (updatedMessage) => {
      if (selectedChatCompareRef.current?._id === updatedMessage.chat._id) {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)),
        );
      }
    };

    socketRef.current.on("message recieved", handleMessageReceived);
    socketRef.current.on("message updated", handleMessageUpdated);

    return () => {
      socketRef.current?.off("message recieved", handleMessageReceived);
      socketRef.current?.off("message updated", handleMessageUpdated);
    };
  }, [setFetchAgain, setNotification]);

  // Send Message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat?._id) return;

    socketRef.current?.emit("stop typing", selectedChat._id);
    const messageContent = newMessage;
    setNewMessage("");

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.post(
        "/message",
        {
          content: messageContent,
          chatId: selectedChat._id,
        },
        config,
      );

      socketRef.current?.emit("new message", data);
      setMessages((prev) => [...prev, data]);
    } catch {
      toast({
        title: "Error Occurred!",
        description: "Failed to send the message",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
      setNewMessage(messageContent);
    }
  };

  // Edit Message Handler (called from ScrollableChat)
  const handleSaveEdit = async (messageId, updatedContent) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.put(
        `/message/${messageId}`,
        { content: updatedContent },
        config,
      );

      // 1. Update local state
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data : m)));

      // 2. Broadcast edit via socket
      socketRef.current?.emit("edit message", data);

      toast({
        title: "Message updated",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to edit message",
        description: error.response?.data?.message || "Error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    socketRef.current?.emit("typing", selectedChat._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop typing", selectedChat._id);
    }, 2500);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "24px", md: "28px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat(null)}
              aria-label="Back"
            />
            {!selectedChat.isGroupChat ? (
              <>
                <span>{getSender(user, selectedChat.users)}</span>
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                <span>{selectedChat.chatName.toUpperCase()}</span>
                <UpdateGroupChat
                  fetchMessages={fetchMessages}
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                />
              </>
            )}
          </Text>

          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={16}
                h={16}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="flex flex-col overflow-y-auto">
                <ScrollableChat
                  messages={messages}
                  onSaveEdit={handleSaveEdit}
                />
              </div>
            )}

            {isTyping && (
              <Text fontSize="xs" color="gray.600" mb={1} fontStyle="italic">
                Typing...
              </Text>
            )}

            <FormControl
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              isRequired
              mt={2}
              display="flex"
            >
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Type a message..."
                value={newMessage}
                onChange={typingHandler}
              />
              <Button ml={2} colorScheme="teal" onClick={sendMessage}>
                Send
              </Button>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="2xl" color="gray.500" fontFamily="Work sans">
            Select a conversation to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
