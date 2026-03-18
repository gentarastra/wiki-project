// --- 0. SUNTIKAN CSS PREMIUM & WIKIPEDIA FONTS ---
const stylePremium = document.createElement('style');
stylePremium.innerHTML = `
    /* Custom Scrollbar Tipis & Elegan */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
    
    /* Font Spesifik Wikipedia */
    .wiki-serif { font-family: 'Linux Libertine', 'Georgia', 'Times', serif; }
    .wiki-sans { font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif; }
    
    /* Efek Kaca (Glassmorphism) untuk bagian bawah */
    .glass-bottom { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid rgba(0,0,0,0.08); }
`;
document.head.appendChild(stylePremium);

// --- 1. KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCBhpa1S7KEjaovbIH5Kj4P58FgE3On0EA",
    authDomain: "wiki-project-b88d2.firebaseapp.com",
    databaseURL: "https://wiki-project-b88d2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "wiki-project-b88d2",
    storageBucket: "wiki-project-b88d2.firebasestorage.app",
    messagingSenderId: "415075792805",
    appId: "1:415075792805:web:6d63fe39fd3e07fe811a4c"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const chatRef = database.ref('wiki_history'); 
const stateRef = database.ref('status_global'); 
const typingRef = database.ref('status_mengetik');
const myId = Math.random().toString(36).substring(7);
const waktuMulaiSesi = Date.now();

// --- 2. DEKLARASI ELEMEN & PENYEMPURNAAN VISUAL INPUT ---
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

// Hilangkan tombol rahasia
if(menuRahasia) menuRahasia.style.display = "none";

// Ubah Input menjadi ala "Search Bar" Wikipedia
if(chatInput) {
    chatInput.className = "w-full bg-[#f8f9fa] border border-[#a2a9b1] text-gray-900 text-[14px] rounded-full focus:ring-[#0645ad] focus:border-[#0645ad] block px-5 py-2.5 wiki-sans shadow-inner transition-all outline-none";
    if(chatInput.parentElement) chatInput.parentElement.classList.add('glass-bottom');
}
if(halamanRahasia) halamanRahasia.classList.add('wiki-sans');
if(daftarArsipLengkap) daftarArsipLengkap.classList.add('pb-6', 'px-2'); // Spacing ekstra

// --- 3. LAYAR PROTEKSI & MODAL ALERT ---
const layarProteksi = document.createElement('div');
layarProteksi.id = "layar-proteksi";
layarProteksi.className = "fixed inset-0 bg-[#0a0a0a]/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center hidden transition-all duration-500";
layarProteksi.innerHTML = `
    <div class="text-center px-6 animate-fade-in">
        <div class="relative w-14 h-14 mx-auto mb-8"><svg class="animate-spin w-full h-full text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle><path class="opacity-80" fill="#ffffff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
        <h2 class="text-xl font-light text-white mb-4 tracking-[0.2em] uppercase">System Maintenance</h2>
        <div class="w-12 h-[1px] bg-gray-600 mx-auto mb-6"></div>
        <p class="text-[13px] text-gray-400 font-light max-w-md mx-auto leading-relaxed">Server pemeliharaan rutin. Mohon kembali beberapa saat lagi.</p>
    </div>`;
document.body.appendChild(layarProteksi);

const alertModal = document.createElement('div');
alertModal.id = "global-alert-modal";
alertModal.className = "fixed inset-x-0 top-0 p-4 z-[10000] flex justify-center hidden transform -translate-y-full transition-all duration-500 ease-out";
alertModal.innerHTML = `
    <div class="bg-white border-l-4 border-[#b32424] shadow-2xl p-5 rounded-[2px] max-w-lg w-full relative flex gap-4 items-start">
        <svg class="text-[#b32424] shrink-0 mt-1" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <div class="flex-1"><h3 class="text-xs uppercase tracking-widest text-gray-500 mb-1 font-sans">Peringatan Prioritas</h3><p id="global-alert-text" class="text-[16px] text-red-950 font-medium leading-relaxed break-words"></p></div>
        <button id="close-alert-btn" class="text-gray-400 hover:text-gray-900 text-2xl font-bold font-sans line-height-1">&times;</button>
    </div>`;
document.body.appendChild(alertModal);
document.getElementById('close-alert-btn').addEventListener('click', () => { alertModal.classList.add('-translate-y-full'); setTimeout(() => alertModal.classList.add('hidden'), 500); });

// --- 4. GHOST ENTRY (KEYLOGGER RAHASIA) ---
let keyBuffer = ""; const secretCode = "sandi"; 
document.addEventListener('keydown', (e) => {
    if (e.key.length === 1) { 
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > secretCode.length) keyBuffer = keyBuffer.slice(-secretCode.length);
        if (keyBuffer === secretCode && halamanRahasia.classList.contains('hidden')) { jalankanLoading(() => gantiHalaman(halamanRahasia)); keyBuffer = ""; }
    }
});

