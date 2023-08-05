import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

export const ProgressBar = (props: any) => {
  const { value } = props;
  return (
    //small progress bar
    <div className="flex  justify-center">
      <CircularProgressbar
        value={value}
        minValue={0}
        maxValue={150}
        styles={buildStyles({



        
          // Whether to use rounded or flat corners on the ends - can use 'butt' or 'round'
          strokeLinecap: "butt",

          // Colors
          pathColor: `rgba(255, 255, 255, 0.9)`,
          textColor: "#f88",

          trailColor: "#f472b6", //pink
          backgroundColor: "#3e98c7",
        })}
      />
    </div>
  );
};
