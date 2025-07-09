import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Tipos
interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Proveedor de autenticación
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Derivados
  const isAuthenticated = !!user;
  const isAdmin = user?.role_name === 'admin';

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    checkStoredSession();
  }, []);

  const checkStoredSession = async () => {
    try {
      // Limpiar siempre la sesión al cargar la página
      await AsyncStorage.removeItem('session_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateStoredSession = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_session', {
        session_token: token
      });

      if (error) {
        console.error('Session validation error:', error);
        await clearSession();
        return;
      }

      if (data && data.length > 0) {
        const userData = data[0];
        setUser({
          id: userData.user_id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role_name: userData.role_name,
          is_active: userData.is_active
        });
      } else {
        await clearSession();
      }
    } catch (error) {
      console.error('Error validating session:', error);
      await clearSession();
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      // Validar credenciales
      const { data: loginData, error: loginError } = await supabase.rpc('validate_user_login', {
        user_email: email.trim().toLowerCase(),
        user_password: password
      });

      if (loginError) {
        console.error('Login error:', loginError);
        return { success: false, error: 'Error del servidor. Intenta nuevamente.' };
      }

      if (!loginData || loginData.length === 0) {
        return { success: false, error: 'Email o contraseña incorrectos.' };
      }

      const userData = loginData[0];

      if (!userData.is_active) {
        return { success: false, error: 'Cuenta desactivada. Contacta al administrador.' };
      }

      // Crear sesión
      const { data: sessionData, error: sessionError } = await supabase.rpc('create_user_session', {
        user_id: userData.user_id,
        session_duration_hours: 24
      });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return { success: false, error: 'Error creando sesión. Intenta nuevamente.' };
      }

      if (!sessionData || sessionData.length === 0) {
        return { success: false, error: 'Error creando sesión.' };
      }

      const session = sessionData[0];

      // Guardar token en AsyncStorage
      await AsyncStorage.setItem('session_token', session.session_token);

      // Actualizar estado del usuario
      setUser({
        id: userData.user_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_name: userData.role_name,
        is_active: userData.is_active
      });

      console.log('✅ Login successful for:', userData.email, 'Role:', userData.role_name);
      return { success: true };

    } catch (error) {
      console.error('Login catch error:', error);
      return { success: false, error: 'Error de conexión. Verifica tu internet.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        // Invalidar sesión en el servidor
        await supabase.rpc('logout_user', { session_token: token });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearSession();
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAdmin,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;