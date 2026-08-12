#!/usr/bin/env node

import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, "greet.js");

function run(args) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
  });
  return result.stdout;
}

const cases = [
  {
    name: "no name argument",
    args: [],
    expected: "Hello, world!\n",
  },
  {
    name: "one name argument",
    args: ["Alice"],
    expected: "Hello, Alice!\n",
  },
  {
    name: "two name arguments",
    args: ["Alice", "Bob"],
    expected: "Hello, Alice, Bob!\n",
  },
  {
    name: "--help flag",
    args: ["--help"],
    expected:
      "Usage: node greet.js [name...]  (e.g. node greet.js Alice Bob)\n",
  },
];

let failed = false;

for (const testCase of cases) {
  const actual = run(testCase.args);
  try {
    assert.strictEqual(actual, testCase.expected);
  } catch {
    failed = true;
    console.error(`FAIL: ${testCase.name}`);
    console.error(`  expected: ${JSON.stringify(testCase.expected)}`);
    console.error(`  actual:   ${JSON.stringify(actual)}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log("All checks passed.");
process.exit(0);
