import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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

function CreateGame() {
  const { chain } = useAccount();
  const [opponentAddress, setOpponentAddress] = useState('');
  const [stake, setStake] = useState('0.01');
  const [move, setMove] = useState('1');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState('');

  // Generate secret on mount
  useEffect(() => {
    setSecret(generateSecret());
  }, []);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleCreateGame = async () => {
    if (!opponentAddress || !stake || !secret) {
      setStatus('Please fill all fields');
      return;
    }

    try {
      // Generate commitment
      const commitment = keccak256(toUtf8Bytes(`${move}:${secret}`));

      // Get contract address for current chain
      const contractAddress = chain?.id === 84532
        ? CONTRACTS.RockPaperScissorsZK.baseSepolia
        : CONTRACTS.RockPaperScissorsZK.base;

      setStatus('Creating game...');

      writeContract({
        address: contractAddress,
        abi: RPS_ZK_ABI,
        functionName: 'createGame',
        args: [opponentAddress, commitment],
        value: parseEther(stake)
      });

      setStatus('Save your move and secret - you will need them later!');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="create-game">
      <h2>Create New Game</h2>

      <div className="form-group">
        <label>Opponent Address</label>
        <input
          type="text"
          placeholder="0x..."
          value={opponentAddress}
          onChange={(e) => setOpponentAddress(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Stake (ETH)</label>
        <input
          type="number"
          step="0.01"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Your Move</label>
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
      </div>

      <div className="form-group">
        <label>Secret (keep this private!)</label>
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
            style={{ padding: '8px 16px' }}
          >
            Regenerate
          </button>
        </div>
        <small>This secret is auto-generated. Save it - you'll need it to prove your move later!</small>
      </div>

      <button
        onClick={handleCreateGame}
        disabled={isPending || isConfirming || !opponentAddress || !secret}
      >
        {isPending || isConfirming ? 'Creating...' : 'Create Game'}
      </button>

      {isSuccess && (
        <div className="success">
          Game created! Transaction: {hash?.slice(0, 10)}...
        </div>
      )}

      {status && <div className="status">{status}</div>}

      <div className="info-box">
        <h4>Important!</h4>
        <ul>
          <li>Your move: {MOVES[move]}</li>
          <li>Your secret: {secret || '(not set)'}</li>
          <li>Save these - you cannot recover them!</li>
        </ul>
      </div>
    </div>
  );
}

export default CreateGame;
