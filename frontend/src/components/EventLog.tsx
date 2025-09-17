import React, { useRef } from 'react';
import { useBlockNumber } from 'wagmi';

interface LogEntry {
  id: string;
  timestamp: Date;
  blockNumber: number;
  type: 'yield_harvested' | 'deposit' | 'test_action' | 'error' | 'admin_action';
  message: string;
  data?: any;
  txHash?: string;
}

interface EventLogProps {
  logs: LogEntry[];
  clearLogs: () => void;
}

const EventLog: React.FC<EventLogProps> = ({ logs, clearLogs }) => {
  const { data: blockNumber } = useBlockNumber();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatLogEntry = (log: LogEntry) => {
    const timeStr = log.timestamp.toISOString().substr(11, 12);
    const typeColor = log.type === 'yield_harvested' ? 'text-green-300' : 
                     log.type === 'deposit' ? 'text-blue-300' : 
                     log.type === 'admin_action' ? 'text-purple-300' :
                     log.type === 'error' ? 'text-red-300' : 'text-yellow-300';
    
    return (
      <div key={log.id} className="flex items-start space-x-2 p-2 bg-gray-800/30 border-l-2 border-gray-600 hover:border-gray-500 hover:bg-gray-800/50 transition-colors">
        <div className="text-xs text-gray-400 font-mono w-14 flex-shrink-0">
          {timeStr}
        </div>
        <div className="text-xs text-gray-500 font-mono w-8 flex-shrink-0">
          #{log.blockNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-mono ${typeColor} break-words`}>
            {log.message}
          </div>
          {log.txHash && (
            <div className="text-xs text-gray-500 font-mono mt-1">
              TX: {log.txHash.slice(0, 10)}...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-sm font-mono text-white font-semibold mb-1">EVENT LOG</h3>
          <div className="text-xs text-gray-400 font-mono ml-2">Real-time Protocol Events</div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={scrollToBottom}
            className="px-3 py-1 rounded text-xs font-mono bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            title="Scroll to bottom"
          >
            ↓
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1 rounded text-xs font-mono bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-500 font-mono">
          Block: {blockNumber ? Number(blockNumber) : 'N/A'} • Events: {logs.length} • Status: ACTIVE
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-700 rounded bg-gray-950 max-h-96 event-log-scroll">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs font-mono">
            No events yet. Start by generating yield or harvesting rewards.
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map(formatLogEntry)}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLog;
