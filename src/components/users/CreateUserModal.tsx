import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, borders } from '../../styles/theme';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: Role[];
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  visible,
  onClose,
  onSuccess,
  roles
}) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      roleId: '',
      isActive: true
    });
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'El email es requerido');
      return false;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Ingresa un email válido');
      return false;
    }

    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return false;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'El apellido es requerido');
      return false;
    }

    if (!formData.password.trim()) {
      Alert.alert('Error', 'La contraseña es requerida');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    if (!formData.roleId) {
      Alert.alert('Error', 'Selecciona un rol para el usuario');
      return false;
    }

    return true;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Verificar si el email ya existe
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase());

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        Alert.alert('Error', 'Error verificando el usuario');
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        Alert.alert('Error', 'Ya existe un usuario con este email');
        return;
      }

      // Crear el usuario
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: formData.email.trim().toLowerCase(),
          password_hash: formData.password, // En producción usar hash
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          role_id: formData.roleId,
          is_active: formData.isActive,
          created_by: currentUser?.id
        })
        .select();

      if (createError) {
        console.error('Error creating user:', createError);
        Alert.alert('Error', 'No se pudo crear el usuario: ' + createError.message);
        return;
      }

      // Cerrar modal y recargar inmediatamente
      resetForm();
      onSuccess();
      
      // Mostrar mensaje de éxito después de cerrar
      setTimeout(() => {
        Alert.alert('Éxito', `Usuario ${formData.firstName} ${formData.lastName} creado exitosamente`);
      }, 100);

    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Ocurrió un error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
  };

  const getRoleDisplayName = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'Administrador';
      case 'user': return 'Usuario';
      case 'viewer': return 'Observador';
      default: return roleName;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Nuevo Usuario</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  placeholder="usuario@empresa.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              {/* Name Row */}
              <View style={styles.nameRow}>
                <View style={styles.nameInputGroup}>
                  <Text style={styles.inputLabel}>Nombre *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.firstName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                    placeholder="Juan"
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
                <View style={styles.nameInputGroup}>
                  <Text style={styles.inputLabel}>Apellido *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.lastName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                    placeholder="Pérez"
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Role */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rol *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.roleId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}
                    style={styles.picker}
                    enabled={!loading}
                  >
                    <Picker.Item label="Seleccionar rol..." value="" />
                    {roles.map((role) => (
                      <Picker.Item
                        key={role.id}
                        label={`${getRoleDisplayName(role.name)} - ${role.description}`}
                        value={role.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Password Section */}
              <View style={styles.passwordSection}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.sectionTitle}>Contraseña</Text>
                  <TouchableOpacity
                    onPress={generateRandomPassword}
                    style={styles.generateButton}
                    disabled={loading}
                  >
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                    <Text style={styles.generateButtonText}>Generar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordRow}>
                  <View style={styles.passwordInputGroup}>
                    <Text style={styles.inputLabel}>Contraseña *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.password}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                      placeholder="Mínimo 6 caracteres"
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                  <View style={styles.passwordInputGroup}>
                    <Text style={styles.inputLabel}>Confirmar *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                      placeholder="Repetir contraseña"
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>

              {/* Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Estado del Usuario</Text>
                <TouchableOpacity
                  style={[
                    styles.statusToggle,
                    { backgroundColor: formData.isActive ? colors.success + '20' : colors.error + '20' }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  disabled={loading}
                >
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: formData.isActive ? colors.success : colors.error }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: formData.isActive ? colors.success : colors.error }
                  ]}>
                    {formData.isActive ? 'Activo' : 'Inactivo'}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createUserButton, loading && styles.createUserButtonDisabled]}
                onPress={handleCreateUser}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color={colors.white} />
                    <Text style={styles.createUserButtonText}>Crear Usuario</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borders.radius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    ...borders.shadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.h3,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  formContainer: {
    padding: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borders.radius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameInputGroup: {
    flex: 1,
    marginBottom: spacing.lg,
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
  passwordSection: {
    marginBottom: spacing.lg,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borders.radius.sm,
    gap: spacing.xs,
  },
  generateButtonText: {
    fontSize: typography.bodySm,
    color: colors.primary,
    fontWeight: typography.fontWeights.medium,
  },
  passwordRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  passwordInputGroup: {
    flex: 1,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borders.radius.md,
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borders.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borders.radius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  cancelButtonText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  createUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borders.radius.md,
    gap: spacing.sm,
  },
  createUserButtonDisabled: {
    opacity: 0.6,
  },
  createUserButtonText: {
    fontSize: typography.body,
    color: colors.white,
    fontWeight: typography.fontWeights.semibold,
  },
});

export default CreateUserModal;