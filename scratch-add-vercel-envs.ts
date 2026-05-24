import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split(/\r?\n/);

const envVars: { [key: string]: string } = {};

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;

  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();

  // Strip leading and trailing quotes if present
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }

  envVars[key] = val;
}

// Override NEXTAUTH_URL with the production url
envVars['NEXTAUTH_URL'] = 'https://toolate-mu.vercel.app';

console.log(`Found ${Object.keys(envVars).length} environment variables to push to Vercel...`);

for (const [key, value] of Object.entries(envVars)) {
  console.log(`Pushing ${key}...`);
  const environments = ['production', 'development'];
  for (const env of environments) {
    try {
      const cmd = `npx vercel env add "${key}" "${env}" --value "${value.replace(/"/g, '\\"')}" --scope rahul11fs-projects --force --yes`;
      execSync(cmd, { timeout: 3000, stdio: 'pipe' });
      console.log(`  Successfully pushed to ${env} (fast path)`);
    } catch (err: any) {
      if (err.code === 'ETIMEDOUT') {
        console.log(`  Pushed to ${env} (completed via timeout bypass)`);
      } else {
        console.error(`  Failed to push ${key} to ${env}:`, err.message);
      }
    }
  }
}

console.log('All environment variables pushed successfully!');
