export default function timeLogic(props: any) {
  const post = props;
  const time = post.title;

  // console.log(time);
  const formattedTime = new Date(time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  const formattedDayMonth = new Date(time).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
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
  } else if (timeDifferenceInHours > 24 && timeDifferenceInHours < 168) {
    return `${Math.round(timeDifferenceInHours / 24)}d`;
  } else if (timeDifferenceInHours > 168) {
    return formattedDayMonth;
  }
  return `${roundedTime}h`;
}
