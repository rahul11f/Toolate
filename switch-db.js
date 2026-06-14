const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mode = process.argv[2];
if (mode !== 'sqlite' && mode !== 'postgres') {
  console.error('Usage: node switch-db.js [sqlite|postgres]');
  process.exit(1);
}

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const envPath = path.join(__dirname, '.env');

// Read schema
let schema = fs.readFileSync(schemaPath, 'utf8');

// Read env
let env = null;
try {
  if (fs.existsSync(envPath)) {
    env = fs.readFileSync(envPath, 'utf8');
  }
} catch (e) {
  console.log('  No .env file found or accessible (skipping env update).');
}

if (mode === 'sqlite') {
  console.log('Switching to SQLite local database...');

  // Replace schema datasource
  const postgresBlock = /datasource db \{[\s\S]*?provider\s*=\s*"postgresql"[\s\S]*?\}/;
  if (postgresBlock.test(schema)) {
    schema = schema.replace(postgresBlock, `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`);
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('  Updated prisma/schema.prisma to use "sqlite"');
  } else {
    console.log('  prisma/schema.prisma is already configured for SQLite or other provider.');
  }

  // Update .env
  if (env) {
    let envLines = env.split(/\r?\n/);
    let hasPostgresBackup = false;
    let hasDirectBackup = false;
    let updatedLines = [];

    for (let line of envLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=') && !trimmed.includes('file:')) {
        updatedLines.push(`# BACKUP_POSTGRES_${line}`);
        updatedLines.push('DATABASE_URL="file:./dev.db"');
      } else if (trimmed.startsWith('DIRECT_URL=')) {
        updatedLines.push(`# BACKUP_POSTGRES_${line}`);
      } else if (trimmed.startsWith('DATABASE_URL="file:')) {
        // already has sqlite, skip duplicate
        if (!updatedLines.some(l => l.startsWith('DATABASE_URL="file:'))) {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }

    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
    console.log('  Updated .env file database URLs to SQLite');
  }

} else {
  console.log('Switching to PostgreSQL Supabase database...');

  // Replace schema datasource
  const sqliteBlock = /datasource db \{[\s\S]*?provider\s*=\s*"sqlite"[\s\S]*?\}/;
  if (sqliteBlock.test(schema)) {
    schema = schema.replace(sqliteBlock, `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`);
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('  Updated prisma/schema.prisma to use "postgresql"');
  } else {
    console.log('  prisma/schema.prisma is already configured for PostgreSQL or other provider.');
  }

  // Update .env
  if (env) {
    let envLines = env.split(/\r?\n/);
    let updatedLines = [];
    let sqliteFound = false;

    for (let line of envLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL="file:./dev.db"')) {
        // remove sqlite URL
        continue;
      } else if (trimmed.startsWith('# BACKUP_POSTGRES_DATABASE_URL=')) {
        updatedLines.push(trimmed.replace('# BACKUP_POSTGRES_', ''));
      } else if (trimmed.startsWith('# BACKUP_POSTGRES_DIRECT_URL=')) {
        updatedLines.push(trimmed.replace('# BACKUP_POSTGRES_', ''));
      } else {
        updatedLines.push(line);
      }
    }

    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
    console.log('  Restored .env file database URLs to PostgreSQL');
  }
}

// Regenerate Prisma Client
try {
  console.log('Regenerating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✨ Database configuration swapped successfully!');
} catch (err) {
  console.error('❌ Failed to regenerate Prisma client. Please stop your Next.js dev server first, then run standard switch-db command.');
}
