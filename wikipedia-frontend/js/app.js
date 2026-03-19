// =========================================================================
// WIKIPEDIA GHOST CHAT (APP.JS) - ELEGANT ALERT & WHISPER MODE
// =========================================================================

// --- 0. KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCBhpa1S7KEjaovbIH5Kj4P58FgE3On0EA",
    authDomain: "wiki-project-b88d2.firebaseapp.com",
    databaseURL: "https://wiki-project-b88d2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "wiki-project-b88d2",
    messagingSenderId: "415075792805",
    appId: "1:415075792805:web:6d63fe39fd3e07fe811a4c"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const chatRef = database.ref('wiki_history'); 
const stateRef = database.ref('status_global'); 
const typingRef = database.ref('status_mengetik');

let myId = localStorage.getItem('wiki_agen_id');
if (!myId) {
    myId = "agen_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('wiki_agen_id', myId);
}
const waktuMulaiSesi = Date.now();
const KUNCI_ENKRIPSI = "ProtokolSandiNusantara2026";

// --- 1. FITUR KEAMANAN: ENKRIPSI & DEKRIPSI ---
function enkripsiPesan(teksAsli) { return CryptoJS.AES.encrypt(teksAsli, KUNCI_ENKRIPSI).toString(); }
function dekripsiPesan(teksEnkripsi) {
    try {
        const bytes = CryptoJS.AES.decrypt(teksEnkripsi, KUNCI_ENKRIPSI);
        const hasil = bytes.toString(CryptoJS.enc.Utf8);
        return hasil || teksEnkripsi; 
    } catch (e) { return teksEnkripsi; }
}

// --- 2. FITUR PENGHANCUR OTOMATIS 24 JAM ---
function jalankanPembersihOtomatis() {
    const batasWaktu = Date.now() - (24 * 60 * 60 * 1000); 
    chatRef.once('value', (snapshot) => { snapshot.forEach((child) => { if (child.val().timestamp < batasWaktu) chatRef.child(child.key).remove(); }); });
}
jalankanPembersihOtomatis(); 

// --- 3. DEKLARASI ELEMEN UTAMA ---
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
const appContainer = document.querySelector('.flex-1.overflow-y-auto');

if(menuRahasia) menuRahasia.style.display = "none";

// --- LAYAR BLUR PROTEKSI (503 ERROR) ---
const layarProteksi = document.createElement('div');
layarProteksi.id = "layar-proteksi";
layarProteksi.className = "fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center hidden transition-opacity duration-300";
layarProteksi.innerHTML = `
    <div class="bg-[#111] border border-gray-800 p-8 sm:p-12 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-lg w-[90%] text-center animate-fade-in">
        <div class="mb-6 flex justify-center"><svg class="w-14 h-14 sm:w-16 sm:h-16 text-gray-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
        <h1 class="text-2xl sm:text-3xl font-light text-gray-200 tracking-[0.15em] uppercase mb-4">Service Unavailable</h1>
        <div class="h-[1px] w-16 bg-blue-600/50 mx-auto mb-6"></div>
        <p class="text-[13px] sm:text-[15px] text-gray-400 font-light leading-relaxed mb-8">The server is temporarily unable to service your request due to maintenance downtime or routing capacity problems. Please try again later.</p>
        <div class="bg-black/50 rounded-md p-4 text-left font-mono text-[11px] sm:text-xs text-gray-500 border border-gray-800/50">
            <p class="mb-1"><span class="text-gray-400">Error Code:</span> HTTP 503</p>
            <p class="mb-1"><span class="text-gray-400">Node:</span> server-xjk-992</p>
            <p><span class="text-gray-400">Status:</span> Disconnected</p>
        </div>
    </div>`;
document.body.appendChild(layarProteksi);

