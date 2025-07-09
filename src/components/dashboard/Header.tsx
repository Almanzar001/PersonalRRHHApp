import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import UserProfileModal from '../users/UserProfileModal';
import { colors, spacing, typography, borders, shadows } from "../../styles/theme";

interface HeaderProps {
  onMenuPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuPress }) => {
  const { user, logout, isAdmin } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;

  const handleNotifications = () => {
    Alert.alert('Notificaciones', 'Tienes 3 notificaciones nuevas');
  };

  const handleMessages = () => {
    Alert.alert('Mensajes', 'Tienes 2 mensajes sin leer');
  };

  const handleUserProfile = () => {
    Alert.alert(
      'Opciones de Usuario',
      `${user?.first_name} ${user?.last_name}\nRol: ${user?.role_name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Mi Perfil', 
          onPress: () => setShowProfileModal(true)
        },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: handleLogout 
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Botón de menú para móviles */}
      {isMobile && onMenuPress && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
      
      {/* Espaciador para centrar acciones cuando no hay botón de menú */}
      {!isMobile && <View style={styles.spacer} />}
      
      {/* Acciones */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleMessages}
        >
          <Ionicons name="mail-outline" size={24} color={colors.textMuted} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleNotifications}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textMuted} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.userButton}
          activeOpacity={0.9}
          onPress={handleUserProfile}
        >
          <View style={styles.avatarContainer}>
            <Ionicons 
              name={isAdmin ? "shield-checkmark" : "person"} 
              size={24} 
              color={isAdmin ? colors.success : colors.primary} 
            />
          </View>
          <View>
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={[styles.userRole, isAdmin && styles.adminRole]}>
              {user?.role_name === 'admin' ? 'Administrador' : user?.role_name}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={styles.chevron} />
        </TouchableOpacity>
      </View>

      {/* User Profile Modal */}
      <UserProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: borders.radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  spacer: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: borders.radius.md,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borders.radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginLeft: spacing.sm,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: typography.subtitle,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  userRole: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
  },
  adminRole: {
    color: colors.success,
    fontWeight: typography.fontWeights.medium,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
});

export default Header;