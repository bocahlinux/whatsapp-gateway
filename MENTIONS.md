# Fitur Mention (Tag) di Group WhatsApp

Fitur untuk mendeteksi dan merespons ketika WhatsApp Gateway Anda di-mention/tag di group WhatsApp.

## 📋 Fitur

### ✅ Yang Sudah Ditambahkan:

1. **Deteksi Mention Otomatis**
   - Sistem otomatis mendeteksi ketika bot di-mention di group
   - Menyimpan informasi mention ke database
   - Tracking siapa saja yang di-mention dalam pesan

2. **Auto-Reply untuk Mention**
   - Auto-reply HANYA akan bekerja di group jika bot di-mention
   - Di chat private, auto-reply tetap bekerja seperti biasa
   - Keyword matching untuk trigger response

3. **Webhook Event Khusus**
   - Event `mention` dikirim ke webhook URL saat bot di-mention
   - Berbeda dengan event `message.in` biasa
   - Dapat digunakan untuk trigger custom action

4. **Database Tracking**
   - Field `isMention` (boolean) - Apakah pesan ini mention bot
   - Field `mentionedJids` (array) - Daftar JID yang di-mention
   - Semua tersimpan di collection `Message`

---

## 🚀 Cara Kerja

### Skenario 1: Chat Private (DM)
```
User: Halo, mau tanya dong
Bot: (Auto-reply aktif seperti biasa)
```

### Skenario 2: Group TANPA Mention
```
User di Group: Halo guys
Bot: (TIDAK akan auto-reply, karena tidak di-mention)
```

### Skenario 3: Group DENGAN Mention
```
User di Group: @Bot halo, mau tanya dong
Bot: (Auto-reply AKTIF karena di-mention!)
```

---

## 📊 Webhook Event untuk Mention

### Event: `mention`

Dikirim ketika bot di-mention di group.

**Format Data:**
```json
{
  "event": "mention",
  "data": {
    "userId": "user_id_123",
    "id": "message_db_id",
    "chatJid": "120363123456789012@g.us",
    "groupName": "120363123456789012@g.us",
    "sender": "John Doe",
    "senderJid": "6281234567890@s.whatsapp.net",
    "text": "@Bot halo, apa kabar?",
    "timestamp": 1704614400000,
    "mentionedJids": [
      "6289876543210@s.whatsapp.net"
    ]
  },
  "timestamp": 1704614400000
}
```

### Event: `message.in` (Updated)

Event pesan masuk sekarang include informasi mention:

```json
{
  "event": "message.in",
  "data": {
    "userId": "user_id_123",
    "id": "message_db_id",
    "chatJid": "120363123456789012@g.us",
    "sender": "John Doe",
    "text": "@Bot halo, apa kabar?",
    "timestamp": 1704614400000,
    "isMention": true,
    "mentionedJids": [
      "6289876543210@s.whatsapp.net"
    ]
  },
  "timestamp": 1704614400000
}
```

---

## 🔧 Setup Webhook untuk Handle Mention

### Contoh Webhook Server (Express.js)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint webhook
app.post('/webhook', (req, res) => {
  const { event, data } = req.body;

  // Handle mention event khusus
  if (event === 'mention') {
    console.log(`🔔 Bot di-mention di group: ${data.groupName}`);
    console.log(`👤 Oleh: ${data.sender}`);
    console.log(`💬 Pesan: ${data.text}`);

    // Custom action untuk mention
    handleBotMention(data);
  }

  // Handle pesan biasa dengan info mention
  if (event === 'message.in' && data.isMention) {
    console.log(`✨ Pesan dengan mention diterima`);
  }

  res.status(200).send('OK');
});

async function handleBotMention(data) {
  // Contoh: Log ke database
  await saveToDatabase({
    type: 'mention',
    from: data.sender,
    group: data.groupName,
    message: data.text,
    timestamp: data.timestamp
  });

  // Contoh: Kirim notifikasi ke Slack
  await sendToSlack(`@Bot di-mention di group oleh ${data.sender}: ${data.text}`);

  // Contoh: Trigger custom response via API
  if (data.text.includes('status')) {
    await fetch('http://localhost:8181/send-group-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your-api-key'
      },
      body: JSON.stringify({
        groupId: data.chatJid,
        message: `@${data.sender.split('@')[0]} Status sistem: ✅ Online`
      })
    });
  }
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

---

## ⚙️ Konfigurasi Auto-Reply untuk Mention

### Di Dashboard

1. Login ke dashboard WhatsApp Gateway
2. Buka menu **"Balas Otomatis"** (Auto-Reply)
3. Buat rule baru:
   - **Keyword**: `halo`
   - **Reply**: `Halo! Ada yang bisa saya bantu?`
   - **Enabled**: ✅

### Cara Kerja:

**Chat Private:**
```
User: halo
Bot: Halo! Ada yang bisa saya bantu?
```

**Group (TANPA mention):**
```
User: halo guys
Bot: (tidak reply)
```

**Group (DENGAN mention):**
```
User: @Bot halo
Bot: Halo! Ada yang bisa saya bantu?
```

