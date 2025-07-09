import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { EstadoEquipo } from '../../src/types/types';
import { Link, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AppLayout from '../../src/components/layout/AppLayout';
import { baseStyles, colors, spacing, typography, borders } from '../../src/styles/theme';

const MandatariosScreen = () => {
  const router = useRouter();
  const [mandatarios, setMandatarios] = useState<EstadoEquipo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMandatarios = async () => {
    setLoading(true);
    // Usamos la vista que creamos en la base de datos
    const { data, error } = await supabase.from('vista_estado_equipos').select('*');

    if (error) {
      console.error('Error fetching mandatarios:', error);
    } else {
      setMandatarios(data as EstadoEquipo[]);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchMandatarios();
    }, [])
  );

  const handleDeleteMandatario = async (id: number, nombre: string) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar a ${nombre}? Esta acción no se puede deshacer y eliminará también todas las asignaciones relacionadas.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('mandatarios')
                .delete()
                .eq('id', id);

              if (error) {
                Alert.alert('Error', 'No se pudo eliminar el mandatario: ' + error.message);
              } else {
                Alert.alert('Éxito', 'Mandatario eliminado exitosamente');
                // Refresh the list
                fetchMandatarios();
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un error inesperado');
              console.error('Error deleting mandatario:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando mandatarios...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={baseStyles.h2}>Gestión de Mandatarios</Text>
            <Text style={styles.subtitle}>
              Administra los mandatarios y sus equipos de trabajo
            </Text>
            <TouchableOpacity
              style={[baseStyles.buttonPrimary, styles.addButton]}
              onPress={() => router.push('/mandatarios/add')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={[baseStyles.buttonText, styles.addButtonText]}>
                Agregar Mandatario
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mandatariosGrid}>
            {mandatarios.map((item) => (
              <TouchableOpacity
                key={item.mandatario_id}
                style={[baseStyles.card, styles.mandatarioCard]}
                onPress={() => router.push(`/mandatarios/${item.mandatario_id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.mandatarioHeader}>
                  <View style={styles.avatar}>
                    <Ionicons name="business" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.mandatarioInfo}>
                    <Text style={styles.mandatarioName}>{item.mandatario_nombre}</Text>
                    <Text style={styles.mandatarioDetail}>País: {item.pais}</Text>
                  </View>
                </View>
                <View style={styles.mandatarioDetails}>
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Estado del Equipo:</Text>
                    <Text style={[
                      styles.statusText,
                      item.estado === '✅ Completo' ? styles.completo : styles.incompleto
                    ]}>
                      {item.estado}
                    </Text>
                  </View>
                  <Text style={styles.mandatarioDetail}>
                    Funciones: {item.funciones_asignadas} de {item.funciones_requeridas}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      console.log('Edit mandatario button pressed for ID:', item.mandatario_id);
                      try {
                        router.push({
                          pathname: '/mandatarios/edit',
                          params: { id: item.mandatario_id }
                        });
                      } catch (error) {
                        console.error('Navigation error:', error);
                        Alert.alert('Error', 'No se pudo navegar a la pantalla de edición');
                      }
                    }}
                  >
                    <Ionicons name="pencil" size={16} color={colors.primary} />
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteMandatario(item.mandatario_id, item.mandatario_nombre);
                    }}
                  >
                    <Ionicons name="trash" size={16} color={colors.error} />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
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
  mandatariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  mandatarioCard: {
    width: '48%',
    padding: spacing.lg,
  },
  mandatarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  mandatarioInfo: {
    flex: 1,
  },
  mandatarioName: {
    fontSize: typography.h4,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  mandatarioDetail: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  mandatarioDetails: {
    marginBottom: spacing.lg,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusLabel: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.medium,
  },
  completo: {
    color: colors.success,
  },
  incompleto: {
    color: colors.warning,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borders.radius.md,
    gap: spacing.xs,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.medium,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borders.radius.md,
    gap: spacing.xs,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.medium,
  },
});

export default MandatariosScreen;
