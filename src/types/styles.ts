// --------------------------------------------------
//           Tipos para Estilos y Temas
// --------------------------------------------------

// Colores del tema
export interface Colors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  backgroundSecondary: string;
  white: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  text: string; // Alias para textPrimary
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
  borderLight: string;
}

// Sombras
export interface Shadows {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  button: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

// Interfaz para elementos de navegación
export interface NavigationItem {
  title: string;
  route: string;
  icon: string;
  isActive?: boolean;
}
