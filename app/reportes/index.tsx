import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../../src/components/layout/AppLayout';
import { baseStyles, colors, spacing, typography, borders, shadows } from '../../src/styles/theme';
import { useStatistics } from '../../src/hooks/useStatistics';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { supabase } from '../../src/lib/supabase';

const reportTypes = [
  {
    title: 'Reporte de Personal',
    description: 'Estadísticas completas del personal activo',
    icon: 'people-outline',
    color: colors.primary,
  },
  {
    title: 'Reporte de Asignaciones',
    description: 'Resumen de asignaciones por período',
    icon: 'clipboard-outline',
    color: colors.success,
  },
  {
    title: 'Reporte de Mandatarios',
    description: 'Análisis de empresas y mandatarios',
    icon: 'business-outline',
    color: colors.warning,
  },
  {
    title: 'Reporte Financiero',
    description: 'Costos y presupuestos de RRHH',
    icon: 'card-outline',
    color: colors.info,
  },
];

export default function ReportesScreen() {
  const statistics = useStatistics();

  const handleGeneratePersonalReport = async () => {
    try {
      console.log('Iniciando consulta a Supabase...');
      console.log('Supabase URL:', supabase.supabaseUrl);
      
      // Probar conexión básica
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      console.log('Tablas disponibles:', tables);
      
      const { data: personal, error } = await supabase
        .from('personal')
        .select('*');

      console.log('Resultado de la consulta:', { personal, error });

      if (error) {
        console.error('Error fetching personal data:', error);
        alert(`Error al cargar los datos del personal: ${JSON.stringify(error)}`);
        return;
      }

      if (!personal || personal.length === 0) {
        alert('No hay datos de personal para generar el reporte.');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(personal);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Personal");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(data, "Reporte_Personal.xlsx");
      alert('Reporte de Personal generado y descargado con éxito!');

    } catch (err) {
      console.error('Error generating personal report:', err);
      alert('Error al generar el reporte de personal.');
    }
  };

  const handleGenerateAssignmentsReport = async () => {
    try {
      const { data: asignaciones, error } = await supabase
        .from('asignaciones')
        .select(`
          id, 
          personal_id, 
          mandatario_id, 
          fecha_inicio, 
          fecha_fin, 
          estado,
          personal(nombres, apellidos, cedula, rango),
          mandatarios(empresa, contacto_principal)
        `);

      if (error) {
        console.error('Error fetching assignments data:', error);
        alert('Error al cargar los datos de asignaciones.');
        return;
      }

      if (!asignaciones || asignaciones.length === 0) {
        alert('No hay datos de asignaciones para generar el reporte.');
        return;
      }

      const formattedData = asignaciones.map(asignacion => ({
        ID: asignacion.id,
        Personal: `${asignacion.personal?.nombres} ${asignacion.personal?.apellidos}`,
        Cedula: asignacion.personal?.cedula,
        Rango: asignacion.personal?.rango,
        Empresa: asignacion.mandatarios?.empresa,
        Contacto: asignacion.mandatarios?.contacto_principal,
        Fecha_Inicio: asignacion.fecha_inicio,
        Fecha_Fin: asignacion.fecha_fin,
        Estado: asignacion.estado
      }));

      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Asignaciones");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(data, "Reporte_Asignaciones.xlsx");
      alert('Reporte de Asignaciones generado y descargado con éxito!');

    } catch (err) {
      console.error('Error generating assignments report:', err);
      alert('Error al generar el reporte de asignaciones.');
    }
  };

  const handleGenerateMandatariosReport = async () => {
    try {
      const { data: mandatarios, error } = await supabase
        .from('mandatarios')
        .select('id, empresa, contacto_principal, telefono, correo, direccion, fecha_registro, estado');

      if (error) {
        console.error('Error fetching mandatarios data:', error);
        alert('Error al cargar los datos de mandatarios.');
        return;
      }

      if (!mandatarios || mandatarios.length === 0) {
        alert('No hay datos de mandatarios para generar el reporte.');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(mandatarios);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Mandatarios");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(data, "Reporte_Mandatarios.xlsx");
      alert('Reporte de Mandatarios generado y descargado con éxito!');

    } catch (err) {
      console.error('Error generating mandatarios report:', err);
      alert('Error al generar el reporte de mandatarios.');
    }
  };

  const handleGenerateFinancialReport = async () => {
    try {
      const { data: personal, error: personalError } = await supabase
        .from('personal')
        .select('id, nombres, apellidos, rango, institucion');

      const { data: asignaciones, error: asignacionesError } = await supabase
        .from('asignaciones')
        .select('id, personal_id, fecha_inicio, fecha_fin, estado');

      if (personalError || asignacionesError) {
        console.error('Error fetching financial data:', personalError || asignacionesError);
        alert('Error al cargar los datos financieros.');
        return;
      }

      const financialData = personal?.map(person => {
        const asignacionesActivas = asignaciones?.filter(a => 
          a.personal_id === person.id && a.estado === 'activa'
        ).length || 0;
        
        return {
          ID: person.id,
          Nombre: `${person.nombres} ${person.apellidos}`,
          Rango: person.rango,
          Institucion: person.institucion,
          Asignaciones_Activas: asignacionesActivas,
          Costo_Estimado: `$${(asignacionesActivas * 1000).toLocaleString()}` // Costo estimado
        };
      }) || [];

      const ws = XLSX.utils.json_to_sheet(financialData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reporte_Financiero");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      FileSaver.saveAs(data, "Reporte_Financiero.xlsx");
      alert('Reporte Financiero generado y descargado con éxito!');

    } catch (err) {
      console.error('Error generating financial report:', err);
      alert('Error al generar el reporte financiero.');
    }
  };

  const getReportHandler = (reportTitle: string) => {
    switch (reportTitle) {
      case 'Reporte de Personal':
        return handleGeneratePersonalReport;
      case 'Reporte de Asignaciones':
        return handleGenerateAssignmentsReport;
      case 'Reporte de Mandatarios':
        return handleGenerateMandatariosReport;
      case 'Reporte Financiero':
        return handleGenerateFinancialReport;
      default:
        return undefined;
    }
  };


  return (
    <AppLayout>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={baseStyles.h2}>Reportes</Text>
            <Text style={styles.subtitle}>
              Genera y descarga reportes detallados del sistema
            </Text>
          </View>

          <View style={styles.reportsGrid}>
            {reportTypes.map((report, index) => (
              <TouchableOpacity
                key={index}
                style={[baseStyles.card, styles.reportCard]}
                activeOpacity={0.8}
                onPress={getReportHandler(report.title)}
              >
                <View style={[styles.reportIcon, { backgroundColor: report.color + '1A' }]}>
                  <Ionicons name={report.icon} size={32} color={report.color} />
                </View>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDescription}>{report.description}</Text>
                <TouchableOpacity style={[baseStyles.buttonPrimary, styles.generateButton]} onPress={getReportHandler(report.title)}>
                  <Ionicons name="download-outline" size={16} color={colors.white} />
                  <Text style={[baseStyles.buttonText, styles.buttonText]}>
                    Generar
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[baseStyles.card, styles.quickStats]}>
            <Text style={styles.statsTitle}>Estadísticas Rápidas</Text>
            {statistics.loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando estadísticas...</Text>
              </View>
            ) : statistics.error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {statistics.error}</Text>
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statistics.totalPersonal}</Text>
                  <Text style={styles.statLabel}>Total Personal</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statistics.asignacionesActivas}</Text>
                  <Text style={styles.statLabel}>Asignaciones Activas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statistics.mandatariosActivos}</Text>
                  <Text style={styles.statLabel}>Mandatarios</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{statistics.eficiencia}%</Text>
                  <Text style={styles.statLabel}>Eficiencia</Text>
                </View>
              </View>
            )}
          </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: spacing.xl,
  },
  headerSection: {
    marginBottom: spacing.xxxl,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  reportCard: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.xl,
  },
  reportIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  reportTitle: {
    fontSize: typography.h4,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  reportDescription: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    marginLeft: spacing.sm,
  },
  quickStats: {
    padding: spacing.xl,
  },
  statsTitle: {
    fontSize: typography.h3,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.h2,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.body,
    color: colors.error,
    textAlign: 'center',
  },
});
