# Commit-Reveal vs Zero-Knowledge: A Comparison

This document compares the two approaches for Rock Paper Scissors.

## 📋 Quick Comparison

| Aspect | Commit-Reveal | Zero-Knowledge |
|--------|---------------|----------------|
| **Transactions per game** | 5 (create, join, commit×2, reveal×2) | 3 (create, join, prove) |
| **Gas cost** | ~403-455k total | ~517k total |
| **Privacy** | Moves revealed on-chain | Moves never revealed |
| **UX** | Need to remember secret | Secret used once |
| **Griefing risk** | Yes (refuse to reveal) | No (single proof) |
| **Setup complexity** | None | Requires trusted setup |
| **Implementation** | Pure Solidity | Circom + Solidity |
| **Proof size** | N/A | 128 bytes |
| **Learning curve** | Easy | Advanced |

## 🔄 Flow Comparison

### Commit-Reveal Flow

```
Player 1 Actions:
1. Create game + deposit stake
2. Generate commitment = hash(move + secret)
3. Submit commitment to contract
4. Wait for Player 2 to commit
5. Reveal move + secret
6. Wait for Player 2 to reveal
7. Contract computes winner → payout

Player 2 Actions:
1. Join game + deposit stake
2. Generate commitment = hash(move + secret)
3. Submit commitment to contract
4. Wait for Player 1 to reveal
5. Reveal move + secret
6. Contract computes winner → payout

Total: 5 on-chain transactions
```

**Potential Issues:**
- If Player 2 doesn't commit → Player 1 waits forever (or timeout)
- If Player 1 doesn't reveal → Player 2 must wait for timeout
- If Player 2 doesn't reveal → Player 1 must wait for timeout
- Secret management between transactions is error-prone

### Zero-Knowledge Flow

```
Player 1 Actions:
1. Generate commitment = Poseidon(move, secret)
2. Create game + deposit stake + commitment
3. Wait for Player 2
4. Generate ZK proof (off-chain)
5. Submit proof → automatic payout

Player 2 Actions:
1. Generate commitment = Poseidon(move, secret)
2. Join game + deposit stake + commitment
3. Wait for proof (either player can submit)

Total: 3 on-chain transactions
```

**Benefits:**
- Fewer transactions = better UX
- Either player can submit proof = no griefing
- Moves never revealed = perfect privacy
- Single atomic operation for winner determination

## 💰 Cost Analysis

### Commit-Reveal

| Transaction | Gas | Cost @ 30 gwei | Cost @ $3000 ETH |
|-------------|-----|----------------|------------------|
| Create game | 125k | 0.00375 ETH | $11.25 |
| Join game | 52k | 0.00156 ETH | $4.68 |
| Player 1 commit | 65k | 0.00195 ETH | $5.85 |
| Player 2 commit | 65k | 0.00195 ETH | $5.85 |
| Player 1 reveal | 48-74k | 0.00144-0.00222 ETH | $4.32-6.66 |
| Player 2 reveal | 48-74k | 0.00144-0.00222 ETH | $4.32-6.66 |
| **Total** | **403-455k** | **0.01209-0.01365 ETH** | **$36.27-40.95** |

### Zero-Knowledge

| Transaction | Gas | Cost @ 30 gwei | Cost @ $3000 ETH |
|-------------|-----|----------------|------------------|
| Create game | 163k | 0.00489 ETH | $14.67 |
| Join game | 74k | 0.00222 ETH | $6.66 |
| Prove winner | 280k | 0.00840 ETH | $25.20 |
| **Total** | **517k** | **0.01551 ETH** | **$46.53** |

**Wait, ZK costs MORE?**

Yes, for this simple game! But consider:

1. **User Experience Value**
   - 3 transactions vs 5 transactions
   - No secret management hassle
   - No timeout waiting

2. **Privacy Value**
   - Moves never revealed = true privacy
   - No MEV attacks on reveals
   - No future analysis of strategies

3. **Scaling**
   - For 10 games: Commit-reveal = ~4.5M gas, ZK = ~5.2M gas (16% more)
   - With ZK rollups: ZK becomes 100x cheaper
   - With proof aggregation: ZK becomes cheaper at scale

## 🎯 When to Use Each

### Use Commit-Reveal When:

✅ **Gas optimization is critical**
- You're deploying on expensive L1
- Users are price-sensitive
- Game frequency is low

✅ **Simplicity is key**
- You're learning blockchain development
- Team doesn't have ZK expertise
- Time to market is crucial

✅ **Privacy is not critical**
- Revealing moves post-game is acceptable
- Historical data can be public
- Focus is on fairness, not privacy

### Use Zero-Knowledge When:

✅ **Privacy matters**
- Moves should never be revealed
- Prevent strategy analysis
- Competitive gaming scenarios

✅ **UX is critical**
- Fewer transactions = better experience
- Mobile gaming scenarios
- High-frequency gameplay

✅ **Scaling is needed**
- 100s-1000s of games
- Using ZK rollups (StarkNet, zkSync)
- Proof aggregation available

