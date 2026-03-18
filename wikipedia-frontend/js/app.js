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
const typingRef = database.ref('status_mengetik');
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

// MENGHILANGKAN TOMBOL RAHASIA SECARA PAKSA (INVISIBLE ENTRY)
if(menuRahasia) menuRahasia.style.display = "none";

// --- BIKIN ELEMEN LAYAR BLUR PROTEKSI & MODAL ALERT ---
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
        <p class="text-[13px] sm:text-[14px] text-gray-400 font-light max-w-md mx-auto leading-relaxed">Server pemeliharaan rutin. Mohon kembali beberapa saat lagi.</p>
    </div>
`;
document.body.appendChild(layarProteksi);

const alertModal = document.createElement('div');
alertModal.id = "global-alert-modal";
alertModal.className = "fixed inset-x-0 top-0 p-4 z-[10000] flex justify-center hidden transform -translate-y-full transition-all duration-500 ease-out";
alertModal.innerHTML = `
    <div class="bg-white border-l-4 border-[#b32424] shadow-2xl p-5 sm:p-6 rounded-[2px] max-w-lg w-full relative flex gap-4 items-start">
        <svg class="text-[#b32424] shrink-0 mt-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <div class="flex-1">
            <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-1 font-sans">Peringatan Prioritas</h3>
            <p id="global-alert-text" class="text-[16px] sm:text-[18px] text-red-950 font-medium leading-relaxed break-words"></p>
        </div>
        <button id="close-alert-btn" class="text-gray-400 hover:text-gray-900 text-2xl font-bold font-sans line-height-1">&times;</button>
    </div>
`;
document.body.appendChild(alertModal);

document.getElementById('close-alert-btn').addEventListener('click', () => {
    alertModal.classList.add('-translate-y-full');
    setTimeout(() => alertModal.classList.add('hidden'), 500);
});

// --- 2. GHOST ENTRY (KEYLOGGER RAHASIA) ---
let keyBuffer = "";
const secretCode = "01012025"; // <--- INI KATA SANDI UNTUK MASUK
document.addEventListener('keydown', (e) => {
    if (e.key.length === 1) { // Hanya rekam ketikan huruf/angka
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > secretCode.length) {
            keyBuffer = keyBuffer.slice(-secretCode.length);
        }
        // Jika ketikan cocok dengan sandi dan halaman masih tersembunyi
        if (keyBuffer === secretCode && halamanRahasia.classList.contains('hidden')) {
            jalankanLoading(() => gantiHalaman(halamanRahasia));
            keyBuffer = ""; // Reset buffer
        }
    }
});

// --- 3. LOGIKA PRESENSI ---
const presenceRef = database.ref('status_kehadiran');
const userStatusRef = presenceRef.push();
let daftarUserOnline = {}; 

database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) return;
    userStatusRef.onDisconnect().remove().then(() => {
        userStatusRef.set({ status: 'online', userId: myId });
    });
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

// --- 4. PANIC TAB & SIDEBAR ---
document.addEventListener("visibilitychange", () => {
    if (document.hidden) document.title = "Google"; 
    else {
        stateRef.once('value').then((snapshot) => {
            if (snapshot.val()?.diproteksi) document.title = "System Maintenance";
            else updateJudulHalaman();
        });
    }
});
tombolMenu.addEventListener('click', (e) => { e.stopPropagation(); sidebarKiri.classList.toggle('hidden'); });
document.addEventListener('click', (e) => { if (!sidebarKiri.contains(e.target) && e.target !== tombolMenu) { if (window.innerWidth < 768) sidebarKiri.classList.add('hidden'); } });

// --- 5. GLOBAL BOSS KEY & EVAKUASI & AUTO-LOCK ---
let idleTimeout;
function resetIdleTimer() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        stateRef.once('value').then((snapshot) => {
            if (!snapshot.val()?.diproteksi) stateRef.set({ diproteksi: true });
        });
    }, 180000); 
}
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => document.addEventListener(evt, resetIdleTimer));
resetIdleTimer(); 

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pemicuDarurat();
    if (e.key === '`' || e.key === '~' || (e.altKey && e.key.toLowerCase() === 'z')) {
        window.location.replace("https://classroom.google.com"); 
    }
});
logoWiki.addEventListener('dblclick', pemicuDarurat);

let tapCount = 0; let tapTimer;
document.addEventListener('touchstart', (e) => {
    tapCount++; clearTimeout(tapTimer);
    if (tapCount >= 3) {
        stateRef.once('value').then((snapshot) => { if (!snapshot.val()?.diproteksi) stateRef.set({ diproteksi: true }); });
        tapCount = 0;
    } else { tapTimer = setTimeout(() => { tapCount = 0; }, 500); }
});

