import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { baseStyles, colors, spacing, typography, borders } from "../../styles/theme";
import { supabase } from '../../lib/supabase';

interface Activity {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  created_at: string; // Use created_at for sorting and display
  color: string;
  type: 'personal' | 'mandatario' | 'asignacion';
}

const ProjectList = () => {
  const router = useRouter();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    setLoading(true);
    try {
      const activities: Activity[] = [];

      // Obtener personal reciente (últimos 5 registros)
      const { data: personalData, error: personalError } = await supabase
        .from('personal')
        .select('id, nombres, apellidos, rango, institucion, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (personalData && !personalError) {
        console.log('Personal Data:', personalData);
        personalData.forEach((person) => {
          activities.push({
            id: `personal-${person.id}`,
            icon: 'person-add-outline',
            title: 'Nuevo Personal Registrado',
            subtitle: `${person.nombres} ${person.apellidos || ''} - ${person.rango || 'Sin rango'}`,
            time: person.created_at, // Store original timestamp for sorting
            color: '#007BFF',
            type: 'personal'
          });
        });
      } else if (personalError) {
        console.error('Error fetching personal data:', personalError);
      }

      // Obtener mandatarios recientes
      const { data: mandatariosData, error: mandatariosError } = await supabase
        .from('mandatarios')
        .select('id, nombre, pais, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (mandatariosData && !mandatariosError) {
        console.log('Mandatarios Data:', mandatariosData);
        mandatariosData.forEach((mandatario) => {
          activities.push({
            id: `mandatario-${mandatario.id}`,
            icon: 'business-outline',
            title: 'Nuevo Mandatario',
            subtitle: `${mandatario.nombre} - ${mandatario.pais}`,
            time: mandatario.created_at, // Store original timestamp for sorting
            color: '#28a745',
            type: 'mandatario'
          });
        });
      } else if (mandatariosError) {
        console.error('Error fetching mandatarios data:', mandatariosError);
      }

      // Obtener asignaciones recientes
      const { data: asignacionesData, error: asignacionesError } = await supabase
        .from('asignaciones')
        .select('id, personal_id, fecha_asignacion, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (asignacionesData && !asignacionesError) {
        console.log('Asignaciones Data:', asignacionesData);
        for (const asignacion of asignacionesData) {
          // Fetch personal name for the assignment
          const { data: personalAsignacion, error: personalAsignacionError } = await supabase
            .from('personal')
            .select('nombres, apellidos')
            .eq('id', asignacion.personal_id)
            .single();

          if (personalAsignacion && !personalAsignacionError) {
            activities.push({
              id: `asignacion-${asignacion.id}`,
              icon: 'document-text-outline',
              title: 'Nueva Asignación',
              subtitle: `${personalAsignacion.nombres} ${personalAsignacion.apellidos || ''} - ${new Date(asignacion.fecha_asignacion).toLocaleDateString()}`,
              time: asignacion.created_at, // Store original timestamp for sorting
              color: '#ffc107',
              type: 'asignacion'
            });
          } else if (personalAsignacionError) {
            console.error('Error fetching personal for asignacion:', personalAsignacionError);
          }
        }
      } else if (asignacionesError) {
        console.error('Error fetching asignaciones data:', asignacionesError);
      }

      // Ordenar por fecha de creación más reciente
      activities.sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });

      // Tomar solo los primeros 4 y aplicar getTimeAgo para la visualización
      setRecentActivities(activities.slice(0, 4).map(activity => ({
        ...activity,
        time: getTimeAgo(activity.time)
      })));

    } catch (error) {
      console.error('Error loading recent activity:', error);
      // Mantener actividades estáticas en caso de error
      setRecentActivities(staticActivities);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays === 1) {
      return 'Ayer';
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else {
      return `Hace ${Math.floor(diffInDays / 7)} semana${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
    }
  };

  const handleViewAll = () => {
    Alert.alert('Actividad Completa', 'Mostrando todas las actividades recientes...');
  };

  const handleActivityPress = (activity: Activity) => {
    switch (activity.type) {
      case 'personal':
        router.push('/personal');
        break;
      case 'mandatario':
        router.push('/mandatarios');
        break;
      case 'asignacion':
        router.push('/asignaciones');
        break;
      default:
        Alert.alert(
          activity.title,
          `${activity.subtitle}\n\n${activity.time}`,
          [
            { text: 'Cerrar', style: 'cancel' },
            { text: 'Ver Detalles', onPress: () => console.log('Ver detalles') },
          ]
        );
    }
  };

  return (
    <View style={[baseStyles.card, styles.container]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Actividad Reciente
        </Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAll}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllText}>
            Ver Todo
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activitiesContainer}>
        {recentActivities.map((activity, i) => (
          <TouchableOpacity
            key={i}
            style={styles.activityItem}
            activeOpacity={0.8}
            onPress={() => handleActivityPress(activity)}
          >
            <View
              style={[
                styles.activityIcon,
                { backgroundColor: activity.color + '33' }
              ]}
            >
              <Ionicons name={activity.icon} size={20} color={activity.color} />
            </View>

            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>
                {activity.title}
              </Text>
              <Text style={styles.activitySubtitle}>
                {activity.subtitle}
              </Text>
            </View>

            <Text style={styles.activityTime}>
              {activity.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 280,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.subtitle,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  viewAllButton: {
    backgroundColor: colors.primary + '1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borders.radius.md,
  },
  viewAllText: {
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
    fontSize: typography.bodySm,
  },
  activitiesContainer: {
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borders.radius.md,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs,
  },
  activitySubtitle: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
  },
  activityTime: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
  },
});

export default ProjectList;