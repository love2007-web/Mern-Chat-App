import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
  Spinner,
} from "@chakra-ui/react";

import { chatState } from "../../Context/ChatProvider";
import api from "../../config/api";
import UserListItem from "../User Avatar/UserListItem";
import UserBadgeItem from "../User Avatar/UserBadgeItem";

const GroupChatModal = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const toast = useToast();
  const { user, chats, setChats } = chatState();

  // Reset modal state on close
  const handleClose = () => {
    setGroupChatName("");
    setSelectedUsers([]);
    setSearch("");
    setSearchResult([]);
    onClose();
  };

  const handleGroup = (userToAdd) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) {
      toast({
        title: "User already added",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    setSelectedUsers((prev) => [...prev, userToAdd]);
  };

  const handleDelete = (delUser) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== delUser._id));
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query.trim()) {
      setSearchResult([]);
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      // Used `query` directly instead of stale `search`
      const { data } = await api.get(
        `/users?search=${encodeURIComponent(query)}`,
        config,
      );
      setSearchResult(data);
    } catch {
      toast({
        title: "Error Occurred!",
        description: "Failed to load search results",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!groupChatName.trim()) {
      toast({
        title: "Please enter a chat name",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    if (selectedUsers.length < 2) {
      toast({
        title: "Group chats require at least 2 other users",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      setCreating(true);
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.post(
        "/chat/group",
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        config,
      );

      setChats([data, ...chats]);
      handleClose();

      toast({
        title: "New Group Chat Created!",
        status: "success",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    } catch (error) {
      toast({
        title: "Failed to Create the Chat!",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal onClose={handleClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize="28px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >
            Create Group Chat
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody
            display="flex"
            flexDir="column"
            alignItems="center"
            gap={3}
          >
            <FormControl>
              <Input
                placeholder="Group Name"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <Input
                placeholder="Add Users (e.g. John, Jane)"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>

            {/* Selected user badges */}
            <Box w="100%" display="flex" flexWrap="wrap" gap={1}>
              {selectedUsers.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  handleFunction={() => handleDelete(u)}
                />
              ))}
            </Box>

            {/* Search list dropdown */}
            {loading ? (
              <Spinner size="md" my={2} />
            ) : (
              searchResult
                ?.slice(0, 4)
                .map((u) => (
                  <UserListItem
                    key={u._id}
                    user={u}
                    handleFunction={() => handleGroup(u)}
                  />
                ))
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="teal"
              onClick={handleSubmit}
              isLoading={creating}
              loadingText="Creating..."
            >
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GroupChatModal;
