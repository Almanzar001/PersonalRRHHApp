import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';
import { Personal, Grupo } from '../../types/types';
import { colors, spacing, typography, borders } from '../../styles/theme';

interface EditPersonalModalProps {
  visible: boolean;
  personalId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPersonalModal: React.FC<EditPersonalModalProps> = ({
  visible,
  personalId,
  onClose,
  onSuccess,
}) => {
  const [personal, setPersonal] = useState<Personal | null>(null);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [rango, setRango] = useState('');
  const [genero, setGenero] = useState('');
  const [telefono, setTelefono] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [grupoId, setGrupoId] = useState<number | undefined>();
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [originalFotoUrl, setOriginalFotoUrl] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (visible && personalId) {
      fetchData();
      requestPermissions();
    }
  }, [visible, personalId]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Se necesitan permisos para acceder a la galería de fotos.'
      );
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch personal data
    const { data: personalData, error: personalError } = await supabase
      .from('personal')
      .select('*, grupos(nombre)')
      .eq('id', personalId)
      .single();

    if (personalError) {
      console.error('Error fetching personal:', personalError);
      Alert.alert('Error', 'No se pudo cargar la información del personal');
      onClose();
      return;
    }

    // Fetch grupos
    const { data: gruposData, error: gruposError } = await supabase
      .from('grupos')
      .select('*');

    if (gruposError) {
      console.error('Error fetching grupos:', gruposError);
    } else {
      setGrupos(gruposData as Grupo[]);
    }

    // Set form data
    const personalRecord = personalData as Personal;
    setPersonal(personalRecord);
    setNombres(personalRecord.nombres || '');
    setApellidos(personalRecord.apellidos || '');
    // Formatear la cédula existente al cargar
    setCedula(formatCedula(personalRecord.cedula || ''));
    setRango(personalRecord.rango || '');
    setGenero(personalRecord.genero || '');
    // Formatear el teléfono existente al cargar
    setTelefono(formatTelefono(personalRecord.telefono || ''));
    setInstitucion(personalRecord.institucion || '');
    setGrupoId(personalRecord.grupo_id || undefined);
    // Guardar la URL original de la foto
    setOriginalFotoUrl(personalRecord.foto_url || null);
    setFotoUri(null); // Reset foto URI para nuevas selecciones

    setLoading(false);
  };

  // Función para formatear cédula automáticamente
  const formatCedula = (text: string) => {
    // Remover todo lo que no sean números
    const numbers = text.replace(/\D/g, '');

    // Aplicar formato 000-0000000-0
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 10)}-${numbers.slice(10, 11)}`;
    }
  };

  // Función para validar formato de cédula
  const isValidCedulaFormat = (cedula: string) => {
    const cedulaRegex = /^\d{3}-\d{7}-\d{1}$/;
    return cedulaRegex.test(cedula);
  };

  // Función para formatear teléfono automáticamente
  const formatTelefono = (text: string) => {
    // Remover todo lo que no sean números
    const numbers = text.replace(/\D/g, '');

    // Aplicar formato (809)-555-5555
    if (numbers.length <= 3) {
      return numbers.length > 0 ? `(${numbers}` : '';
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)})-${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)})-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  // Función para validar formato de teléfono
  const isValidTelefonoFormat = (telefono: string) => {
    if (!telefono.trim()) return true; // Teléfono es opcional
    const telefonoRegex = /^\(\d{3}\)-\d{3}-\d{4}$/;
    return telefonoRegex.test(telefono);
  };

  const selectPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Aspecto cuadrado para fotos de perfil
        quality: 1.0, // Máxima calidad inicial para luego comprimir
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Comprimir la imagen antes de mostrarla
        const compressedImage = await compressImage(result.assets[0].uri);
        setFotoUri(compressedImage);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la foto');
    }
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      // Comprimir la imagen con máxima compresión
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Redimensionar a máximo 800x800 píxeles
          { resize: { width: 800, height: 800 } }
        ],
        {
          compress: 0.3, // Compresión alta (30% de calidad)
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false,
        }
      );

      console.log('Imagen comprimida exitosamente');
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      // Si falla la compresión, devolver la imagen original
      return uri;
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      setUploadingPhoto(true);

      // Crear un nombre único para la foto
      const fileName = `personal_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

      // Leer el archivo como ArrayBuffer para React Native
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Subir a Supabase Storage usando ArrayBuffer
      const { data, error } = await supabase.storage
        .from('personal-photos')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Error uploading photo:', error);
        Alert.alert('Error', 'No se pudo subir la foto: ' + error.message);
        return null;
      }

      // Obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('personal-photos')
        .getPublicUrl(fileName);

      console.log('Foto comprimida y subida exitosamente:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadPhoto:', error);
      Alert.alert('Error', 'Error inesperado al subir la foto');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!nombres.trim()) {
      newErrors.nombres = 'Los nombres son requeridos';
    }
    if (!cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    } else if (!isValidCedulaFormat(cedula)) {
      newErrors.cedula = 'La cédula debe tener el formato 000-0000000-0';
    }
    if (telefono.trim() && !isValidTelefonoFormat(telefono)) {
      newErrors.telefono = 'El teléfono debe tener el formato (809)-555-5555';
    }
    if (!grupoId) {
      newErrors.grupo = 'Debe seleccionar un grupo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Subir nueva foto si se seleccionó una
      let fotoUrl = originalFotoUrl; // Mantener la foto original por defecto
      if (fotoUri) {
        const uploadedUrl = await uploadPhoto(fotoUri);
        if (!uploadedUrl) {
          Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
          setSaving(false);
          return;
        }
        fotoUrl = uploadedUrl;
      }

      // Actualizar personal con la URL de la foto
      const { error } = await supabase
        .from('personal')
        .update({
          nombres: nombres.trim(),
          Apellidos: apellidos.trim() || null,
          cedula: cedula.trim(),
          rango: rango || null,
          genero: genero || null,
          telefono: telefono.trim() || null,
          institucion: institucion.trim() || null,
          grupo_id: grupoId,
          foto_url: fotoUrl || 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png',
        })
        .eq('id', personalId);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el personal: ' + error.message);
      } else {
        Alert.alert('Éxito', '¡Personal actualizado exitosamente!');
        onSuccess();
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (loading) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <View style={styles.header}>
              <Text style={styles.title}>Editar Personal</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Contenido del formulario */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.form}>
                {/* Foto */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Foto</Text>
                  <TouchableOpacity
                    style={styles.photoContainer}
                    onPress={selectPhoto}
                    disabled={uploadingPhoto}
                  >
                    {fotoUri ? (
                      <Image source={{ uri: fotoUri }} style={styles.photoPreview} />
                    ) : originalFotoUrl && originalFotoUrl !== 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png' ? (
                      <Image source={{ uri: originalFotoUrl }} style={styles.photoPreview} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Image
                          source={{ uri: 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png' }}
                          style={styles.photoPreview}
                        />
                        <Text style={styles.photoPlaceholderText}>
                          {uploadingPhoto ? 'Subiendo...' : 'Toca para cambiar foto'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Nombres */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombres *</Text>
                  <TextInput
                    style={[styles.input, errors.nombres && styles.inputError]}
                    value={nombres}
                    onChangeText={setNombres}
                    placeholder="Ingresa los nombres"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {errors.nombres && (
                    <Text style={styles.errorText}>{errors.nombres}</Text>
                  )}
                </View>

                {/* Apellidos */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Apellidos</Text>
                  <TextInput
                    style={styles.input}
                    value={apellidos}
                    onChangeText={setApellidos}
                    placeholder="Ingresa los apellidos"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Cédula */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cédula *</Text>
                  <TextInput
                    style={[styles.input, errors.cedula && styles.inputError]}
                    value={cedula}
                    onChangeText={(text) => {
                      const formatted = formatCedula(text);
                      setCedula(formatted);
                    }}
                    placeholder="000-0000000-0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={13} // 3 + 1 + 7 + 1 + 1 = 13 caracteres
                  />
                  {errors.cedula && (
                    <Text style={styles.errorText}>{errors.cedula}</Text>
                  )}
                </View>

                {/* Rango */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Rango</Text>
                  <View style={[styles.pickerContainer, styles.pickerWrapper]}>
                    <Picker
                      selectedValue={rango}
                      onValueChange={setRango}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
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

                {/* Género */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Género</Text>
                  <View style={[styles.pickerContainer, styles.pickerWrapper]}>
                    <Picker
                      selectedValue={genero}
                      onValueChange={setGenero}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      <Picker.Item label="Seleccionar género" value="" />
                      <Picker.Item label="Masculino" value="Masculino" />
                      <Picker.Item label="Femenino" value="Femenino" />
                      <Picker.Item label="Otro" value="Otro" />
                    </Picker>
                  </View>
                </View>

                {/* Teléfono */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Teléfono</Text>
                  <TextInput
                    style={[styles.input, errors.telefono && styles.inputError]}
                    value={telefono}
                    onChangeText={(text) => {
                      const formatted = formatTelefono(text);
                      setTelefono(formatted);
                    }}
                    placeholder="(809)-555-5555"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={14} // (000)-000-0000 = 14 caracteres
                  />
                  {errors.telefono && (
                    <Text style={styles.errorText}>{errors.telefono}</Text>
                  )}
                </View>

                {/* Institución */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Institución</Text>
                  <View style={[styles.pickerContainer, styles.pickerWrapper]}>
                    <Picker
                      selectedValue={institucion}
                      onValueChange={setInstitucion}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      <Picker.Item label="Seleccionar institución" value="" />
                      <Picker.Item label="ERD - Ejército República Dominicana" value="ERD" />
                      <Picker.Item label="ARD - Armada República Dominicana" value="ARD" />
                      <Picker.Item label="FARD - Fuerza Aérea República Dominicana" value="FARD" />
                      <Picker.Item label="PN - Policía Nacional" value="PN" />
                      <Picker.Item label="MIDE - Ministerio de Defensa" value="MIDE" />
                      <Picker.Item label="MIREX - Ministerio de Relaciones Exteriores" value="MIREX" />
                    </Picker>
                  </View>
                  {errors.institucion && (
                    <Text style={styles.errorText}>{errors.institucion}</Text>
                  )}
                </View>

                {/* Grupo */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Grupo *</Text>
                  <View style={[styles.pickerContainer, styles.pickerWrapper, errors.grupo && styles.inputError]}>
                    <Picker
                      selectedValue={grupoId}
                      onValueChange={setGrupoId}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
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
                  {errors.grupo && (
                    <Text style={styles.errorText}>{errors.grupo}</Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.submitButtonText}>
                  {saving ? 'Guardando...' : 'Actualizar'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
    maxHeight: '90%',
  },
  loadingContainer: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    maxHeight: 400,
  },
  form: {
    padding: 24,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: typography.bodySm,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: typography.bodySm,
    color: colors.error,
    marginTop: 4,
  },
  pickerContainer: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  pickerWrapper: {
    paddingHorizontal: 4,
  },
  picker: {
    height: 44,
    color: colors.textPrimary,
    fontSize: typography.body,
    marginHorizontal: -4,
    marginVertical: 0,
  },
  pickerItem: {
    fontSize: typography.body,
    color: colors.textPrimary,
    height: 44,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    fontSize: typography.body,
    color: colors.white,
    fontWeight: '600',
  },
  photoContainer: {
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default EditPersonalModal;
