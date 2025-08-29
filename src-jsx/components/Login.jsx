import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import emailjs from "@emailjs/browser";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EMAILJS_CONFIG } from "../config/emailjs";

const Login = ({ onLogin }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [enteredOTP, setEnteredOTP] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Storage keys - using a more persistent key name
  const DEVICE_TRUST_KEY = "billgen_trusted_device_uuid";
  const DEVICE_FIRST_LOGIN_KEY = "billgen_device_first_login";
  const USER_SESSION_KEY = "billgen_user_session";
  const PENDING_OTP_KEY = "billGenerator_pending_otp";
  const ADMIN_EMAIL = "krishg0150@gmail.com";

  // Generate a unique device token
  const generateDeviceToken = () => {
    return uuidv4(); // Generates a unique v4 UUID
  };

  // Check if this device has ever been trusted (first time check)
  const isFirstTimeDevice = () => {
    const hasToken = localStorage.getItem(DEVICE_TRUST_KEY);
    const hasFirstLogin = localStorage.getItem(DEVICE_FIRST_LOGIN_KEY);
    return !hasToken && !hasFirstLogin;
  };

  // Check if device is currently trusted
  const isDeviceTrusted = () => {
    const token = localStorage.getItem(DEVICE_TRUST_KEY);
    const firstLogin = localStorage.getItem(DEVICE_FIRST_LOGIN_KEY);
    return !!(token && firstLogin);
  };

  // Trust the current device permanently
  const trustDevice = () => {
    const token = generateDeviceToken();
    const timestamp = new Date().toISOString();
    
    try {
      // Store both the token and first login timestamp
      localStorage.setItem(DEVICE_TRUST_KEY, token);
      localStorage.setItem(DEVICE_FIRST_LOGIN_KEY, timestamp);
      
      console.log("🔐 Device trusted permanently:", {
        token: token,
        timestamp: timestamp,
        key1: DEVICE_TRUST_KEY,
        key2: DEVICE_FIRST_LOGIN_KEY
      });
      
      // Verify storage
      const storedToken = localStorage.getItem(DEVICE_TRUST_KEY);
      const storedTimestamp = localStorage.getItem(DEVICE_FIRST_LOGIN_KEY);
      
      if (storedToken && storedTimestamp) {
        console.log("✅ Device trust stored successfully");
        return { token, timestamp };
      } else {
        console.error("❌ Failed to verify device trust storage");
        return null;
      }
    } catch (error) {
      console.error("❌ Failed to store device trust:", error);
      return null;
    }
  };

  // Session management functions
  const createUserSession = (username) => {
    const sessionData = {
      username: username,
      loginTime: new Date().toISOString(),
      isLoggedIn: true
    };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
    console.log("📝 User session created:", sessionData);
  };

  const getUserSession = () => {
    try {
      const sessionData = localStorage.getItem(USER_SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error("Error reading user session:", error);
      return null;
    }
  };

  const clearUserSession = () => {
    localStorage.removeItem(USER_SESSION_KEY);
    console.log("🗑️ User session cleared");
  };

  const isUserLoggedIn = () => {
    const session = getUserSession();
    return session && session.isLoggedIn === true;
  };

  // Logout function - only clears session, keeps device trust
  const handleLogout = () => {
    clearUserSession();
    console.log("👋 User logged out - device trust maintained");
    // Note: Device trust is preserved, so no OTP needed on next login
  };

  // This function should NOT be called on logout - only for complete device reset
  const clearDeviceTrust = () => {
    localStorage.removeItem(DEVICE_TRUST_KEY);
    localStorage.removeItem(DEVICE_FIRST_LOGIN_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    console.log("🗑️ Device trust and session cleared completely");
  };

  // Generate 6-digit OTP with rate limiting
  const generateOTP = () => {
    const lastOTPTime = sessionStorage.getItem('lastOTPTime');
    const now = Date.now();
    
    // Rate limit: Only allow OTP generation every 30 seconds
    if (lastOTPTime && (now - parseInt(lastOTPTime)) < 30000) {
      const remainingTime = Math.ceil((30000 - (now - parseInt(lastOTPTime))) / 1000);
      throw new Error(`Please wait ${remainingTime} seconds before requesting another OTP`);
    }
    
    // Store current time
    sessionStorage.setItem('lastOTPTime', now.toString());
    
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Collect device information
  const collectDeviceInfo = async () => {
    try {
      // Safe access to navigator properties with fallbacks
      const ua = navigator?.userAgent || 'Unknown Browser';
      const platform = navigator?.platform || 'Unknown Platform';
      const language = navigator?.language || 'en-US';
      const timezone = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || 'UTC';
      const screenRes = window?.screen ? `${window.screen.width}x${window.screen.height}` : 'Unknown';
      
      // Get location information
      let location = "Unknown";
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (response.ok) {
          const data = await response.json();
          location = `${data.city || ""} ${data.region || ""} ${data.country_name || ""} (IP: ${data.ip || "?"})`.trim();
        }
      } catch (error) {
        console.warn("Could not fetch location:", error);
      }

      // Generate a simple device token instead of complex fingerprint
      const deviceToken = generateDeviceToken();

      return {
        userAgent: ua,
        platform,
        language,
        timezone,
        screenResolution: screenRes,
        location,
        timestamp: new Date().toISOString(),
        fingerprint: deviceToken,
      };
    } catch (error) {
      console.error("Failed to collect device info:", error);
      // Return a basic fallback object instead of null
      return {
        userAgent: 'Fallback Browser',
        platform: 'Fallback Platform',
        language: 'en-US',
        timezone: 'UTC',
        screenResolution: 'Unknown',
        location: 'Unknown',
        timestamp: new Date().toISOString(),
        fingerprint: generateDeviceToken(),
      };
    }
  };

  // Send OTP email using EmailJS
  const sendOTPEmail = async (otp, deviceInfo, username) => {
    try {
      // Validate EmailJS configuration
      if (!EMAILJS_CONFIG?.serviceId || !EMAILJS_CONFIG?.templateId || !EMAILJS_CONFIG?.publicKey) {
        throw new Error('EmailJS configuration is incomplete');
      }

      // Enhanced template parameters with all required fields
      const templateParams = {
        to_email: ADMIN_EMAIL,
        to_name: "Admin",
        from_name: "Bill Generator Security",
        username: username,
        otp_code: otp,
        otp: otp, // Alternative variable name
        code: otp, // Another alternative
        verification_code: otp, // Yet another alternative
        location: deviceInfo?.location || 'Unknown Location',
        time: deviceInfo?.timestamp || new Date().toISOString(),
        timestamp: deviceInfo?.timestamp || new Date().toISOString(),
        device_info: `Browser: ${deviceInfo?.userAgent || 'Unknown'}\nPlatform: ${deviceInfo?.platform || 'Unknown'}\nLocation: ${deviceInfo?.location || 'Unknown'}\nTime: ${deviceInfo?.timestamp || new Date().toISOString()}`,
        user_agent: deviceInfo?.userAgent || 'Unknown Browser',
        platform: deviceInfo?.platform || 'Unknown Platform',
        screen_resolution: deviceInfo?.screenResolution || 'Unknown',
        timezone: deviceInfo?.timezone || 'UTC',
        language: deviceInfo?.language || 'en-US',
        subject: `Bill Generator - New Device Login - OTP: ${otp}`,
        message: `🔐 NEW DEVICE LOGIN ATTEMPT

Username: ${username}
OTP Code: ${otp}

📱 Device Information:
• Browser: ${deviceInfo?.userAgent || 'Unknown'}
• Platform: ${deviceInfo?.platform || 'Unknown'}
• Language: ${deviceInfo?.language || 'Unknown'}
• Timezone: ${deviceInfo?.timezone || 'UTC'}
• Screen: ${deviceInfo?.screenResolution || 'Unknown'}
• Location: ${deviceInfo?.location || 'Unknown'}
• Time: ${deviceInfo?.timestamp || new Date().toISOString()}

✅ To approve this device, reply with the OTP code or share it with the user.
❌ To deny access, ignore this email.

---
Bill Generator Security System`
      };

      console.log('Attempting to send email via EmailJS...');
      console.log('Template parameters being sent:', {
        username: templateParams.username,
        otp_code: templateParams.otp_code,
        location: templateParams.location,
        time: templateParams.time,
        device_info: templateParams.device_info
      });

      // Send email using EmailJS
      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      console.log('Email sent successfully:', result);
      
      toast({
        title: "OTP Email Sent!",
        description: `Verification code sent to ${ADMIN_EMAIL}`,
        duration: 5000,
      });
      
      return true;
    } catch (error) {
      console.error("EmailJS Error:", error);
      
      // Show OTP directly to user as fallback
      toast({
        title: "Email Service Unavailable",
        description: `Your OTP code is: ${otp}. Please use this code to verify your device.`,
        duration: 15000,
      });
      
      // Also try to open email client as backup
      const subject = encodeURIComponent(`Bill Generator Login - OTP: ${otp}`);
      const body = encodeURIComponent(`Username: ${username}\nOTP Code: ${otp}\nTime: ${new Date().toISOString()}`);
      
      try {
        window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank');
      } catch (mailError) {
        console.warn('Could not open email client:', mailError);
      }
      
      return false;
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check credentials
      if (formData.username === "modiconcast" && formData.password === "concast2025") {
        console.log("✅ Credentials valid - checking device trust status...");
        
        // Check if this device is already trusted
        const isTrusted = isDeviceTrusted();
        const isFirstTime = isFirstTimeDevice();
        
        console.log("🔍 Device status:", {
          isTrusted: isTrusted,
          isFirstTime: isFirstTime,
          trustKey: DEVICE_TRUST_KEY,
          firstLoginKey: DEVICE_FIRST_LOGIN_KEY
        });
        
        if (isTrusted) {
          // Device is already trusted - direct login
          console.log("🔑 Device is trusted - direct login");
          
          // Create user session to persist login state
          createUserSession(formData.username);
          
          toast({
            title: "Welcome Back!",
            description: "Trusted device detected - logging you in...",
            duration: 2000,
          });
          onLogin();
          return;
        }
        
        // Device needs OTP verification (first time or not trusted)
        console.log("🔐 Device requires OTP verification");
        const deviceInfo = await collectDeviceInfo();
        const otp = generateOTP();
        
        setOtpCode(otp);
        setShowOTPDialog(true);
        
        // Store pending OTP data
        sessionStorage.setItem(PENDING_OTP_KEY, JSON.stringify({
          otp,
          username: formData.username,
          remember: formData.remember,
          deviceInfo,
          timestamp: Date.now(),
          expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes expiration
          isFirstTime: isFirstTime
        }));

        // Send OTP email
        await sendOTPEmail(otp, deviceInfo, formData.username);

        toast({
          title: isFirstTime ? "First Time Login" : "Device Verification Required", 
          description: "A verification code has been sent to the admin email.",
          duration: 5000,
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!enteredOTP || enteredOTP.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOTP(true);

    try {
      const pendingData = JSON.parse(sessionStorage.getItem(PENDING_OTP_KEY) || '{}');
      
      // Check if OTP has expired
      if (Date.now() > (pendingData.expiresAt || 0)) {
        toast({
          title: "OTP Expired",
          description: "The OTP has expired. Please try logging in again.",
          variant: "destructive",
        });
        setShowOTPDialog(false);
        setEnteredOTP("");
        sessionStorage.removeItem(PENDING_OTP_KEY);
        return;
      }

      // Verify OTP
      if (enteredOTP === pendingData.otp) {
        console.log("✅ OTP verified successfully - permanently trusting device");
        
        // Trust this device permanently
        const trustResult = trustDevice();
        
        if (trustResult) {
          console.log("🔐 Device permanently trusted:", trustResult);
          
          // Create user session to persist login state
          createUserSession(pendingData.username);
          
          // Clear pending OTP data
          sessionStorage.removeItem(PENDING_OTP_KEY);
          setShowOTPDialog(false);
          setEnteredOTP("");
          setOtpCode("");

          toast({
            title: "Device Trusted Successfully!",
            description: "This device is now trusted. You won't need OTP again, even after logout.",
            duration: 6000,
          });

          console.log("🎉 Device trust established - logging in");
          onLogin();
        } else {
          console.error("❌ Failed to establish device trust");
          toast({
            title: "Trust Error",
            description: "Could not establish device trust. Please try again.",
            variant: "destructive",
            duration: 5000,
          });
        }
      } else {
        toast({
          title: "Invalid OTP",
          description: "The OTP code is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Cancel OTP verification
  const cancelOTPVerification = () => {
    sessionStorage.removeItem(PENDING_OTP_KEY);
    setShowOTPDialog(false);
    setOtpCode("");
    setEnteredOTP("");
    
    toast({
      title: "Verification Cancelled",
      description: "OTP verification has been cancelled.",
      variant: "destructive",
    });
  };

  // Check for existing session on component mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const session = getUserSession();
        const isTrusted = isDeviceTrusted();
        
        console.log("🔍 Checking existing session:", {
          hasSession: !!session,
          isLoggedIn: session?.isLoggedIn,
          isTrusted: isTrusted,
          username: session?.username
        });
        
        // If user has an active session and device is trusted, auto-login
        if (session && session.isLoggedIn && isTrusted) {
          console.log("🔄 Auto-login: Valid session found, logging in automatically");
          toast({
            title: "Welcome Back!",
            description: `Restoring your session...`,
            duration: 2000,
          });
          onLogin();
        } else {
          console.log("👤 Manual login required");
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    checkExistingSession();
  }, [onLogin]);

  // EmailJS is initialized automatically when imported
  // No need for manual initialization with the latest version

  // Cleanup expired OTPs on page load
  useEffect(() => {
    const pendingData = sessionStorage.getItem(PENDING_OTP_KEY);
    if (pendingData) {
      try {
        const { expiresAt } = JSON.parse(pendingData);
        if (expiresAt && Date.now() > expiresAt) {
          sessionStorage.removeItem(PENDING_OTP_KEY);
          console.log("Expired OTP cleaned up");
        }
      } catch (error) {
        console.error("Error cleaning up expired OTP:", error);
      }
    }
  }, []);

  // Restore pending OTP state on page reload
  useEffect(() => {
    const pendingData = sessionStorage.getItem(PENDING_OTP_KEY);
    if (pendingData) {
      try {
        const { otp } = JSON.parse(pendingData);
        setOtpCode(otp);
        setShowOTPDialog(true);
      } catch (error) {
        console.error("Failed to restore pending OTP state:", error);
        sessionStorage.removeItem(PENDING_OTP_KEY);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-transparent to-orange-600/5"></div>
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-600 rounded-full animate-float-1 opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-orange-500 rounded-full animate-float-2 opacity-40"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-orange-400 rounded-full animate-float-3 opacity-50"></div>
        <div className="absolute top-2/3 right-1/3 w-2.5 h-2.5 bg-orange-700 rounded-full animate-float-4 opacity-30"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-orange-600 rounded-full animate-float-5 opacity-45"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-orange-600/30 shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-all duration-700 ease-out relative">
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-600/20 via-orange-500/10 to-orange-600/20 blur-xl"></div>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-600/10 via-transparent to-orange-600/10"></div>
          
          <div className="relative bg-black/80 backdrop-blur-xl rounded-3xl overflow-hidden">
            <div className="flex flex-col lg:flex-row min-h-[650px]">
              {/* Left Side - Orange Gradient Background */}
              <div className="lg:w-1/2 bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 p-6 sm:p-8 lg:p-12 flex items-center justify-center relative overflow-hidden">
                {/* Subtle overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
                
                <div className="relative z-10 text-center text-white">
                  {/* Circular icon at the top */}
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border-2 border-white/30 animate-bounce-slow hover:scale-110 transition-all duration-300 shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  
                  {/* Large bold WELCOME text */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-wider animate-fade-in-up text-shadow-lg">
                    WELCOME !!
                  </h1>
                  
                  {/* Short description */}
                  <p className="text-base sm:text-lg lg:text-xl opacity-95 mb-6 sm:mb-10 leading-relaxed max-w-xs sm:max-w-sm mx-auto animate-fade-in-up animation-delay-200 font-medium">
                    Experience the future of bill generation with our cutting-edge platform. 
                    Secure, fast, and designed for efficiency.
                  </p>
                  
                  {/* Three feature points */}
                  <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap animate-fade-in-up animation-delay-400">
                    <div className="flex flex-col items-center gap-3 group hover:scale-105 transition-transform duration-200">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 rounded-full flex items-center justify-center group-hover:bg-white/35 transition-all duration-200 shadow-md flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <span className="text-white font-medium text-sm sm:text-base text-center">Secure Access</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-3 group hover:scale-105 transition-transform duration-200">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 rounded-full flex items-center justify-center group-hover:bg-white/35 transition-all duration-200 shadow-md flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-white font-medium text-sm sm:text-base text-center">Lightning Fast</span>
                    </div>
                    
                    <div className="flex flex-col items-center gap-3 group hover:scale-105 transition-transform duration-200">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/25 rounded-full flex items-center justify-center group-hover:bg-white/35 transition-all duration-200 shadow-md flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-white font-medium text-sm sm:text-base text-center">Responsive Design</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Dark Background with Sign In Form */}
              <div className="lg:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-black/90">
                <div className="text-center mb-10 animate-fade-in-up animation-delay-300">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3">
                    login 
                  </h2>
                  <p className="text-neutral-300 text-base sm:text-lg">
                    Enter your credentials to access Bill Generator
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 animate-fade-in-up animation-delay-500">
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-neutral-300 text-sm font-medium">
                      Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 group-focus-within:scale-110">
                        <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-black/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-300 hover:border-neutral-500 hover:shadow-[0_0_15px_rgba(251,146,60,0.3)] focus:shadow-[0_0_20px_rgba(251,146,60,0.4)] shadow-sm"
                        placeholder="Username"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-neutral-300 text-sm font-medium">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 group-focus-within:scale-110">
                        <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className="w-full pl-12 pr-12 py-3 bg-black/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-300 hover:border-neutral-500 hover:shadow-[0_0_15px_rgba(251,146,60,0.3)] focus:shadow-[0_0_20px_rgba(251,146,60,0.4)] shadow-sm"
                          placeholder="Password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-orange-500 transition-colors duration-200"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="relative flex items-center gap-3 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={formData.remember}
                        onChange={(e) => handleInputChange("remember", e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-md border border-neutral-700 bg-black/60 ring-1 ring-inset ring-neutral-700 transition-all duration-200 group-hover:border-neutral-500 group-hover:ring-neutral-600 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500/40 peer-checked:bg-orange-600 peer-checked:border-orange-600 peer-checked:shadow-[0_0_12px_rgba(251,146,60,0.6)]"></span>
                      <svg className="pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white opacity-0 transition-opacity duration-200 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                      <span className="text-neutral-300 text-sm group-hover:text-white transition-colors duration-200">Remember me</span>
                    </label>
                    
                    <a href="#" className="text-orange-500 hover:text-orange-400 text-sm transition-colors duration-200 hover:scale-105 transform font-medium" onClick={(e) => { e.preventDefault(); setShowForgot(true); }}>
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-lg">Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3 text-lg">
                        <span>Get access</span>
                        <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </button>
                  

                  
                </form>

                <div className="mt-10 text-center animate-fade-in-up animation-delay-700">
                  <p className="text-neutral-400 text-base">
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forgot password dialog */}
        <Dialog open={showForgot} onOpenChange={setShowForgot}>
          <DialogContent className="sm:max-w-md bg-black/90 border border-orange-600/30 text-white rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(251,146,60,0.15)] p-0 overflow-hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
            <div className="px-6 pt-6 pb-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600/20 ring-1 ring-orange-600/30 shadow-[0_0_18px_rgba(251,146,60,0.35)]">
                <svg className="h-7 w-7 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <DialogHeader className="text-center space-y-2">
                <DialogTitle className="text-xl font-semibold">Password Recovery</DialogTitle>
                <DialogDescription className="text-neutral-300 leading-relaxed">
                  Please contact the admin to recover or reset your password. Thank you!!
                </DialogDescription>
              </DialogHeader>
            </div>
            <DialogFooter className="px-6 pb-6">
              <button onClick={() => setShowForgot(false)} className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(251,146,60,0.35)] hover:from-orange-700 hover:to-orange-600 transition-all">
                OK
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* OTP Verification Dialog */}
        <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
          <DialogContent className="sm:max-w-md bg-black/90 border border-orange-600/30 text-white rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(251,146,60,0.15)] p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600/20 ring-1 ring-orange-600/30 shadow-[0_0_18px_rgba(251,146,60,0.35)]">
                <svg className="h-7 w-7 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <DialogHeader className="text-center space-y-2">
                <DialogTitle className="text-xl font-semibold">New Device Detected</DialogTitle>
                <DialogDescription className="text-neutral-300 leading-relaxed">
                  A new device is attempting to log in. An OTP has been sent to the admin email. Please enter the OTP code to verify this device.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="px-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-neutral-300 text-sm font-medium">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  value={enteredOTP}
                  onChange={(e) => setEnteredOTP(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-black/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-300 text-center text-lg tracking-widest"
                />
              </div>
            </div>
            
            <DialogFooter className="px-6 pb-6 grid grid-cols-2 gap-3">
              <button 
                onClick={cancelOTPVerification}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-medium text-white border border-neutral-700 hover:bg-neutral-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={verifyOTP}
                disabled={isVerifyingOTP || !enteredOTP.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_rgba(251,146,60,0.35)] hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingOTP ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify OTP"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Export logout function for use in main app
export { Login as default };
export const logout = () => {
  localStorage.removeItem("billgen_user_session");
  console.log("👋 User logged out - session cleared");
};
