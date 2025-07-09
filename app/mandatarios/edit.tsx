import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Sidebar from '../../src/components/dashboard/Sidebar';
import Header from '../../src/components/dashboard/Header';
import { baseStyles, colors, spacing, typography, borders } from '../../src/styles/theme';

interface Mandatario {
  id: number;
  nombre: string;
  pais: string;
}

const EditMandatarioScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  console.log('EditMandatarioScreen loaded with ID:', id);
  console.log('ID type:', typeof id);
  
  const [mandatario, setMandatario] = useState<Mandatario | null>(null);
  const [nombre, setNombre] = useState('');
  const [pais, setPais] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!id) {
      console.log('No ID provided, redirecting back');
      Alert.alert('Error', 'ID de mandatario no proporcionado');
      router.back();
      return;
    }
    
    const fetchMandatario = async () => {
      setLoading(true);
      console.log('Fetching mandatario data for ID:', id);
      
      const { data, error } = await supabase
        .from('mandatarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching mandatario:', error);
        Alert.alert('Error', 'No se pudo cargar la información del mandatario: ' + error.message);
        router.back();
        return;
      }

      console.log('Mandatario data fetched:', data);

      const mandatarioData = data as Mandatario;
      setMandatario(mandatarioData);
      setNombre(mandatarioData.nombre || '');
      setPais(mandatarioData.pais || '');
      
      setLoading(false);
    };

    fetchMandatario();
  }, [id]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!pais.trim()) {
      newErrors.pais = 'El país es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateMandatario = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      console.log('Updating mandatario with ID:', id);
      const { error: updateError } = await supabase
        .from('mandatarios')
        .update({
          nombre: nombre.trim(),
          pais: pais.trim(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error', 'Error al actualizar el mandatario: ' + updateError.message);
      } else {
        console.log('Mandatario updated successfully');
        Alert.alert(
          'Éxito', 
          '¡Mandatario actualizado exitosamente!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
    
    setSaving(false);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[baseStyles.container, styles.mainContainer]}>
        <Sidebar />
        <View style={styles.content}>
          <Header />
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating={true} size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando información...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[baseStyles.container, styles.mainContainer]}>
      <Sidebar />
      <View style={styles.content}>
        <Header />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={baseStyles.h2}>Editar Mandatario</Text>
            <Text style={styles.subtitle}>
              Modifica la información de {mandatario?.nombre}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre Completo *</Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                style={[styles.input, errors.nombre && styles.inputError]}
                mode="outlined"
                placeholder="Ingresa el nombre completo del mandatario"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.nombre && <Text style={styles.errorText}>{errors.nombre}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>País *</Text>
              <TextInput
                value={pais}
                onChangeText={setPais}
                style={[styles.input, errors.pais && styles.inputError]}
                mode="outlined"
                placeholder="Ingresa el país del mandatario"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.pais && <Text style={styles.errorText}>{errors.pais}</Text>}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[baseStyles.buttonSecondary, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[baseStyles.buttonPrimary, styles.submitButton]}
                onPress={handleUpdateMandatario}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                    <Text style={[baseStyles.buttonText, styles.submitButtonText]}>
                      Actualizar Mandatario
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
  },
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    padding: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  formContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.bodySm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xxxl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  submitButtonText: {
    marginLeft: spacing.sm,
  },
});

export default EditMandatarioScreen;
