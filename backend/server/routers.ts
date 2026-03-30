import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { ordersRouter } from "./routers/orders";
import { paymentsRouter } from "./routers/payments";
import { revisionsRouter } from "./routers/revisions";
import { filesRouter } from "./routers/files";
import { analyticsRouter } from "./routers/analytics";
import { signupUser, loginUser, signupSchema, loginSchema, isAdminEmail } from "./auth";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
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
    isAdmin: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        return {
          isAdmin: isAdminEmail(input.email),
        };
      }),
  }),
  orders: ordersRouter,
  payments: paymentsRouter,
  revisions: revisionsRouter,
  files: filesRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
