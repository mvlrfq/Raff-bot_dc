const https = require('https');

// Konfigurasi Bot Anda
const BOT_TOKEN = process.env.BOT_TOKEN;

// 📂 DAFTAR BANYAK CHANNEL (Bisa diisi banyak ID channel sekaligus)
const ALLOWED_CHANNEL_IDS = [
    '1546407858285977631'
];

// 🛡️ DAFTAR ID PESAN YANG DIKECUALIKAN (Tidak akan dihapus otomatis)
const EXCLUDED_MESSAGE_IDS = [
    '1563141754121879633'
];

/**
 * Fungsi untuk menghapus pesan berdasarkan ID
 */
function hapusPesan(channelId, messageId) {
    const options = {
        hostname: 'discord.com',
        path: `/api/v10/channels/${channelId}/messages/${messageId}`,
        method: 'DELETE',
        headers: {
            'Authorization': `Bot ${BOT_TOKEN}`
        }
    };

    const req = https.request(options, (res) => {
        if (res.statusCode === 204) {
            console.log(`[Auto-Delete] Pesan ${messageId} di channel ${channelId} berhasil dibersihkan.`);
        }
    });

    req.on('error', (err) => {
        console.error('[Error Hapus]', err.message);
    });

    req.end();
}

/**
 * Fungsi untuk memeriksa pesan di semua channel yang terdaftar
 */
function cekDanBersihkanPesan() {
    ALLOWED_CHANNEL_IDS.forEach((channelId) => {
        const options = {
            hostname: 'discord.com',
            path: `/api/v10/channels/${channelId}/messages?limit=50`,
            method: 'GET',
            headers: {
                'Authorization': `Bot ${BOT_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    const messages = JSON.parse(responseData);
                    const waktuSekarang = Date.now();

                    messages.forEach((msg) => {
                        // Jangan hapus jika masuk daftar pengecualian ID pesan
                        if (EXCLUDED_MESSAGE_IDS.includes(msg.id)) {
                            return;
                        }

                        // Hitung umur pesan berdasarkan Snowflake ID Discord
                        const waktuPesan = Number(BigInt(msg.id) >> 22n) + 1420070400000;
                        const selisihDetik = (waktuSekarang - waktuPesan) / 1000;

                        // Jika umur pesan lebih dari 60 detik (1 min), hapus!
                        if (selisihDetik > 60) {
                            hapusPesan(channelId, msg.id);
                        }
                    });
                }
            });
        });

        req.on('error', (err) => {
            // Abaikan error jaringan sementara agar bot tidak crash
        });

        req.end();
    });
}

// 🔄 Pengecekan berjalan otomatis setiap 10 saat untuk semua channel di dalam senarai
console.log('[Cleaner] Bot pembersih multi-channel berjalan...');
setInterval(cekDanBersihkanPesan, 10000);