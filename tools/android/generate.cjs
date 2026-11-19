// Generate an Android TWA using only the checked-in manifest and icon assets.
const fs = require('node:fs/promises');
const path = require('node:path');
const { TwaManifest, TwaGenerator, ConsoleLog, fetchUtils } = require('@bubblewrap/core');

async function main() {
  const root = path.resolve(__dirname, '../..');
  const publicDir = path.join(root, 'public');
  const manifest = JSON.parse(await fs.readFile(path.join(publicDir, 'manifest.webmanifest'), 'utf8'));
  const origin = 'https://www.sokile.com';
  const twa = TwaManifest.fromWebManifestJson(new URL(origin + '/manifest.webmanifest'), manifest);
  twa.packageId = 'com.sokile.app';
  twa.minSdkVersion = 24;
  twa.enableNotifications = false; // Existing alerts are sent by email; no push claim.
  twa.appVersionName = '1.0.0';
  twa.appVersionCode = 1;
  twa.navigationColor = twa.themeColor;
  twa.themeColorDark = twa.themeColor;
  twa.signingKey = { path: './sokile-upload.keystore', alias: 'sokile-upload' };

  // Resolve generator asset requests from the source tree, even before deployment.
  // Unknown URLs fail closed; this is not a substitute for checking the live site.
  const allowed = new Set(['/manifest.webmanifest', ...manifest.icons.map(icon => icon.src)]);
  fetchUtils.fetch = async input => {
    const url = new URL(input);
    if (url.origin !== origin || !allowed.has(url.pathname)) throw new Error('Unexpected generator asset: ' + url);
    const bytes = await fs.readFile(path.join(publicDir, url.pathname));
    return new Response(bytes, { status: 200, headers: { 'Content-Type': url.pathname.endsWith('.png') ? 'image/png' : 'application/manifest+json' } });
  };
  await new TwaGenerator().createTwaProject(path.join(root, 'android'), twa, new ConsoleLog('Sokile'));
  const gradlePath = path.join(root, 'android/build.gradle');
  const gradle = await fs.readFile(gradlePath, 'utf8');
  await fs.writeFile(gradlePath, gradle.replaceAll('jcenter()', 'mavenCentral()'));
  async function normalizeGeneratedText(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'build') continue;
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await normalizeGeneratedText(filename);
      else if (/\.(java|xml|gradle|properties|bat)$/.test(filename)) {
        const source = await fs.readFile(filename, 'utf8');
        await fs.writeFile(filename, source.replace(/\r\n/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trimEnd() + '\n');
      }
    }
  }
  await normalizeGeneratedText(path.join(root, 'android'));
  await fs.writeFile(path.join(root, 'android/twa-manifest.json'), JSON.stringify(twa.toJson(), null, 2) + '\n');
  console.log('Android source generated. No signing key was created and nothing was published.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
