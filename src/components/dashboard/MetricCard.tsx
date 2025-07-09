import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ViewStyle } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { baseStyles, colors, spacing, typography, shadows, getResponsiveFontSize } from "../../styles/theme";
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from "../../hooks/useResponsive";

interface MetricCardProps {
  title: string;
  value: string | number;
  onPress?: () => void;
  style?: ViewStyle;
  icon?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, onPress, style, icon }) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  const { isMobile, isTablet } = useResponsive();

  const getGradientColors = (cardTitle: string) => {
    switch (cardTitle) {
      case 'Miembros ERD':
        return ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)'];
      case 'Miembros ARD':
        return ['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)'];
      case 'Miembros FARD':
        return ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)'];
      case 'Miembros PN':
        return ['rgba(107, 114, 128, 0.3)', 'rgba(107, 114, 128, 0.15)', 'rgba(107, 114, 128, 0.05)'];
      default:
        return ['rgba(107, 114, 128, 0.3)', 'rgba(107, 114, 128, 0.15)', 'rgba(107, 114, 128, 0.05)'];
    }
  };

  const getIconColor = (cardTitle: string) => {
    switch (cardTitle) {
      case 'Miembros ERD':
        return '#22c55e';
      case 'Miembros ARD':
        return '#fbbf24';
      case 'Miembros FARD':
        return '#3b82f6';
      case 'Miembros PN':
        return '#6b7280';
      case 'Miembros MIDE':
        return '#8b5cf6';
      default:
        return colors.primary;
    }
  };

  const getDefaultIcon = (cardTitle: string) => {
    switch (cardTitle) {
      case 'Total Personal':
        return 'people';
      case 'Miembros ERD':
        return 'shield';
      case 'Miembros ARD':
        return 'boat';
      case 'Miembros FARD':
        return 'airplane';
      case 'Miembros PN':
        return 'car';
      case 'Miembros MIDE':
        return 'business';
      default:
        return 'person';
    }
  };

  const getResponsiveTextStyles = () => {
    return {
      value: {
        fontSize: getResponsiveFontSize(typography.h3, isMobile, isTablet),
        color: colors.primary,
        fontWeight: typography.fontWeights.bold,
        marginBottom: spacing.sm,
        textAlign: 'center' as const,
      },
      title: {
        fontSize: getResponsiveFontSize(typography.bodySm, isMobile, isTablet),
        color: colors.textSecondary,
        fontWeight: typography.fontWeights.medium,
        textAlign: 'center' as const,
      },
    };
  };

  const responsiveTextStyles = getResponsiveTextStyles();

  return (
    <CardComponent
      style={[baseStyles.card, styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.95 : 1}
    >
      <LinearGradient
        colors={getGradientColors(title)}
        locations={[0, 0.5, 1]}
        style={styles.gradientHeader}
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={icon || getDefaultIcon(title)} 
            size={isMobile ? 20 : 24} 
            color={getIconColor(title)} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={responsiveTextStyles.value}>
            {value}
          </Text>
          <Text style={responsiveTextStyles.title}>
            {title}
          </Text>
        </View>
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '18%',
    minHeight: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MetricCard;