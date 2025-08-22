// EmailJS Configuration
// To set up EmailJS:
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Create an Email Service (Gmail, Outlook, etc.)
// 3. Create an Email Template
// 4. Get your Public Key from Account > API Keys
// 5. Replace the values below with your actual credentials

// emailConfig.js or a constants file
export const EMAILJS_CONFIG = {
  serviceId: "service_daw99fa",         // ✅ Your EmailJS service ID
  templateId: "template_xt60509",       // ✅ Your EmailJS template ID
  publicKey: "b232HkHiIe8WtB979",        // ✅ Your EmailJS public key
};

// Email Template Variables:
// - to_email: Admin email address
// - to_name: Admin name
// - from_name: Sender name
// - subject: Email subject
// - message: Email body with device info and OTP
// - username: Username attempting to login
// - otp_code: The OTP code for verification
// - device_fingerprint: Device fingerprint hash
// - location: Approximate location of the device
// - time: Timestamp of the login attempt

// Example EmailJS Template:
/*
Subject: {{subject}}

Hello {{to_name}} 👋,

A new login attempt was detected for your app. Here are the details:

🔑 **OTP Code:** {{otp_code}}

🧍‍♂️ **Username:** {{username}}
🧠 **Device Fingerprint:** {{device_fingerprint}}
🌍 **Location (approx):** {{location}}
🕒 **Time:** {{time}}

---

If this was **you**, please enter the OTP in the app to continue.

If you did **not** request this login, please ignore this message — the new device will not be allowed access.

Stay secure 🔐  
— Your App Security System
*/
