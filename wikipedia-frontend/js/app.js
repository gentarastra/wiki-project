// wikipedia-frontend/js/app.js

const SOCKET_URL = "103.189.201.108"; 
const socket = io(SOCKET_URL);

// --- 0. DEKLARASI SEMUA ELEMEN ---
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

// --- 1. INISIALISASI DEFAULT ---
halamanUtama.classList.remove('hidden'); 
halamanRahasia.classList.add('hidden'); 
halamanRiwayat.classList.add('hidden'); 
chatInput.setAttribute('readonly', true); 

// --- 2. FITUR: FAKE LOADING ---
function jalankanLoading(callback) {
    const originalPlaceholder = chatInput.placeholder;
    chatInput.placeholder = "Memuat data...";
    chatInput.classList.add('opacity-50');
    
    setTimeout(() => {
        chatInput.classList.remove('opacity-50');
        chatInput.placeholder = originalPlaceholder;
        if(callback) callback();
    }, 500);
}

// --- 3. FITUR: DOUBLE CLICK RESCUE (LOGO) ---
logoWiki.addEventListener('dblclick', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
});

// --- 4. NAVIGASI ---
tombolMenu.addEventListener('click', () => {
    sidebarKiri.classList.toggle('hidden');
});

function keHalamanUtama() {
    jalankanLoading(() => {
        halamanUtama.classList.remove('hidden');
        halamanRahasia.classList.add('hidden');
        halamanRiwayat.classList.add('hidden');
        document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
        chatInput.setAttribute('readonly', true); 
        chatInput.value = "";
        chatInput.placeholder = "Telusuri Wikipedia";
        if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
    });
}

menuUtama.addEventListener('click', keHalamanUtama);
logoWiki.addEventListener('click', keHalamanUtama);

menuRahasia.addEventListener('click', () => {
    jalankanLoading(() => {
        halamanRahasia.classList.remove('hidden');
        halamanUtama.classList.add('hidden');
        halamanRiwayat.classList.add('hidden');
        document.title = "Sejarah Nusantara - Wikipedia bahasa Indonesia";
        chatInput.removeAttribute('readonly');
        chatInput.focus(); 
        chatInput.value = "";
        chatInput.placeholder = "Telusuri Wikipedia";
        if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
    });
});

// --- 5. BOSS KEY (ESC) ---
let isSafeMode = false;
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        isSafeMode = !isSafeMode;
        socket.emit('status_boss_key', isSafeMode);

        if (isSafeMode) {
            safeScreen.classList.remove('hidden');
            document.title = "404 Not Found";
        } else {
            safeScreen.classList.add('hidden');
            if (!halamanRahasia.classList.contains('hidden')) {
                document.title = "Sejarah Nusantara - Wikipedia bahasa Indonesia";
            } else if (!halamanRiwayat.classList.contains('hidden')) {
                document.title = "Riwayat revisi: Sejarah Nusantara - Wikipedia";
            } else {
                document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
            }
        }
    }
});

// --- 6. CHAT & SANDI DEWA ---
const MAKSIMAL_PESAN = 7;

chatInput.addEventListener('keydown', (e) => {
    if (halamanRahasia.classList.contains('hidden')) return;

    if (e.key === 'Enter') {
        const pesan = chatInput.value.trim();
        
        if (pesan === "*#arsip#*") {
            jalankanLoading(bukaHalamanRiwayat);
            chatInput.value = "";
            return;
        }

        if (pesan !== "") {
            socket.emit('kirim_pesan', pesan);
            tampilkanPesan(pesan, true); 
            chatInput.value = "";
        }
    }
});

// --- 7. RENDER RIWAYAT REVISI ---
socket.on('terima_arsip', (arsip) => {
    daftarArsipLengkap.innerHTML = ""; 
    arsip.forEach(item => {
        tambahKeUIArsip({
            waktu: item.waktu,
            teks: item.teks,
            tipe: item.tipe,
            isLokal: item.senderId === socket.id
        });
    });
});

socket.on('terima_pesan', (data) => {
    tampilkanPesan(data.teks, false);
});

socket.on('sistem_pesan', (data) => {
    tampilkanNotifikasiSistem(data.teks, data.tipe);
});

