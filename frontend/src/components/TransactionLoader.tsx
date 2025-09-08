import React from 'react';
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TransactionLoaderProps {
  isWriting: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error?: string;
  transactionHash?: string;
  type: 'deposit' | 'withdrawPrincipal' | 'withdrawYield';
}

const TransactionLoader: React.FC<TransactionLoaderProps> = ({
  isWriting,
  isConfirming,
  isSuccess,
  error,
  transactionHash,
  type,
}) => {
  const getStepText = () => {
    if (error) return 'Transaction Failed';
    if (isSuccess) return 'Transaction Confirmed';
    if (isConfirming) return 'Confirming Transaction';
    if (isWriting) return 'Preparing Transaction';
    return 'Ready';
  };

  const getStepIcon = () => {
    if (error) return <AlertCircle className="h-5 w-5 text-red-600" />;
    if (isSuccess) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (isConfirming || isWriting) return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const getActionText = () => {
    switch (type) {
      case 'deposit':
        return 'Depositing ETH';
      case 'withdrawPrincipal':
        return 'Withdrawing Principal';
      case 'withdrawYield':
        return 'Withdrawing Yield';
      default:
        return 'Processing Transaction';
    }
  };

  const getStepDescription = () => {
    if (error) return error;
    if (isSuccess) return 'Your transaction has been successfully confirmed on the blockchain.';
    if (isConfirming) return 'Waiting for blockchain confirmation. This may take a few moments.';
    if (isWriting) return 'Please confirm the transaction in your wallet.';
    return 'Ready to process your transaction.';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center space-x-4">
        {getStepIcon()}
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            {getActionText()}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {getStepText()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {getStepDescription()}
          </p>
          {transactionHash && (
            <div className="mt-3">
              <p className="text-xs text-gray-500">Transaction Hash:</p>
              <p className="text-xs font-mono text-blue-600 break-all">
                {transactionHash}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="mt-6">
        <div className="flex items-center space-x-4">
          {/* Step 1: Writing */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isWriting || isConfirming || isSuccess ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {isWriting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-sm font-medium">1</span>
              )}
            </div>
            <span className="ml-2 text-sm text-gray-600">Prepare</span>
          </div>
          
          {/* Arrow */}
          <div className={`w-8 h-0.5 ${isConfirming || isSuccess ? 'bg-blue-600' : 'bg-gray-200'}`} />
          
          {/* Step 2: Confirming */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isConfirming || isSuccess ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {isConfirming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSuccess ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">2</span>
              )}
            </div>
            <span className="ml-2 text-sm text-gray-600">Confirm</span>
          </div>
          
          {/* Arrow */}
          <div className={`w-8 h-0.5 ${isSuccess ? 'bg-green-600' : 'bg-gray-200'}`} />
          
          {/* Step 3: Complete */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isSuccess ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {isSuccess ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">3</span>
              )}
            </div>
            <span className="ml-2 text-sm text-gray-600">Complete</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionLoader;
