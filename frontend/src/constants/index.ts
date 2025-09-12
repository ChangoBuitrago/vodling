// Network and contract configuration
export const NETWORKS = {
  LOCAL: {
    id: 31337,
    name: 'Localhost',
    rpcUrl: 'http://localhost:8545',
  },
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
  },
  MAINNET: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/',
  },
} as const;

// Gas configuration
export const GAS_LIMITS = {
  DEPOSIT: {
    MINIMUM: 300000n,
    STANDARD: 500000n,
    HIGH: 750000n,
    MAXIMUM: 1000000n,
    EMERGENCY: 1500000n,
  },
  WITHDRAW: {
    MINIMUM: 300000n,
    STANDARD: 500000n,
    HIGH: 750000n,
    MAXIMUM: 1000000n,
    EMERGENCY: 1500000n,
  },
} as const;

// Transaction timeouts
export const TRANSACTION_TIMEOUTS = {
  CONFIRMATION: 60000, // 60 seconds
  MANUAL_RESET: 30000, // 30 seconds
} as const;

// UI configuration
export const UI_CONFIG = {
  SUCCESS_MESSAGE_DURATION: 3000, // 3 seconds
  REFETCH_DELAY: 2000, // 2 seconds
  ANIMATION_DURATION: 300, // 300ms
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_FUNDS: 'Insufficient ETH for gas fees. Try depositing a smaller amount.',
  GAS_ERROR: 'Transaction failed due to gas issues. The system tried multiple gas limits but couldn\'t complete the transaction.',
  CONTRACT_ERROR: 'Transaction failed due to a smart contract error. This might be due to insufficient balance or a contract restriction.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue.',
  INVALID_AMOUNT: 'Please enter a valid amount.',
} as const;

// Balance buffer configuration for MAX button
export const BALANCE_BUFFERS = {
  BASE: '0.15', // Base buffer in ETH
  LARGE_TRANSACTION_THRESHOLD: '1000', // ETH
  VERY_LARGE_TRANSACTION_THRESHOLD: '5000', // ETH
  EXTREMELY_LARGE_TRANSACTION_THRESHOLD: '8000', // ETH
  PERCENTAGE_BUFFERS: {
    EXTREMELY_LARGE: 50, // 2% (1/50)
    VERY_LARGE: 100, // 1% (1/100)
    LARGE: 200, // 0.5% (1/200)
  },
  MINIMUM_BUFFERS: {
    EXTREMELY_LARGE: '2', // ETH
    VERY_LARGE: '1', // ETH
    LARGE: '0.5', // ETH
  },
} as const;
