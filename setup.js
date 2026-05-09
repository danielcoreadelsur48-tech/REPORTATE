const fs = require('fs');
const path = require('path');
const cfg = require('./config.js');

// Validar que no queden placeholders
const pending = Object.entries(cfg).filter(([, v]) => v.startsWith('PEGA_'));
if (pending.length) {
  console.error('\n❌ Aún faltan valores en config.js:');
  pending.forEach(([k]) => console.error('   -', k));
  console.error('\nAbre config.js, reemplaza los valores y vuelve a correr: node setup.js\n');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${cfg.ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

async function runSQL() {
  console.log('\n[1/2] Ejecutando migración SQL...');
  const sql = fs.readFileSync(
    path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql'), 'utf8'
  );
  const res = await fetch(`https://api.supabase.com/v1/projects/${cfg.PROJECT_REF}/database/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  });
  const txt = await res.text();
  if (!res.ok) {
    if (txt.includes('already exists')) {
      console.log('   ⚠️  Algunas tablas ya existían — OK, continuando.');
    } else {
      console.error('   ❌ Error:', txt);
      throw new Error('SQL failed');
    }
  } else {
    console.log('   ✅ Migración ejecutada correctamente.');
  }
}

async function deployFunction() {
  console.log('\n[2/2] Desplegando Edge Function...');
  const code = fs.readFileSync(
    path.join(__dirname, 'supabase', 'functions', 'send-notification', 'index.ts'), 'utf8'
  );
  const body = JSON.stringify({
    slug: 'send-notification',
    name: 'send-notification',
    body: Buffer.from(code).toString('base64'),
    verify_jwt: false,
  });

  let res = await fetch(`https://api.supabase.com/v1/projects/${cfg.PROJECT_REF}/functions`, {
    method: 'POST', headers, body,
  });
  if (!res.ok) {
    res = await fetch(`https://api.supabase.com/v1/projects/${cfg.PROJECT_REF}/functions/send-notification`, {
      method: 'PATCH', headers, body,
    });
  }
  if (!res.ok) {
    console.error('   ❌ Error al desplegar función:', await res.text());
    throw new Error('Function deploy failed');
  }

  await fetch(`https://api.supabase.com/v1/projects/${cfg.PROJECT_REF}/secrets`, {
    method: 'POST',
    headers,
    body: JSON.stringify([{ name: 'SUPABASE_SERVICE_ROLE_KEY', value: cfg.SERVICE_KEY }]),
  });

  console.log('   ✅ Edge Function desplegada.');
}

async function updateEnv() {
  const content = [
    `EXPO_PUBLIC_SUPABASE_URL=${cfg.SUPABASE_URL}`,
    `EXPO_PUBLIC_SUPABASE_ANON_KEY=${cfg.ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${cfg.SERVICE_KEY}`,
  ].join('\n');
  fs.writeFileSync(path.join(__dirname, '.env'), content, 'utf8');
  console.log('\n   ✅ .env actualizado con tus credenciales.');
}

async function main() {
  console.log('\n================================================');
  console.log('   REPÓRTATE — Configuración de Supabase');
  console.log('================================================');
  await runSQL();
  await deployFunction();
  await updateEnv();
  console.log('\n================================================');
  console.log('   ✅ Todo listo.');
  console.log('   Ahora corre: npx expo start');
  console.log('================================================\n');
}

main().catch(err => {
  console.error('\n❌ Setup fallido:', err.message);
  process.exit(1);
});
