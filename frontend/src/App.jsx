import React from "react";
import { Routes, Route } from "react-router-dom";
import Signup from "./Pages/Signup";
import Chats from "./Pages/Chats";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

const App = () => {
  return (
    <div className="min-h-screen flex App bg-cover bg-center">
      <Routes>
        <Route path="/" element={<Signup />} />

        {/* Protected Dashboard Route */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Chats />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Signup />} />
      </Routes>
    </div>
  );
};

export default App;