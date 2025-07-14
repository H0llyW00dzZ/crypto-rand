module.exports = (api) => {
  // Get browser environment from api.caller.
  const isBrowser = api.caller(
    (caller) => caller && caller.envName === "browser"
  );

  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: isBrowser
            ? { browsers: ["last 2 versions", "not dead"] }
            : { node: "current" },
        },
      ],
      "@babel/preset-typescript",
    ],
  };
};
