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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const chatRef = database.ref('wiki_history'); 
const stateRef = database.ref('status_global'); 
const typingRef = database.ref('status_mengetik'); // Database untuk deteksi ngetik
const myId = Math.random().toString(36).substring(7);
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
const daftarReferensi = document.getElementById('daftar-referensi');
const logoWiki = document.getElementById('logo-wiki'); 

// --- BIKIN ELEMEN LAYAR BLUR PROTEKSI SECARA DINAMIS (DESAIN ELEGAN) ---
const layarProteksi = document.createElement('div');
layarProteksi.id = "layar-proteksi";
layarProteksi.className = "fixed inset-0 bg-[#0a0a0a]/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center hidden transition-all duration-500";
layarProteksi.innerHTML = `
    <div class="text-center px-6 animate-fade-in">
        <div class="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-8">
            <svg class="animate-spin w-full h-full text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                <path class="opacity-80" fill="#ffffff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
        <h2 class="text-xl sm:text-2xl font-light text-white mb-4 tracking-[0.2em] uppercase">System Maintenance</h2>
        <div class="w-12 h-[1px] bg-gray-600 mx-auto mb-6"></div>
        <p class="text-[13px] sm:text-[14px] text-gray-400 font-light max-w-md mx-auto leading-relaxed">
            Server sedang dalam pemeliharaan rutin untuk peningkatan sistem. Seluruh akses dihentikan sementara waktu. Mohon kembali beberapa saat lagi.
        </p>
        <div class="mt-12 flex justify-center gap-3 opacity-60">
            <div class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" style="animation-delay: 0.2s"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" style="animation-delay: 0.4s"></div>
        </div>
    </div>
`;
document.body.appendChild(layarProteksi);

// --- 2. LOGIKA PRESENSI (RADAR ANTI DUPLIKAT) ---
const presenceRef = database.ref('status_kehadiran');
const userStatusRef = presenceRef.push();
let daftarUserOnline = {}; 

database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) return;
    userStatusRef.onDisconnect().remove().then(() => {
        userStatusRef.set({ status: 'online', userId: myId });
    });
    // Hapus status ngetik kita kalau tiba-tiba terputus
    typingRef.child(myId).onDisconnect().remove(); 
});

presenceRef.on('child_added', (snapshot) => {
    const data = snapshot.val();
    if (data && data.userId !== myId) {
        if (!daftarUserOnline[data.userId]) {
            daftarUserOnline[data.userId] = true; 
            tampilkanNotifikasiSistem("Seorang kontributor telah bergabung dalam sesi.", "join", true);
        }
    }
});

presenceRef.on('child_removed', (snapshot) => {
    const data = snapshot.val();
    if (data && data.userId !== myId) {
        if (daftarUserOnline[data.userId]) {
            delete daftarUserOnline[data.userId]; 
            tampilkanNotifikasiSistem("Seorang kontributor telah meninggalkan sesi.", "leave", true);
        }
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

// --- 4. PANIC TAB (Ubah Judul Tab Otomatis Saat Ditinggal) ---
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        document.title = "Google"; // Berubah pura-pura jadi Google
    } else {
        // Kembalikan ke judul asli saat dibuka lagi
        stateRef.once('value').then((snapshot) => {
            const diproteksi = snapshot.val()?.diproteksi || false;
            if (diproteksi) {
                document.title = "System Maintenance";
            } else {
                updateJudulHalaman();
            }
        });
    }
});

// --- 5. GLOBAL BOSS KEY & AUTO-LOCK (KUNCI OTOMATIS) ---
let idleTimeout;

function resetIdleTimer() {
    clearTimeout(idleTimeout);
    // Jika tidak ada aktivitas selama 3 menit (180.000 ms), kunci layar
    idleTimeout = setTimeout(() => {
        stateRef.once('value').then((snapshot) => {
            if (!snapshot.val()?.diproteksi) stateRef.set({ diproteksi: true });
        });
    }, 180000); 
}

