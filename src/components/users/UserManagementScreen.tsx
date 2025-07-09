import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../layout/AppLayout';
import CreateUserModal from './CreateUserModal';
import { baseStyles, colors, spacing, typography, borders } from '../../styles/theme';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

const UserManagementScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadUsers(), loadRoles()]);
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          is_active,
          created_at,
          last_login,
          roles!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        Alert.alert('Error', 'No se pudieron cargar los usuarios');
        return;
      }

      const formattedUsers = data?.map(user => ({
        ...user,
        role_name: user.roles?.name || 'Sin rol'
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar los usuarios');
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading roles:', error);
        return;
      }

      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        Alert.alert('Error', 'No se pudo actualizar el estado del usuario');
        return;
      }

      await loadUsers();
      Alert.alert(
        'Éxito', 
        `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el usuario');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      Alert.alert('Error', 'No puedes eliminar tu propia cuenta');
      return;
    }

    const onConfirm = async () => {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) {
          console.error('Error deleting user:', error);
          Alert.alert('Error', 'No se pudo eliminar el usuario: ' + error.message);
          return;
        }

        await loadUsers();
        Alert.alert('Éxito', 'Usuario eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting user:', error);
        Alert.alert('Error', 'Ocurrió un error al eliminar el usuario');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Estás seguro de que deseas eliminar a ${userName}? Esta acción no se puede deshacer.`)) {
        onConfirm();
      }
    } else {
      Alert.alert(
        'Confirmar Eliminación',
        `¿Estás seguro de que deseas eliminar a ${userName}? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: onConfirm }
        ]
      );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'admin': return colors.error;
      case 'user': return colors.primary;
      case 'viewer': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'shield-checkmark';
      case 'user': return 'person';
      case 'viewer': return 'eye';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <Text style={baseStyles.h2}>Gestión de Usuarios</Text>
            <Text style={styles.subtitle}>
              Administra cuentas de usuario y permisos del sistema
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.createButtonText}>Crear Usuario</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{users.length}</Text>
              <Text style={styles.statLabel}>Total Usuarios</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {users.filter(u => u.is_active).length}
              </Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="shield-checkmark" size={24} color={colors.error} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>
                {users.filter(u => u.role_name === 'admin').length}
              </Text>
              <Text style={styles.statLabel}>Administradores</Text>
            </View>
          </View>
        </View>

        {/* Users Table */}
        <View style={[baseStyles.card, styles.tableContainer]}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Lista de Usuarios</Text>
          </View>

          <View style={styles.table}>
            {/* Table Headers */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderText, styles.nameColumn]}>Usuario</Text>
              <Text style={[styles.tableHeaderText, styles.roleColumn]}>Rol</Text>
              <Text style={[styles.tableHeaderText, styles.statusColumn]}>Estado</Text>
              <Text style={[styles.tableHeaderText, styles.lastLoginColumn]}>Último Acceso</Text>
              <Text style={[styles.tableHeaderText, styles.actionsColumn]}>Acciones</Text>
            </View>

            {/* Table Body */}
            <ScrollView style={styles.tableBody} nestedScrollEnabled={true}>
              {users.map((user, index) => (
                <View
                  key={user.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow,
                    user.id === currentUser?.id && styles.currentUserRow
                  ]}
                >
                  {/* Name Column */}
                  <View style={styles.nameColumn}>
                    <View style={styles.userInfo}>
                      <View style={[styles.userAvatar, { borderColor: getRoleColor(user.role_name) }]}>
                        <Ionicons 
                          name={getRoleIcon(user.role_name)} 
                          size={16} 
                          color={getRoleColor(user.role_name)} 
                        />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                          {user.first_name} {user.last_name}
                          {user.id === currentUser?.id && (
                            <Text style={styles.currentUserTag}> (Tú)</Text>
                          )}
                        </Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Role Column */}
                  <View style={styles.roleColumn}>
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role_name) + '20' }]}>
                      <Text style={[styles.roleText, { color: getRoleColor(user.role_name) }]}>
                        {user.role_name === 'admin' ? 'Administrador' : 
                         user.role_name === 'user' ? 'Usuario' : 
                         user.role_name === 'viewer' ? 'Observador' : user.role_name}
                      </Text>
                    </View>
                  </View>

                  {/* Status Column */}
                  <View style={styles.statusColumn}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: user.is_active ? colors.success + '20' : colors.error + '20' }
                    ]}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: user.is_active ? colors.success : colors.error }
                      ]} />
                      <Text style={[
                        styles.statusText,
                        { color: user.is_active ? colors.success : colors.error }
                      ]}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>

                  {/* Last Login Column */}
                  <View style={styles.lastLoginColumn}>
                    <Text style={styles.lastLoginText}>
                      {formatDate(user.last_login)}
                    </Text>
                  </View>

                  {/* Actions Column */}
                  <View style={styles.actionsColumn}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: user.is_active ? colors.warning + '20' : colors.success + '20' }
                        ]}
                        onPress={() => handleToggleUserStatus(user.id, user.is_active)}
                      >
                        <Ionicons 
                          name={user.is_active ? "pause" : "play"} 
                          size={16} 
                          color={user.is_active ? colors.warning : colors.success} 
                        />
                      </TouchableOpacity>

                      {user.id !== currentUser?.id && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                        >
                          <Ionicons name="trash" size={16} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Create User Modal */}
      <CreateUserModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadUsers();
        }}
        roles={roles}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  titleContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borders.radius.md,
    gap: spacing.sm,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: typography.fontWeights.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borders.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...borders.shadow,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: typography.h3,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
  },
  tableContainer: {
    padding: 0,
    overflow: 'hidden',
  },
  tableHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableTitle: {
    fontSize: typography.h4,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  table: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
    minHeight: 60,
  },
  evenRow: {
    backgroundColor: colors.white,
  },
  oddRow: {
    backgroundColor: colors.backgroundSecondary + '40',
  },
  currentUserRow: {
    backgroundColor: colors.primary + '10',
  },
  nameColumn: {
    flex: 3,
    paddingRight: spacing.md,
  },
  roleColumn: {
    flex: 1.5,
    paddingRight: spacing.md,
  },
  statusColumn: {
    flex: 1.2,
    paddingRight: spacing.md,
  },
  lastLoginColumn: {
    flex: 2,
    paddingRight: spacing.md,
  },
  actionsColumn: {
    width: 100,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  currentUserTag: {
    fontSize: typography.bodySm,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  userEmail: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borders.radius.sm,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borders.radius.sm,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.bodySm,
    fontWeight: typography.fontWeights.medium,
  },
  lastLoginText: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borders.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
  },
});

export default UserManagementScreen;