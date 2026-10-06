# Virtual Lab Sains Tingkatan 1

**Fasa 1–5 siap.** Makmal maya interaktif “Syarat Percambahan Biji Benih” menggunakan React, Vite, TypeScript dan dnd-kit. Semua kandungan murid dalam Bahasa Melayu. Tiada akaun, backend wajib, bahan sebenar atau API berbayar.

## Jalankan

Node.js 20.19+ atau 22 disyorkan.

```sh
npm install
npm run dev
```

Pratonton pembangunan: http://localhost:5173. Untuk UI pada tablet di Wi-Fi sama, buka alamat IP laptop dengan port 5173. HTTP melalui IP LAN tidak mengaktifkan PWA/service worker; gunakan hosting HTTPS untuk PWA pada tablet.

Build production dengan PWA:

```sh
npm run build
npm run preview -- --port 4173
```

Buka http://localhost:4173. Tunggu **“✓ Aplikasi tersedia offline”** sebelum memutuskan internet. Cache tersedia selepas pemuatan pertama yang berjaya; pemasangan aplikasi tidak wajib untuk menggunakan cache.

## Aliran murid

1. Individu atau kumpulan (2–5 ahli, mengikut tetapan guru), nama dan kelas; kumpulan menerima peranan yang boleh dipusingkan.
2. Pilih hipotesis tanpa jawapan didedahkan dan simpan ramalan awal.
3. Sediakan A–D melalui tray bahan. Sahkan lokasi suhu bilik/peti sejuk. Validasi umum dan maksimum tiga tahap petunjuk.
4. Mulakan eksperimen sendiri; Hari 1–5 manual atau auto play yang boleh dijeda.
5. Zoom tabung, buka balutan maya selepas Hari 5 dan rekod pemerhatian sendiri.
6. Isi 16 sel jadual (4 tabung × 4 keadaan/hasil). Semakan memberi jumlah betul dan satu fokus pembetulan; bandingkan ramalan.
7. Empat soalan analisis memberi penjelasan selepas semakan; susun kesimpulan melalui drag-and-drop atau tap.
8. Cabaran pilihan menguji air, oksigen dan suhu; terangkan faktor yang berkaitan.
9. Hasil, laporan dan refleksi penglibatan kumpulan tanpa penalti.

Hipotesis/ramalan dikunci selepas eksperimen bermula. Perubahan fizikal membatalkan simulasi dan bukti hiliran. Perubahan pemerhatian/jadual/analisis/kesimpulan membatalkan bukti hiliran berkaitan supaya laporan tidak menggunakan keputusan lapuk.

## Touch dan accessibility

