import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { breakpoints } from '../styles/theme';

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  isXl: boolean;
  orientation: 'portrait' | 'landscape';
}

export const useResponsive = (): ResponsiveState => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  return {
    width,
    height,
    isMobile: width < breakpoints.tablet,
    isTablet: width >= breakpoints.tablet && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop && width < breakpoints.large,
    isLarge: width >= breakpoints.large && width < breakpoints.xl,
    isXl: width >= breakpoints.xl,
    orientation: width > height ? 'landscape' : 'portrait',
  };
};

// Hook para obtener número de columnas responsive
export const useResponsiveColumns = (baseColumns: number = 2): number => {
  const { isMobile, isTablet, isDesktop, isLarge, isXl } = useResponsive();

  if (isMobile) return 1;
  if (isTablet) return Math.min(baseColumns, 2);
  if (isDesktop) return Math.min(baseColumns, 3);
  if (isLarge) return Math.min(baseColumns, 4);
  if (isXl) return Math.min(baseColumns, 5);

  return baseColumns;
};

// Hook para obtener dimensiones de tarjetas responsive
export const useResponsiveCardDimensions = () => {
  const { width, isMobile, isTablet } = useResponsive();
  
  let cardWidth: number;
  let gap: number;

  if (isMobile) {
    gap = 16;
    cardWidth = width - (gap * 2);
  } else if (isTablet) {
    gap = 20;
    cardWidth = (width - (gap * 3)) / 2;
  } else {
    gap = 24;
    cardWidth = (width - (gap * 4)) / 3;
  }

  return {
    cardWidth,
    gap,
    minHeight: isMobile ? 120 : 140,
  };
};

export default useResponsive;