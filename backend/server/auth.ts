import bcryptjs from "bcryptjs";
import { z } from "zod";
import { getDb, getUserByOpenId } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "studentsitessupport@gmail.com,j9414104@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase());
const SALT_ROUNDS = 10;

/**
 * Check if an email is an admin email
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Sign up a new user with email and password
 */
export async function signupUser(email: string, password: string, name: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Determine role: admin if email matches, otherwise user
  const role = isAdminEmail(email) ? "admin" : "user";

  // Create user
  await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    loginMethod: "email",
    role,
    lastSignedIn: new Date(),
  });

  // Fetch the created user
  const createdUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (createdUser.length === 0) {
    throw new Error("Failed to create user");
  }

  const newUser = createdUser[0];
  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    message: "User created successfully",
  };
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Find user by email
  const userList = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userList.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = userList[0];

  // Check password
  if (!user.password) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Update last signed in
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    message: "Login successful",
  };
}

/**
 * Validate signup input
 */
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

/**
 * Validate login input
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
