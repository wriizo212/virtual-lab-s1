// Hantar fail CSV ringkasan kelas (eksport Mod guru) ke Telegram guru.
// Guna: node telegram-ringkasan-kelas.mjs [laluan-csv]
// Tanpa argumen: cari fail ringkasan-kelas*.csv terkini dalam Downloads/Desktop.
// Token bot dibaca daripada .env Hermes tempatan — token tidak disimpan dalam fail ini.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CHAT_ID = '689197701';
const ENV_FILE = join(homedir(), 'AppData', 'Local', 'hermes', '.env');
const SEARCH_DIRS = [join(homedir(), 'Downloads'), join(homedir(), 'OneDrive', 'Desktop'), join(homedir(), 'Desktop')];

function fail(message) { console.error('RALAT: ' + message); process.exit(1); }

function readToken() {
  if (!existsSync(ENV_FILE)) fail('Fail .env Hermes tidak dijumpai: ' + ENV_FILE);
  const line = readFileSync(ENV_FILE, 'utf8').split(/\r?\n/).find(entry => entry.startsWith('TELEGRAM_BOT_TOKEN='));
  if (!line) fail('TELEGRAM_BOT_TOKEN tidak dijumpai dalam ' + ENV_FILE);
  const token = line.slice('TELEGRAM_BOT_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) fail('Format token tidak sah dalam .env');
  return token;
}

function findCsv() {
  const explicit = process.argv[2];
  if (explicit) { if (!existsSync(explicit)) fail('Fail tidak dijumpai: ' + explicit); return explicit; }
  const candidates = [];
  for (const dir of SEARCH_DIRS) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (/^ringkasan-kelas.*\.csv$/i.test(name)) {
        const full = join(dir, name);
        candidates.push({ full, mtime: statSync(full).mtimeMs });
      }
    }
  }
  if (!candidates.length) fail('Tiada fail ringkasan-kelas*.csv dalam Downloads atau Desktop.\nEksport CSV daripada Mod guru → Ringkasan kelas dahulu.');
  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates[0].full;
}

const token = readToken();
const csvPath = findCsv();
const csv = readFileSync(csvPath);
const rowCount = Math.max(0, csv.toString('utf8').split(/\r?\n/).filter(Boolean).length - 1);
const fileName = csvPath.split(/[\\/]/).pop();
const caption = '📋 Ringkasan Kelas — Virtual Lab Sains Tingkatan 1\n' + rowCount + ' rekod · fail: ' + fileName;

const form = new FormData();
form.append('chat_id', CHAT_ID);
form.append('caption', caption);
form.append('document', new Blob([csv], { type: 'text/csv' }), 'ringkasan-kelas.csv');

const response = await fetch('https://api.telegram.org/bot' + token + '/sendDocument', { method: 'POST', body: form });
const payload = await response.json().catch(() => null);
if (!payload || !payload.ok) fail('Telegram menolak permintaan: ' + (payload && payload.description ? payload.description : response.status));
console.log('BERJAYA — ringkasan (' + rowCount + ' rekod) dihantar ke Telegram (chat ' + CHAT_ID + ').');
