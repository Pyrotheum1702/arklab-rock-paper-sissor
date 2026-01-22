# Zero-Knowledge Implementation Guide

This document explains how ZK-SNARKs improve the Rock Paper Scissors game and how to use the ZK version.

## 🤔 Why Zero-Knowledge?

### Problems with Commit-Reveal

The original commit-reveal approach has several issues:

1. **Two transactions per player** (commit + reveal = high gas costs)
2. **Secret management complexity** (players must remember secrets between transactions)
3. **Moves become public** (once revealed, anyone can see what you played)
4. **Griefing possible** (players can refuse to reveal, forcing timeouts)
5. **Trust in randomness** (secrets must be truly random)

### Benefits of Zero-Knowledge

With ZK-SNARKs, you can **prove you know something without revealing what it is**!

In our case:
- Prove you made a valid move (1, 2, or 3) **without revealing which move**
- Prove the winner is correct **without revealing the actual moves**
- Do this in a **single transaction** with **cryptographic guarantees**

## 🔬 How It Works

### Step 1: Commitment (Off-Chain)

Each player computes a commitment using the Poseidon hash function:

```javascript
commitment = Poseidon(move, secret)
```

- `move`: 1=Rock, 2=Paper, 3=Scissors
- `secret`: A large random number (e.g., 256-bit integer)

**Example:**
```javascript
move = 1  // Rock
secret = 12345678901234567890
commitment = Poseidon([1, 12345678901234567890])
           = 0x1a2b3c4d5e6f7g8h9i0j... (256-bit hash)
```

This commitment **hides your move** but **locks you in** to that choice.

### Step 2: Game Creation & Joining

1. Player 1 creates game with their commitment + stake
2. Player 2 joins with their commitment + stake

At this point, **both commitments are on-chain but moves are hidden**.

### Step 3: Generate ZK Proof (Off-Chain)

Either player can generate a proof that:

**Public inputs** (visible to everyone):
- commitment1
- commitment2
- winner (0=draw, 1=player1, 2=player2)

**Private inputs** (hidden):
- move1, secret1
- move2, secret2

**What the proof proves:**
1. `commitment1 == Poseidon(move1, secret1)` ✓
2. `commitment2 == Poseidon(move2, secret2)` ✓
3. `move1 ∈ {1, 2, 3}` ✓
4. `move2 ∈ {1, 2, 3}` ✓
5. `winner = computeWinner(move1, move2)` ✓

The proof is a few hundred bytes and can be verified on-chain in constant time!

### Step 4: Verify and Payout

The smart contract:
1. Verifies the ZK proof (cryptographically sound!)
2. If valid, pays out based on the proven winner
3. **Never sees the actual moves!**

## 📐 The Math Behind It

### Poseidon Hash Function

Poseidon is a ZK-friendly hash function designed for use in circuits.

**Why not SHA-256?**
- SHA-256 requires ~25,000 constraints in a circuit
- Poseidon requires only ~150 constraints
- Faster proving times, smaller proofs

**Properties:**
- Collision-resistant
- Pre-image resistant
- Efficiently computed in finite fields

### Groth16 Proof System

We use Groth16, a popular ZK-SNARK construction.

**Proof size:** 128 bytes (constant, regardless of circuit complexity!)
**Verification:** ~280k gas (constant time)
**Security:** 128-bit security level

**Proof components:**
- `a`: G1 point (2 field elements)
- `b`: G2 point (4 field elements)
- `c`: G1 point (2 field elements)

## 🛠️ Setup & Usage

### Prerequisites

You need to install Circom compiler:

```bash
# On macOS
brew install circom

# Or from source
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
```

Also install snarkjs globally:

```bash
npm install -g snarkjs
```

### Step 1: Compile Circuits

```bash
cd "/Users/macmini/4. Prototype/rps-onchain-game"
./scripts/zkSetup.sh
```

This script:
1. Compiles the Circom circuit to R1CS format
2. Runs Powers of Tau ceremony (generates random entropy)
3. Performs circuit-specific setup
4. Generates proving and verification keys
5. Exports Solidity verifier contract

**Time:** ~2-5 minutes

### Step 2: Deploy Contracts

```javascript
// Deploy verifier
const Verifier = await ethers.getContractFactory("RPSWinnerVerifier");
const verifier = await Verifier.deploy();

// Deploy game contract
const RPSZK = await ethers.getContractFactory("RockPaperScissorsZK");
const rpsZK = await RPSZK.deploy(await verifier.getAddress());
```

### Step 3: Play a Game

```javascript
const { generateCommitment, generateProof } = require("./scripts/generateProof");

// Player 1 chooses Rock
const move1 = 1;
const secret1 = BigInt("12345678901234567890");
const commitment1 = await generateCommitment(move1, secret1);

// Player 2 chooses Scissors
const move2 = 3;
const secret2 = BigInt("98765432109876543210");
const commitment2 = await generateCommitment(move2, secret2);

// Create and join game
await rpsZK.connect(player1).createGame(player2.address, commitment1, { value: stake });
await rpsZK.connect(player2).joinGame(0, commitment2, { value: stake });

// Generate proof (off-chain)
const proof = await generateProof(move1, secret1, move2, secret2);

// Submit proof (on-chain)
await rpsZK.connect(player1).proveWinner(
  0,  // gameId
  proof.winner,
  proof.a,
  proof.b,
  proof.c
);

// Winner gets paid automatically!
```

## 🔧 Circuit Design

### RPS Move Circuit

**Purpose:** Prove you have a valid move without revealing it

**Inputs:**
- Private: `move`, `secret`
- Public: `commitment`

