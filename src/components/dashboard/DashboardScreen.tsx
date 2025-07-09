import React from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useRouter } from 'expo-router';
import AppLayout from "../layout/AppLayout";
import MetricCard from "./MetricCard";
import DocumentsWidget from "./DocumentsWidgetLocal";
import RemindersWidget from "./RemindersWidget";
import ProjectList from "./ProjectList";
import { colors, spacing } from "../../styles/theme";
import { useStatistics } from "../../hooks/useStatistics";

const DashboardScreen = () => {
  const router = useRouter();
  const statistics = useStatistics();

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Primera fila de métricas */}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Personal"
            value={statistics.totalPersonal}
            onPress={() => handleMetricPress('personal')}
          />
          <MetricCard
            title="Miembros ERD"
            value={statistics.miembrosERD}
            onPress={() => handleMetricPress('personal')}
          />
          <MetricCard
            title="Miembros ARD"
            value={statistics.miembrosARD}
            onPress={() => handleMetricPress('personal')}
          />
          <MetricCard
            title="Miembros FARD"
            value={statistics.miembrosFARD}
            onPress={() => handleMetricPress('personal')}
          />
        </View>

        {/* Segunda fila de métricas */}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Miembros PN"
            value={statistics.miembrosPN}
            onPress={() => handleMetricPress('personal')}
          />
          <MetricCard
            title="Miembros MIDE"
            value={statistics.miembrosMIDE}
            onPress={() => handleMetricPress('personal')}
          />
          <View style={styles.emptyCard} />
          <View style={styles.emptyCard} />
        </View>
        
        {/* Widgets */}
        <View style={styles.contentRow}>
          <DocumentsWidget />
          <RemindersWidget />
          <ProjectList />
        </View>

      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  contentRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xxxl,
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
  emptyCard: {
    flex: 1,
    minWidth: 0,
  },
});

export default DashboardScreen;