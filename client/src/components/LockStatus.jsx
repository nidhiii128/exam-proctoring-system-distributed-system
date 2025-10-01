import React, { useState, useEffect } from 'react';

const LockStatus = ({ resourceId, lockStatus, onRefresh }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lockStatus && (lockStatus.hasLock || lockStatus.queueLength > 0)) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [lockStatus]);

  if (!isVisible || !lockStatus) return null;

  const getStatusColor = () => {
    if (lockStatus.type === 'write') return 'text-red-600 bg-red-100';
    if (lockStatus.type === 'read') return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusText = () => {
    if (lockStatus.type === 'write') return 'Teacher is updating marks';
    if (lockStatus.type === 'read') return 'Students are viewing marks';
    return 'System is processing';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-lg shadow-lg border ${getStatusColor()}`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{getStatusText()}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-2 text-xs underline hover:no-underline"
            >
              Refresh
            </button>
          )}
        </div>
        {lockStatus.queueLength > 0 && (
          <div className="text-xs mt-1 opacity-75">
            {lockStatus.queueLength} request(s) waiting
          </div>
        )}
      </div>
    </div>
  );
};

export default LockStatus;
