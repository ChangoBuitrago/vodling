import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useBlockNumber } from 'wagmi';
import ProtocolControls from '../components/ProtocolControls';
import EventLog from '../components/EventLog';
import Dashboard from '../components/Dashboard';
import ClaimYield from '../components/ClaimYield';

interface LogEntry {
  id: string;
  timestamp: Date;
  blockNumber: number;
  type: 'yield_harvested' | 'deposit' | 'test_action' | 'error' | 'admin_action';
  message: string;
  data?: any;
  txHash?: string;
}

const TestingPage: React.FC = () => {
  const { data: blockNumber } = useBlockNumber();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLogEntry = useCallback((log: Omit<LogEntry, 'id' | 'timestamp' | 'blockNumber'>) => {
    const newLog: LogEntry = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      blockNumber: blockNumber ? Number(blockNumber) : 0,
    };
    
    setLogs(prev => [...prev, newLog]);
  }, [blockNumber]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center text-gray-300 hover:text-white transition-colors text-sm"
              >
                <span className="mr-2">←</span>
                <span>Back to App</span>
              </Link>
            </div>
            <div className="flex items-center">
              <h1 className="text-lg font-mono text-white">/simulation</h1>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              localhost:3000
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <h2 className="text-sm font-mono text-gray-400 mb-1">YIELD SIMULATION ENVIRONMENT</h2>
          <p className="text-xs text-gray-500 font-mono">
            Principal Protection + Reward Optimization • Lido → TurboVault → EigenLayer • Admin-managed restaking
          </p>
        </div>
        
        {/* Dashboard and Protocol Controls - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Dashboard />
          </div>
          <div className="lg:col-span-1">
            <ProtocolControls logs={logs} addLogEntry={addLogEntry} />
          </div>
        </div>
        
        {/* Claim Yield Component */}
        <div className="mb-6">
          <ClaimYield />
        </div>
        
        {/* Event Log */}
        <div className="mb-6">
          <EventLog logs={logs} clearLogs={clearLogs} />
        </div>
      </div>
    </div>
  );
};

export default TestingPage;