function pemicuDarurat() {
    stateRef.once('value').then((snapshot) => {
        const currentStatus = snapshot.val()?.diproteksi || false;
        stateRef.set({ diproteksi: !currentStatus });
    });
}
stateRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.diproteksi) {
        layarProteksi.classList.remove('hidden'); document.title = "System Maintenance"; chatInput.blur(); 
    } else {
        layarProteksi.classList.add('hidden'); updateJudulHalaman();
    }
});
function updateJudulHalaman() {
    if (!halamanRahasia.classList.contains('hidden')) document.title = "Sejarah Nusantara - Wikipedia";
    else if (!halamanRiwayat.classList.contains('hidden')) document.title = "Riwayat revisi: Sejarah Nusantara";
    else document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
}

// --- 6. NAVIGASI HALAMAN ---
function jalankanLoading(callback) {
    chatInput.placeholder = "Memuat..."; chatInput.classList.add('opacity-50');
    setTimeout(() => { chatInput.classList.remove('opacity-50'); if(callback) callback(); }, 400);
}
function gantiHalaman(tujuan) {
    halamanUtama.classList.add('hidden'); halamanRahasia.classList.add('hidden'); halamanRiwayat.classList.add('hidden');
    tujuan.classList.remove('hidden');
    if (tujuan === halamanRahasia) { chatInput.placeholder = "Ketik rahasia..."; chatInput.focus(); } 
    else { chatInput.placeholder = "Telusuri Wikipedia"; }
    updateJudulHalaman();
    if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
}
menuUtama.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));
logoWiki.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));

// --- 7. LOGIKA KIRIM (CHAT, DUMMY, BOM, ALERT, IMAGE) ---
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const pesan = chatInput.value.trim();
        if (pesan === "") return;

        if (halamanRahasia.classList.contains('hidden')) {
            window.location.href = `https://id.wikipedia.org/wiki/Istimewa:Pencarian?search=${encodeURIComponent(pesan)}`;
            return;
        }

        if (pesan === "*#arsip#*") { gantiHalaman(halamanRiwayat); chatInput.value = ""; return; }
        if (pesan === "*#hapus#*") {
            chatRef.remove().then(() => {
                chatRef.push({ teks: "Seluruh riwayat obrolan dibersihkan.", tipe: 'darurat_on', waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), senderId: "system", timestamp: Date.now() });
            });
            chatInput.value = ""; return;
        }

        let tipePesan = 'chat';
        let teksFinal = pesan;

        if (pesan.startsWith("/alert ")) { tipePesan = 'alert'; teksFinal = pesan.replace("/alert ", ""); }
        else if (pesan.startsWith("/bom ")) { tipePesan = 'bom'; teksFinal = pesan.replace("/bom ", ""); }
        else if (pesan.startsWith("/img ")) { tipePesan = 'image'; teksFinal = pesan.replace("/img ", ""); }

        chatRef.push({
            senderId: myId, teks: teksFinal,
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            tipe: tipePesan, timestamp: Date.now()
        });
        chatInput.value = ""; typingRef.child(myId).remove();
    }
});

chatRef.on('value', (snapshot) => { if (!snapshot.exists()) { daftarArsipLengkap.innerHTML = ""; daftarReferensi.innerHTML = ""; } });

// --- 8. INDIKATOR MENGETIK ---
let typingTimer;
chatInput.addEventListener('input', () => {
    if (!halamanRahasia.classList.contains('hidden')) {
        typingRef.child(myId).set(true); clearTimeout(typingTimer);
        typingTimer = setTimeout(() => typingRef.child(myId).remove(), 2000);
    }
});
typingRef.on('value', (snapshot) => {
    let someoneIsTyping = false;
    if (snapshot.val()) { Object.keys(snapshot.val()).forEach(id => { if (id !== myId) someoneIsTyping = true; }); }
    logoWiki.style.filter = someoneIsTyping ? "drop-shadow(0px 0px 4px #36c)" : "none";
    logoWiki.style.transition = "filter 0.3s ease";
});

// --- 9. SUARA AUDIO RAHASIA ---
function mainkanSuaraKlik() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.05); 
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    } catch(e) {}
}

