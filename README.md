# symbolic-bank

Companion code for the Paged Out! article *The role of symbolic execution in security (aka How to leverage math to rob a bank)*.

A Solidity `Bank.withdraw` has an integer overflow inside an `unchecked` block. Three independent checks:

1. **SMTChecker** (solc's built-in model checker, BMC engine + Z3) finds the exploit inputs and later proves the fix safe.
2. **Z3 by hand** reproduces the same query in 15 lines of Python.
3. **Foundry** replays the exploit against the compiled contracts and shows the fixed bank rejects it.

## Layout

```
contracts/Bank.sol        vulnerable Bank + BankSpec (the property, as a harness)
contracts/BankFixed.sol   fixed Bank + BankFixedSpec
z3/bank_z3.py             the hand-written SMT query
scripts/check.js          runs the SMTChecker through solc-js, prints the verdict
test/Exploit.t.sol        Foundry test: robs Bank, fails against BankFixed
```

## Requirements

- Node.js 18+ and npm
- Python 3.9+ (for `z3-solver`, which also provides the `z3` binary solc-js calls)
- Foundry, only for step 3: <https://book.getfoundry.sh/getting-started/installation>

## Commands

```bash
# one-time setup
npm install
python3 -m venv .venv && source .venv/bin/activate     # optional but tidy
pip install -r requirements.txt                         # puts `z3` on PATH inside the venv

# 1. symbolic check with the Solidity compiler's SMTChecker
npm run check:vuln     # expect: Assertion violation + counterexample (fee close to 2^256)
npm run check:fixed    # expect: 1 verification condition(s) proved safe
npm run check          # both; exits non-zero if either result is not the expected one

# 2. the same query written by hand
npm run z3             # expect: [vulnerable] sat + model, [fixed] unsat

# 3. replay the exploit on the real bytecode
forge test -vv         # expect: 2 passed (bank robbed of 100 ETH; fixed bank rejects it)
```

If `npm run check` says `No SMT solver found`, `z3` is not on your PATH: activate the venv, or `brew install z3` / `apt install z3`.

## What the output means

- `sat` / *Assertion violation*: a concrete input satisfies "the code accepts the call" **and** "the payout exceeds the balance". The counterexample is the attack.
- `unsat` / *proved safe*: no input does, **for this path and under the checker's bounds**. Not a proof of the whole system.
- The exact counterexample values differ between solver versions. Any valid model is fine; what matters is that `amt + fee` wraps modulo 2^256.

## Notes

- The property lives in `BankSpec`, not in `Bank.withdraw`. A Solidity `assert` reverts at runtime, so an assert inside `withdraw` would stop the exploit in production while the checker still flags it.
- `solc` itself can run the same check from the command line, if your build bundles Z3 (e.g. Homebrew, Ubuntu PPA): `solc --model-checker-engine bmc --model-checker-targets assert contracts/Bank.sol`. The commands above use solc-js so they work the same everywhere.
- Intentionally vulnerable code. Do not deploy.
