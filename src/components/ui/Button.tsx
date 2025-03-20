import React from 'react';

type ButtonProps = {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
};

export default function Button({
  type = 'button',
  onClick,
  children,
  className = '',
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-md transition-colors font-medium focus:outline-none focus:ring-2';
  
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
} 