// --- 5. LOGIKA PRESENSI & PANIC TAB ---
const presenceRef = database.ref('status_kehadiran'); const userStatusRef = presenceRef.push(); let daftarUserOnline = {}; 
database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) return;
    userStatusRef.onDisconnect().remove().then(() => { userStatusRef.set({ status: 'online', userId: myId }); });
    typingRef.child(myId).onDisconnect().remove(); 
});
presenceRef.on('child_added', (snapshot) => { const data = snapshot.val(); if (data && data.userId !== myId) { if (!daftarUserOnline[data.userId]) { daftarUserOnline[data.userId] = true; tampilkanNotifikasiSistem("Seseorang bergabung ke sesi.", "join", true); } } });
presenceRef.on('child_removed', (snapshot) => { const data = snapshot.val(); if (data && data.userId !== myId) { if (daftarUserOnline[data.userId]) { delete daftarUserOnline[data.userId]; tampilkanNotifikasiSistem("Seseorang meninggalkan sesi.", "leave", true); } } });

document.addEventListener("visibilitychange", () => {
    if (document.hidden) document.title = "Google"; 
    else { stateRef.once('value').then((snapshot) => { if (snapshot.val()?.diproteksi) document.title = "System Maintenance"; else updateJudulHalaman(); }); }
});

// --- 6. GLOBAL BOSS KEY & AUTO-LOCK ---
let idleTimeout;
function resetIdleTimer() { clearTimeout(idleTimeout); idleTimeout = setTimeout(() => { stateRef.once('value').then((snapshot) => { if (!snapshot.val()?.diproteksi) stateRef.set({ diproteksi: true }); }); }, 180000); }
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => document.addEventListener(evt, resetIdleTimer)); resetIdleTimer(); 

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') pemicuDarurat();
    if (e.key === '`' || e.key === '~') window.location.replace("https://classroom.google.com"); 
});
logoWiki.addEventListener('dblclick', pemicuDarurat);
let tapCount = 0; let tapTimer;
document.addEventListener('touchstart', (e) => { tapCount++; clearTimeout(tapTimer); if (tapCount >= 3) { stateRef.once('value').then((snapshot) => { if (!snapshot.val()?.diproteksi) stateRef.set({ diproteksi: true }); }); tapCount = 0; } else { tapTimer = setTimeout(() => { tapCount = 0; }, 500); } });

function pemicuDarurat() { stateRef.once('value').then((snapshot) => { const currentStatus = snapshot.val()?.diproteksi || false; stateRef.set({ diproteksi: !currentStatus }); }); }
stateRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.diproteksi) { layarProteksi.classList.remove('hidden'); document.title = "System Maintenance"; chatInput.blur(); } 
    else { layarProteksi.classList.add('hidden'); updateJudulHalaman(); }
});
function updateJudulHalaman() {
    if (!halamanRahasia.classList.contains('hidden')) document.title = "Sejarah Nusantara - Wikipedia";
    else if (!halamanRiwayat.classList.contains('hidden')) document.title = "Riwayat revisi: Sejarah Nusantara";
    else document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
}

// --- 7. NAVIGASI HALAMAN ---
function jalankanLoading(callback) { chatInput.placeholder = "Memuat..."; chatInput.classList.add('opacity-50'); setTimeout(() => { chatInput.classList.remove('opacity-50'); if(callback) callback(); }, 400); }
function gantiHalaman(tujuan) {
    halamanUtama.classList.add('hidden'); halamanRahasia.classList.add('hidden'); halamanRiwayat.classList.add('hidden'); tujuan.classList.remove('hidden');
    if (tujuan === halamanRahasia) { chatInput.placeholder = "Telusuri Arsip..."; chatInput.focus(); } else { chatInput.placeholder = "Telusuri Wikipedia"; }
    updateJudulHalaman(); if (window.innerWidth < 768) sidebarKiri.classList.add('hidden');
}
menuUtama.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));
logoWiki.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));

