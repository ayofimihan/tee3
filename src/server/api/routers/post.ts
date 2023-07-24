// Import necessary modules and types
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";

// Define a function to filter user data for client-side consumption
const filterUserForClient = (user: User) => {
  // Return a new object with only the required properties
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

// Create a TRPC router for handling the 'post' resource
export const postRouter = createTRPCRouter({
  // Define the 'getAll' query procedure
  getAll: publicProcedure.query(async ({ ctx }) => {
    // Fetch a list of posts from the database using Prisma
    const posts = await ctx.prisma.post.findMany({
      take: 10, // Limit the number of posts to 10
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
});
