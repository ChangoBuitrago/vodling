/**
 * Parses technical blockchain errors into user-friendly messages
 */

export interface ParsedError {
  message: string;
  isUserCancellation: boolean;
  shouldShowError: boolean;
}

export function parseTransactionError(error: any, transactionType: 'deposit' | 'withdraw' | 'harvest'): ParsedError {
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
    const action = transactionType === 'deposit' ? 'deposit' : transactionType === 'withdraw' ? 'withdraw' : 'harvest';
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

  // Handle "with reason:" pattern errors
  if (errorMessage.toLowerCase().includes('with reason:')) {
    // Try to extract the reason after "with reason:"
    const reasonMatch = errorMessage.match(/with reason:\s*(.+)/i);
    if (reasonMatch) {
      const reason = reasonMatch[1].trim();
      
      // Check if it's a gas-related error
      if (reason.toLowerCase().includes('not enough for gas') ||
          reason.toLowerCase().includes('insufficient gas') ||
          reason.toLowerCase().includes('gas too low') ||
          reason.toLowerCase().includes('out of gas')) {
        return {
          message: 'Insufficient ETH for gas fees. You need more ETH to cover the transaction costs. Please add more ETH to your wallet or try a smaller amount.',
          isUserCancellation: false,
          shouldShowError: true
        };
      }
      
      // Check if it's an insufficient funds error
      if (reason.toLowerCase().includes('insufficient')) {
        const action = transactionType === 'deposit' ? 'deposit' : transactionType === 'withdraw' ? 'withdraw' : 'harvest';
        return {
          message: `Insufficient balance to ${action}. Please check your balance and try a smaller amount.`,
          isUserCancellation: false,
          shouldShowError: true
        };
      }
      
      // If it's a custom error or hex code, show generic message
      if (reason.includes('custom error') || reason.includes('0x')) {
        return {
          message: 'Transaction failed. The contract rejected the transaction. Please check your inputs and try again.',
          isUserCancellation: false,
          shouldShowError: true
        };
      }
      
      // If it's a readable reason, show it
      if (reason.length < 100 && !reason.includes('0x')) {
        return {
          message: `Transaction failed: ${reason}`,
          isUserCancellation: false,
          shouldShowError: true
        };
      }
    }
    
    // Fallback for "with reason:" without extractable reason
    return {
      message: 'Transaction failed. The contract rejected the transaction. Please check your inputs and try again.',
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
      
      // Handle custom error codes and technical messages
      if (revertReason.includes('custom error') || revertReason.includes('0x')) {
        return {
          message: 'Transaction failed. The contract rejected the transaction. Please check your inputs and try again.',
          isUserCancellation: false,
          shouldShowError: true
        };
      }
      
      // Handle specific known error messages
      if (revertReason.toLowerCase().includes('insufficient')) {
        const action = transactionType === 'deposit' ? 'deposit' : transactionType === 'withdraw' ? 'withdraw' : 'harvest';
        return {
          message: `Insufficient balance to ${action}. Please check your balance and try a smaller amount.`,
          isUserCancellation: false,
          shouldShowError: true
        };
      }
      
      // Handle gas-related errors
      if (revertReason.toLowerCase().includes('not enough for gas') ||
          revertReason.toLowerCase().includes('insufficient gas') ||
          revertReason.toLowerCase().includes('gas too low') ||
          revertReason.toLowerCase().includes('out of gas')) {
        return {
          message: 'Insufficient ETH for gas fees. You need more ETH to cover the transaction costs. Please add more ETH to your wallet or try a smaller amount.',
          isUserCancellation: false,
          shouldShowError: true
        };
      }
      
      if (revertReason.toLowerCase().includes('unauthorized') || revertReason.toLowerCase().includes('not authorized')) {
        return {
          message: 'Transaction not authorized. Please check your permissions and try again.',
          isUserCancellation: false,
          shouldShowError: true
        };
      }
      
      if (revertReason.toLowerCase().includes('paused')) {
        return {
          message: 'This feature is currently paused. Please try again later.',
          isUserCancellation: false,
          shouldShowError: true
        };
      }
      
      // For other revert reasons, show them if they're user-friendly
      if (revertReason.length < 100 && !revertReason.includes('0x')) {
        return {
          message: `Transaction failed: ${revertReason}`,
          isUserCancellation: false,
          shouldShowError: true
        };
      }
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
  const action = transactionType === 'deposit' ? 'deposit' : transactionType === 'withdraw' ? 'withdrawal' : 'harvest';
  return {
    message: `${action.charAt(0).toUpperCase() + action.slice(1)} failed. Please try again. If the problem persists, please contact support.`,
    isUserCancellation: false,
    shouldShowError: true
  };
}

/**
 * Logs the full technical error for debugging while showing user-friendly message
 */
export function handleTransactionError(error: any, transactionType: 'deposit' | 'withdraw' | 'harvest'): ParsedError {
  const parsed = parseTransactionError(error, transactionType);
  
  // Always log the full error for debugging
  console.error(`${transactionType} error:`, error);
  
  return parsed;
}
