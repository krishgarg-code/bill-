import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login, { logout } from "./components/Login";

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
      try {
        const sessionData = localStorage.getItem("billgen_user_session");
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session && session.isLoggedIn && session.username) {
            setIsLoggedIn(true);
            setUsername(session.username);
            console.log("🔄 App: Restored user session:", session.username);
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
  };

  const handleLogout = () => {
    // Call the logout function from Login component to clear session
    logout();
    
    // Update local state
    setIsLoggedIn(false);
    setUsername("");
    
    console.log("👋 App: User logged out successfully");
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
