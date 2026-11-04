from z3 import BitVecs, Solver, UGE, ULT, ULE, And, sat

W = 256
MOD = 2**W
bal, amt, fee = BitVecs("bal amt fee", W)


def query(path_condition, label):
    s = Solver()
    s.add(path_condition)
    s.add(ULT(bal, amt))
    r = s.check()
    print(f"[{label}] {r}")
    if r == sat:
        m = s.model()
        b, a, f = (m[v].as_long() for v in (bal, amt, fee))
        print(f"  bal = {b}\n  amt = {a}\n  fee = {hex(f)}")
        wrapped = (a + f) % MOD
        print(f"  amt + fee (mod 2^256) = {wrapped}  -> require(bal >= amt+fee) {'passes' if b >= wrapped else 'fails'}")
        print(f"  payout {a} > balance {b}: {a > b}")


# Vulnerable: require(bal >= amt + fee) with wrapping addition
query(UGE(bal, amt + fee), "vulnerable")

# Fixed: require(amt <= bal && fee <= bal - amt)
query(And(ULE(amt, bal), ULE(fee, bal - amt)), "fixed")

# The concrete exploit from the article: 1 wei balance, 100 ether payout
a = 100 * 10**18
f = MOD - a + 1
print(f"\narticle exploit: amt + fee mod 2^256 = {(a + f) % MOD} (balance 1 wei -> require passes, 100 ETH leaves)")
