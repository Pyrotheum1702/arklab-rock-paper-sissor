const snarkjs = require("snarkjs");
const fs = require("fs");
const { buildPoseidon } = require("circomlibjs");

/**
 * Generate a ZK proof for Rock Paper Scissors winner
 *
 * This script:
 * 1. Takes both players' moves and secrets
 * 2. Computes commitments using Poseidon hash
 * 3. Computes the winner
 * 4. Generates a ZK proof that the winner is correct
 * 5. WITHOUT revealing the actual moves!
 */

async function generateCommitment(move, secret) {
  const poseidon = await buildPoseidon();

  // Convert to field elements
  const moveField = poseidon.F.e(move);
  const secretField = poseidon.F.e(secret);

  // Hash using Poseidon
  const hash = poseidon([moveField, secretField]);

  // Convert to BigInt
  const hashBigInt = poseidon.F.toObject(hash);

  return hashBigInt.toString();
}

function computeWinner(move1, move2) {
  if (move1 === move2) return 0; // Draw

  // Rock (1) beats Scissors (3)
  // Paper (2) beats Rock (1)
  // Scissors (3) beats Paper (2)
  if (
    (move1 === 1 && move2 === 3) ||
    (move1 === 2 && move2 === 1) ||
    (move1 === 3 && move2 === 2)
  ) {
    return 1; // Player 1 wins
  }

  return 2; // Player 2 wins
}

async function generateProof(move1, secret1, move2, secret2) {
  console.log("\n🎮 Generating ZK Proof for Rock Paper Scissors");
  console.log("==============================================\n");

  // Validate moves
  if (![1, 2, 3].includes(move1)) {
    throw new Error("move1 must be 1 (Rock), 2 (Paper), or 3 (Scissors)");
  }
  if (![1, 2, 3].includes(move2)) {
    throw new Error("move2 must be 1 (Rock), 2 (Paper), or 3 (Scissors)");
  }

  const moveNames = ["", "Rock", "Paper", "Scissors"];
  console.log(`Player 1 move: ${moveNames[move1]}`);
  console.log(`Player 2 move: ${moveNames[move2]}`);

  // Generate commitments
  console.log("\n📝 Generating commitments...");
  const commitment1 = await generateCommitment(move1, secret1);
  const commitment2 = await generateCommitment(move2, secret2);

  console.log(`Commitment 1: ${commitment1}`);
  console.log(`Commitment 2: ${commitment2}`);

  // Compute winner
  const winner = computeWinner(move1, move2);
  const resultNames = ["Draw", "Player 1 wins", "Player 2 wins"];
  console.log(`\n🏆 Result: ${resultNames[winner]}`);

  // Check if circuit files exist
  const wasmPath = "./build/rps_winner_js/rps_winner.wasm";
  const zkeyPath = "./build/rps_winner_final.zkey";

  if (!fs.existsSync(wasmPath)) {
    console.log("\n❌ Error: Circuit WASM not found!");
    console.log("Please run: ./scripts/zkSetup.sh");
    return null;
  }

  if (!fs.existsSync(zkeyPath)) {
    console.log("\n❌ Error: Proving key not found!");
    console.log("Please run: ./scripts/zkSetup.sh");
    return null;
  }

  // Prepare inputs for the circuit
  const input = {
    move1: move1,
    secret1: secret1.toString(),
    move2: move2,
    secret2: secret2.toString(),
    commitment1: commitment1,
    commitment2: commitment2,
    winner: winner
  };

  console.log("\n🔧 Generating proof (this may take a few seconds)...");

  try {
    // Generate the proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    console.log("✅ Proof generated successfully!");

    // Format for Solidity
    const solidityProof = {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ],
      c: [proof.pi_c[0], proof.pi_c[1]],
      input: publicSignals
    };

    console.log("\n📦 Proof ready for submission:");
    console.log("=============================");
    console.log("a:", JSON.stringify(solidityProof.a));
    console.log("b:", JSON.stringify(solidityProof.b));
    console.log("c:", JSON.stringify(solidityProof.c));
    console.log("public inputs:", JSON.stringify(solidityProof.input));

    // Verify the proof
    console.log("\n🔍 Verifying proof...");
    const vkeyPath = "./build/verification_key.json";
    const vkey = JSON.parse(fs.readFileSync(vkeyPath));

    const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);

    if (verified) {
      console.log("✅ Proof verified successfully!");
    } else {
      console.log("❌ Proof verification failed!");
    }

    return solidityProof;

  } catch (error) {
    console.error("\n❌ Error generating proof:", error.message);
    return null;
  }
}

// Example usage
async function main() {
  // Example: Player 1 plays Rock (1), Player 2 plays Scissors (3)
  const move1 = 1;  // Rock
  const secret1 = BigInt("12345678901234567890");  // Random secret

  const move2 = 3;  // Scissors
  const secret2 = BigInt("98765432109876543210");  // Random secret

  const proof = await generateProof(move1, secret1, move2, secret2);

  if (proof) {
    // Save proof to file
    fs.writeFileSync(
      "./build/proof.json",
      JSON.stringify(proof, null, 2)
    );
    console.log("\n💾 Proof saved to build/proof.json");

    console.log("\n📖 To use this proof in your smart contract:");
    console.log("   proveWinner(gameId, winner, a, b, c)");
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { generateProof, generateCommitment, computeWinner };
