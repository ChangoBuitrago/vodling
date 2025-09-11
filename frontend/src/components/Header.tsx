import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface HeaderProps {
  onToggleTestingTools: () => void;
}

const ConnectButton: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-300 font-mono bg-white/5 px-3 py-1 rounded-lg">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="btn-secondary px-4 py-2 text-sm font-medium"
        >
          Disconnect
        </button>
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
            className="btn-primary px-4 py-2 text-sm font-medium"
          >
            <i className="fas fa-wallet mr-2"></i>
            Connect {connector.name}
          </button>
        ))}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ onToggleTestingTools }) => {
  const { isConnected } = useAccount();

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
            {/* Testing Tools Toggle Button - Only show when connected */}
            {isConnected && (
              <button
                onClick={onToggleTestingTools}
                className="btn-secondary px-3 py-2 text-sm font-medium"
                title="Toggle Testing Tools"
              >
                <i className="fas fa-flask mr-2"></i>
                Testing Tools
              </button>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
