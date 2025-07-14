module.exports = (api) => {
  // The 'isTest' variable is declared but not immediately used; it will be accessed when called.
  const isTest = api.env("test");
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
