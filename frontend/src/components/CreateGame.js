import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, keccak256, toUtf8Bytes } from 'ethers';
import { RPS_ZK_ABI, CONTRACTS } from '../config/contracts';

const MOVES = {
  1: 'Rock',
  2: 'Paper',
  3: 'Scissors'
};

function CreateGame() {
  const { address, chain } = useAccount();
  const [opponentAddress, setOpponentAddress] = useState('');
  const [stake, setStake] = useState('0.01');
  const [move, setMove] = useState('1');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState('');

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
        <select value={move} onChange={(e) => setMove(e.target.value)}>
          <option value="1">Rock</option>
          <option value="2">Paper</option>
          <option value="3">Scissors</option>
        </select>
      </div>

      <div className="form-group">
        <label>Secret (keep this private!)</label>
        <input
          type="password"
          placeholder="Enter a secret phrase"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <small>You'll need this secret to prove your move later</small>
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
