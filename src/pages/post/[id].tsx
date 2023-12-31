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
import { SmallLoadingSpinner } from "../../components/loader";
import { ProgressBar } from "../../components/progressBar";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import CommentView from "../../components/commentView";

import timeLogic from "~/utils/timeLogic";

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

  function CreateCommentWizard() {
    const { user } = useUser();

    const [content, setContent] = useState("");
    const ctx = api.useContext();
    const maxChar = 150;
    const remChar = maxChar - content.length;
    const [progress, setProgress] = useState(0);

    const { mutate, isLoading: isPosting } = api.posts.addComment.useMutation({
      onSuccess: () => {
        setContent("");
        ctx.posts.getSinglePostById.invalidate();
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
          placeholder="Post your reply!"
          className="  mr-4  w-full bg-transparent outline-none "
          onChange={(e) => setContent(e.target.value)}
          value={content}
          disabled={isPosting}
        />
        <button
          className="pr-4"
          onClick={() => mutate({ content: content, postId: props.id })}
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
                Reply
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
    const { post, author } = props;
    const [likeCount, setLikeCount] = useState(post?.likes.length);
    const [commentCount, setCommentCount] = useState(post?.comments.length);
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
            <div className="text-xs text-pink-400">{`@${
              data!.author.username ?? data?.author.name
            }`}</div>{" "}
            ·
            <div className="font-thin">
              {" "}
              <Link href={`/post/${data?.post?.id}`}>{timeLogic(post)} </Link>
            </div>
          </div>
          <div className="flex items-center p-2">{data?.post?.content}</div>
          <div className="flex gap-2 text-xs">
            {formattedDate} - {formattedTime} - {`${likeCount} like(s)`} -{" "}
            {`${commentCount} comment(s)`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>`post {data.post?.id}`</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen justify-center">
        <div className=" w-full  md:max-w-2xl">
          {data?.post && <PostView {...data} />}
          <CreateCommentWizard />
          <div className=" w-full  md:max-w-2xl">
            {data?.post && <CommentView {...data} />}
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
