import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, keccak256, toUtf8Bytes } from 'ethers';
import { RPS_ZK_ABI, CONTRACTS } from '../config/contracts';

const MOVES = {
  1: 'Rock',
  2: 'Paper',
  3: 'Scissors'
};

// Generate random secret
const generateSecret = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

function PublicLobby() {
  const { chain } = useAccount();
  const [openGames, setOpenGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [move, setMove] = useState('1');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Generate secret on mount
  useEffect(() => {
    setSecret(generateSecret());
  }, []);

  // Get contract address
  const contractAddress = chain?.id === 84532
    ? CONTRACTS.RockPaperScissorsZK.baseSepolia
    : CONTRACTS.RockPaperScissorsZK.base;

  // Read game count
  const { data: gameCount } = useReadContract({
    address: contractAddress,
    abi: RPS_ZK_ABI,
    functionName: 'gameCount',
  });

  // Fetch open games
  useEffect(() => {
    const fetchOpenGames = async () => {
      if (!gameCount) return;

      const games = [];
      const count = Number(gameCount);

      for (let i = 0; i < count; i++) {
        try {
          // This would need to be replaced with actual contract read
          // For now, we'll create a placeholder
          games.push({
            id: i,
            creator: '0x...', // Would come from contract
            stake: '0.01', // Would come from contract
            isOpen: true, // Would check if player2 has joined
          });
        } catch (error) {
          console.error(`Error fetching game ${i}:`, error);
        }
      }

      setOpenGames(games.filter(g => g.isOpen));
    };

    fetchOpenGames();
  }, [gameCount, contractAddress]);

  const handleJoinGame = async (gameId, stake) => {
    try {
      const commitment = keccak256(toUtf8Bytes(`${move}:${secret}`));

      setStatus('Joining game...');
      setSelectedGame(gameId);

      writeContract({
        address: contractAddress,
        abi: RPS_ZK_ABI,
        functionName: 'joinGame',
        args: [Number(gameId), commitment],
        value: parseEther(stake)
      });

      setStatus('Save your move and secret - you will need them later!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="public-lobby">
      <h2>Public Lobby</h2>
      <p className="subtitle">Join any open game below</p>

      <div className="move-selection">
        <h3>Choose Your Move First</h3>
        <div className="move-buttons">
          <button
            type="button"
            className={`move-btn ${move === '1' ? 'selected' : ''}`}
            onClick={() => setMove('1')}
          >
            Rock
          </button>
          <button
            type="button"
            className={`move-btn ${move === '2' ? 'selected' : ''}`}
            onClick={() => setMove('2')}
          >
            Paper
          </button>
          <button
            type="button"
            className={`move-btn ${move === '3' ? 'selected' : ''}`}
            onClick={() => setMove('3')}
          >
            Scissors
          </button>
        </div>
        <p className="selected-move">Selected: {MOVES[move]}</p>
      </div>

      <div className="secret-info">
        <label>Your Secret (auto-generated)</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={secret}
            readOnly
            style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px' }}
          />
          <button
            type="button"
            onClick={() => setSecret(generateSecret())}
            style={{ padding: '8px 16px', width: 'auto' }}
          >
            Regenerate
          </button>
        </div>
        <small>Save this secret - you'll need it to prove your move later!</small>
      </div>

      {openGames.length === 0 ? (
        <div className="empty-state">
          <p>No open games available</p>
          <p>Create a new game in the "Create Game" tab!</p>
        </div>
      ) : (
        <div className="lobby-games">
          {openGames.map((game) => (
            <div key={game.id} className="lobby-game-card">
              <div className="game-header">
                <span className="game-id">Game #{game.id}</span>
                <span className="stake-badge">{game.stake} ETH</span>
              </div>

              <div className="game-details">
                <div className="detail-row">
                  <span className="label">Creator:</span>
                  <span className="value">{game.creator.slice(0, 6)}...{game.creator.slice(-4)}</span>
                </div>
              </div>

              <button
                className="join-btn"
                onClick={() => handleJoinGame(game.id, game.stake)}
                disabled={isPending || isConfirming || selectedGame === game.id}
              >
                {isPending && selectedGame === game.id ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          ))}
        </div>
      )}

      {isSuccess && (
        <div className="success">
          Game joined! Transaction: {hash?.slice(0, 10)}...
        </div>
      )}

      {status && <div className="status">{status}</div>}

      <div className="info-box">
        <h4>How it works</h4>
        <ol>
          <li>Choose your move (Rock, Paper, or Scissors)</li>
          <li>Click "Join Game" on any open game</li>
          <li>Pay the stake amount to join</li>
          <li>Wait for the game to be resolved with ZK proofs</li>
          <li>Winner takes the total pot!</li>
        </ol>
      </div>
    </div>
  );
}

export default PublicLobby;
