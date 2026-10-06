// Tetapkan KUNCI MOD GURU untuk SEMUA peranti: hash SHA-256 disuntik ke dalam
// build (melalui .env.local yang tidak dimuat naik ke GitHub), kemudian aplikasi
// dibina dan diterbitkan semula ke GitHub Pages.
// Guna: node scripts/set-teacher-pin.mjs   (atau dwi-klik "Kunci Mod Guru.bat")
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(PROJECT);
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = question => new Promise(resolve => rl.question(question, resolve));

console.log('==========================================================');
console.log(' KUNCI MOD GURU - Virtual Lab Sains Tingkatan 1');
console.log('==========================================================');
console.log('Kunci ini akan diterima pada SEMUA peranti selepas aplikasi');
console.log('dikemas kini. 1234 TIDAK lagi berfungsi selepas itu.\n');

const pin1 = (await ask('Taip kunci pilihan anda (4-6 digit angka): ')).trim();
if (!/^\d{4,6}$/.test(pin1)) { console.log('\nRALAT: Kunci mesti 4-6 digit angka sahaja.'); rl.close(); process.exit(1); }
const pin2 = (await ask('Taip semula kunci untuk pengesahan      : ')).trim();
if (pin1 !== pin2) { console.log('\nRALAT: Kedua-dua kunci tidak sama. Jalankan semula alat ini.'); rl.close(); process.exit(1); }
rl.close();

const hash = createHash('sha256').update(pin1, 'utf8').digest('hex');
let env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '';
env = env.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('VITE_VLAB_PIN_HASH=')).join('\n');
env = (env ? env + '\n' : '') + 'VITE_VLAB_PIN_HASH=' + hash + '\n';
writeFileSync('.env.local', env);
console.log('\n[1/3] Hash kunci disimpan dalam .env.local (fail ini TIDAK dimuat naik ke GitHub).');
console.log('[2/3] Membina aplikasi...');
execSync('npm run build -- --base=/virtual-lab-s1/', { stdio: 'inherit' });
console.log('[3/3] Menerbitkan ke GitHub Pages...');
try {
  execSync('git -C dist add -A', { stdio: 'inherit' });
  execSync('git -C dist commit -m "Kunci Mod Guru dikemas kini"', { stdio: 'inherit' });
} catch { console.log('      (Tiada perubahan fail untuk dikomit - teruskan.)'); }
execSync('git -C dist push -f origin gh-pages', { stdio: 'inherit' });

console.log('\nSELESAI.');
console.log('Kunci baharu aktif selepas:');
console.log('  1. GitHub siap menerbitkan semula (1-3 minit), dan');
console.log('  2. SETIAP tablet dibuka sekali dengan internet, kemudian');
console.log('     tekan "Muat semula versi baharu" jika dipaparkan.');
console.log('Jika terlupa kunci: jalankan semula alat ini dengan kunci baharu.');