// --- UI ALERT ELEGAN (GLASSMORPHISM) ---
const alertModal = document.createElement('div');
alertModal.id = "global-alert-modal";
alertModal.className = "fixed top-4 sm:top-6 left-1/2 transform -translate-x-1/2 z-[10000] w-[90%] max-w-md transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] opacity-0 scale-95 -translate-y-10 pointer-events-none";
alertModal.innerHTML = `
    <div class="bg-[#111111]/85 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-4 sm:p-5 flex items-start gap-4">
        <div class="relative flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 mt-0.5"><div class="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style="animation-duration: 2s;"></div><svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>
        <div class="flex-1 min-w-0 pt-0.5"><h3 class="text-[10px] uppercase tracking-[0.2em] text-red-400 font-bold mb-1 opacity-80">Pesan Prioritas</h3><p id="global-alert-text" class="text-[14px] sm:text-[15px] text-gray-100 font-medium leading-relaxed break-words shadow-sm"></p></div>
        <button id="close-alert-btn" class="text-gray-500 hover:text-white transition-colors shrink-0 p-1 mt-0.5 rounded-full hover:bg-white/10"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
    </div>
`;
document.body.appendChild(alertModal);
document.getElementById('close-alert-btn').addEventListener('click', () => { 
    alertModal.classList.add('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none'); 
    alertModal.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
});

// --- CUSTOM CSS UNTUK EFEK SENSOR (WHISPER) & HEARTBEAT ---
const customStyles = document.createElement('style');
customStyles.innerHTML = `
    @keyframes heartbeatRed { 0%, 100% { filter: drop-shadow(0px 0px 1px #b32424); transform: scale(1); opacity: 1; } 50% { filter: drop-shadow(0px 0px 4px #b32424); transform: scale(1.02); opacity: 0.8; } }
    @keyframes heartbeatBlue { 0%, 100% { filter: drop-shadow(0px 0px 2px #36c); transform: scale(1); opacity: 1; } 50% { filter: drop-shadow(0px 0px 6px #36c); transform: scale(1.03); opacity: 0.9; } }
    
    .teks-sensor {
        background-color: #1f2937; /* Balok hitam ala dokumen rahasia */
        color: #1f2937;            /* Samarkan teks dengan warna background */
        border-radius: 3px;
        padding: 1px 6px;
        cursor: crosshair;
        transition: all 0.2s ease-in-out;
        user-select: none;
        display: inline-block;
        font-family: monospace;
    }
    @media (hover: hover) {
        .teks-sensor:hover { background-color: #f3f4f6; color: #111827; box-shadow: inset 0 0 0 1px #d1d5db; text-shadow: none; }
    }
    .teks-sensor:active { background-color: #f3f4f6; color: #111827; box-shadow: inset 0 0 0 1px #d1d5db; text-shadow: none; }
`;
document.head.appendChild(customStyles);

function formatWaktuWiki(timestamp) {
    const dateObj = new Date(timestamp || Date.now());
    const tanggal = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const jam = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    return `${jam}, ${tanggal}`;
}

// --- 4. GHOST ENTRY & PRESENSI ---
let keyBuffer = ""; const secretCode = "sandi"; 

document.addEventListener('keydown', (e) => {
    if (e.key.length === 1) { 
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > secretCode.length) keyBuffer = keyBuffer.slice(-secretCode.length);
        if (keyBuffer === secretCode && halamanRahasia.classList.contains('hidden')) { 
            e.preventDefault(); 
            jalankanLoading(() => { gantiHalaman(halamanRahasia); chatInput.value = ""; }); 
            chatInput.value = ""; keyBuffer = ""; 
        }
    }
});

chatInput.addEventListener('input', () => {
    if (chatInput.value.toLowerCase().includes(secretCode) && halamanRahasia.classList.contains('hidden')) {
        jalankanLoading(() => { gantiHalaman(halamanRahasia); chatInput.value = ""; });
        chatInput.value = ""; keyBuffer = "";
    }
});

