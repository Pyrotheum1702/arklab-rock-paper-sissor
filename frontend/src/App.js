import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config/wagmi';
import Game from './components/Game';
import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="App">
            <header className="App-header">
              <h1>Rock Paper Scissors ZK</h1>
              <p>Privacy-preserving onchain game on Base L2</p>
            </header>
            <main className="App-main">
              <Game />
            </main>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
