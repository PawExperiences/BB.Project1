const args = process.argv.slice(2);

if (args.length === 1 && args[0] === "--help") {
  console.log("Usage: node greet.js [name...]");
} else if (args.length === 0) {
  console.log("Hello, world!");
} else {
  console.log(`Hello, ${args.join(", ")}!`);
}
