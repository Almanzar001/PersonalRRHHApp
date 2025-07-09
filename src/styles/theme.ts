import { StyleSheet } from 'react-native';

// Colores del sistema de diseño
export const colors = {
  // Colores principales
  primary: '#007BFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0056CC',
  
  // Colores de fondo
  background: '#F7F9FC',
  backgroundSecondary: '#F3F4F6',
  white: '#FFFFFF',
  
  // Colores de texto
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  text: '#1A1A1A', // Alias para textPrimary
  
  // Colores de estado
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
  
  // Colores de botones
  buttonSecondary: '#F3F4F6',
  
  // Colores de bordes
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

// Tipografía
export const typography = {
  // Tamaños de fuente fijos
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  subtitle: 18,
  body: 16,
  bodySm: 14,
  caption: 12,
  
  // Pesos de fuente
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// Espaciado responsive
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

// Breakpoints para responsive
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  large: 1280,
  xl: 1600,
};

// Función para obtener dimensiones responsive
export const getResponsiveSpacing = (size: number, isMobile: boolean = false, isTablet: boolean = false) => {
  if (isMobile) return size * 0.75;
  if (isTablet) return size * 0.9;
  return size;
};

// Función para obtener tamaño de fuente responsive
export const getResponsiveFontSize = (size: number, isMobile: boolean = false, isTablet: boolean = false) => {
  if (isMobile) return size * 0.9;
  if (isTablet) return size * 0.95;
  return size;
};

// Bordes
export const borders = {
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },
  width: {
    thin: 1,
    medium: 2,
    thick: 3,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Sombras
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
};

// Estilos base comunes
export const baseStyles = StyleSheet.create({
  // Contenedores
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borders.radius.xl,
    padding: spacing.lg,
    ...shadows.card,
  },
  
  // Textos
  h1: {
    fontSize: typography.h1,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  h2: {
    fontSize: typography.h2,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  h3: {
    fontSize: typography.h3,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.subtitle,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  body: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.regular,
    color: colors.textPrimary,
  },
  bodySm: {
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.regular,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: typography.caption,
    fontWeight: typography.fontWeights.regular,
    color: colors.textMuted,
  },
  
  // Botones
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borders.radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  buttonSecondary: {
    backgroundColor: colors.buttonSecondary,
    borderRadius: borders.radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  buttonText: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
    color: colors.white,
  },
  buttonTextSecondary: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  
  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Espaciado
  mb1: { marginBottom: spacing.xs },
  mb2: { marginBottom: spacing.sm },
  mb3: { marginBottom: spacing.md },
  mb4: { marginBottom: spacing.lg },
  
  mt1: { marginTop: spacing.xs },
  mt2: { marginTop: spacing.sm },
  mt3: { marginTop: spacing.md },
  mt4: { marginTop: spacing.lg },
  
  p1: { padding: spacing.xs },
  p2: { padding: spacing.sm },
  p3: { padding: spacing.md },
  p4: { padding: spacing.lg },
});
