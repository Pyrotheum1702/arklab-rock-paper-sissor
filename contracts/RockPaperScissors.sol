// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RockPaperScissors
 * @dev A simple onchain Rock Paper Scissors game with commit-reveal scheme
 *
 * Game Flow:
 * 1. Player1 creates game with ETH stake and challenges Player2
 * 2. Player2 joins with equal stake
 * 3. Both players commit their moves (hash of move + secret)
 * 4. Both players reveal their moves
 * 5. Contract determines winner and distributes pot
 * 6. If a player doesn't reveal, opponent can claim win after timeout
 */
contract RockPaperScissors {

    // Move options
    enum Move { None, Rock, Paper, Scissors }

    // Game states
    enum GameState {
        WaitingForPlayer2,  // Player1 created, waiting for Player2
        CommitPhase,        // Both joined, waiting for commits
        RevealPhase,        // Both committed, waiting for reveals
        Completed           // Game finished
    }

    // Game structure
    struct Game {
        address player1;
        address player2;
        uint256 stake;

        bytes32 commit1;  // Player1's commit hash
        bytes32 commit2;  // Player2's commit hash

        Move move1;       // Player1's revealed move
        Move move2;       // Player2's revealed move

        GameState state;
        uint256 revealDeadline;  // Timestamp after which timeout can be claimed

        address winner;
    }

    // Storage
    mapping(uint256 => Game) public games;
    uint256 public gameCounter;

    // Constants
    uint256 public constant REVEAL_TIMEOUT = 5 minutes;

    // Events
    event GameCreated(uint256 indexed gameId, address indexed player1, address indexed player2, uint256 stake);
    event Player2Joined(uint256 indexed gameId, address indexed player2);
    event MoveCommitted(uint256 indexed gameId, address indexed player);
    event MoveRevealed(uint256 indexed gameId, address indexed player, Move move);
    event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 prize);
    event TimeoutClaimed(uint256 indexed gameId, address indexed claimer);

    // Errors
    error InvalidStake();
    error NotYourTurn();
    error GameNotFound();
    error WrongGameState();
    error InvalidMove();
    error CommitMismatch();
    error TimeoutNotReached();
    error Unauthorized();

    /**
     * @dev Create a new game and challenge a specific player
     * @param _player2 Address of the opponent
     */
    function createGame(address _player2) external payable returns (uint256) {
        if (msg.value == 0) revert InvalidStake();
        if (_player2 == address(0) || _player2 == msg.sender) revert Unauthorized();

        uint256 gameId = gameCounter++;

        games[gameId] = Game({
            player1: msg.sender,
            player2: _player2,
            stake: msg.value,
            commit1: bytes32(0),
            commit2: bytes32(0),
            move1: Move.None,
            move2: Move.None,
            state: GameState.WaitingForPlayer2,
            revealDeadline: 0,
            winner: address(0)
        });

        emit GameCreated(gameId, msg.sender, _player2, msg.value);

        return gameId;
    }

    /**
     * @dev Player2 joins the game with equal stake
     * @param _gameId The game to join
     */
    function joinGame(uint256 _gameId) external payable {
        Game storage game = games[_gameId];

        if (game.player1 == address(0)) revert GameNotFound();
        if (msg.sender != game.player2) revert Unauthorized();
        if (game.state != GameState.WaitingForPlayer2) revert WrongGameState();
        if (msg.value != game.stake) revert InvalidStake();

        game.state = GameState.CommitPhase;

        emit Player2Joined(_gameId, msg.sender);
    }

    /**
     * @dev Commit a move using hash(move + secret)
     * @param _gameId The game ID
     * @param _commitment Hash of keccak256(abi.encodePacked(move, secret))
     *
     * Example: To commit Rock with secret "mySecret123"
     * _commitment = keccak256(abi.encodePacked(uint8(1), "mySecret123"))
     */
    function commitMove(uint256 _gameId, bytes32 _commitment) external {
        Game storage game = games[_gameId];

        if (game.state != GameState.CommitPhase) revert WrongGameState();

        if (msg.sender == game.player1) {
            if (game.commit1 != bytes32(0)) revert NotYourTurn();
            game.commit1 = _commitment;
        } else if (msg.sender == game.player2) {
            if (game.commit2 != bytes32(0)) revert NotYourTurn();
            game.commit2 = _commitment;
        } else {
            revert Unauthorized();
        }

        emit MoveCommitted(_gameId, msg.sender);

        // If both committed, move to reveal phase
        if (game.commit1 != bytes32(0) && game.commit2 != bytes32(0)) {
            game.state = GameState.RevealPhase;
            game.revealDeadline = block.timestamp + REVEAL_TIMEOUT;
        }
    }

    /**
     * @dev Reveal your move
     * @param _gameId The game ID
     * @param _move The move you committed (1=Rock, 2=Paper, 3=Scissors)
     * @param _secret The secret you used in the commitment
     */
    function revealMove(uint256 _gameId, Move _move, string calldata _secret) external {
        Game storage game = games[_gameId];

        if (game.state != GameState.RevealPhase) revert WrongGameState();
        if (_move == Move.None || _move > Move.Scissors) revert InvalidMove();

        bytes32 commitment = keccak256(abi.encodePacked(uint8(_move), _secret));

        if (msg.sender == game.player1) {
            if (game.commit1 != commitment) revert CommitMismatch();
            if (game.move1 != Move.None) revert NotYourTurn();
            game.move1 = _move;
        } else if (msg.sender == game.player2) {
            if (game.commit2 != commitment) revert CommitMismatch();
            if (game.move2 != Move.None) revert NotYourTurn();
            game.move2 = _move;
        } else {
            revert Unauthorized();
        }

        emit MoveRevealed(_gameId, msg.sender, _move);

        // If both revealed, determine winner
        if (game.move1 != Move.None && game.move2 != Move.None) {
            _determineWinner(_gameId);
        }
    }

    /**
     * @dev Claim win if opponent failed to reveal in time
     * @param _gameId The game ID
     */
    function claimTimeout(uint256 _gameId) external {
        Game storage game = games[_gameId];

        if (game.state != GameState.RevealPhase) revert WrongGameState();
        if (block.timestamp < game.revealDeadline) revert TimeoutNotReached();

        address claimer = msg.sender;

        // Check who revealed and who didn't
        if (claimer == game.player1 && game.move1 != Move.None && game.move2 == Move.None) {
            // Player1 revealed, Player2 didn't
            game.winner = game.player1;
        } else if (claimer == game.player2 && game.move2 != Move.None && game.move1 == Move.None) {
            // Player2 revealed, Player1 didn't
            game.winner = game.player2;
        } else {
            revert Unauthorized();
        }

        game.state = GameState.Completed;

        uint256 prize = game.stake * 2;
        (bool success, ) = game.winner.call{value: prize}("");
        require(success, "Transfer failed");

        emit TimeoutClaimed(_gameId, claimer);
        emit GameCompleted(_gameId, game.winner, prize);
    }

    /**
     * @dev Internal function to determine winner and distribute prize
     */
    function _determineWinner(uint256 _gameId) private {
        Game storage game = games[_gameId];

        Move move1 = game.move1;
        Move move2 = game.move2;

        address winner;

        if (move1 == move2) {
            // Draw - split the pot
            winner = address(0);
        } else if (
            (move1 == Move.Rock && move2 == Move.Scissors) ||
            (move1 == Move.Paper && move2 == Move.Rock) ||
            (move1 == Move.Scissors && move2 == Move.Paper)
        ) {
            winner = game.player1;
        } else {
            winner = game.player2;
        }

        game.winner = winner;
        game.state = GameState.Completed;

        // Distribute funds
        if (winner == address(0)) {
            // Draw - refund both players
            (bool success1, ) = game.player1.call{value: game.stake}("");
            (bool success2, ) = game.player2.call{value: game.stake}("");
            require(success1 && success2, "Refund failed");
        } else {
            // Winner takes all
            uint256 prize = game.stake * 2;
            (bool success, ) = winner.call{value: prize}("");
            require(success, "Transfer failed");
        }

        emit GameCompleted(_gameId, winner, game.stake * 2);
    }

    /**
     * @dev Helper function to generate commitment hash off-chain (for reference)
     * In practice, users should generate this off-chain to keep secret private
     */
    function getCommitmentHash(Move _move, string calldata _secret) external pure returns (bytes32) {
        require(_move != Move.None && _move <= Move.Scissors, "Invalid move");
        return keccak256(abi.encodePacked(uint8(_move), _secret));
    }

    /**
     * @dev Get game details
     */
    function getGame(uint256 _gameId) external view returns (
        address player1,
        address player2,
        uint256 stake,
        GameState state,
        Move move1,
        Move move2,
        address winner
    ) {
        Game storage game = games[_gameId];
        return (
            game.player1,
            game.player2,
            game.stake,
            game.state,
            game.move1,
            game.move2,
            game.winner
        );
    }
}
