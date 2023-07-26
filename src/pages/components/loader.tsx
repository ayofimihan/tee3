// pages/components/loader.js
import React from "react";
import CircleLoader from "react-spinners/CircleLoader";
import ClipLoader from "react-spinners/ClipLoader";

const LoadingSpinner = () => {
  return <CircleLoader color="pink" />;
};

const SmallLoadingSpinner = () => {
  return <ClipLoader color="pink" size={20} />;
};

export const LoadingScreen = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center align-middle">
      {" "}
      <LoadingSpinner />{" "}
    </div>
  );
};
