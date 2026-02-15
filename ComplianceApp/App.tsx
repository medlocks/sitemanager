import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { LogBox } from "react-native";

export default function App() {
  LogBox.ignoreAllLogs();
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