- Tahan pemegang **Seret** sekitar 180ms, kemudian seret bahan ke tabung atau D ke peti sejuk. Kesimpulan menggunakan pemegang perkataan.
- Tap alternatif: pilih bahan → tabung; pilih tabung → zon lokasi. Kesimpulan: pilih perkataan → ruang.
- Tab/Enter untuk butang; sensor keyboard dnd-kit menggunakan Space, anak panah dan Escape. Pemegang diasingkan daripada tap untuk membolehkan scroll tablet. Auto-scroll drag dimatikan; gunakan tap jika sasaran telefon berjauhan. Rujukan: [dnd-kit Touch](https://dndkit.com/legacy/api-documentation/sensors/touch/).
- Sasaran ≥44px, simbol bersama teks, label input, focus trap/pemulangan fokus modal dan reduced motion.
- Bunyi default OFF; ikon bunyi mengaktifkan cue ringan penambahan bahan, validasi dan completion melalui Web Audio tanpa aset luar.

## Ruang guru

Gear **Guru** di header; PIN lalai **1234** dan boleh ditukar dalam **Mod guru → Tukar PIN guru** (4–6 digit angka; disimpan pada peranti itu sahaja — setiap peranti menyimpan PIN sendiri). Ia kawalan kelas asas, bukan pengesahan akaun selamat. Dikunci semula selepas ditutup/refresh.

Guru boleh mengubah petunjuk, paparan markah, pemasa perbincangan, mod individu/kumpulan/kedua-duanya dan maksimum 2–5 ahli; melihat jawapan sebenar serta contoh laporan; reset sesi selepas pengesahan. Contoh menggunakan data berasingan dan tidak menggantikan sesi murid.

Had ahli/pilihan mod terpakai pada pendaftaran baharu; kumpulan sedia ada tidak kehilangan ahli. Tetapan lain terpakai semasa aktiviti. Markah masih direkodkan ketika paparannya dimatikan. Reset memadam nama/kemajuan sesi tetapi mengekalkan tetapan guru.

**Ringkasan kelas:** setiap sesi yang selesai menjana **kod kelas** `SCI1-KELAS-…` (teks + **kod QR**) pada skrin hasil dan laporan yang membawa nama, kelas, markah, bonus dan cadangan TP. Murid menunjukkan kod QR atau menyalin kod; guru mengimportnya dalam **Mod guru → Ringkasan kelas** melalui **imbasan kamera** (jika peranti menyokong) atau **tampalan kod berbilang** (teks lain diabaikan). Guru juga boleh melihat jumlah/purata/tertinggi/terendah, membuang rekod, mengeksport CSV, menyalin teks ringkasan, berkongsi (peranti menyokong navigasi kongsi) dan **mencetak / menyimpan PDF**. Kod tidak sah (disunting atau bukan format) ditolak dengan kiraan. Rekod disimpan pada peranti guru sahaja dan tidak menyentuh sesi murid; padam sesi tidak memadam rekod ini. **Panduan murid** (`panduan-kelas.html`) boleh dibuka daripada panel ini — langkah pasang PWA, ujian offline, senarai semak guru dan masalah biasa — untuk dipaparkan atau dicetak.

## Markah dan eksport

Hipotesis 2 + setup 8 + pemerhatian 4 + jadual 8 + analisis 4 + kesimpulan 4 = **30**. Bonus cabaran maksimum **2** berasingan. Ramalan, hint dan refleksi tidak mengurangkan markah. Analisis menggunakan jawapan pertama disemak; jawapan terakhir juga direkodkan.

Laporan: identiti/ahli, kelas, tarikh Malaysia, hipotesis/ramalan, pemboleh ubah, setup, keputusan, markah, hint, analisis, kesimpulan, cabaran dan refleksi. TP3/4/5 ialah **cadangan untuk pertimbangan guru**, berdasarkan bukti, bukan jumlah markah sahaja; guru menilai setiap ahli secara individu.

- **Muat turun laporan:** HTML kendiri dengan CSS/visual inline; boleh dibaca dan dicetak tanpa internet.
- **Cetak / simpan PDF:** laporan berasingan dan dialog cetak browser; pilih “Simpan sebagai PDF” jika tersedia. Jika popup disekat, cetak daripada HTML yang dimuat turun.
- **Salin kod keputusan:** Clipboard API dengan alternatif salinan manual. Kod/tarikh kekal selepas refresh. Kod rujukan setempat belum disahkan melalui backend.
- **Kod kelas:** kod boleh dibawa (`SCI1-KELAS-…`) untuk ringkasan kelas guru — import tampal berbilang kod, dedup mengikut nama/kelas, eksport CSV selamat formula. Ringkasan disimpan berasingan daripada sesi murid.

## PWA dan offline

Manifest, ikon PNG 192/512 dan ikon iPad disediakan. Android/Chrome: **Pasang aplikasi** apabila prompt tersedia, atau menu browser. iPad/Safari: Kongsi → Tambah ke Skrin Utama. Sokongan bergantung pada browser/peranti. Rujukan: [MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

`vite.config.ts` menjana `sw.js` dan inventori aset build. Cache dipasang secara atomic dan diberi versi daripada hash kandungan. Aset disediakan daripada cache tanpa API; navigasi dimuatkan daripada rangkaian apabila tersedia dan jatuh ke salinan cache (fail yang diminta, atau shell aplikasi) apabila offline. `.nojekyll` dijana automatik dalam build supaya GitHub Pages tidak memproses fail aplikasi dengan Jekyll. Cache lama dibersihkan ketika pengaktifan versi baharu. Versi baharu menunggu pilihan **Muat semula versi baharu**, tanpa mengganggu aktiviti secara automatik. localStorage tidak dipadam oleh kemas kini cache. Rujukan: [MDN — Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

Worker hanya didaftarkan pada production; `npm run dev` tidak menguji offline. Browser boleh memadam cache/storage akibat tetapan pengguna, mod persendirian atau kekurangan ruang. Simpan laporan selepas selesai. Tiada penyegerakan antara peranti.

## Seni bina dan data

- `src/domain/model.ts`: sesi, ahli/peranan, tabung, kemajuan, markah dan tetapan.
- `experiment.ts`: bahan/lokasi, derivasi air/oksigen/suhu, protokol, validasi/hint.
- `simulation.ts`: hari, pertumbuhan daripada state, pemerhatian dan keputusan.
- `learning.ts`: analisis, kesimpulan, cabaran, skor, feedback dan cadangan TP.
- `invalidation.ts`: pembatalan bukti hiliran; `settings.ts`: normalisasi; `demo.ts`: contoh laporan.
- `classroom.ts`: kod kelas (encode/decode berchecksum), gabungan rekod idempotent dan eksport CSV ringkasan kelas.
- `src/data/storage.ts`: kontrak repository dan localStorage berversi; boleh diganti dengan Supabase kemudian.
- `src/state/LabContext.tsx`: state, autosave, tetapan dan bunyi; ralat simpan dipaparkan.
- `src/pages/`: skrin dengan prasyarat `SessionScreen`; `src/components/`: visual, touch, peranan, modal, Teacher Mode, laporan dan PWA.

Satu sesi aktif di `sci1-germination:v1` pada browser/peranti semasa. Sesi baharu menggantikan sebelumnya selepas pengesahan. Refresh memulihkan progress; auto play/pemasa/persetujuan berhenti dan perlu dimulakan/disahkan semula. Reset tidak memadam cache atau tetapan guru.

## Model saintifik

Rules engine: biji benih hadir + air tersedia + oksigen tersedia + suhu sesuai. Hasil berdasarkan state, bukan label A–D. A memerlukan kertas hitam mengikut protokol; balutan tambahan B–D diterima dan tidak mengubah percambahan.

Suhu bilik 25°C, peti sejuk 5°C. Model cabaran contoh: 15–35°C sesuai, 15°C lebih perlahan, air sedikit belum mencukupi, air berlebihan mengehadkan oksigen. Ini model pendidikan, bukan ramalan kuantitatif atau ambang universal bagi semua spesies. Rujukan: [University of Minnesota — Seed physiology](https://open.lib.umn.edu/horticulture/chapter/9-2-seed-physiology/).

## Ujian

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run test:pwa
```

`test:pwa` membina aplikasi, menjalankan preview port 4173 dan suite production. Semakan terakhir: **50 unit tests, 16 browser regression tests dan 4 production/PWA tests lulus**, bersama build. Audit npm: 0 vulnerability dilaporkan.

Meliputi individu/kumpulan, refresh/reset, roles, touch drag Chromium, telefon 390px, tablet 1024×768, analisis, skor, laporan, PIN salah/betul, tukar PIN guru (sahkan + kekal selepas reload), tetapan/had ahli, contoh laporan tanpa menukar sesi, kebolehpasangan Chromium, eksperimen penuh selepas internet dimatikan, reload offline, HTML kendiri, salip kod, cetak/PDF, ringkasan kelas (import kod, imbas QR, cetak/kongsi, CSV, pengasingan daripada sesi murid), saluran kod QR (jana → imbas dalam unit test) dan halaman panduan yang kekal tersedia offline. Screenshot disemak. Pemasangan iPad/Android fizikal dan pengujian kelas sebenar masih diperlukan.

## Alat sokongan

- `public/panduan-kelas.html` — panduan murid/guru (QR pautan, langkah Android/iPad, ujian offline, senarai semak, masalah biasa); dicache untuk offline; boleh dicetak.
- `scripts/live-check.mjs` — ujian laman HIDUP selepas deploy (PWA, ringkasan kelas, halaman panduan, offline). `scripts/inject-panduan-qr.cjs` — jana semula QR panduan apabila URL berubah. (Sentiasa letak skrip di `scripts/`, bukan `test-results/` — Playwright memadam `test-results` setiap larian.)
- `tools/telegram-ringkasan-kelas.mjs` — hantar CSV ringkasan kelas ke Telegram guru (token dibaca daripada `.env` Hermes tempatan). Salinan sedia-guna dengan `.bat` dwi-klik berada di Desktop → `VIRTUAL-LAB-ALAT`.

## Deploy static

`npm run build`, kemudian terbitkan **seluruh `dist`** pada hosting static HTTPS. Build command `npm run build`; output `dist`; tiada API key. Jangan cache `sw.js`/HTML secara kekal pada CDN; aset berhash boleh menggunakan cache panjang.

Subfolder: `npm run build -- --base=/virtual-lab/`. Manifest relatif dan worker menggunakan base Vite; hosting mesti menyediakan folder itu serta semua aset. HTML laporan boleh dibuka dengan `file://`; PWA memerlukan HTTPS atau localhost.

Sebelum kelas: buka setiap tablet sehingga cache tersedia, cuba offline/reload dan touch drag, tetapkan mod/had ahli dan muat turun contoh laporan. Simpan laporan sebelum reset tablet untuk murid seterusnya.
