// Import necessary modules and types
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";

// Define a function to filter user data for client-side consumption
const filterUserForClient = (user: User) => {
  // Return a new object with only the required properties
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
    name: user.firstName + " " + user.lastName,
  };
};

// Create a new ratelimiter, that allows 2 posts per minute
//touch grass nigga
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "1 m"),
  analytics: true,
});

// Create a TRPC router for handling the 'post' resource
export const postRouter = createTRPCRouter({
  // Define the 'getAll' query procedure
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Fetch a list of posts from the database using Prisma
    const posts = await ctx.prisma.post.findMany({
      take: 100, // Limit the number of posts to 10
      orderBy: {
        title: "desc", // Order posts by createdAt in descending order
      },
    });
    console.log(posts);

    // Extract authorIds from posts
    const authorIds = posts.map((post) => post.authorId);

    // Fetch the corresponding users using Clerk API based on authorId of each post,
    // then map and filter user data for client-side consumption
    const users = (
      await clerkClient.users.getUserList({
        userId: authorIds,
      })
    ).map(filterUserForClient); // Filter user data using the 'filterUserForClient' function
    console.log(users);
    // Combine the posts and their respective authors, then return the result
    // Find the corresponding user for each post
    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);
      if (!author) throw new TRPCError({ code: "BAD_REQUEST" });
      console.log(author);
      // Return a new object with the post and its author
      return {
        post,
        author,
      };
    });
  }),

  //create private procedure
  create: privateProcedure
    .input(
      z.object({
        content: z
          .string()
          .emoji({ message: "Post only Emojis sir" })
          .min(1)
          .max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const { success } = await ratelimit.limit(authorId);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You are posting too much",
        });
      }

      console.log(authorId);
      if (!authorId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });
      return post;
    }),
});
