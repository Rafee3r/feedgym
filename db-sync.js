const { execSync } = require('child_process');

console.log('⏳ Iniciando sincronización forzada de la base de datos...');

try {
    // Ejecutamos prisma db push heredando la consola para ver el output
    execSync('npx prisma db push', { stdio: 'inherit', shell: true });
    console.log('✅ ¡Base de datos sincronizada CORRECTAMENTE!');
} catch (error) {
    console.error('❌ Error al sincronizar:', error.message);
    process.exit(1);
}