const presenceRef = database.ref('status_kehadiran'); let daftarUserOnline = {}; 
presenceRef.orderByChild('userId').equalTo(myId).once('value', snapshot => { snapshot.forEach(child => child.ref.remove()); });
const userStatusRef = presenceRef.push(); 

database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) return;
    userStatusRef.onDisconnect().remove().then(() => userStatusRef.set({ status: 'online', userId: myId, timestamp: Date.now() }));
    typingRef.child(myId).onDisconnect().remove(); 
});

presenceRef.on('child_added', (snapshot) => { 
    const data = snapshot.val(); 
    if (data && data.userId !== myId) { 
        if (!daftarUserOnline[data.userId]) { daftarUserOnline[data.userId] = true; tampilkanNotifikasiSistem("Seorang kontributor bergabung.", "join", true, Date.now()); updateLogoVisuals(); } 
    } 
});

presenceRef.on('child_removed', (snapshot) => { 
    const data = snapshot.val(); 
    if (data && data.userId !== myId) { 
        if (daftarUserOnline[data.userId]) { delete daftarUserOnline[data.userId]; tampilkanNotifikasiSistem("Seorang kontributor keluar.", "leave", true, Date.now()); updateLogoVisuals(); } 
    } 
});

// --- 5. PANIC TAB & PROTEKSI ---
document.addEventListener("visibilitychange", () => {
    if (document.hidden) document.title = "Google"; 
    else { stateRef.once('value').then((snapshot) => { if (snapshot.val()?.diproteksi) document.title = "503 Service Unavailable"; else updateJudulHalaman(); }); }
});
tombolMenu.addEventListener('click', (e) => { e.stopPropagation(); sidebarKiri.classList.toggle('hidden'); });
document.addEventListener('click', (e) => { if (!sidebarKiri.contains(e.target) && e.target !== tombolMenu) { if (window.innerWidth < 768) sidebarKiri.classList.add('hidden'); } });

let idleTimeout;
function resetIdleTimer() { clearTimeout(idleTimeout); idleTimeout = setTimeout(() => { if (!halamanRahasia.classList.contains('hidden') || !halamanRiwayat.classList.contains('hidden')) { jalankanLoading(() => gantiHalaman(halamanUtama)); } }, 300000); }
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => document.addEventListener(evt, resetIdleTimer)); resetIdleTimer(); 

let escCount = 0; let escTimer;
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        stateRef.once('value').then((snapshot) => {
            const isProtected = snapshot.val()?.diproteksi || false;
            if (!isProtected) { stateRef.set({ diproteksi: true }); } 
            else { escCount++; clearTimeout(escTimer); if (escCount >= 3) { stateRef.set({ diproteksi: false }); escCount = 0; } else { escTimer = setTimeout(() => { escCount = 0; }, 1500); } }
        });
    }
    if (e.key === '`' || e.key === '~' || (e.altKey && e.key.toLowerCase() === 'z')) window.location.replace("https://classroom.google.com"); 
});

function pemicuDarurat() { stateRef.once('value').then((snapshot) => stateRef.set({ diproteksi: !(snapshot.val()?.diproteksi || false) })); }
logoWiki.addEventListener('dblclick', pemicuDarurat);
let tapCount = 0; let tapTimer;
document.addEventListener('touchstart', (e) => { tapCount++; clearTimeout(tapTimer); if (tapCount >= 5) { pemicuDarurat(); tapCount = 0; } else { tapTimer = setTimeout(() => { tapCount = 0; }, 1000); } });

stateRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.diproteksi) { layarProteksi.classList.remove('hidden'); document.title = "503 Service Unavailable"; chatInput.blur(); } 
    else { layarProteksi.classList.add('hidden'); updateJudulHalaman(); }
});

function updateJudulHalaman() {
    if (!halamanRahasia.classList.contains('hidden')) document.title = "Sejarah Nusantara - Wikipedia";
    else if (!halamanRiwayat.classList.contains('hidden')) document.title = "Riwayat revisi: Sejarah Nusantara";
    else document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
}

