import React, { useState } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, borders } from '../../styles/theme';

interface Document {
  id: string;
  subject: string;
  file_name: string;
  file_url: string;
  file_size: number;
  upload_date: string;
}

// Datos de ejemplo offline
const initialDocuments: Document[] = [
  {
    id: '1',
    subject: 'Manual de Políticas RRHH 2025',
    file_name: 'manual_politicas_2025.pdf',
    file_url: '/uploads/manual_politicas_2025.pdf',
    file_size: 2048576,
    upload_date: new Date().toISOString()
  },
  {
    id: '2',
    subject: 'Reglamento Interno de Trabajo',
    file_name: 'reglamento_interno.pdf',
    file_url: '/uploads/reglamento_interno.pdf',
    file_size: 1536000,
    upload_date: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    subject: 'Procedimientos de Contratación',
    file_name: 'procedimientos_contratacion.pdf',
    file_url: '/uploads/procedimientos_contratacion.pdf',
    file_size: 3072000,
    upload_date: new Date(Date.now() - 172800000).toISOString()
  }
];

const DocumentsWidget: React.FC = () => {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    file: null as File | null,
  });

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

      // Simular subida offline
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newDocument: Document = {
        id: Date.now().toString(),
        subject: formData.subject.trim(),
        file_name: formData.file.name,
        file_url: `/uploads/${Date.now()}_${formData.file.name}`,
        file_size: formData.file.size,
        upload_date: new Date().toISOString()
      };

      setDocuments(prev => [newDocument, ...prev]);
      Alert.alert('Éxito', 'Documento subido exitosamente (modo offline)');
      setFormData({ subject: '', file: null });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Ocurrió un error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (doc: Document) => {
    Alert.alert('Descarga', `Descargando: ${doc.file_name}\n(Modo offline - simulado)`);
  };

  const handleView = (doc: Document) => {
    Alert.alert('Ver Documento', `Abriendo: ${doc.file_name}\n(Modo offline - simulado)`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documentos</Text>
        <View style={styles.headerActions}>
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
          {isAdmin && (
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
              <Text style={styles.modalTitle}>Subir Documento (Offline)</Text>
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
                  Modo offline: Los documentos se almacenarán localmente hasta que se configure la base de datos.
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
                    <Text style={styles.uploadButtonText}>Subir (Offline)</Text>
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
    padding: spacing.lg,
    margin: spacing.sm,
    ...borders.shadow,
    height: 400,
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
  offlineIndicator: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borders.radius.sm,
  },
  offlineText: {
    fontSize: typography.caption,
    color: colors.warning,
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
  scrollView: {
    flex: 1,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary + '40',
    borderRadius: borders.radius.sm,
    marginBottom: spacing.sm,
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
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borders.radius.sm,
    backgroundColor: colors.white,
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

export default DocumentsWidget;