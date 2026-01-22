# Rock Paper Scissors - Zero-Knowledge Onchain Game

A fully decentralized Rock Paper Scissors game built with **Zero-Knowledge Proofs** on **Base L2**. This project demonstrates advanced blockchain gaming with privacy-preserving cryptography and ultra-low transaction costs.

**Key Highlights:**
- **Zero-Knowledge Proofs**: Moves stay private forever, never revealed on-chain
- **Base L2 Deployment**: $0.01 per game (99.95% cheaper than Ethereum)
- **Two Implementations**: ZK (primary) and Commit-Reveal (fallback)

**Quick Start:** See [ZK_BASE_SETUP.md](ZK_BASE_SETUP.md) for deployment guide.

## Game Overview

Two players challenge each other to Rock Paper Scissors with ETH stakes. The winner takes the entire pot (2x stake), or in case of a draw, both players get their stake back.

### Key Features

- **Commit-Reveal Scheme**: Prevents cheating by hiding moves until both players have committed
- **Timeout Protection**: If a player doesn't reveal, opponent can claim the win after 5 minutes
- **Challenge System**: Player 1 creates a game and challenges a specific address
- **ETH Stakes**: Real money on the line makes it interesting
- **Fully Decentralized**: No backend needed, all logic runs on-chain

## How the Commit-Reveal Works

Since blockchain is transparent, we can't just submit moves directly (Player 2 would see Player 1's move and always win). Instead:

1. **Commit Phase**: Each player submits `hash(move + secret)` - their move encrypted with a secret
2. **Reveal Phase**: After both committed, each player reveals their actual move + secret
3. **Verification**: The contract checks that `hash(revealed_move + revealed_secret)` matches the commitment
4. **Winner Determination**: Contract applies Rock Paper Scissors rules and pays out

This ensures neither player can cheat by:
- Seeing the opponent's move first (it's encrypted during commit)
- Changing their move after committing (reveal must match commitment)

## Game Flow

```
1. Player1 creates game with 1 ETH stake, challenges Player2
                    ↓
2. Player2 joins with 1 ETH stake (total pot: 2 ETH)
                    ↓
3. Both players commit their moves (encrypted)
                    ↓
4. Both players reveal their moves (5 min deadline)
                    ↓
5. Smart contract determines winner and pays out
   - Winner gets 2 ETH
   - Draw = both get 1 ETH refund
```

## Tech Stack

- **Solidity ^0.8.20**: Smart contract language
- **Hardhat**: Development environment
- **Ethers.js v6**: Blockchain interaction library
- **Chai**: Testing framework

## Installation

```bash
# Clone or navigate to the project
cd rps-onchain-game

# Install dependencies
npm install
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas
```

The test suite covers:
- Game creation and joining
- Commit phase logic
- Reveal phase and winner determination
- All winning combinations (Rock beats Scissors, etc.)
- Draw scenarios
- Timeout mechanisms
- Error cases and security checks

Example test output:
```
  RockPaperScissors
    Game Creation
      ✔ Should create a game with valid parameters
      ✔ Should reject game creation with zero stake
    Reveal Phase and Winner Determination
      ✔ Should allow Rock to beat Scissors
      ✔ Should handle draw correctly
    Timeout Mechanism
      ✔ Should allow timeout claim after deadline
```

## Deployment

### Local Development

```bash
# Start local Hardhat node (terminal 1)
npm run node

# Deploy to local node (terminal 2)
npm run deploy:local
```

### Testnet (Sepolia)

1. Create a `.env` file:
```env
ALCHEMY_API_KEY=your_alchemy_api_key
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key (optional, for verification)
```

2. Update [hardhat.config.js](hardhat.config.js) with your RPC URLs

3. Deploy:
```bash
npm run deploy:sepolia
```

### Mainnet

**Warning**: Make sure you've thoroughly tested on testnet first!

```bash
npm run deploy:mainnet
```

## How to Play (Using Scripts)

### Quick Demo

Run the automated demo to see a complete game:

```bash
npx hardhat run scripts/playGame.js --network localhost
```

This will:
1. Deploy the contract
2. Create a game between two players
3. Show the complete commit-reveal flow
4. Determine and display the winner

### Manual Play (Using Hardhat Console)

```bash
npx hardhat console --network localhost
```

