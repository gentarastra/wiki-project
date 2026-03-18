// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ID Unik Lokal untuk membedakan pesan Anda dan teman
const myId = Math.random().toString(36).substring(7);

// --- 1. DEKLARASI SEMUA ELEMEN ---
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

// --- 2. INISIALISASI DEFAULT ---
halamanUtama.classList.remove('hidden'); 
halamanRahasia.classList.add('hidden'); 
halamanRiwayat.classList.add('hidden'); 
chatInput.setAttribute('readonly', true); 

// --- 3. FITUR: FAKE LOADING ---
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

// --- 4. FITUR: DOUBLE CLICK RESCUE (LOGO) ---
logoWiki.addEventListener('dblclick', () => {
    pemicuBossKey();
});

// --- 5. NAVIGASI ---
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

// --- 6. BOSS KEY (ESC) ---
let isSafeMode = false;
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') pemicuBossKey();
});

function pemicuBossKey() {
    isSafeMode = !isSafeMode;
    // Kirim status darurat ke database agar teman tahu (opsional)
    chatRef.push({
        teks: isSafeMode ? "Perlindungan halaman aktif." : "Perlindungan halaman dicabut.",
        tipe: isSafeMode ? 'darurat_on' : 'darurat_off',
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });

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

// --- 7. CHAT & SANDI DEWA (FIREBASE VERSION) ---
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
            // SIMPAN KE FIREBASE
            chatRef.push({
                senderId: myId,
                teks: pesan,
                tipe: 'chat',
                waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            });
            chatInput.value = "";
        }
    }
});

// --- 8. LOGIKA TERIMA DATA REALTIME ---
// Dipanggil setiap ada data baru di Firebase
chatRef.limitToLast(50).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isLokal = data.senderId === myId;

    if (data.tipe === 'chat') {
        tampilkanPesan(data.teks, isLokal);
    } else {
        tampilkanNotifikasiSistem(data.teks, data.tipe);
    }

    // Masukkan ke riwayat revisi secara otomatis
    tambahKeUIArsip({
        ...data,
        isLokal: isLokal
    });
});

function bukaHalamanRiwayat() {
    halamanRahasia.classList.add('hidden');
    halamanRiwayat.classList.remove('hidden');
    document.title = "Riwayat revisi: Sejarah Nusantara - Wikipedia";
    // Data sudah otomatis ter-update oleh listener 'child_added'
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
            infoPengirim = `<b class="text-[#b32424] cursor-pointer">Anonymous</b> <span class="text-gray-400 text-[12px]">(Bicara)</span>`;
            teksPesan = `<span class="text-blue-900 italic">"${data.teks}"</span>`;
        }
    } else {
        infoPengirim = `<span class="text-gray-500 font-bold uppercase text-[11px]">[System Log]</span>`;
        teksPesan = `<span class="text-gray-500 italic">${data.teks}</span>`;
    }

    li.innerHTML = `${aksi} <span class="text-gray-500 text-[12px] w-14 shrink-0 font-mono">${data.waktu}</span> <div class="flex-1 leading-tight">${infoPengirim} . . ${teksPesan}</div>`;
    
    // Agar tidak duplikat saat baru buka, kita bersihkan jika perlu atau handle logic-nya
    daftarArsipLengkap.appendChild(li);
}

function tampilkanPesan(pesan, isLokal) {
    const li = document.createElement('li');
    li.className = "mb-2 animate-fade-in"; 
    const simbolWiki = `<span class="text-[#36c] cursor-pointer">^</span> `;
    
    if (isLokal) {
        li.innerHTML = `${simbolWiki} <span class="text-gray-800 font-medium">"${pesan}"</span>. <i>Arsip Nasional</i>.`;
    } else {
        li.innerHTML = `${simbolWiki} <span class="text-blue-900 italic">"${pesan}"</span>. Diakses pada 2026.`;
    }
    
    tambahkanKeReferensi(li);
}

function tampilkanNotifikasiSistem(pesanSistem, tipe) {
    const li = document.createElement('li');
    let warnaHex = "#72777d"; 
    let ikon = "♦";

    if (tipe === 'join') { warnaHex = "#006400"; ikon = "+"; } 
    else if (tipe === 'leave') { warnaHex = "#b32424"; ikon = "−"; } 
    else if (tipe === 'darurat_on') { warnaHex = "#855e00"; ikon = "⚠"; } 
    else if (tipe === 'darurat_off') { warnaHex = "#36c"; ikon = "✅"; }

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