// --- 6. NAVIGASI ---
function jalankanLoading(callback) { chatInput.placeholder = "Memuat..."; chatInput.classList.add('opacity-50'); setTimeout(() => { chatInput.classList.remove('opacity-50'); if(callback) callback(); }, 400); }
function gantiHalaman(tujuan) {
    halamanUtama.classList.add('hidden'); halamanRahasia.classList.add('hidden'); halamanRiwayat.classList.add('hidden'); tujuan.classList.remove('hidden');
    if (tujuan === halamanRahasia) { chatInput.placeholder = "Ketik rahasia..."; chatInput.focus(); } else { chatInput.placeholder = "Telusuri Wikipedia"; }
    updateJudulHalaman(); if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
    if(appContainer) appContainer.scrollTo({ top: 0, behavior: 'smooth' });
}
menuUtama.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));
logoWiki.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));

// --- 7. LOGIKA KIRIM CHAT ---
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const pesan = chatInput.value.trim();
        if (pesan === "") return;
        
        if (halamanRahasia.classList.contains('hidden')) { window.location.href = `https://id.wikipedia.org/wiki/Istimewa:Pencarian?search=${encodeURIComponent(pesan)}`; return; }
        if (pesan === "*#arsip#*") { gantiHalaman(halamanRiwayat); chatInput.value = ""; return; }
        if (pesan === "*#hapus#*") { chatRef.remove().then(() => chatRef.push({ teks: enkripsiPesan("Seluruh riwayat obrolan dibersihkan."), tipe: 'darurat_on', timestamp: Date.now(), senderId: "system" })); chatInput.value = ""; return; }

        let tipePesan = 'chat'; let teksFinal = pesan;
        // Penambahan parser fitur baru:
        if (pesan.startsWith("/alert ")) { tipePesan = 'alert'; teksFinal = pesan.replace("/alert ", ""); }
        else if (pesan.startsWith("/bom ")) { tipePesan = 'bom'; teksFinal = pesan.replace("/bom ", ""); }
        else if (pesan.startsWith("/img ")) { tipePesan = 'image'; teksFinal = pesan.replace("/img ", ""); }
        else if (pesan.startsWith("/w ")) { tipePesan = 'whisper'; teksFinal = pesan.replace("/w ", ""); }

        chatRef.push({ senderId: myId, teks: enkripsiPesan(teksFinal), tipe: tipePesan, timestamp: Date.now() });
        chatInput.value = ""; typingRef.child(myId).remove();
    }
});

chatRef.on('value', (snapshot) => { if (!snapshot.exists()) { daftarArsipLengkap.innerHTML = ""; daftarReferensi.innerHTML = ""; } });

// --- 8. TYPING & HEARTBEAT ---
let isSomeoneTyping = false;
function updateLogoVisuals() {
    const isSomeoneOnline = Object.keys(daftarUserOnline).length > 0;
    logoWiki.style.transition = "all 0.3s ease";
    if (isSomeoneTyping) { logoWiki.style.animation = "heartbeatBlue 1s infinite ease-in-out"; } 
    else if (isSomeoneOnline) { logoWiki.style.animation = "heartbeatRed 2.5s infinite ease-in-out"; } 
    else { logoWiki.style.animation = "none"; logoWiki.style.filter = "none"; logoWiki.style.transform = "scale(1)"; }
}

let typingTimer;
chatInput.addEventListener('input', () => { if (!halamanRahasia.classList.contains('hidden')) { typingRef.child(myId).set(true); clearTimeout(typingTimer); typingTimer = setTimeout(() => typingRef.child(myId).remove(), 2000); } });

typingRef.on('value', (snapshot) => {
    isSomeoneTyping = false;
    if (snapshot.val()) { Object.keys(snapshot.val()).forEach(id => { if (id !== myId) isSomeoneTyping = true; }); }
    updateLogoVisuals(); 
});

