import CircleLoader from "react-spinners/CircleLoader";

export const LoadingSpinner = () => {
  return <CircleLoader color="pink" />;
};

export const LoadingScreen = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center align-middle">
      {" "}
      <LoadingSpinner />{" "}
    </div>
  );
};
