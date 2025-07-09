import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, borders, getResponsiveSpacing } from '../../styles/theme';
import { supabase } from '../../lib/supabase';
import { useResponsive } from '../../hooks/useResponsive';

interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminder_date: string; // ISO string format
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

const RemindersWidget: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarModalOpen, setCalendarModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderPriority, setReminderPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Load reminders from database
  const loadReminders = async () => {
    try {
      console.log('🔄 Loading reminders...');
      setLoading(true);
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('is_completed', false)
        .order('reminder_date', { ascending: true });

      console.log('📊 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Error loading reminders:', error);
        Alert.alert('Error', 'No se pudieron cargar los recordatorios: ' + error.message);
        return;
      }

      console.log('✅ Reminders loaded:', data?.length || 0, 'items');
      setReminders(data || []);
    } catch (error) {
      console.error('💥 Catch error loading reminders:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar los recordatorios');
    } finally {
      setLoading(false);
    }
  };

  // Load reminders on component mount
  useEffect(() => {
    console.log('🎯 RemindersWidget mounted, starting to load reminders...');
    loadReminders();
  }, []);

  const getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  // Recordatorios ordenados por fecha
  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());
  }, [reminders]);

  const handleAddNewClick = () => {
    setEditingReminder(null);
    setReminderTitle('');
    setReminderDescription('');
    setReminderPriority('medium');
    setReminderDate('');
    setReminderTime('');
    setIsModalOpen(true);
  };

  const handleDateChange = (dateValue: string) => {
    setReminderDate(dateValue);
  };

  const handleTimeChange = (timeValue: string) => {
    setReminderTime(timeValue);
  };

  const handleEditClick = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setReminderTitle(reminder.title);
    setReminderDescription(reminder.description || '');
    setReminderPriority(reminder.priority);
    
    // Parse the date and time from the reminder_date
    const reminderDate = new Date(reminder.reminder_date);
    const dateStr = reminderDate.toISOString().split('T')[0];
    const timeStr = reminderDate.toTimeString().slice(0, 5);
    
    setReminderDate(dateStr);
    setReminderTime(timeStr);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (idToDelete: string) => {
    const onConfirm = async () => {
      try {
        const { error } = await supabase
          .from('reminders')
          .delete()
          .eq('id', idToDelete);

        if (error) {
          console.error('Error deleting reminder:', error);
          Alert.alert('Error', 'No se pudo eliminar el recordatorio');
          return;
        }

        await loadReminders(); // Refresh the list
        Alert.alert('Éxito', 'Recordatorio eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting reminder:', error);
        Alert.alert('Error', 'Ocurrió un error al eliminar el recordatorio');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que quieres eliminar este recordatorio?')) {
        onConfirm();
      }
    } else {
      Alert.alert(
        'Eliminar Recordatorio',
        '¿Estás seguro de que quieres eliminar este recordatorio?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            onPress: onConfirm,
            style: 'destructive',
          },
        ]
      );
    }
  };

  const handleSaveReminder = async () => {
    if (reminderTitle.trim() === '' || reminderDate === '' || reminderTime === '') {
      Alert.alert('Error', 'Por favor, completa todos los campos: título, fecha y hora.');
      return;
    }

    try {
      // Ensure time has seconds if not provided
      const timeWithSeconds = reminderTime.includes(':') && reminderTime.split(':').length === 2 
        ? `${reminderTime}:00` 
        : reminderTime;
      
      // Create proper ISO date format
      const dateTime = new Date(`${reminderDate}T${timeWithSeconds}`);
      const reminderDateTime = dateTime.toISOString();

      if (editingReminder) {
        // Update existing reminder
        const { error } = await supabase
          .from('reminders')
          .update({
            title: reminderTitle,
            description: reminderDescription,
            reminder_date: reminderDateTime,
            priority: reminderPriority,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReminder.id);

        if (error) {
          console.error('Error updating reminder:', error);
          Alert.alert('Error', 'No se pudo actualizar el recordatorio');
          return;
        }
      } else {
        // Create new reminder
        const { error } = await supabase
          .from('reminders')
          .insert({
            title: reminderTitle,
            description: reminderDescription,
            reminder_date: reminderDateTime,
            priority: reminderPriority,
            is_completed: false
          });

        if (error) {
          console.error('Error creating reminder:', error);
          Alert.alert('Error', 'No se pudo crear el recordatorio');
          return;
        }
      }

      await loadReminders(); // Refresh the list
      setIsModalOpen(false);
      Alert.alert('Éxito', editingReminder ? 'Recordatorio actualizado' : 'Recordatorio creado exitosamente');
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar el recordatorio');
    }
  };

  const handleCompleteReminder = async (idToComplete: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ 
          is_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', idToComplete);

      if (error) {
        console.error('Error completing reminder:', error);
        Alert.alert('Error', 'No se pudo marcar el recordatorio como completado');
        return;
      }

      await loadReminders(); // Refresh the list
    } catch (error) {
      console.error('Error completing reminder:', error);
      Alert.alert('Error', 'Ocurrió un error al completar el recordatorio');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long' 
    });
    const formattedTime = date.toLocaleTimeString('es-ES', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    return { date: formattedDate, time: formattedTime };
  };

  // Lógica del calendario
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const changeMonth = (offset: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
    setSelectedDate(null);
  };

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid: Array<{ key: string; day?: number; date?: Date; hasReminders?: boolean; empty?: boolean }> = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push({ key: `empty-${i}`, empty: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      const hasReminders = reminders.some(r => r.reminder_date.startsWith(dateString));
      grid.push({ key: dateString, day, date, hasReminders });
    }
    
    return grid;
  }, [currentDate, reminders]);

  const remindersForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = selectedDate.toISOString().split('T')[0];
    return reminders
      .filter(r => r.reminder_date.startsWith(dateString))
      .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());
  }, [selectedDate, reminders]);

  console.log('🎨 Rendering RemindersWidget:', { 
    loading, 
    remindersCount: reminders.length, 
    sortedRemindersCount: sortedReminders.length,
    isAdmin,
    userId: user?.id
  });

  // Si no es admin, mostrar mensaje de acceso restringido
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recordatorios</Text>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.accessDeniedTitle}>Acceso Restringido</Text>
          <Text style={styles.accessDeniedText}>
            Solo los administradores pueden ver y gestionar recordatorios.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Recordatorios</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <ScrollView style={styles.remindersList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.emptyText}>Cargando recordatorios...</Text>
        ) : sortedReminders.length > 0 ? (
          sortedReminders.slice(0, 3).map(reminder => {
            const { date, time } = formatDateTime(reminder.reminder_date);
            return (
              <View key={reminder.id} style={styles.reminderItem}>
                <View style={styles.reminderContent}>
                  <View style={styles.reminderHeader}>
                    <Text style={styles.reminderText}>{reminder.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(reminder.priority) + '20' }]}>
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(reminder.priority) }]} />
                    </View>
                  </View>
                  {reminder.description && (
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>
                  )}
                  <View style={styles.reminderMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{date}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{time}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reminderActions}>
                  <TouchableOpacity
                    onPress={() => handleCompleteReminder(reminder.id)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="checkmark-outline" size={18} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEditClick(reminder)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteClick(reminder.id)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No hay recordatorios pendientes.</Text>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleAddNewClick} style={styles.addButton}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setCalendarModalOpen(true)} 
          style={styles.calendarButton}
        >
          <Ionicons name="calendar" size={20} color="#374151" />
          <Text style={styles.calendarButtonText}>Calendario</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para Agregar/Editar */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingReminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Título</Text>
                <TextInput
                  style={styles.textInput}
                  value={reminderTitle}
                  onChangeText={setReminderTitle}
                  placeholder="Ej: Preparar reunión de onboarding"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción (opcional)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={reminderDescription}
                  onChangeText={setReminderDescription}
                  placeholder="Detalles adicionales del recordatorio..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Prioridad</Text>
                <View style={styles.priorityContainer}>
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        reminderPriority === priority && styles.priorityButtonSelected,
                        { borderColor: getPriorityColor(priority) }
                      ]}
                      onPress={() => setReminderPriority(priority)}
                    >
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                      <Text style={[
                        styles.priorityText,
                        reminderPriority === priority && styles.priorityTextSelected
                      ]}>
                        {priority === 'low' ? 'Baja' : priority === 'medium' ? 'Media' : 'Alta'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.dateTimeContainer}>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.inputLabel}>Fecha</Text>
                  <TextInput
                    style={styles.textInput}
                    value={reminderDate}
                    onChangeText={handleDateChange}
                    placeholder="YYYY-MM-DD"
                    // @ts-ignore - Web-specific props
                    type={Platform.OS === 'web' ? 'date' : undefined}
                  />
                </View>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.inputLabel}>Hora</Text>
                  <TextInput
                    style={styles.textInput}
                    value={reminderTime}
                    onChangeText={handleTimeChange}
                    placeholder="HH:MM"
                    // @ts-ignore - Web-specific props
                    type={Platform.OS === 'web' ? 'time' : undefined}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveReminder}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Modal del Calendario */}
      <Modal
        visible={isCalendarModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
                <Ionicons name="chevron-back" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
                <Ionicons name="chevron-forward" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <Text key={index} style={styles.dayHeader}>{day}</Text>
              ))}

              {calendarGrid.map(cell => (
                <View key={cell.key} style={styles.calendarCell}>
                  {!cell.empty && (
                    <TouchableOpacity
                      onPress={() => setSelectedDate(cell.date!)}
                      style={[
                        styles.dayButton,
                        cell.hasReminders && styles.dayWithReminders,
                        selectedDate?.toISOString().split('T')[0] === cell.key && styles.selectedDay
                      ]}
                    >
                      <Text style={[
                        styles.dayText,
                        cell.hasReminders && styles.dayWithRemindersText,
                        selectedDate?.toISOString().split('T')[0] === cell.key && styles.selectedDayText
                      ]}>
                        {cell.day}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {selectedDate && (
              <View style={styles.selectedDateInfo}>
                <Text style={styles.selectedDateTitle}>
                  Recordatorios para el {formatDateTime(selectedDate.toISOString()).date}:
                </Text>
                {remindersForSelectedDate.length > 0 ? (
                  <ScrollView style={styles.selectedDateReminders}>
                    {remindersForSelectedDate.map(r => (
                      <View key={r.id} style={styles.selectedDateReminderItem}>
                        <Text style={styles.selectedDateReminderText}>{r.title}</Text>
                        <Text style={styles.selectedDateReminderTime}>
                          {formatDateTime(r.reminder_date).time}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noRemindersText}>
                    No hay recordatorios para este día.
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              onPress={() => setCalendarModalOpen(false)}
              style={styles.closeCalendarButton}
            >
              <Text style={styles.closeCalendarButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: getResponsiveSpacing(20, false, false),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 250,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: 'bold',
  },
  accessDeniedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  accessDeniedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  remindersList: {
    maxHeight: 200,
    minHeight: 120,
  },
  reminderItem: {
    backgroundColor: '#F9FAFB',
    padding: getResponsiveSpacing(12, false, false),
    borderRadius: 8,
    marginBottom: getResponsiveSpacing(8, false, false),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
  },
  reminderContent: {
    flex: 1,
    marginRight: 8,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reminderText: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
    flex: 1,
  },
  reminderDescription: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: spacing.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reminderMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaText: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    marginLeft: 4,
  },
  reminderActions: {
    flexDirection: 'row',
    gap: getResponsiveSpacing(8, false, false),
    minWidth: 100,
  },
  actionButton: {
    padding: getResponsiveSpacing(8, false, false),
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 32,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  calendarButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButtonText: {
    color: '#374151',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
    gap: 6,
  },
  priorityButtonSelected: {
    backgroundColor: '#F3F4F6',
  },
  priorityText: {
    fontSize: 14,
    color: '#6B7280',
  },
  priorityTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputGroup: {
    flex: 1,
  },
  timeInputGroup: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Calendar modal styles
  calendarModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    paddingVertical: 8,
  },
  calendarCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayWithReminders: {
    backgroundColor: '#EDE9FE',
  },
  selectedDay: {
    backgroundColor: '#7C3AED',
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
  },
  dayWithRemindersText: {
    color: '#7C3AED',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedDateInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedDateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  selectedDateReminders: {
    maxHeight: 120,
  },
  selectedDateReminderItem: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateReminderText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
  },
  selectedDateReminderTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  noRemindersText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  closeCalendarButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  closeCalendarButtonText: {
    color: '#374151',
    fontWeight: 'bold',
  },
});

export default RemindersWidget;