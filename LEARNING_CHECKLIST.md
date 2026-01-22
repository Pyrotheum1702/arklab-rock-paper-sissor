# Learning Checklist

Use this checklist to track your understanding of the concepts in this project.

## Smart Contract Basics

- [ ] I understand what a smart contract is
- [ ] I understand how Solidity enums work (`Move`, `GameState`)
- [ ] I understand how Solidity structs work (`Game`)
- [ ] I understand mappings (`mapping(uint256 => Game)`)
- [ ] I understand how events work and why they're useful
- [ ] I understand custom errors vs `require()` (gas savings)
- [ ] I understand payable functions and `msg.value`
- [ ] I understand how to send ETH using `.call{value: amount}("")`

## Commit-Reveal Pattern

- [ ] I understand why we need commit-reveal (blockchain transparency problem)
- [ ] I understand how `keccak256` hashing works
- [ ] I understand `abi.encodePacked()` for creating hashes
- [ ] I understand how to commit: `hash(move + secret)`
- [ ] I understand how to reveal: submit `move` and `secret`, contract verifies
- [ ] I can explain why changing the move after committing is impossible
- [ ] I can explain why seeing opponent's commitment doesn't help

## Game Logic

- [ ] I understand the game state machine:
  - [ ] `WaitingForPlayer2` - waiting for opponent to join
  - [ ] `CommitPhase` - both players submit commitments
  - [ ] `RevealPhase` - both players reveal moves
  - [ ] `Completed` - game finished
- [ ] I understand the commit phase logic
- [ ] I understand the reveal phase logic
- [ ] I understand winner determination logic:
  - [ ] Rock beats Scissors
  - [ ] Paper beats Rock
  - [ ] Scissors beats Paper
  - [ ] Same move = Draw
- [ ] I understand the timeout mechanism
- [ ] I understand how funds are distributed (winner takes all, or refund on draw)

## Security & Best Practices

- [ ] I understand access control (who can call which functions)
- [ ] I understand input validation (checking for invalid inputs)
- [ ] I understand the checks-effects-interactions pattern
- [ ] I understand why we use custom errors (gas efficiency)
- [ ] I understand how to prevent reentrancy attacks
- [ ] I understand why we validate `msg.sender` and `msg.value`
- [ ] I can identify potential security issues in smart contracts

## Testing

- [ ] I can write tests using Hardhat + Chai
- [ ] I understand how to test success cases
- [ ] I understand how to test failure cases (`expect().to.be.revertedWith`)
- [ ] I understand how to manipulate time in tests (`time.increase()`)
- [ ] I understand how to check balances before/after
- [ ] I understand how to check events were emitted
- [ ] I can read and understand gas reports

## Hardhat Development Environment

- [ ] I can initialize a Hardhat project
- [ ] I can compile contracts (`npm run compile`)
- [ ] I can run tests (`npm test`)
- [ ] I can deploy contracts (`npx hardhat run scripts/deploy.js`)
- [ ] I understand hardhat.config.js configuration
- [ ] I can use the Hardhat console for manual testing
- [ ] I understand the difference between local node and testnet

## Practical Skills

- [ ] I can create a new game programmatically
- [ ] I can generate a commitment hash
- [ ] I can commit a move to the blockchain
- [ ] I can reveal a move
- [ ] I can query game state
- [ ] I can handle timeout situations
- [ ] I can read contract events
- [ ] I can estimate gas costs

## Advanced Concepts

- [ ] I understand the trade-offs of onchain gaming (gas costs vs decentralization)
- [ ] I understand why L2s (Arbitrum, Optimism) are better for games
- [ ] I can explain when to use onchain vs off-chain logic
- [ ] I understand how to integrate this with a frontend (ethers.js/wagmi)
- [ ] I can identify improvements to this contract
- [ ] I can think of other games that could use commit-reveal

## Questions to Test Your Understanding

Answer these to verify your knowledge:

### Basic Questions
1. Why can't players just submit their moves directly (Rock, Paper, or Scissors)?
2. What happens if both players reveal the same move?
3. How long do players have to reveal after committing?
4. What happens if a player doesn't reveal their move?

### Intermediate Questions
5. Why do we use `keccak256(abi.encodePacked(uint8(move), secret))` instead of just `keccak256(move)`?
6. What prevents a player from changing their move after seeing the opponent's commitment?
7. Why do we need the `secret` in the commitment? Why not just hash the move?
8. How does the contract verify that a reveal is correct?

### Advanced Questions
9. What attack vectors exist in this contract? (Hint: think about timeouts, griefing)
10. How would you modify this to support best-of-3 rounds?
11. How would you make this work with ERC20 tokens instead of ETH?
12. What would change if we wanted to support more than 2 players?

### Security Questions
13. Is this contract vulnerable to reentrancy attacks? Why or why not?
14. Can a player front-run the opponent's reveal? What would happen?
15. What happens if someone sends ETH directly to the contract (not via game functions)?
16. Can the contract creator (deployer) cheat or manipulate games?

## Practical Exercises

Complete these to solidify your learning:

- [ ] **Exercise 1**: Modify the timeout from 5 minutes to 10 minutes
- [ ] **Exercise 2**: Add a new event `GameDrawn` when games end in a draw
- [ ] **Exercise 3**: Add a function to cancel a game if Player2 never joins (refund Player1)
- [ ] **Exercise 4**: Create a test for the scenario where Player1 commits but Player2 never commits
- [ ] **Exercise 5**: Add support for Rock-Paper-Scissors-Lizard-Spock (5 moves)
- [ ] **Exercise 6**: Deploy to Sepolia testnet and play a real game
- [ ] **Exercise 7**: Build a simple CLI interface using Node.js
- [ ] **Exercise 8**: Add a view function to get all active games
- [ ] **Exercise 9**: Create a leaderboard (track wins per address)
- [ ] **Exercise 10**: Build a React frontend with ethers.js

## Next Steps After Mastery

Once you've checked most boxes above:

1. **Build something new**: Create your own onchain game (coin flip, dice, poker)
2. **Study advanced games**: Look at Dark Forest, Influence, or other complex onchain games
3. **Learn game frameworks**: Explore MUD or Dojo for more complex games
4. **Contribute**: Share your learnings, write tutorials, help others
5. **Keep building**: The best way to learn is by building more projects

## Resources for Each Topic

### Commit-Reveal
- OpenZeppelin Commit-Reveal: https://docs.openzeppelin.com/contracts/4.x/api/utils#Commit
- Ethereum.org on Commit-Reveal: Search "commit reveal scheme ethereum"

### Testing
- Hardhat Testing: https://hardhat.org/hardhat-runner/docs/guides/test-contracts
- Chai Matchers: https://ethereum-waffle.readthedocs.io/en/latest/matchers.html

### Security
- Smart Contract Security: https://github.com/crytic/building-secure-contracts
- Solidity Security Considerations: https://docs.soliditylang.org/en/latest/security-considerations.html

### Advanced
- Autonomous Worlds: https://0xparc.org/blog/autonomous-worlds
- MUD Framework: https://mud.dev/
- Onchain Gaming: https://lattice.xyz/

---

Track your progress and revisit this checklist as you learn. Good luck!
