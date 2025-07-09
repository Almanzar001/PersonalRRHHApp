import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import Sidebar from '../../src/components/dashboard/Sidebar';
import Header from '../../src/components/dashboard/Header';
import { baseStyles, colors, spacing, typography, borders } from '../../src/styles/theme';

const AddMandatarioScreen = () => {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [pais, setPais] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  const handleAddMandatario = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('mandatarios').insert([
        {
          nombre: nombre.trim(),
          pais: pais.trim(),
        },
      ]);

      if (insertError) {
        Alert.alert('Error', 'Error al agregar el mandatario: ' + insertError.message);
      } else {
        Alert.alert(
          'Éxito', 
          '¡Mandatario agregado exitosamente!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
      console.error('Error adding mandatario:', error);
    }
    
    setLoading(false);
  };

  const handleCancel = () => {
    router.back();
  };

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
            <Text style={baseStyles.h2}>Agregar Mandatario</Text>
            <Text style={styles.subtitle}>
              Completa la información del nuevo mandatario
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
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[baseStyles.buttonPrimary, styles.submitButton]}
                onPress={handleAddMandatario}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                    <Text style={[baseStyles.buttonText, styles.submitButtonText]}>
                      Agregar Mandatario
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

export default AddMandatarioScreen;
