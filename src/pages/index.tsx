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
import { useQueryClient } from "@tanstack/react-query";
import { AiOutlineHeart } from "react-icons/ai";
import { AiFillHeart } from "react-icons/ai";

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

    const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
      onSuccess: () => {
        setContent("");
        ctx.posts.getAll.invalidate();
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          toast.error(errorMessage[0]);
        } else {
          toast.error("Failed to post! Please try again later.");
        }
      },
    });

    // console.log(user?.id);
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
          ctx.posts.getAll.invalidate();
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
          } else {
            toast.error(
              "An unexpected error occurred. Please try again later."
            );
          }
        },
      });

    function timeOfPost() {
      const time = post.title;

      // console.log(time);
      const formattedTime = new Date(time).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
      // console.log(formattedTime);

      const currentTime = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
      // console.log(currentTime);
      const timeDifference =
        new Date(currentTime).getTime() - new Date(formattedTime).getTime();
      // console.log(timeDifference);
      const timeDifferenceInMinutes = timeDifference / 60000;
      // console.log(timeDifferenceInMinutes);
      const timeDifferenceInHours = timeDifferenceInMinutes / 60;
      // console.log(timeDifferenceInHours);
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
            <div className="text-xs text-pink-100">Likes: {likeCount}</div>
            <button
              className="text-xs text-pink-100"
              onClick={() => {
                mutateLike({ postId: post.id });
                setLiked((prevLiked) => !prevLiked);
              }}
            >
              {liked ? <AiFillHeart /> : <AiOutlineHeart />}
            </button>
          </div>
        </div>
        <div className="flex items-center p-2">
          <div className=" break-all">{post.content}</div>
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
