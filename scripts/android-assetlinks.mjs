import fs from 'node:fs/promises';

const fingerprints = [...new Set(process.argv.slice(2).map(value => value.toUpperCase()))];
if (!fingerprints.length || fingerprints.some(value => !/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value) || /^(00:){31}00$/.test(value))) {
  console.error('Usage: node scripts/android-assetlinks.mjs SHA256_CERTIFICATE [SHA256_CERTIFICATE...]');
  console.error('Use the real app signing certificate from Google Play Console, not a sample or an upload certificate.');
  process.exit(1);
}
await fs.mkdir(new URL('../public/.well-known/', import.meta.url), { recursive: true });
await fs.writeFile(new URL('../public/.well-known/assetlinks.json', import.meta.url), JSON.stringify([{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: 'com.sokile.app',
    sha256_cert_fingerprints: fingerprints
  }
}], null, 2) + '\n');