function bukaHalamanRiwayat() {
    halamanRahasia.classList.add('hidden');
    halamanRiwayat.classList.remove('hidden');
    document.title = "Riwayat revisi: Sejarah Nusantara - Wikipedia";
    socket.emit('minta_arsip');
}

function tambahKeUIArsip(data) {
    const li = document.createElement('li');
    li.className = "flex items-start gap-2 border-b border-gray-100 py-2 hover:bg-gray-50 transition-colors";
    
    let aksi = `<span class="text-[#0645ad] cursor-pointer text-[12px] shrink-0">(skr | prb)</span>`;
    let infoPengirim = "";
    let teksPesan = "";

    if (data.tipe === 'chat') {
        if (data.isLokal) {
            infoPengirim = `<b class="text-[#0645ad] cursor-pointer">Me</b> <span class="text-gray-400 text-[12px]">(Bicara)</span>`;
            teksPesan = `<span class="text-gray-900 font-medium">"${data.teks}"</span>`;
        } else {
            // Label Diganti menjadi Anonymous
            infoPengirim = `<b class="text-[#b32424] cursor-pointer">Anonymous</b> <span class="text-gray-400 text-[12px]">(Bicara)</span>`;
            teksPesan = `<span class="text-blue-900 italic">"${data.teks}"</span>`;
        }
    } else {
        infoPengirim = `<span class="text-gray-500 font-bold uppercase text-[11px]">[System Log]</span>`;
        teksPesan = `<span class="text-gray-500 italic">${data.teks}</span>`;
    }

    li.innerHTML = `${aksi} <span class="text-gray-500 text-[12px] w-14 shrink-0 font-mono">${data.waktu}</span> <div class="flex-1 leading-tight">${infoPengirim} . . ${teksPesan}</div>`;
    daftarArsipLengkap.appendChild(li);
}

// --- 8. RENDER CHAT REFERENSI ---
function tampilkanPesan(pesan, isLokal) {
    const li = document.createElement('li');
    li.className = "mb-2"; 
    const simbolWiki = `<span class="text-[#36c] cursor-pointer">^</span> `;
    
    if (isLokal) {
        li.innerHTML = `${simbolWiki} <span class="text-gray-800 font-medium">"${pesan}"</span>. <i>Arsip Nasional</i>.`;
    } else {
        // Tampilan di bawah artikel dibuat bersih tanpa IP
        li.innerHTML = `${simbolWiki} <span class="text-blue-900 italic">"${pesan}"</span>. Diakses pada 2026.`;
    }
    
    tambahkanKeReferensi(li);
}

function tampilkanNotifikasiSistem(pesanSistem, tipe) {
    const li = document.createElement('li');
    let warnaHex = "#72777d"; // Default Abu-abu Wikipedia
    let ikon = "♦";

    // Logika Warna Berdasarkan Tipe Kejadian (Gaya Admin Wikipedia)
    if (tipe === 'join') { 
        warnaHex = "#006400"; // Hijau Tua
        ikon = "+"; 
    } 
    else if (tipe === 'leave') { 
        warnaHex = "#b32424"; // Merah Tua
        ikon = "−"; 
    } 
    else if (tipe === 'darurat_on') { 
        // WARNA PERINGATAN RESMI (Cokelat Emas Wikipedia)
        warnaHex = "#855e00"; 
        ikon = "⚠"; 
    } 
    else if (tipe === 'darurat_off') { 
        // WARNA INFORMASI (Biru Link)
        warnaHex = "#36c"; 
        ikon = "✅"; 
    }

    // Menggunakan style.color agar pasti tembus ke browser
    li.style.color = warnaHex;
    li.className = `mb-2 italic text-[12px] flex items-center gap-2 font-sans`;
    li.innerHTML = `<span style="font-weight: bold;">${ikon}</span> <span>${pesanSistem}</span>`;
    
    tambahkanKeReferensi(li);
}

function tambahkanKeReferensi(elemenLi) {
    daftarReferensi.appendChild(elemenLi);
    if (daftarReferensi.children.length > MAKSIMAL_PESAN) {
        daftarReferensi.removeChild(daftarReferensi.firstElementChild);
    }
    if (!halamanRahasia.classList.contains('hidden')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}
