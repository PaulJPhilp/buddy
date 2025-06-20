#!/usr/bin/env bun

import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

interface TestSuite {
  name: string;
  file: string;
  description: string;
  timeout: number;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

// Define all integration test suites
const TEST_SUITES: TestSuite[] = [
  {
    name: "ChatApp E2E",
    file: "chat-app-flow.test.tsx",
    description:
      "End-to-end tests for ChatApp component with React Testing Library",
    timeout: 30000,
  },
  {
    name: "Chat Services",
    file: "chat-services-flow.test.ts",
    description: "Integration tests for Effect services layer without React",
    timeout: 20000,
  },
  {
    name: "Performance",
    file: "chat-performance.test.ts",
    description: "Performance and stress tests for high-load scenarios",
    timeout: 60000,
  },
  {
    name: "WebSocket Protocol",
    file: "chat-flow.test.ts",
    description: "Low-level WebSocket protocol tests with live agent",
    timeout: 45000,
  },
];

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
} as const;

function colorize(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log(colorize("cyan", "═".repeat(80)));
  console.log(colorize("bright", "🧪 Chat Integration Test Suite Runner"));
  console.log(colorize("cyan", "═".repeat(80)));
  console.log();
}

function printSuiteInfo() {
  console.log(colorize("blue", "📋 Available Test Suites:"));
  console.log();

  TEST_SUITES.forEach((suite, index) => {
    console.log(
      `${colorize("yellow", `${index + 1}.`)} ${colorize("bright", suite.name)}`,
    );
    console.log(`   ${suite.description}`);
    console.log(`   ${colorize("magenta", `File: ${suite.file}`)}`);
    console.log(`   ${colorize("magenta", `Timeout: ${suite.timeout}ms`)}`);
    console.log();
  });
}

async function runTestSuite(suite: TestSuite): Promise<TestResult> {
  const startTime = Date.now();
  const testFile = path.join(__dirname, suite.file);

  console.log(colorize("blue", `🔄 Running ${suite.name}...`));

  if (!existsSync(testFile)) {
    return {
      suite: suite.name,
      passed: false,
      duration: Date.now() - startTime,
      output: "",
      error: `Test file not found: ${testFile}`,
    };
  }

  try {
    const command = `bunx vitest ${testFile} --run --reporter=verbose`;
    const output = execSync(command, {
      encoding: "utf8",
      timeout: suite.timeout + 5000, // Add buffer to vitest timeout
      cwd: process.cwd(),
    });

    return {
      suite: suite.name,
      passed: true,
      duration: Date.now() - startTime,
      output,
    };
  } catch (error: any) {
    return {
      suite: suite.name,
      passed: false,
      duration: Date.now() - startTime,
      output: error.stdout || "",
      error: error.stderr || error.message,
    };
  }
}

function printResult(result: TestResult) {
  const status = result.passed
    ? colorize("green", "✅ PASSED")
    : colorize("red", "❌ FAILED");

  console.log(
    `${status} ${colorize("bright", result.suite)} (${result.duration}ms)`,
  );

  if (!result.passed && result.error) {
    console.log(colorize("red", `   Error: ${result.error}`));
  }

  console.log();
}

function printSummary(results: TestResult[]) {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(colorize("cyan", "═".repeat(80)));
  console.log(colorize("bright", "📊 Test Summary"));
  console.log(colorize("cyan", "═".repeat(80)));
  console.log();

  console.log(`${colorize("green", "✅ Passed:")} ${passed}/${total}`);
  console.log(`${colorize("red", "❌ Failed:")} ${failed}/${total}`);
  console.log(`${colorize("blue", "⏱️  Total Duration:")} ${totalDuration}ms`);
  console.log(
    `${colorize("blue", "📈 Success Rate:")} ${Math.round((passed / total) * 100)}%`,
  );
  console.log();

  if (failed > 0) {
    console.log(colorize("red", "❌ Failed Tests:"));
    results
      .filter((r) => !r.passed)
      .forEach((result) => {
        console.log(`   • ${result.suite}`);
        if (result.error) {
          console.log(`     ${colorize("red", result.error)}`);
        }
      });
    console.log();
  }

  console.log(colorize("cyan", "═".repeat(80)));
}

async function runAllTests() {
  printHeader();
  printSuiteInfo();

  console.log(colorize("green", "🚀 Starting integration tests..."));
  console.log();

  const results: TestResult[] = [];

  for (const suite of TEST_SUITES) {
    const result = await runTestSuite(suite);
    results.push(result);
    printResult(result);

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  printSummary(results);

  // Exit with error code if any tests failed
  const failedCount = results.filter((r) => !r.passed).length;
  if (failedCount > 0) {
    process.exit(1);
  }
}

async function runSpecificTest(testName: string) {
  const suite = TEST_SUITES.find(
    (s) =>
      s.name.toLowerCase().includes(testName.toLowerCase()) ||
      s.file.toLowerCase().includes(testName.toLowerCase()),
  );

  if (!suite) {
    console.log(colorize("red", `❌ Test suite not found: ${testName}`));
    console.log();
    console.log(colorize("blue", "Available test suites:"));
    TEST_SUITES.forEach((s) => {
      console.log(`   • ${s.name} (${s.file})`);
    });
    process.exit(1);
  }

  printHeader();
  console.log(colorize("blue", `🎯 Running specific test: ${suite.name}`));
  console.log();

  const result = await runTestSuite(suite);
  printResult(result);

  if (!result.passed) {
    console.log(colorize("red", "Test output:"));
    console.log(result.output);
    if (result.error) {
      console.log(colorize("red", "Error:"));
      console.log(result.error);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Run all tests
  runAllTests().catch((error) => {
    console.error(colorize("red", `💥 Runner error: ${error.message}`));
    process.exit(1);
  });
} else if (args[0] === "--help" || args[0] === "-h") {
  console.log("Integration Test Runner");
  console.log();
  console.log("Usage:");
  console.log(
    "  bun run test:integration          # Run all integration tests",
  );
  console.log("  bun run test:integration <name>   # Run specific test suite");
  console.log("  bun run test:integration --help   # Show this help");
  console.log();
  console.log("Available test suites:");
  TEST_SUITES.forEach((suite) => {
    console.log(`  • ${suite.name}`);
  });
} else {
  // Run specific test
  const testName = args[0];
  runSpecificTest(testName).catch((error) => {
    console.error(colorize("red", `💥 Runner error: ${error.message}`));
    process.exit(1);
  });
}
