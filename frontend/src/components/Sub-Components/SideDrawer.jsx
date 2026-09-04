import React, { useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

import { chatState } from "../../Context/ChatProvider";
import api from "../../config/api";
import ProfileModal from "./ProfileModal";
import UserListItem from "../User Avatar/UserListItem";
import ChatLoader from "../ChatLoader";
import { getSender } from "../../config/ChatLogics";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const {
    user,
    setUser,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
  } = chatState();

  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const logout = () => {
    localStorage.removeItem("userInfo");
    if (setUser) setUser(null);
    if (setSelectedChat) setSelectedChat(null);
    navigate("/", { replace: true });
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      toast({
        title: "Please enter a search term",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.get(
        `/users?search=${encodeURIComponent(search)}`,
        config,
      );
      setSearchResult(data);
    } catch {
      toast({
        title: "Search failed",
        description: "Could not retrieve users",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await api.post("/chat", { userid: userId }, config);

      if (!chats.some((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }

      setSelectedChat(data);
      onClose();
    } catch (error) {
      toast({
        title: "Error starting chat",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
        w="100%"
        p="8px 16px"
        borderBottomWidth="1px"
      >
        <Tooltip label="Search users to chat" hasArrow placement="bottom-end">
          <Button variant="ghost" onClick={onOpen} leftIcon={<SearchIcon />}>
            <Text display={{ base: "none", md: "flex" }}>Search User</Text>
          </Button>
        </Tooltip>

        <Text fontSize="2xl" fontFamily="Work sans" fontWeight="bold">
          Chat-App
        </Text>

        <Box display="flex" alignItems="center" gap={2}>
          {/* Notifications Menu */}
          <Menu>
            <MenuButton p={1} position="relative">
              <BellIcon fontSize="2xl" m={1} />
              {notification.length > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top="0"
                  right="0"
                >
                  {notification.length}
                </Badge>
              )}
            </MenuButton>
            <MenuList p={2}>
              {!notification.length && <MenuItem>No New Messages</MenuItem>}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(
                      notification.filter((n) => n._id !== notif._id),
                    );
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `Message in ${notif.chat.chatName}`
                    : `Message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* User Profile Menu */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
            >
              <Avatar
                size="sm"
                cursor="pointer"
                name={user?.name}
                src={user?.pic}
              />
            </MenuButton>
            <MenuList>
              <ProfileModal user={user}>
                <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logout} color="red.500">
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      {/* Search Drawer */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
          <DrawerBody>
            <Box display="flex" pb={3} gap={2}>
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} colorScheme="teal">
                Go
              </Button>
            </Box>

            {loading ? (
              <ChatLoader />
            ) : (
              searchResult?.map((u) => (
                <UserListItem
                  key={u._id}
                  user={u}
                  handleFunction={() => accessChat(u._id)}
                />
              ))
            )}
            {loadingChat && <Spinner display="block" mx="auto" my={4} />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideDrawer;
