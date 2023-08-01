import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import { useAuth } from "@clerk/nextjs";
import { RouterOutputs } from "~/utils/api";
import Image from "next/image";
import { LoadingScreen } from "./components/loader";
import { SmallLoadingSpinner } from "./components/loader";
import { useState as UseState, useState } from "react";
import { toast } from "react-hot-toast";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { GetServerSidePropsContext } from "next";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { data, isLoading } = api.posts.getAll.useQuery();
  if (isLoading) {
    return <LoadingScreen />;
  }

  console.log(data);

  function CreatePostWizard() {
    const [content, setContent] = UseState("");
    const ctx = api.useContext();
    const { user } = useUser();
    const queryClient = useQueryClient();
    const utils = api.useContext();

    type optimisticPost = {
      id: string;
      title: Date;
      content: string | null;
      authorId: string;
    }[];

    // This query that fetches all posts, is the ones cache we play with.
    const postsQuery = api.posts.getAll.useQuery();

    const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
      onMutate: async (newPost) => {
        // optimistically update the cache
        await utils.posts.getAll.cancel(); // Cancel any outgoing refetches

        // Snapshot the previous value
        const previousPosts = utils.posts.getAll.getData();

        const fakeId = Math.random().toString();

        const optimisticPost: optimisticPost = [
          {
            id: "1",
            title: new Date(),
            content: "This is the content of the post",
            authorId: "user_2TAzpA7V1ymtk5HFAnr5IbkFd0W",
          },
        ];

        // Optimistically update with the new value by setting the cache
        utils.posts.getAll.setData(undefined, (old: any) => {
          return [...(old ?? []), ...optimisticPost];
        });

        // Return a context object with the snapshotted value
        return { previousPosts };
      },

      onError: (_err, _newPost, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back!
        utils.posts.getAll.setData(
          undefined,
          (old) => context?.previousPosts ?? old
        );
      },

      onSettled: async () => {
        // make sure to invalidate when done
        await utils.posts.getAll.invalidate();
      },
    });

    console.log(user?.id);
    if (!user) {
      return;
    }
    return (
      <div className="flex border border-pink-200 pl-3">
        {" "}
        <div className=" p-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-12 h-12",
              },
            }}
          />{" "}
        </div>
        <input
          type="text"
          placeholder="kilon shele?"
          className="  w-full  bg-transparent outline-none "
          onChange={(e) => setContent(e.target.value)}
          value={content}
          disabled={isPosting}
        />
        {content !== "" && (
          <button
            className="pr-4"
            onClick={() => mutate({ content })}
            disabled={isPosting}
          >
            {isPosting ? <SmallLoadingSpinner /> : "Post"}
          </button>
        )}
      </div>
    );
  }

  type PostWithUser = RouterOutputs["posts"]["getAll"][number];
  const PostView = (props: PostWithUser) => {
    const { post, author } = props;

    function timeOfPost() {
      const time = post.title;
      console.log(time);
      const formattedTime = new Date(time).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
      console.log(formattedTime);

      const currentTime = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
      console.log(currentTime);
      const timeDifference =
        new Date(currentTime).getTime() - new Date(formattedTime).getTime();
      console.log(timeDifference);
      const timeDifferenceInMinutes = timeDifference / 60000;
      console.log(timeDifferenceInMinutes);
      const timeDifferenceInHours = timeDifferenceInMinutes / 60;
      console.log(timeDifferenceInHours);
      const roundedTime = Math.round(timeDifferenceInHours);
      if (timeDifferenceInHours < 1) {
        return `${Math.round(timeDifferenceInMinutes)}m`;
      }
      return `${roundedTime}h`;
    }
    return (
      <div key={post.id} className="flex border border-pink-200 p-3 ">
        <div className="h-14 w-14">
          <Link href={`/${post.authorId}`}>
            {" "}
            <Image
              src={author.profileImageUrl}
              alt="profileimage"
              width={200}
              height={200}
              className="rounded-full p-2"
            />{" "}
          </Link>
        </div>

        <div className="ml-3 flex flex-1 flex-col">
          <div className="flex gap-2 text-xs">
            <Link href={`/${post.authorId}`}>
              <div className="text-xs text-pink-100">{`@${
                author.username ?? author.name
              }`}</div>{" "}
            </Link>
            ·
            <div className="font-thin">
              {" "}
              <Link href={`/post/${post.id}`}>{timeOfPost()} </Link>
            </div>
          </div>
          <div className="flex items-center p-2">
            <div className=" break-all">{post.content}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Twitter Clone</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className=" w-full  md:max-w-2xl">
          <CreatePostWizard />
          {!isSignedIn && (
            <div className="flex justify-between">
              {" "}
              <SignInButton /> <SignUpButton />{" "}
            </div>
          )}
          {isSignedIn && (
            <div className="flex flex-col">
              {data?.map((fullPost) => (
                <PostView {...fullPost} key={fullPost?.post.id} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