---

## 💾 Database Structure

### Collection: `messages`

Field baru yang ditambahkan:

```javascript
{
  // ... field lainnya
  isMention: Boolean,        // true jika bot di-mention
  mentionedJids: [String],   // Array JID yang di-mention
  // Contoh: ["6281234567890@s.whatsapp.net", "6289876543210@s.whatsapp.net"]
}
```

### Query Contoh

**Cari semua pesan yang mention bot:**
```javascript
db.messages.find({ isMention: true })
```

**Cari mention dalam group tertentu:**
```javascript
db.messages.find({
  isMention: true,
  chatJid: "120363123456789012@g.us"
})
```

**Cari pesan dari user yang mention bot:**
```javascript
db.messages.find({
  isMention: true,
  senderJid: "6281234567890@s.whatsapp.net"
})
```

---

## 🎯 Use Case Examples

### Use Case 1: Bot Help Command di Group

```javascript
// Webhook handler
app.post('/webhook', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'mention' && data.text.toLowerCase().includes('help')) {
    // Kirim menu help
    await fetch('http://localhost:8181/send-group-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your-api-key'
      },
      body: JSON.stringify({
        groupId: data.chatJid,
        message: `📖 *Menu Bantuan*\n\n` +
                 `@Bot help - Tampilkan menu ini\n` +
                 `@Bot status - Cek status sistem\n` +
                 `@Bot info - Informasi bot\n` +
                 `@Bot ping - Test koneksi`
      })
    });
  }

  res.status(200).send('OK');
});
```

### Use Case 2: Monitoring Alert

```javascript
// Webhook handler untuk monitoring
app.post('/webhook', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'mention') {
    // Log semua mention ke monitoring system
    await logToMonitoring({
      timestamp: new Date(data.timestamp),
      type: 'bot_mention',
      user: data.sender,
      group: data.groupName,
      message: data.text
    });

    // Alert jika ada keyword urgent
    if (data.text.toLowerCase().includes('urgent')) {
      await sendAlertToAdmin({
        title: '🚨 Urgent Mention Alert',
        message: `${data.sender} mention bot dengan pesan urgent di group`,
        details: data.text
      });
    }
  }

  res.status(200).send('OK');
});
```

### Use Case 3: AI Auto-Response

```javascript
// Webhook dengan AI integration
app.post('/webhook', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'mention') {
    // Process dengan AI (ChatGPT, Claude, dll)
    const aiResponse = await processWithAI(data.text);

    // Kirim response ke group
    await fetch('http://localhost:8181/send-group-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your-api-key'
      },
      body: JSON.stringify({
        groupId: data.chatJid,
        message: aiResponse
      })
    });
  }

  res.status(200).send('OK');
});
```

---

## 🔍 Testing Mention Feature

### 1. Test di Group WhatsApp

1. Buka group WhatsApp
2. Tag bot Anda: `@BotName halo`
3. Bot akan auto-reply jika keyword match

### 2. Cek Database

```bash
# Masuk ke MongoDB
mongo

# Use database
use whatsapp-webhook

# Cari pesan mention
db.messages.find({ isMention: true }).pretty()
```

### 3. Cek Webhook

```bash
# Monitor webhook endpoint
tail -f /var/log/webhook.log

# Atau gunakan ngrok untuk testing
ngrok http 3000
# Set webhook URL di dashboard ke: https://xxx.ngrok.io/webhook
```

---

## 📝 Checklist Implementasi

- [x] Deteksi mention dari Baileys message
- [x] Ekstrak mentionedJids dari contextInfo
- [x] Simpan isMention ke database
- [x] Update auto-reply untuk support group mention
- [x] Kirim webhook event khusus untuk mention
- [x] Update message.in webhook dengan info mention
- [x] Socket.IO emit include mention info
- [x] Dokumentasi lengkap

---

## ⚠️ Catatan Penting

1. **Auto-reply di Group**
   - Sebelumnya: Auto-reply TIDAK aktif di group sama sekali
   - Sekarang: Auto-reply aktif di group HANYA jika bot di-mention

2. **Webhook Events**
   - `mention` - Event khusus saat bot di-mention
   - `message.in` - Include field `isMention` dan `mentionedJids`

3. **Performance**
   - Deteksi mention tidak menambah latency
   - Webhook event dikirim async
   - Database index otomatis untuk query cepat

4. **Privacy**
   - Semua JID yang di-mention disimpan
   - Data dapat digunakan untuk analytics
   - Pastikan comply dengan privacy policy

---

## 🆘 Troubleshooting

### Bot Tidak Merespons Mention

**Cek:**
1. Auto-reply enabled di settings?
2. Keyword match dengan rule auto-reply?
3. WhatsApp terhubung? (cek dashboard)
4. Bot adalah member dari group?

**Debug:**
```bash
# Cek logs
pm2 logs whatsapp-gateway

# Atau
tail -f /var/log/whatsapp-gateway.log
```

### Webhook Tidak Terkirim

