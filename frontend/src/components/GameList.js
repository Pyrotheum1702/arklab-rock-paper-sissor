import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { RPS_ZK_ABI, CONTRACTS } from '../config/contracts';

const GAME_STATES = {
  0: 'Waiting for Player 2',
  1: 'Both Players Committed',
  2: 'Game Completed'
};

function GameList() {
  const { address, chain } = useAccount();
  const [games, setGames] = useState([]);

  // Get contract address for current chain
  const contractAddress = chain?.id === 84532
    ? CONTRACTS.RockPaperScissorsZK.baseSepolia
    : CONTRACTS.RockPaperScissorsZK.base;

  // Read game count
  const { data: gameCount } = useReadContract({
    address: contractAddress,
    abi: RPS_ZK_ABI,
    functionName: 'gameCount'
  });

  useEffect(() => {
    if (gameCount && contractAddress) {
      fetchGames();
    }
  }, [gameCount, contractAddress, address]);

  const fetchGames = async () => {
    // In a real app, you'd fetch games from events or subgraph
    // For now, just show a placeholder
    setGames([]);
  };

  return (
    <div className="game-list">
      <h2>My Games</h2>

      {games.length === 0 ? (
        <div className="empty-state">
          <p>No games found</p>
          <p>Create or join a game to get started!</p>
        </div>
      ) : (
        <div className="games-grid">
          {games.map((game) => (
            <div key={game.id} className="game-card">
              <div className="game-id">Game #{game.id}</div>
              <div className="game-info">
                <div>Player 1: {game.player1.slice(0, 8)}...</div>
                <div>Player 2: {game.player2.slice(0, 8)}...</div>
                <div>Stake: {game.stake} ETH</div>
                <div>Status: {GAME_STATES[game.state]}</div>
              </div>
              {game.winner && (
                <div className="winner">
                  Winner: {game.winner === address ? 'You!' : game.winner.slice(0, 8) + '...'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="info-box">
        <h4>How to Complete a Game</h4>
        <p>After both players commit their moves:</p>
        <ol>
          <li>Generate a ZK proof using your move and secret</li>
          <li>Submit the proof to determine the winner</li>
          <li>Winner receives 2x the stake</li>
        </ol>
        <p><strong>Note:</strong> ZK proof generation currently requires off-chain computation. Full proof generation coming soon!</p>
      </div>
    </div>
  );
}

export default GameList;
