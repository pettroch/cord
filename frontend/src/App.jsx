// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext"; // Импортируем AuthProvider
import Registration from "./components/Registration";
import Header from "./components/Header";
import WelcomePage from "./components/WelcomePage";
import LoginPage from "./components/Login";
import ChannelPage from "./components/ChannelPage";
import ChannelsPage from "./components/ChannelsPage";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/home" element={<WelcomePage />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/channel/:uuid" element={<ChannelPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
