import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, ScrollView } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Personal } from '../../src/types/types';
import { baseStyles, colors, spacing, typography, shadows, borders } from '../../src/styles/theme';
import Sidebar from '../../src/components/dashboard/Sidebar';

const PersonalDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const [personal, setPersonal] = useState<Personal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPersonalDetail = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('personal')
        .select('*, grupos(nombre)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching personal detail:', error);
      } else {
        setPersonal(data as Personal);
      }
      setLoading(false);
    };

    fetchPersonalDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={[baseStyles.container, styles.mainContainer]}>
        <Sidebar />
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" color={colors.primary} />
          </View>
        </View>
      </View>
    );
  }

  if (!personal) {
    return (
      <View style={[baseStyles.container, styles.mainContainer]}>
        <Sidebar />
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No se encontró el personal.</Text>
          </View>
        </View>
      </View>
    );
  }

  // Determinar el estado de membresía basado en el rango
  const getMembershipStatus = (rango?: string) => {
    if (!rango) return { text: '⚡ Member', color: '#D4A85D' };

    const rangoLower = rango.toLowerCase();
    if (rangoLower.includes('mayor') || rangoLower.includes('coronel') || rangoLower.includes('general')) {
      return { text: '⚡ Gold member', color: '#D4A85D' };
    } else if (rangoLower.includes('capitán') || rangoLower.includes('teniente')) {
      return { text: '⚡ Silver member', color: '#C0C0C0' };
    } else {
      return { text: '⚡ Member', color: '#CD7F32' };
    }
  };

  const membershipStatus = getMembershipStatus(personal.rango);

  return (
    <View style={[baseStyles.container, styles.mainContainer]}>
      <Sidebar />
      <View style={styles.content}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.cardContainer}>
        {/* Header azul claro */}
        <View style={styles.header} />

        {/* Avatar flotante */}
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: personal.foto_url || 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png'
            }}
            style={styles.avatar}
          />
        </View>

        {/* Contenido principal */}
        <View style={styles.cardContent}>
          {/* Nombre del usuario */}
          <Text style={styles.userName}>
            {personal.nombres} {personal.Apellidos || ''}
          </Text>

          {/* Rango debajo del nombre */}
          {personal.rango && (
            <Text style={styles.userRank}>
              {personal.rango}
            </Text>
          )}

          {/* Información de contacto */}
          <View style={styles.contactInfo}>
            {personal.telefono && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{personal.telefono}</Text>
              </View>
            )}

            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Cédula</Text>
              <Text style={styles.contactValue}>{personal.cedula}</Text>
            </View>

            {personal.genero && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Género</Text>
                <Text style={styles.contactValue}>{personal.genero}</Text>
              </View>
            )}

            {personal.institucion && (
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Institución</Text>
                <Text style={styles.contactValue}>{personal.institucion}</Text>
              </View>
            )}

            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Grupo</Text>
              <Text style={styles.contactValue}>{personal.grupos?.nombre || 'No asignado'}</Text>
            </View>
          </View>
        </View>
      </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',  // Alineado arriba
    alignItems: 'center',          // Centrado horizontal
    paddingTop: 24,                // Espacio desde arriba
    minHeight: '100%',             // Asegura que ocupe el alto completo
  },
  scrollView: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
  contentContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  cardContainer: {
    width: 400,                    // Ancho fijo más controlado
    maxWidth: 500,                 // Máximo ancho como sugerido
    backgroundColor: colors.white,
    borderRadius: 12,              // Border radius suavizado
    ...shadows.card,
    // Sombra sutil mejorada
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    height: 120,                   // Altura proporcional al nuevo ancho
    backgroundColor: '#007BFF',    // Azul consistente que hemos usado
    borderTopLeftRadius: 12,       // Coincide con el border radius de la tarjeta
    borderTopRightRadius: 12,
  },
  avatarContainer: {
    position: 'absolute',
    top: 60,                       // Ajustado para la nueva altura del header (120px)
    left: '50%',
    marginLeft: -45,               // Centrar el avatar (90px / 2)
    zIndex: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: colors.white,
    ...shadows.sm,
  },
  cardContent: {
    paddingTop: 60,                // Espacio para el avatar flotante
    paddingHorizontal: 20,         // Padding interno como sugerido
    paddingBottom: 20,             // Padding interno como sugerido
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontFamily: 'Inter', // Tipografía moderna
  },
  userRank: {
    fontSize: 16,
    fontWeight: typography.fontWeights.medium,
    color: '#007BFF', // Mismo azul para consistencia
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: 'Inter',
  },
  membershipStatus: {
    fontSize: 14,
    fontWeight: typography.fontWeights.regular,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontFamily: 'Inter',
  },
  contactInfo: {
    width: '100%',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: typography.fontWeights.regular,
    fontFamily: 'Inter',
  },
  contactValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: typography.fontWeights.medium,
    fontFamily: 'Inter',
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
});

export default PersonalDetailScreen;
