import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { baseStyles, colors, spacing, typography, shadows } from "../../styles/theme";
import { LinearGradient } from 'expo-linear-gradient';

interface MetricCardProps {
  title: string;
  value: string | number;
  onPress?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, onPress }) => {
  const CardComponent = onPress ? TouchableOpacity : View;

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

  return (
    <CardComponent
      style={[baseStyles.card, styles.container]}
      onPress={onPress}
      activeOpacity={onPress ? 0.95 : 1}
    >
      <LinearGradient
        colors={getGradientColors(title)}
        locations={[0, 0.5, 1]}
        style={styles.gradientHeader}
      />
      <View style={styles.content}>
        <Text style={styles.value}>
          {value}
        </Text>
        <Text style={styles.title}>
          {title}
        </Text>
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  value: {
    fontSize: typography.h3,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
  },
});

export default MetricCard;