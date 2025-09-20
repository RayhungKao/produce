import React from "react";
import Loadable from "react-loadable";

const Loader = () => {
  return <div />;
};

export default (loader) =>
  Loadable({
    loader: loader,
    loading: Loader,
  });
