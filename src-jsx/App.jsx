import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./components/Login";

const queryClient = new QueryClient();

// Create router with future flags
const router = (onLogout) => createBrowserRouter([
  {
    path: "/",
    element: <Index onLogout={onLogout} />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkLoginStatus = () => {
      const isLoggedIn = localStorage.getItem("billGenerator_loggedIn") || sessionStorage.getItem("billGenerator_loggedIn");
      const storedUsername = localStorage.getItem("billGenerator_username") || sessionStorage.getItem("billGenerator_username");
      
      if (isLoggedIn && storedUsername) {
        setIsLoggedIn(true);
        setUsername(storedUsername);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    localStorage.removeItem("billGenerator_loggedIn");
    localStorage.removeItem("billGenerator_username");
    sessionStorage.removeItem("billGenerator_loggedIn");
    sessionStorage.removeItem("billGenerator_username");
  };

  // If not logged in, show login page
  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Login onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // If logged in, show the main app
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router(handleLogout)} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
