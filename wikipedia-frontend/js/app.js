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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const chatRef = database.ref('wiki_history'); 
const myId = Math.random().toString(36).substring(7);

// --- 1. DEKLARASI ELEMEN (Sesuaikan dengan HTML) ---
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

// --- 2. FITUR SIDEBAR (FIXED) ---
tombolMenu.addEventListener('click', (e) => {
    e.stopPropagation(); // Mencegah bentrok klik
    sidebarKiri.classList.toggle('hidden');
});

// Tutup sidebar jika klik di luar (khusus mobile)
document.addEventListener('click', (e) => {
    if (!sidebarKiri.contains(e.target) && e.target !== tombolMenu) {
        if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
    }
});

// --- 3. FITUR BOSS KEY / ESC (FIXED) ---
let isSafeMode = false;
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pemicuDarurat();
});

// Double Click Logo untuk Rescue
logoWiki.addEventListener('dblclick', pemicuDarurat);

function pemicuDarurat() {
    isSafeMode = !isSafeMode;
    if (isSafeMode) {
        safeScreen.classList.remove('hidden');
        document.title = "404 Not Found";
    } else {
        safeScreen.classList.add('hidden');
        // Kembalikan judul sesuai halaman aktif
        updateJudulHalaman();
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

// --- 4. NAVIGASI HALAMAN (FIXED) ---
function jalankanLoading(callback) {
    chatInput.placeholder = "Memuat data...";
    chatInput.classList.add('opacity-50');
    setTimeout(() => {
        chatInput.classList.remove('opacity-50');
        if(callback) callback();
    }, 400);
}

function gantiHalaman(tujuan) {
    // Sembunyikan semua
    halamanUtama.classList.add('hidden');
    halamanRahasia.classList.add('hidden');
    halamanRiwayat.classList.add('hidden');
    
    // Tampilkan yang dipilih
    tujuan.classList.remove('hidden');
    
    // Atur Input
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

// --- 5. LOGIKA CHAT FIREBASE ---
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

// Listener Realtime
chatRef.limitToLast(20).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.senderId === myId;
    
    // Render ke Referensi (Halaman Rahasia)
    const liRef = document.createElement('li');
    liRef.className = "mb-2 animate-fade-in";
    liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^</span> ${isMe ? '<b>' : '<i>'}"${data.teks}"${isMe ? '</b>' : '</i>'}. Diakses pada 2026.`;
    daftarReferensi.appendChild(liRef);
    if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);

    // Render ke Arsip (Halaman Riwayat)
    const liArsip = document.createElement('li');
    liArsip.className = "flex items-start gap-2 border-b border-gray-100 py-2 text-[13px]";
    liArsip.innerHTML = `
        <span class="text-[#0645ad]">(skr | prb)</span> 
        <span class="text-gray-500 w-12 font-mono">${data.waktu}</span> 
        <div class="flex-1"><b>${isMe ? 'Me' : 'Anonymous'}</b> . . <span class="${isMe ? '' : 'italic text-blue-900'}">"${data.teks}"</span></div>`;
    daftarArsipLengkap.appendChild(liArsip);

    // Auto scroll jika sedang di halaman rahasia
    if (!halamanRahasia.classList.contains('hidden')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
});
