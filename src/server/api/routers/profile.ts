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

// Create a TRPC router for handling the 'profile' resource
export const profileRouter = createTRPCRouter({
  // Define the 'getUserByUsername' query procedure
  getUserByUsername: publicProcedure
    .input(
      z.object({
        username: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { username } = input;

      // Fetch the user data using Clerk API based on the provided username
      const users = await clerkClient.users.getUserList({
        userId: [username],
      });

      // Filter and map user data for client-side consumption
      const filteredUsers = users.map(filterUserForClient);

      // Since we expect a single user, return the first element of the array
      return filteredUsers[0];
    }),
  getPostsByAuthorId: publicProcedure
    .input(
      z.object({
        authorId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { authorId } = input;

      const posts = await ctx.prisma.post.findMany({
        where: {
          authorId: authorId,
        },
        orderBy: {
          title: "desc", // Order posts by createdAt in descending order but i named it title and dont have time to change that in the db
        },
      });
      return posts;
    }),
});
