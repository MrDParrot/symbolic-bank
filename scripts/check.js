const fs = require("fs");
const solc = require("solc");
const smtchecker = require("solc/smtchecker");
const smtsolver = require("solc/smtsolver");

const file = process.argv[2];
const expectArg = (process.argv.find((a) => a.startsWith("--expect=")) || "").split("=")[1];
if (!file) {
  console.error("usage: node scripts/check.js <file.sol> --expect=violation|safe");
  process.exit(2);
}
if (smtsolver.availableSolvers.length === 0) {
  console.error("No SMT solver found. Install z3:  pip install z3-solver   (or: brew install z3 / apt install z3)");
  process.exit(2);
}

const input = {
  language: "Solidity",
  sources: { [file]: { content: fs.readFileSync(file, "utf8") } },
  settings: { modelChecker: { engine: "bmc", targets: ["assert"], solvers: ["smtlib2"] } },
};

const output = JSON.parse(
  solc.compile(JSON.stringify(input), {
    smtSolver: smtchecker.smtCallback(smtsolver.smtSolver, smtsolver.availableSolvers[0]),
  })
);

const noise = /array aliasing|re-introduce information/;
let violation = false;
let safe = false;
for (const e of output.errors || []) {
  if (e.severity === "error") {
    console.error(e.formattedMessage);
    process.exit(2);
  }
  const msg = e.formattedMessage;
  if (/Assertion violation/.test(msg)) violation = true;
  if (/proved safe/.test(msg)) safe = true;
  console.log(msg.split("\n").filter((l) => l.trim() && !noise.test(l)).join("\n"));
}

const result = violation ? "violation" : safe ? "safe" : "inconclusive";
console.log(`\nRESULT ${file}: ${result.toUpperCase()}`);
if (expectArg && expectArg !== result) {
  console.error(`expected ${expectArg}, got ${result}`);
  process.exit(1);
}
