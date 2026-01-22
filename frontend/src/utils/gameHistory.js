// Utility functions for managing game transaction history in localStorage

const STORAGE_KEY = 'rps_game_history';

/**
 * Get all game history from localStorage
 */
export const getGameHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEY);
    return history ? JSON.parse(history) : {};
  } catch (error) {
    console.error('Error reading game history:', error);
    return {};
  }
};

/**
 * Save transaction hash for a game
 * @param {number|string} gameId - Game ID
 * @param {string} txHash - Transaction hash
 * @param {string} type - Transaction type: 'create', 'join', 'reveal', 'timeout'
 * @param {string} address - User address
 */
export const saveGameTransaction = (gameId, txHash, type, address) => {
  try {
    const history = getGameHistory();
    const key = `${gameId}`;

    if (!history[key]) {
      history[key] = {
        gameId,
        transactions: []
      };
    }

    // Add transaction if not already exists
    const exists = history[key].transactions.some(tx => tx.hash === txHash);
    if (!exists) {
      history[key].transactions.push({
        hash: txHash,
        type,
        address,
        timestamp: Date.now()
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving game transaction:', error);
  }
};

/**
 * Get transaction history for a specific game
 * @param {number|string} gameId - Game ID
 */
export const getGameTransactions = (gameId) => {
  const history = getGameHistory();
  const key = `${gameId}`;
  return history[key]?.transactions || [];
};

/**
 * Get BaseScan URL for a transaction
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID (84532 for Base Sepolia, 8453 for Base)
 */
export const getBaseScanUrl = (txHash, chainId) => {
  const baseUrl = chainId === 84532
    ? 'https://sepolia.basescan.org'
    : 'https://basescan.org';
  return `${baseUrl}/tx/${txHash}`;
};

/**
 * Clear all game history (for testing/debugging)
 */
export const clearGameHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};
