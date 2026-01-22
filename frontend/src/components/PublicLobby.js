import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, keccak256, toUtf8Bytes, toBigInt } from 'ethers';
import { RPS_ZK_ABI, CONTRACTS } from '../config/contracts';
import { saveGameTransaction } from '../utils/gameHistory';

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
  const { address, chain } = useAccount();
  const [openGames, setOpenGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [move, setMove] = useState('1');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Save join transaction when successful
  useEffect(() => {
    if (isSuccess && hash && selectedGame !== null && address) {
      saveGameTransaction(selectedGame, hash, 'join', address);
    }
  }, [isSuccess, hash, selectedGame, address]);

  // Generate secret on mount
  useEffect(() => {
    setSecret(generateSecret());
  }, []);

  // Get contract address
  const contractAddress = chain?.id === 84532
    ? CONTRACTS.RockPaperScissorsZK.baseSepolia
    : CONTRACTS.RockPaperScissorsZK.base;

  // Read game count
  const { data: gameCount, refetch: refetchGameCount } = useReadContract({
    address: contractAddress,
    abi: RPS_ZK_ABI,
    functionName: 'gameCounter',
  });

  // Fetch open games
  useEffect(() => {
    const fetchOpenGames = async () => {
      if (!gameCount || !contractAddress) return;

      const games = [];
      const count = Number(gameCount);

      for (let i = 0; i < count; i++) {
        try {
          // Fetch game details from contract
          const response = await fetch(`https://sepolia.base.org/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [{
                to: contractAddress,
                data: `0xa2f77bcc${i.toString(16).padStart(64, '0')}` // getGame(uint256)
              }, 'latest'],
              id: 1
            })
          });

          const result = await response.json();
          if (result.result && result.result !== '0x') {
            // Decode the response (ABI encoding uses 32-byte slots)
            const data = result.result.slice(2); // Remove 0x
            // Each slot is 64 hex chars (32 bytes). Addresses are last 40 chars (20 bytes) of slot
            const player1 = '0x' + data.slice(24, 64);   // Slot 0: bytes 12-31
            const player2 = '0x' + data.slice(88, 128);  // Slot 1: bytes 12-31
            const stakeHex = '0x' + data.slice(128, 192); // Slot 2: all 32 bytes
            const state = parseInt(data.slice(382, 384), 16); // Slot 5: last 2 hex chars (uint8)

            // Only show games waiting for player2 (state 0) with player2 = 0x0
            const isPublicGame = player2 === '0x0000000000000000000000000000000000000000';
            const isOpen = state === 0;

            if (isPublicGame && isOpen) {
              games.push({
                id: i,
                creator: player1,
                stake: (parseInt(stakeHex, 16) / 1e18).toFixed(4),
                isOpen: true
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching game ${i}:`, error);
        }
      }

      setOpenGames(games);
    };

    fetchOpenGames();

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      refetchGameCount();
      fetchOpenGames();
    }, 5000);

    return () => clearInterval(interval);
  }, [gameCount, contractAddress, refetchGameCount]);

  const handleJoinGame = async (gameId, stake) => {
    try {
      // Generate commitment (keccak256 returns bytes32, contract expects uint256)
      const commitmentHash = keccak256(toUtf8Bytes(`${move}:${secret}`));
      const commitment = toBigInt(commitmentHash); // Convert bytes32 to uint256

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