function mainkanSuaraKlik() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.05); 
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    } catch(e) {}
}

// --- 9. RENDER REALTIME ---
function pemicuGlobalAlertPopup(pesan) { 
    document.getElementById('global-alert-text').innerText = pesan; 
    alertModal.classList.remove('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none'); 
    alertModal.classList.add('opacity-100', 'scale-100', 'translate-y-0');
}

chatRef.limitToLast(50).on('child_added', (snapshot) => {
    const data = snapshot.val();
    const isMe = data.senderId === myId;
    const pesanBaru = data.timestamp >= waktuMulaiSesi;
    const waktuFormatLengkap = formatWaktuWiki(data.timestamp);
    const teksAsli = dekripsiPesan(data.teks);
    
    if (pesanBaru && !isMe) {
        if (data.tipe === 'alert') { if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 500]); } 
        else if (document.hidden || data.tipe === 'bom') { mainkanSuaraKlik(); if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]); }
    }

    if (data.tipe === 'alert') {
        tampilkanLogAlertDiArsip(teksAsli, waktuFormatLengkap, isMe, snapshot.key);
        if (pesanBaru && !isMe) pemicuGlobalAlertPopup(teksAsli); return; 
    }

    // Menangani semua tipe pesan reguler (chat, bom, image, WHISPER)
    if (data.tipe === 'chat' || data.tipe === 'bom' || data.tipe === 'image' || data.tipe === 'whisper') {
        const liArsip = document.createElement('li');
        liArsip.className = "flex flex-col sm:flex-row gap-3 border-b border-gray-200 py-3 text-[13px] hover:bg-blue-50 transition-colors";
        let badge = isMe ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ME</span>` : `<span class="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ANON</span>`;
        
        let teksArsip;
        if (data.tipe === 'bom') { teksArsip = `<span class="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded animate-pulse">🔥 HANCUR DALAM <span id="arsip-timer-${snapshot.key}">10</span>s: "${teksAsli}"</span>`; } 
        else if (data.tipe === 'image') { teksArsip = `<span class="text-gray-900 font-medium">📷 Lampiran Media: <a href="${teksAsli}" target="_blank" class="text-blue-600 hover:underline">Lihat Gambar</a></span>`; } 
        else if (data.tipe === 'whisper') { teksArsip = `<span class="teks-sensor" title="Tahan / Arahkan kursor untuk membaca">${teksAsli}</span>`; }
        else { teksArsip = isMe ? `<span class="text-gray-900 font-medium break-words">${teksAsli}</span>` : `<span class="text-gray-700 italic break-words">${teksAsli}</span>`; }

        liArsip.innerHTML = `<div class="flex flex-col min-w-[150px] text-gray-500 text-[11px] shrink-0 font-sans mt-0.5"><div><span class="text-[#0645ad] hover:underline cursor-pointer">(skr | prb)</span></div><div class="mt-0.5">${waktuFormatLengkap}</div></div><div class="flex-1 flex items-start gap-2">${badge} ${teksArsip}</div>`;
        daftarArsipLengkap.appendChild(liArsip);

        if (pesanBaru) {
            const liRef = document.createElement('li');
            liRef.className = "mb-2 animate-fade-in text-[13px] md:text-[14px]";
            if (data.tipe === 'bom') { liRef.innerHTML = `<span class="text-red-500 font-bold animate-pulse">^ [Pesan Terbakar: "${teksAsli}" - Hancur: <span id="ref-timer-${snapshot.key}">10</span>s]</span>`; } 
            else if (data.tipe === 'image') {
                const randNum = Math.floor(Math.random() * 99) + 1;
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="relative group cursor-pointer text-[#0645ad] font-mono hover:underline">[${randNum}]<div class="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[100000]"><div class="bg-white border border-gray-300 shadow-2xl p-1 rounded-sm w-max max-w-[250px]"><img src="${teksAsli}" class="w-full h-auto object-cover" alt="Media Ref"></div></div></span>. <i>Media Arsip Eksternal</i>, 2026.`;
            } 
            else if (data.tipe === 'whisper') { liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="teks-sensor">"${teksAsli}"</span>. <i>Dokumen Terklasifikasi</i>, 2026.`; }
            else if (isMe) { liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="text-gray-900 font-medium">"${teksAsli}"</span>. <i>Arsip Pribadi</i>, 2026.`; } 
            else { liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>b</sup></span> <span class="text-[#0645ad] italic">"${teksAsli}"</span>. <i>Sumber Luar</i>, 2026.`; }
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
                    refList.forEach(li => { if(li.innerText.includes(`"${teksAsli}"`)) li.remove(); });
                    if (isMe) chatRef.child(snapshot.key).remove();
                }
            }, 1000);
        }
    } else {
        if (pesanBaru || data.tipe === 'darurat_on') tampilkanNotifikasiSistem(teksAsli, data.tipe, pesanBaru, data.timestamp);
    }
    
    if (pesanBaru && !halamanRahasia.classList.contains('hidden')) { 
        if(appContainer) { appContainer.scrollTo({ top: appContainer.scrollHeight, behavior: 'smooth' }); } 
        else { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
    }
});