// Deteksi aktivitas untuk mencegah auto-lock
['mousemove', 'keydown', 'click', 'scroll'].forEach(evt => document.addEventListener(evt, resetIdleTimer));
resetIdleTimer(); // Mulai timer saat web dibuka

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pemicuDarurat();
});
logoWiki.addEventListener('dblclick', pemicuDarurat);

function pemicuDarurat() {
    stateRef.once('value').then((snapshot) => {
        const currentStatus = snapshot.val()?.diproteksi || false;
        stateRef.set({ diproteksi: !currentStatus });
    });
}

stateRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.diproteksi) {
        layarProteksi.classList.remove('hidden');
        document.title = "System Maintenance";
        chatInput.blur(); 
    } else {
        layarProteksi.classList.add('hidden');
        updateJudulHalaman();
    }
});

function updateJudulHalaman() {
    if (!halamanRahasia.classList.contains('hidden')) {
        document.title = "Sejarah Nusantara - Wikipedia bahasa Indonesia";
    } else if (!halamanRiwayat.classList.contains('hidden')) {
        document.title = "Riwayat revisi: Sejarah Nusantara - Wikipedia";
    } else {
        document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
    }
}

// --- 6. NAVIGASI HALAMAN ---
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
        // Mode Chat Rahasia
        chatInput.placeholder = "Ketik rahasia...";
        chatInput.focus();
    } else {
        // Mode Penyamaran (Bisa diketik untuk Dummy Search)
        chatInput.placeholder = "Telusuri Wikipedia";
    }
    updateJudulHalaman();
    if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
}

menuUtama.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));
menuRahasia.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanRahasia)));
logoWiki.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));

// --- 7. LOGIKA KIRIM & Pengecoh Kolom Pencarian (DUMMY SEARCH) ---
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const pesan = chatInput.value.trim();
        if (pesan === "") return;

        // JIKA DI HALAMAN UTAMA (PENYAMARAN) -> LAKUKAN PENCARIAN WIKIPEDIA ASLI
        if (halamanRahasia.classList.contains('hidden')) {
            window.location.href = `https://id.wikipedia.org/wiki/Istimewa:Pencarian?search=${encodeURIComponent(pesan)}`;
            return;
        }

        // JIKA DI HALAMAN RAHASIA -> FITUR CHAT
        if (pesan === "*#arsip#*") {
            gantiHalaman(halamanRiwayat);
            chatInput.value = "";
            return;
        }

        if (pesan === "*#hapus#*") {
            chatRef.remove().then(() => {
                chatRef.push({
                    teks: "Seluruh riwayat obrolan telah dibersihkan oleh sistem.",
                    tipe: 'darurat_on',
                    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    senderId: "system",
                    timestamp: Date.now()
                });
            });
            chatInput.value = "";
            return;
        }

        chatRef.push({
            senderId: myId,
            teks: pesan,
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            tipe: 'chat',
            timestamp: Date.now()
        });
        chatInput.value = "";
        
        // Matikan status mengetik sesaat setelah mengirim
        typingRef.child(myId).remove();
    }
});

// Listener Jika Database Dihapus (Clear Layar)
chatRef.on('value', (snapshot) => {
    if (!snapshot.exists()) {
        daftarArsipLengkap.innerHTML = "";
        daftarReferensi.innerHTML = "";
    }
});

// --- 8. INDIKATOR MENGETIK (STEALTH TYPING) ---
let typingTimer;
chatInput.addEventListener('input', () => {
    // Kalau kita ada di halaman rahasia, kasih tau server kita lagi ngetik
    if (!halamanRahasia.classList.contains('hidden')) {
        typingRef.child(myId).set(true);
        clearTimeout(typingTimer);
        // Anggap berhenti ngetik kalau 2 detik tidak ada ketikan baru
        typingTimer = setTimeout(() => typingRef.child(myId).remove(), 2000);
    }
});

