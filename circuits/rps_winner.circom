pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * RPS Winner Circuit
 *
 * This circuit proves who won the game WITHOUT revealing the actual moves!
 *
 * Inputs:
 *   - move1 (private): Player 1's move
 *   - secret1 (private): Player 1's secret
 *   - commitment1 (public): Player 1's commitment
 *   - move2 (private): Player 2's move
 *   - secret2 (private): Player 2's secret
 *   - commitment2 (public): Player 2's commitment
 *
 * Output:
 *   - winner (public): 0=draw, 1=player1 wins, 2=player2 wins
 *
 * Game rules:
 *   Rock (1) beats Scissors (3)
 *   Paper (2) beats Rock (1)
 *   Scissors (3) beats Paper (2)
 */

template RPSWinner() {
    // Private inputs
    signal input move1;
    signal input secret1;
    signal input move2;
    signal input secret2;

    // Public inputs
    signal input commitment1;
    signal input commitment2;

    // Public output
    signal output winner;

    // === Verify both commitments ===

    component hash1 = Poseidon(2);
    hash1.inputs[0] <== move1;
    hash1.inputs[1] <== secret1;
    commitment1 === hash1.out;

    component hash2 = Poseidon(2);
    hash2.inputs[0] <== move2;
    hash2.inputs[1] <== secret2;
    commitment2 === hash2.out;

    // === Validate moves are in range [1, 3] ===

    // Player 1 move validation
    component isValid1_1 = IsEqual();
    isValid1_1.in[0] <== move1;
    isValid1_1.in[1] <== 1;

    component isValid1_2 = IsEqual();
    isValid1_2.in[0] <== move1;
    isValid1_2.in[1] <== 2;

    component isValid1_3 = IsEqual();
    isValid1_3.in[0] <== move1;
    isValid1_3.in[1] <== 3;

    signal valid1;
    valid1 <== isValid1_1.out + isValid1_2.out + isValid1_3.out;
    valid1 === 1;

    // Player 2 move validation
    component isValid2_1 = IsEqual();
    isValid2_1.in[0] <== move2;
    isValid2_1.in[1] <== 1;

    component isValid2_2 = IsEqual();
    isValid2_2.in[0] <== move2;
    isValid2_2.in[1] <== 2;

    component isValid2_3 = IsEqual();
    isValid2_3.in[0] <== move2;
    isValid2_3.in[1] <== 3;

    signal valid2;
    valid2 <== isValid2_1.out + isValid2_2.out + isValid2_3.out;
    valid2 === 1;

    // === Determine winner ===

    // Check if it's a draw
    component isDraw = IsEqual();
    isDraw.in[0] <== move1;
    isDraw.in[1] <== move2;

    // Check if Player 1 wins
    // Player 1 wins if:
    // - move1=1 (Rock) and move2=3 (Scissors)
    // - move1=2 (Paper) and move2=1 (Rock)
    // - move1=3 (Scissors) and move2=2 (Paper)

    component p1RockWins = IsEqual();
    p1RockWins.in[0] <== move1;
    p1RockWins.in[1] <== 1;
    component p1RockBeatsScissors = IsEqual();
    p1RockBeatsScissors.in[0] <== move2;
    p1RockBeatsScissors.in[1] <== 3;
    signal rockWins;
    rockWins <== p1RockWins.out * p1RockBeatsScissors.out;

    component p1PaperWins = IsEqual();
    p1PaperWins.in[0] <== move1;
    p1PaperWins.in[1] <== 2;
    component p1PaperBeatsRock = IsEqual();
    p1PaperBeatsRock.in[0] <== move2;
    p1PaperBeatsRock.in[1] <== 1;
    signal paperWins;
    paperWins <== p1PaperWins.out * p1PaperBeatsRock.out;

    component p1ScissorsWins = IsEqual();
    p1ScissorsWins.in[0] <== move1;
    p1ScissorsWins.in[1] <== 3;
    component p1ScissorsBeatsPaper = IsEqual();
    p1ScissorsBeatsPaper.in[0] <== move2;
    p1ScissorsBeatsPaper.in[1] <== 2;
    signal scissorsWins;
    scissorsWins <== p1ScissorsWins.out * p1ScissorsBeatsPaper.out;

    signal player1Wins;
    player1Wins <== rockWins + paperWins + scissorsWins;

    // Compute winner:
    // - If draw: winner = 0
    // - If player1 wins: winner = 1
    // - Otherwise: winner = 2 (player2 wins)

    // Using conditional logic:
    // winner = isDraw ? 0 : (player1Wins ? 1 : 2)

    signal notDraw;
    notDraw <== 1 - isDraw.out;

    signal winnerIfNotDraw;
    winnerIfNotDraw <== player1Wins * 1 + (1 - player1Wins) * 2;

    winner <== isDraw.out * 0 + notDraw * winnerIfNotDraw;
}

component main {public [commitment1, commitment2, winner]} = RPSWinner();
