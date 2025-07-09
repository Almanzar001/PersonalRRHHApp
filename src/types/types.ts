// --------------------------------------------------
//           Tipos de Datos de la Aplicación
// --------------------------------------------------

import { Ionicons } from '@expo/vector-icons';

// Tipo para iconos de Ionicons
export type IoniconsName = keyof typeof Ionicons.glyphMap;

// Basado en la tabla 'grupos'
export interface Grupo {
  id: number;
  nombre: string;
}

// Basado en la tabla 'funciones'
export interface Funcion {
  id: number;
  nombre: string;
}

// Basado en la tabla 'personal'
export interface Personal {
  id: string; // uuid
  nombres: string; // Nombres del personal
  apellidos?: string; // Apellidos del personal (campo legacy)
  Apellidos?: string; // Apellidos del personal (campo actual en BD)
  cedula: string;
  rango?: string;
  genero?: string;
  nacionalidad?: string;
  telefono?: string;
  institucion?: string;
  grupo_id?: number;
  foto_url?: string;
  // Relaciones
  grupos?: Grupo;
}

// Basado en la tabla 'mandatarios'
export interface Mandatario {
  id: number;
  nombre: string;
  pais: string;
}

// Basado en la tabla 'asignaciones'
export interface Asignacion {
  id: number;
  personal_id: string;
  funcion_id: number;
  mandatario_id?: number;
  // Relaciones
  personal?: Personal;
  funciones?: Funcion;
  mandatarios?: Mandatario;
}

// Basado en la tabla 'equipo_requerido'
export interface EquipoRequerido {
  id: number;
  mandatario_id: number;
  funcion_id: number;
}

// Para la vista 'vista_estado_equipos'
export interface EstadoEquipo {
  mandatario_id: number;
  mandatario_nombre: string;
  pais: string;
  funciones_requeridas: number;
  funciones_asignadas: number;
  estado: '✅ Completo' | '⚠️ Incompleto';
}

// Interfaz para actividades del dashboard
export interface Activity {
  id: string;
  title: string;
  subtitle: string;
  icon: IoniconsName;
  color: string;
  time: string;
}

// Interfaz para reportes
export interface Report {
  id: string;
  title: string;
  description: string;
  icon: IoniconsName;
  color: string;
}
