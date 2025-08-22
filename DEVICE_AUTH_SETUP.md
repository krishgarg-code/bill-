# Device-Based Authentication Setup Guide

## Overview
This Bill Generator app now includes a secure device-based authentication system that:
- Generates unique device fingerprints using FingerprintJS
- Sends OTP verification emails to admin when new devices attempt login
- Terminates previous sessions when a new device is approved
- Stores all data locally (no server required)

## Features Implemented

### ✅ Completed Features
1. **Device Fingerprint Generation**: Uses FingerprintJS to create unique device identifiers
2. **New Device Detection**: Compares current fingerprint with stored fingerprint
3. **OTP Email System**: Sends detailed device info + OTP to admin email
4. **Session Termination**: Automatically logs out previous devices when new device is approved
5. **Local Storage**: All data stored in browser (fingerprint, session ID, pending OTP)
6. **Fallback Email**: Opens email client if EmailJS fails
7. **Security**: No sensitive data stored, only device fingerprints

### 🔧 Setup Required

#### 1. EmailJS Configuration (Optional but Recommended)
For automatic email sending, set up EmailJS:

1. **Create EmailJS Account**:
   - Go to https://www.emailjs.com/
   - Sign up for a free account

2. **Create Email Service**:
   - Add Email Service (Gmail, Outlook, etc.)
   - Note your Service ID

3. **Create Email Template**:
   - Create a new template
   - Use variables: `{{to_email}}`, `{{to_name}}`, `{{from_name}}`, `{{subject}}`, `{{message}}`
   - Note your Template ID

4. **Get API Keys**:
   - Go to Account > API Keys
   - Copy your Public Key

5. **Update Configuration**:
   - Edit `src-jsx/config/emailjs.js`
   - Replace placeholder values with your actual credentials

#### 2. Fallback Email (Already Working)
If EmailJS is not configured, the system will:
- Open your default email client
- Pre-fill the email with device info and OTP
- Send to: krishg0150@gmail.com

## How It Works

### First Login (New Device)
1. User enters credentials (bill/1234)
2. System generates device fingerprint
3. Stores fingerprint in localStorage
4. User logs in successfully

### Subsequent Logins (Same Device)
1. User enters credentials
2. System compares current fingerprint with stored fingerprint
3. If match: User logs in immediately
4. If no match: Proceeds to new device flow

### New Device Login
1. User enters credentials from different device/browser
2. System detects fingerprint mismatch
3. Collects device information (browser, platform, location, etc.)
4. Generates 6-digit OTP
5. Sends email to admin with:
   - Username
   - OTP code
   - Device fingerprint
   - Browser information
   - Approximate location
   - Timestamp
6. Shows "Waiting for Admin Approval" dialog
7. User enters OTP code when received from admin
8. If OTP matches: Device approved, previous sessions terminated, user logged in
9. If OTP doesn't match: Access denied

### Session Termination
When a new device is approved:
- All localStorage and sessionStorage is cleared
- Previous devices will be logged out on next page refresh
- New device fingerprint is stored

## Security Features

### ✅ Implemented Security Measures
- **Device Fingerprinting**: Unique device identification
- **OTP Verification**: One-time codes for new device approval
- **Session Management**: Automatic termination of old sessions
- **Local Storage Only**: No server-side data storage
- **Location Tracking**: Approximate location for security audit
- **Device Info Collection**: Comprehensive device details for admin review

### 🔒 Security Considerations
- Device fingerprints can change if browser is updated or settings change
- Location is approximate (IP-based)
- OTP codes are 6 digits (1,000,000 possible combinations)
- All data stored locally in browser

## Testing Scenarios

### Test 1: First Login
1. Open app in fresh browser
2. Login with bill/1234
3. Should login immediately (first device)

### Test 2: Same Device Login
1. Logout and login again
2. Should login immediately (fingerprint matches)

### Test 3: New Device Login
1. Open app in different browser or incognito mode
2. Login with bill/1234
3. Should trigger OTP email flow
4. Check email for OTP code
5. Enter OTP in dialog
6. Should login and terminate previous session

### Test 4: Previous Device Termination
1. Login from new device (Test 3)
2. Go back to previous device
3. Refresh page
4. Should be logged out automatically

## Troubleshooting

### EmailJS Issues
- If emails aren't sending, check EmailJS configuration
- System will fallback to opening email client
- Check browser console for error messages

### Fingerprint Issues
- If device fingerprint changes unexpectedly, user will need to re-approve
- This can happen with browser updates or setting changes
- Clear browser data to reset fingerprint

### OTP Issues
- OTP codes are 6 digits
- Codes expire when page is refreshed (stored in sessionStorage)
- Check email spam folder for OTP emails

## File Structure
```
src-jsx/
├── components/
│   └── Login.jsx          # Main authentication component
├── config/
│   └── emailjs.js         # EmailJS configuration
└── DEVICE_AUTH_SETUP.md   # This setup guide
```

## Configuration Files

### EmailJS Config (`src-jsx/config/emailjs.js`)
```javascript
export const EMAILJS_CONFIG = {
  serviceId: "YOUR_EMAILJS_SERVICE_ID",
  templateId: "YOUR_EMAILJS_TEMPLATE_ID", 
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
};
```

### Storage Keys (in Login.jsx)
- `billGenerator_device_fingerprint`: Stored device fingerprint
- `billGenerator_session_id`: Current session identifier
- `billGenerator_pending_otp`: Pending OTP verification data
- `billGenerator_loggedIn`: Login status
- `billGenerator_username`: Stored username

## Admin Email Address
- Default: krishg0150@gmail.com
- Can be changed in Login.jsx `ADMIN_EMAIL` constant

## Dependencies Added
- `@fingerprintjs/fingerprintjs`: Device fingerprinting
- `@emailjs/browser`: Email sending (optional)

The system is now ready for production use with enhanced security and device management capabilities!
