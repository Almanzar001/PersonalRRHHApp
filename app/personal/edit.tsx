import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Alert } from 'react-native';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../src/lib/supabase';
import { Personal, Grupo } from '../../src/types/types';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Sidebar from '../../src/components/dashboard/Sidebar';
import Header from '../../src/components/dashboard/Header';
import { baseStyles, colors, spacing, typography, borders } from '../../src/styles/theme';

const EditPersonalScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  console.log('EditPersonalScreen loaded with ID:', id);
  console.log('ID type:', typeof id);
  
  const [personal, setPersonal] = useState<Personal | null>(null);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [rango, setRango] = useState('');
  const [genero, setGenero] = useState('');
  const [telefono, setTelefono] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [grupoId, setGrupoId] = useState<number | undefined>();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!id) {
      console.log('No ID provided, redirecting back');
      Alert.alert('Error', 'ID de personal no proporcionado');
      router.back();
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      console.log('Fetching personal data for ID:', id);
      
      // Fetch personal data
      const { data: personalData, error: personalError } = await supabase
        .from('personal')
        .select('*, grupos(nombre)')
        .eq('id', id)
        .single();

      if (personalError) {
        console.error('Error fetching personal:', personalError);
        Alert.alert('Error', 'No se pudo cargar la información del personal: ' + personalError.message);
        router.back();
        return;
      }

      console.log('Personal data fetched:', personalData);

      // Fetch grupos
      const { data: gruposData, error: gruposError } = await supabase
        .from('grupos')
        .select('*');

      if (gruposError) {
        console.error('Error fetching grupos:', gruposError);
      } else {
        setGrupos(gruposData as Grupo[]);
      }

      const personalRecord = personalData as Personal;
      setPersonal(personalRecord);
      setNombres(personalRecord.nombres || '');
      setApellidos(personalRecord.apellidos || '');
      setCedula(personalRecord.cedula || '');
      setRango(personalRecord.rango || '');
      setGenero(personalRecord.genero || '');
      setTelefono(personalRecord.telefono || '');
      setInstitucion(personalRecord.institucion || '');
      setGrupoId(personalRecord.grupo_id || undefined);
      
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    }

    if (!cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdatePersonal = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      console.log('Updating personal with ID:', id);
      const { error: updateError } = await supabase
        .from('personal')
        .update({
          nombres: nombres.trim(),
          apellidos: apellidos.trim() || null,
          cedula: cedula.trim(),
          rango: rango || null,
          genero: genero.trim() || null,
          telefono: telefono.trim() || null,
          institucion: institucion.trim() || null,
          grupo_id: grupoId,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update error:', updateError);
        Alert.alert('Error', 'Error al actualizar el personal: ' + updateError.message);
      } else {
        console.log('Personal updated successfully');
        Alert.alert(
          'Éxito', 
          '¡Personal actualizado exitosamente!',
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
            <Text style={baseStyles.h2}>Editar Personal</Text>
            <Text style={styles.subtitle}>
              Modifica la información de {personal?.nombres} {personal?.apellidos || ''}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombres *</Text>
              <TextInput
                value={nombres}
                onChangeText={setNombres}
                style={[styles.input, errors.nombres && styles.inputError]}
                mode="outlined"
                placeholder="Ingresa los nombres"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.nombres && <Text style={styles.errorText}>{errors.nombres}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput
                value={apellidos}
                onChangeText={setApellidos}
                style={styles.input}
                mode="outlined"
                placeholder="Ingresa los apellidos"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cédula *</Text>
              <TextInput
                value={cedula}
                onChangeText={setCedula}
                style={[styles.input, errors.cedula && styles.inputError]}
                mode="outlined"
                placeholder="Ingresa la cédula"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              {errors.cedula && <Text style={styles.errorText}>{errors.cedula}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rango</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={rango}
                  onValueChange={setRango}
                  style={styles.picker}
                >
                  <Picker.Item label="Seleccionar rango" value="" />
                  <Picker.Item label="Mayor General" value="Mayor General" />
                  <Picker.Item label="General de Brigada" value="General de Brigada" />
                  <Picker.Item label="Coronel" value="Coronel" />
                  <Picker.Item label="Capitán de Navio" value="Capitán de Navio" />
                  <Picker.Item label="Teniente Coronel" value="Teniente Coronel" />
                  <Picker.Item label="Capitán de Fragata" value="Capitán de Fragata" />
                  <Picker.Item label="Mayor" value="Mayor" />
                  <Picker.Item label="Capitán de Corbeta" value="Capitán de Corbeta" />
                  <Picker.Item label="Capitán" value="Capitán" />
                  <Picker.Item label="Teniente de Navio" value="Teniente de Navio" />
                  <Picker.Item label="1er. Teniente" value="1er. Teniente" />
                  <Picker.Item label="Tte. de Fragata" value="Tte. de Fragata" />
                  <Picker.Item label="2do.Teniente" value="2do.Teniente" />
                  <Picker.Item label="Tte. de Corbeta" value="Tte. de Corbeta" />
                  <Picker.Item label="Sargento Mayor" value="Sargento Mayor" />
                  <Picker.Item label="Sargento" value="Sargento" />
                  <Picker.Item label="Cabo" value="Cabo" />
                  <Picker.Item label="Raso" value="Raso" />
                  <Picker.Item label="Marinero" value="Marinero" />
                  <Picker.Item label="Asimilado Militar" value="Asimilado Militar" />
                  <Picker.Item label="Asimilado" value="Asimilado" />
                  <Picker.Item label="Civil" value="Civil" />
                </Picker>
              </View>
            </View>



            <View style={styles.inputGroup}>
              <Text style={styles.label}>Género</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={genero}
                  onValueChange={setGenero}
                  style={styles.picker}
                >
                  <Picker.Item label="Seleccionar género" value="" />
                  <Picker.Item label="Masculino" value="Masculino" />
                  <Picker.Item label="Femenino" value="Femenino" />
                  <Picker.Item label="Otro" value="Otro" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                value={telefono}
                onChangeText={setTelefono}
                style={styles.input}
                mode="outlined"
                placeholder="Ingresa el teléfono"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Institución</Text>
              <TextInput
                value={institucion}
                onChangeText={setInstitucion}
                style={styles.input}
                mode="outlined"
                placeholder="Ingresa la institución"
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Grupo</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={grupoId}
                  onValueChange={setGrupoId}
                  style={styles.picker}
                >
                  <Picker.Item label="Seleccionar grupo" value={undefined} />
                  {grupos.map((grupo) => (
                    <Picker.Item
                      key={grupo.id}
                      label={grupo.nombre}
                      value={grupo.id}
                    />
                  ))}
                </Picker>
              </View>
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
                onPress={handleUpdatePersonal}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                    <Text style={[baseStyles.buttonText, styles.submitButtonText]}>
                      Actualizar Personal
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borders.radius.md,
    backgroundColor: colors.white,
  },
  picker: {
    height: 50,
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

export default EditPersonalScreen;
