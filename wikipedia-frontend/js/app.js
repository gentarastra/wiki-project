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

// ID Unik Lokal untuk membedakan "Me" dan "Anonymous"
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

// --- 3. NAVIGASI ---
function keHalamanUtama() {
    jalankanLoading(() => {
        halamanUtama.classList.remove('hidden');
        halamanRahasia.classList.add('hidden');
        halamanRiwayat.classList.add('hidden');
        document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
        chatInput.setAttribute('readonly', true); 
        chatInput.placeholder = "Telusuri Wikipedia";
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
        chatInput.placeholder = "Ketik rahasia...";
    });
});

tombolMenu.addEventListener('click', () => {
    sidebarKiri.classList.toggle('hidden');
});

// --- 4. BOSS KEY (ESC & Double Click Logo) ---
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
    } else {
        safeScreen.classList.add('hidden');
    }
}

// --- 5. CHAT LOGIC (FIREBASE) ---
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !halamanRahasia.classList.contains('hidden')) {
        const pesan = chatInput.value.trim();
        
        if (pesan === "*#arsip#*") {
            halamanRahasia.classList.add('hidden');
            halamanRiwayat.classList.remove('hidden');
            chatInput.value = "";
            return;
        }

        if (pesan !== "") {
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

// Listener Realtime
chatRef.limitToLast(30).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.senderId === myId;
    
    tampilkanPesan(data.teks, isMe);
    tambahKeUIArsip({ ...data, isLokal: isMe });
});

// --- 6. RENDER UI ---
function tampilkanPesan(pesan, isLokal) {
    const li = document.createElement('li');
    li.className = "mb-2 animate-fade-in";
    const simbol = `<span class="text-[#36c] cursor-pointer">^</span> `;
    li.innerHTML = isLokal 
        ? `${simbol} <span class="text-gray-800 font-medium">"${pesan}"</span>. <i>Arsip Nasional</i>.`
        : `${simbol} <span class="text-blue-900 italic">"${pesan}"</span>. Diakses pada 2026.`;
    
    daftarReferensi.appendChild(li);
    if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
}

function tambahKeUIArsip(data) {
    const li = document.createElement('li');
    li.className = "flex items-start gap-2 border-b border-gray-100 py-2 hover:bg-gray-50";
    let info = data.isLokal 
        ? `<b class="text-[#0645ad]">Me</b>` 
        : `<b class="text-[#b32424]">Anonymous</b>`;
    
    li.innerHTML = `
        <span class="text-[#0645ad] text-[11px] shrink-0">(skr | prb)</span> 
        <span class="text-gray-500 text-[12px] w-12 font-mono">${data.waktu}</span> 
        <div class="flex-1">${info} . . <span class="${data.isLokal ? '' : 'italic text-blue-900'}">"${data.teks}"</span></div>`;
    
    daftarArsipLengkap.appendChild(li);
}
