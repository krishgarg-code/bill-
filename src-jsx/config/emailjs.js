// EmailJS Configuration
// To set up EmailJS:
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Create an Email Service (Gmail, Outlook, etc.)
// 3. Create an Email Template
// 4. Get your Public Key from Account > API Keys
// 5. Replace the values below with your actual credentials

export const EMAILJS_CONFIG = {
  serviceId: "YOUR_EMAILJS_SERVICE_ID", // Replace with your EmailJS service ID
  templateId: "YOUR_EMAILJS_TEMPLATE_ID", // Replace with your EmailJS template ID
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY", // Replace with your EmailJS public key
};

// Email Template Variables:
// - to_email: Admin email address
// - to_name: Admin name
// - from_name: Sender name
// - subject: Email subject
// - message: Email body with device info and OTP

// Example EmailJS Template:
/*
Subject: {{subject}}

{{message}}

This is an automated security notification from Bill Generator.
Please verify this login attempt and provide the OTP to the user if approved.

Best regards,
Bill Generator Security System
*/
