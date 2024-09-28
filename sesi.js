const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const qrcode = require('qrcode-terminal'); // Untuk menampilkan QR code di terminal

// Fungsi untuk membuat koneksi
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, './sessions'));

    const sock = makeWASocket({
        // Konfigurasi tambahan (opsional)
        printQRInTerminal: false, // Nonaktifkan tampilan QR code bawaan Baileys
        auth: state
    });

    // Event saat QR code diperlukan
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true }); // Tampilkan QR code menggunakan qrcode-terminal
        }

        if (connection === 'close') {
            // Cek apakah perlu reconnect (bukan karena logout)
            const shouldReconnect = (lastDisconnect.error && lastDisconnect.error.isBoom && 
                lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) || false;
            
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);

            if (shouldReconnect) {
                connectToWhatsApp(); // Coba koneksi ulang
            }
        } else if (connection === 'open') {
            console.log('opened connection'); // Koneksi berhasil
        }
    });

    // Event saat creds berubah (misalnya setelah scan QR)
    sock.ev.on('creds.update', saveCreds);

    // Event saat menerima pesan
    sock.ev.on('messages.upsert', async (m) => {
        console.log(JSON.stringify(m, undefined, 2)); // Cetak pesan yang diterima (untuk debugging)

        // Balas pesan
        const message = m.messages[0];
        if (!message.key.fromMe && message.key.remoteJid) { // Pastikan pesan bukan dari bot sendiri
            console.log('replying to', message.key.remoteJid);
            await sock.sendMessage(message.key.remoteJid, { text: 'Hello there!' });
        }
    });
}

// Mulai koneksi
connectToWhatsApp();