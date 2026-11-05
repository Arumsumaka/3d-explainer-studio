# 3D Explainer Studio — MASTER FRAMEWORK V2.2

Website mandiri untuk menyiapkan paket produksi video 3D explainer YouTube Shorts (9:16, 1080 × 1920).
Pengguna memilih topik, bahasa voice over, dan durasi. Claude lalu menghasilkan:

1. **Full Naskah Voice Over** dengan timecode.
2. **Detail per scene** (tiap scene 10 detik): VO, Image Prompt, dan Video Prompt, masing-masing di area teks sendiri dengan tombol salin sendiri.
3. **YouTube Shorts SEO Package**: 3 judul, deskripsi, hashtags, tags, konsep dan prompt thumbnail, info publikasi, pinned comment, CTA.

Aplikasi ini hanya menghasilkan teks dan prompt. Gambar dan video dibuat di generator pilihan Anda.

## Isi proyek

```
public/
  index.html      halaman aplikasi
  styles.css      tema Dark Studio
  app.js          logika form, tampilan hasil, tombol salin
api/
  generate.js     Vercel Function: satu-satunya tempat yang memanggil Claude API
lib/
  prompts.js      susunan prompt MASTER FRAMEWORK V2.2 (hanya dipakai server)
vercel.json       konfigurasi Vercel (folder output, durasi fungsi, header keamanan)
package.json      metadata proyek dan versi Node
.env.example      contoh Environment Variables
```

API key tidak pernah ada di HTML atau JavaScript browser. Browser hanya mengirim pilihan (topik, bahasa, jumlah scene) ke `/api/generate`, dan server yang menyusun prompt serta memanggil Claude.

## Yang perlu disiapkan

- Akun GitHub.
- Akun Vercel (paket Hobby gratis cukup untuk memulai).
- API key Anthropic dari <https://console.anthropic.com/settings/keys>. Akun API perlu memiliki saldo kredit. Langganan Claude.ai tidak sama dengan API dan tidak bisa dipakai di sini.

## Langkah deployment

### 1. Unggah ke GitHub

1. Ekstrak file ZIP ini.
2. Buat repository baru di GitHub (boleh private), misalnya `3d-explainer-studio`. Jangan centang opsi menambah README.
3. Unggah isi folder hasil ekstrak.
   - Lewat web: buka repository, pilih **uploading an existing file**, seret semua file dan folder (`api`, `lib`, `public`, `vercel.json`, `package.json`, `.env.example`, `.gitignore`, `README.md`), lalu **Commit changes**. File yang namanya diawali titik (`.gitignore`, `.env.example`) harus ikut terunggah.
   - Lewat terminal:
     ```bash
     cd 3d-explainer-studio
     git init
     git add .
     git commit -m "3D Explainer Studio"
     git branch -M main
     git remote add origin https://github.com/NAMA-ANDA/3d-explainer-studio.git
     git push -u origin main
     ```

### 2. Impor ke Vercel

1. Masuk ke <https://vercel.com> dan klik **Add New… → Project**.
2. Pilih repository `3d-explainer-studio` lalu **Import**.
3. Biarkan **Framework Preset** pada **Other**. Kosongkan Build Command, Output Directory, dan Install Command (sudah diatur di `vercel.json`).
4. Buka bagian **Environment Variables** dan tambahkan:

   | Name | Value | Wajib |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | API key Anthropic Anda | Ya |
   | `ACCESS_CODE` | kode rahasia pilihan Anda | Sangat disarankan |
   | `ANTHROPIC_MODEL` | mis. `claude-sonnet-5-5` | Tidak |

   Jika `ACCESS_CODE` diisi, pengunjung harus memasukkan kode itu di form sebelum bisa generate. Tanpa kode, siapa pun yang tahu alamat situs bisa memakai kredit API Anda.
5. Klik **Deploy**. Setelah selesai, buka alamat `https://nama-proyek.vercel.app`.

### 3. Mengubah API key atau pengaturan setelah deploy

Buka **Project → Settings → Environment Variables**, ubah nilainya, lalu **Redeploy** dari tab Deployments. Perubahan variabel hanya berlaku pada deployment baru.

## Menjalankan di komputer sendiri (opsional)

```bash
npm i -g vercel
cp .env.example .env.local     # isi ANTHROPIC_API_KEY
vercel dev
```

Lalu buka alamat yang ditampilkan (biasanya <http://localhost:3000>).

## Cara kerja generate

Satu video memakai beberapa permintaan kecil ke Claude: 1 untuk naskah dan panduan visual, 1 per scene untuk Image dan Video Prompt, dan 1 untuk paket SEO. Video 90 detik = 11 permintaan. Dua permintaan berjalan bersamaan, hasil muncul bertahap, dan bagian yang gagal bisa diulang sendiri lewat tombol **Coba lagi** tanpa mengulang yang sudah berhasil.

## Biaya dan keamanan

- Setiap generate memakai kredit API Anda. Pantau di <https://console.anthropic.com> dan pasang batas pengeluaran bulanan.
- Server hanya menerima pilihan terstruktur (topik maks. 200 karakter, 3 sampai 9 scene) dan menyusun prompt sendiri, sehingga endpoint tidak bisa dipakai sebagai proxy bebas.
- Ada pembatas laju per IP (default 120 permintaan per 10 menit, atur lewat `RATE_LIMIT_PER_10_MIN`). Pembatas ini berjalan di memori per instance, jadi bersifat pelindung dasar. Untuk perlindungan kuat, gunakan `ACCESS_CODE`.
- Jangan pernah commit file `.env.local`. `.gitignore` sudah mengecualikannya.

## Pemecahan masalah

| Gejala | Penyebab dan solusi |
|---|---|
| "ANTHROPIC_API_KEY belum diatur" | Variabel belum diisi, atau belum redeploy setelah mengisinya. |
| "API key Claude ditolak" | Key salah, dicabut, atau akun API tanpa saldo. Periksa di Anthropic Console. |
| "Kode akses salah" | Isi kolom Kode akses di form (muncul bila `ACCESS_CODE` diatur). |
| "Waktu proses habis" | Satu permintaan melewati batas 60 detik di paket Hobby. Klik Coba lagi. Pada paket Pro, naikkan `maxDuration` di `vercel.json`. |
| Halaman 404 di alamat utama | Pastikan folder `public` ikut terunggah dan Output Directory tidak diubah. |
| Gagal dengan nama model | Ganti `ANTHROPIC_MODEL` dengan ID model yang tersedia di akun API Anda. |

## Catatan isi

- Durasi VO adalah estimasi dan belum diuji dengan audio.
- Aplikasi tidak mengambil data tren atau volume pencarian. Paket SEO adalah rekomendasi kreatif.
- Periksa fakta pada naskah sebelum dipublikasikan.
