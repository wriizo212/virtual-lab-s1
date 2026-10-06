// One-off: inject the site QR into public/panduan-kelas.html when the URL changes.
// Usage: node scripts/inject-panduan-qr.cjs
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'public', 'panduan-kelas.html');
const html = fs.readFileSync(file, 'utf8');
if (!html.includes('<!--QR-SVG-->')) { console.log('Placeholder tidak dijumpai — QR sudah wujud, skrip diabaikan.'); process.exit(0); }
QRCode.toString('https://wriizo212.github.io/virtual-lab-s1/', { type: 'svg', margin: 1, width: 220, errorCorrectionLevel: 'M', color: { dark: '#173c38', light: '#ffffff' } }).then(svg => {
  const clean = svg.replace(/<\?xml[^>]*\?>\s*/, '');
  fs.writeFileSync(file, html.replace('<!--QR-SVG-->', clean));
  console.log('QR disuntik (' + clean.length + ' bait).');
});
