import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { Grupo } from '../../src/types/types';
import { Picker } from '@react-native-picker/picker'; // Necesitaremos instalar esta dependencia

const AddPersonalScreen = () => {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cedula, setCedula] = useState('');
  const [rango, setRango] = useState('');
  const [genero, setGenero] = useState('');
  const [telefono, setTelefono] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [grupoId, setGrupoId] = useState<number | undefined>();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGrupos = async () => {
      const { data, error } = await supabase.from('grupos').select('*');
      if (error) {
        console.error('Error fetching grupos:', error);
      } else {
        setGrupos(data as Grupo[]);
      }
    };
    fetchGrupos();
  }, []);

  const handleAddPersonal = async () => {
    if (!nombres || !cedula || !grupoId) {
      setError('Nombres, cédula y grupo son campos requeridos.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('personal').insert([
      {
        nombres,
        apellidos: apellidos || null,
        cedula,
        rango: rango || null,
        genero: genero || null,
        telefono: telefono || null,
        institucion: institucion || null,
        grupo_id: grupoId,
      },
    ]);

    if (insertError) {
      setError('Error al agregar el personal: ' + insertError.message);
    } else {
      // Limpiar formulario o navegar hacia atrás
      setNombres('');
      setApellidos('');
      setCedula('');
      setRango('');
      setGenero('');
      setTelefono('');
      setInstitucion('');
      setGrupoId(undefined);
      alert('¡Personal agregado exitosamente!');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput label="Nombres *" value={nombres} onChangeText={setNombres} style={styles.input} />
      <TextInput label="Apellidos" value={apellidos} onChangeText={setApellidos} style={styles.input} />
      <TextInput label="Cédula o Identificación *" value={cedula} onChangeText={setCedula} style={styles.input} />
      <TextInput label="Rango" value={rango} onChangeText={setRango} style={styles.input} />
      <TextInput label="Género" value={genero} onChangeText={setGenero} style={styles.input} />
      <TextInput label="Teléfono" value={telefono} onChangeText={setTelefono} style={styles.input} keyboardType="phone-pad" />
      <TextInput label="Institución" value={institucion} onChangeText={setInstitucion} style={styles.input} />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={grupoId}
          onValueChange={(itemValue) => setGrupoId(itemValue)}
        >
          <Picker.Item label="Seleccione un Grupo..." value={undefined} />
          {grupos.map((grupo) => (
            <Picker.Item key={grupo.id} label={grupo.nombre} value={grupo.id} />
          ))}
        </Picker>
      </View>

      {error ? <HelperText type="error">{error}</HelperText> : null}

      <Button mode="contained" onPress={handleAddPersonal} loading={loading} style={styles.button}>
        Agregar Personal
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
});

export default AddPersonalScreen;
