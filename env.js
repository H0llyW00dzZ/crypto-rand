// Access the environment variable from process.env
const isBrowser = process.env.TEST_HACK_CRYPTO_BROWSER_ENV === "true";
console.log(`Running in ${isBrowser ? "browser" : "nodejs"} environment.`);

// Function to create a repeated string for visual formatting
const createSeparator = (length = 50) => "━".repeat(length);

// Log CPU information if in Node.js environment
if (!isBrowser) {
  try {
    const os = require("os");
    const cpus = os.cpus();

    if (cpus && cpus.length > 0) {
      const cpuModel = cpus[0].model;
      const cpuCores = cpus.length;
      const cpuSpeed = cpus[0].speed;

      console.log(createSeparator());
      console.log("CPU Information:");
      console.log(createSeparator(20));
      console.log(`  Model: ${cpuModel}`);
      console.log(`  Cores: ${cpuCores}`);
      // Speed may not display in CI/CD workflows.
      // However, it does show on a local PC.
      // Tested on an overclocked PC:
      // ● Console
      //
      // console.log
      //   Running in nodejs environment.
      //
      //   at Object.<anonymous> (env.js:5:9)
      //
      // console.log
      //   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //
      //   at Object.<anonymous> (env.js:19:15)
      //
      // console.log
      //   CPU Information:
      //
      //   at Object.<anonymous> (env.js:20:15)
      //
      // console.log
      //   ━━━━━━━━━━━━━━━━━━━━
      //
      //   at Object.<anonymous> (env.js:21:15)
      //
      // console.log
      //     Model: AMD Ryzen 9 3900X 12-Core Processor
      //
      //   at Object.<anonymous> (env.js:22:15)
      //
      // console.log
      //     Cores: 24
      //
      //   at Object.<anonymous> (env.js:23:15)
      //
      // console.log
      //     Speed: 4054 MHz
      //
      //   at Object.<anonymous> (env.js:24:15)
      //
      // console.log
      //     Architecture: x64
      //
      //   at Object.<anonymous> (env.js:25:15)
      //
      // console.log
      //     Total Memory: 16 GB
      //
      //   at Object.<anonymous> (env.js:26:15)
      //
      // console.log
      //   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //
      //   at Object.<anonymous> (env.js:27:15)
      console.log(`  Speed: ${cpuSpeed} MHz`);
      console.log(`  Architecture: ${os.arch()}`);
      console.log(
        `  Total Memory: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`
      );
      console.log(createSeparator());
    }
  } catch (error) {
    console.log("Unable to retrieve CPU information:", error.message);
  }
} else {
  console.log(createSeparator());
  console.log("CPU information not available in browser environment");
  console.log(createSeparator());
}
