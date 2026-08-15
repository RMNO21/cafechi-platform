import { runAllTests, printSummaryTable, RunFilterOptions } from "./harness";
import { registerTier1Tests } from "./tier1-features";
import { registerTier2Tests } from "./tier2-boundaries";
import { registerTier3Tests } from "./tier3-combinations";
import { registerTier4Tests } from "./tier4-scenarios";

// Parse CLI arguments
function parseCliArgs(): RunFilterOptions {
  const args = process.argv.slice(2);
  const options: RunFilterOptions = {};

  for (const arg of args) {
    if (arg.startsWith("--tier=")) {
      options.tier = parseInt(arg.replace("--tier=", ""), 10);
    } else if (arg.startsWith("--feature=")) {
      options.feature = parseInt(arg.replace("--feature=", ""), 10);
    } else if (arg.startsWith("--grep=")) {
      options.grep = arg.replace("--grep=", "").replace(/^["']|["']$/g, "");
    }
  }

  return options;
}

async function main() {
  console.log("\n🚀 Initializing CafeChi 4-Tier E2E Test Suite...");

  // 1. Register all test tiers
  registerTier1Tests();
  registerTier2Tests();
  registerTier3Tests();
  registerTier4Tests();

  const options = parseCliArgs();

  if (options.tier !== undefined) {
    console.log(`📌 Filtering by Tier: ${options.tier}`);
  }
  if (options.feature !== undefined) {
    console.log(`📌 Filtering by Feature: ${options.feature}`);
  }
  if (options.grep !== undefined) {
    console.log(`📌 Filtering by Pattern: "${options.grep}"`);
  }

  // 2. Execute test runner
  const summary = await runAllTests(options);

  // 3. Print colorized summary report
  printSummaryTable(summary);

  // 4. Exit with appropriate code
  if (summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error executing test runner:", err);
  process.exit(1);
});
