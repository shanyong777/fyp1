import React, { useState, useEffect } from "react";
import { AuthProvider } from "./AuthContext";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import EditorPage from "./EditorPage";
import TemplateSelector from "./TemplateSelector";
import PublishedPage from "./PublishedPage";
import HomePage from "./HomePage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import ProfilePage from "./ProfilePage";
import "./css/App.css";

import Navbar from './Navbar';

import AboutPage from './AboutPage';

import ProjectsPage from './ProjectsPage';

import ContactPage from './ContactPage';

import Footer from './Footer';

function AppShell({ theme, toggleTheme }) {
  const location = useLocation();
  const isEditor = location.pathname.startsWith("/editor");
  const isPublished = location.pathname.startsWith("/site/");
  const hideChrome = isEditor || isPublished;

  return (
    <div className="App">
      {!hideChrome && <Navbar theme={theme} toggleTheme={toggleTheme} />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/editor" element={<TemplateSelector />} />
          <Route
            path="/editor/workspace"
            element={<EditorPage theme={theme} toggleTheme={toggleTheme} />}
          />
          <Route path="/site/:designId" element={<PublishedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.body.className = `${theme}-mode`;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <AuthProvider>
          <AppShell theme={theme} toggleTheme={toggleTheme} />
        </AuthProvider>
      </Router>
    </DndProvider>
  );
}

export default App;
