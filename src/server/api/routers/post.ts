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
import Filter from "bad-words";

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
  limiter: Ratelimit.slidingWindow(10, "1 m"),
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
      console.log(author);

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
        content: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const filter = new Filter();

      if (filter.isProfane(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Content contains profanity",
        });
      }
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


   // const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    //   onSuccess: async () => {
    //     setContent("");
    //     toast.success("post succesfully sent!");
    //     await ctx.posts.getAll.invalidate();
    //   },

    //   onError: (err) => {
    //     //error message from zod
    //     const errorMessage = err.data?.zodError?.fieldErrors?.content?.[0];
    //     if (errorMessage) {
    //       toast.error(errorMessage);
    //     }
    //     //handling error message from server
    //     const errorMessageFromServer = err.data?.code;
    //     console.log(errorMessageFromServer);
    //     if (errorMessageFromServer === "TOO_MANY_REQUESTS") {
    //       toast.error("Touch Grass Omope");
    //     }
    //     if (errorMessageFromServer === "BAD_REQUEST") {
    //       toast.error("You cant say that my guy");
    //     }
    //   },
    // });

    // const { mutate } = api.posts.create.useMutation({
    //   // When mutate is called:
    //   onMutate: async (newPost) => {
    //     // Cancel any outgoing refetches
    //     // (so they don't overwrite our optimistic update)
    //     await queryClient.cancelQueries({ queryKey: ["posts"] });

    //     // Snapshot the previous value
    //     const previousPosts = utils.posts.getAll.getData();
    //     console.log(previousPosts);

    //     // Optimistically update to the new value
    //     // queryClient.setQueryData(['posts'], (old) => [...old, newPost])

    //     // Return a context object with the snapshotted value
    //     return { previousPosts };
    //   },
    //   // If the mutation fails,
    //   // use the context returned from onMutate to roll back
    //   onError: (err, newPost, context) => {
    //     queryClient.setQueryData(["post"], context.previousPosts);
    //   },
    //   // Always refetch after error or success:
    //   onSettled: () => {
    //     queryClient.invalidateQueries({ queryKey: ["posts"] });
    //   },
    // });


    // const {mutate, isLoading: isPosting} = api.posts.create.useMutation({
    //   onMutate: async (newPost) => {
    //     // Cancel any outgoing refetches
    //     // (so they don't overwrite our optimistic update)
    //     await utils.posts.getAll.cancel();
    //     //snapshot a previous value
    //     const posts = api.posts.getAll.useQuery();
    //     const previousPosts = posts.data;
    //     if (previousPoldosts === undefined) {
    //       return;
    //     }
    //     utils.posts.getAll.setData(undefined, (old) => {
    //       return [...old, newPost];
    //     });
    //   },

    //   onSettled: () => api.posts.getAll.useQuery().refetch(),
    // });

    

    // const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    //   onMutate: async (newPost) => {
    //     // Cancel any outgoing refetches
    //     // (so they don't overwrite our optimistic update)
    //     await utils.posts.getAll.cancel();
    
    //     // Snapshot the previous value
    //     const postsQuery = api.posts.getAll.useQuery();
    //     const previousPosts = postsQuery.data;
    
    //     // Return early if previousPosts is undefined
       
    
    //     utils.posts.getAll.setData(undefined, (old) => {
    //       if (previousPosts === undefined) {
    //         return;
    //       }
    //       return [...old, newPost];
    //     });
    //   },
    
    //   onSettled: () => api.posts.getAll.useQuery().refetch(),
    // });