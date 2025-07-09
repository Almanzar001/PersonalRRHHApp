import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import LoginScreen from './LoginScreen';
import { colors, spacing, typography } from '../../styles/theme';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  // Mostrar loading mientras verifica la sesión
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Verificando autenticación...</Text>
      </View>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Si requiere admin pero el usuario no es admin
  if (requireAdmin && !isAdmin) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedTitle}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedText}>
          Esta función requiere permisos de administrador.
        </Text>
        <Text style={styles.userInfo}>
          Usuario actual: {user?.first_name} {user?.last_name}
        </Text>
        <Text style={styles.userRole}>
          Rol: {user?.role_name}
        </Text>
      </View>
    );
  }

  // Usuario autenticado y con permisos correctos
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  accessDeniedTitle: {
    fontSize: typography.h2,
    fontWeight: typography.fontWeights.bold,
    color: colors.error,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  userInfo: {
    fontSize: typography.bodySm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
});

export default ProtectedRoute;