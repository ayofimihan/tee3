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
import { LoadingScreen } from "../components/loader";
import { SmallLoadingSpinner } from "../components/loader";
import { useState as UseState, useState } from "react";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AiOutlineHeart } from "react-icons/ai";
import { AiFillHeart } from "react-icons/ai";
import { ProgressBar } from "../components/progressBar";
import { SignIn } from "@clerk/nextjs";
import Footer from "../components/footer";
import timeLogic from "~/utils/timeLogic";

export default function Home() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { data, isLoading } = api.posts.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  if (isLoading) {
    return <LoadingScreen />;
  }

  // console.log(data);

  function CreatePostWizard() {
    const [content, setContent] = UseState("");
    const ctx = api.useContext();
    const { user } = useUser();
    console.log(user?.id, "champion id");
    const queryClient = useQueryClient();
    const maxChar = 150;
    const remChar = maxChar - content.length;
    const [progress, setProgress] = useState(0);

    const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
      onSuccess: () => {
        setContent("");
        ctx.posts.getAll.invalidate();
      },
      onError: (e) => {
        // Check if there's a specific error code from the server
        const errorMessageFromServer = e?.data?.code;
        if (errorMessageFromServer === "UNAUTHORIZED") {
          toast.error("You need to log in to post.");
        } else if (errorMessageFromServer === "BAD_REQUEST") {
          toast.error("You cant say that sorry. Say something nicer");
        } else if (errorMessageFromServer === "TOO_MANY_REQUESTS") {
          toast.error("You are posting too many posts. Touch grass.");
        } else {
          toast.error("An unexpected error occurred. Please try again later.");
        }
      },
    });

    // console.log(user?.id);
    if (!user) {
      return;
    }
    return (
      <div className="flex border border-pink-200 p-3 pl-3">
        {" "}
        <div className="  p-2">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-16 h-16 border border-solid border-green-400",
              },
            }}
          />{" "}
        </div>
        <input
          type="text"
          placeholder="kilon shele? click on the profile picture to sing out/manage account"
          className="  mr-4  w-full bg-transparent outline-none "
          onChange={(e) => setContent(e.target.value)}
          value={content}
          disabled={isPosting}
        />
        <button
          className="pr-4"
          onClick={() => mutate({ content })}
          disabled={isPosting}
        >
          {" "}
          {isPosting ? (
            <SmallLoadingSpinner />
          ) : (
            <div>
              <button
                disabled={!content}
                className={`rounded-full border px-4 py-1 ${
                  content
                    ? "bg-pink-400 text-black"
                    : "cursor-not-allowed bg-pink-200 text-gray-500 opacity-50"
                }`}
              >
                post
              </button>

              {content && (
                <div className="mt-2 flex gap-2 text-sm">
                  <span className="flex h-5 justify-center text-center">
                    {" "}
                    <ProgressBar value={content.length} />
                  </span>
                  <span
                    className={
                      remChar <= 0
                        ? "text-red-600"
                        : remChar <= 20
                        ? "text-yellow-400"
                        : "text-stone-500 dark:text-gray-400"
                    }
                  >
                    {remChar}
                  </span>
                </div>
              )}
            </div>
          )}
        </button>
      </div>
    );
  }

  type PostWithUser = RouterOutputs["posts"]["getAll"][number];
  const PostView = (props: PostWithUser) => {
    const { user } = useUser();

    const { post, author } = props;
    const ctx = api.useContext();
    const hasLiked = post.likes.some((like) => like.userId === user?.id);
    const [liked, setLiked] = useState(hasLiked);
    const [likeCount, setLikeCount] = useState(post.likes.length);

    const { mutate: mutateLike, isLoading: isLiking } =
      api.posts.likes.useMutation({
        onMutate: () => {
          // Optimistically update the like count when the "Like" button is clicked
          setLikeCount((prevCount) => (liked ? prevCount - 1 : prevCount + 1));
        },
        onSuccess: () => {
          console.log("liked");
        },
        onSettled: () => {
          // Invalidate the posts query after the mutation is settled
          ctx.posts.getAll.invalidate();
        },
        onError: (err) => {
          // Check if there's a specific error code from the server
          const errorMessageFromServer = err?.data?.code;

          // Handle different error scenarios accordingly
          if (errorMessageFromServer === "UNAUTHORIZED") {
            toast.error("You need to log in to like a post.");
          } else if (errorMessageFromServer === "BAD_REQUEST") {
            toast.error("Failed to like the post. Please try again later.");
          } else if (errorMessageFromServer === "TOO_MANY_REQUESTS") {
            toast.error("You are liking too many posts. Touch grass.");
          } else {
            toast.error(
              "An unexpected error occurred. Please try again later."
            );
          }
        },
      });

    return (
      <div
        key={post.id}
        className="flex border border-pink-200 p-3 hover:bg-pink-100 "
      >
        <div className="h-14 w-14">
          <Link href={`/${post.authorId}`}>
            {" "}
            <Image
              src={author.profileImageUrl}
              alt="profileimage"
              width={400}
              height={400}
              className="rounded-full"
            />{" "}
          </Link>
        </div>

        <div className="ml-3 flex flex-1 flex-col">
          <div className="flex gap-2 text-xs">
            <Link href={`/${post.authorId}`}>
              <div className="text-xs text-pink-400">{`@${
                author.username ?? author.name
              }`}</div>{" "}
            </Link>
            ·
            <div className="font-thin">
              {" "}
              <Link href={`/post/${post.id}`}>{timeLogic(post)} </Link>
            </div>
          </div>
          <div className="flex items-center p-2">
            <Link href={`/post/${post.id}`}>
              <div className=" break-all">{post.content}</div>
            </Link>
          </div>{" "}
          <div
            className="-mb-2 mr-2 flex items-center justify-end gap-1
          "
          >
            <button
              className="text-xs text-pink-100"
              onClick={() => {
                mutateLike({ postId: post.id });
                setLiked(!liked);
              }}
            >
              {liked ? (
                <AiFillHeart size={15} color="black" />
              ) : (
                <AiOutlineHeart size={15} color="black" />
              )}
            </button>
            <div className="text-xs text-slate-700">{likeCount}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>X</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center">
        <div className=" w-full  md:max-w-3xl">
          <CreatePostWizard />

          {isSignedIn && (
            <div className="flex flex-col">
              {data?.map((fullPost) => (
                <PostView {...fullPost} key={fullPost?.post.id} />
              ))}
            </div>
          )}
          <div className="flex justify-center border p-10 align-middle">
            You're all caught up! Touch some grass.
          </div>
          <div className="mt-10"></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
