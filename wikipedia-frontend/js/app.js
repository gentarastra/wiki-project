// wikipedia-frontend/js/app.js

// --- 0. KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCBhpa1S7KEjaovbIH5Kj4P58FgE3On0EA",
    authDomain: "wiki-project-b88d2.firebaseapp.com",
    databaseURL: "https://wiki-project-b88d2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "wiki-project-b88d2",
    storageBucket: "wiki-project-b88d2.firebasestorage.app",
    messagingSenderId: "415075792805",
    appId: "1:415075792805:web:6d63fe39fd3e07fe811a4c",
    measurementId: "G-020BY39YQE"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const chatRef = database.ref('wiki_history'); 
const myId = Math.random().toString(36).substring(7);

// PENANDA WAKTU SESI (Untuk membedakan chat lama dan chat baru)
const waktuMulaiSesi = Date.now();

// --- 1. DEKLARASI ELEMEN ---
const menuUtama = document.getElementById('menu-utama');
const menuRahasia = document.getElementById('menu-rahasia');
const halamanUtama = document.getElementById('halaman-utama');
const halamanRahasia = document.getElementById('halaman-rahasia');
const halamanRiwayat = document.getElementById('halaman-riwayat');
const daftarArsipLengkap = document.getElementById('daftar-arsip-lengkap');
const chatInput = document.getElementById('rahasia-input');
const tombolMenu = document.getElementById('tombol-menu');
const sidebarKiri = document.getElementById('sidebar-kiri');
const safeScreen = document.getElementById('safe-screen');
const daftarReferensi = document.getElementById('daftar-referensi');
const logoWiki = document.getElementById('logo-wiki'); 

// --- 2. LOGIKA PRESENSI (JOIN & LEAVE NOTIFICATION) ---
const presenceRef = database.ref('status_kehadiran');
const userStatusRef = presenceRef.push();

database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) return;

    // Saat tab ditutup, Firebase otomatis menghapus data ini
    userStatusRef.onDisconnect().remove().then(() => {
        // Saat online, simpan ID kita ke daftar kehadiran
        userStatusRef.set({ 
            status: 'online',
            userId: myId 
        });
        
        // KITA HAPUS pengiriman log 'join' ke chatRef di sini
        // agar layar tidak memunculkan notifikasi untuk diri sendiri.
    });
});

// DETEKSI SAAT PACAR MASUK (ATAU SUDAH STANDBY)
presenceRef.on('child_added', (snapshot) => {
    const data = snapshot.val();
    
    // CEK: Jika user yang terdeteksi online BUKAN diri kita sendiri
    if (data && data.userId !== myId) {
        // Tampilkan notifikasi hijau di layar referensi
        tampilkanNotifikasiSistem("Seorang kontributor telah bergabung dalam sesi.", "join", true);
    }
});

// DETEKSI SAAT PACAR MENUTUP TAB (LEAVE)
presenceRef.on('child_removed', (snapshot) => {
    const data = snapshot.val();
    
    // CEK: Jika user yang keluar BUKAN diri kita sendiri
    if (data && data.userId !== myId) {
        // Tampilkan notifikasi merah di layar referensi
        tampilkanNotifikasiSistem("Seorang kontributor telah meninggalkan sesi.", "leave", true);
    }
});

// --- 3. FITUR SIDEBAR ---
tombolMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebarKiri.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!sidebarKiri.contains(e.target) && e.target !== tombolMenu) {
        if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
    }
});

// --- 4. BOSS KEY (ESC / DOUBLE CLICK LOGO) ---
let isSafeMode = false;
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pemicuDarurat();
});
logoWiki.addEventListener('dblclick', pemicuDarurat);

function pemicuDarurat() {
    isSafeMode = !isSafeMode;
    if (isSafeMode) {
        safeScreen.classList.remove('hidden');
        document.title = "404 Not Found";
        chatRef.push({
            teks: "Perlindungan halaman aktif (Halaman diproteksi).",
            tipe: 'darurat_on',
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            senderId: "system",
            timestamp: Date.now() // Tambahkan timestamp
        });
    } else {
        safeScreen.classList.add('hidden');
        updateJudulHalaman();
        chatRef.push({
            teks: "Perlindungan halaman dicabut.",
            tipe: 'darurat_off',
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            senderId: "system",
            timestamp: Date.now() // Tambahkan timestamp
        });
    }
}

function updateJudulHalaman() {
    if (!halamanRahasia.classList.contains('hidden')) {
        document.title = "Sejarah Nusantara - Wikipedia bahasa Indonesia";
    } else if (!halamanRiwayat.classList.contains('hidden')) {
        document.title = "Riwayat revisi: Sejarah Nusantara - Wikipedia";
    } else {
        document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
    }
}

// --- 5. NAVIGASI HALAMAN ---
function jalankanLoading(callback) {
    chatInput.placeholder = "Memuat data...";
    chatInput.classList.add('opacity-50');
    setTimeout(() => {
        chatInput.classList.remove('opacity-50');
        if(callback) callback();
    }, 400);
}

