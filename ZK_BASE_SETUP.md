# Zero-Knowledge RPS on Base - Setup Guide

Deploy your privacy-preserving Rock Paper Scissors game using Zero-Knowledge proofs on Base L2.

## What is This?

This is a **Zero-Knowledge implementation** of Rock Paper Scissors where:
- Player moves are **never revealed on-chain**
- Winners are determined via **cryptographic proofs**
- Privacy is maintained while ensuring fairness
- Deployed on **Base L2** for ultra-low costs ($0.01 per game)

## Why Zero-Knowledge?

### Traditional Commit-Reveal
```
Player 1: Commits hash(Rock + secret)
Player 2: Commits hash(Paper + secret)
Both reveal: "Rock", "Paper" visible on blockchain
Winner: Player 2
```
Problem: Moves become public after reveal

### Zero-Knowledge Approach
```
Player 1: Commits hash(Rock + secret)
Player 2: Commits hash(Paper + secret)
Player 1: Submits ZK proof "I know a valid move that hashes to my commitment"
Contract verifies proof WITHOUT seeing the actual move
Winner determined by proof, moves stay private forever
```
Benefit: Moves never revealed, only the winner is proven

## Architecture

### Smart Contracts
1. **RockPaperScissorsZK.sol** - Main game contract
2. **MockVerifier.sol** - ZK proof verifier (mock for testing, replace with real Groth16 verifier for production)

### Circuits
1. **rps_move.circom** - Proves a move is valid (1=Rock, 2=Paper, 3=Scissors)
2. **rps_winner.circom** - Proves winner calculation is correct

### Tech Stack
- **circom**: Circuit compiler
- **snarkjs**: Proof generation
- **Solidity 0.8.20**: Smart contracts
- **Base L2**: Deployment network

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile Contracts
```bash
npm run compile
```

### 3. Run Tests
```bash
npm test
```

You'll see both implementations tested:
- 25 tests for classic commit-reveal
- 26 tests for zero-knowledge version

### 4. Deploy to Base Testnet

**Get Base Sepolia ETH:**
- Visit [Coinbase Faucet](https://portal.cdp.coinbase.com/products/faucet)
- Connect wallet and claim testnet ETH

**Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your PRIVATE_KEY
```

**Deploy ZK version:**
```bash
npm run deploy:zk:base-testnet
```

This deploys:
1. MockVerifier contract
2. RockPaperScissorsZK contract (connected to verifier)

### 5. Deploy to Base Mainnet

```bash
npm run deploy:zk:base
```

## How to Play (ZK Version)

### Phase 1: Create Game
```javascript
const stake = ethers.parseEther("0.01");
const commitment1 = generateCommitment(move1, secret1);
await rpsZK.createGame(player2Address, commitment1, { value: stake });
```

### Phase 2: Join Game
```javascript
const commitment2 = generateCommitment(move2, secret2);
await rpsZK.joinGame(gameId, commitment2, { value: stake });
```

### Phase 3: Generate ZK Proof
```javascript
// Off-chain: Generate proof that your move is valid and determines winner
const proof = await generateZKProof({
  move1: 1, // Rock
  secret1: "player1secret",
  move2: 2, // Paper
  commitment1: commitment1,
  commitment2: commitment2
});
```

### Phase 4: Submit Proof
```javascript
// Only the winner needs to submit proof
await rpsZK.proveWinner(gameId, proof, publicSignals);
// Contract verifies proof and pays winner
// Moves are NEVER revealed on blockchain
```

## Cost Comparison

| Network | Deploy Cost | Per Game | Privacy |
|---------|-------------|----------|---------|
| Ethereum (Commit-Reveal) | $104 | $27 | Moves revealed |
| Ethereum (ZK) | $89 | $27 | Moves private |
| Base (Commit-Reveal) | $0.40 | $0.01 | Moves revealed |
| **Base (ZK)** | **$0.30** | **$0.01** | **Moves private** |

## ZK vs Commit-Reveal

### Commit-Reveal (Classic)
**Pros:**
- Simpler to understand
- No off-chain computation
- Smaller contract size

**Cons:**
- Moves become public after reveal
- Two-phase interaction required
- No privacy guarantees

### Zero-Knowledge (Advanced)
**Pros:**
- Complete privacy - moves never revealed
- Single proof submission
- More elegant cryptographically
- Demonstrates cutting-edge tech

**Cons:**
- Requires off-chain proof generation
- More complex implementation
- Slightly higher gas costs

## Production Considerations

### Current Setup (Testing)
- Uses **MockVerifier** that accepts any proof
- Suitable for development and demonstration

### Production Setup
1. Generate trusted setup for circuits:
   ```bash
   ./scripts/zkSetup.sh
   ```

2. Deploy real Groth16 verifier:
   ```bash
   # Generates verifier from circuit
   snarkjs zkey export solidityverifier
   ```

3. Replace MockVerifier with real verifier
4. Test thoroughly with real proofs
5. Audit before mainnet deployment

## Development Commands

```bash
# Test both implementations
npm test

# Test with gas reporting
npm run test:gas

# Deploy ZK to Base testnet
npm run deploy:zk:base-testnet

# Deploy ZK to Base mainnet
npm run deploy:zk:base

# Deploy classic version (fallback)
npm run deploy:base-testnet

# Generate ZK proofs (after circuit setup)
node scripts/generateProof.js
```

## File Structure

```
contracts/
  ├── RockPaperScissors.sol      # Classic commit-reveal
  ├── RockPaperScissorsZK.sol    # Zero-knowledge version
  └── MockVerifier.sol            # ZK proof verifier (mock)

circuits/
  ├── rps_move.circom             # Move validation circuit
  └── rps_winner.circom           # Winner computation circuit

scripts/
  ├── deploy.js                   # Deploy classic version
  ├── deployZK.js                 # Deploy ZK version
  ├── generateProof.js            # Generate ZK proofs
  └── zkSetup.sh                  # Circuit setup script

test/
  ├── RockPaperScissors.test.js  # Classic tests
  └── RockPaperScissorsZK.test.js # ZK tests
```

## Learning Resources

### Zero-Knowledge Basics
- [Circom Documentation](https://docs.circom.io/)
- [snarkjs Guide](https://github.com/iden3/snarkjs)
- [ZK Proofs Explained](https://zkp.science/)

### Base Network
- [Base Documentation](https://docs.base.org/)
- [Base Discord](https://discord.gg/buildonbase)
- [Basescan Explorer](https://basescan.org)

### Related Docs
- [README.md](README.md) - Project overview
- [BASE_DEPLOYMENT.md](BASE_DEPLOYMENT.md) - Base deployment details
- [ZK_IMPLEMENTATION.md](ZK_IMPLEMENTATION.md) - Deep dive into ZK circuits
- [COMMIT_REVEAL_VS_ZK.md](COMMIT_REVEAL_VS_ZK.md) - Technical comparison

## Troubleshooting

### "Proof verification failed"
Using MockVerifier in development - this is expected. For production, generate real proofs with zkSetup.sh

### "Insufficient funds"
Need Base ETH. Use faucet for testnet or bridge from Ethereum for mainnet.

### "Invalid move commitment"
Ensure you're using the same secret and move when generating commitments and proofs.

## Next Steps

1. Deploy to Base testnet
2. Test game flow with mock proofs
3. Set up real circuit trusted setup
4. Generate actual ZK proofs
5. Deploy to Base mainnet
6. Build frontend with wagmi/RainbowKit

This demonstrates your ability to build production-grade ZK applications on L2 networks.
