import { cookies } from "next/headers";
import { 
  SessionData,
  UserData,
  createSession, 
  createUser, 
  deleteSession, 
  getUserByEmail, 
  getUserById,
  getSessionByToken
} from "./redis";

// Constants
const SESSION_TOKEN_NAME = "session_token";
const ACCESS_TOKEN_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days in seconds

// Educational domain validation
const EDUCATIONAL_DOMAINS = [
  // USA
  "edu",
  // UK
  "ac.uk",
  // Australia
  "edu.au",
  // Canada
  "edu.ca",
  // China
  "edu.cn",
  // Malaysia
  "edu.my",
  // Singapore
  "edu.sg",
  // India
  "ac.in",
  "edu.in",
  // Hong Kong
  "edu.hk",
  // Japan
  "ac.jp",
  // Add more domains as needed
];

/**
 * Validates if an email is from an educational institution
 */
export function isEducationalEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  
  const domain = email.split('@')[1].toLowerCase();
  
  // Check for exact matches of educational domains
  if (EDUCATIONAL_DOMAINS.some(eduDomain => domain.endsWith('.' + eduDomain) || domain === eduDomain)) {
    return true;
  }
  
  // Check for university/college/edu keywords in domain
  const keywords = ['university', 'college', 'school', 'institute', 'academy', 'edu'];
  if (keywords.some(keyword => domain.includes(keyword))) {
    return true;
  }
  
  return false;
}

/**
 * Checks if an email is from a educational institution using a third-party API
 * This can be used as a fallback or additional verification
 */
export async function verifyEducationalEmailWithAPI(email: string): Promise<boolean> {
  try {
    // Option 1: Use Abstract API's email validation with education check
    // Requires API key from https://www.abstractapi.com/api/email-verification-validation-api
    const apiKey = process.env.ABSTRACT_API_KEY;
    if (apiKey) {
      const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      // Check if the domain appears to be from an educational institution
      if (data.is_valid && data.domain && typeof data.domain === 'string' && data.domain.endsWith('.edu')) {
        return true;
      }
    }
    
    // Fallback to basic validation if API call fails or returns false
    return isEducationalEmail(email);
  } catch (error) {
    console.error("Error verifying educational email with API:", error);
    // Fallback to basic validation
    return isEducationalEmail(email);
  }
}

/**
 * Registers a new user
 */
export async function registerUser({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}): Promise<UserData | null> {
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }
  
  // Validate if it's an educational email
  const isEduEmail = await verifyEducationalEmailWithAPI(email);
  if (!isEduEmail) {
    throw new Error("Only educational email addresses are allowed");
  }
  
  // Temporarily using simple password hashing until bcrypt is installed
  const hashedPassword = await hashPassword(password);
  
  // Create user with a new UUID-like ID
  const userId = generateId();
  const user = await createUser({
    id: userId,
    email,
    name,
    hashedPassword,
    emailVerified: false,
  });
  
  return user;
}

/**
 * Authenticates a user
 */
export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ user: UserData }> {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }
  
  // Check password using simple comparison until bcrypt is installed
  const isPasswordValid = await comparePasswords(password, user.hashedPassword);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }
  
  // Create a session token
  const sessionToken = generateId();
  const expires = new Date(Date.now() + ACCESS_TOKEN_EXPIRES_IN * 1000);
  
  await createSession(user.id, sessionToken, expires);
  
  // Set session cookie using cookies API
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_TOKEN_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
  
  return { user };
}

/**
 * Logs out a user
 */
export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_TOKEN_NAME);
  
  if (sessionCookie?.value) {
    await deleteSession(sessionCookie.value);
    cookieStore.delete(SESSION_TOKEN_NAME);
  }
}

/**
 * Gets the current authenticated user
 */
export async function getCurrentUser(): Promise<UserData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_TOKEN_NAME);
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    const session = await getSessionByToken(sessionCookie.value);
    if (!session || new Date() > new Date(session.expires)) {
      return null;
    }
    
    const user = await getUserById(session.userId);
    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// Temporary simple password hashing function until bcrypt is installed
async function hashPassword(password: string): Promise<string> {
  // In a real implementation, use bcrypt instead of this simple encoding
  return Buffer.from(password).toString('base64');
}

// Temporary simple password comparison until bcrypt is installed
async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  // In a real implementation, use bcrypt.compare instead of this simple comparison
  return Buffer.from(plainPassword).toString('base64') === hashedPassword;
}

// Generate a simple ID until uuid is installed
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
} 