function gantiHalaman(tujuan) {
    halamanUtama.classList.add('hidden');
    halamanRahasia.classList.add('hidden');
    halamanRiwayat.classList.add('hidden');
    tujuan.classList.remove('hidden');

    if (tujuan === halamanRahasia) {
        chatInput.removeAttribute('readonly');
        chatInput.placeholder = "Telusuri Wikipedia";
        chatInput.focus();
    } else {
        chatInput.setAttribute('readonly', true);
        chatInput.placeholder = "Telusuri Wikipedia";
    }
    updateJudulHalaman();
    if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
}

menuUtama.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));
menuRahasia.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanRahasia)));
logoWiki.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));

// --- 6. LOGIKA KIRIM CHAT ---
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !halamanRahasia.classList.contains('hidden')) {
        const pesan = chatInput.value.trim();
        if (pesan === "*#arsip#*") {
            gantiHalaman(halamanRiwayat);
            chatInput.value = "";
            return;
        }
        if (pesan !== "") {
            chatRef.push({
                senderId: myId,
                teks: pesan,
                waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                tipe: 'chat',
                timestamp: Date.now() // Tambahkan timestamp
            });
            chatInput.value = "";
        }
    }
});

// --- 7. LISTENER REALTIME (RENDER DATA) ---
chatRef.limitToLast(30).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.senderId === myId;
    
    // Cek apakah pesan ini dikirim SETELAH kita membuka web
    const pesanBaru = data.timestamp >= waktuMulaiSesi;
    
    if (data.tipe === 'chat') {
        // --- RENDER KE HALAMAN ARSIP (Selalu Tampil) ---
        const liArsip = document.createElement('li');
        liArsip.className = "flex items-start gap-2 border-b border-gray-100 py-2 text-[13px] hover:bg-gray-50";
        
        let pengirimArsip = isMe ? `<b class="text-[#0645ad]">Me</b>` : `<b class="text-[#b32424]">Anonymous</b>`;
        let teksArsip = isMe ? `<span class="text-gray-900 font-medium">"${data.teks}"</span>` : `<span class="italic text-gray-600">"${data.teks}"</span>`;

        liArsip.innerHTML = `
            <span class="text-[#0645ad]">(skr | prb)</span> 
            <span class="text-gray-500 w-12 font-mono shrink-0">${data.waktu}</span> 
            <div class="flex-1">${pengirimArsip} . . ${teksArsip}</div>`;
        daftarArsipLengkap.appendChild(liArsip);

        // --- RENDER KE HALAMAN RAHASIA (Hanya Pesan Baru) ---
        if (pesanBaru) {
            const liRef = document.createElement('li');
            liRef.className = "mb-2 animate-fade-in text-[13px] md:text-[14px]";
            
            if (isMe) {
                // GAYA PESAN KAMU: Teks Hitam Medium + "Arsip Pribadi"
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="text-gray-900 font-medium">"${data.teks}"</span>. <i>Arsip Pribadi</i>, 2026.`;
            } else {
                // GAYA PESAN TEMAN: Teks Biru Miring + "Sumber Luar"
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>b</sup></span> <span class="text-[#0645ad] italic">"${data.teks}"</span>. <i>Sumber Luar</i>, 2026.`;
            }

            daftarReferensi.appendChild(liRef);
            if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
        }

    } else {
        // JIKA TIPE BUKAN CHAT (SISTEM/JOIN)
        tampilkanNotifikasiSistem(data.teks, data.tipe, pesanBaru);
    }

    // Auto-scroll hanya jika kita mendapat pesan baru
    if (pesanBaru && !halamanRahasia.classList.contains('hidden')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
});

// --- 8. FUNGSI LOG SISTEM (DENGAN FILTER PESAN BARU) ---
function tampilkanNotifikasiSistem(pesanSistem, tipe, pesanBaru) {
    const li = document.createElement('li');
    let warnaHex = "#72777d"; 
    let ikon = "♦";

    if (tipe === 'join') { 
        warnaHex = "#006400"; // Hijau Tua
        ikon = "+"; 
    } else if (tipe === 'leave') { 
        warnaHex = "#b32424"; // Merah Gelap
        ikon = "-"; 
    } else if (tipe === 'darurat_on') { 
        warnaHex = "#855e00"; // Cokelat Emas
        ikon = "⚠"; 
    } else if (tipe === 'darurat_off') { 
        warnaHex = "#36c"; // Biru
        ikon = "✅"; 
    }

    li.style.color = warnaHex;
    li.innerHTML = `<span style="font-weight: bold;">${ikon}</span> <span>${pesanSistem}</span>`;
    
    // Duplikasi ke Arsip - SELALU DITAMPILKAN
    const liArsip = li.cloneNode(true);
    liArsip.className = "flex items-center gap-2 border-b border-gray-100 py-2 text-[12px] italic animate-fade-in";
    daftarArsipLengkap.appendChild(liArsip);

    // Tampilkan di Chat Aktif - HANYA JIKA PESAN BARU ATAU EVENT REALTIME
    if (pesanBaru) {
        li.className = "mb-2 italic text-[12px] flex items-center gap-2 font-sans animate-fade-in";
        daftarReferensi.appendChild(li);
        if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
    }
}