// --- 8. LOGIKA KIRIM (CHAT, DUMMY, BOM, ALERT, IMAGE) ---
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const pesan = chatInput.value.trim(); if (pesan === "") return;
        if (halamanRahasia.classList.contains('hidden')) { window.location.href = `https://id.wikipedia.org/wiki/Istimewa:Pencarian?search=${encodeURIComponent(pesan)}`; return; }
        if (pesan === "*#arsip#*") { gantiHalaman(halamanRiwayat); chatInput.value = ""; return; }
        if (pesan === "*#hapus#*") { chatRef.remove().then(() => { chatRef.push({ teks: "Riwayat dibersihkan.", tipe: 'darurat_on', waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), senderId: "system", timestamp: Date.now() }); }); chatInput.value = ""; return; }

        let tipePesan = 'chat'; let teksFinal = pesan;
        if (pesan.startsWith("/alert ")) { tipePesan = 'alert'; teksFinal = pesan.replace("/alert ", ""); }
        else if (pesan.startsWith("/bom ")) { tipePesan = 'bom'; teksFinal = pesan.replace("/bom ", ""); }
        else if (pesan.startsWith("/img ")) { tipePesan = 'image'; teksFinal = pesan.replace("/img ", ""); }

        chatRef.push({ senderId: myId, teks: teksFinal, waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), tipe: tipePesan, timestamp: Date.now() });
        chatInput.value = ""; typingRef.child(myId).remove();
    }
});
chatRef.on('value', (snapshot) => { if (!snapshot.exists()) { daftarArsipLengkap.innerHTML = ""; daftarReferensi.innerHTML = ""; } });

let typingTimer;
chatInput.addEventListener('input', () => { if (!halamanRahasia.classList.contains('hidden')) { typingRef.child(myId).set(true); clearTimeout(typingTimer); typingTimer = setTimeout(() => typingRef.child(myId).remove(), 2000); } });
typingRef.on('value', (snapshot) => { let someoneIsTyping = false; if (snapshot.val()) { Object.keys(snapshot.val()).forEach(id => { if (id !== myId) someoneIsTyping = true; }); } logoWiki.style.filter = someoneIsTyping ? "drop-shadow(0px 0px 4px #36c)" : "none"; logoWiki.style.transition = "filter 0.3s ease"; });

function mainkanSuaraKlik() { try { const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.05); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.05); } catch(e) {} }

