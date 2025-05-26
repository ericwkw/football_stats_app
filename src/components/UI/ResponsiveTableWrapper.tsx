import React, { ReactNode } from 'react';

interface ResponsiveTableWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * A wrapper component that makes tables horizontally scrollable on narrower screens
 */
const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white shadow-md rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
};

export default ResponsiveTableWrapper; 