const fs = require('node:fs');
const manifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const argument = process.argv[2];
if (argument === '--check') {
  const version = manifest.version;
  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
  if (!/^\d+\.\d+\.\d+$/.test(version) || lock.version !== version || lock.packages[''].version !== version || !changelog.includes(`## ${version} - `)) {
    throw new Error('Release version mismatch: check package.json, package-lock.json, and CHANGELOG.md');
  }
  console.log(`Release version ${version} is consistent (PHASE.MAJOR.MINOR).`);
} else {
  if (!/^\d+\.\d+\.\d+$/.test(argument ?? '')) throw new Error('Usage: npm run release:version -- PHASE.MAJOR.MINOR');
  manifest.version = lock.version = lock.packages[''].version = argument;
  fs.writeFileSync('package.json', JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
  console.log(`Version synchronized to ${argument}; update the changelog before release.`);
}