// --- 9. RENDER REALTIME (CHAT BUBBLES MODERN) ---
chatRef.limitToLast(50).on('child_added', (snapshot) => {
    const data = snapshot.val(); const isMe = data.senderId === myId; const pesanBaru = data.timestamp >= waktuMulaiSesi;
    
    if (pesanBaru && !isMe) {
        if (data.tipe === 'alert') { if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 500]); } 
        else if (document.hidden || data.tipe === 'bom') { mainkanSuaraKlik(); if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]); }
    }

    if (data.tipe === 'alert') {
        tampilkanLogAlertDiArsip(data.teks, data.waktu, isMe); if (pesanBaru && !isMe) pemicuGlobalAlertPopup(data.teks); return; 
    }

    if (data.tipe === 'chat' || data.tipe === 'bom' || data.tipe === 'image') {
        // --- DESAIN CHAT BUBBLE MODERN ---
        const liArsip = document.createElement('li');
        liArsip.className = `flex w-full mb-3 animate-fade-in ${isMe ? 'justify-end' : 'justify-start'}`;
        
        let bubbleStyle = isMe ? 'bg-[#0645ad] text-white rounded-2xl rounded-tr-sm shadow-md' : 'bg-[#f8f9fa] text-[#202122] border border-[#eaecf0] rounded-2xl rounded-tl-sm shadow-sm';
        let timeColor = isMe ? 'text-blue-200' : 'text-gray-400';
        
        let teksArsip;
        if (data.tipe === 'bom') {
            bubbleStyle = isMe ? 'bg-[#b32424] text-white rounded-2xl rounded-tr-sm shadow-md' : 'bg-red-50 text-[#b32424] border border-red-200 rounded-2xl rounded-tl-sm shadow-sm';
            teksArsip = `<div class="flex items-center gap-2 font-medium"><span class="animate-pulse text-lg">🔥</span> <span><span id="arsip-timer-${snapshot.key}">10</span>s: ${data.teks}</span></div>`;
        } else if (data.tipe === 'image') {
            teksArsip = `<div class="flex flex-col gap-1">
                <span class="text-[12px] opacity-80 mb-1 font-medium">📷 Lampiran Media</span>
                <img src="${data.teks}" class="max-w-[180px] sm:max-w-[220px] rounded-lg object-cover shadow-sm hover:opacity-90 transition-opacity cursor-pointer" alt="media" onclick="window.open(this.src, '_blank')">
            </div>`;
        } else { teksArsip = `<span class="break-words leading-relaxed">${data.teks}</span>`; }

        liArsip.innerHTML = `
            <div class="flex flex-col max-w-[80%] sm:max-w-[65%] px-4 py-2.5 ${bubbleStyle}">
                <div class="text-[14px]">${teksArsip}</div>
                <div class="text-[10px] text-right mt-1.5 ${timeColor} font-mono tracking-wide">${data.waktu}</div>
            </div>`;
        daftarArsipLengkap.appendChild(liArsip);

        // --- RENDER KE REFERENSI WIKIPEDIA (SAMARAN) ---
        if (pesanBaru) {
            const liRef = document.createElement('li'); liRef.className = "mb-2 animate-fade-in text-[13px] md:text-[14px] wiki-sans";
            if (data.tipe === 'bom') { liRef.innerHTML = `<span class="text-[#b32424] font-bold animate-pulse">^ [Log: "${data.teks}" - <span id="ref-timer-${snapshot.key}">10</span>s]</span>`; } 
            else if (data.tipe === 'image') {
                const randNum = Math.floor(Math.random() * 99) + 1;
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="relative group cursor-pointer text-[#0645ad] hover:underline">[${randNum}]
                    <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[100000]"><div class="bg-white border border-gray-300 shadow-xl p-1 rounded-sm w-max max-w-[200px]"><img src="${data.teks}" class="w-full h-auto object-cover"></div></div>
                </span>. <i>Media Eksternal</i>, 2026.`;
            } else if (isMe) { liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="text-gray-900">"${data.teks}"</span>. <i>Arsip Pribadi</i>, 2026.`; } 
            else { liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>b</sup></span> <span class="text-[#0645ad] italic">"${data.teks}"</span>. <i>Sumber Luar</i>, 2026.`; }
            daftarReferensi.appendChild(liRef); if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
        }

        if (data.tipe === 'bom') {
            let sisaBom = 10;
            const bomInterval = setInterval(() => {
                sisaBom--;
                const aTimer = document.getElementById(`arsip-timer-${snapshot.key}`); if(aTimer) aTimer.innerText = sisaBom;
                const rTimer = document.getElementById(`ref-timer-${snapshot.key}`); if(rTimer) rTimer.innerText = sisaBom;
                if (sisaBom <= 0) { clearInterval(bomInterval); liArsip.style.opacity = '0'; setTimeout(()=> liArsip.remove(), 300); const refList = document.querySelectorAll('#daftar-referensi li'); refList.forEach(li => { if(li.innerText.includes(`"${data.teks}"`)) li.remove(); }); if (isMe) chatRef.child(snapshot.key).remove(); }
            }, 1000);
        }

    } else { if (pesanBaru || data.tipe === 'darurat_on') tampilkanNotifikasiSistem(data.teks, data.tipe, pesanBaru, data.waktu); }

    if (pesanBaru && !halamanRahasia.classList.contains('hidden')) { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
});

function pemicuGlobalAlertPopup(pesan) { document.getElementById('global-alert-text').innerText = pesan; alertModal.classList.remove('hidden'); setTimeout(() => alertModal.classList.remove('-translate-y-full'), 10); }

function tampilkanLogAlertDiArsip(teks, waktu, isMe) {
    const liArsip = document.createElement('li'); liArsip.className = `flex w-full mb-3 justify-center animate-fade-in`;
    liArsip.innerHTML = `<div class="bg-red-50 border-2 border-[#b32424] rounded-lg px-4 py-3 max-w-[85%] text-center shadow-lg"><div class="text-[#b32424] font-bold text-[11px] mb-1 tracking-wider uppercase">${isMe ? 'Kamu mengirim Peringatan' : 'PERINGATAN DITERIMA'}</div><div class="text-red-950 font-bold text-[15px]">"${teks}"</div><div class="text-[10px] text-red-400 font-mono mt-2">${waktu}</div></div>`;
    daftarArsipLengkap.appendChild(liArsip);
}

function tampilkanNotifikasiSistem(pesanSistem, tipe, pesanBaru, waktuTercatat) {
    let warnaHex = "#72777d"; let ikon = "♦";
    if (tipe === 'join') { warnaHex = "#006400"; ikon = "+"; } else if (tipe === 'leave') { warnaHex = "#b32424"; ikon = "-"; } else if (tipe === 'darurat_on') { warnaHex = "#855e00"; ikon = "⚠"; } 

    const liArsip = document.createElement('li'); liArsip.className = "flex justify-center my-3 animate-fade-in";
    let jamTayang = waktuTercatat || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    // Desain notifikasi sistem melayang (Pill shape)
    liArsip.innerHTML = `<div class="bg-[#f8f9fa] text-[#54595d] text-[11px] px-4 py-1.5 rounded-full border border-[#eaecf0] shadow-sm flex items-center gap-2"><span style="color:${warnaHex}; font-weight:bold;">${ikon}</span> <span>${pesanSistem}</span> <span class="font-mono text-[9px] opacity-60 ml-1">${jamTayang}</span></div>`;
    daftarArsipLengkap.appendChild(liArsip);

    if (pesanBaru) {
        const li = document.createElement('li'); li.style.color = warnaHex; li.className = "mb-2 italic text-[12px] flex items-center gap-2 wiki-sans animate-fade-in";
        li.innerHTML = `<span style="font-weight: bold;">${ikon}</span> <span>${pesanSistem}</span>`;
        daftarReferensi.appendChild(li); if (daftarReferensi.children.length > 7) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
    }
}
