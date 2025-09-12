/**
 * Parses technical blockchain errors into user-friendly messages
 */

export interface ParsedError {
  message: string;
  isUserCancellation: boolean;
  shouldShowError: boolean;
}

export function parseTransactionError(error: any, transactionType: 'deposit' | 'withdraw'): ParsedError {
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code;

  // User cancellation - don't show error message
  if (errorCode === 4001 || 
      errorMessage.toLowerCase().includes('user rejected') ||
      errorMessage.toLowerCase().includes('user denied') ||
      errorMessage.toLowerCase().includes('cancelled') ||
      errorMessage.toLowerCase().includes('denied transaction signature') ||
      errorMessage.toLowerCase().includes('user rejected the request')) {
    return {
      message: '',
      isUserCancellation: true,
      shouldShowError: false
    };
  }

  // Insufficient funds for gas + value
  if (errorMessage.includes('Insufficient funds for gas * price + value') ||
      errorMessage.includes('total cost (gas * gas fee + value) of executing this transaction exceeds the balance') ||
      errorMessage.includes('insufficient funds for gas')) {
    return {
      message: 'Insufficient ETH for transaction. You need more ETH to cover both the deposit amount and gas fees. Please reduce the amount or add more ETH to your wallet.',
      isUserCancellation: false,
      shouldShowError: true
    };
  }

  // General insufficient funds
  if (errorMessage.toLowerCase().includes('insufficient funds') ||
      errorMessage.toLowerCase().includes('insufficient balance')) {
    const action = transactionType === 'deposit' ? 'deposit' : 'withdraw';
    return {
      message: `Insufficient funds to ${action}. Please check your wallet balance and try a smaller amount.`,
      isUserCancellation: false,
      shouldShowError: true
    };
  }

  // Network errors
  if (errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('timeout') ||
      errorMessage.toLowerCase().includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      isUserCancellation: false,
      shouldShowError: true
    };
  }

  // Gas estimation errors
  if (errorMessage.toLowerCase().includes('gas') && 
      (errorMessage.toLowerCase().includes('estimation') || errorMessage.toLowerCase().includes('limit'))) {
    return {
      message: 'Transaction failed due to gas estimation issues. Please try again or contact support if the problem persists.',
      isUserCancellation: false,
      shouldShowError: true
    };
  }

  // Contract-specific errors
  if (errorMessage.toLowerCase().includes('execution reverted') ||
      errorMessage.toLowerCase().includes('revert')) {
    // Try to extract the revert reason
    const revertMatch = errorMessage.match(/revert(?:ed)?\s*:?\s*(.+)/i);
    if (revertMatch) {
      const revertReason = revertMatch[1];
      return {
        message: `Transaction failed: ${revertReason}`,
        isUserCancellation: false,
        shouldShowError: true
      };
    }
    return {
      message: 'Transaction failed. The contract rejected the transaction. Please check your inputs and try again.',
      isUserCancellation: false,
      shouldShowError: true
    };
  }

  // Wallet connection errors
  if (errorMessage.toLowerCase().includes('wallet') ||
      errorMessage.toLowerCase().includes('metamask') ||
      errorMessage.toLowerCase().includes('provider')) {
    return {
      message: 'Wallet connection issue. Please refresh the page and reconnect your wallet.',
      isUserCancellation: false,
      shouldShowError: true
    };
  }

  // Rate limiting or RPC errors
  if (errorMessage.toLowerCase().includes('rate limit') ||
      errorMessage.toLowerCase().includes('too many requests') ||
      errorMessage.toLowerCase().includes('rpc')) {
    return {
      message: 'Service temporarily unavailable. Please wait a moment and try again.',
      isUserCancellation: false,
      shouldShowError: true
    };
  }

  // Default fallback - show a generic but helpful message
  const action = transactionType === 'deposit' ? 'deposit' : 'withdrawal';
  return {
    message: `${action.charAt(0).toUpperCase() + action.slice(1)} failed. Please try again. If the problem persists, please contact support.`,
    isUserCancellation: false,
    shouldShowError: true
  };
}

/**
 * Logs the full technical error for debugging while showing user-friendly message
 */
export function handleTransactionError(error: any, transactionType: 'deposit' | 'withdraw'): ParsedError {
  const parsed = parseTransactionError(error, transactionType);
  
  // Always log the full error for debugging
  console.error(`${transactionType} error:`, error);
  
  return parsed;
}
