import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import CreateGame from './CreateGame';
import JoinGame from './JoinGame';
import GameList from './GameList';
import './Game.css';

function Game() {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="game-container">
      <div className="wallet-section">
        <ConnectButton />
      </div>

      {!isConnected ? (
        <div className="connect-prompt">
          <h2>Connect Your Wallet to Play</h2>
          <p>Play Rock Paper Scissors with Zero-Knowledge proofs on Base L2</p>
          <ul>
            <li>Moves stay private forever</li>
            <li>Only $0.01 per game</li>
            <li>Winner takes all</li>
          </ul>
        </div>
      ) : (
        <div className="game-content">
          <div className="tabs">
            <button
              className={activeTab === 'create' ? 'active' : ''}
              onClick={() => setActiveTab('create')}
            >
              Create Game
            </button>
            <button
              className={activeTab === 'join' ? 'active' : ''}
              onClick={() => setActiveTab('join')}
            >
              Join Game
            </button>
            <button
              className={activeTab === 'games' ? 'active' : ''}
              onClick={() => setActiveTab('games')}
            >
              My Games
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'create' && <CreateGame />}
            {activeTab === 'join' && <JoinGame />}
            {activeTab === 'games' && <GameList />}
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
