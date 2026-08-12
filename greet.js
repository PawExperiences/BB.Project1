#!/usr/bin/env node

function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    console.log("Usage: node greet.js [name...]  (e.g. node greet.js Alice Bob)");
    return;
  }

  const names = args.length > 0 ? args : ["world"];
  console.log(`Hello, ${names.join(", ")}!`);
}

main();
