import { Stack } from 'expo-router';

export default function MandatariosLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Estado de Mandatarios' }} />
      <Stack.Screen name="add" options={{ title: 'Agregar Mandatario' }} />
      <Stack.Screen name="edit" options={{ title: 'Editar Mandatario', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Equipo del Mandatario' }} />
    </Stack>
  );
}
