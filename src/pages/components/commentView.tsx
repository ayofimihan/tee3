import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { api } from "~/utils/api";
import { RouterOutputs } from "~/utils/api";
import Image from "next/image";

type PostWithUser = RouterOutputs["posts"]["getSinglePostById"];

const CommentView = (props: PostWithUser) => {
  const ctx = api.useContext();

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
    <div className="flex flex-col">
      {props?.post?.comments.map((comment: any) => (
        <Card className="flex p-2">
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-2">
              {/* ... Author Name and Time */}
              <div className="flex gap-2">
                <CardTitle className="text-xs text-pink-400">
                  @{comment.authorName}
                </CardTitle>
                <CardDescription className="text-xs font-thin text-gray-500">
                  {timeOfPost(comment.createdAt)}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              {/* ... Comment Content */}
              <div className="flex items-center p-2">{comment.content}</div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
};
export default CommentView;
