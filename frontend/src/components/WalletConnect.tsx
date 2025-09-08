import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const ConnectButton: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
};

const WalletConnect: React.FC = () => {
  const { isConnected } = useAccount();

  if (isConnected) {
    return null; // Don't show anything when connected - header is enough
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600 mb-4">
          Connect your wallet to start staking ETH with principal protection
        </p>
        <ConnectButton />
      </div>
    </div>
  );
};

export default WalletConnect;
