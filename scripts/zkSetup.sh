#!/bin/bash

# ZK-SNARK Setup Script
# This script sets up the ZK circuits for Rock Paper Scissors
#
# Prerequisites:
# - Install Circom: https://docs.circom.io/getting-started/installation/
# - Install snarkjs: npm install -g snarkjs
#
# This script performs:
# 1. Circuit compilation
# 2. Powers of Tau ceremony
# 3. Circuit-specific setup
# 4. Verification key generation
# 5. Solidity verifier generation

set -e  # Exit on error

echo "🔧 ZK-SNARK Setup for Rock Paper Scissors"
echo "=========================================="
echo ""

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ Error: circom is not installed"
    echo "Install from: https://docs.circom.io/getting-started/installation/"
    exit 1
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ Error: snarkjs is not installed"
    echo "Install with: npm install -g snarkjs"
    exit 1
fi

echo "✅ Prerequisites installed"
echo ""

# Create build directory
mkdir -p build
cd build

echo "📦 Step 1: Compiling circuits..."
echo "================================"

# Compile the RPS winner circuit
circom ../circuits/rps_winner.circom --r1cs --wasm --sym --c

echo "✅ Circuit compiled"
echo ""

echo "🎲 Step 2: Powers of Tau ceremony (generating random entropy)..."
echo "================================================================="

# Start powers of tau ceremony (for circuits with <1000 constraints, use pot12)
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

# Contribute to the ceremony
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau \
    --name="First contribution" -v -e="$(date +%s)"

# Phase 2
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

echo "✅ Powers of Tau complete"
echo ""

echo "🔑 Step 3: Circuit-specific setup..."
echo "===================================="

# Generate proving and verification keys
snarkjs groth16 setup rps_winner.r1cs pot12_final.ptau rps_winner_0000.zkey

# Contribute to phase 2 ceremony
snarkjs zkey contribute rps_winner_0000.zkey rps_winner_final.zkey \
    --name="First contribution" -v -e="$(date +%s)"

# Export verification key
snarkjs zkey export verificationkey rps_winner_final.zkey verification_key.json

echo "✅ Keys generated"
echo ""

echo "📝 Step 4: Generating Solidity verifier..."
echo "=========================================="

# Generate Solidity verifier contract
snarkjs zkey export solidityverifier rps_winner_final.zkey ../zk-contracts/RPSWinnerVerifier.sol

echo "✅ Verifier contract generated"
echo ""

echo "📊 Circuit Information:"
echo "======================"
snarkjs r1cs info rps_winner.r1cs

echo ""
echo "✨ Setup complete!"
echo ""
echo "Generated files:"
echo "  - build/rps_winner_final.zkey (proving key)"
echo "  - build/verification_key.json (verification key)"
echo "  - zk-contracts/RPSWinnerVerifier.sol (Solidity verifier)"
echo ""
echo "Next steps:"
echo "  1. Deploy RPSWinnerVerifier.sol"
echo "  2. Deploy RockPaperScissorsZK.sol with verifier address"
echo "  3. Generate proofs using scripts/generateProof.js"
