import React, { useEffect, useState } from "react";
import { chatState } from "../Context/ChatProvider";
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
import ProfileModal from "./Sub-Components/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import { getSender, getSenderFull } from "../config/ChatLogics";
import UpdateGroupChat from "./Sub-Components/UpdateGroupChat";
import axios from "axios";
import io from "socket.io-client";
// import Lottie from "lottie-react";
import animationData from "../animations/animation_lnyzk5oe.json"
// import sendAnimate from "../animations/animation_lo4au8a4.json"

const endpoint = "https://chat-app-blpr.onrender.com";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setfetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const toast = useToast();

    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
      },
    };
  const { selectedChat, setselectedChat, user, notification, setnotification } =
    chatState();

    const fetchMessages = async () => {
      if (!selectedChat) return;

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        setLoading(true);

        console.log(selectedChat._id);

        const { data } = await axios.get(
          `https://chat-app-blpr.onrender.com/message/${selectedChat._id}`,
          config
        );

        console.log(data);
        setMessages(data);
        setLoading(false);

        socket.emit("join chat", selectedChat._id);
      } catch (error) {
        console.log(error);
        toast({
          title: "Error Occured!",
          description: "Failed to Load the Messages",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    };

  const sendMessage = async (event) => {
    if (newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "https://chat-app-blpr.onrender.com/message",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        console.log(data);
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

    useEffect(() => {
      socket = io(endpoint);
      socket.emit("setup", user);
      socket.on("connected", () => setSocketConnected(true));
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));

      // eslint-disable-next-line
    }, []);

    useEffect(() => {
      fetchMessages();

      selectedChatCompare = selectedChat;
      // eslint-disable-next-line
    }, [selectedChat]);

    useEffect(() => {
      socket.on("message recieved", (newMessageRecieved) => {
        if (
          !selectedChatCompare || // if chat is not selected or doesn't match current chat
          selectedChatCompare._id !== newMessageRecieved.chat._id
        ) {
          if (!notification.includes(newMessageRecieved)) {
            setnotification([newMessageRecieved, ...notification]);
            setfetchAgain(!fetchAgain);
          }
        } else {
          setMessages([...messages, newMessageRecieved]);
        }
      });
    });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setselectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChat
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setfetchAgain={setfetchAgain}
                  />
                </>
              ))}
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
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="flex flex-col overflow-y-scroll scrollbar-none">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyPress={(e) => (e.key === "Enter" ? sendMessage() : null)}
              id="first-name"
              isRequired
              mt={3}
              display={"flex"}
            >
              {istyping ? (
                <div>
                  {/* <Lottie
                    options={defaultOptions}
                    height={50}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  /> */}
                </div>
              ) : (
                <></>
              )}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
              <Button
                ml={3}
                colorScheme="orange"
                variant="solid"
                onClick={sendMessage}
              >
                <span className="material-symbols-outlined">send</span>
              </Button>
            </FormControl>
          </Box>
        </>
      ) : (
        // to get socket.io on same page
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
