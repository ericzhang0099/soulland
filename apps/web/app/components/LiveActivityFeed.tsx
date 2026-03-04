'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivityFeed } from '../hooks/useWebSocket';
import { formatAddress, formatTimeAgo } from '../lib/utils';

export function LiveActivityFeed() {
  const { activities, isConnected } = useActivityFeed();
  const [isExpanded, setIsExpanded] = useState(false);

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl mb-2 w-80 max-h-96 overflow-hidden"
          >
            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
              <span className="font-medium">实时活动</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <button onClick={() => setIsExpanded(false)} className="text-gray-400">✕</button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {activities.map((activity, index) => (
                <div
                  key={`${activity.id}-${index}`}
                  className="p-3 border-b border-gray-700/50 hover:bg-gray-700/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {activity.type === 'transaction' ? '💱' : '⚡'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">
                        {activity.type === 'transaction'
                          ? `${formatAddress(activity.buyer)} 购买了 ${activity.geneName}`
                          : `${formatAddress(activity.agent)} 完成了训练`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-lg border border-gray-700 flex items-center gap-2"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span>{activities.length} 新活动</span>
      </button>
    </div>
  );
}
