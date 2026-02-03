const https = require('https');
const http = require('http');

const COOLIFY_URL = 'http://65.21.146.193:8000';
const API_TOKEN = '1|hEYO9APzOYSqppV3IRcJUaKbgCDPHyL4o5N9vEoWa2573370';
const SERVER_ID = '117166974';
const DOMAIN = 'vraisavis.fr';

// Secrets générés
const JWT_SECRET = '8bb0b09f49d92fcabe6f80d737cb921c28727f629ce3298a5048d0978bb18cf80bc1ae339140b8c812ae44111e717f770d1bf0a4f431ce7c937812d9ba5e4104';
const JWT_REFRESH_SECRET = '2611d0bddc3cda831493c12b393ce4c1ede1c7c972f57d3c8b70b6716f0531912732d8438779ff1f5f4b6b48cb87ca9bf5f6a8582d3047b4a451a72c96c954b5';
const POSTGRES_PASSWORD = 'lhjFnHpspV6goKnHDp7H2yuuPuTF3igmUBeWVnu12Q';

const GITHUB_REPO = 'https://github.com/BillyBob36/foodback-fevrier';
const BRANCH = 'master';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, COOLIFY_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, Body: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testConnection() {
  console.log('🔍 Test de connexion à Coolify...');
  try {
    const response = await makeRequest('/api/v1/teams');
    console.log('✅ Connexion réussie à Coolify');
    console.log('   Teams trouvées:', response.length || 0);
    return response;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return null;
  }
}

async function listProjects() {
  console.log('\n📋 Liste des projets existants...');
  try {
    const response = await makeRequest('/api/v1/projects');
    console.log('   Projets trouvés:', response.length || 0);
    return response;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return [];
  }
}

