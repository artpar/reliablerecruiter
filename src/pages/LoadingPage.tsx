import React from 'react';

const LoadingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      <p className="mt-4  text-lg">Loading...</p>
    </div>
  );
};

export default LoadingPage;
