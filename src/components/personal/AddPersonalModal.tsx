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
import { Grupo } from '../../types/types';
import { colors, spacing, typography, borders, getResponsiveSpacing, getResponsiveFontSize } from '../../styles/theme';
import { useResponsive } from '../../hooks/useResponsive';

interface AddPersonalModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPersonalModal: React.FC<AddPersonalModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { isMobile, isTablet, width } = useResponsive();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [rango, setRango] = useState('');
  const [genero, setGenero] = useState('');
  const [telefono, setTelefono] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [grupoId, setGrupoId] = useState<number | string>('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (visible) {
      fetchGrupos();
      requestPermissions();
      resetForm();
    }
  }, [visible]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Se necesitan permisos para acceder a la galería de fotos.'
      );
    }
  };

  const fetchGrupos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grupos')
      .select('*')
      .order('nombre');

    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los grupos');
    } else {
      setGrupos(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setNombres('');
    setApellidos('');
    setCedula('');
    setRango('');
    setGenero('');
    setTelefono('');
    setInstitucion('');
    setGrupoId('');
    setFotoUri(null);
    setErrors({});
  };

  // Función para formatear cédula automáticamente
  const formatCedula = (text: string): string => {
    // Remover todos los caracteres que no sean números
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

  // Función para formatear teléfono automáticamente
  const formatTelefono = (text: string): string => {
    // Remover todos los caracteres que no sean números
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

  // Validaciones
  const isValidCedulaFormat = (cedula: string): boolean => {
    const cedulaRegex = /^\d{3}-\d{7}-\d{1}$/;
    return cedulaRegex.test(cedula);
  };

  const isValidTelefonoFormat = (telefono: string): boolean => {
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
    if (!grupoId || grupoId === '') {
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
      // Subir foto si se seleccionó una
      let fotoUrl = null;
      if (fotoUri) {
        const uploadedUrl = await uploadPhoto(fotoUri);
        if (!uploadedUrl) {
          Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
          setSaving(false);
          return;
        }
        fotoUrl = uploadedUrl;
      }

      // Preparar datos para insertar
      const dataToInsert = {
        nombres: nombres.trim(),
        Apellidos: apellidos.trim() || null, // Nota: Apellidos con mayúscula
        cedula: cedula.trim(),
        rango: rango || null,
        genero: genero || null,
        telefono: telefono.trim() || null,
        institucion: institucion.trim() || null,
        grupo_id: grupoId && grupoId !== '' ? grupoId : null,
        foto_url: fotoUrl || 'https://www.mona.uwi.edu/modlang/sites/default/files/modlang/male-avatar-placeholder.png',
      };

      // Insertar nuevo personal
      const { data, error } = await supabase
        .from('personal')
        .insert(dataToInsert)
        .select();

      if (error) {
        Alert.alert('Error', 'No se pudo agregar el personal: ' + error.message);
      } else {
        // Limpiar el formulario antes de mostrar el mensaje de éxito
        resetForm();
        Alert.alert('Éxito', 'Personal agregado exitosamente', [
          { text: 'OK', onPress: () => {
            onSuccess();
            onClose();
          }}
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Error inesperado al agregar el personal');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getResponsiveStyles = () => {
    return {
      modal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: isMobile ? '95%' : isTablet ? '80%' : '90%',
        maxWidth: isMobile ? 400 : isTablet ? 600 : 500,
        maxHeight: isMobile ? '95%' : '90%',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      },
      form: {
        padding: getResponsiveSpacing(16, isMobile, isTablet),
      },
      inputGroup: {
        marginBottom: getResponsiveSpacing(12, isMobile, isTablet),
      },
      input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: getResponsiveSpacing(12, isMobile, isTablet),
        paddingVertical: getResponsiveSpacing(8, isMobile, isTablet),
        fontSize: getResponsiveFontSize(16, isMobile, isTablet),
        color: '#1F2937',
        backgroundColor: '#FFFFFF',
        height: isMobile ? 40 : 44,
      },
      label: {
        fontSize: getResponsiveFontSize(14, isMobile, isTablet),
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 4,
      },
      title: {
        fontSize: getResponsiveFontSize(20, isMobile, isTablet),
        fontWeight: '600',
        color: '#1F2937',
      },
    };
  };

  const responsiveStyles = getResponsiveStyles();

  if (loading) {
    return (
      <Modal visible={visible} transparent={true} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
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
            style={responsiveStyles.modal}
            activeOpacity={1}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={responsiveStyles.title}>Agregar Personal</Text>
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
              <View style={responsiveStyles.form}>
                {/* Foto */}
                <View style={responsiveStyles.inputGroup}>
                  <Text style={responsiveStyles.label}>Foto</Text>
                  <TouchableOpacity
                    style={styles.photoContainer}
                    onPress={selectPhoto}
                    disabled={uploadingPhoto}
                  >
                    {fotoUri ? (
                      <Image source={{ uri: fotoUri }} style={styles.photoPreview} />
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
                <View style={responsiveStyles.inputGroup}>
                  <Text style={responsiveStyles.label}>Nombres *</Text>
                  <TextInput
                    style={[responsiveStyles.input, errors.nombres && styles.inputError]}
                    value={nombres}
                    onChangeText={setNombres}
                    placeholder="Ingrese los nombres"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {errors.nombres && (
                    <Text style={styles.errorText}>{errors.nombres}</Text>
                  )}
                </View>

                {/* Apellidos */}
                <View style={responsiveStyles.inputGroup}>
                  <Text style={responsiveStyles.label}>Apellidos</Text>
                  <TextInput
                    style={responsiveStyles.input}
                    value={apellidos}
                    onChangeText={setApellidos}
                    placeholder="Ingrese los apellidos"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Cédula */}
                <View style={responsiveStyles.inputGroup}>
                  <Text style={responsiveStyles.label}>Cédula *</Text>
                  <TextInput
                    style={[responsiveStyles.input, errors.cedula && styles.inputError]}
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
                  <View style={[styles.pickerContainer, styles.pickerWrapper]}>
                    <Picker
                      selectedValue={grupoId}
                      onValueChange={setGrupoId}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      <Picker.Item label="Seleccionar grupo" value="" />
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

            {/* Footer con botones */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Guardando...' : 'Guardar'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    height: 44,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pickerWrapper: {
    height: 44,
    justifyContent: 'center',
  },
  picker: {
    height: 44,
    color: '#1F2937',
  },
  pickerItem: {
    fontSize: 16,
    color: '#1F2937',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#F7F9FC',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  cancelButton: {
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#007BFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    padding: 16,
  },
});

export default AddPersonalModal;
