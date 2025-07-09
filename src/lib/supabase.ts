import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// --------------------------------------------------
//           CONFIGURACIÓN DE SUPABASE
// --------------------------------------------------

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Log para verificar que las variables se carguen correctamente
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase URL:', supabaseUrl ? '✅ Configured' : '❌ Missing');
  console.log('🔑 Supabase Key:', supabaseAnonKey ? '✅ Configured' : '❌ Missing');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);