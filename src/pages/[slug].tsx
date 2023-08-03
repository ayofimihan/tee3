import Head from "next/head";
import { RouterOutputs, api } from "~/utils/api";
import { createServerSideHelpers } from "@trpc/react-query/server";
import {
  GetServerSidePropsContext,
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetServerSidePropsType,
  InferGetStaticPropsType,
} from "next";
import { profileRouter } from "~/server/api/routers/profile";
import superjson from "superjson";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import Image from "next/image";
import Link from "next/link";

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
    const { id, title, content, authorId } = props;

    function timeOfPost() {
      const time = title;
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
      <div key={id} className="flex border border-pink-200 p-3  ">
        <div className="h-14 w-14 ">
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
            <div className="text-xs text-pink-100">{`@${
              data!.username ?? data?.name
            }`}</div>{" "}
            ·
            <div className="font-thin">
              {" "}
              <Link href={`/post/${id}`}>{timeOfPost()} </Link>
            </div>
          </div>
          <div className="flex items-center p-2">{content}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>{data?.username || data?.name}</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className=" w-full   md:max-w-2xl">
          <div className=" flex justify-between border border-pink-200 bg-orange-200 p-4 text-black">
            <div>{data?.username ?? data?.name}</div>
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

  await helpers.profile.getUserByUsername.prefetch({ username: slug });
  await helpers.profile.getPostsByAuthorId.prefetch({ authorId: slug });
  return {
    props: {
      trpcState: helpers.dehydrate(),
      slug,
    },
  };
}
