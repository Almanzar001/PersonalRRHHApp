import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Statistics {
  totalPersonal: number;
  personalAsignado: number;
  mandatariosActivos: number;
  equiposCompletos: number;
  equiposIncompletos: number;
  totalGrupos: number;
  totalFunciones: number;
  asignacionesActivas: number;
  eficiencia: number;
  // Nuevas métricas por institución
  miembrosERD: number;
  miembrosARD: number;
  miembrosFARD: number;
  miembrosPN: number;
  miembrosMIDE: number;
  loading: boolean;
  error: string | null;
}

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<Statistics>({
    totalPersonal: 0,
    personalAsignado: 0,
    mandatariosActivos: 0,
    equiposCompletos: 0,
    equiposIncompletos: 0,
    totalGrupos: 0,
    totalFunciones: 0,
    asignacionesActivas: 0,
    eficiencia: 0,
    // Inicializar nuevas métricas por institución
    miembrosERD: 0,
    miembrosARD: 0,
    miembrosFARD: 0,
    miembrosPN: 0,
    miembrosMIDE: 0,
    loading: true,
    error: null,
  });

  const fetchStatistics = async () => {
    try {
      setStatistics(prev => ({ ...prev, loading: true, error: null }));

      // Usar vistas optimizadas para obtener totales básicos
      const [
        totalPersonalResult,
        totalMandatariosResult,
        gruposResult,
        funcionesResult,
        asignacionesResult,
        personalPorInstitucionResult
      ] = await Promise.all([
        // 1. Total de Personal (usando vista personal_total)
        supabase.from('personal_total').select('*').single(),

        // 2. Total de Mandatarios (usando vista existente)
        supabase.from('total_mandatarios').select('*').single(),

        // 3. Total de Grupos (consulta simple)
        supabase.from('grupos').select('id'),

        // 4. Total de Funciones (consulta simple)
        supabase.from('funciones').select('id'),

        // 5. Asignaciones activas (consulta simple)
        supabase.from('asignaciones').select('id'),

        // 6. Personal por institución (usando vista)
        supabase.from('vista_personal_por_institucion').select('*')
      ]);

      // Verificar errores en las consultas principales
      if (totalPersonalResult.error) throw totalPersonalResult.error;
      if (totalMandatariosResult.error) throw totalMandatariosResult.error;
      if (gruposResult.error) throw gruposResult.error;
      if (funcionesResult.error) throw funcionesResult.error;
      if (personalPorInstitucionResult.error) throw personalPorInstitucionResult.error;

      // Asignaciones pueden no existir, no lanzar error
      const asignacionesCount = asignacionesResult.error ? 0 : (asignacionesResult.data?.length || 0);

      // 6. Estado de equipos y personal asignado (usando vistas optimizadas)
      const [estadoEquiposResult, personalAsignadoResult] = await Promise.all([
        // Estado de equipos (usando vista existente)
        supabase.from('vista_estado_equipos').select('estado'),

        // Personal asignado (consulta optimizada con DISTINCT)
        supabase.from('asignaciones').select('personal_id').not('personal_id', 'is', null)
      ]);

      if (estadoEquiposResult.error) throw estadoEquiposResult.error;

      // Calcular equipos completos e incompletos desde la vista
      const equiposCompletos = estadoEquiposResult.data?.filter(item =>
        item.estado === '✅ Completo'
      ).length || 0;

      const equiposIncompletos = estadoEquiposResult.data?.filter(item =>
        item.estado === '⚠️ Incompleto'
      ).length || 0;

      // Calcular personal asignado (IDs únicos)
      let personalAsignado = 0;
      if (!personalAsignadoResult.error && personalAsignadoResult.data) {
        const uniquePersonalIds = new Set(personalAsignadoResult.data.map(item => item.personal_id));
        personalAsignado = uniquePersonalIds.size;
      }

      // Obtener totales desde las vistas
      const totalPersonal = totalPersonalResult.data?.total_personal || 0;
      const totalMandatarios = totalMandatariosResult.data?.total_mandatarios || 0;

      // Procesar datos por institución usando la vista
      const personalPorInstitucion = personalPorInstitucionResult.data || [];

      const miembrosERD = personalPorInstitucion.find((item: any) => item.institucion === 'ERD')?.total_personal || 0;
      const miembrosARD = personalPorInstitucion.find((item: any) => item.institucion === 'ARD')?.total_personal || 0;
      const miembrosFARD = personalPorInstitucion.find((item: any) => item.institucion === 'FARD')?.total_personal || 0;
      const miembrosPN = personalPorInstitucion.find((item: any) => item.institucion === 'PN')?.total_personal || 0;
      const miembrosMIDE = personalPorInstitucion.find((item: any) => item.institucion === 'MIDE')?.total_personal || 0;

      // Calcular eficiencia (equipos completos / total mandatarios * 100)
      const eficiencia = totalMandatarios > 0
        ? Math.round((equiposCompletos / totalMandatarios) * 100)
        : 0;

      setStatistics({
        totalPersonal,
        personalAsignado,
        mandatariosActivos: totalMandatarios,
        equiposCompletos,
        equiposIncompletos,
        totalGrupos: gruposResult.data?.length || 0,
        totalFunciones: funcionesResult.data?.length || 0,
        asignacionesActivas: asignacionesCount,
        eficiencia,
        // Agregar las nuevas métricas por institución
        miembrosERD,
        miembrosARD,
        miembrosFARD,
        miembrosPN,
        miembrosMIDE,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    ...statistics,
    refetch: fetchStatistics,
  };
};
