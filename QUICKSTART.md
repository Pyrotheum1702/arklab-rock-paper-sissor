# Quick Start Guide

Get started with the Rock Paper Scissors onchain game in 5 minutes!

## Prerequisites

- Node.js (v16+ recommended, though v18 works with warnings)
- npm or yarn

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Compile the contract
npm run compile

# 3. Run tests to verify everything works
npm test
```

You should see all 25 tests passing.

## Try the Demo

Run the interactive demo to see a complete game in action:

```bash
npx hardhat run scripts/playGame.js
```

This will:
- Deploy the contract to a local Hardhat network
- Create a game between two players
- Show the commit-reveal process
- Determine and display the winner

## Understanding the Game

### The Problem: Blockchain is Transparent

If Player 1 submits "Rock" first, Player 2 can see it and choose "Paper" to win. This is cheating!

### The Solution: Commit-Reveal

1. **Commit Phase**: Players submit `hash(move + secret)` - encrypted moves
2. **Reveal Phase**: After both committed, players reveal their actual moves
3. **Verification**: Contract checks the reveals match the commitments
4. **Winner**: Contract determines winner using Rock Paper Scissors rules

### Example Commitment

To commit "Rock" with secret "mySecret123":

```javascript
const commitment = keccak256(abi.encodePacked(uint8(1), "mySecret123"))
// Result: 0xabc123... (this hides your move)
```

When you reveal, you send `1` (Rock) and `"mySecret123"`. The contract hashes these and checks they match your commitment. If they don't match, the reveal is rejected!

## Playing Manually

### Option 1: Using Hardhat Console

```bash
# Start local node (terminal 1)
npm run node

# In another terminal (terminal 2)
npx hardhat console --network localhost
```

Then in the console:

```javascript
// Deploy contract
const RPS = await ethers.getContractFactory("RockPaperScissors");
const rps = await RPS.deploy();
await rps.waitForDeployment();
const address = await rps.getAddress();
console.log("Contract:", address);

// Get players
const [owner, player1, player2] = await ethers.getSigners();

// 1. Create game
const stake = ethers.parseEther("1.0");
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
console.log("Player 1:", player1.address);
console.log("Player 2:", player2.address);
```

### Option 2: Deploy and Test on Testnet

1. Get some Sepolia ETH from a faucet:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia

2. Create `.env` file (copy from `.env.example`):
   ```env
   ALCHEMY_API_KEY=your_key_here
   PRIVATE_KEY=your_private_key_here
   ```

3. Deploy:
   ```bash
   npm run deploy:sepolia
   ```

4. Play on Etherscan or using the console connected to Sepolia

## Gas Costs (Approximate)

On Ethereum mainnet (at 30 gwei gas price):

| Action | Gas | Cost @ 30 gwei | Cost @ $3000 ETH |
|--------|-----|----------------|------------------|
| Create Game | ~125,000 | 0.00375 ETH | $11.25 |
| Join Game | ~52,000 | 0.00156 ETH | $4.68 |
| Commit Move | ~65,000 | 0.00195 ETH | $5.85 |
| Reveal Move | ~48,000-74,000 | 0.00144-0.00222 ETH | $4.32-$6.66 |
| Total per game | ~310,000-390,000 | 0.0093-0.0117 ETH | $27.90-$35.10 |

**For lower costs**: Deploy on L2s like Arbitrum, Optimism, or Base where gas is 10-100x cheaper!

## Common Issues

### "Invalid move" error
- Moves must be: 1=Rock, 2=Paper, 3=Scissors
- You cannot use 0 or numbers > 3

### "CommitMismatch" error
- Your revealed move/secret doesn't match your commitment
- Make sure you're using the exact same secret you used when committing
- JavaScript strings are case-sensitive: "Secret" ≠ "secret"

### "WrongGameState" error
- You're trying to do an action in the wrong phase
- Check the game state: 0=WaitingForPlayer2, 1=CommitPhase, 2=RevealPhase, 3=Completed

### "TimeoutNotReached" error
- You're trying to claim timeout too early
- Wait 5 minutes after both players have committed

### "Unauthorized" error
- You're not a player in this game
- Only the challenged player (player2) can join
- Only players who made moves can call the relevant functions

## Next Steps

1. **Read the full README**: [README.md](README.md)
2. **Study the contract**: [contracts/RockPaperScissors.sol](contracts/RockPaperScissors.sol)
3. **Explore the tests**: [test/RockPaperScissors.test.js](test/RockPaperScissors.test.js)
4. **Build a frontend**: Create a React app with wagmi or ethers.js
5. **Deploy to mainnet**: After thorough testing on testnet

## Learn More

- **Commit-Reveal Pattern**: https://docs.openzeppelin.com/contracts/4.x/api/utils#Commit
- **Hardhat Docs**: https://hardhat.org/docs
- **Solidity Docs**: https://docs.soliditylang.org/
- **Gas Optimization**: https://ethereum.org/en/developers/docs/smart-contracts/gas/

## Need Help?

If you get stuck:
1. Check the test files to see working examples
2. Read the inline comments in the smart contract
3. Use `console.log` in the scripts for debugging
4. Ask questions in Web3 developer communities

Happy coding!