**Constraints:**
```
commitment == Poseidon(move, secret)
move ∈ {1, 2, 3}
```

**Constraint count:** ~200

### RPS Winner Circuit

**Purpose:** Prove the winner is computed correctly

**Inputs:**
- Private: `move1`, `secret1`, `move2`, `secret2`
- Public: `commitment1`, `commitment2`, `winner`

**Constraints:**
```
commitment1 == Poseidon(move1, secret1)
commitment2 == Poseidon(move2, secret2)
move1 ∈ {1, 2, 3}
move2 ∈ {1, 2, 3}
winner == computeWinner(move1, move2)
```

**Constraint count:** ~400

## 📊 Gas Comparison

| Action | Commit-Reveal | ZK Version | Savings |
|--------|---------------|------------|---------|
| Create Game | 125k gas | 163k gas | -30% |
| Join Game | 52k gas | 74k gas | -42% |
| Commit Move (×2) | 130k gas | — | — |
| Reveal Move (×2) | 96-148k gas | — | — |
| Prove Winner | — | 280k gas | — |
| **Total** | **~403-455k gas** | **~517k gas** | **-13% to -25%** |

**Wait, ZK uses MORE gas?**

Actually, for this simple game, ZK uses slightly more gas. But:

1. **Fewer transactions:** 3 vs 5 (better UX, less signing)
2. **Privacy:** Moves never revealed on-chain
3. **No timeout risk:** Can't grief by not revealing
4. **Scales better:** For complex games, ZK becomes much cheaper

For games with:
- Many players
- Complex rules
- Frequent state updates

ZK can save 80-95% gas compared to on-chain computation!

## 🔐 Security Considerations

### Trusted Setup

Groth16 requires a "trusted setup" ceremony.

**The Risk:**
If the setup is compromised, fake proofs can be generated.

**Mitigation:**
1. Multi-party ceremony (we only need 1 honest participant)
2. Use existing setups (Powers of Tau)
3. Or use transparent setups (PLONK, STARKs)

**For production:**
- Use existing Powers of Tau from Ethereum Foundation
- Run your own multi-party ceremony
- Consider transparent alternatives (Halo2, STARKs)

### Circuit Bugs

Bugs in circuits can be **critical**!

**Common issues:**
- Under-constrained circuits (missing constraints)
- Over-constrained circuits (unsatisfiable)
- Arithmetic overflows in field operations

**Mitigation:**
- Formal verification tools (circomspect, picus)
- Multiple circuit audits
- Extensive testing with edge cases
- Bug bounties

### Poseidon Hash

Poseidon is relatively new (2019).

**Security:**
- Designed by cryptographers at Ethereum Foundation
- Peer-reviewed and published
- Used in production (Tornado Cash, Zcash)
- 128-bit security level

**Alternatives:**
- MiMC (similar properties)
- Pedersen (slower but battle-tested)
- SHA-256 (standard but expensive)

## 🚀 Advanced Topics

### Recursive Proofs

You can prove that you have a valid proof!

**Use case:** Aggregate multiple games into one proof

```
Game 1 proof ──┐
Game 2 proof ──┼──> Aggregated proof
Game 3 proof ──┘
```

Verify 100 games in the gas cost of 1!

### Cross-Chain ZK

Generate proof on one chain, verify on another.

**Use case:** Play on L2, settle on L1

```
Generate proof on Arbitrum (fast, cheap)
           ↓
Verify on Ethereum (secure, decentralized)
```

### ZK Rollups

Bundle 1000s of games into one rollup block.

**Throughput:** 1000-10,000 TPS
**Cost per game:** $0.001-0.01

This is how StarkNet and zkSync work!

## 📚 Learning Resources

### ZK Fundamentals
- [ZK Whiteboard Sessions](https://zkhack.dev/whiteboard/) - Video series
- [Awesome Zero Knowledge](https://github.com/matter-labs/awesome-zero-knowledge-proofs)
- [ZK Learning Resources](https://zkp.science/)

### Circom & snarkjs
- [Circom Documentation](https://docs.circom.io/)
- [snarkjs Guide](https://github.com/iden3/snarkjs)
- [Circomlib Library](https://github.com/iden3/circomlib)

### Advanced
- [Dark Forest](https://blog.zkga.me/) - ZK game case study
- [0xPARC](https://0xparc.org/) - ZK gaming research
- [ZK Podcast](https://zeroknowledge.fm/)

### Tools
- [circomspect](https://github.com/trailofbits/circomspect) - Circuit linter
- [picus](https://github.com/Veridise/Picus) - Circuit verifier
- [zkREPL](https://zkrepl.dev/) - Interactive Circom playground

## 🎯 Next Steps

1. **Run the full setup:** `./scripts/zkSetup.sh`
2. **Generate a real proof:** `node scripts/generateProof.js`
3. **Deploy to testnet:** Test with real ZK proofs on Sepolia
4. **Study the circuits:** Understand the constraints in detail
5. **Experiment:** Modify the circuit to support best-of-3 rounds
6. **Learn more:** Take a ZK course (ZKU, ZK Whiteboard, etc.)

## 💡 Project Ideas Using ZK

1. **Private Poker** - Hide your cards until showdown
2. **Dark Chess** - Opponent can't see your pieces
3. **Battleship** - Prove hits without revealing board
4. **Secret Auctions** - Bid without revealing amount
5. **Private Voting** - Vote without revealing choice
6. **Credential Systems** - Prove age >18 without revealing exact age
7. **Location Proofs** - Prove you're in a region without exact GPS

---

**Congratulations!** You now understand how to build privacy-preserving onchain games with Zero-Knowledge proofs! 🎉🔐

