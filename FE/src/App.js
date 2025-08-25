import React from "react";
import "./App.css";
import AppRouter from "./AppRouter";
import { AuthProvider } from "./AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";

const App = () => {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <AppRouter />
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;
