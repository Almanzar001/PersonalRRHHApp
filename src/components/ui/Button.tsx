import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  children, 
  style,
  disabled,
  ...props 
}) => {
  const getButtonClasses = () => {
    let classes = 'rounded-app-button flex-row items-center justify-center transition-all duration-app ease-app';
    
    // Variant styles
    if (variant === 'primary') {
      classes += disabled 
        ? ' bg-gray-300' 
        : ' bg-app-primary active:bg-blue-600';
    } else {
      classes += disabled 
        ? ' bg-gray-200' 
        : ' bg-app-button-secondary active:bg-app-button-secondary-hover';
    }
    
    // Size styles
    switch (size) {
      case 'sm':
        classes += ' px-3 py-2';
        break;
      case 'lg':
        classes += ' px-6 py-4';
        break;
      default:
        classes += ' px-app-button-x py-app-button-y';
    }
    
    return classes;
  };

  const getTextClasses = () => {
    let classes = 'font-medium transition-colors duration-app';
    
    if (variant === 'primary') {
      classes += disabled ? ' text-gray-500' : ' text-app-white';
    } else {
      classes += disabled ? ' text-gray-400' : ' text-app-text-primary';
    }
    
    // Size-based text
    switch (size) {
      case 'sm':
        classes += ' text-app-body-sm';
        break;
      case 'lg':
        classes += ' text-app-subtitle-md';
        break;
      default:
        classes += ' text-app-body';
    }
    
    return classes;
  };

  return (
    <TouchableOpacity 
      className={getButtonClasses()}
      style={style}
      disabled={disabled}
      {...props}
    >
      <Text className={getTextClasses()}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
