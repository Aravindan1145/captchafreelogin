interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  passwordHash: string;
  irctcUserId: string;
  irctcPassword: string;
  createdAt: string;
}

interface OTPRecord {
  username: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}

const USERS_KEY = 'irctc_users';
const OTP_KEY = 'irctc_otps';
const SESSION_KEY = 'irctc_session';
const MAX_OTP_ATTEMPTS = 5;

// Simple hash function for demo (in production, use bcrypt on backend)
const simpleHash = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Generate IRCTC-style User ID from full name and mobile
const generateIRCTCUserId = (fullName: string, mobile: string): string => {
  const firstName = fullName.split(' ')[0].toLowerCase();
  const lastFourDigits = mobile.slice(-4);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${firstName}${lastFourDigits}${randomNum}`;
};

// Generate IRCTC-style Password
const generateIRCTCPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const registerUser = (fullName: string, email: string, mobile: string, password: string) => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  
  if (users.find(u => u.email === email)) {
    throw new Error('Email already registered');
  }

  if (users.find(u => u.mobile === mobile)) {
    throw new Error('Mobile number already registered');
  }

  const irctcUserId = generateIRCTCUserId(fullName, mobile);
  const irctcPassword = generateIRCTCPassword();

  const newUser: User = {
    id: Date.now().toString(),
    fullName,
    username: irctcUserId, // Use IRCTC User ID as username
    email,
    mobile,
    passwordHash: simpleHash(password),
    irctcUserId,
    irctcPassword,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  return { 
    success: true, 
    irctcUserId, 
    irctcPassword 
  };
};

export const verifyMobileNumber = (mobile: string): { exists: boolean; email: string } => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find(u => u.mobile === mobile);

  if (!user) {
    return { exists: false, email: '' };
  }

  return { exists: true, email: user.email };
};

export const generateOTP = (usernameOrIRCTC: string, password: string): { otp: string; email: string; mobile: string } => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find(u => u.username === usernameOrIRCTC || u.irctcUserId === usernameOrIRCTC);

  if (!user) {
    throw new Error('User not found');
  }

  // Check if password matches original password or IRCTC password
  if (user.passwordHash !== simpleHash(password) && password !== user.irctcPassword) {
    throw new Error('Invalid password');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otps: OTPRecord[] = JSON.parse(localStorage.getItem(OTP_KEY) || '[]');
  
  // Remove old OTP for this user
  const filteredOtps = otps.filter(o => o.username !== usernameOrIRCTC);
  
  filteredOtps.push({
    username: usernameOrIRCTC,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0
  });

  localStorage.setItem(OTP_KEY, JSON.stringify(filteredOtps));
  
  // Simulate sending SMS (in production, this would call an SMS service)
  console.log(`📱 SMS sent to ${user.mobile}: Your OTP is ${otp}`);
  
  return { otp, email: user.email, mobile: user.mobile };
};

export const generateOTPByMobile = (mobile: string): { otp: string; email: string } => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find(u => u.mobile === mobile);

  if (!user) {
    throw new Error('Mobile number not registered');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otps: OTPRecord[] = JSON.parse(localStorage.getItem(OTP_KEY) || '[]');
  
  // Remove old OTP for this user
  const filteredOtps = otps.filter(o => o.username !== user.username);
  
  filteredOtps.push({
    username: user.username,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0
  });

  localStorage.setItem(OTP_KEY, JSON.stringify(filteredOtps));
  
  return { otp, email: user.email };
};

export const verifyOTP = (username: string, otp: string): { success: boolean; token?: string; user?: User } => {
  const otps: OTPRecord[] = JSON.parse(localStorage.getItem(OTP_KEY) || '[]');
  const otpRecord = otps.find(o => o.username === username);

  if (!otpRecord) {
    throw new Error('No OTP found for this user');
  }

  if (Date.now() > otpRecord.expiresAt) {
    throw new Error('OTP has expired');
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    throw new Error('Too many failed attempts');
  }

  if (otpRecord.otp !== otp) {
    otpRecord.attempts++;
    localStorage.setItem(OTP_KEY, JSON.stringify(otps));
    throw new Error('Invalid OTP');
  }

  // Clear OTP after successful verification
  const filteredOtps = otps.filter(o => o.username !== username);
  localStorage.setItem(OTP_KEY, JSON.stringify(filteredOtps));

  // Get user data
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const user = users.find(u => u.username === username || u.irctcUserId === username);

  // Create session token
  const token = btoa(JSON.stringify({ username, timestamp: Date.now() }));
  localStorage.setItem(SESSION_KEY, token);

  return { success: true, token, user };
};

export const getCurrentUser = (): User | null => {
  const token = localStorage.getItem(SESSION_KEY);
  if (!token) return null;

  try {
    const { username } = JSON.parse(atob(token));
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.find(u => u.username === username) || null;
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};
