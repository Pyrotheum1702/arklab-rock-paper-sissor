pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * RPS Move Circuit
 *
 * This circuit proves:
 * 1. You have a valid move (1=Rock, 2=Paper, 3=Scissors)
 * 2. You know the secret that hashes to your commitment
 *
 * WITHOUT revealing what your move or secret is!
 *
 * Inputs:
 *   - move (private): Your move (1, 2, or 3)
 *   - secret (private): Your secret number
 *   - commitment (public): Hash of move + secret
 *
 * The circuit verifies:
 *   - commitment == Poseidon(move, secret)
 *   - move is 1, 2, or 3
 */

template RPSMove() {
    // Private inputs (hidden from verifier)
    signal input move;        // 1=Rock, 2=Paper, 3=Scissors
    signal input secret;      // Your secret number

    // Public input (visible to verifier)
    signal input commitment;  // Hash you committed

    // Output (not really used, but good practice)
    signal output valid;

    // === Constraint 1: Verify move is valid (1, 2, or 3) ===

    // Check move == 1 OR move == 2 OR move == 3
    component isOne = IsEqual();
    isOne.in[0] <== move;
    isOne.in[1] <== 1;

    component isTwo = IsEqual();
    isTwo.in[0] <== move;
    isTwo.in[1] <== 2;

    component isThree = IsEqual();
    isThree.in[0] <== move;
    isThree.in[1] <== 3;

    // At least one must be true
    signal validMove;
    validMove <== isOne.out + isTwo.out + isThree.out;

    // Enforce that exactly one is true (move is 1, 2, or 3)
    validMove === 1;

    // === Constraint 2: Verify commitment matches ===

    // Compute hash of move and secret using Poseidon
    component hasher = Poseidon(2);
    hasher.inputs[0] <== move;
    hasher.inputs[1] <== secret;

    // Ensure computed hash matches the public commitment
    commitment === hasher.out;

    // Output 1 to indicate proof is valid
    valid <== 1;
}

component main {public [commitment]} = RPSMove();
