import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
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

function CreateGame() {
  const { address, chain } = useAccount();
  const [gameType, setGameType] = useState('public');
  const [opponentAddress, setOpponentAddress] = useState('');
  const [stake, setStake] = useState('0.0001');
  const [move, setMove] = useState('1');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState('');

  // Get contract address for current chain
  const contractAddress = chain?.id === 84532
    ? CONTRACTS.RockPaperScissorsZK.baseSepolia
    : CONTRACTS.RockPaperScissorsZK.base;

  // Read game counter to get the game ID that will be created
  const { data: gameCounter } = useReadContract({
    address: contractAddress,
    abi: RPS_ZK_ABI,
    functionName: 'gameCounter'
  });

  // Generate secret on mount
  useEffect(() => {
    setSecret(generateSecret());
  }, []);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Update status based on transaction state and save transaction
  useEffect(() => {
    if (isPending) {
      setStatus('Waiting for wallet confirmation...');
    } else if (isConfirming) {
      setStatus('Transaction submitted. Waiting for confirmation...');
    } else if (isSuccess && hash && gameCounter !== undefined && address) {
      setStatus('Game created successfully!');
      // Save transaction to history (the game ID will be current gameCounter value)
      const gameId = Number(gameCounter);
      saveGameTransaction(gameId, hash, 'create', address);
    } else if (writeError) {
      setStatus(`Transaction failed: ${writeError.message}`);
    } else if (confirmError) {
      setStatus(`Confirmation failed: ${confirmError.message}`);
    }
  }, [isPending, isConfirming, isSuccess, writeError, confirmError, hash, gameCounter, address]);

  const handleCreateGame = async () => {
    console.log('Create game clicked');

    if (!stake || !secret) {
      setStatus('Please fill all fields');
      return;
    }

    if (gameType === 'private' && !opponentAddress) {
      setStatus('Please enter opponent address for private game');
      return;
    }

    try {
      // Generate commitment (keccak256 returns bytes32, contract expects uint256)
      const commitmentHash = keccak256(toUtf8Bytes(`${move}:${secret}`));
      const commitment = toBigInt(commitmentHash); // Convert bytes32 to uint256
      console.log('Commitment hash:', commitmentHash);
      console.log('Commitment uint256:', commitment.toString());

      // Get contract address for current chain
      const contractAddress = chain?.id === 84532
        ? CONTRACTS.RockPaperScissorsZK.baseSepolia
        : CONTRACTS.RockPaperScissorsZK.base;

      console.log('Contract address:', contractAddress);
      console.log('Chain ID:', chain?.id);

      // Use zero address for public games
      const opponent = gameType === 'public'
        ? '0x0000000000000000000000000000000000000000'
        : opponentAddress;

      console.log('Opponent:', opponent);
      console.log('Stake:', stake);

      setStatus('Creating game...');

      const result = writeContract({
        address: contractAddress,
        abi: RPS_ZK_ABI,
        functionName: 'createGame',
        args: [opponent, commitment],
        value: parseEther(stake)
      });

      console.log('Transaction submitted:', result);
      setStatus('Transaction submitted. Waiting for confirmation...');
    } catch (error) {
      console.error('Error creating game:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="create-game">
      <h2>Create New Game</h2>

      <div className="form-group">
        <label>Game Type</label>
        <div className="move-buttons">
          <button
            type="button"
            className={`move-btn ${gameType === 'public' ? 'selected' : ''}`}
            onClick={() => setGameType('public')}
          >
            Public
          </button>
          <button
            type="button"
            className={`move-btn ${gameType === 'private' ? 'selected' : ''}`}
            onClick={() => setGameType('private')}
          >
            Private
          </button>
        </div>
        <small>{gameType === 'public' ? 'Anyone can join this game' : 'Only specified address can join'}</small>
      </div>

      {gameType === 'private' && (
        <div className="form-group">
          <label>Opponent Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={opponentAddress}
            onChange={(e) => setOpponentAddress(e.target.value)}
          />
        </div>
      )}

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
        disabled={isPending || isConfirming || (gameType === 'private' && !opponentAddress) || !secret}
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
