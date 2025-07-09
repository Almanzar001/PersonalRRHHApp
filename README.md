# PersonalRRHHApp - Cliente

Esta es la aplicación cliente de PersonalRRHHApp, desarrollada con React Native y Expo.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 18.0.0
- npm >= 8.0.0
- Expo CLI >= 6.0.0

### Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   Edita `.env.local` con tus credenciales de Supabase.

3. **Ejecutar la aplicación**
   ```bash
   # Desarrollo
   npm start
   
   # Web
   npm run web
   
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 📁 Estructura del Proyecto

```
client/
├── app/                    # Rutas de la aplicación (Expo Router)
│   ├── (tabs)/            # Rutas con tabs
│   ├── dashboard/         # Pantalla de dashboard
│   ├── personal/          # Gestión de personal
│   └── _layout.tsx        # Layout principal
├── src/                   # Código fuente
│   ├── components/        # Componentes reutilizables
│   ├── contexts/          # Contextos de React
│   ├── hooks/             # Hooks personalizados
│   ├── lib/               # Utilidades y configuración
│   ├── styles/            # Estilos globales
│   └── types/             # Definiciones de TypeScript
├── assets/                # Recursos estáticos
├── scripts/               # Scripts de utilidad
└── database/              # Scripts SQL (movidos desde aquí)
```

## 🛠️ Tecnologías

- **React Native** con Expo
- **TypeScript** para tipado estático
- **Expo Router** para navegación
- **NativeWind** para estilos (Tailwind CSS)
- **Supabase** como backend
- **React Native Paper** para componentes UI

## 🔧 Configuración

### Variables de Entorno
Crea un archivo `.env.local` basado en `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
```

### Tailwind CSS
La configuración de Tailwind está en `tailwind.config.js` con colores y estilos personalizados para la aplicación.

## 📱 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run web` - Ejecuta en navegador web
- `npm run ios` - Ejecuta en simulador iOS
- `npm run android` - Ejecuta en emulador Android
- `npm test` - Ejecuta las pruebas

## 🧪 Testing

```bash
npm test
```

## 📦 Build para Producción

```bash
# Web
npm run build:web

# Móvil (requiere EAS CLI)
eas build --platform android
eas build --platform ios
```

## 🔒 Seguridad

- Las credenciales están en variables de entorno
- No incluir archivos `.env.local` en el repositorio
- Los archivos de prueba y desarrollo han sido removidos

## 📄 Notas

- Los archivos SQL de desarrollo han sido movidos a `/database/`
- Los scripts con credenciales hardcodeadas han sido removidos
- El proyecto está listo para deployment en GitHub
