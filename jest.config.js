module.exports = {
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
  projects: [
    // Due to potential coveralls coverage issues with multiple projects, the browser project is listed first.
    {
      displayName: "browser",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests/browser/**/*.test.ts"],
      setupFiles: ["<rootDir>/env.js"],
    },
    {
      displayName: "node",
      testEnvironment: "node",
      // More specific testMatch to exclude browser tests
      testMatch: [
        "<rootDir>/tests/*.test.ts",
        "<rootDir>/tests/!(browser)/**/*.test.ts",
      ],
      setupFiles: ["<rootDir>/env.js"],
    },
  ],
};
