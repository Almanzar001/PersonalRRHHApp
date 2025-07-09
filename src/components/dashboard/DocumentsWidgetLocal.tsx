import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, borders, getResponsiveSpacing } from '../../styles/theme';
import { useResponsive } from '../../hooks/useResponsive';

interface Document {
  id: string;
  subject: string;
  file_name: string;
  file_url: string;
  file_size: number;
  upload_date: string;
  file_data?: string; // Para almacenar el archivo como base64
}

const DocumentsWidgetLocal: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  
  // TEMPORAL: Override para testing (cambiar a false para probar como usuario normal)
  const isAdminOverride = true; // Cambiar a false para probar permisos
  const effectiveIsAdmin = isAdminOverride || isAdmin;
  
  console.log('🔐 Estado de permisos:', { 
    isAdmin, 
    isAdminOverride, 
    effectiveIsAdmin 
  });
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      console.log('📋 Cargando documentos desde la base de datos...');
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('❌ Error loading documents:', error);
        Alert.alert('Error', 'No se pudieron cargar los documentos');
        return;
      }

      console.log('✅ Documentos cargados:', data?.length || 0);
      console.log('📄 Documentos:', data);
      setDocuments(data || []);
    } catch (error) {
      console.error('❌ Error loading documents:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        Alert.alert('Error', 'Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        Alert.alert('Error', 'El archivo no puede ser mayor a 10MB');
        return;
      }
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    // Verificar permisos de administrador
    if (!effectiveIsAdmin) {
      Alert.alert('Error', 'Solo los administradores pueden subir documentos');
      return;
    }

    if (!formData.subject.trim()) {
      Alert.alert('Error', 'El asunto es requerido');
      return;
    }

    if (!formData.file) {
      Alert.alert('Error', 'Selecciona un archivo PDF');
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Iniciando subida de documento...');

      // Convertir archivo a base64 para almacenamiento
      const fileData = await fileToBase64(formData.file);
      
      // Guardar en la base de datos con archivo codificado
      const { data, error } = await supabase
        .from('documents')
        .insert({
          subject: formData.subject.trim(),
          file_name: formData.file.name,
          file_url: fileData, // Guardar el archivo como base64
          file_size: formData.file.size
        })
        .select();

      if (error) {
        console.error('❌ Error saving document:', error);
        Alert.alert('Error', `No se pudo guardar el documento: ${error.message}`);
        return;
      }

      console.log('✅ Documento guardado exitosamente:', data[0]?.id);
      Alert.alert('Éxito', 'Documento subido exitosamente');
      
      setFormData({ subject: '', file: null });
      setIsModalOpen(false);
      await loadDocuments();
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      Alert.alert('Error', 'Ocurrió un error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDownload = async (doc: Document) => {
    try {
      console.log('📥 Descargando documento:', doc.file_name);
      
      if (Platform.OS === 'web') {
        // Crear enlace de descarga desde base64
        const link = document.createElement('a');
        link.href = doc.file_url; // Ya contiene el base64
        link.download = doc.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert('Descarga', `Iniciando descarga: ${doc.file_name}`);
      }
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      Alert.alert('Error', 'No se pudo descargar el documento');
    }
  };

  const handleView = (doc: Document) => {
    try {
      console.log('👁️ Abriendo documento:', doc.file_name);
      
      if (Platform.OS === 'web') {
        // Abrir PDF desde base64 en nueva ventana
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${doc.file_name}</title>
                <style>
                  body { margin: 0; padding: 0; }
                  iframe { width: 100%; height: 100vh; border: none; }
                </style>
              </head>
              <body>
                <iframe src="${doc.file_url}" type="application/pdf"></iframe>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      }
    } catch (error) {
      console.error('❌ Error viewing document:', error);
      Alert.alert('Error', 'No se pudo abrir el documento');
    }
  };

  const handleDelete = async (doc: Document) => {
    console.log('🗑️ Iniciando eliminación:', doc.id, doc.subject);
    
    // Verificar permisos
    if (!effectiveIsAdmin) {
      console.log('❌ Permisos insuficientes');
      alert('Error: Solo los administradores pueden eliminar documentos');
      return;
    }

    // Confirmación nativa del navegador
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar "${doc.subject}"?`);
    
    if (!confirmed) {
      console.log('🚫 Usuario canceló eliminación');
      return;
    }

    console.log('✅ Usuario confirmó eliminación');
    
    try {
      console.log('📡 Enviando DELETE a Supabase...');
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (error) {
        console.error('❌ Error:', error);
        alert(`Error al eliminar: ${error.message}`);
        return;
      }

      console.log('✅ Eliminado exitosamente');
      alert('Documento eliminado exitosamente');
      
      await loadDocuments();
      console.log('✅ Lista recargada');
      
    } catch (error) {
      console.error('❌ Error general:', error);
      alert('Error al eliminar el documento');
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetForm = () => {
    setFormData({ subject: '', file: null });
  };

  const handleCloseModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Documentos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando documentos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documentos</Text>
        <View style={styles.headerActions}>
          <View style={styles.statusIndicator}>
            <Text style={styles.statusText}>DB CONECTADA</Text>
          </View>
          <View style={styles.roleIndicator}>
            <Text style={styles.roleText}>{effectiveIsAdmin ? 'ADMIN' : 'USER'}</Text>
          </View>
          {effectiveIsAdmin && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsModalOpen(true)}
            >
              <Ionicons name="add" size={16} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {documents.length > 0 ? (
          documents.map((doc) => (
            <View key={doc.id} style={styles.documentItem}>
              <View style={styles.documentIcon}>
                <Ionicons name="document-text" size={24} color={colors.error} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentSubject} numberOfLines={2}>
                  {doc.subject}
                </Text>
                <Text style={styles.documentFileName} numberOfLines={1}>
                  {doc.file_name}
                </Text>
                <View style={styles.documentMeta}>
                  <Text style={styles.metaText}>{formatDate(doc.upload_date)}</Text>
                  <Text style={styles.metaText}>•</Text>
                  <Text style={styles.metaText}>{formatFileSize(doc.file_size)}</Text>
                </View>
              </View>
              <View style={styles.documentActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleView(doc)}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDownload(doc)}
                >
                  <Ionicons name="download-outline" size={18} color={colors.success} />
                </TouchableOpacity>
                {effectiveIsAdmin && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(doc)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay documentos disponibles.</Text>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Subir Documento</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Asunto *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.subject}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, subject: text }))}
                  placeholder="Describe el documento..."
                  multiline
                  numberOfLines={2}
                  editable={!uploading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Archivo PDF *</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.fileInputContainer}>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      style={styles.fileInput}
                      disabled={uploading}
                    />
                    {formData.file && (
                      <View style={styles.selectedFile}>
                        <Ionicons name="document-text" size={16} color={colors.success} />
                        <Text style={styles.selectedFileName}>{formData.file.name}</Text>
                        <Text style={styles.selectedFileSize}>
                          ({formatFileSize(formData.file.size)})
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.webOnlyText}>
                    La subida de archivos solo está disponible en navegadores web
                  </Text>
                )}
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.infoText}>
                  Solo los administradores pueden subir documentos. Los archivos se guardan en la base de datos.
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
                disabled={uploading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading || !formData.file || !formData.subject.trim()}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color={colors.white} />
                    <Text style={styles.uploadButtonText}>Subir</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borders.radius.md,
    padding: getResponsiveSpacing(spacing.lg, false, false),
    margin: getResponsiveSpacing(spacing.sm, false, false),
    ...borders.shadow,
    height: 400,
    flex: 1,
    minWidth: 250,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h4,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusIndicator: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borders.radius.sm,
  },
  statusText: {
    fontSize: typography.caption,
    color: colors.success,
    fontWeight: typography.fontWeights.bold,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSpacing(spacing.md, false, false),
    backgroundColor: colors.backgroundSecondary + '40',
    borderRadius: borders.radius.sm,
    marginBottom: getResponsiveSpacing(spacing.sm, false, false),
    minHeight: 60,
  },
  documentIcon: {
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentSubject: {
    fontSize: typography.body,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  documentFileName: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  documentActions: {
    flexDirection: 'row',
    gap: getResponsiveSpacing(spacing.xs, false, false),
    minWidth: 120,
  },
  actionButton: {
    padding: getResponsiveSpacing(spacing.sm, false, false),
    borderRadius: borders.radius.sm,
    backgroundColor: colors.white,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  roleIndicator: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borders.radius.sm,
  },
  roleText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xl,
  },
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
  modalBody: {
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
    textAlignVertical: 'top',
  },
  fileInputContainer: {
    marginTop: spacing.sm,
  },
  fileInput: {
    width: '100%',
    padding: spacing.md,
    border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.md,
    fontSize: typography.body,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.success + '10',
    borderRadius: borders.radius.sm,
    gap: spacing.xs,
  },
  selectedFileName: {
    fontSize: typography.bodySm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
  },
  selectedFileSize: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  webOnlyText: {
    fontSize: typography.bodySm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borders.radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    gap: spacing.sm,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borders.radius.md,
    gap: spacing.sm,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: typography.body,
    color: colors.white,
    fontWeight: typography.fontWeights.semibold,
  },
});

export default DocumentsWidgetLocal;