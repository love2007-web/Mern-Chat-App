import React, { useState } from "react";
import ScrollableFeed from "react-scrollable-feed";
import {
  Avatar,
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { chatState } from "../Context/ChatProvider";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const ScrollableChat = ({ messages, onSaveEdit }) => {
  const { user } = chatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!messages || !user) return null;

  const handleOpenEdit = (message) => {
    setSelectedMsg(message);
    setEditContent(message.content);
    onOpen();
  };

  const handleSave = async () => {
    if (!editContent.trim() || !selectedMsg) return;
    setIsSaving(true);
    await onSaveEdit(selectedMsg._id, editContent);
    setIsSaving(false);
    onClose();
  };

  return (
    <>
      <ScrollableFeed>
        {messages.map((m, i) => {
          const isUserMessage = m.sender?._id === user._id;

          // Check if message is editable (< 15 mins old)
          const messageAge = Date.now() - new Date(m.createdAt).getTime();
          const canEdit = isUserMessage && messageAge <= FIFTEEN_MINUTES_MS;

          return (
            <Box
              key={m._id || i}
              display="flex"
              alignItems="center"
              my={1}
              role="group"
            >
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
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                >
                  <Text fontSize="md">{m.content}</Text>

                  {/* Edit button visible on hover if message is < 15 mins old */}
                  {canEdit && (
                    <IconButton
                      icon={<EditIcon />}
                      size="xs"
                      variant="ghost"
                      color={isUserMessage ? "white" : "gray.600"}
                      _hover={{ bg: isUserMessage ? "teal.600" : "gray.300" }}
                      opacity={0}
                      _groupHover={{ opacity: 1 }}
                      transition="opacity 0.2s"
                      aria-label="Edit message"
                      onClick={() => handleOpenEdit(m)}
                    />
                  )}
                </Box>

                {/* Footer: Timestamp and Edited status */}
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="center"
                  gap={1}
                  mt={1}
                >
                  {m.isEdited && (
                    <Text fontSize="10px" opacity={0.75} fontStyle="italic">
                      edited
                    </Text>
                  )}
                  {m.createdAt && (
                    <Text fontSize="9px" opacity={0.8} userSelect="none">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </ScrollableFeed>

      {/* Edit Message Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your message..."
                autoFocus
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleSave}
              isLoading={isSaving}
              loadingText="Saving..."
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScrollableChat;
