# Rock Paper Scissors ZK - Frontend

Modern React frontend for the Zero-Knowledge Rock Paper Scissors game on Base L2.

## Features

- Wallet connection via RainbowKit (MetaMask, WalletConnect, Coinbase Wallet)
- Create games with ETH stakes
- Join existing games
- View game history
- Beautiful, responsive UI
- Base Sepolia testnet and mainnet support

## Tech Stack

- **React** - UI framework
- **wagmi** - React hooks for Ethereum
- **RainbowKit** - Wallet connection
- **ethers** - Ethereum library
- **viem** - TypeScript Ethereum utilities

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

### 2. Configure Contract Addresses

After deploying your contracts, update `src/config/contracts.js`:

```javascript
export const CONTRACTS = {
  RockPaperScissorsZK: {
    baseSepolia: '0xYourContractAddress',
    base: '0xYourContractAddress',
  },
  // ...
};
```

### 3. Get WalletConnect Project ID

1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your Project ID
4. Update `src/config/wagmi.js`:

```javascript
export const config = getDefaultConfig({
  appName: 'RPS ZK Game',
  projectId: 'YOUR_PROJECT_ID_HERE',
  chains: [baseSepolia, base],
});
```

### 4. Run Development Server

```bash
npm start
```

Opens at [http://localhost:3000](http://localhost:3000)

## How to Use

### Connect Wallet

1. Click "Connect Wallet" button
2. Select your wallet (MetaMask recommended)
3. Approve connection
4. Ensure you're on Base Sepolia testnet

### Create a Game

1. Go to "Create Game" tab
2. Enter opponent's address
3. Set stake amount (e.g., 0.01 ETH)
4. Choose your move (Rock/Paper/Scissors)
5. Enter a secret phrase
6. Click "Create Game"
7. **Save your move and secret** - you'll need them later!

### Join a Game

1. Go to "Join Game" tab
2. Enter the Game ID
3. Match the stake amount
4. Choose your move
5. Enter your secret phrase
6. Click "Join Game"
7. **Save your move and secret**

### Complete a Game (ZK Proof)

After both players commit:

1. Generate ZK proof off-chain (coming soon in UI)
2. Submit proof to determine winner
3. Winner automatically receives 2x stake

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Game.js           # Main game container
│   │   ├── CreateGame.js     # Create game form
│   │   ├── JoinGame.js       # Join game form
│   │   ├── GameList.js       # Game history
│   │   └── Game.css          # Component styles
│   ├── config/
│   │   ├── wagmi.js          # wagmi/RainbowKit config
│   │   └── contracts.js      # Contract addresses & ABIs
│   ├── App.js                # Root component
│   ├── App.css               # Global styles
│   └── index.js              # Entry point
├── package.json
└── README.md
```

## Building for Production

```bash
npm run build
```

Outputs to `build/` directory. Deploy to:
- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [IPFS](https://ipfs.io)
- Any static host

## Environment Variables

Create `.env` file in `frontend/`:

```env
REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Common Issues

### "Wrong network" error
Switch to Base Sepolia testnet in MetaMask:
- Network Name: Base Sepolia
- RPC URL: https://sepolia.base.org
- Chain ID: 84532
- Currency: ETH

### "Insufficient funds"
Get testnet ETH from [Coinbase Faucet](https://portal.cdp.coinbase.com/products/faucet)

### Contract not found
Update contract addresses in `src/config/contracts.js` after deployment

### Transaction fails
- Check you have enough ETH for gas + stake
- Verify contract is deployed to the correct network
- Ensure you're calling the right contract address

## Future Enhancements

- [ ] In-browser ZK proof generation
- [ ] Real-time game updates via WebSocket
- [ ] Game invitation links
- [ ] Leaderboard
- [ ] Tournament mode
- [ ] NFT rewards for winners
- [ ] Mobile app (React Native)

## Development

### Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Adding New Features

1. Create new component in `src/components/`
2. Add styles to component CSS file
3. Import and use in `Game.js`
4. Update contract ABIs in `src/config/contracts.js` if needed

## Deployment

### Deploy to Vercel

```bash
cd frontend
vercel
```

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=build
```

### Deploy to IPFS

```bash
npm run build
ipfs add -r build/
```

## License

ISC

## Support

- [GitHub Issues](https://github.com/Pyrotheum1702/arklab-rock-paper-sissor/issues)
- [Base Discord](https://discord.gg/buildonbase)
- [Documentation](../README.md)
