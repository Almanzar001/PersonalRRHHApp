// Configuración global de animaciones y transiciones
export const animations = {
  // Duraciones
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
  
  // Timing functions
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Clases de Tailwind para transiciones comunes
  classes: {
    button: 'transition-all duration-200 ease-in-out',
    card: 'transition-shadow duration-200 ease-in-out',
    color: 'transition-colors duration-200 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out',
    opacity: 'transition-opacity duration-200 ease-in-out',
  },
  
  // Estados de hover/active
  states: {
    hover: {
      scale: 'hover:scale-105',
      shadow: 'hover:shadow-app-card-hover',
      opacity: 'hover:opacity-80',
    },
    active: {
      scale: 'active:scale-95',
      opacity: 'active:opacity-70',
    },
  },
};

export default animations;
