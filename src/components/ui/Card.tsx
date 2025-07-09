import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'hover';
  size?: 'sm' | 'default';
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ 
  variant = 'default', 
  size = 'default',
  children, 
  style,
  ...props 
}) => {
  const baseClasses = 'bg-app-white rounded-app-card p-app-card';
  const shadowClasses = variant === 'hover' ? 'shadow-app-card-hover' : 'shadow-app-card';
  const sizeClasses = size === 'sm' ? 'rounded-app-card-sm p-3' : '';
  
  return (
    <View 
      className={`${baseClasses} ${shadowClasses} ${sizeClasses}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
