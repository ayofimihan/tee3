import Head from "next/head";
import { RouterOutputs, api } from "~/utils/api";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { profileRouter } from "~/server/api/routers/profile";
import superjson from "superjson";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import Image from "next/image";
import Link from "next/link";
import { HiOutlineHome } from "react-icons/hi";
import timeLogic from "~/utils/timeLogic";
//TODO: add dark mode toggle
import { LightDarkToggle } from "../components/lightDarkToggle";

export default function ProfilePage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const { slug } = props;
  // console.log("id", slug);
  const profileQuery = api.profile.getUserByUsername.useQuery({
    username: slug,
  });
  const postQuery = api.profile.getPostsByAuthorId.useQuery({
    authorId: slug,
  });
  const { data } = profileQuery;
  const { data: posts } = postQuery;
  // console.log("posts", posts);

  type PostWithUser = RouterOutputs["profile"]["getPostsByAuthorId"][number];

  const PostView = (props: PostWithUser) => {
    const { id, title, content, authorId, likes, comments } = props;

    // function timeOfPost() {
    //   const time = title;
    //   // console.log(time);
    //   const formattedTime = new Date(time).toLocaleDateString("en-US", {
    //     month: "short",
    //     day: "numeric",
    //     year: "numeric",
    //     hour: "numeric",
    //     minute: "numeric",
    //   });
    //   // console.log(formattedTime);

    //   const currentTime = new Date().toLocaleDateString("en-US", {
    //     month: "short",
    //     day: "numeric",
    //     year: "numeric",
    //     hour: "numeric",
    //     minute: "numeric",
    //   });
    //   // console.log(currentTime);
    //   const timeDifference =
    //     new Date(currentTime).getTime() - new Date(formattedTime).getTime();
    //   // console.log(timeDifference);
    //   const timeDifferenceInMinutes = timeDifference / 60000;
    //   console.log(timeDifferenceInMinutes);
    //   const timeDifferenceInHours = timeDifferenceInMinutes / 60;
    //   // console.log(timeDifferenceInHours);
    //   const roundedTime = Math.round(timeDifferenceInHours);
    //   if (timeDifferenceInHours < 1) {
    //     return `${Math.round(timeDifferenceInMinutes)}m`;
    //   }
    //   return `${roundedTime}h`;
    // }
    return (
      <Link href={`/post/${id}`} className="hover:bg-pink-100">
        <div key={id} className="flex border border-pink-200 p-3  ">
          <div className="h-14 w-14 flex-shrink-0 ">
            {" "}
            <Image
              src={data!.profileImageUrl}
              alt="profileimage"
              width={200}
              height={200}
              className=" rounded-full p-2"
            />{" "}
          </div>

          <div className="flex flex-col">
            <div className="flex gap-2 text-xs">
              <div className="text-xs text-pink-400">{`@${
                data!.username ?? data?.name
              }`}</div>{" "}
              ·
              <div className="font-thin">
                {" "}
                <Link href={`/post/${id}`}>{timeLogic(props)} </Link>
              </div>
            </div>
            <div className="flex items-center break-all p-2">{content}</div>{" "}
            <div className="flex flex-row items-center gap-1">
              <div className="flex justify-start text-xs">
                {likes.length} like(s)
              </div>
              ·
              <div className="flex justify-start text-xs">
                {comments.length} comment(s)
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <Head>
        <title>{data?.username || data?.name}</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className=" flex min-h-screen justify-center">
        <div className=" w-full   md:max-w-2xl">
          <div className=" flex justify-between border border-pink-200 bg-orange-200 p-4 text-black">
            <div className="flex flex-col gap-2">
              <Link href={"/"}>
                <HiOutlineHome />
              </Link>
              <div>{data?.username ?? data?.name}</div>
            </div>
            <Image
              src={data!.profileImageUrl}
              alt="profile image"
              width={50}
              height={50}
            ></Image>
          </div>
          <div className="flex flex-col">
            {posts?.map((post) => {
              return <PostView {...post} />;
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(
  context: GetServerSidePropsContext<{ slug: string }>
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson,
  });
  const slug = context.params?.slug as string;

  const user = await helpers.profile.getUserByUsername.prefetch({
    username: slug,
  });
  const post = await helpers.profile.getPostsByAuthorId.prefetch({
    authorId: slug,
  });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      slug,
    },
  };
}
