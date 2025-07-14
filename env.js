// Access the environment variable from process.env
const isBrowser = process.env.BROWSER_ENV === "true";
console.log(`Running in ${isBrowser ? "browser" : "nodejs"} environment.`);
