import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { baseStyles, colors, spacing, typography, borders } from "../../styles/theme";

const AnalyticsChart = () => (
  <View style={[baseStyles.card, styles.container]}>
    <Text style={styles.title}>
      Actividad Semanal
    </Text>

    <View style={styles.chartContainer}>
      <View style={[styles.bar, { height: 32, backgroundColor: colors.primary + '33' }]} />
      <View style={[styles.bar, { height: 48, backgroundColor: colors.primary + '66' }]} />
      <View style={[styles.bar, { height: 80, backgroundColor: colors.primary }]} />
      <View style={[styles.bar, { height: 64, backgroundColor: colors.primary + '99' }]} />
      <View style={[styles.bar, { height: 40, backgroundColor: colors.primary + '4D' }]} />
      <View style={[styles.bar, { height: 56, backgroundColor: colors.primary + '80' }]} />
      <View style={[styles.bar, { height: 48, backgroundColor: colors.primary + '66' }]} />
    </View>

    <View style={styles.labelsContainer}>
      {['L','M','M','J','V','S','D'].map((d, i) => (
        <Text key={i} style={styles.label}>
          {d}
        </Text>
      ))}
    </View>

    <View style={styles.statsContainer}>
      <Text style={styles.statsLabel}>
        Asignaciones esta semana
      </Text>
      <Text style={styles.statsValue}>
        +23%
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 200,
  },
  title: {
    fontSize: typography.subtitle,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    fontWeight: typography.fontWeights.medium,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: 96,
    marginBottom: spacing.md,
  },
  bar: {
    width: 24,
    borderTopLeftRadius: borders.radius.sm,
    borderTopRightRadius: borders.radius.sm,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  statsContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: borders.width.thin,
    borderTopColor: colors.border,
  },
  statsLabel: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
  },
  statsValue: {
    fontSize: typography.h4,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
});

export default AnalyticsChart;