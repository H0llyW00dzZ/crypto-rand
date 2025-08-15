// Access the environment variable from process.env
const isBrowser = process.env.TEST_HACK_CRYPTO_BROWSER_ENV === "true";
const nodeVersion = process.version;
console.log(`Running in ${isBrowser ? "browser" : `nodejs ${nodeVersion}`} environment.`);

// Function to create a repeated string for visual formatting
const createSeparator = (length = 50) => "━".repeat(length);

// Define osInfo object with default values
let osInfo = {
  platform: "unknown",
  type: "unknown",
  release: "unknown",
  version: "unknown",
  arch: "unknown",
  cpuCores: 0,
  cpuModel: "Unknown CPU",
  totalMemoryGB: 0,
  hostname: "unknown",
};

// Collect comprehensive OS information if in Node.js environment
if (!isBrowser) {
  try {
    const os = require("os");
    const cpus = os.cpus();

    if (cpus && cpus.length > 0) {
      // Populate the osInfo object with detailed system information
      osInfo = {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        version: os.version(),
        arch: os.arch(),
        cpuCores: cpus.length,
        cpuModel: cpus[0]?.model || "Unknown CPU",
        totalMemoryGB: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
        hostname: os.hostname(),
      };

      const cpuSpeed = cpus[0]?.speed;

      console.log(createSeparator());
      console.log("OS and CPU Information:");
      console.log(createSeparator(20));
      console.log(`  Platform: ${osInfo.platform}`);
      console.log(`  OS Type: ${osInfo.type}`);
      console.log(`  OS Release: ${osInfo.release}`);
      console.log(`  OS Version: ${osInfo.version}`);
      console.log(`  Architecture: ${osInfo.arch}`);
      console.log(`  Hostname: ${osInfo.hostname}`);
      console.log(`  CPU Model: ${osInfo.cpuModel}`);
      console.log(`  CPU Cores: ${osInfo.cpuCores}`);
      if (cpuSpeed) {
        console.log(`  CPU Speed: ${cpuSpeed} MHz`);
      }
      console.log(`  Total Memory: ${osInfo.totalMemoryGB} GB`);

      // Log full OS information as JSON
      console.log(createSeparator());
      console.log("Full OS Information:", JSON.stringify(osInfo, null, 2));
      console.log(createSeparator());
    }
  } catch (error) {
    console.log("Unable to retrieve OS information:", error.message);
  }
} else {
  console.log(createSeparator());
  console.log("OS information not available in browser environment");
  console.log(createSeparator());
}
