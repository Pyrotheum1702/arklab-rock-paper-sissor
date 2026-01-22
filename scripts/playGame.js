const hre = require("hardhat");

/**
 * Interactive script to play Rock Paper Scissors
 * This demonstrates the complete game flow
 */

// Move enum
const Move = {
  None: 0,
  Rock: 1,
  Paper: 2,
  Scissors: 3
};

const MoveNames = ["None", "Rock", "Paper", "Scissors"];

async function main() {
  console.log("\n🎮 Rock Paper Scissors - Onchain Game Demo\n");

  // Get signers
  const [deployer, player1, player2] = await hre.ethers.getSigners();

  console.log("Players:");
  console.log("  Player 1:", player1.address);
  console.log("  Player 2:", player2.address);
  console.log();

  // Deploy contract
  console.log("📝 Deploying contract...");
  const RPS = await hre.ethers.getContractFactory("RockPaperScissors");
  const rps = await RPS.deploy();
  await rps.waitForDeployment();
  const contractAddress = await rps.getAddress();
  console.log("✅ Contract deployed at:", contractAddress);
  console.log();

  // Game parameters
  const stake = hre.ethers.parseEther("1.0");
  const player1Move = Move.Rock;
  const player2Move = Move.Scissors;
  const secret1 = "player1SecretKey";
  const secret2 = "player2SecretKey";

  console.log("🎲 Game Setup:");
  console.log("  Stake:", hre.ethers.formatEther(stake), "ETH");
  console.log("  Player 1 will play:", MoveNames[player1Move]);
  console.log("  Player 2 will play:", MoveNames[player2Move]);
  console.log();

  // Step 1: Create game
  console.log("📋 Step 1: Player 1 creates game and challenges Player 2");
  const createTx = await rps.connect(player1).createGame(player2.address, { value: stake });
  await createTx.wait();
  const gameId = 0;
  console.log("✅ Game created! Game ID:", gameId);
  console.log();

  // Step 2: Player 2 joins
  console.log("🤝 Step 2: Player 2 joins the game");
  const joinTx = await rps.connect(player2).joinGame(gameId, { value: stake });
  await joinTx.wait();
  console.log("✅ Player 2 joined! Total pot:", hre.ethers.formatEther(stake * 2n), "ETH");
  console.log();

  // Step 3: Generate commitments (off-chain)
  console.log("🔐 Step 3: Both players commit their moves (encrypted)");
  const commit1 = await rps.getCommitmentHash(player1Move, secret1);
  const commit2 = await rps.getCommitmentHash(player2Move, secret2);

  console.log("  Player 1 commitment:", commit1);
  console.log("  Player 2 commitment:", commit2);
  console.log("  (These hide the actual moves!)");
  console.log();

  // Step 4: Submit commitments
  console.log("📤 Step 4: Players submit their commitments to the blockchain");
  const commitTx1 = await rps.connect(player1).commitMove(gameId, commit1);
  await commitTx1.wait();
  console.log("  ✅ Player 1 committed");

  const commitTx2 = await rps.connect(player2).commitMove(gameId, commit2);
  await commitTx2.wait();
  console.log("  ✅ Player 2 committed");
  console.log("  ⏰ Reveal phase started! Deadline in 5 minutes");
  console.log();

  // Step 5: Reveal moves
  console.log("🎭 Step 5: Players reveal their actual moves");
  const revealTx1 = await rps.connect(player1).revealMove(gameId, player1Move, secret1);
  await revealTx1.wait();
  console.log("  ✅ Player 1 revealed:", MoveNames[player1Move]);

  const revealTx2 = await rps.connect(player2).revealMove(gameId, player2Move, secret2);
  await revealTx2.wait();
  console.log("  ✅ Player 2 revealed:", MoveNames[player2Move]);
  console.log();

  // Step 6: Check results
  console.log("🏆 Step 6: Game Results");
  const game = await rps.getGame(gameId);

  console.log("\n=== GAME SUMMARY ===");
  console.log("Player 1:", player1.address);
  console.log("  Move:", MoveNames[Number(game.move1)]);
  console.log();
  console.log("Player 2:", player2.address);
  console.log("  Move:", MoveNames[Number(game.move2)]);
  console.log();

  if (game.winner === hre.ethers.ZeroAddress) {
    console.log("Result: 🤝 DRAW! Both players get their stake back");
  } else {
    const winnerName = game.winner === player1.address ? "Player 1" : "Player 2";
    console.log(`Result: 🎉 ${winnerName} WINS!`);
    console.log("Winner:", game.winner);
    console.log("Prize:", hre.ethers.formatEther(stake * 2n), "ETH");
  }
  console.log("===================\n");

  // Verify contract balance is zero
  const contractBalance = await hre.ethers.provider.getBalance(contractAddress);
  console.log("Contract balance after game:", hre.ethers.formatEther(contractBalance), "ETH");
  console.log("(Should be 0 - all funds distributed)");
  console.log();

  console.log("✨ Game complete! All transactions succeeded.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
