import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';

const ConnectButton: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const disconnectRef = useRef<HTMLDivElement>(null);

  const handleDisconnect = () => {
    setShowDisconnectConfirm(false);
    disconnect();
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (disconnectRef.current && !disconnectRef.current.contains(event.target as Node)) {
        setShowDisconnectConfirm(false);
      }
    };

    if (showDisconnectConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDisconnectConfirm]);

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 31337: return 'Local';
      case 11155111: return 'Sepolia';
      default: return `Chain ${chainId}`;
    }
  };

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 1: return 'text-green-400';
      case 31337: return 'text-purple-400';
      case 11155111: return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Network Indicator - Hidden on very small screens */}
        <div className="hidden xs:flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${chainId === 1 ? 'bg-green-400' : chainId === 31337 ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
          <span className={`text-xs font-medium ${getNetworkColor(chainId)}`}>
            {getNetworkName(chainId)}
          </span>
        </div>


        {/* Wallet Address */}
        <div className="flex items-center space-x-1 sm:space-x-2 bg-white/5 px-2 sm:px-3 py-2 rounded-lg border border-white/10">
          <i className="fas fa-wallet text-xs text-gray-400"></i>
          <span className="text-xs sm:text-sm font-mono text-gray-300">
            {address.slice(0, 4)}...{address.slice(-4)}
          </span>
        </div>

        {/* Disconnect Button */}
        <div className="relative" ref={disconnectRef}>
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            className="flex items-center space-x-1 sm:space-x-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300"
          >
            <i className="fas fa-sign-out-alt text-xs"></i>
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Disconnect</span>
          </button>

          {/* Disconnect Confirmation Modal */}
          {showDisconnectConfirm && (
            <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 p-4 disconnect-modal">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 bg-red-500/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-400 text-sm sm:text-base"></i>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">Disconnect Wallet?</h3>
                <p className="text-xs text-gray-400 mb-4">
                  You'll need to reconnect to interact with the protocol.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      {connectors
        .filter((connector) => connector.name === 'MetaMask')
        .map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            className="flex items-center space-x-1 sm:space-x-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 text-blue-400 hover:text-blue-300"
          >
            <i className="fas fa-wallet text-xs"></i>
            <span className="text-xs sm:text-sm font-medium">Connect {connector.name}</span>
          </button>
        ))}
    </div>
  );
};

const Header: React.FC = () => {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-lg">
      <div className="w-full max-w-7xl mx-auto p-3 sm:p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#A78BFA"/>
                  <stop offset="100%" stopColor="#4F46E5"/>
                </linearGradient>
              </defs>
              <path d="M12 2a10 10 0 1 0 10 10" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(45 12 12)">
                <animateTransform attributeName="transform" type="rotate" from="45 12 12" to="405 12 12" dur="10s" repeatCount="indefinite"/>
              </path>
              <path d="M12 22a10 10 0 1 0-10-10" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-45 12 12)">
                <animateTransform attributeName="transform" type="rotate" from="-45 12 12" to="315 12 12" dur="10s" repeatCount="indefinite"/>
              </path>
            </svg>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Vodling</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
