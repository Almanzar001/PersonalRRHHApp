import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AppLayout from '../../src/components/layout/AppLayout';
import { baseStyles, colors, spacing, typography, borders, shadows, getResponsiveSpacing } from '../../src/styles/theme';
import { supabase } from '../../src/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { useResponsive } from '../../src/hooks/useResponsive';

interface PersonalData {
  id: string;
  nombres: string;
  apellidos: string;
  Apellidos: string;
  cedula: string;
  rango: string;
  institucion: string;
  genero: string;
  nacionalidad: string;
  telefono: string;
}

interface MetricCardData {
  title: string;
  value: number;
  color: string;
  gradientColors: string[];
  icon: string;
}

const institutions = [
  { label: 'Todas las instituciones', value: 'all' },
  { label: 'ERD', value: 'ERD' },
  { label: 'ARD', value: 'ARD' },
  { label: 'FARD', value: 'FARD' },
  { label: 'PN', value: 'PN' },
  { label: 'MIDE', value: 'MIDE' },
];

const rankCategories = [
  { label: 'Todas las categorías', value: 'all' },
  { label: 'Oficiales Generales', value: 'Oficiales Generales' },
  { label: 'Oficiales Superiores', value: 'Oficiales Superiores' },
  { label: 'Oficiales Subalternos', value: 'Oficiales Subalternos' },
  { label: 'Alistados', value: 'Alistados' },
  { label: 'Asimilados', value: 'Asimilados' },
  { label: 'Civiles', value: 'Civiles' },
];

const genderCategories = [
  { label: 'Todos los géneros', value: 'all' },
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
];

