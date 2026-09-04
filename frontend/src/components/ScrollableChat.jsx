import React from "react";
import ScrollableFeed from "react-scrollable-feed";
import { Avatar, Box, Text, Tooltip } from "@chakra-ui/react";
import { chatState } from "../Context/ChatProvider";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";

const ScrollableChat = ({ messages }) => {
  const { user } = chatState();

  if (!messages || !user) return null;

  return (
    <ScrollableFeed>
      {messages.map((m, i) => {
        const isUserMessage = m.sender?._id === user._id;

        return (
          <Box key={m._id || i} display="flex" alignItems="center" my={1}>
            {/* Show avatar only on last message of a sequence */}
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Tooltip
                label={m.sender?.name || "Unknown"}
                placement="bottom-start"
                hasArrow
              >
                <Avatar
                  mt="7px"
                  mr={2}
                  size="sm"
                  cursor="pointer"
                  name={m.sender?.name}
                  src={m.sender?.pic}
                />
              </Tooltip>
            )}

            {/* Message Bubble */}
            <Box
              bg={isUserMessage ? "#38B2AC" : "#E2E8F0"}
              color={isUserMessage ? "white" : "black"}
              ml={isSameSenderMargin(messages, m, i, user._id)}
              mt={isSameUser(messages, m, i, user._id) ? "3px" : "10px"}
              borderRadius="16px"
              px={4}
              py={2}
              maxW="70%"
              style={{ wordBreak: "break-word" }}
              position="relative"
              boxShadow="sm"
            >
              <Text fontSize="md">{m.content}</Text>

              {/* Timestamp */}
              {m.createdAt && (
                <Text
                  fontSize="9px"
                  textAlign="right"
                  mt={1}
                  opacity={0.8}
                  userSelect="none"
                >
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
              )}
            </Box>
          </Box>
        );
      })}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
