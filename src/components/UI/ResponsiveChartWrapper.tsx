import React, { ReactNode } from 'react';

interface ResponsiveChartWrapperProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
  height?: string;
}

/**
 * A wrapper component that makes charts horizontally scrollable on narrower screens
 */
const ResponsiveChartWrapper: React.FC<ResponsiveChartWrapperProps> = ({
  children,
  className = '',
  minWidth = '400px',
  height = '300px',
}) => {
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <div style={{ minWidth, height }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveChartWrapper; 