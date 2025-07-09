import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ScrollView, Text, TouchableOpacity, Alert, Image, Modal, TextInput, Platform } from 'react-native';
import { Appbar, Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { Personal } from '../../src/types/types';
import { Link, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../../src/components/layout/AppLayout';
import { baseStyles, colors, spacing, typography, borders, getResponsiveSpacing, getResponsiveFontSize } from '../../src/styles/theme';
import AddPersonalModal from '../../src/components/personal/AddPersonalModal';
import EditPersonalModal from '../../src/components/personal/EditPersonalModal';
import { useResponsive } from '../../src/hooks/useResponsive';

const PersonalScreen = () => {
  const router = useRouter();
  const { isMobile, isTablet, width } = useResponsive();
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [filteredPersonal, setFilteredPersonal] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPersonalId, setEditingPersonalId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Definir el orden de las instituciones
  const institucionOrder = ['ERD', 'ARD', 'FARD', 'PN', 'MIDE', 'MIREX'];

  // Definir grupos de rangos equivalentes (mismo nivel jerárquico)
  const rangoGroups = [
    ['Mayor General'],
    ['General de Brigada'],
    ['Coronel', 'Capitán de Navio'],           // Mismo nivel jerárquico
    ['Teniente Coronel', 'Capitán de Fragata'], // Mismo nivel jerárquico
    ['Mayor', 'Capitán de Corbeta'],           // Mismo nivel jerárquico
    ['Capitán'],
    ['Teniente de Navio'],
    ['1er. Teniente'],
    ['Tte. de Fragata'],
    ['2do.Teniente'],
    ['Tte. de Corbeta'],
    ['Sargento Mayor'],
    ['Sargento'],
    ['Cabo'],
    ['Raso'],
    ['Marinero'],
    ['Asimilado Militar'],
    ['Asimilado'],
    ['Civil']
  ];

  // Función para obtener el nivel jerárquico de un rango
  const getRangoLevel = (rango: string): number => {
    for (let i = 0; i < rangoGroups.length; i++) {
      if (rangoGroups[i].includes(rango)) {
        return i;
      }
    }
    return 999; // Si no se encuentra, ponerlo al final
  };

  const fetchPersonal = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('personal')
      .select('*, grupos(nombre)');

    if (error) {
      console.error('Error fetching personal:', error);
    } else {
      console.log('Personal fetched successfully:', data);

      // Ordenar los datos por nivel de rango y luego por institución
      const sortedData = (data as Personal[]).sort((a, b) => {
        // Obtener el nivel jerárquico de cada rango
        const aRangoLevel = getRangoLevel(a.rango || '');
        const bRangoLevel = getRangoLevel(b.rango || '');

        // Si los niveles de rango son diferentes, ordenar por nivel
        if (aRangoLevel !== bRangoLevel) {
          return aRangoLevel - bRangoLevel;
        }

        // Si están en el mismo nivel jerárquico, ordenar por institución
        const aInstitucionIndex = institucionOrder.indexOf(a.institucion || '');
        const bInstitucionIndex = institucionOrder.indexOf(b.institucion || '');

        // Si una institución no está en la lista, ponerla al final
        if (aInstitucionIndex === -1) return 1;
        if (bInstitucionIndex === -1) return -1;

        return aInstitucionIndex - bInstitucionIndex;
      });

      setPersonal(sortedData);
      setFilteredPersonal(sortedData);
    }
    setLoading(false);
  };

  // Función para filtrar personal basado en la búsqueda
  const filterPersonal = (query: string) => {
    if (!query || query.trim() === '') {
      setFilteredPersonal(personal);
      return;
    }

    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const searchTerm = normalizeText(query.trim());

    const filtered = personal.filter((item) => {
      const normalizedNombres = item.nombres ? normalizeText(item.nombres) : '';
      const normalizedApellidos = item.Apellidos ? normalizeText(item.Apellidos) : '';
      const normalizedRango = item.rango ? normalizeText(item.rango) : '';
      const normalizedInstitucion = item.institucion ? normalizeText(item.institucion) : '';
      const normalizedCedula = item.cedula ? normalizeText(item.cedula) : '';
      const normalizedTelefono = item.telefono ? normalizeText(item.telefono) : '';

      return (
        normalizedNombres.includes(searchTerm) ||
        normalizedApellidos.includes(searchTerm) ||
        normalizedRango.includes(searchTerm) ||
        normalizedInstitucion.includes(searchTerm) ||
        normalizedCedula.includes(searchTerm) ||
        normalizedTelefono.includes(searchTerm)
      );
    });

    setFilteredPersonal(filtered);
  };

  // Manejar cambios en el campo de búsqueda
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    filterPersonal(text);
  };

  // Sincronizar filteredPersonal cuando personal cambie
  useEffect(() => {
    if (searchQuery.trim()) {
      filterPersonal(searchQuery);
    } else {
      setFilteredPersonal(personal);
    }
  }, [personal]);

  useFocusEffect(
    useCallback(() => {
      fetchPersonal();
    }, [])
  );

  const handleDeletePersonal = async (id: string, nombre: string) => {
    const onConfirm = async () => {
      try {
        const { error } = await supabase
          .from('personal')
          .delete()
          .eq('id', id);

        if (error) {
          Alert.alert('Error', 'No se pudo eliminar el personal: ' + error.message);
        } else {
          Alert.alert('Éxito', 'Personal eliminado exitosamente');
          // Refresh the list
          fetchPersonal();
        }
      } catch (error) {
        Alert.alert('Error', 'Ocurrió un error inesperado');
        console.error('Error deleting personal:', error);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Estás seguro de que deseas eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
        onConfirm();
      }
    } else {
      Alert.alert(
        'Confirmar eliminación',
        `¿Estás seguro de que deseas eliminar a ${nombre}? Esta acción no se puede deshacer.`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: onConfirm,
          },
        ]
      );
    }
  };

  const getResponsiveStyles = () => {
    return {
      scrollView: {
        flex: 1,
        padding: getResponsiveSpacing(spacing.xl, isMobile, isTablet),
      },
      headerSection: {
        marginBottom: getResponsiveSpacing(spacing.xxxl, isMobile, isTablet),
      },
      titleRow: {
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        marginBottom: getResponsiveSpacing(spacing.lg, isMobile, isTablet),
      },
      searchContainer: {
        width: isMobile ? '100%' : isTablet ? 300 : 350,
        marginLeft: isMobile ? 0 : spacing.lg,
        marginTop: isMobile ? spacing.md : 0,
      },
      personalGrid: {
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: getResponsiveSpacing(spacing.lg, isMobile, isTablet),
        marginBottom: getResponsiveSpacing(spacing.xxxl, isMobile, isTablet),
      },
    };
  };

  const responsiveStyles = getResponsiveStyles();

  const renderPersonalCard = (item: Personal) => {
    if (isMobile) {
      return (
        <TouchableOpacity
          key={item.id}
          style={[baseStyles.card, styles.mobilePersonalCard]}
          onPress={() => router.push(`/personal/${item.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.mobileCardHeader}>
            <Image
              source={{
                uri: item.foto_url || 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png'
              }}
              style={styles.mobileAvatar}
            />
            <View style={styles.mobileHeaderInfo}>
              <Text style={styles.mobileNameText}>{item.nombres}</Text>
              <Text style={styles.mobileSecondaryText}>{item.Apellidos || 'N/A'}</Text>
              <Text style={styles.mobileSecondaryText}>{item.rango || 'N/A'}</Text>
            </View>
            <View style={styles.mobileActionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setEditingPersonalId(item.id.toString());
                  setShowEditModal(true);
                }}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeletePersonal(item.id, `${item.nombres} ${item.Apellidos || ''}`.trim());
                }}
              >
                <Ionicons name="trash" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.mobileCardBody}>
            <View style={styles.mobileInfoRow}>
              <Text style={styles.mobileLabel}>Institución:</Text>
              <Text style={styles.mobileValue}>{item.institucion || 'N/A'}</Text>
            </View>
            <View style={styles.mobileInfoRow}>
              <Text style={styles.mobileLabel}>Cédula:</Text>
              <Text style={styles.mobileValue}>{item.cedula || 'N/A'}</Text>
            </View>
            {item.telefono && (
              <View style={styles.mobileInfoRow}>
                <Text style={styles.mobileLabel}>Teléfono:</Text>
                <Text style={styles.mobileValue}>{item.telefono}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          key={item.id}
          style={[baseStyles.card, styles.desktopPersonalCard]}
          onPress={() => router.push(`/personal/${item.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.desktopCardRow}>
            <View style={styles.photoColumn}>
              <Image
                source={{
                  uri: item.foto_url || 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png'
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.rangoColumn}>
              <Text style={styles.tableText}>{item.rango || 'N/A'}</Text>
            </View>
            <View style={styles.apellidosColumn}>
              <Text style={styles.tableText}>{item.Apellidos || 'N/A'}</Text>
            </View>
            <View style={styles.nombresColumn}>
              <Text style={styles.tableText}>{item.nombres}</Text>
            </View>
            <View style={styles.institucionColumn}>
              <Text style={styles.tableText}>{item.institucion || 'N/A'}</Text>
            </View>
            <View style={styles.cedulaColumn}>
              <Text style={styles.tableText}>{item.cedula || 'N/A'}</Text>
            </View>
            <View style={styles.actionsColumn}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setEditingPersonalId(item.id.toString());
                    setShowEditModal(true);
                  }}
                >
                  <Ionicons name="pencil" size={14} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePersonal(item.id, `${item.nombres} ${item.Apellidos || ''}`.trim());
                  }}
                >
                  <Ionicons name="trash" size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando personal...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={responsiveStyles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={responsiveStyles.headerSection}>
            <View style={responsiveStyles.titleRow}>
              <View style={styles.titleContainer}>
                <Text style={baseStyles.h2}>Gestión de Personal</Text>
                <Text style={styles.subtitle}>
                  Administra el personal de la organización
                </Text>
              </View>

              <View style={responsiveStyles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por nombre, apellido, rango..."
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => handleSearchChange('')}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[baseStyles.buttonPrimary, styles.addButton]}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={[baseStyles.buttonText, styles.addButtonText]}>
                Agregar Personal
              </Text>
            </TouchableOpacity>
          </View>





          <View style={responsiveStyles.personalGrid}>
            {filteredPersonal.map(renderPersonalCard)}
          </View>
        </ScrollView>

        <AddPersonalModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPersonal();
          }}
        />

        {editingPersonalId && (
          <EditPersonalModal
            visible={showEditModal}
            personalId={editingPersonalId}
            onClose={() => {
              setShowEditModal(false);
              setEditingPersonalId(null);
            }}
            onSuccess={() => {
              setShowEditModal(false);
              setEditingPersonalId(null);
              fetchPersonal();
            }}
          />
        )}
      </AppLayout>
    );
  };


