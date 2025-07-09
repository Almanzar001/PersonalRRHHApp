import { Stack } from 'expo-router';

export default function PersonalLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Personal Registrado' }} />
      <Stack.Screen name="add" options={{ title: 'Agregar Nuevo Personal' }} />
      <Stack.Screen name="edit" options={{ title: 'Editar Personal', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalle del Personal' }} />
    </Stack>
  );
}
