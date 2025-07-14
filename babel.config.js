module.exports = (api) => {
  // The 'isTest' variable is declared but not immediately used; it will be accessed when called.
  const isTest = api.env("test");

  // Access the environment variable from process.env
  const isBrowser = process.env.BROWSER_ENV === "true";

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
