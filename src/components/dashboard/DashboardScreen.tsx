import React from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useRouter } from 'expo-router';
import AppLayout from "../layout/AppLayout";
import MetricCard from "./MetricCard";
import DocumentsWidget from "./DocumentsWidgetLocal";
import RemindersWidget from "./RemindersWidget";
import ProjectList from "./ProjectList";
import { colors, spacing, getResponsiveSpacing } from "../../styles/theme";
import { useStatistics } from "../../hooks/useStatistics";
import { useResponsive, useResponsiveColumns } from "../../hooks/useResponsive";

const DashboardScreen = () => {
  const router = useRouter();
  const statistics = useStatistics();
  const { isMobile, isTablet, width } = useResponsive();
  const metricsColumns = useResponsiveColumns(3);

  const handleMetricPress = (metric: string) => {
    switch (metric) {
      case 'personal':
        router.push('/personal');
        break;
      case 'mandatarios':
        router.push('/mandatarios');
        break;
      case 'reportes':
        router.push('/reportes');
        break;
      default:
        console.log(`Pressed ${metric}`);
    }
  };

  const getResponsiveStyles = () => {
    return {
      scrollView: {
        flex: 1,
        padding: getResponsiveSpacing(spacing.xl, isMobile, isTablet),
      },
      metricsGrid: {
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: getResponsiveSpacing(spacing.lg, isMobile, isTablet),
        marginBottom: getResponsiveSpacing(spacing.xxxl, isMobile, isTablet),
      },
      widgetsGrid: {
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: getResponsiveSpacing(spacing.lg, isMobile, isTablet),
        marginBottom: getResponsiveSpacing(spacing.xxxl, isMobile, isTablet),
      },
    };
  };

  const responsiveStyles = getResponsiveStyles();

  if (statistics.loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </AppLayout>
    );
  }

  if (statistics.error) {
    return (
      <AppLayout>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {statistics.error}</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={responsiveStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Grid de métricas responsive */}
        <View style={responsiveStyles.metricsGrid}>
          <MetricCard
            title="Total Personal"
            value={statistics.totalPersonal}
            onPress={() => handleMetricPress('personal')}
            style={isMobile ? styles.mobileCard : styles.desktopCard}
            icon="people"
          />
          <MetricCard
            title="Miembros ERD"
            value={statistics.miembrosERD}
            onPress={() => handleMetricPress('personal')}
            style={isMobile ? styles.mobileCard : styles.desktopCard}
            icon="shield"
          />
          <MetricCard
            title="Miembros ARD"
            value={statistics.miembrosARD}
            onPress={() => handleMetricPress('personal')}
            style={isMobile ? styles.mobileCard : styles.desktopCard}
            icon="boat"
          />
          <MetricCard
            title="Miembros FARD"
            value={statistics.miembrosFARD}
            onPress={() => handleMetricPress('personal')}
            style={isMobile ? styles.mobileCard : styles.desktopCard}
            icon="airplane"
          />
          <MetricCard
            title="Miembros PN"
            value={statistics.miembrosPN}
            onPress={() => handleMetricPress('personal')}
            style={isMobile ? styles.mobileCard : styles.desktopCard}
            icon="car"
          />
          <MetricCard
            title="Miembros MIDE"
            value={statistics.miembrosMIDE}
            onPress={() => handleMetricPress('personal')}
            style={isMobile ? styles.mobileCard : styles.desktopCard}
            icon="business"
          />
        </View>
        {/* Grid de widgets responsive */}
        <View style={responsiveStyles.widgetsGrid}>
          <DocumentsWidget />
          <RemindersWidget />
          <ProjectList />
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  mobileCard: {
    width: '100%',
    minHeight: 120,
    marginBottom: spacing.sm,
  },
  desktopCard: {
    flex: 1,
    minWidth: 250,
    maxWidth: 350,
    minHeight: 140,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});

export default DashboardScreen;