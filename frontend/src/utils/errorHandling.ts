import { ERROR_MESSAGES } from '../constants';

export type ErrorType = 
  | 'INSUFFICIENT_FUNDS'
  | 'GAS_ERROR'
  | 'CONTRACT_ERROR'
  | 'NETWORK_ERROR'
  | 'WALLET_NOT_CONNECTED'
  | 'INVALID_AMOUNT'
  | 'UNKNOWN_ERROR';

export interface ParsedError {
  type: ErrorType;
  message: string;
  originalError: any;
  userFriendlyMessage: string;
}

/**
 * Parses blockchain errors and returns structured error information
 */
export const parseBlockchainError = (error: any): ParsedError => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toString() || '';
  const errorDetails = error?.details?.toLowerCase() || '';

  // Check for insufficient funds errors
  if (
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('insufficient balance') ||
    errorMessage.includes('not enough') ||
    errorMessage.includes('funds for gas') ||
    errorMessage.includes('insufficient') ||
    errorCode.includes('INSUFFICIENT_FUNDS') ||
    errorCode.includes('INSUFFICIENT_BALANCE')
  ) {
    return {
      type: 'INSUFFICIENT_FUNDS',
      message: errorMessage,
      originalError: error,
      userFriendlyMessage: ERROR_MESSAGES.INSUFFICIENT_FUNDS,
    };
  }

  // Check for gas-related errors
  if (
    errorMessage.includes('gas') ||
    errorMessage.includes('out of gas') ||
    errorMessage.includes('gas limit') ||
    errorMessage.includes('intrinsic gas') ||
    errorCode.includes('UNPREDICTABLE_GAS_LIMIT') ||
    errorCode.includes('GAS_LIMIT_EXCEEDED')
  ) {
    return {
      type: 'GAS_ERROR',
      message: errorMessage,
      originalError: error,
      userFriendlyMessage: ERROR_MESSAGES.GAS_ERROR,
    };
  }

  // Check for contract-related errors
  if (
    errorMessage.includes('custom error') ||
    errorMessage.includes('execution reverted') ||
    errorMessage.includes('revert') ||
    errorMessage.includes('contract')
  ) {
    return {
      type: 'CONTRACT_ERROR',
      message: errorMessage,
      originalError: error,
      userFriendlyMessage: ERROR_MESSAGES.CONTRACT_ERROR,
    };
  }

  // Check for network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorCode.includes('NETWORK_ERROR')
  ) {
    return {
      type: 'NETWORK_ERROR',
      message: errorMessage,
      originalError: error,
      userFriendlyMessage: ERROR_MESSAGES.NETWORK_ERROR,
    };
  }

  // Check for wallet connection errors
  if (
    errorMessage.includes('wallet') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('account') ||
    errorCode.includes('UNAUTHORIZED')
  ) {
    return {
      type: 'WALLET_NOT_CONNECTED',
      message: errorMessage,
      originalError: error,
      userFriendlyMessage: ERROR_MESSAGES.WALLET_NOT_CONNECTED,
    };
  }

  // Check for invalid amount errors
  if (
    errorMessage.includes('invalid amount') ||
    errorMessage.includes('amount') ||
    errorMessage.includes('zero') ||
    errorMessage.includes('negative')
  ) {
    return {
      type: 'INVALID_AMOUNT',
      message: errorMessage,
      originalError: error,
      userFriendlyMessage: ERROR_MESSAGES.INVALID_AMOUNT,
    };
  }

  // Default to unknown error
  return {
    type: 'UNKNOWN_ERROR',
    message: errorMessage,
    originalError: error,
    userFriendlyMessage: error?.message || 'An unexpected error occurred. Please try again.',
  };
};

/**
 * Gets a user-friendly error message based on error type
 */
export const getUserFriendlyErrorMessage = (error: any): string => {
  const parsedError = parseBlockchainError(error);
  return parsedError.userFriendlyMessage;
};

/**
 * Checks if an error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  const parsedError = parseBlockchainError(error);
  
  // Gas errors and network errors are typically retryable
  return parsedError.type === 'GAS_ERROR' || parsedError.type === 'NETWORK_ERROR';
};

/**
 * Logs error details for debugging
 */
export const logError = (error: any, context: string = 'Unknown'): void => {
  const parsedError = parseBlockchainError(error);
  
  console.group(`🚨 Error in ${context}`);
  console.log('Error Type:', parsedError.type);
  console.log('Original Message:', parsedError.message);
  console.log('User Friendly Message:', parsedError.userFriendlyMessage);
  console.log('Error Code:', error?.code);
  console.log('Error Details:', error?.details);
  console.log('Full Error Object:', parsedError.originalError);
  console.groupEnd();
};