const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: spacing.xl,
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
  headerSection: {
    marginBottom: spacing.xxxl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  // Estilos de búsqueda
  searchContainer: {
    position: 'relative',
    width: 350,
    marginLeft: spacing.lg,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingRight: 50, // Espacio para el botón de limpiar
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E1E5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  addButtonText: {
    marginLeft: spacing.sm,
  },

  // Estilos de tabla
  tableContainer: {
    padding: 0,
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
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
    minHeight: 60,
  },
  evenRow: {
    backgroundColor: colors.white,
  },
  oddRow: {
    backgroundColor: colors.background,
  },
  tableText: {
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  // Columnas de la tabla
  photoColumn: {
    width: 70,
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  institucionColumn: {
    flex: 1.5,
    paddingRight: spacing.md,
  },
  cedulaColumn: {
    flex: 1.5,
    paddingRight: spacing.md,
  },
  rangoColumn: {
    flex: 1.8,
    paddingRight: spacing.md,
  },
  apellidosColumn: {
    flex: 2.0,
    paddingRight: spacing.md,
  },
  nombresColumn: {
    flex: 2.0,
    paddingRight: spacing.md,
  },
  actionsColumn: {
    width: 110,
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '1A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: borders.radius.sm,
    backgroundColor: colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: borders.radius.sm,
    backgroundColor: colors.error + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Estilos para mobile
  mobilePersonalCard: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  mobileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mobileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '1A',
    marginRight: spacing.md,
  },
  mobileHeaderInfo: {
    flex: 1,
  },
  mobileNameText: {
    fontSize: getResponsiveFontSize(typography.subtitle, true),
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  mobileSecondaryText: {
    fontSize: getResponsiveFontSize(typography.bodySm, true),
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  mobileActionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  mobileCardBody: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },
  mobileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  mobileLabel: {
    fontSize: getResponsiveFontSize(typography.bodySm, true),
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  mobileValue: {
    fontSize: getResponsiveFontSize(typography.bodySm, true),
    color: colors.textPrimary,
  },
  
  // Estilos para desktop
  desktopPersonalCard: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  desktopCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
});

export default PersonalScreen;
