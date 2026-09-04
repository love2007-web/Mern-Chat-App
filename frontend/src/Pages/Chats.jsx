import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, useToast } from "@chakra-ui/react";
import { jwtDecode } from "jwt-decode";

import { chatState } from "../Context/ChatProvider";
import SideDrawer from "../components/Sub-Components/SideDrawer";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

// 32-bit integer limit for setTimeout (~24.8 days)
const MAX_TIMEOUT_MS = 2147483647;

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

      // Check if already expired
      if (decoded.exp && decoded.exp <= currentTime) {
        handleLogout();
        return;
      }

      // Safe timeout (cap at 24.8 days to prevent 32-bit integer overflow)
      if (decoded.exp) {
        const timeLeftInMs = (decoded.exp - currentTime) * 1000;
        const safeDelay = Math.min(timeLeftInMs, MAX_TIMEOUT_MS);

        const timer = setTimeout(() => {
          // Re-check when the timer fires
          if ((decoded.exp - Date.now() / 1000) <= 0) {
            handleLogout();
          }
        }, safeDelay);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("Invalid token format:", error);
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