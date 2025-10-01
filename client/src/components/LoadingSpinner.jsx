import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', variant = 'primary' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'border-blue-500 border-t-transparent',
    secondary: 'border-gray-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    purple: 'border-purple-500 border-t-transparent'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`animate-spin rounded-full border-4 ${sizeClasses[size]} ${variantClasses[variant]}`}></div>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
