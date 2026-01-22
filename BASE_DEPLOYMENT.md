# Base Network Deployment Guide

Deploy your Rock Paper Scissors game to Base for **ultra-low costs** (99.95% cheaper than Ethereum mainnet)!

## Why Base?

- **Cost:** < $0.01 per game (vs $27+ on Ethereum)
- **Speed:** Fast confirmations (2 seconds)
- **EVM Compatible:** Your Solidity code works as-is
- **Growing Ecosystem:** Backed by Coinbase, $5.2B+ stablecoins
- **Perfect for Gaming:** Low fees enable casual gameplay

---

## Quick Start (5 Minutes)

### 1. Get Testnet Funds

First, let's deploy to **Base Sepolia** (testnet) for free testing:

**Option A: Coinbase Faucet** (Recommended)
1. Visit [Coinbase Faucet](https://portal.cdp.coinbase.com/products/faucet)
2. Connect your wallet
3. Select "Base Sepolia"
4. Claim free testnet ETH

**Option B: Bridge from Ethereum Sepolia**
1. Get Sepolia ETH from [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
2. Bridge to Base Sepolia via [Base Bridge](https://bridge.base.org/)

### 2. Configure Environment

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
# REQUIRED: Your wallet private key
PRIVATE_KEY=your_private_key_here_0x123...

# OPTIONAL: For contract verification on Basescan
BASESCAN_API_KEY=your_basescan_api_key_here
```

**To export your private key from MetaMask:**
1. Open MetaMask
2. Click the 3 dots menu → Account Details
3. Export Private Key
4. Enter password and copy the key

**To get a Basescan API key (free):**
1. Visit [Basescan API Keys](https://basescan.org/myapikey)
2. Sign up for a free account
3. Create a new API key
4. Copy to your `.env` file

### 3. Deploy to Testnet

```bash
# Compile the contract
npm run compile

# Deploy to Base Sepolia testnet
npm run deploy:base-testnet
```

You should see output like:
```
Deploying RockPaperScissors contract...
Deploying with account: 0x123...
Account balance: 0.5 ETH
RockPaperScissors deployed to: 0xabc123...
Waiting for block confirmations...
Confirmed!
Verifying contract on Basescan...
Contract verified!

=== Deployment Summary ===
Network: baseSepolia
Contract Address: 0xabc123...
Deployer: 0x123...
=========================
```

**Save your contract address!** You'll need it to interact with the game.

### 4. View on Block Explorer

Visit your contract on Base Sepolia Basescan:
```
https://sepolia.basescan.org/address/YOUR_CONTRACT_ADDRESS
```

---

## Deploy to Mainnet (Production)

### Prerequisites

1. **Real ETH on Base:** Bridge ETH to Base mainnet
   - Visit [Base Bridge](https://bridge.base.org/)
   - Connect wallet and bridge ETH from Ethereum
   - Recommended: Bridge at least 0.01 ETH for deployment + games

2. **Double-check everything:**
   - Contract has been thoroughly tested on testnet
   - You've played several test games successfully
   - Your `.env` file has the correct private key
   - You understand deployment is PERMANENT

### Deploy

```bash
# Deploy to Base mainnet
npm run deploy:base
```

Expected costs:
- **Deployment:** ~$0.30-0.50
- **Per game:** ~$0.01

---

## Verify Your Contract

If verification didn't happen automatically, you can verify manually:

```bash
# For testnet
npx hardhat verify --network baseSepolia YOUR_CONTRACT_ADDRESS

# For mainnet
npx hardhat verify --network base YOUR_CONTRACT_ADDRESS
```

Verification allows users to read your contract code directly on Basescan.

---

## Playing the Game on Base

### Using Hardhat Console

```bash
# Connect to Base Sepolia
npx hardhat console --network baseSepolia
```

Then in the console:

```javascript
// Connect to your deployed contract
const RPS = await ethers.getContractFactory("RockPaperScissors");
const rps = RPS.attach("YOUR_CONTRACT_ADDRESS");

// Get signers
const [player1, player2] = await ethers.getSigners();

// 1. Create game (0.01 ETH stake)
const stake = ethers.parseEther("0.01");
await rps.connect(player1).createGame(player2.address, { value: stake });

// 2. Join game
await rps.connect(player2).joinGame(0, { value: stake });

// 3. Commit moves
const Move = { Rock: 1, Paper: 2, Scissors: 3 };
const secret1 = "player1secret";
const secret2 = "player2secret";

const commit1 = await rps.getCommitmentHash(Move.Rock, secret1);
const commit2 = await rps.getCommitmentHash(Move.Scissors, secret2);

await rps.connect(player1).commitMove(0, commit1);
await rps.connect(player2).commitMove(0, commit2);

// 4. Reveal moves
await rps.connect(player1).revealMove(0, Move.Rock, secret1);
await rps.connect(player2).revealMove(0, Move.Scissors, secret2);

// 5. Check winner
const game = await rps.getGame(0);
console.log("Winner:", game.winner);
console.log("Player 1 (Rock):", player1.address);
console.log("Player 2 (Scissors):", player2.address);
// Player 1 should win! Rock beats Scissors
```

### Using a Frontend

You can also build a web interface using:
- **Wagmi + RainbowKit** (React - Recommended)
- **ethers.js** (Vanilla JS)
- **web3.js** (Alternative)

See [QUICKSTART.md](QUICKSTART.md) for more details on building a frontend.

---

## Cost Breakdown

### Deployment Costs (One-time)

| Action | Gas Used | Cost @ Base | Cost @ Ethereum |
|--------|----------|-------------|-----------------|
| Deploy Contract | 1,156,651 | **~$0.40** | ~$104.10 |

### Per-Game Costs

| Action | Gas Used | Cost @ Base | Cost @ Ethereum |
|--------|----------|-------------|-----------------|
| Create Game | 124,772 | **$0.003** | $11.23 |
| Join Game | 51,793 | **$0.002** | $4.66 |
| Commit Move (avg) | 65,483 | **$0.002** | $5.89 |
| Reveal Move (avg) | 47,704 | **$0.001** | $4.29 |
| **Total per Game** | 307,535 | **~$0.01** | ~$27.64 |

**Savings: 99.95%** compared to Ethereum mainnet!

---

## Network Information

### Base Sepolia (Testnet)
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Explorer:** https://sepolia.basescan.org
- **Faucet:** [Coinbase Faucet](https://portal.cdp.coinbase.com/products/faucet)

### Base Mainnet (Production)
- **Chain ID:** 8453
- **RPC URL:** https://mainnet.base.org
- **Explorer:** https://basescan.org
- **Bridge:** [Base Bridge](https://bridge.base.org/)

---

## Add Base to MetaMask

**Automatic:**
Visit [chainlist.org](https://chainlist.org/) and search for "Base"

**Manual:**

1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter details:

**Base Mainnet:**
- Network Name: Base
- RPC URL: https://mainnet.base.org
- Chain ID: 8453
- Currency Symbol: ETH
- Block Explorer: https://basescan.org

**Base Sepolia Testnet:**
- Network Name: Base Sepolia
- RPC URL: https://sepolia.base.org
- Chain ID: 84532
- Currency Symbol: ETH
- Block Explorer: https://sepolia.basescan.org

---

## Troubleshooting

### "insufficient funds for intrinsic transaction cost"
You need more ETH on Base. Bridge from Ethereum or use the faucet for testnet.

### "nonce has already been used"
Your transaction was already submitted. Check [Basescan](https://basescan.org) for your address.

### "UNPREDICTABLE_GAS_LIMIT"
Your contract call will fail. Check:
- Game exists and is in the correct state
- You're using the right player account
- Your move/secret matches your commitment

### Verification fails
Make sure you have `BASESCAN_API_KEY` in your `.env` file. Get one free at [basescan.org/myapikey](https://basescan.org/myapikey).

### Contract not showing on Basescan
Wait 30-60 seconds after deployment. Basescan needs time to index.

---

## Next Steps

1. **Test thoroughly** on Base Sepolia
2. **Build a frontend** for easier gameplay
3. **Deploy to mainnet** when ready
4. **Share your game** with the community!

Optional enhancements:
- Add ERC-20 token support for stakes
- Implement tournaments
- Create leaderboards
- Add NFT rewards for winners

---

## Resources

- **Base Docs:** https://docs.base.org/
- **Base Discord:** https://discord.gg/buildonbase
- **Basescan:** https://basescan.org
- **Base Bridge:** https://bridge.base.org/
- **Hardhat Docs:** https://hardhat.org/docs

---

## Need Help?

- Check [QUICKSTART.md](QUICKSTART.md) for general setup
- Read [README.md](README.md) for contract details
- Visit [Base Discord](https://discord.gg/buildonbase) for community support
- Review contract on [Basescan](https://basescan.org) to debug issues

Happy deploying! 🎮⛓️
