import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { signupUser, loginUser, hashPassword, verifyPassword, isAdminEmail } from "./auth";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Authentication System", () => {
  const testEmail = "test@example.com";
  const adminEmail1 = "studentsitessupport@gmail.com";
  const adminEmail2 = "j9414104@gmail.com";
  const testPassword = "testPassword123";

  beforeAll(async () => {
    // Clean up test user if it exists
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.email, testEmail));
      await db.delete(users).where(eq(users.email, adminEmail1));
      await db.delete(users).where(eq(users.email, adminEmail2));
    }
  });

  afterAll(async () => {
    // Clean up test users
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.email, testEmail));
      await db.delete(users).where(eq(users.email, adminEmail1));
      await db.delete(users).where(eq(users.email, adminEmail2));
    }
  });

  describe("isAdminEmail", () => {
    it("should identify admin emails correctly", () => {
      expect(isAdminEmail(adminEmail1)).toBe(true);
      expect(isAdminEmail(adminEmail2)).toBe(true);
      expect(isAdminEmail("user@example.com")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isAdminEmail(adminEmail1.toUpperCase())).toBe(true);
      expect(isAdminEmail(adminEmail2.toUpperCase())).toBe(true);
    });
  });

  describe("Password Hashing", () => {
    it("should hash passwords", async () => {
      const hash = await hashPassword(testPassword);
      expect(hash).not.toBe(testPassword);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should verify correct passwords", async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect passwords", async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("Signup", () => {
    it("should create a regular user account", async () => {
      const result = await signupUser(testEmail, testPassword, "Test User");
      expect(result.email).toBe(testEmail);
      expect(result.name).toBe("Test User");
      expect(result.role).toBe("user");
      expect(result.message).toBe("User created successfully");
    });

    it("should create an admin account for admin email", async () => {
      const result = await signupUser(adminEmail1, testPassword, "Admin User");
      expect(result.email).toBe(adminEmail1);
      expect(result.role).toBe("admin");
    });

    it("should reject duplicate emails", async () => {
      try {
        await signupUser(testEmail, testPassword, "Another User");
        expect.fail("Should have thrown an error");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        expect(message).toContain("already exists");
      }
    });

    it("should reject weak passwords", async () => {
      try {
        await signupUser("weak@example.com", "short", "User");
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Expected to fail validation
      }
    });
  });

  describe("Login", () => {
    beforeAll(async () => {
      // Create a test user for login tests
      await signupUser("login-test@example.com", testPassword, "Login Test");
    });

    it("should login with correct credentials", async () => {
      const result = await loginUser("login-test@example.com", testPassword);
      expect(result.email).toBe("login-test@example.com");
      expect(result.message).toBe("Login successful");
    });

    it("should reject invalid email", async () => {
      try {
        await loginUser("nonexistent@example.com", testPassword);
        expect.fail("Should have thrown an error");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        expect(message).toContain("Invalid email or password");
      }
    });

    it("should reject incorrect password", async () => {
      try {
        await loginUser("login-test@example.com", "wrongPassword");
        expect.fail("Should have thrown an error");
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        expect(message).toContain("Invalid email or password");
      }
    });

    afterAll(async () => {
      // Clean up
      const db = await getDb();
      if (db) {
        await db.delete(users).where(eq(users.email, "login-test@example.com"));
      }
    });
  });

  describe("Admin Access", () => {
    it("should grant admin role to first admin email on signup", async () => {
      const result = await signupUser(adminEmail2, testPassword, "Admin 2");
      expect(result.role).toBe("admin");
    });

    it("should not grant admin role to non-admin emails", async () => {
      const result = await signupUser("regular@example.com", testPassword, "Regular User");
      expect(result.role).toBe("user");
    });
  });
});
