// EmailJS Configuration
// Make sure you have created a service and template in your EmailJS account
// and replace these values with your actual EmailJS credentials

export const EMAILJS_CONFIG = {
  serviceId: "service_daw99fa",      // Your EmailJS service ID
  templateId: "template_xt60509",    // Your EmailJS template ID
  publicKey: "b232HkHiIe8WtB979",    // Your EmailJS public key (User ID)
  // Note: In production, these should be stored in environment variables
};

// Validate configuration on import
if (!EMAILJS_CONFIG.serviceId || !EMAILJS_CONFIG.templateId || !EMAILJS_CONFIG.publicKey) {
  console.error('EmailJS configuration is incomplete. Please check your emailjs.js file.');
}

// Note: For production, use environment variables instead of hardcoded values
// Example with Vite:
// export const EMAILJS_CONFIG = {
//   serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
//   templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
//   publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
// };

// Email Template Variables - Your template must use these:
// - username: Username attempting to login
// - otp_code: The OTP code for verification
// - device_fingerprint: Device fingerprint hash
// - location: Approximate location of the device
// - time: Timestamp of the login attempt

// Your EmailJS template should include these variables:
// {{username}} - Username attempting to login
// {{otp_code}} - The OTP code for verification
// {{device_fingerprint}} - Device fingerprint hash
// {{location}} - Approximate location of the device
// {{time}} - Timestamp of the login attempt
