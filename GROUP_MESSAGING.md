# Group Messaging Feature

Fitur untuk mengirim pesan ke group WhatsApp telah ditambahkan ke WhatsApp Gateway.

## Endpoint

### POST /send-group-message

Mengirim pesan ke group WhatsApp.

#### Authentication
- Session Cookie: JWT token dalam cookie `auth-token`
- API Key: Header `X-API-KEY` atau query parameter `?api_key`

#### Request Body

```json
{
  "groupId": "120363123456789012@g.us",
  "message": "Halo semua! Ini adalah pesan group.",
  "reply_to_id": "optional_message_id_for_reply"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| groupId | string | Yes | ID group WhatsApp dengan format `xxxxxxxxxxxx@g.us` |
| message | string | Yes | Isi pesan (maksimal 4096 karakter) |
| reply_to_id | string | No | ID pesan untuk reply/quote message |

#### Response Success

```json
{
  "success": true,
  "messageId": "BAE5ABC123...",
  "groupId": "120363123456789012@g.us",
  "message": "Halo semua! Ini adalah pesan group."
}
```

#### Response Error

```json
{
  "error": "Validation failed",
  "details": [
    "Field \"groupId\" is required and must be a non-empty string",
    "Message length cannot exceed 4096 characters"
  ]
}
```

## Cara Mendapatkan Group ID

### Metode 1: Halaman Groups (Termudah) ✅

1. Login ke dashboard WhatsApp Gateway
2. Klik menu **"Groups"** di sidebar
3. Anda akan melihat semua group yang Anda ikuti
4. Setiap group menampilkan:
   - Nama group
   - Group ID (format: `xxxxxxxxxxxx@g.us`)
   - Jumlah members
   - Deskripsi group
5. Klik tombol **"Copy"** untuk copy Group ID ke clipboard
6. Atau gunakan tombol **"Kirim Pesan"** untuk langsung test kirim pesan

### Metode 2: Webhook

Saat menerima pesan dari group, field `chatJid` akan berisi group ID.

### Metode 3: Database

Dari collection `Message`, lihat field `chatJid` untuk pesan dari group.

**Format Group ID:** `[angka]@g.us`

**Contoh:** `120363123456789012@g.us`

## Contoh Penggunaan

### cURL

```bash
curl -X POST http://localhost:3000/send-group-message \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key-here" \
  -d '{
    "groupId": "120363123456789012@g.us",
    "message": "Halo dari API!"
  }'
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

async function sendGroupMessage() {
  try {
    const response = await axios.post('http://localhost:3000/send-group-message', {
      groupId: '120363123456789012@g.us',
      message: 'Halo dari Node.js!'
    }, {
      headers: {
        'X-API-KEY': 'your-api-key-here'
      }
    });

    console.log('Pesan terkirim:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

sendGroupMessage();
```

### Python

```python
import requests

def send_group_message():
    url = 'http://localhost:3000/send-group-message'
    headers = {
        'X-API-KEY': 'your-api-key-here',
        'Content-Type': 'application/json'
    }
    data = {
        'groupId': '120363123456789012@g.us',
        'message': 'Halo dari Python!'
    }

    response = requests.post(url, json=data, headers=headers)
    print(response.json())

send_group_message()
```

## Fitur

- ✅ Mengirim pesan teks ke group
- ✅ Reply/quote pesan dalam group
- ✅ Validasi format group ID
- ✅ Validasi panjang pesan (maks 4096 karakter)
- ✅ Simpan riwayat pesan group ke database
- ✅ Real-time notification via Socket.IO
- ✅ Webhook notification untuk pesan keluar

## Catatan

1. WhatsApp harus terhubung terlebih dahulu (scan QR code)
2. Bot harus menjadi member dari group yang ingin dikirim pesan
3. Group ID harus dalam format yang benar: `xxxxxxxxxxxx@g.us`
4. Pesan maksimal 4096 karakter

## Validasi

Sistem akan memvalidasi:
- Group ID tidak boleh kosong
- Group ID harus mengandung `@g.us`
- Pesan tidak boleh kosong
- Panjang pesan maksimal 4096 karakter
