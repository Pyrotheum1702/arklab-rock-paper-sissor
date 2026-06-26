# RPS Onchain Game

A decentralized Rock Paper Scissors game built on Ethereum / Base. Players stake funds and play on-chain, with two contract variants: a classic commit-reveal version and a zero-knowledge (ZK-SNARK) version that keeps moves private until the game resolves. The project includes Solidity smart contracts (Hardhat), Circom circuits, and a React + wagmi/RainbowKit web frontend.

## Setup

Requires Node.js and npm.

Install the smart-contract / tooling dependencies from the repo root:

```bash
npm install
```

Configure environment variables (needed for deployment to live networks):

```bash
cp .env.example .env
# Edit .env and set PRIVATE_KEY, BASESCAN_API_KEY, ALCHEMY_API_KEY, etc.
```

Compile the contracts:

```bash
npm run compile
```

Run the test suite:

```bash
npm test          # hardhat test
npm run test:gas  # tests with gas reporting
```

Install the frontend dependencies:

```bash
cd frontend
npm install
```

## Usage

### Local development

Start a local Hardhat node:

```bash
npm run node
```

Deploy the contracts to the local node (in another terminal):

```bash
npm run deploy:local      # classic commit-reveal version
npm run deploy:zk:local   # zero-knowledge version
```

### Deploy to Base / testnets

```bash
npm run deploy:base-testnet      # Base Sepolia testnet (commit-reveal)
npm run deploy:zk:base-testnet   # Base Sepolia testnet (ZK)
npm run deploy:base              # Base mainnet (commit-reveal)
npm run deploy:zk:base           # Base mainnet (ZK)
```

Sepolia and Ethereum mainnet targets are also available via `npm run deploy:sepolia` and `npm run deploy:mainnet`.

### Run the web app

From the `frontend` directory:

```bash
npm start         # start the dev server
npm run build     # production build
```

Connect a wallet (via RainbowKit), then create or join a game, stake, and play.
