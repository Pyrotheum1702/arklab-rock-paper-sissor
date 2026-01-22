import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'RPS ZK Game',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com/
  chains: [baseSepolia, base],
  ssr: false,
});
