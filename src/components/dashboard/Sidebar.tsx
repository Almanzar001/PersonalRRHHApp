import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { baseStyles, colors, spacing, typography, borders, shadows } from "../../styles/theme";

const menuItems = [
  { icon: 'grid-outline', label: 'Dashboard', route: '/dashboard' },
  { icon: 'people-outline', label: 'Personal', route: '/personal' },
  { icon: 'business-outline', label: 'Mandatarios', route: '/mandatarios' },
  { icon: 'analytics-outline', label: 'Análisis', route: '/analytics' },
  { icon: 'bar-chart-outline', label: 'Reportes', route: '/reportes' },
];

const adminMenuItems = [
  { icon: 'people', label: 'Usuarios', route: '/usuarios' },
];

const generalItems = [
  { icon: 'log-out-outline', label: 'Salir' },
];

interface SidebarProps {
  isMobile?: boolean;
  isVisible?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, isVisible = true, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [sidebarWidth] = useState(new Animated.Value(isMobile ? 280 : 70));
  const [opacity] = useState(new Animated.Value(0));

  const shouldExpand = isHovered || !isCollapsed;
  const targetWidth = shouldExpand ? 240 : 70;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (isMobile) {
      Animated.parallel([
        Animated.timing(sidebarWidth, {
          toValue: isVisible ? 280 : 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: isVisible ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.timing(sidebarWidth, {
        toValue: targetWidth,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isVisible, shouldExpand, isMobile, targetWidth]);

  const handleNavigation = (route: string) => {
    router.push(route);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const isActive = (route: string) => {
    return pathname === route || pathname.startsWith(route + '/');
  };

  const handleMouseEnter = () => {
    if (!isMobile && Platform.OS === 'web') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!isVisible && !isMobile) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isVisible && (
        <Animated.View 
          style={[styles.mobileOverlay, { opacity }]}
          pointerEvents={isVisible ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            style={styles.overlayTouchable}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Sidebar Container */}
      <Animated.View 
        style={[
          styles.container,
          isMobile ? styles.mobileContainer : styles.desktopContainer,
          { width: sidebarWidth },
          isMobile && { opacity }
        ]}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <View style={styles.sidebarContent}>
          {/* Header */}
          <View style={styles.headerSection}>
            {/* Mobile Close Button */}
            {isMobile && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Logo */}
            <TouchableOpacity
              style={[styles.logoContainer, !shouldExpand && styles.logoContainerCollapsed]}
              onPress={() => handleNavigation('/dashboard')}
              activeOpacity={0.8}
            >
              <View style={styles.logo}>
                <Ionicons name="people" size={24} color={colors.white} />
              </View>
              {(shouldExpand || isMobile) && (
                <View style={styles.brandTextContainer}>
                  <Text style={styles.brandTitle}>RRHH</Text>
                  <Text style={styles.brandSubtitle}>App</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Desktop Toggle Button */}
            {!isMobile && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleSidebar}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isCollapsed ? "chevron-forward" : "chevron-back"} 
                  size={18} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Main Menu */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.menuItem,
                  isActive(item.route) && styles.menuItemActive,
                  !shouldExpand && !isMobile && styles.menuItemCollapsed
                ]}
                activeOpacity={0.8}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isActive(item.route) ? colors.primary : colors.textMuted}
                  />
                </View>
                {(shouldExpand || isMobile) && (
                  <Text style={[
                    styles.menuLabel,
                    isActive(item.route) && styles.menuLabelActive
                  ]}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Admin-only menu items */}
            {isAdmin && (
              <>
                {(shouldExpand || isMobile) && <View style={styles.menuDivider} />}
                {adminMenuItems.map((item, idx) => (
                  <TouchableOpacity
                    key={`admin-${idx}`}
                    style={[
                      styles.menuItem,
                      isActive(item.route) && styles.menuItemActive,
                      !shouldExpand && !isMobile && styles.menuItemCollapsed
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleNavigation(item.route)}
                  >
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={isActive(item.route) ? colors.primary : colors.textMuted}
                      />
                    </View>
                    {(shouldExpand || isMobile) && (
                      <Text style={[
                        styles.menuLabel,
                        isActive(item.route) && styles.menuLabelActive
                      ]}>
                        {item.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            {generalItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.generalItem,
                  !shouldExpand && !isMobile && styles.generalItemCollapsed
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.label === 'Salir') {
                    logout();
                    if (isMobile && onClose) {
                      onClose();
                    }
                  }
                }}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={20} color={colors.textMuted} />
                </View>
                {(shouldExpand || isMobile) && (
                  <Text style={styles.generalLabel}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  // Mobile Overlay
  mobileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  overlayTouchable: {
    flex: 1,
  },

  // Container
  container: {
    backgroundColor: colors.white,
    height: '100%',
    overflow: 'hidden',
    ...shadows.card,
    ...(Platform.OS === 'web' && {
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
  },
  desktopContainer: {
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  mobileContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },

  // Content
  sidebarContent: {
    flex: 1,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  // Header Section
  headerSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: borders.radius.sm,
    backgroundColor: colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  logoContainerCollapsed: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 42,
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: borders.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandTextContainer: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: typography.h4,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  toggleButton: {
    alignSelf: 'center',
    padding: spacing.sm,
    borderRadius: borders.radius.sm,
    backgroundColor: colors.background,
  },

  // Menu
  menuContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borders.radius.md,
    minHeight: 48,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.15s ease',
    }),
  },
  menuItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  menuItemActive: {
    backgroundColor: colors.primary + '15',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  menuIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  menuLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
    marginHorizontal: spacing.md,
  },

  // Footer
  footerContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  generalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borders.radius.md,
    minHeight: 44,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.15s ease',
    }),
  },
  generalItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  generalLabel: {
    fontSize: typography.body,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    marginLeft: spacing.md,
  },
});

export default Sidebar;