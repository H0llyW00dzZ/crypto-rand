// Access the environment variable from process.env
const isBrowser = process.env.TEST_HACK_CRYPTO_BROWSER_ENV === "true";
console.log(`Running in ${isBrowser ? "browser" : "nodejs"} environment.`);
