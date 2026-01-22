import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
   appName: 'RPS ZK Game',
   projectId: 'e4d9a045f81dadf18d6517ce0f5c49ec', // Get from https://cloud.walletconnect.com/
   chains: [baseSepolia, base],
   ssr: false,
});
