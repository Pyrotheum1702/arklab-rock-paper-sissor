// Contract addresses - Update after deployment
export const CONTRACTS = {
  RockPaperScissorsZK: {
    baseSepolia: '0x...', // Deploy and update this
    base: '0x...', // Deploy and update this
  },
  MockVerifier: {
    baseSepolia: '0x...', // Deploy and update this
    base: '0x...', // Deploy and update this
  }
};

// Contract ABIs - Copy from artifacts after compilation
export const RPS_ZK_ABI = [
  "function createGame(address _player2, bytes32 _commitment1) external payable returns (uint256)",
  "function joinGame(uint256 _gameId, bytes32 _commitment2) external payable",
  "function proveWinner(uint256 _gameId, uint256[8] calldata proof, uint256[2] calldata publicSignals) external",
  "function getGame(uint256 _gameId) external view returns (tuple(address player1, address player2, uint256 stake, bytes32 commitment1, bytes32 commitment2, address winner, uint8 state))",
  "function gameCount() external view returns (uint256)",
  "event GameCreated(uint256 indexed gameId, address indexed player1, address indexed player2, uint256 stake)",
  "event GameJoined(uint256 indexed gameId, address indexed player2)",
  "event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 payout)"
];

export const VERIFIER_ABI = [
  "function verifyProof(uint256[8] calldata proof, uint256[2] calldata input) external view returns (bool)"
];
