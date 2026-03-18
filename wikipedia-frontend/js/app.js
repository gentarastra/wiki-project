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
const stateRef = database.ref('status_global'); // Database khusus untuk Lock Layar
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

// --- BIKIN ELEMEN LAYAR BLUR PROTEKSI SECARA DINAMIS ---
const layarProteksi = document.createElement('div');
layarProteksi.id = "layar-proteksi";
layarProteksi.className = "fixed inset-0 bg-white/60 backdrop-blur-md z-[9999] flex flex-col items-center justify-center hidden transition-all duration-300";
layarProteksi.innerHTML = `
    <div class="bg-white border border-[#a2a9b1] shadow-2xl p-6 sm:p-8 max-w-[90%] sm:max-w-md text-center rounded-[2px]">
        <svg class="mx-auto mb-4 text-[#d33]" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h2 class="text-xl sm:text-2xl font-serif text-[#202122] mb-3 border-b border-gray-300 pb-2">Halaman Semi-Perlindungan</h2>
        <p class="text-[13px] sm:text-[14px] text-gray-700 leading-relaxed">Halaman ini sedang diproteksi dari penyuntingan untuk mencegah vandalisme. Mohon tunggu sebentar hingga status perlindungan dicabut oleh pengurus.</p>
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

// --- 4. GLOBAL BOSS KEY (LAYAR KUNCI UNTUK SEMUA) ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pemicuDarurat();
});
logoWiki.addEventListener('dblclick', pemicuDarurat);

function pemicuDarurat() {
    // Balikkan status proteksi di server
    stateRef.once('value').then((snapshot) => {
        const currentStatus = snapshot.val()?.diproteksi || false;
        stateRef.set({ diproteksi: !currentStatus });
    });
}

// Mendengar perubahan status proteksi dari Firebase
stateRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.diproteksi) {
        layarProteksi.classList.remove('hidden');
        document.title = "Dilindungi - Wikipedia bahasa Indonesia";
        chatInput.blur(); // Lepaskan fokus keyboard
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

// --- 6. LOGIKA KIRIM & FITUR HAPUS RIWAYAT ---
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !halamanRahasia.classList.contains('hidden')) {
        const pesan = chatInput.value.trim();
        
        // Perintah Buka Arsip
        if (pesan === "*#arsip#*") {
            gantiHalaman(halamanRiwayat);
            chatInput.value = "";
            return;
        }

        // Perintah Sapu Bersih (Hapus Database)
        if (pesan === "*#hapus#*") {
            chatRef.remove().then(() => {
                chatRef.push({
                    teks: "Seluruh riwayat obrolan telah dibersihkan oleh sistem.",
                    tipe: 'darurat_on', // Warna peringatan (Cokelat Emas)
                    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    senderId: "system",
                    timestamp: Date.now()
                });
            });
            chatInput.value = "";
            return;
        }

        // Kirim Pesan Biasa
        if (pesan !== "") {
            chatRef.push({
                senderId: myId,
                teks: pesan,
                waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                tipe: 'chat',
                timestamp: Date.now()
            });
            chatInput.value = "";
        }
    }
});

// Listener Jika Database Dihapus Kosong (Clear Layar)
chatRef.on('value', (snapshot) => {
    if (!snapshot.exists()) {
        daftarArsipLengkap.innerHTML = "";
        daftarReferensi.innerHTML = "";
    }
});

// --- 7. LISTENER REALTIME (RENDER CHAT) ---
chatRef.limitToLast(50).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.senderId === myId;
    const pesanBaru = data.timestamp >= waktuMulaiSesi;
    
    if (data.tipe === 'chat') {
        const liArsip = document.createElement('li');
        liArsip.className = "flex flex-col sm:flex-row sm:items-baseline gap-3 border-b border-gray-200 py-3 text-[13px] hover:bg-blue-50 transition-colors";
        
        let badge = isMe 
            ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ME</span>` 
            : `<span class="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ANON</span>`;
        
        let teksArsip = isMe 
            ? `<span class="text-gray-900 font-medium break-words">${data.teks}</span>` 
            : `<span class="text-gray-700 italic break-words">${data.teks}</span>`;

        liArsip.innerHTML = `
            <div class="flex items-center gap-2 min-w-[130px] text-gray-500 font-mono text-xs shrink-0">
                <span class="text-[#0645ad] hover:underline cursor-pointer">(skr | prb)</span> 
                <span>${data.waktu}</span>
            </div>
            <div class="flex-1 flex items-start gap-2">${badge} ${teksArsip}</div>`;
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
        if (pesanBaru || data.tipe === 'darurat_on') { 
            tampilkanNotifikasiSistem(data.teks, data.tipe, pesanBaru, data.waktu);
        }
    }

    if (pesanBaru && !halamanRahasia.classList.contains('hidden')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
});

// --- 8. FUNGSI LOG SISTEM ---
function tampilkanNotifikasiSistem(pesanSistem, tipe, pesanBaru, waktuTercatat) {
    const li = document.createElement('li');
    let warnaHex = "#72777d"; 
    let ikon = "♦";

    if (tipe === 'join') { warnaHex = "#006400"; ikon = "+"; } 
    else if (tipe === 'leave') { warnaHex = "#b32424"; ikon = "-"; } 
    else if (tipe === 'darurat_on') { warnaHex = "#855e00"; ikon = "⚠"; } 

    const liArsip = document.createElement('li');
    liArsip.className = "flex flex-col sm:flex-row sm:items-baseline gap-3 border-b border-gray-200 py-2 text-[12px] bg-gray-50";
    let jamTayang = waktuTercatat || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    liArsip.innerHTML = `
        <div class="flex items-center gap-2 min-w-[130px] text-gray-400 font-mono text-xs shrink-0">
            <span>(log sistem)</span> <span>${jamTayang}</span>
        </div>
        <div class="flex-1 flex items-center gap-2 animate-fade-in" style="color: ${warnaHex};">
            <span class="font-bold text-sm">${ikon}</span> <span class="italic">${pesanSistem}</span>
        </div>`;
    daftarArsipLengkap.appendChild(liArsip);

    if (pesanBaru) {
        li.style.color = warnaHex;
        li.className = "mb-2 italic text-[12px] flex items-center gap-2 font-sans animate-fade-in";
        li.innerHTML = `<span style="font-weight: bold;">${ikon}</span> <span>${pesanSistem}</span>`;
        daftarReferensi.appendChild(li);
        if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
    }
}
