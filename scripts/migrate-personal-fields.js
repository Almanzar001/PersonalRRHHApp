const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase desde variables de entorno
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Iniciando migración de campos personal...');
  
  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../../supabase/migrations/add_nombres_apellidos_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Ejecutando migración SQL...');
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error.message);
      console.log('\n📋 Instrucciones manuales:');
      console.log('1. Ve a tu panel de Supabase');
      console.log('2. Navega a SQL Editor');
      console.log('3. Copia y pega el contenido del archivo:');
      console.log('   supabase/migrations/add_nombres_apellidos_fields.sql');
      console.log('4. Ejecuta el SQL');
      return;
    }
    
    console.log('✅ ¡Migración ejecutada exitosamente!');
    
    // Verificar que los campos se crearon correctamente
    console.log('🔍 Verificando estructura de la tabla...');
    const { data: personalData, error: fetchError } = await supabase
      .from('personal')
      .select('nombres, apellidos, telefono, institucion')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error verificando tabla:', fetchError.message);
    } else {
      console.log('✅ ¡Campos verificados correctamente!');
      console.log('📊 Estructura actualizada:', Object.keys(personalData[0] || {}));
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.log('\n📋 Ejecuta manualmente el SQL en Supabase:');
    console.log('   supabase/migrations/add_nombres_apellidos_fields.sql');
  }
}

// Ejecutar migración
runMigration();
