// EmailJS Configuration - Production Ready
// Your EmailJS credentials are configured below

// emailConfig.js or a constants file
export const EMAILJS_CONFIG = {
  serviceId: "service_daw99fa",         // ✅ Your EmailJS service ID
  templateId: "template_xt60509",       // ✅ Your EmailJS template ID
  publicKey: "b232HkHiIe8WtB979",        // ✅ Your EmailJS public key
};

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
