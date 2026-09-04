import React, { useEffect, useState, useCallback } from "react";
import { Box, Button, Stack, Text, useToast, Flex } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { chatState } from "../Context/ChatProvider";
import api from "../config/api";
import ChatLoader from "./ChatLoader";
import { getSender } from "../config/ChatLogics";
import GroupChatModal from "./Sub-Components/GroupChatModal";

const MyChats = ({ fetchAgain }) => {
  const [loading, setLoading] = useState(false);
  const { user, selectedChat, setSelectedChat, chats, setChats } = chatState();
  const toast = useToast();

  const fetchChats = useCallback(async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.get("/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description:
          error.response?.data?.message || "Failed to load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.token, setChats, toast]);

  useEffect(() => {
    fetchChats();
  }, [fetchAgain, fetchChats]);

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      alignItems="center"
      p={3}
      bg="white"
      w={{ base: "100%", md: "31%" }}
      borderRadius="lg"
      borderWidth="1px"
    >
      <Box
        pb={3}
        px={3}
        fontSize={{ base: "20px", md: "28px" }}
        fontFamily="Work sans"
        display="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text fontWeight="semibold">My Chats</Text>
        <GroupChatModal>
          <Button
            display="flex"
            fontSize={{ base: "14px", md: "12px", lg: "14px" }}
            rightIcon={<AddIcon />}
            colorScheme="teal"
            variant="outline"
          >
            New Group Chat
          </Button>
        </GroupChatModal>
      </Box>

      <Box
        display="flex"
        flexDir="column"
        p={3}
        bg="#F8F8F8"
        w="100%"
        h="100%"
        borderRadius="lg"
        overflowY="hidden"
      >
        {loading ? (
          <ChatLoader />
        ) : chats && chats.length > 0 ? (
          <Stack overflowY="auto">
            {chats.map((chat) => {
              const isSelected = selectedChat?._id === chat._id;
              return (
                <Box
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  cursor="pointer"
                  bg={isSelected ? "#38B2AC" : "#E8E8E8"}
                  color={isSelected ? "white" : "black"}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  transition="background 0.2s"
                  _hover={{
                    bg: isSelected ? "#319795" : "#dedede",
                  }}
                >
                  <Text fontWeight="medium">
                    {!chat.isGroupChat
                      ? getSender(user, chat.users)
                      : chat.chatName}
                  </Text>
                  {chat.latestMessage && (
                    <Text fontSize="xs" noOfLines={1} opacity={0.85}>
                      <b>{chat.latestMessage.sender?.name}: </b>
                      {chat.latestMessage.content}
                    </Text>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Flex justify="center" align="center" h="100%">
            <Text color="gray.500">No chats yet. Start a conversation!</Text>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default MyChats;
