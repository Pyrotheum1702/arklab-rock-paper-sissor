const hre = require("hardhat");

async function main() {
  console.log("Deploying RockPaperScissors contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const RockPaperScissors = await hre.ethers.getContractFactory("RockPaperScissors");
  const rps = await RockPaperScissors.deploy();

  await rps.waitForDeployment();

  const address = await rps.getAddress();
  console.log("RockPaperScissors deployed to:", address);

  // Wait for a few block confirmations (if not on hardhat network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await rps.deploymentTransaction().wait(6);
    console.log("Confirmed!");

    // Verify contract on block explorer (if API key is configured)
    const isBaseNetwork = hre.network.name === "base" || hre.network.name === "baseSepolia";
    const apiKey = isBaseNetwork ? process.env.BASESCAN_API_KEY : process.env.ETHERSCAN_API_KEY;
    const explorerName = isBaseNetwork ? "Basescan" : "Etherscan";

    if (apiKey) {
      console.log(`Verifying contract on ${explorerName}...`);
      try {
        await hre.run("verify:verify", {
          address: address,
          constructorArguments: [],
        });
        console.log("Contract verified!");
      } catch (error) {
        console.log("Verification failed:", error.message);
      }
    } else {
      console.log(`⚠️  Skipping verification - no ${explorerName} API key configured`);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Contract Address:", address);
  console.log("Deployer:", deployer.address);
  console.log("=========================\n");

  // Example: Create a test game
  if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
    console.log("Creating a test game...");
    const [, player1, player2] = await hre.ethers.getSigners();

    const stake = hre.ethers.parseEther("0.1");
    const tx = await rps.connect(player1).createGame(player2.address, { value: stake });
    await tx.wait();

    console.log("Test game created! Game ID: 0");
    console.log("Player1:", player1.address);
    console.log("Player2:", player2.address);
    console.log("Stake:", hre.ethers.formatEther(stake), "ETH");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