function tampilkanLogAlertDiArsip(teks, waktu, isMe, key) {
    const liArsip = document.createElement('li');
    liArsip.className = "flex flex-col sm:flex-row gap-3 border-b-2 border-red-100 py-3 text-[13px] bg-red-50 hover:bg-red-100";
    let badge = isMe ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ME (ALERT)</span>` : `<span class="bg-red-200 text-red-900 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0 mt-0.5">ANON (ALERT)</span>`;
    liArsip.innerHTML = `<div class="flex flex-col min-w-[150px] text-gray-500 text-[11px] shrink-0 font-sans mt-0.5"><div><span class="text-[#0645ad] cursor-pointer">(skr | prb)</span></div><div class="mt-0.5">${waktu}</div></div><div class="flex-1 flex items-start gap-2">${badge} <span class="text-red-950 font-bold break-words">"${teks}"</span></div>`;
    daftarArsipLengkap.appendChild(liArsip);
}

function tampilkanNotifikasiSistem(pesanSistem, tipe, pesanBaru, waktuTercatat) {
    const li = document.createElement('li');
    let warnaHex = "#72777d"; let ikon = "♦";
    if (tipe === 'join') { warnaHex = "#006400"; ikon = "+"; } else if (tipe === 'leave') { warnaHex = "#b32424"; ikon = "-"; } else if (tipe === 'darurat_on') { warnaHex = "#855e00"; ikon = "⚠"; } 

    const liArsip = document.createElement('li');
    liArsip.className = "flex flex-col sm:flex-row gap-3 border-b border-gray-200 py-2 text-[12px] bg-gray-50";
    let jamTayang = formatWaktuWiki(waktuTercatat || Date.now());
    liArsip.innerHTML = `<div class="flex flex-col min-w-[150px] text-gray-400 text-[11px] shrink-0 font-sans mt-0.5"><div><span>(log sistem)</span></div><div class="mt-0.5">${jamTayang}</div></div><div class="flex-1 flex items-center gap-2 animate-fade-in" style="color: ${warnaHex};"><span class="font-bold text-sm">${ikon}</span> <span class="italic">${pesanSistem}</span></div>`;
    daftarArsipLengkap.appendChild(liArsip);

    if (pesanBaru) {
        li.style.color = warnaHex; li.className = "mb-2 italic text-[12px] flex items-center gap-2 font-sans animate-fade-in";
        li.innerHTML = `<span style="font-weight: bold;">${ikon}</span> <span>${pesanSistem}</span>`;
        daftarReferensi.appendChild(li);
        if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
    }
}
