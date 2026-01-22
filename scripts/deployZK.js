const hre = require("hardhat");

async function main() {
  console.log("Deploying RockPaperScissorsZK contract with MockVerifier...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy MockVerifier first
  console.log("\nDeploying MockVerifier...");
  const MockVerifier = await hre.ethers.getContractFactory("MockVerifier");
  const verifier = await MockVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("MockVerifier deployed to:", verifierAddress);

  // Deploy RockPaperScissorsZK with verifier address
  console.log("\nDeploying RockPaperScissorsZK...");
  const RockPaperScissorsZK = await hre.ethers.getContractFactory("RockPaperScissorsZK");
  const rpsZK = await RockPaperScissorsZK.deploy(verifierAddress);
  await rpsZK.waitForDeployment();
  const rpsZKAddress = await rpsZK.getAddress();
  console.log("RockPaperScissorsZK deployed to:", rpsZKAddress);

  // Wait for block confirmations (if not on hardhat network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await rpsZK.deploymentTransaction().wait(6);
    console.log("Confirmed!");

    // Verify contracts on block explorer (if API key is configured)
    const isBaseNetwork = hre.network.name === "base" || hre.network.name === "baseSepolia";
    const apiKey = isBaseNetwork ? process.env.BASESCAN_API_KEY : process.env.ETHERSCAN_API_KEY;
    const explorerName = isBaseNetwork ? "Basescan" : "Etherscan";

    if (apiKey) {
      console.log(`\nVerifying contracts on ${explorerName}...`);

      try {
        console.log("Verifying MockVerifier...");
        await hre.run("verify:verify", {
          address: verifierAddress,
          constructorArguments: [],
        });
        console.log("MockVerifier verified!");
      } catch (error) {
        console.log("MockVerifier verification failed:", error.message);
      }

      try {
        console.log("Verifying RockPaperScissorsZK...");
        await hre.run("verify:verify", {
          address: rpsZKAddress,
          constructorArguments: [verifierAddress],
        });
        console.log("RockPaperScissorsZK verified!");
      } catch (error) {
        console.log("RockPaperScissorsZK verification failed:", error.message);
      }
    } else {
      console.log(`\n⚠️  Skipping verification - no ${explorerName} API key configured`);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("MockVerifier Address:", verifierAddress);
  console.log("RockPaperScissorsZK Address:", rpsZKAddress);
  console.log("Deployer:", deployer.address);
  console.log("=========================\n");

  // Example: Create a test game (local only)
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    console.log("Creating a test ZK game...");
    const [, player1, player2] = await hre.ethers.getSigners();

    const stake = hre.ethers.parseEther("0.1");

    // Generate mock commitments (in real scenario, these come from ZK proof generation)
    const commitment1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("player1commitment"));
    const commitment2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("player2commitment"));

    const tx1 = await rpsZK.connect(player1).createGame(player2.address, commitment1, { value: stake });
    await tx1.wait();

    const tx2 = await rpsZK.connect(player2).joinGame(0, commitment2, { value: stake });
    await tx2.wait();

    console.log("Test ZK game created! Game ID: 0");
    console.log("Player1:", player1.address);
    console.log("Player2:", player2.address);
    console.log("Stake:", hre.ethers.formatEther(stake), "ETH");
    console.log("\nNote: Use generateProof.js to create ZK proofs and complete the game");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
