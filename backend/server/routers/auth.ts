import { publicProcedure, router } from "../_core/trpc";
import { signupUser, loginUser, signupSchema, loginSchema } from "../auth";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  /**
   * Sign up a new user with email and password
   */
  signup: publicProcedure
    .input(signupSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await signupUser(input.email, input.password, input.name);
        return {
          success: true,
          user: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Signup failed";
        throw new TRPCError({
          code: "BAD_REQUEST",
          message,
        });
      }
    }),

  /**
   * Login user with email and password
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await loginUser(input.email, input.password);
        return {
          success: true,
          user: result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message,
        });
      }
    }),
});