// --- 10. LISTENER REALTIME (RENDER SEMUA FITUR) ---
chatRef.limitToLast(50).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.senderId === myId;
    const pesanBaru = data.timestamp >= waktuMulaiSesi;
    
    // --- HAPTIC FEEDBACK (GETARAN S.O.S) & SUARA ---
    if (pesanBaru && !isMe) {
        if (data.tipe === 'alert') {
            if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 500]); 
        } else if (document.hidden || data.tipe === 'bom') {
            mainkanSuaraKlik();
            if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]); 
        }
    }

    if (data.tipe === 'alert') {
        tampilkanLogAlertDiArsip(data.teks, data.waktu, isMe, snapshot.key);
        if (pesanBaru && !isMe) pemicuGlobalAlertPopup(data.teks);
        return; 
    }

    if (data.tipe === 'chat' || data.tipe === 'bom' || data.tipe === 'image') {
        const liArsip = document.createElement('li');
        liArsip.className = "flex flex-col sm:flex-row sm:items-baseline gap-3 border-b border-gray-200 py-3 text-[13px] hover:bg-blue-50 transition-colors";
        let badge = isMe ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ME</span>` : `<span class="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ANON</span>`;
        
        let teksArsip;
        if (data.tipe === 'bom') {
            teksArsip = `<span class="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded animate-pulse">🔥 HANCUR DALAM <span id="arsip-timer-${snapshot.key}">10</span>s: "${data.teks}"</span>`;
        } else if (data.tipe === 'image') {
            teksArsip = `<span class="text-gray-900 font-medium">📷 Lampiran Media: <a href="${data.teks}" target="_blank" class="text-blue-600 hover:underline">Lihat Gambar</a></span>`;
        } else {
            teksArsip = isMe ? `<span class="text-gray-900 font-medium break-words">${data.teks}</span>` : `<span class="text-gray-700 italic break-words">${data.teks}</span>`;
        }

        liArsip.innerHTML = `<div class="flex items-center gap-2 min-w-[130px] text-gray-500 font-mono text-xs shrink-0"><span class="text-[#0645ad] hover:underline cursor-pointer">(skr | prb)</span> <span>${data.waktu}</span></div><div class="flex-1 flex items-start gap-2">${badge} ${teksArsip}</div>`;
        daftarArsipLengkap.appendChild(liArsip);

        if (pesanBaru) {
            const liRef = document.createElement('li');
            liRef.className = "mb-2 animate-fade-in text-[13px] md:text-[14px]";
            
            if (data.tipe === 'bom') {
                liRef.innerHTML = `<span class="text-red-500 font-bold animate-pulse">^ [Pesan Terbakar: "${data.teks}" - Hancur: <span id="ref-timer-${snapshot.key}">10</span>s]</span>`;
            } else if (data.tipe === 'image') {
                // GAMBAR TERSEMBUNYI (HOVER TO REVEAL)
                const randNum = Math.floor(Math.random() * 99) + 1;
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="relative group cursor-pointer text-[#0645ad] font-mono hover:underline">[${randNum}]
                    <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[100000]">
                        <div class="bg-white border border-gray-300 shadow-2xl p-1 rounded-sm w-max max-w-[250px]">
                            <img src="${data.teks}" class="w-full h-auto object-cover" alt="Media Ref">
                        </div>
                    </div>
                </span>. <i>Media Arsip Eksternal</i>, 2026.`;
            } else if (isMe) {
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="text-gray-900 font-medium">"${data.teks}"</span>. <i>Arsip Pribadi</i>, 2026.`;
            } else {
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>b</sup></span> <span class="text-[#0645ad] italic">"${data.teks}"</span>. <i>Sumber Luar</i>, 2026.`;
            }
            daftarReferensi.appendChild(liRef);
            if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
        }

        if (data.tipe === 'bom') {
            let sisaBom = 10;
            const bomInterval = setInterval(() => {
                sisaBom--;
                const aTimer = document.getElementById(`arsip-timer-${snapshot.key}`); if(aTimer) aTimer.innerText = sisaBom;
                const rTimer = document.getElementById(`ref-timer-${snapshot.key}`); if(rTimer) rTimer.innerText = sisaBom;
                if (sisaBom <= 0) {
                    clearInterval(bomInterval); liArsip.remove();
                    const refList = document.querySelectorAll('#daftar-referensi li');
                    refList.forEach(li => { if(li.innerText.includes(`"${data.teks}"`)) li.remove(); });
                    if (isMe) chatRef.child(snapshot.key).remove();
                }
            }, 1000);
        }

    } else {
        if (pesanBaru || data.tipe === 'darurat_on') tampilkanNotifikasiSistem(data.teks, data.tipe, pesanBaru, data.waktu);
    }

    if (pesanBaru && !halamanRahasia.classList.contains('hidden')) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
});

function pemicuGlobalAlertPopup(pesan) {
    document.getElementById('global-alert-text').innerText = pesan;
    alertModal.classList.remove('hidden');
    setTimeout(() => alertModal.classList.remove('-translate-y-full'), 10);
}

function tampilkanLogAlertDiArsip(teks, waktu, isMe, key) {
    const liArsip = document.createElement('li');
    liArsip.className = "flex flex-col sm:flex-row sm:items-baseline gap-3 border-b-2 border-red-100 py-3 text-[13px] bg-red-50 hover:bg-red-100";
    let badge = isMe ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ME (ALERT)</span>` : `<span class="bg-red-200 text-red-900 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ANON (ALERT)</span>`;
    liArsip.innerHTML = `<div class="flex items-center gap-2 min-w-[130px] text-gray-500 font-mono text-xs shrink-0"><span class="text-[#0645ad] cursor-pointer">(skr | prb)</span> <span>${waktu}</span></div><div class="flex-1 flex items-start gap-2">${badge} <span class="text-red-950 font-bold break-words">"${teks}"</span></div>`;
    daftarArsipLengkap.appendChild(liArsip);
}

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
        li.style.color = warnaHex; li.className = "mb-2 italic text-[12px] flex items-center gap-2 font-sans animate-fade-in";
        li.innerHTML = `<span style="font-weight: bold;">${ikon}</span> <span>${pesanSistem}</span>`;
        daftarReferensi.appendChild(li);
        if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
    }
}
