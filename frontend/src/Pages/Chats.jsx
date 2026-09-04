import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, useToast } from "@chakra-ui/react";
import { jwtDecode } from "jwt-decode";

import { chatState } from "../Context/ChatProvider";
import SideDrawer from "../components/Sub-Components/SideDrawer";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

const Chats = () => {
  const { user, setUser } = chatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = useCallback(() => {
    localStorage.removeItem("userInfo");
    if (setUser) setUser(null);
    toast({
      title: "Session Expired",
      description: "Please log in again.",
      status: "warning",
      duration: 4000,
      isClosable: true,
      position: "bottom-left",
    });
    navigate("/", { replace: true });
  }, [navigate, setUser, toast]);

  useEffect(() => {
    if (!user?.token) return;

    try {
      const decoded = jwtDecode(user.token);
      const currentTime = Date.now() / 1000;
      const timeLeftInMs = (decoded.exp - currentTime) * 1000;

      if (timeLeftInMs <= 0) {
        handleLogout();
        return;
      }

      // Automatically trigger logout only when token expires
      const timer = setTimeout(() => {
        handleLogout();
      }, timeLeftInMs);

      return () => clearTimeout(timer);
    } catch {
      handleLogout();
    }
  }, [user, handleLogout]);

  return (
    <Box w="100%">
      {user && <SideDrawer />}
      <Box
        display="flex"
        justifyContent="space-between"
        w="100%"
        h="90vh"
        p="10px"
      >
        {user && <MyChats fetchAgain={fetchAgain} />}
        {user && (
          <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
      </Box>
    </Box>
  );
};

export default Chats;