export default function AnalyticsScreen() {
  const { isMobile, isTablet, isDesktop, isLarge } = useResponsive();
  const [personalData, setPersonalData] = useState<PersonalData[]>([]);
  const [filteredData, setFilteredData] = useState<PersonalData[]>([]);
  const [metrics, setMetrics] = useState<MetricCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState('all');
  const [selectedRankCategory, setSelectedRankCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');

  useEffect(() => {
    loadPersonalData();
  }, []);

  useEffect(() => {
    filterData();
  }, [personalData, selectedInstitution, selectedRankCategory, selectedGender]);

  const loadPersonalData = async () => {
    try {
      const { data, error } = await supabase
        .from('personal')
        .select('*')
        .order('nombres', { ascending: true });

      if (error) {
        console.error('Error loading personal data:', error);
        return;
      }

      setPersonalData(data || []);
    } catch (error) {
      console.error('Error loading personal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankCategory = (rango: string): string => {
    const rankHierarchy = {
      'Oficiales Generales': ['Mayor General', 'General de Brigada'],
      'Oficiales Superiores': ['Coronel', 'Capitán de Navio', 'Teniente Coronel', 'Capitán de Fragata', 'Mayor', 'Capitán de Corbeta'],
      'Oficiales Subalternos': ['Capitán', 'Teniente de Navio', '1er. Teniente', 'Tte. de Fragata', '2do.Teniente', 'Tte. de Corbeta'],
      'Alistados': ['Sargento Mayor', 'Sargento', 'Cabo', 'Raso', 'Marinero'],
      'Asimilados': ['Asimilado Militar', 'Asimilado'],
      'Civiles': ['Civil']
    };

    for (const [category, ranks] of Object.entries(rankHierarchy)) {
      if (ranks.includes(rango)) {
        return category;
      }
    }
    return 'Otros';
  };

  const getRankOrder = (rango: string, institucion: string): number => {
    // Definir equivalencias de rangos por nivel jerárquico
    const rankLevels = {
      // Oficiales Generales
      'Mayor General': 100,
      'General de Brigada': 200,
      
      // Oficiales Superiores - Nivel Coronel
      'Coronel': 300,
      'Capitán de Navio': 301, // Equivalente a Coronel pero va después
      
      // Oficiales Superiores - Nivel Teniente Coronel  
      'Teniente Coronel': 400,
      'Capitán de Fragata': 401, // Equivalente a Teniente Coronel pero va después
      
      // Oficiales Superiores - Nivel Mayor
      'Mayor': 500,
      'Capitán de Corbeta': 501, // Equivalente a Mayor pero va después
      
      // Oficiales Subalternos
      'Capitán': 600,
      'Teniente de Navio': 601,
      '1er. Teniente': 700,
      'Tte. de Fragata': 701,
      '2do.Teniente': 800,
      'Tte. de Corbeta': 801,
      
      // Alistados
      'Sargento Mayor': 900,
      'Sargento': 1000,
      'Cabo': 1100,
      'Raso': 1200,
      'Marinero': 1201,
      
      // Asimilados
      'Asimilado Militar': 1300,
      'Asimilado': 1400,
      
      // Civiles
      'Civil': 1500
    };
    
    const baseOrder = rankLevels[rango] || 9999;
    
    // Si no encontramos el rango, ponerlo al final
    if (baseOrder === 9999) {
      return 9999;
    }
    
    return baseOrder;
  };

  const filterData = () => {
    let filtered = [...personalData];

    // Filter by institution
    if (selectedInstitution !== 'all') {
      filtered = filtered.filter(person => person.institucion === selectedInstitution);
    }

    // Filter by rank category
    if (selectedRankCategory !== 'all') {
      filtered = filtered.filter(person => getRankCategory(person.rango) === selectedRankCategory);
    }

    // Filter by gender
    if (selectedGender !== 'all') {
      filtered = filtered.filter(person => person.genero === selectedGender);
    }

    // Sort by rank order
    filtered.sort((a, b) => {
      const orderA = getRankOrder(a.rango, a.institucion);
      const orderB = getRankOrder(b.rango, b.institucion);
      
      // Debug: imprimir valores para verificar
      if (a.rango?.includes('Capitán') || b.rango?.includes('Capitán')) {
        console.log(`Comparando: ${a.rango} (${orderA}) vs ${b.rango} (${orderB})`);
      }
      
      return orderA - orderB;
    });

    setFilteredData(filtered);
    calculateMetrics(filtered);
  };

  const clearAllFilters = () => {
    setSelectedInstitution('all');
    setSelectedRankCategory('all');
    setSelectedGender('all');
  };

  const getCardWidth = () => {
    if (isMobile) return '100%';
    if (isTablet) return '48%';
    if (isDesktop) return '31%';
    if (isLarge) return '23%';
    return '18%'; // Para pantallas muy grandes
  };

  const exportFilteredData = async () => {
    try {
      if (!filteredData || filteredData.length === 0) {
        alert('No hay datos para exportar.');
        return;
      }

      const exportData = filteredData.map(person => ({
        Rango: person.rango || '',
        Apellidos: person.Apellidos || person.apellidos || '',
        Nombres: person.nombres || '',
        Institución: person.institucion || '',
        Cédula: person.cedula || '',
        Género: person.genero || '',
        Teléfono: person.telefono || '',
        Nacionalidad: person.nacionalidad || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Personal_Filtrado");
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      
      // Create filename with current filters
      let filename = "Personal_Filtrado";
      if (selectedInstitution !== 'all') filename += `_${selectedInstitution}`;
      if (selectedRankCategory !== 'all') filename += `_${selectedRankCategory.replace(/\s+/g, '_')}`;
      if (selectedGender !== 'all') filename += `_${selectedGender}`;
      filename += ".xlsx";
      
      FileSaver.saveAs(data, filename);
      alert(`Datos exportados exitosamente! (${filteredData.length} registros)`);

    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos.');
    }
  };

  const calculateMetrics = (data: PersonalData[]) => {
    // Total personal
    const totalCount = data.length;
    
    // Institution metrics
    const erdCount = data.filter(p => p.institucion === 'ERD').length;
    const ardCount = data.filter(p => p.institucion === 'ARD').length;
    const fardCount = data.filter(p => p.institucion === 'FARD').length;
    const pnCount = data.filter(p => p.institucion === 'PN').length;
    const mideCount = data.filter(p => p.institucion === 'MIDE').length;

    // Gender metrics
    const masculinoCount = data.filter(p => p.genero === 'Masculino').length;
    const femeninoCount = data.filter(p => p.genero === 'Femenino').length;

    // Rank category metrics
    const oficialGeneralCount = data.filter(p => getRankCategory(p.rango) === 'Oficiales Generales').length;
    const oficialSuperiorCount = data.filter(p => getRankCategory(p.rango) === 'Oficiales Superiores').length;
    const oficialSubalternoCount = data.filter(p => getRankCategory(p.rango) === 'Oficiales Subalternos').length;
    const alistadosCount = data.filter(p => getRankCategory(p.rango) === 'Alistados').length;
    const asimiladosCount = data.filter(p => getRankCategory(p.rango) === 'Asimilados').length;
    const civilesCount = data.filter(p => getRankCategory(p.rango) === 'Civiles').length;

    const metricsData: MetricCardData[] = [
      // Total personal
      {
        title: 'Total Personal',
        value: totalCount,
        color: '#7c3aed',
        gradientColors: ['rgba(124, 58, 237, 0.3)', 'rgba(124, 58, 237, 0.15)', 'rgba(124, 58, 237, 0.05)'],
        icon: 'people'
      },
      // Institution metrics
      {
        title: 'Miembros ERD',
        value: erdCount,
        color: '#22c55e',
        gradientColors: ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)'],
        icon: 'shield'
      },
      {
        title: 'Miembros ARD',
        value: ardCount,
        color: '#fbbf24',
        gradientColors: ['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.15)', 'rgba(251, 191, 36, 0.05)'],
        icon: 'boat'
      },
      {
        title: 'Miembros FARD',
        value: fardCount,
        color: '#3b82f6',
        gradientColors: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)'],
        icon: 'airplane'
      },
      {
        title: 'Miembros PN',
        value: pnCount,
        color: '#6b7280',
        gradientColors: ['rgba(107, 114, 128, 0.3)', 'rgba(107, 114, 128, 0.15)', 'rgba(107, 114, 128, 0.05)'],
        icon: 'car'
      },
      {
        title: 'Miembros MIDE',
        value: mideCount,
        color: '#8b5cf6',
        gradientColors: ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)'],
        icon: 'business'
      },
      // Gender metrics
      {
        title: 'Hombres',
        value: masculinoCount,
        color: '#3b82f6',
        gradientColors: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)'],
        icon: 'man'
      },
      {
        title: 'Mujeres',
        value: femeninoCount,
        color: '#ec4899',
        gradientColors: ['rgba(236, 72, 153, 0.3)', 'rgba(236, 72, 153, 0.15)', 'rgba(236, 72, 153, 0.05)'],
        icon: 'woman'
      },
      // Rank category metrics
      {
        title: 'Oficiales Generales',
        value: oficialGeneralCount,
        color: '#dc2626',
        gradientColors: ['rgba(220, 38, 38, 0.3)', 'rgba(220, 38, 38, 0.15)', 'rgba(220, 38, 38, 0.05)'],
        icon: 'star'
      },
      {
        title: 'Oficiales Superiores',
        value: oficialSuperiorCount,
        color: '#ea580c',
        gradientColors: ['rgba(234, 88, 12, 0.3)', 'rgba(234, 88, 12, 0.15)', 'rgba(234, 88, 12, 0.05)'],
        icon: 'medal'
      },
      {
        title: 'Oficiales Subalternos',
        value: oficialSubalternoCount,
        color: '#ca8a04',
        gradientColors: ['rgba(202, 138, 4, 0.3)', 'rgba(202, 138, 4, 0.15)', 'rgba(202, 138, 4, 0.05)'],
        icon: 'ribbon'
      },
      {
        title: 'Alistados',
        value: alistadosCount,
        color: '#16a34a',
        gradientColors: ['rgba(22, 163, 74, 0.3)', 'rgba(22, 163, 74, 0.15)', 'rgba(22, 163, 74, 0.05)'],
        icon: 'person'
      },
      {
        title: 'Asimilados',
        value: asimiladosCount,
        color: '#0891b2',
        gradientColors: ['rgba(8, 145, 178, 0.3)', 'rgba(8, 145, 178, 0.15)', 'rgba(8, 145, 178, 0.05)'],
        icon: 'person-add'
      },
      {
        title: 'Civiles',
        value: civilesCount,
        color: '#6366f1',
        gradientColors: ['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0.15)', 'rgba(99, 102, 241, 0.05)'],
        icon: 'people-circle'
      }
    ];

    setMetrics(metricsData);
  };

  const MetricCard = ({ title, value, gradientColors, icon, color }: MetricCardData) => (
    <View style={[baseStyles.card, styles.metricCard]}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        style={styles.gradientHeader}
      />
      <View style={styles.cardContent}>
        <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <View style={styles.cardTextContent}>
          <Text style={styles.cardValue}>{value}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const renderTableRow = (person: PersonalData, index: number) => (
    <View key={person.id} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
      <View style={styles.rangoColumn}>
        <Text style={styles.tableText}>{person.rango || 'N/A'}</Text>
      </View>
      <View style={styles.apellidosColumn}>
        <Text style={styles.tableText}>{person.Apellidos || person.apellidos || 'N/A'}</Text>
      </View>
      <View style={styles.nombresColumn}>
        <Text style={styles.tableText}>{person.nombres}</Text>
      </View>
      <View style={styles.institucionColumn}>
        <Text style={styles.tableText}>{person.institucion || 'N/A'}</Text>
      </View>
      <View style={styles.cedulaColumn}>
        <Text style={styles.tableText}>{person.cedula}</Text>
      </View>
      <View style={styles.generoColumn}>
        <Text style={styles.tableText}>{person.genero || 'N/A'}</Text>
      </View>
      <View style={styles.telefonoColumn}>
        <Text style={styles.tableText}>{person.telefono || 'N/A'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={baseStyles.h2}>Análisis de Personal</Text>
            <Text style={styles.subtitle}>
              Métricas y análisis detallado del personal por institución
            </Text>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Institución:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedInstitution}
                  onValueChange={(value) => setSelectedInstitution(value)}
                  style={styles.picker}
                >
                  {institutions.map((institution) => (
                    <Picker.Item 
                      key={institution.value} 
                      label={institution.label} 
                      value={institution.value} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Categoría de Rango:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedRankCategory}
                  onValueChange={(value) => setSelectedRankCategory(value)}
                  style={styles.picker}
                >
                  {rankCategories.map((category) => (
                    <Picker.Item 
                      key={category.value} 
                      label={category.label} 
                      value={category.value} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Género:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedGender}
                  onValueChange={(value) => setSelectedGender(value)}
                  style={styles.picker}
                >
                  {genderCategories.map((gender) => (
                    <Picker.Item 
                      key={gender.value} 
                      label={gender.label} 
                      value={gender.value} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearAllFilters}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.clearFiltersText}>Limpiar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Metrics Cards */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricsGrid}>
              {metrics.map((metric, idx) => (
                <View key={idx} style={[baseStyles.card, styles.metricCard, { width: getCardWidth() }]}>
                  <LinearGradient
                    colors={metric.gradientColors}
                    locations={[0, 0.5, 1]}
                    style={styles.gradientHeader}
                  />
                  <View style={styles.cardContent}>
                    <View style={[styles.cardIcon, { backgroundColor: metric.color + '20' }]}>
                      <Ionicons name={metric.icon} size={14} color={metric.color} />
                    </View>
                    <View style={styles.cardTextContent}>
                      <Text style={styles.cardValue}>{metric.value}</Text>
                      <Text style={styles.cardTitle} numberOfLines={2}>{metric.title}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Personal Table */}
          <View style={[baseStyles.card, styles.tableContainer]}>
            <View style={styles.tableHeader}>
              <View style={styles.tableHeaderLeft}>
                <Text style={styles.tableTitle}>Personal Detallado</Text>
                <Text style={styles.tableSubtitle}>
                  {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={exportFilteredData}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={16} color={colors.white} />
                <Text style={styles.exportButtonText}>Exportar Excel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableDataHeader}>
                <Text style={[styles.tableHeaderText, styles.rangoColumn]}>Rango</Text>
                <Text style={[styles.tableHeaderText, styles.apellidosColumn]}>Apellidos</Text>
                <Text style={[styles.tableHeaderText, styles.nombresColumn]}>Nombres</Text>
                <Text style={[styles.tableHeaderText, styles.institucionColumn]}>Institución</Text>
                <Text style={[styles.tableHeaderText, styles.cedulaColumn]}>Cédula</Text>
                <Text style={[styles.tableHeaderText, styles.generoColumn]}>Género</Text>
                <Text style={[styles.tableHeaderText, styles.telefonoColumn]}>Teléfono</Text>
              </View>

              {/* Table Body */}
              <ScrollView style={styles.tableBody} nestedScrollEnabled={true}>
                {filteredData.map((person, index) => renderTableRow(person, index))}
              </ScrollView>
            </View>
          </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: getResponsiveSpacing(spacing.xl, false, false),
  },
  headerSection: {
    marginBottom: getResponsiveSpacing(spacing.xl, false, false),
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: getResponsiveSpacing(spacing.md, false, false),
    marginBottom: getResponsiveSpacing(spacing.xl, false, false),
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  filterGroup: {
    flex: 1,
    minWidth: 150,
  },
  filterLabel: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderRadius: borders.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: {
    height: 50,
  },
  metricsContainer: {
    marginBottom: getResponsiveSpacing(spacing.xxxl, false, false),
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing(spacing.lg, false, false),
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  metricCard: {
    marginBottom: getResponsiveSpacing(spacing.lg, false, false),
    position: 'relative',
    overflow: 'hidden',
    minWidth: 180,
    height: 120,
  },
  gradientHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '18%',
    minHeight: 8,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  cardIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  cardTextContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
    marginBottom: 2,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    lineHeight: 12,
    textAlign: 'center',
  },
  tableContainer: {
    padding: spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tableHeaderLeft: {
    flex: 1,
  },
  tableDataHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tableTitle: {
    fontSize: typography.h4,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  tableSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  table: {
    borderRadius: borders.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
    minHeight: 40,
  },
  evenRow: {
    backgroundColor: colors.white,
  },
  oddRow: {
    backgroundColor: colors.background,
  },
  tableText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  rangoColumn: {
    flex: 1.5,
    paddingRight: spacing.sm,
  },
  apellidosColumn: {
    flex: 1.5,
    paddingRight: spacing.sm,
  },
  nombresColumn: {
    flex: 1.5,
    paddingRight: spacing.sm,
  },
  institucionColumn: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  cedulaColumn: {
    flex: 1.2,
    paddingRight: spacing.sm,
  },
  generoColumn: {
    flex: 0.8,
    paddingRight: spacing.sm,
  },
  telefonoColumn: {
    flex: 1.2,
    paddingRight: spacing.sm,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borders.radius.md,
    height: 50,
    gap: spacing.xs,
  },
  clearFiltersText: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borders.radius.md,
    gap: spacing.xs,
  },
  exportButtonText: {
    fontSize: typography.bodySm,
    color: colors.white,
    fontWeight: typography.fontWeights.medium,
  },
});