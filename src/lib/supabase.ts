import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// --------------------------------------------------
//           CONFIGURACIÓN DE SUPABASE
// --------------------------------------------------

// 🔄 REEMPLAZA ESTAS URLS CON LAS CORRECTAS DE TU PROYECTO SUPABASE
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// --- No modifiques el resto del archivo ---

if (!supabaseUrl || supabaseUrl.includes('TU_SUPABASE_URL') || !supabaseAnonKey || supabaseAnonKey.includes('TU_SUPABASE_ANON_KEY')) {
  // Esta comprobación es una salvaguarda, pero la conexión principal ya está configurada.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);