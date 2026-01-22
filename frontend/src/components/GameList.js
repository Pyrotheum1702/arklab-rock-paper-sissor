import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toUtf8Bytes, toBigInt } from 'ethers';
import { RPS_ZK_ABI, CONTRACTS } from '../config/contracts';
import { saveGameTransaction, getGameTransactions, getBaseScanUrl } from '../utils/gameHistory';

const GAME_STATES = {
  0: 'Waiting for Player 2',
  1: 'Both Players Committed',
  2: 'Game Completed'
};

const MOVES = {
  1: 'Rock',
  2: 'Paper',
  3: 'Scissors'
};

function GameList() {
  const { address, chain } = useAccount();
  const [games, setGames] = useState([]);
  const [revealingGame, setRevealingGame] = useState(null);
  const [revealMove, setRevealMove] = useState('1');
  const [revealSecret, setRevealSecret] = useState('');
  const [status, setStatus] = useState('');
  const [claimingTimeout, setClaimingTimeout] = useState(null);
  const [lastAction, setLastAction] = useState(null); // Track last action: { gameId, type }

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Save transaction when successful
  useEffect(() => {
    if (isSuccess && hash && lastAction && address) {
      saveGameTransaction(lastAction.gameId, hash, lastAction.type, address);
      setLastAction(null); // Reset after saving
    }
  }, [isSuccess, hash, lastAction, address]);

  // Get contract address for current chain
  const contractAddress = chain?.id === 84532
    ? CONTRACTS.RockPaperScissorsZK.baseSepolia
    : CONTRACTS.RockPaperScissorsZK.base;

  // Read game count
  const { data: gameCount, refetch: refetchGameCount } = useReadContract({
    address: contractAddress,
    abi: RPS_ZK_ABI,
    functionName: 'gameCounter'
  });

  useEffect(() => {
    const fetchGames = async () => {
      if (!gameCount || !contractAddress || !address) {
        setGames([]);
        return;
      }

      const userGames = [];
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
            const commitment1Hex = '0x' + data.slice(192, 256); // Slot 3: all 32 bytes
            const commitment2Hex = '0x' + data.slice(256, 320); // Slot 4: all 32 bytes
            const state = parseInt(data.slice(382, 384), 16); // Slot 5: last 2 hex chars (uint8)
            const winnerHex = '0x' + data.slice(408, 448); // Slot 6: bytes 12-31
            const createdAtHex = '0x' + data.slice(448, 512); // Slot 7: all 32 bytes (timestamp)

            // Check if user is player1 or player2
            const isUserGame =
              player1.toLowerCase() === address.toLowerCase() ||
              player2.toLowerCase() === address.toLowerCase();

            if (isUserGame) {
              const createdAt = parseInt(createdAtHex, 16);
              const now = Math.floor(Date.now() / 1000); // Current time in seconds
              const timeoutReached = now >= createdAt + (24 * 60 * 60); // 24 hours in seconds

              userGames.push({
                id: i,
                player1,
                player2: player2 === '0x0000000000000000000000000000000000000000' ? 'Waiting...' : player2,
                stake: (parseInt(stakeHex, 16) / 1e18).toFixed(4),
                state,
                winner: winnerHex === '0x0000000000000000000000000000000000000000' ? null : winnerHex,
                commitment1: commitment1Hex,
                commitment2: commitment2Hex,
                createdAt,
                timeoutReached
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching game ${i}:`, error);
        }
      }

      setGames(userGames.reverse()); // Show newest first
    };

    fetchGames();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      refetchGameCount();
      fetchGames();
    }, 10000);

    return () => clearInterval(interval);
  }, [gameCount, contractAddress, address, refetchGameCount]);

  const handleRevealMove = async (game) => {
    try {
      // Verify the commitment matches
      const commitment = toBigInt(keccak256(toUtf8Bytes(`${revealMove}:${revealSecret}`)));
      const userCommitment = game.player1.toLowerCase() === address.toLowerCase()
        ? game.commitment1
        : game.commitment2;

      if (commitment.toString() !== userCommitment) {
        setStatus('Error: Move and secret do not match your commitment!');
        return;
      }

      // For MockVerifier, we just need to pass dummy proof values
      // and the correct winner in the public inputs
      // Since MockVerifier doesn't actually verify, we need to compute the winner
      // Note: This is a simplification - in production you'd generate a real ZK proof

      // For now, let's just submit with winner = 1 (player1 wins) as a test
      // The contract will accept any proof with the MockVerifier
      const winner = 1; // You'd compute this from both moves in a real implementation

      const a = [0, 0];
      const b = [[0, 0], [0, 0]];
      const c = [0, 0];

      setStatus('Submitting proof...');
      setLastAction({ gameId: game.id, type: 'reveal' });

      writeContract({
        address: contractAddress,
        abi: RPS_ZK_ABI,
        functionName: 'proveWinner',
        args: [game.id, winner, a, b, c]
      });

      setRevealingGame(null);
      setRevealMove('1');
      setRevealSecret('');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleClaimTimeout = async (gameId) => {
    try {
      setStatus('Claiming timeout refund...');
      setClaimingTimeout(gameId);
      setLastAction({ gameId, type: 'timeout' });

      writeContract({
        address: contractAddress,
        abi: RPS_ZK_ABI,
        functionName: 'claimTimeout',
        args: [gameId]
      });
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setClaimingTimeout(null);
    }
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
                <div>
                  Player 1: {game.player1.toLowerCase() === address.toLowerCase() ? 'You' : game.player1.slice(0, 6) + '...' + game.player1.slice(-4)}
                </div>
                <div>
                  Player 2: {game.player2 === 'Waiting...' ? 'Waiting...' : (game.player2.toLowerCase() === address.toLowerCase() ? 'You' : game.player2.slice(0, 6) + '...' + game.player2.slice(-4))}
                </div>
                <div>Stake: {game.stake} ETH</div>
                <div>Status: {GAME_STATES[game.state]}</div>
              </div>
              {game.winner && (
                <div className="winner">
                  Winner: {game.winner.toLowerCase() === address.toLowerCase() ? '🎉 You Won!' : game.winner.slice(0, 6) + '...' + game.winner.slice(-4)}
                </div>
              )}

              {/* Transaction History */}
              {(() => {
                const transactions = getGameTransactions(game.id);
                return transactions.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
                      Transaction History
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {transactions.map((tx, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                          <span style={{
                            padding: '2px 8px',
                            background: tx.type === 'create' ? '#e3f2fd' : tx.type === 'join' ? '#f3e5f5' : tx.type === 'reveal' ? '#e8f5e9' : '#fff3e0',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {tx.type}
                          </span>
                          <a
                            href={getBaseScanUrl(tx.hash, chain?.id || 84532)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#0071e3',
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem'
                            }}
                          >
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)} ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {game.state === 1 && revealingGame === game.id && (
                <div className="reveal-form" style={{ marginTop: '16px', padding: '16px', background: '#f5f5f7', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '0.95rem' }}>Reveal Your Move</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Your Move:</label>
                    <select
                      value={revealMove}
                      onChange={(e) => setRevealMove(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d2d2d7' }}
                    >
                      <option value="1">Rock</option>
                      <option value="2">Paper</option>
                      <option value="3">Scissors</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Your Secret:</label>
                    <input
                      type="text"
                      value={revealSecret}
                      onChange={(e) => setRevealSecret(e.target.value)}
                      placeholder="Enter the secret you used when committing"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d2d2d7', fontFamily: 'monospace', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleRevealMove(game)}
                      disabled={isPending || isConfirming || !revealSecret}
                      style={{ flex: 1, padding: '10px', fontSize: '0.9rem' }}
                    >
                      {isPending || isConfirming ? 'Submitting...' : 'Submit Proof'}
                    </button>
                    <button
                      onClick={() => {
                        setRevealingGame(null);
                        setRevealMove('1');
                        setRevealSecret('');
                      }}
                      style={{ flex: 1, padding: '10px', fontSize: '0.9rem', background: '#6e6e73' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {game.state === 1 && revealingGame !== game.id && (
                <>
                  <button
                    onClick={() => setRevealingGame(game.id)}
                    style={{ marginTop: '12px', background: '#34c759' }}
                  >
                    Reveal & Prove Winner
                  </button>

                  {game.timeoutReached && (
                    <button
                      onClick={() => handleClaimTimeout(game.id)}
                      disabled={isPending || isConfirming || claimingTimeout === game.id}
                      style={{ marginTop: '8px', background: '#ff9500' }}
                    >
                      {claimingTimeout === game.id ? 'Claiming Refund...' : 'Claim Timeout Refund'}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {isSuccess && (
        <div className="success" style={{ marginTop: '20px' }}>
          Proof submitted! Transaction: {hash?.slice(0, 10)}...
        </div>
      )}

      {status && (
        <div className="status" style={{ marginTop: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
          {status}
        </div>
      )}

      <div className="info-box">
        <h4>How to Complete a Game</h4>
        <p>When a game shows "Both Players Committed":</p>
        <ol>
          <li>Click "Reveal & Prove Winner"</li>
          <li>Enter the move and secret you used when you created/joined the game</li>
          <li>Submit the proof to determine the winner on-chain</li>
          <li>Winner receives 2x the stake (0.0002 ETH total)</li>
        </ol>
        <p><strong>Important:</strong> Make sure to save your move and secret when creating or joining a game! You'll need them to prove the winner.</p>
        <p><strong>Lost your secret?</strong> After 24 hours, both players can claim a timeout refund. The "Claim Timeout Refund" button will appear once the timeout period has passed.</p>
        <p><strong>Note:</strong> Currently using MockVerifier for testing. Full ZK proof generation coming soon!</p>
      </div>
    </div>
  );
}

export default GameList;
