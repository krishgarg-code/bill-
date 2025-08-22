import React, { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
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

  // Storage keys
  const DEVICE_FINGERPRINT_KEY = "billGenerator_device_fingerprint";
  const PENDING_OTP_KEY = "billGenerator_pending_otp";
  const ADMIN_EMAIL = "krishg0150@gmail.com";

  // Generate device fingerprint
  const generateDeviceFingerprint = async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      console.log("Generated fingerprint:", result.visitorId);
      return result.visitorId;
    } catch (error) {
      console.error("Failed to generate device fingerprint:", error);
      throw new Error("Device fingerprint generation failed");
    }
  };

  // Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Collect device information
  const collectDeviceInfo = async () => {
    try {
      const ua = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const screenRes = `${window.screen.width}x${window.screen.height}`;
      
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

      return {
        userAgent: ua,
        platform,
        language,
        timezone,
        screenResolution: screenRes,
        location,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to collect device info:", error);
      return null;
    }
  };

  // Send OTP email using EmailJS
  const sendOTPEmail = async (otp, deviceInfo, username) => {
    console.log("Attempting to send OTP email via EmailJS...");
    console.log("EmailJS Config:", EMAILJS_CONFIG);
    
    try {
      const templateParams = {
        to_email: ADMIN_EMAIL,
        to_name: "Admin",
        from_name: "Bill Generator Security",
        subject: `Bill Generator - New Device Login - OTP: ${otp}`,
        message: `
🔐 NEW DEVICE LOGIN ATTEMPT

Username: ${username}
OTP Code: ${otp}

📱 Device Information:
• Browser: ${deviceInfo.userAgent}
• Platform: ${deviceInfo.platform}
• Language: ${deviceInfo.language}
• Timezone: ${deviceInfo.timezone}
• Screen: ${deviceInfo.screenResolution}
• Location: ${deviceInfo.location}
• Time: ${deviceInfo.timestamp}

✅ To approve this device, reply with the OTP code or share it with the user.

❌ To deny access, ignore this email.

---
Bill Generator Security System
        `,
        // Add these variables that your template expects
        username: username,
        otp_code: otp,
        device_fingerprint: deviceInfo.fingerprint || 'N/A',
        location: deviceInfo.location || 'N/A',
        time: deviceInfo.timestamp || new Date().toISOString(),
      };

      console.log("Template params:", templateParams);

      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      console.log("EmailJS email sent successfully:", result);
      toast({
        title: "OTP Email Sent!",
        description: `OTP: ${otp} - Check your email at ${ADMIN_EMAIL}`,
        duration: 8000,
      });
      
      return true;
    } catch (error) {
      console.error("Failed to send OTP email via EmailJS:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        text: error.text
      });
      
      // Fallback: Open email client with prefilled content
      const subject = encodeURIComponent(`Bill Generator - New Device Login - OTP: ${otp}`);
      const body = encodeURIComponent(`
🔐 NEW DEVICE LOGIN ATTEMPT

Username: ${username}
OTP Code: ${otp}

📱 Device Information:
• Browser: ${deviceInfo.userAgent}
• Platform: ${deviceInfo.platform}
• Language: ${deviceInfo.language}
• Timezone: ${deviceInfo.timezone}
• Screen: ${deviceInfo.screenResolution}
• Location: ${deviceInfo.location}
• Time: ${deviceInfo.timestamp}

✅ To approve this device, reply with the OTP code or share it with the user.

❌ To deny access, ignore this email.

---
Bill Generator Security System
      `);
      
      window.open(`mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`, '_blank');
      
      toast({
        title: "EmailJS Failed - Using Fallback",
        description: `OTP: ${otp} - Email client opened as fallback. Error: ${error.message}`,
        duration: 8000,
      });
      
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
      if (formData.username === "bill" && formData.password === "1234") {
        const currentFingerprint = await generateDeviceFingerprint();
        const storedFingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
        
        console.log("Login attempt:", {
          currentFingerprint,
          storedFingerprint,
          isNewDevice: !storedFingerprint,
          isSameDevice: storedFingerprint === currentFingerprint
        });

        if (!storedFingerprint) {
          // First login - store fingerprint and proceed
          localStorage.setItem(DEVICE_FINGERPRINT_KEY, currentFingerprint);
          
          // Store login state
          if (formData.remember) {
            localStorage.setItem("billGenerator_loggedIn", "true");
            localStorage.setItem("billGenerator_username", formData.username);
          } else {
            sessionStorage.setItem("billGenerator_loggedIn", "true");
            sessionStorage.setItem("billGenerator_username", formData.username);
          }

          toast({
            title: "Login Successful!",
            description: `Welcome back, ${formData.username}!`,
            duration: 2000,
          });

          onLogin(formData.username);
        } else if (storedFingerprint === currentFingerprint) {
          // Same device - proceed with login
          if (formData.remember) {
            localStorage.setItem("billGenerator_loggedIn", "true");
            localStorage.setItem("billGenerator_username", formData.username);
          } else {
            sessionStorage.setItem("billGenerator_loggedIn", "true");
            sessionStorage.setItem("billGenerator_username", formData.username);
          }

          toast({
            title: "Login Successful!",
            description: `Welcome back, ${formData.username}!`,
            duration: 2000,
          });

          onLogin(formData.username);
        } else {
          // New device detected - require OTP verification
          const deviceInfo = await collectDeviceInfo();
          const otp = generateOTP();
          
          setOtpCode(otp);
          setShowOTPDialog(true);
          
          // Store pending OTP in session storage
          sessionStorage.setItem(PENDING_OTP_KEY, JSON.stringify({
            otp,
            fingerprint: currentFingerprint,
            username: formData.username,
            remember: formData.remember,
            deviceInfo,
            timestamp: Date.now(),
          }));

          // Send OTP email
          await sendOTPEmail(otp, deviceInfo, formData.username);

          toast({
            title: "New Device Detected",
            description: "OTP sent to admin email. Please wait for approval.",
            duration: 5000,
          });
        }
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
    if (!enteredOTP.trim()) {
      toast({
        title: "OTP Required",
        description: "Please enter the OTP code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOTP(true);

    try {
      const pendingData = sessionStorage.getItem(PENDING_OTP_KEY);
      if (!pendingData) {
        throw new Error("No pending OTP found");
      }

      const { otp, fingerprint, username, remember, deviceInfo } = JSON.parse(pendingData);

      console.log("OTP comparison:", { 
        enteredOTP: enteredOTP.trim(), 
        expectedOTP: otp, 
        matches: enteredOTP.trim() === otp 
      });

      if (enteredOTP.trim() === otp) {
        // OTP verified - approve new device
        localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
        
        // Clear any existing sessions
        localStorage.removeItem("billGenerator_loggedIn");
        localStorage.removeItem("billGenerator_username");
        sessionStorage.removeItem("billGenerator_loggedIn");
        sessionStorage.removeItem("billGenerator_username");
        
        // Store login state
        if (remember) {
          localStorage.setItem("billGenerator_loggedIn", "true");
          localStorage.setItem("billGenerator_username", username);
        } else {
          sessionStorage.setItem("billGenerator_loggedIn", "true");
          sessionStorage.setItem("billGenerator_username", username);
        }

        // Clear pending data
        sessionStorage.removeItem(PENDING_OTP_KEY);
        setShowOTPDialog(false);
        setOtpCode("");
        setEnteredOTP("");

        toast({
          title: "Device Approved!",
          description: "New device has been approved and logged in.",
          duration: 3000,
        });

        onLogin(username);
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

  // Check if user is already logged in (and fingerprint matches)
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const isLoggedIn = localStorage.getItem("billGenerator_loggedIn") || sessionStorage.getItem("billGenerator_loggedIn");
        const username = localStorage.getItem("billGenerator_username") || sessionStorage.getItem("billGenerator_username");
        const storedFingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);

        if (isLoggedIn && username && storedFingerprint) {
          const currentFingerprint = await generateDeviceFingerprint();
          
          if (storedFingerprint === currentFingerprint) {
            onLogin(username);
          } else {
            // Device fingerprint changed - clear session
            localStorage.removeItem("billGenerator_loggedIn");
            localStorage.removeItem("billGenerator_username");
            sessionStorage.removeItem("billGenerator_loggedIn");
            sessionStorage.removeItem("billGenerator_username");
            
            toast({
              title: "Device Changed",
              description: "Please log in again from this device.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    checkExistingSession();
  }, [onLogin]);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    console.log("EmailJS initialized with public key:", EMAILJS_CONFIG.publicKey);
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
                    Sign in 
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
                      <input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-black/50 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-300 hover:border-neutral-500 hover:shadow-[0_0_15px_rgba(251,146,60,0.3)] focus:shadow-[0_0_20px_rgba(251,146,60,0.4)] shadow-sm"
                        placeholder="Password"
                        required
                      />
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
                        <span>Login</span>
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

export default Login;