async function createProject() {
  console.log('\n🏗️  Création du projet VraisAvis...');
  try {
    const data = {
      name: 'VraisAvis',
      description: 'Restaurant feedback system with slot machine'
    };
    const response = await makeRequest('/api/v1/projects', 'POST', data);
    console.log('✅ Projet créé avec succès');
    console.log('   ID:', response.uuid || response.id);
    return response;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

async function createDatabase(projectUuid) {
  console.log('\n🗄️  Création de PostgreSQL...');
  try {
    const data = {
      project_uuid: projectUuid,
      server_uuid: SERVER_ID,
      type: 'standalone-postgresql',
      name: 'vraisavis-postgres',
      description: 'VraisAvis database',
      postgres_user: 'foodback',
      postgres_password: POSTGRES_PASSWORD,
      postgres_db: 'foodback',
      instant_deploy: true
    };
    const response = await makeRequest('/api/v1/databases', 'POST', data);
    console.log('✅ PostgreSQL créé avec succès');
    console.log('   UUID:', response.uuid);
    return response;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

async function createApplication(projectUuid, appConfig) {
  console.log(`\n📦 Création de l'application ${appConfig.name}...`);
  try {
    const data = {
      project_uuid: projectUuid,
      server_uuid: SERVER_ID,
      type: 'public',
      name: appConfig.name,
      description: appConfig.description,
      git_repository: GITHUB_REPO,
      git_branch: BRANCH,
      build_pack: 'dockerfile',
      dockerfile_location: appConfig.dockerfile,
      base_directory: appConfig.context,
      ports_exposes: appConfig.port.toString(),
      environment_variables: appConfig.env,
      instant_deploy: false
    };
    const response = await makeRequest('/api/v1/applications', 'POST', data);
    console.log('✅ Application créée avec succès');
    console.log('   UUID:', response.uuid);
    return response;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Déploiement VraisAvis sur Coolify\n');
  console.log('Configuration:');
  console.log('  - Coolify:', COOLIFY_URL);
  console.log('  - Serveur:', SERVER_ID);
  console.log('  - Domaine:', DOMAIN);
  console.log('  - Repository:', GITHUB_REPO);
  console.log('');

  // Test de connexion
  const teams = await testConnection();
  if (!teams) {
    console.error('\n❌ Impossible de se connecter à Coolify');
    console.error('Vérifiez que Coolify est accessible et que le token est valide');
    process.exit(1);
  }
  
  const teamId = teams[0]?.id;
  console.log('   Team ID:', teamId);

  // Liste des projets
  const projects = await listProjects();

  // Création du projet
  let projectUuid;
  try {
    const project = await createProject();
    console.log('✅ Projet créé avec succès!');
    projectUuid = project.uuid;
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('unique')) {
      console.log('ℹ️  Le projet existe déjà, récupération...');
      const existingProject = projects.find(p => p.name === 'VraisAvis');
      if (existingProject) {
        projectUuid = existingProject.uuid;
        console.log('   UUID:', projectUuid);
      } else {
        throw new Error('Projet existe mais impossible de le trouver');
      }
    } else {
      throw error;
    }
  }

  // Création de PostgreSQL
  try {
    await createDatabase(projectUuid);
  } catch (error) {
    console.log('⚠️  PostgreSQL:', error.message);
  }

  // Attendre un peu pour que PostgreSQL soit prêt
  console.log('\n⏳ Attente de 5 secondes...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Création de l'API
  try {
    const apiConfig = {
      name: 'vraisavis-api',
      description: 'VraisAvis API Backend',
      dockerfile: 'apps/api/Dockerfile',
      context: 'apps/api',
      port: 3001,
      env: [
        { key: 'DATABASE_URL', value: `postgresql://vraisavis:${POSTGRES_PASSWORD}@vraisavis-postgres:5432/vraisavis` },
        { key: 'JWT_SECRET', value: JWT_SECRET },
        { key: 'JWT_REFRESH_SECRET', value: JWT_REFRESH_SECRET },
        { key: 'NODE_ENV', value: 'production' },
        { key: 'PORT', value: '3001' },
        { key: 'API_URL', value: `https://api.${DOMAIN}` },
        { key: 'WEB_URL', value: `https://app.${DOMAIN}` },
        { key: 'CLIENT_URL', value: `https://client.${DOMAIN}` }
      ]
    };
    await createApplication(projectUuid, apiConfig);
  } catch (error) {
    console.log('⚠️  API:', error.message);
  }

  // Création du Web
  try {
    const webConfig = {
      name: 'vraisavis-web',
      description: 'VraisAvis Web Dashboard',
      dockerfile: 'apps/web/Dockerfile',
      context: 'apps/web',
      port: 3000,
      env: [
        { key: 'NEXT_PUBLIC_API_URL', value: `https://api.${DOMAIN}` },
        { key: 'NODE_ENV', value: 'production' }
      ]
    };
    await createApplication(projectUuid, webConfig);
  } catch (error) {
    console.log('⚠️  Web:', error.message);
  }

  // Création du Client
  try {
    const clientConfig = {
      name: 'vraisavis-client',
      description: 'VraisAvis Client PWA',
      dockerfile: 'apps/client/Dockerfile',
      context: 'apps/client',
      port: 80,
      env: []
    };
    await createApplication(projectUuid, clientConfig);
  } catch (error) {
    console.log('⚠️  Client:', error.message);
  }

  console.log('\n✅ Déploiement terminé!');
  console.log('\nProchaines étapes dans Coolify:');
  console.log('1. Configurer les domaines pour chaque service');
  console.log('2. Activer HTTPS (Let\'s Encrypt)');
  console.log('3. Démarrer les services dans l\'ordre: PostgreSQL → API → Web/Client');
  console.log('\nDomaines suggérés:');
  console.log(`  - API: api.${DOMAIN}`);
  console.log(`  - Web: app.${DOMAIN}`);
  console.log(`  - Client: client.${DOMAIN}`);
}

main().catch(error => {
  console.error('\n💥 Erreur fatale:', error.message);
  process.exit(1);
});
