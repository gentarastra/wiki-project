// wikipedia-backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); 

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

let arsipRahasia = [];

function simpanKeArsip(teks, tipe, senderId = null) {
    const waktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const idPesan = Date.now() + Math.random();
    
    const dataBaru = { id: idPesan, waktu, teks, tipe, senderId };
    arsipRahasia.push(dataBaru);

    // Self-Destruct 30 menit
    setTimeout(() => {
        arsipRahasia = arsipRahasia.filter(msg => msg.id !== idPesan);
    }, 1800000);

    if (arsipRahasia.length > 100) arsipRahasia.shift();
}

io.on('connection', (socket) => {
    // Gunakan label statis "Kontributor Anonim"
    const namaUser = "Kontributor Anonim";

    const msgJoin = `Log Sistem: ${namaUser} bergabung untuk meninjau artikel.`;
    simpanKeArsip(msgJoin, 'sistem', null);
    socket.broadcast.emit('sistem_pesan', { teks: msgJoin, tipe: 'join' });

    socket.on('kirim_pesan', (msg) => {
        simpanKeArsip(msg, 'chat', socket.id); 
        socket.broadcast.emit('terima_pesan', { 
            teks: msg, 
            senderId: socket.id 
        });
    });

    socket.on('status_boss_key', (isSafe) => {
        const msgSistem = isSafe ? 'Perlindungan halaman aktif.' : 'Perlindungan halaman dicabut.';
        simpanKeArsip(msgSistem, 'sistem', null);
        socket.broadcast.emit('sistem_pesan', { teks: msgSistem, tipe: isSafe ? 'darurat_on' : 'darurat_off' });
    });

    socket.on('minta_arsip', () => {
        socket.emit('terima_arsip', arsipRahasia);
    });

    socket.on('disconnect', () => {
        const msgLeave = `Log Sistem: ${namaUser} telah mengakhiri sesi peninjauan.`;
        simpanKeArsip(msgLeave, 'sistem', null);
        socket.broadcast.emit('sistem_pesan', { teks: msgLeave, tipe: 'leave' });
    });
});

const PORT = process.env.PORT || 3000; // Render akan memberikan port otomatis
server.listen(PORT, () => console.log(`Ghost Server aktif di port ${PORT}`));