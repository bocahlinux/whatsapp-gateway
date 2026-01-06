# Troubleshooting Guide

## Login Tidak Berfungsi / Redirect Kembali ke Halaman Login

### 🔍 Gejala
- Bisa akses halaman login
- Email dan password sudah benar
- Setelah klik login, kembali ke halaman login tanpa error
- Tidak bisa masuk ke dashboard

### 🐛 Penyebab
Masalah ini terjadi karena cookie session tidak tersimpan di browser. Penyebab umum:

1. **Cookie Secure Flag** - Cookie dengan flag `secure: true` membutuhkan HTTPS
2. **Missing SameSite Attribute** - Browser modern membutuhkan atribut `sameSite`
3. **NODE_ENV Production** - Secara default cookie secure diaktifkan saat NODE_ENV=production

### ✅ Solusi

#### Opsi 1: Pastikan File `.env` Benar (RECOMMENDED)

Di server Ubuntu, buat file `.env` dengan konfigurasi ini:

```bash
PORT=8181
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/whatsapp-webhook
SESSION_SECRET=your-random-secret-key-here

# Jangan set COOKIE_SECURE=true kecuali menggunakan HTTPS
# COOKIE_SECURE=false
```

**Langkah-langkah di Ubuntu server:**

```bash
# 1. Masuk ke direktori project
cd /path/to/whatsapp-gateway

# 2. Copy .env.example
cp .env.example .env

# 3. Edit file .env
nano .env

# 4. Pastikan konfigurasi seperti di atas
# 5. Save (Ctrl+O, Enter, Ctrl+X)

# 6. Restart aplikasi
pm2 restart whatsapp-gateway
# atau jika menggunakan systemd:
sudo systemctl restart whatsapp-gateway
# atau jika manual:
# Ctrl+C untuk stop, lalu jalankan lagi:
npm start
```

#### Opsi 2: Cek Browser Console

1. Buka browser (Chrome/Firefox)
2. Tekan F12 untuk membuka Developer Tools
3. Buka tab "Application" (Chrome) atau "Storage" (Firefox)
4. Lihat bagian "Cookies"
5. Periksa apakah cookie `auth-token` tersimpan setelah login

Jika cookie tidak muncul, berarti ada masalah dengan pengaturan cookie.

#### Opsi 3: Gunakan HTTPS (Production)

Jika Anda menggunakan HTTPS dengan SSL certificate (Nginx/Apache dengan Let's Encrypt):

```bash
# File .env
PORT=8181
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/whatsapp-webhook
SESSION_SECRET=your-random-secret-key-here
COOKIE_SECURE=true  # ← Set true karena sudah pakai HTTPS
```

### 🔧 Perubahan yang Dilakukan

Kami telah memperbaiki konfigurasi cookie di versi ini:

**Sebelum:**
```javascript
res.cookie('auth-token', token, {
    httpOnly: true,
    secure: config.node_env === 'production', // ← Masalah
    maxAge: config.session.maxAge,
});
```

**Sesudah:**
```javascript
res.cookie('auth-token', token, {
    httpOnly: true,
    secure: config.session.secureCookie, // ← Configurable via COOKIE_SECURE env
    sameSite: 'lax', // ← Ditambahkan untuk browser modern
    maxAge: config.session.maxAge,
});
```

### 📝 Checklist Debugging

- [ ] File `.env` sudah dibuat dan benar
- [ ] `COOKIE_SECURE` tidak di-set atau di-set ke `false` (untuk HTTP)
- [ ] `NODE_ENV=development` (bukan production)
- [ ] MongoDB berjalan (`sudo systemctl status mongod`)
- [ ] Aplikasi sudah di-restart setelah edit `.env`
- [ ] Clear browser cache dan cookies
- [ ] Coba browser lain (Chrome/Firefox/Edge)
- [ ] Cek browser console untuk error JavaScript

### 🌐 Akses dari IP Lain

Jika akses dari komputer lain di jaringan (misal: `http://192.168.168.101:8181`):

1. Pastikan firewall mengizinkan port 8181:
```bash
sudo ufw allow 8181
sudo ufw status
```

2. Pastikan aplikasi listen ke `0.0.0.0` bukan `localhost`:
```javascript
// Di app.js sudah benar:
this.server.listen(config.port, '0.0.0.0', () => { ... });
```

### 🔐 Keamanan Production

Untuk production dengan HTTPS:

1. Install SSL Certificate (Let's Encrypt)
2. Setup Nginx/Apache sebagai reverse proxy
3. Set environment variables:
```bash
NODE_ENV=production
COOKIE_SECURE=true
SESSION_SECRET=random-strong-secret-key
```

### 📞 Masih Bermasalah?

1. **Cek Log Aplikasi:**
```bash
pm2 logs whatsapp-gateway
# atau
journalctl -u whatsapp-gateway -f
```

2. **Cek Log MongoDB:**
```bash
sudo journalctl -u mongod -f
```

3. **Test dengan cURL:**
```bash
curl -v -X POST http://192.168.168.101:8181/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=your@email.com&password=yourpassword"
```

Lihat response header, pastikan ada `Set-Cookie: auth-token=...`

### 💡 Tips Tambahan

1. **Gunakan IP Statis** - Pastikan server punya IP statis di jaringan lokal
2. **Bookmark Dashboard** - Simpan `http://192.168.168.101:8181/dashboard` sebagai bookmark
3. **Session Timeout** - Session berlaku 24 jam, setelah itu harus login lagi
4. **Browser Private/Incognito** - Coba akses di mode incognito untuk test tanpa cache

---

## Masalah Lainnya

### WhatsApp Tidak Terhubung

**Gejala:** QR Code tidak muncul atau tidak bisa scan

**Solusi:**
1. Cek apakah port WebSocket terbuka
2. Restart aplikasi
3. Reset session dari dashboard

### Database Error

**Gejala:** Error "MongoServerError" atau connection refused

**Solusi:**
```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Cek status
sudo systemctl status mongod
```

### Port Sudah Digunakan

**Gejala:** Error "EADDRINUSE" atau port 8181 already in use

**Solusi:**
```bash
# Cari process yang pakai port 8181
sudo lsof -i :8181

# Kill process
sudo kill -9 <PID>

# Atau ganti port di .env
PORT=8182
```