**Cek:**
1. Webhook URL benar?
2. Webhook toggle enabled?
3. Endpoint webhook bisa diakses?

**Test dengan cURL:**
```bash
curl -X POST http://your-webhook-url/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"mention","data":{"text":"test"}}'
```

### Database Tidak Tersimpan

**Cek:**
```bash
# MongoDB running?
sudo systemctl status mongodb

# Check collections
mongo
use whatsapp-webhook
db.messages.findOne({ isMention: true })
```

### Mention Detection False Positive (Deteksi Semua Mention)

**Masalah:**
`isBotMentioned` return `true` meskipun yang di-tag bukan bot.

**Penyebab:**
Jika `FORCE_MENTION_DETECTION=true` diaktifkan, sistem versi lama menganggap SEMUA mention di group adalah untuk bot (bug sudah diperbaiki).

**Solusi:**
1. Update ke versi terbaru (sudah include fix)
2. Restart WhatsApp Gateway
3. Cek logs untuk melihat mention detection yang lebih detail

**Verifikasi Fix:**
Logs baru akan menampilkan analisis detail:
```
=== MENTION DETECTION DEBUG ===
Bot Phone Number: 6287775760675
Is Linked Device: true

--- Mentioned JIDs Analysis ---
[0] Raw: 6281234567890@s.whatsapp.net
    Number: 6281234567890
    Domain: s.whatsapp.net
    Matches Bot: false

--- Detection Result ---
isBotMentioned: false
Detection Method: No match
```

**Debug Lebih Lanjut:**
Jika masih bermasalah, cek logs dan kirim output debug ke developer.

### Bot Mention Tidak Terdeteksi (WhatsApp Business/Linked Device)

**Masalah:**
Bot di-tag di group tapi `isBotMentioned` tetap `false`.

**Gejala di Logs:**
```
[0] Raw: 270776867536993@lid
    Number: 270776867536993
    Matches Bot Phone: false
    Matches Any Bot JID: false

isBotMentioned: false
```

**Penyebab:**
WhatsApp Business atau Linked Device menggunakan JID internal yang berbeda dari nomor telepon bot. Contoh:
- Nomor bot: `6287775760675`
- Mentioned JID: `270776867536993@lid` (ID internal WhatsApp, bukan nomor telepon!)

**Solusi 1: Auto-Detection (Recommended)**

Sistem akan otomatis track JID bot saat bot kirim pesan ke group:

1. Bot kirim pesan ke group (via dashboard atau API)
2. Sistem track JID yang terlihat member lain
3. JID ini otomatis disimpan untuk deteksi mention
4. Cek logs: `📝 Tracked bot alternative JID: 270776867536993@lid`

**Solusi 2: Manual Configuration**

Jika auto-detection tidak bekerja, set manual di `.env`:

1. Tag bot di group dan cek logs
2. Lihat di `Mentioned JIDs Analysis`, copy JID mentah
3. Tambahkan ke `.env`:
   ```bash
   BOT_ALTERNATIVE_JIDS=270776867536993@lid
   ```
4. Restart WhatsApp Gateway
5. Test lagi mention bot

**Multiple JIDs:**
Jika bot punya beberapa JID berbeda di berbagai group:
```bash
BOT_ALTERNATIVE_JIDS=270776867536993@lid,123456789@lid,987654321@lid
```

**Verifikasi:**
Setelah config, cek logs saat tag bot:
```
Config Alternative JIDs: [ '270776867536993@lid' ]
Tracked Alternative JIDs: [ '270776867536993@lid' ]
All Bot JIDs (merged): [ '6287775760675:10@s.whatsapp.net', '270776867536993@lid' ]

[0] Raw: 270776867536993@lid
    Matches Any Bot JID: true ✅

isBotMentioned: true ✅
Detection Method: Method 1: Direct JID match (including alternatives)
```

---

## 📚 API Reference

### Socket.IO Event

**Event:** `new_message`

**Data:**
```javascript
{
  id: "message_id",
  chat_jid: "120363123456789012@g.us",
  sender: "John Doe",
  message: "@Bot halo",
  is_mention: true,  // ← New field
  timestamp: 1704614400000,
  // ... other fields
}
```

### Database Query Examples

```javascript
// MongoDB queries

// Count total mentions
db.messages.countDocuments({ isMention: true })

// Group mentions by date
db.messages.aggregate([
  { $match: { isMention: true } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
      count: { $sum: 1 }
  }}
])

// Most active mentioners
db.messages.aggregate([
  { $match: { isMention: true } },
  { $group: { _id: "$senderJid", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
])
```

---

## 🚀 Next Steps

Fitur mention ini membuka banyak kemungkinan:

1. **AI Integration** - Process mention dengan AI untuk smart response
2. **Command System** - Buat command bot seperti `/help`, `/status`, dll
3. **Analytics** - Track berapa kali bot di-mention, oleh siapa, dll
4. **Multi-bot** - Support multiple bots dalam satu group
5. **Mention Reply** - Reply dengan mention balik ke user

Selamat menggunakan fitur mention! 🎉
