// Extract all t() and st() translation keys from source code and save as seed JSON
import fs from 'fs';
import path from 'path';

const srcDir = './src';
const keys = new Map();

function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      scanDir(full);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf-8');
      const tRegex = /\bt\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*?)['"]\s*\)/g;
      const stRegex = /\bst\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*?)['"]\s*\)/g;
      
      for (const regex of [tRegex, stRegex]) {
        let match;
        while ((match = regex.exec(content)) !== null) {
          const key = match[1];
          const fallback = match[2];
          if (!keys.has(key)) {
            keys.set(key, { fallback, files: new Set() });
          }
          keys.get(key).files.add(full.replace(/\\/g, '/').replace(/^src\//, ''));
        }
      }
    }
  }
}

scanDir(srcDir);

const seedData = [];
for (const [key, info] of keys) {
  const parts = key.split('.');
  const group = parts[0];
  const label = parts.slice(1).join('.');
  seedData.push({
    key,
    group,
    label,
    valueAz: info.fallback,
    valueEn: null,
    valueRu: null,
    sourceFiles: [...info.files].join(', '),
  });
}

// Sort by group then key
seedData.sort((a, b) => a.group.localeCompare(b.group) || a.key.localeCompare(b.key));

fs.writeFileSync('translation-keys-seed.json', JSON.stringify(seedData, null, 2));
console.log(`✅ ${seedData.length} keys saved to translation-keys-seed.json`);

// Print summary by group
const groups = {};
for (const s of seedData) {
  groups[s.group] = (groups[s.group] || 0) + 1;
}
console.log('\n📊 Keys by group:');
for (const [g, count] of Object.entries(groups).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${g}: ${count}`);
}