```javascript
// Get contract instance
const RPS = await ethers.getContractFactory("RockPaperScissors");
const rps = await RPS.attach("YOUR_CONTRACT_ADDRESS");

// Get signers
const [deployer, player1, player2] = await ethers.getSigners();

// 1. Create game
const stake = ethers.parseEther("0.1");
await rps.connect(player1).createGame(player2.address, { value: stake });

// 2. Join game
await rps.connect(player2).joinGame(0, { value: stake });

// 3. Commit moves
const Move = { Rock: 1, Paper: 2, Scissors: 3 };
const secret1 = "mySecretKey123";
const secret2 = "anotherSecret456";

const commit1 = await rps.getCommitmentHash(Move.Rock, secret1);
const commit2 = await rps.getCommitmentHash(Move.Scissors, secret2);

await rps.connect(player1).commitMove(0, commit1);
await rps.connect(player2).commitMove(0, commit2);

// 4. Reveal moves
await rps.connect(player1).revealMove(0, Move.Rock, secret1);
await rps.connect(player2).revealMove(0, Move.Scissors, secret2);

// 5. Check results
const game = await rps.getGame(0);
console.log("Winner:", game.winner);
```

## Contract API

### Main Functions

#### `createGame(address _player2) payable`
- Creates a new game and challenges a specific address
- Must send ETH as stake (msg.value)
- Returns game ID

#### `joinGame(uint256 _gameId) payable`
- Join a game as Player 2
- Must send exact same ETH as Player 1's stake
- Only the challenged address can join

#### `commitMove(uint256 _gameId, bytes32 _commitment)`
- Submit your encrypted move
- Commitment = `keccak256(abi.encodePacked(uint8(move), secret))`
- Use `getCommitmentHash()` to generate

#### `revealMove(uint256 _gameId, Move _move, string _secret)`
- Reveal your actual move after both committed
- Move: 1=Rock, 2=Paper, 3=Scissors
- Secret must match what you used in commitment

#### `claimTimeout(uint256 _gameId)`
- Claim win if opponent didn't reveal within 5 minutes
- Only available to the player who DID reveal

#### `getCommitmentHash(Move _move, string _secret) → bytes32`
- Helper function to generate commitment hash
- Use this off-chain to create your commitment

#### `getGame(uint256 _gameId) → (player1, player2, stake, state, move1, move2, winner)`
- View function to get game details

## Learning Points

This project teaches:

1. **Commit-Reveal Pattern**: Essential for any game where information needs to be hidden temporarily
2. **Game State Machines**: Managing complex state transitions (WaitingForPlayer2 → CommitPhase → RevealPhase → Completed)
3. **Timeout Mechanisms**: Preventing griefing by allowing timeout claims
4. **ETH Handling**: Receiving, holding, and distributing ETH safely
5. **Security Best Practices**: Input validation, access control, reentrancy protection
6. **Gas Optimization**: Efficient storage and computation
7. **Testing**: Comprehensive test coverage for smart contracts

## Security Considerations

- **Commit-Reveal**: Prevents front-running and cheating
- **Timeout Protection**: Prevents games from hanging forever
- **Access Control**: Only authorized players can make moves
- **Reentrancy Protection**: Uses checks-effects-interactions pattern
- **Input Validation**: All inputs are validated
- **No Randomness Issues**: No need for VRF, players control their moves

**Note**: This is a learning project. For production, consider:
- Professional security audit
- Upgradeability patterns
- More sophisticated timeout handling
- Gas optimization for L1 deployment

## Gas Estimates

Approximate gas costs (will vary):
- Create game: ~100,000 gas
- Join game: ~80,000 gas
- Commit move: ~50,000 gas
- Reveal move: ~60,000-150,000 gas (includes winner determination)

## Contributing

This is a learning project, but feel free to:
- Open issues for bugs or questions
- Suggest improvements
- Fork and experiment

## License

ISC

## Next Steps

To extend this project, consider:

1. **Frontend**: Build a React app with ethers.js/wagmi
2. **Multiple Games**: Allow players to have multiple concurrent games
3. **Leaderboard**: Track wins/losses on-chain
4. **NFT Trophies**: Mint NFTs for winners
5. **Tournament Mode**: Bracket-style tournaments
6. **Best of 3/5**: Multi-round matches
7. **L2 Deployment**: Deploy on Arbitrum/Optimism for lower gas
8. **ERC20 Stakes**: Allow betting with custom tokens

## Resources

- [Solidity Docs](https://docs.soliditylang.org/)
- [Hardhat Docs](https://hardhat.org/docs)
- [Ethers.js Docs](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Commit-Reveal Schemes](https://docs.openzeppelin.com/contracts/4.x/api/utils#Commit)

---

Happy Learning! Feel free to reach out with questions or share what you build!
