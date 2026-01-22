// Contract addresses - Update after deployment
export const CONTRACTS = {
  RockPaperScissorsZK: {
    baseSepolia: '0xC16Db58864dc2731d98518d3D5887634290f622c',
    base: '0x...', // Deploy and update this
  },
  MockVerifier: {
    baseSepolia: '0x8C4CCbDD15b40F0aEC359e1BbD3948aaE05182EF',
    base: '0x...', // Deploy and update this
  }
};

// Contract ABIs - Proper JSON format from compiled artifacts
export const RPS_ZK_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_player2", "type": "address" },
      { "internalType": "uint256", "name": "_commitment1", "type": "uint256" }
    ],
    "name": "createGame",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_gameId", "type": "uint256" },
      { "internalType": "uint256", "name": "_commitment2", "type": "uint256" }
    ],
    "name": "joinGame",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_gameId", "type": "uint256" }],
    "name": "getGame",
    "outputs": [
      { "internalType": "address", "name": "player1", "type": "address" },
      { "internalType": "address", "name": "player2", "type": "address" },
      { "internalType": "uint256", "name": "stake", "type": "uint256" },
      { "internalType": "uint256", "name": "commitment1", "type": "uint256" },
      { "internalType": "uint256", "name": "commitment2", "type": "uint256" },
      { "internalType": "uint8", "name": "state", "type": "uint8" },
      { "internalType": "address", "name": "winner", "type": "address" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_gameId", "type": "uint256" },
      { "internalType": "uint256", "name": "_winner", "type": "uint256" },
      { "internalType": "uint256[2]", "name": "a", "type": "uint256[2]" },
      { "internalType": "uint256[2][2]", "name": "b", "type": "uint256[2][2]" },
      { "internalType": "uint256[2]", "name": "c", "type": "uint256[2]" }
    ],
    "name": "proveWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_gameId", "type": "uint256" }
    ],
    "name": "claimTimeout",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gameCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player1", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "player2", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "stake", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "commitment1", "type": "uint256" }
    ],
    "name": "GameCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "player2", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "commitment2", "type": "uint256" }
    ],
    "name": "Player2Joined",
    "type": "event"
  }
];

export const VERIFIER_ABI = [
  "function verifyProof(uint256[8] calldata proof, uint256[2] calldata input) external view returns (bool)"
];
