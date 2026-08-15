import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, "greet.js");

function runCli(args) {
  return execFileSync("node", [cliPath, ...args], { encoding: "utf8" }).replace(/\n$/, "");
}

const cases = [
  {
    name: "no name given",
    args: [],
    expected: "Hello, world!",
  },
  {
    name: "one name given",
    args: ["Alice"],
    expected: "Hello, Alice!",
  },
  {
    name: "two names given",
    args: ["Alice", "Bob"],
    expected: "Hello, Alice, Bob!",
  },
  {
    name: "--help",
    args: ["--help"],
    expected: "Usage: node greet.js [name...]",
  },
];

const failures = [];

for (const testCase of cases) {
  const actual = runCli(testCase.args);
  if (actual !== testCase.expected) {
    failures.push({ ...testCase, actual });
  }
}

if (failures.length === 0) {
  console.log(`All ${cases.length} checks passed.`);
  process.exit(0);
} else {
  console.error(`${failures.length} of ${cases.length} checks failed:`);
  for (const failure of failures) {
    console.error(`\n- ${failure.name}`);
    console.error(`  expected: ${JSON.stringify(failure.expected)}`);
    console.error(`  actual:   ${JSON.stringify(failure.actual)}`);
  }
  process.exit(1);
}
