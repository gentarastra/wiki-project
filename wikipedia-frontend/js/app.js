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

// --- 2. LOGIKA PRESENSI (JOIN NOTIFICATION) ---
const presenceRef = database.ref('status_kehadiran');
const userStatusRef = presenceRef.push();

database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) return;

    userStatusRef.onDisconnect().remove().then(() => {
        userStatusRef.set({
            status: 'online',
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        });

        // Kirim notifikasi join ke database
        chatRef.push({
            teks: "Seorang kontributor baru telah bergabung dalam sesi penyuntingan.",
            tipe: 'join',
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            senderId: "system"
        });
    });
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
        // Kirim log darurat ke teman lain
        chatRef.push({
            teks: "Perlindungan halaman aktif (Halaman diproteksi).",
            tipe: 'darurat_on',
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            senderId: "system"
        });
    } else {
        safeScreen.classList.add('hidden');
        updateJudulHalaman();
        chatRef.push({
            teks: "Perlindungan halaman dicabut.",
            tipe: 'darurat_off',
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            senderId: "system"
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
        chatInput.placeholder = "Ketik rahasia...";
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
                tipe: 'chat'
            });
            chatInput.value = "";
        }
    }
});

// --- 7. LISTENER REALTIME (RENDER DATA) ---
chatRef.limitToLast(25).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.senderId === myId;
    
    if (data.tipe === 'chat') {
        // Tampilkan di Halaman Rahasia (Referensi)
        const liRef = document.createElement('li');
        liRef.className = "mb-2 animate-fade-in";
        liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^</span> ${isMe ? '<b>' : '<i>'}"${data.teks}"${isMe ? '</b>' : '</i>'}. Diakses pada 2026.`;
        daftarReferensi.appendChild(liRef);
        if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);

        // Tampilkan di Halaman Riwayat (Arsip)
        const liArsip = document.createElement('li');
        liArsip.className = "flex items-start gap-2 border-b border-gray-100 py-2 text-[13px]";
        liArsip.innerHTML = `
            <span class="text-[#0645ad]">(skr | prb)</span> 
            <span class="text-gray-500 w-12 font-mono">${data.waktu}</span> 
            <div class="flex-1"><b>${isMe ? 'Me' : 'Anonymous'}</b> . . <span class="${isMe ? '' : 'italic text-blue-900'}">"${data.teks}"</span></div>`;
        daftarArsipLengkap.appendChild(liArsip);

    } else {
        // JIKA TIPE BUKAN CHAT (SISTEM/JOIN)
        tampilkanNotifikasiSistem(data.teks, data.tipe);
    }

    if (!halamanRahasia.classList.contains('hidden')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
});

// --- 8. FUNGSI LOG SISTEM (HIJAU/COKELAT/BIRU) ---
function tampilkanNotifikasiSistem(pesanSistem, tipe) {
    const li = document.createElement('li');
    let warnaHex = "#72777d"; 
    let ikon = "♦";

    if (tipe === 'join') { 
        warnaHex = "#006400"; // Hijau Tua
        ikon = "+"; 
    } else if (tipe === 'darurat_on') { 
        warnaHex = "#855e00"; // Cokelat Emas
        ikon = "⚠"; 
    } else if (tipe === 'darurat_off') { 
        warnaHex = "#36c"; // Biru
        ikon = "✅"; 
    }

    li.style.color = warnaHex;
    li.className = "mb-2 italic text-[12px] flex items-center gap-2 font-sans animate-fade-in";
    li.innerHTML = `<span style="font-weight: bold;">${ikon}</span> <span>${pesanSistem}</span>`;
    
    // Duplikasi ke Referensi & Arsip
    daftarReferensi.appendChild(li);
    const liArsip = li.cloneNode(true);
    liArsip.className = "flex items-center gap-2 border-b border-gray-100 py-2 text-[12px] italic animate-fade-in";
    daftarArsipLengkap.appendChild(liArsip);
}
