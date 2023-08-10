import Head from "next/head";
import Link from "next/link";
import { RouterOutputs, api } from "~/utils/api";
import Image from "next/image";
import { useContext } from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";
import { UserButton } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { SmallLoadingSpinner } from "../components/loader";
import { ProgressBar } from "../components/progressBar";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

export default function SinglePost(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  console.log(props, "props from single post");
  const postQuery = api.posts.getSinglePostById.useQuery({
    id: props.id,
  });
  const { data } = postQuery;
  console.log(data, "data from single post");
  type PostWithUser = RouterOutputs["posts"]["getSinglePostById"];
  const comment = data?.post?.comments;
  console.log(comment, "comment");

  if (!comment) {
    return <>No comments yet, post one!</>;
  }

  //create reply component

  function CreatePostWizard() {
    const { user } = useUser();

    const [content, setContent] = useState("");
    const ctx = api.useContext();
    const maxChar = 150;
    const remChar = maxChar - content.length;
    const [progress, setProgress] = useState(0);

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
          placeholder="type your reply here"
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

  //post view component
  const PostView = (props: PostWithUser) => {
    const time = data!.post!.title;
    console.log(time, "time");

    const formattedDate = new Date(time).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const formattedTime = new Date(time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
    });

    //time logic currently only shows minutes and hours, wanna implement days, weeks, months, years as well
    function timeOfPost() {
      const currentTime = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });

      // console.log(currentTime);
      const timeDifference =
        new Date(currentTime).getTime() - new Date(time).getTime();
      // console.log(timeDifference);
      const timeDifferenceInMinutes = timeDifference / 60000;
      console.log(timeDifferenceInMinutes);
      const timeDifferenceInHours = timeDifferenceInMinutes / 60;
      // console.log(timeDifferenceInHours);
      const roundedTime = Math.round(timeDifferenceInHours);
      if (timeDifferenceInHours < 1) {
        return `${Math.round(timeDifferenceInMinutes)}m`;
      }
      return `${roundedTime}h`;
    }
    return (
      <div key={data?.post?.id} className="flex border border-pink-200 p-3  ">
        <div className="h-14 w-14 ">
          {" "}
          <Image
            src={data?.author.profileImageUrl as string}
            alt="profileimage"
            width={200}
            height={200}
            className=" rounded-full p-2"
          />{" "}
        </div>

        <div className="flex flex-col">
          <div className="flex gap-2 text-xs">
            <div className="text-xs text-pink-100">{`@${
              data!.author.username ?? data?.author.name
            }`}</div>{" "}
            ·
            <div className="font-thin">
              {" "}
              <Link href={`/post/${data?.post?.id}`}>{timeOfPost()} </Link>
            </div>
          </div>
          <div className="flex items-center p-2">{data?.post?.content}</div>
          <div className="flex gap-2 text-xs">
            {formattedDate} - {formattedTime}
          </div>
        </div>
      </div>
    );
  };

  const CommentView = (props: PostWithUser) => {
    const [liked, setLiked] = useState();
    const [likeCount, setLikeCount] = useState(0);
    const ctx = api.useContext();

    const { mutate, isLoading: isLiking } = api.posts.likeComment.useMutation({
      //optimistically update the like count when the like button is pressed
      onMutate: () => {
        setLikeCount((prevCount) => (liked ? prevCount - 1 : prevCount + 1));
      },
      onSuccess: () => {
        ctx.posts.getSinglePostById.invalidate();
      },
      onSettled: () => {
        // Invalidate the posts query after the mutation is settled
        ctx.posts.getSinglePostById.invalidate();
      },
      onError: (err) => {
        // Check if there's a specific error code from the server
        const errorMessageFromServer = err?.data?.code;
        console.log(errorMessageFromServer, "error message from server");

        // Handle different error scenarios accordingly
        if (errorMessageFromServer === "UNAUTHORIZED") {
          toast.error("You need to log in to like a post.");
        } else if (errorMessageFromServer === "BAD_REQUEST") {
          toast.error("Failed to like the post. Please try again later.");
        } else if (errorMessageFromServer === "TOO_MANY_REQUESTS") {
          toast.error("You are liking too many posts. Please try again later.");
        } else {
          toast.error("An unexpected error occurred. Please try again later.");
        }
      },
    });
    function timeOfPost(createdAt: string) {
      const currentTime = new Date().getTime();
      const commentTime = new Date(createdAt).getTime();
      console.log(currentTime, "current time");
      console.log(commentTime, "comment time");
      const timeDifferenceInMinutes = (currentTime - commentTime) / 60000;
      const timeDifferenceInHours = timeDifferenceInMinutes / 60;
      const timeDifferenceInDays = timeDifferenceInHours / 24;
      const timeDifferenceInWeeks = timeDifferenceInDays / 7;
      const timeDifferenceInMonths = timeDifferenceInDays / 30.4375; // Average days per month
      const timeDifferenceInYears = timeDifferenceInDays / 365.25; // Average days per year

      if (timeDifferenceInYears >= 1) {
        return `${Math.round(timeDifferenceInYears)}y`;
      } else if (timeDifferenceInMonths >= 1) {
        return `${Math.round(timeDifferenceInMonths)}mo`;
      } else if (timeDifferenceInWeeks >= 1) {
        return `${Math.round(timeDifferenceInWeeks)}w`;
      } else if (timeDifferenceInDays >= 1) {
        return `${Math.round(timeDifferenceInDays)}d`;
      } else if (timeDifferenceInHours >= 1) {
        return `${Math.round(timeDifferenceInHours)}h`;
      }

      return `${Math.round(timeDifferenceInMinutes)}m`;
    }

    return (
      <div className="flex flex-col gap-2">
        {props?.post?.comments.map((comment: any) => (
          <div key={comment.id} className="flex border border-pink-200 p-3">
            <div className="h-14 w-14">
              <Image
                src={comment.profileImage}
                alt="profileimage"
                width={200}
                height={200}
                className="rounded-full p-2"
              />
            </div>
            <div className="flex flex-grow flex-col">
              <div className="flex gap-2 text-xs">
                <div className="text-xs text-pink-100">
                  @{comment.authorName}
                </div>
                <div>·</div>
                <div className="text-xs font-thin text-gray-500">
                  {timeOfPost(comment.createdAt)}
                </div>
              </div>
              <div className="flex items-center p-2">{comment.content}</div>
            </div>

            <div className="flex items-center text-xs text-pink-100">
              <button
                className="text-pink-100"
                onClick={() => {
                  mutate({ commentId: comment.id });
                  setLiked((prevLiked) => !prevLiked);
                }}
              >
                {liked ? (
                  <AiFillHeart size={15} />
                ) : (
                  <AiOutlineHeart size={15} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Function to fetch comments for a specific post
  // async function fetchCommentsForPost(postId: string) {
  //   // Assuming you have a Prisma client instance available
  //   const comments = await prisma.comment.findMany({
  //     where: {
  //       postId,
  //     },

  //   });

  //   return comments;
  // }

  return (
    <>
      <Head>
        <title>Twitter Clone</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center">
        <div className=" w-full  md:max-w-2xl">
          {data?.post && <PostView {...data} />}
          <CreatePostWizard />
          <div className=" w-full  md:max-w-2xl">
            {comment.map((comment) => {
              return <CommentView key={comment.id} {...data} />;
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ id: string }>
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson,
  });
  const id = context.params?.id;
  if (typeof id !== "string") throw new Error("no id");

  await helpers.posts.getSinglePostById.prefetch({ id: id });
  // Check if the post data is available and has the 'authorId' field

  return {
    props: {
      trpcState: helpers.dehydrate(),
      id,
    },
  };
}
