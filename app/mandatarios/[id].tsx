import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Appbar, Card, Title, Paragraph, ActivityIndicator, Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Asignacion, EquipoRequerido } from '../../src/types/types';

const EquipoMandatarioScreen = () => {
  const { id } = useLocalSearchParams();
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [equipoRequerido, setEquipoRequerido] = useState<EquipoRequerido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEquipo = async () => {
      setLoading(true);
      // Obtener asignaciones actuales
      const { data: asignacionesData, error: asignacionesError } = await supabase
        .from('asignaciones')
        .select('*, personal(nombre), funciones(nombre)')
        .eq('mandatario_id', id);

      // Obtener equipo requerido
      const { data: requeridoData, error: requeridoError } = await supabase
        .from('equipo_requerido')
        .select('*, funciones(nombre)')
        .eq('mandatario_id', id);

      if (asignacionesError) console.error('Error fetching asignaciones:', asignacionesError);
      if (requeridoError) console.error('Error fetching equipo requerido:', requeridoError);

      if (asignacionesData) setAsignaciones(asignacionesData as Asignacion[]);
      if (requeridoData) setEquipoRequerido(requeridoData as any[]); // any para evitar líos con el join

      setLoading(false);
    };

    fetchEquipo();
  }, [id]);

  const funcionesCubiertasIds = new Set(asignaciones.map(a => a.funcion_id));
  const funcionesFaltantes = equipoRequerido.filter(r => !funcionesCubiertasIds.has(r.funcion_id));

  if (loading) {
    return <ActivityIndicator animating={true} style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Personal Asignado</Title>
          {asignaciones.length === 0 ? (
            <Paragraph>No hay personal asignado a este mandatario.</Paragraph>
          ) : (
            asignaciones.map(asig => (
              <Paragraph key={asig.id}>{asig.funciones?.nombre}: {asig.personal?.nombre}</Paragraph>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Funciones Faltantes</Title>
          {funcionesFaltantes.length === 0 ? (
            <Paragraph style={{color: 'green'}}>¡Equipo completo!</Paragraph>
          ) : (
            funcionesFaltantes.map(req => (
              <Paragraph key={req.id} style={{color: 'red'}}>{(req as any).funciones.nombre}</Paragraph>
            ))
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default EquipoMandatarioScreen;
