import { execSync } from 'node:child_process';

const env = { ...process.env };
const platform = (process.env.RUNNER_OS || process.platform).toLowerCase();

if (!env.BUILD_TARGET && (platform.includes('mac') || platform.includes('ios') || platform.includes('android'))) {
  env.BUILD_TARGET = 'capacitor';
}

execSync('vite build', { stdio: 'inherit', env });