✅ **Griefing prevention**
- Competitive tournaments
- High-stakes gaming
- Reputation systems

## 🔒 Security Comparison

### Commit-Reveal Security

**Strengths:**
- Well-understood primitive
- No complex cryptography
- Easy to audit
- No trusted setup

**Weaknesses:**
- Timeout griefing possible
- Front-running on reveal (mitigated by commit)
- Secret management errors
- Historical data exposure

**Attack Vectors:**
1. **Refuse to reveal** → Opponent must wait for timeout
2. **Weak secrets** → Brute force possible
3. **Replay attacks** → Use nonces to prevent
4. **MEV on reveals** → Miners can see reveal in mempool

### Zero-Knowledge Security

**Strengths:**
- Perfect privacy (moves never revealed)
- No griefing possible
- Single atomic transaction
- Cryptographic guarantees

**Weaknesses:**
- Requires trusted setup
- Circuit bugs can be critical
- More complex to audit
- Newer technology

**Attack Vectors:**
1. **Compromised setup** → Can forge proofs (mitigated by multi-party ceremony)
2. **Circuit bugs** → Under-constrained circuits (mitigated by formal verification)
3. **Implementation bugs** → Solidity verifier issues (mitigated by standard libraries)

## 🧪 Testing Comparison

### Commit-Reveal Testing

**Tests needed:**
- Game creation
- Commitment phase
- Reveal phase
- Winner computation
- Timeout handling
- Error cases

**Test complexity:** Medium
**Test count:** ~25 tests
**Coverage:** Easy to achieve 100%

### Zero-Knowledge Testing

**Tests needed:**
- All of the above, PLUS:
- Circuit constraints
- Proof generation
- Proof verification
- Field arithmetic
- Edge cases in circuits

**Test complexity:** High
**Test count:** ~40+ tests
**Coverage:** Circuit coverage is critical

## 🎓 Learning Path

### For Beginners

Start with **Commit-Reveal**:
1. Understand the problem (blockchain transparency)
2. Learn hash functions
3. Grasp two-phase protocols
4. Build and test

### For Intermediate

Add **Zero-Knowledge**:
1. Understand ZK fundamentals
2. Learn Circom circuit language
3. Understand R1CS and constraint systems
4. Build and test circuits

### For Advanced

Optimize **Zero-Knowledge**:
1. Proof aggregation
2. Recursive proofs
3. ZK rollup integration
4. Custom circuits

## 📊 Real-World Examples

### Commit-Reveal in Production

**Examples:**
- Early Ethereum games (Fomo3D, etc.)
- Some NFT reveals
- Simple voting systems

**Why it works:**
- Proven technology
- Easy to implement
- Low risk

### Zero-Knowledge in Production

**Examples:**
- Dark Forest (ZK gaming)
- Tornado Cash (ZK privacy)
- zkSync/StarkNet (ZK rollups)
- Zcash (ZK cryptocurrency)

**Why it works:**
- Scales to millions of users
- True privacy guarantees
- Future of Ethereum

## 🚀 Future Trends

### Commit-Reveal

- Will remain useful for simple cases
- Good for educational purposes
- Still relevant on expensive chains

### Zero-Knowledge

- **Growing rapidly** in adoption
- **Better tooling** emerging (Circom 2.0, Noir, Leo)
- **Cheaper** with new proof systems (PLONK, STARKs)
- **Essential** for scaling Ethereum

**Prediction:** By 2025-2026, ZK will be the default for most onchain games on L2s.

## 🎯 Recommendations

### For This Project (Learning)

**Start with Commit-Reveal:**
- Understand the fundamentals
- Get comfortable with Solidity
- Learn about state machines

**Then Add ZK:**
- See the improvements
- Understand the tradeoffs
- Learn advanced cryptography

### For Production Games

**Simple games (<100 players):**
- Commit-Reveal is fine
- Focus on game design

**Complex games (>1000 players):**
- Use ZK from the start
- Plan for ZK rollups
- Invest in circuit audits

**High-stakes games (money involved):**
- Use ZK for privacy
- Get security audits
- Plan for formal verification

## 📖 Further Reading

### Commit-Reveal
- [OpenZeppelin Commit-Reveal](https://docs.openzeppelin.com/contracts/4.x/api/utils#Commit)
- [Ethereum.org: Commit-Reveal Schemes](https://ethereum.org/en/developers/docs/smart-contracts/design-patterns/)

### Zero-Knowledge
- [ZK Whiteboard Sessions](https://zkhack.dev/whiteboard/)
- [Circom Documentation](https://docs.circom.io/)
- [0xPARC ZK Gaming](https://0xparc.org/)
- [Awesome Zero Knowledge](https://github.com/matter-labs/awesome-zero-knowledge-proofs)

---

**Bottom Line:**
- **Learning?** Start with commit-reveal, then explore ZK
- **Simple game?** Commit-reveal is fine
- **Scaling?** Go ZK
- **Privacy matters?** Definitely ZK
- **Future-proofing?** Learn both!