// Dengarkan jika pacar sedang mengetik
typingRef.on('value', (snapshot) => {
    const data = snapshot.val();
    let someoneIsTyping = false;
    
    if (data) {
        Object.keys(data).forEach(id => {
            if (id !== myId) someoneIsTyping = true; // Ada orang lain yg true
        });
    }
    
    // Jika dia ngetik, Logo Wikipedia akan bercahaya biru halus
    if (someoneIsTyping) {
        logoWiki.style.filter = "drop-shadow(0px 0px 4px #36c)";
        logoWiki.style.transition = "filter 0.3s ease";
    } else {
        logoWiki.style.filter = "none";
    }
});


// --- 9. LISTENER REALTIME (RENDER CHAT) ---
chatRef.limitToLast(50).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.senderId === myId;
    const pesanBaru = data.timestamp >= waktuMulaiSesi;
    
    if (data.tipe === 'chat') {
        const liArsip = document.createElement('li');
        liArsip.className = "flex flex-col sm:flex-row sm:items-baseline gap-3 border-b border-gray-200 py-3 text-[13px] hover:bg-blue-50 transition-colors";
        
        let badge = isMe ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ME</span>` : `<span class="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ANON</span>`;
        let teksArsip = isMe ? `<span class="text-gray-900 font-medium break-words">${data.teks}</span>` : `<span class="text-gray-700 italic break-words">${data.teks}</span>`;

        liArsip.innerHTML = `<div class="flex items-center gap-2 min-w-[130px] text-gray-500 font-mono text-xs shrink-0"><span class="text-[#0645ad] hover:underline cursor-pointer">(skr | prb)</span> <span>${data.waktu}</span></div><div class="flex-1 flex items-start gap-2">${badge} ${teksArsip}</div>`;
        daftarArsipLengkap.appendChild(liArsip);

        if (pesanBaru) {
            const liRef = document.createElement('li');
            liRef.className = "mb-2 animate-fade-in text-[13px] md:text-[14px]";
            if (isMe) {
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="text-gray-900 font-medium">"${data.teks}"</span>. <i>Arsip Pribadi</i>, 2026.`;
            } else {
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>b</sup></span> <span class="text-[#0645ad] italic">"${data.teks}"</span>. <i>Sumber Luar</i>, 2026.`;
            }
            daftarReferensi.appendChild(liRef);
            if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
        }
    } else {
        if (pesanBaru || data.tipe === 'darurat_on') tampilkanNotifikasiSistem(data.teks, data.tipe, pesanBaru, data.waktu);
    }

    if (pesanBaru && !halamanRahasia.classList.contains('hidden')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
});

// --- 10. FUNGSI LOG SISTEM ---
function tampilkanNotifikasiSistem(pesanSistem, tipe, pesanBaru, waktuTercatat) {
    const li = document.createElement('li');
    let warnaHex = "#72777d"; let ikon = "♦";
    if (tipe === 'join') { warnaHex = "#006400"; ikon = "+"; } 
    else if (tipe === 'leave') { warnaHex = "#b32424"; ikon = "-"; } 
    else if (tipe === 'darurat_on') { warnaHex = "#855e00"; ikon = "⚠"; } 

    const liArsip = document.createElement('li');
    liArsip.className = "flex flex-col sm:flex-row sm:items-baseline gap-3 border-b border-gray-200 py-2 text-[12px] bg-gray-50";
    let jamTayang = waktuTercatat || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    liArsip.innerHTML = `<div class="flex items-center gap-2 min-w-[130px] text-gray-400 font-mono text-xs shrink-0"><span>(log sistem)</span> <span>${jamTayang}</span></div><div class="flex-1 flex items-center gap-2 animate-fade-in" style="color: ${warnaHex};"><span class="font-bold text-sm">${ikon}</span> <span class="italic">${pesanSistem}</span></div>`;
    daftarArsipLengkap.appendChild(liArsip);

    if (pesanBaru) {
        li.style.color = warnaHex;
        li.className = "mb-2 italic text-[12px] flex items-center gap-2 font-sans animate-fade-in";
        li.innerHTML = `<span style="font-weight: bold;">${ikon}</span> <span>${pesanSistem}</span>`;
        daftarReferensi.appendChild(li);
        if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
    }
}
