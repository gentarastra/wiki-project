// =========================================================================
// WIKIPEDIA GHOST CHAT — APP.JS REVISI LENGKAP
// Fitur baru: Auth sesi, kunci enkripsi dinamis, read receipt,
//             counter agen online, durasi /bom fleksibel, navigasi arsip↔chat
// =========================================================================

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyCBhpa1S7KEjaovbIH5Kj4P58FgE3On0EA",
    authDomain: "wiki-project-b88d2.firebaseapp.com",
    databaseURL: "https://wiki-project-b88d2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "wiki-project-b88d2",
    messagingSenderId: "415075792805",
    appId: "1:415075792805:web:6d63fe39fd3e07fe811a4c"
};
firebase.initializeApp(firebaseConfig);
const database  = firebase.database();
const chatRef   = database.ref('wiki_history');
const stateRef  = database.ref('status_global');
const typingRef = database.ref('status_mengetik');
const readRef   = database.ref('status_baca');

// --- ID SESI ---
let myId = localStorage.getItem('wiki_agen_id');
if (!myId) {
    myId = "agen_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('wiki_agen_id', myId);
}
const waktuMulaiSesi = Date.now();

// =========================================================================
// 1. KUNCI ENKRIPSI DINAMIS (dari input sesi, bukan hardcoded)
// =========================================================================
const SALT = "WikiNusantara::2026::"; // salt publik, aman di source code
let KUNCI_SESI = ""; // diisi setelah auth berhasil

function enkripsiPesan(teks) {
    return CryptoJS.AES.encrypt(teks, SALT + KUNCI_SESI).toString();
}
function dekripsiPesan(teksEnkripsi) {
    try {
        const bytes = CryptoJS.AES.decrypt(teksEnkripsi, SALT + KUNCI_SESI);
        const hasil = bytes.toString(CryptoJS.enc.Utf8);
        return hasil || "[Pesan tidak dapat didekripsi]";
    } catch (e) { return "[Pesan tidak dapat didekripsi]"; }
}

// =========================================================================
// 2. ELEMEN DOM
// =========================================================================
const menuUtama          = document.getElementById('menu-utama');
const menuRahasia        = document.getElementById('menu-rahasia');
const halamanUtama       = document.getElementById('halaman-utama');
const halamanRahasia     = document.getElementById('halaman-rahasia');
const halamanRiwayat     = document.getElementById('halaman-riwayat');
const daftarArsipLengkap = document.getElementById('daftar-arsip-lengkap');
const chatInput          = document.getElementById('rahasia-input');
const tombolMenu         = document.getElementById('tombol-menu');
const sidebarKiri        = document.getElementById('sidebar-kiri');
const sidebarOverlay     = document.getElementById('sidebar-overlay');
const daftarReferensi    = document.getElementById('daftar-referensi');
const logoWiki           = document.getElementById('logo-wiki');
const mainScroll         = document.getElementById('main-scroll');
const statusBadge        = document.getElementById('status-badge');
const statusText         = document.getElementById('status-text');
const onlineCounter      = document.getElementById('online-counter');
const ocText             = document.getElementById('oc-text');
const arsipEmpty         = document.getElementById('arsip-empty');
const cmdHelp            = document.getElementById('cmd-help');
const alertModal         = document.getElementById('global-alert-modal');
const layarProteksi      = document.getElementById('layar-proteksi');
const btnBalikChat       = document.getElementById('btn-balik-chat');
const toastContainer     = document.getElementById('toast-container');

// Auth elements
const authModal    = document.getElementById('auth-modal');
const authInput    = document.getElementById('auth-input');
const authBtn      = document.getElementById('auth-btn');
const authAttempts = document.getElementById('auth-attempts');

if (menuRahasia) menuRahasia.style.display = "none";

// =========================================================================
// 3. PEMBERSIH OTOMATIS 24 JAM
// =========================================================================
function jalankanPembersihOtomatis() {
    const batas = Date.now() - 86400000;
    chatRef.once('value', snap => {
        snap.forEach(child => {
            if (child.val().timestamp < batas) chatRef.child(child.key).remove();
        });
    });
}

// =========================================================================
// 4. TOAST
// =========================================================================
function tampilkanToast(pesan, warna = '#374151', durasi = 3000) {
    const t = document.createElement('div');
    t.className = 'toast-item';
    t.style.borderLeft = `3px solid ${warna}`;
    t.textContent = pesan;
    toastContainer.appendChild(t);
    setTimeout(() => {
        t.classList.add('out');
        setTimeout(() => t.remove(), 350);
    }, durasi);
}

// =========================================================================
// 5. STATUS BADGE & ONLINE COUNTER
// =========================================================================
function setStatusBadge(mode) {
    statusBadge.classList.remove('offline', 'online', 'typing', 'visible');
    if (mode === 'offline') {
        statusText.textContent = 'Offline';
        statusBadge.classList.add('offline');
    } else if (mode === 'online') {
        statusText.textContent = 'Online';
        statusBadge.classList.add('online', 'visible');
    } else if (mode === 'typing') {
        statusText.textContent = 'Mengetik…';
        statusBadge.classList.add('typing', 'visible');
    }
}

function updateOnlineCounter() {
    const jumlah = Object.keys(daftarUserOnline).length + 1; // +1 karena diri sendiri
    ocText.textContent = `${jumlah} agen aktif`;
    if (jumlah > 1) {
        onlineCounter.classList.add('visible');
    } else {
        onlineCounter.classList.remove('visible');
    }
}

// =========================================================================
// 6. AUTH MODAL — SISTEM AUTENTIKASI SESI
// =========================================================================
let authAttemptCount = 0;
const MAX_ATTEMPTS = 5;
let authLocked = false;
let pendingAction = null; // callback setelah auth berhasil

function tampilkanAuth(callback) {
    pendingAction = callback;
    authInput.value = "";
    authAttempts.textContent = "";
    authInput.classList.remove('error');
    authModal.classList.add('active');
    setTimeout(() => authInput.focus(), 350);
}

function tutupAuth() {
    authModal.classList.remove('active');
    authInput.value = "";
    pendingAction = null;
}

function prosesAuth() {
    if (authLocked) return;
    const inputKunci = authInput.value.trim();
    if (!inputKunci) return;

    // Hash kunci yang diinput untuk dicocokkan dengan yang tersimpan
    const hashInput = CryptoJS.SHA256(SALT + inputKunci).toString();

    // Cek apakah sudah ada kunci tersimpan di Firebase
    stateRef.child('kunci_hash').once('value', snap => {
        const hashTersimpan = snap.val();

        if (!hashTersimpan) {
            // Pertama kali — simpan kunci sebagai acuan
            stateRef.child('kunci_hash').set(hashInput);
            KUNCI_SESI = inputKunci;
            onAuthBerhasil();
        } else if (hashInput === hashTersimpan) {
            // Kunci benar
            KUNCI_SESI = inputKunci;
            onAuthBerhasil();
        } else {
            // Kunci salah
            authAttemptCount++;
            authInput.classList.add('error');
            setTimeout(() => authInput.classList.remove('error'), 400);
            authInput.value = "";

            const sisa = MAX_ATTEMPTS - authAttemptCount;
            if (sisa <= 0) {
                authLocked = true;
                authAttempts.textContent = "Terlalu banyak percobaan. Tunggu 30 detik.";
                authBtn.disabled = true;
                setTimeout(() => {
                    authLocked = false;
                    authAttemptCount = 0;
                    authBtn.disabled = false;
                    authAttempts.textContent = "";
                }, 30000);
            } else {
                authAttempts.textContent = `Kunci salah. ${sisa} percobaan tersisa.`;
            }
        }
    });
}

function onAuthBerhasil() {
    tutupAuth();
    jalankanPembersihOtomatis();
    mulaiDengarkanChat(); // ← listener baru dimulai SETELAH KUNCI_SESI terisi
    if (pendingAction) {
        pendingAction();
    } else {
        jalankanLoading(() => { gantiHalaman(halamanRahasia); chatInput.value = ""; });
    }
    pendingAction = null;
}

authBtn.addEventListener('click', prosesAuth);
authInput.addEventListener('keydown', e => { if (e.key === 'Enter') prosesAuth(); });

// =========================================================================
// 7. ALERT MODAL
// =========================================================================
document.getElementById('close-alert-btn').addEventListener('click', () => {
    alertModal.classList.add('opacity-0', 'scale-95', '-translate-y-8', 'pointer-events-none');
    alertModal.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
});

function pemicuGlobalAlertPopup(pesan) {
    document.getElementById('global-alert-text').textContent = pesan;
    alertModal.classList.remove('opacity-0', 'scale-95', '-translate-y-8', 'pointer-events-none');
    alertModal.classList.add('opacity-100', 'scale-100', 'translate-y-0');
    setTimeout(() => {
        alertModal.classList.add('opacity-0', 'scale-95', '-translate-y-8', 'pointer-events-none');
        alertModal.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    }, 8000);
}

// =========================================================================
// 8. FORMAT WAKTU
// =========================================================================
function formatWaktuWiki(ts) {
    const d = new Date(ts || Date.now());
    const tgl = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    const jam = d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }).replace(':','.');
    return `${jam}, ${tgl}`;
}

// =========================================================================
// 9. GHOST ENTRY — DETEKSI SANDI
// =========================================================================
const secretCode = "sandi";
let keyBuffer = "";

function masukKeRahasia() {
    if (!KUNCI_SESI) {
        tampilkanAuth(() => {
            jalankanLoading(() => { gantiHalaman(halamanRahasia); chatInput.value = ""; });
        });
    } else {
        jalankanLoading(() => { gantiHalaman(halamanRahasia); chatInput.value = ""; });
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key.length === 1) {
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > secretCode.length) keyBuffer = keyBuffer.slice(-secretCode.length);
        if (keyBuffer === secretCode && halamanRahasia.classList.contains('hidden')) {
            e.preventDefault(); masukKeRahasia(); keyBuffer = "";
        }
    }
});

chatInput.addEventListener('input', () => {
    if (chatInput.value.toLowerCase().includes(secretCode) && halamanRahasia.classList.contains('hidden')) {
        chatInput.value = "";
        keyBuffer = "";
        masukKeRahasia();
    }
});

// =========================================================================
// 10. PRESENSI & KEHADIRAN
// =========================================================================
const presenceRef = database.ref('status_kehadiran');
let daftarUserOnline = {};

presenceRef.orderByChild('userId').equalTo(myId).once('value', snap => {
    snap.forEach(child => child.ref.remove());
});
const userStatusRef = presenceRef.push();

database.ref('.info/connected').on('value', snap => {
    if (!snap.val()) return;
    userStatusRef.onDisconnect().remove().then(() => {
        userStatusRef.set({ status:'online', userId:myId, timestamp:Date.now() });
    });
    typingRef.child(myId).onDisconnect().remove();
});

presenceRef.on('child_added', snap => {
    const d = snap.val();
    if (d && d.userId !== myId && !daftarUserOnline[d.userId]) {
        daftarUserOnline[d.userId] = true;
        tampilkanNotifikasiSistem("Seorang kontributor bergabung.", "join", true, Date.now());
        tampilkanToast("👤 Kontributor baru bergabung", "#22c55e");
        updateLogoVisuals();
        updateOnlineCounter();
    }
});

presenceRef.on('child_removed', snap => {
    const d = snap.val();
    if (d && d.userId !== myId && daftarUserOnline[d.userId]) {
        delete daftarUserOnline[d.userId];
        tampilkanNotifikasiSistem("Seorang kontributor keluar.", "leave", true, Date.now());
        tampilkanToast("👤 Kontributor keluar", "#ef4444");
        updateLogoVisuals();
        updateOnlineCounter();
    }
});

// =========================================================================
// 11. READ RECEIPT — TANDA TERBACA
// =========================================================================
// Tandai semua pesan sebagai terbaca saat membuka halaman rahasia
function tandaiSemuaTerbaca() {
    chatRef.limitToLast(50).once('value', snap => {
        snap.forEach(child => {
            const d = child.val();
            if (d.senderId !== myId) {
                readRef.child(child.key).child(myId).set(true);
            }
        });
    });
}

// Update elemen read receipt di UI
function updateReadReceiptUI(messageKey, dibaca) {
    const el = document.getElementById(`rr-${messageKey}`);
    if (!el) return;
    if (dibaca) {
        el.textContent = "✓✓";
        el.classList.remove('terkirim');
        el.classList.add('dibaca');
        el.title = "Terbaca";
    } else {
        el.textContent = "✓";
        el.classList.remove('dibaca');
        el.classList.add('terkirim');
        el.title = "Terkirim";
    }
}

// Listen perubahan read status untuk pesan yang dikirim oleh myId
function dengarkanReadReceipt(messageKey) {
    readRef.child(messageKey).on('value', snap => {
        const dibaca = snap.exists() && Object.keys(snap.val() || {}).some(uid => uid !== myId);
        updateReadReceiptUI(messageKey, dibaca);
    });
}

// =========================================================================
// 12. PANIC & VISIBILITY
// =========================================================================
document.addEventListener("visibilitychange", () => {
    if (document.hidden) { document.title = "Google"; }
    else {
        stateRef.once('value').then(snap => {
            if (snap.val()?.diproteksi) document.title = "503 Service Unavailable";
            else updateJudulHalaman();
        });
    }
});

// =========================================================================
// 13. SIDEBAR
// =========================================================================
function bukaSidebar() { sidebarKiri.classList.remove('hidden'); if (window.innerWidth < 768) sidebarOverlay.classList.add('active'); }
function tutupSidebar() { sidebarKiri.classList.add('hidden'); sidebarOverlay.classList.remove('active'); }
tombolMenu.addEventListener('click', e => { e.stopPropagation(); sidebarKiri.classList.contains('hidden') ? bukaSidebar() : tutupSidebar(); });
sidebarOverlay.addEventListener('click', tutupSidebar);

// =========================================================================
// 14. IDLE TIMEOUT
// =========================================================================
let idleTimeout;
function resetIdleTimer() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        if (!halamanRahasia.classList.contains('hidden') || !halamanRiwayat.classList.contains('hidden')) {
            jalankanLoading(() => gantiHalaman(halamanUtama));
            KUNCI_SESI = ""; // Reset kunci sesi saat idle
        }
    }, 300000);
}
['mousemove','keydown','click','scroll','touchstart'].forEach(e => document.addEventListener(e, resetIdleTimer, { passive:true }));
resetIdleTimer();

// =========================================================================
// 15. ESC PROTEKSI & PANIC
// =========================================================================
let escCount = 0, escTimer;
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        stateRef.once('value').then(snap => {
            const locked = snap.val()?.diproteksi || false;
            if (!locked) { stateRef.set({ diproteksi:true }); }
            else {
                escCount++;
                clearTimeout(escTimer);
                if (escCount >= 3) { stateRef.set({ diproteksi:false }); escCount = 0; }
                else { escTimer = setTimeout(() => { escCount = 0; }, 1500); }
            }
        });
    }
    if (e.key === '`' || e.key === '~' || (e.altKey && e.key.toLowerCase() === 'z')) {
        window.location.replace("https://classroom.google.com");
    }
});

function pemicuDarurat() {
    stateRef.once('value').then(snap => stateRef.set({ diproteksi:!(snap.val()?.diproteksi||false) }));
}
logoWiki.addEventListener('dblclick', pemicuDarurat);
let tapCount = 0, tapTimer;
document.addEventListener('touchstart', () => {
    tapCount++;
    clearTimeout(tapTimer);
    if (tapCount >= 5) { pemicuDarurat(); tapCount = 0; }
    else tapTimer = setTimeout(() => { tapCount = 0; }, 1000);
}, { passive:true });

stateRef.on('value', snap => {
    if (snap.val()?.diproteksi) { layarProteksi.classList.remove('hidden'); document.title = "503 Service Unavailable"; chatInput.blur(); }
    else { layarProteksi.classList.add('hidden'); updateJudulHalaman(); }
});

function updateJudulHalaman() {
    if (!halamanRahasia.classList.contains('hidden'))      document.title = "Sejarah Nusantara - Wikipedia";
    else if (!halamanRiwayat.classList.contains('hidden')) document.title = "Riwayat revisi: Sejarah Nusantara";
    else                                                   document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
}

// =========================================================================
// 16. NAVIGASI
// =========================================================================
function jalankanLoading(cb) {
    chatInput.classList.add('opacity-50');
    chatInput.placeholder = "Memuat…";
    setTimeout(() => { chatInput.classList.remove('opacity-50'); if (cb) cb(); }, 380);
}

function gantiHalaman(tujuan) {
    [halamanUtama, halamanRahasia, halamanRiwayat].forEach(h => h.classList.add('hidden'));
    tujuan.classList.remove('hidden');
    if (tujuan === halamanRahasia) {
        chatInput.placeholder = "Ketik pesan rahasia…";
        chatInput.focus();
        tandaiSemuaTerbaca();
        updateArsipEmptyState();
    } else {
        chatInput.placeholder = "Telusuri Wikipedia";
    }
    updateJudulHalaman();
    if (window.innerWidth < 768) tutupSidebar();
    if (mainScroll) mainScroll.scrollTo({ top:0, behavior:'smooth' });
}

menuUtama.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));
logoWiki.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));

// Tombol balik dari arsip ke chat
if (btnBalikChat) {
    btnBalikChat.addEventListener('click', () => {
        jalankanLoading(() => gantiHalaman(halamanRahasia));
    });
}

// =========================================================================
// 17. CHIP PERINTAH
// =========================================================================
if (cmdHelp) {
    cmdHelp.querySelectorAll('.cmd-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chatInput.value = chip.dataset.cmd;
            chatInput.focus();
        });
    });
}

// =========================================================================
// 18. KIRIM PESAN
// =========================================================================
let lastSentTime = 0;
const RATE_LIMIT_MS = 800;

chatInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const pesan = chatInput.value.trim();
    if (!pesan) return;

    // Jika di halaman publik → Wikipedia search
    if (halamanRahasia.classList.contains('hidden')) {
        window.location.href = `https://id.wikipedia.org/wiki/Istimewa:Pencarian?search=${encodeURIComponent(pesan)}`;
        return;
    }

    // Rate limit
    const now = Date.now();
    if (now - lastSentTime < RATE_LIMIT_MS) return;
    lastSentTime = now;

    // Perintah khusus (tanpa auth check karena sudah di halaman rahasia)
    if (pesan === "*#arsip#*") { gantiHalaman(halamanRiwayat); chatInput.value = ""; return; }
    if (pesan === "*#hapus#*") {
        chatRef.remove().then(() => {
            chatRef.push({ teks: enkripsiPesan("Seluruh riwayat dibersihkan."), tipe:'darurat_on', timestamp:Date.now(), senderId:"system" });
        });
        chatInput.value = ""; return;
    }

    // Parse tipe & teks
    let tipe = 'chat', teks = pesan, durasi = 10;
    if      (pesan.startsWith("/alert ")) { tipe = 'alert';   teks = pesan.slice(7); }
    else if (pesan.startsWith("/img "))   { tipe = 'image';   teks = pesan.slice(5); }
    else if (pesan.startsWith("/w "))     { tipe = 'whisper'; teks = pesan.slice(3); }
    else if (pesan.startsWith("/bom "))   {
        // Format: /bom [detik opsional] teks
        // Contoh: /bom 30 halo → hancur dalam 30 detik
        // Contoh: /bom halo    → hancur dalam 10 detik (default)
        tipe = 'bom';
        const sisaStr = pesan.slice(5);
        const match = sisaStr.match(/^(\d+)\s+(.+)$/);
        if (match) { durasi = Math.min(parseInt(match[1]), 300); teks = match[2]; } // maks 5 menit
        else { teks = sisaStr; }
    }

    if (!teks) return;

    chatRef.push({ senderId:myId, teks:enkripsiPesan(teks), tipe, timestamp:Date.now(), durasi });
    chatInput.value = "";
    typingRef.child(myId).remove();
});

chatRef.on('value', snap => {
    if (!snap.exists()) {
        daftarArsipLengkap.innerHTML = "";
        daftarReferensi.innerHTML = "";
        updateArsipEmptyState();
    }
});

function updateArsipEmptyState() {
    if (!arsipEmpty) return;
    daftarArsipLengkap.children.length === 0
        ? arsipEmpty.classList.remove('hidden')
        : arsipEmpty.classList.add('hidden');
}

// =========================================================================
// 19. TYPING INDICATOR & HEARTBEAT LOGO
// =========================================================================
let isSomeoneTyping = false;

function updateLogoVisuals() {
    const adaOnline = Object.keys(daftarUserOnline).length > 0;
    logoWiki.style.transition = "all 0.3s ease";
    if (isSomeoneTyping) {
        logoWiki.style.animation = "heartbeatBlue 0.9s infinite ease-in-out";
        setStatusBadge('typing');
    } else if (adaOnline) {
        logoWiki.style.animation = "heartbeatRed 2.5s infinite ease-in-out";
        setStatusBadge('online');
    } else {
        logoWiki.style.animation = "none";
        logoWiki.style.filter    = "none";
        logoWiki.style.transform = "scale(1)";
        setStatusBadge('offline');
    }
}

let typingTimer;
chatInput.addEventListener('input', () => {
    if (!halamanRahasia.classList.contains('hidden')) {
        typingRef.child(myId).set(true);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => typingRef.child(myId).remove(), 2000);
    }
});

typingRef.on('value', snap => {
    isSomeoneTyping = false;
    if (snap.val()) Object.keys(snap.val()).forEach(id => { if (id !== myId) isSomeoneTyping = true; });
    updateLogoVisuals();
});

// =========================================================================
// 20. AUDIO KLIK
// =========================================================================
function mainkanSuaraKlik() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
}

// =========================================================================
// 21. RENDER REALTIME — dipanggil HANYA setelah auth berhasil
// =========================================================================
function mulaiDengarkanChat() {
chatRef.limitToLast(50).on('child_added', snap => {
    const data        = snap.val();
    const isMe        = data.senderId === myId;
    const pesanBaru   = data.timestamp >= waktuMulaiSesi;
    const waktuFormat = formatWaktuWiki(data.timestamp);
    const teksAsli    = dekripsiPesan(data.teks);
    const classSensor = isMe ? "teks-sensor-me" : "teks-sensor";
    const durasi      = data.durasi || 10;

    // Notifikasi & getaran
    if (pesanBaru && !isMe) {
        if (data.tipe === 'alert') { if ("vibrate" in navigator) navigator.vibrate([300,100,300,100,500]); }
        else if (document.hidden || data.tipe === 'bom') { mainkanSuaraKlik(); if ("vibrate" in navigator) navigator.vibrate([100,50,100]); }
    }

    // ALERT
    if (data.tipe === 'alert') {
        tampilkanLogAlertDiArsip(teksAsli, waktuFormat, isMe);
        if (pesanBaru && !isMe) pemicuGlobalAlertPopup(teksAsli);
        updateArsipEmptyState(); return;
    }

    // CHAT / BOM / IMAGE / WHISPER
    if (['chat','bom','image','whisper'].includes(data.tipe)) {
        const liArsip = document.createElement('li');
        liArsip.className = "flex flex-col sm:flex-row gap-2 sm:gap-3 border-b border-gray-200 py-3 text-[13px] animate-slide-in";

        const badge = isMe
            ? `<span class="inline-flex items-center bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ME</span>`
            : `<span class="inline-flex items-center bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ANON</span>`;

        // Read receipt hanya untuk pesan milik sendiri
        const readReceiptHtml = isMe
            ? `<span id="rr-${snap.key}" class="read-receipt terkirim" title="Terkirim">✓</span>`
            : '';

        let teksArsip;
        if (data.tipe === 'bom') {
            teksArsip = `<span class="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded bom-text">💣 HANCUR: <span id="arsip-timer-${snap.key}">${durasi}</span>d — "${escapeHtml(teksAsli)}"</span>`;
        } else if (data.tipe === 'image') {
            teksArsip = `<span>📷 <a href="${escapeHtml(teksAsli)}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">Lihat Lampiran Gambar</a></span>`;
        } else if (data.tipe === 'whisper') {
            teksArsip = `<span class="${classSensor}" title="Tahan/arahkan kursor">${escapeHtml(teksAsli)}</span>`;
        } else {
            teksArsip = isMe
                ? `<span class="text-gray-900 font-medium break-words">${escapeHtml(teksAsli)}</span>`
                : `<span class="text-gray-700 italic break-words">${escapeHtml(teksAsli)}</span>`;
        }

        liArsip.innerHTML = `
            <div class="flex flex-col min-w-0 sm:min-w-[160px] text-gray-400 text-[11px] shrink-0 font-sans">
                <div><span class="text-[#0645ad] hover:underline cursor-pointer">(skr | prb)</span></div>
                <div class="mt-0.5 whitespace-nowrap">${waktuFormat}</div>
            </div>
            <div class="flex-1 flex items-start gap-2 min-w-0">
                ${badge}
                <div class="min-w-0 flex-1 flex items-start gap-1">
                    ${teksArsip}${readReceiptHtml}
                </div>
            </div>`;
        daftarArsipLengkap.appendChild(liArsip);
        updateArsipEmptyState();

        // Dengarkan read receipt jika pesan milik saya
        if (isMe) dengarkanReadReceipt(snap.key);

        // Tandai terbaca jika bukan pesan saya dan halaman terbuka
        if (!isMe && !halamanRahasia.classList.contains('hidden')) {
            readRef.child(snap.key).child(myId).set(true);
        }

        // REFERENSI (hanya pesan baru)
        if (pesanBaru) {
            const liRef = document.createElement('li');
            liRef.className = "animate-fade-in text-[13px] md:text-[14px]";
            if (data.tipe === 'bom') {
                liRef.innerHTML = `<span class="text-red-500 font-bold bom-text">^ [Terbakar: "${escapeHtml(teksAsli)}" — <span id="ref-timer-${snap.key}">${durasi}</span>d]</span>`;
            } else if (data.tipe === 'image') {
                const rnd = Math.floor(Math.random()*99)+1;
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span>
                    <span class="relative group cursor-pointer text-[#0645ad] font-mono hover:underline">[${rnd}]
                        <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[100000]">
                            <div class="bg-white border border-gray-300 shadow-2xl p-1 rounded-sm w-max max-w-[240px]">
                                <img src="${escapeHtml(teksAsli)}" class="w-full h-auto" loading="lazy" alt="Media Ref">
                            </div>
                        </div>
                    </span>. <i>Media Arsip Eksternal</i>, 2026.`;
            } else if (data.tipe === 'whisper') {
                const sup = isMe ? 'a' : 'b';
                const label = isMe ? 'Arsip Pribadi (Terklasifikasi)' : 'Sumber Luar (Terklasifikasi)';
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>${sup}</sup></span> <span class="${classSensor}">"${escapeHtml(teksAsli)}"</span>. <i>${label}</i>, 2026.`;
            } else if (isMe) {
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span> <span class="text-gray-900 font-medium">"${escapeHtml(teksAsli)}"</span>. <i>Arsip Pribadi</i>, 2026.`;
            } else {
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>b</sup></span> <span class="text-[#0645ad] italic">"${escapeHtml(teksAsli)}"</span>. <i>Sumber Luar</i>, 2026.`;
            }
            daftarReferensi.appendChild(liRef);
            while (daftarReferensi.children.length > 8) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
        }

        // BOM COUNTDOWN (durasi fleksibel)
        if (data.tipe === 'bom') {
            let sisa = durasi;
            const interval = setInterval(() => {
                sisa--;
                const at = document.getElementById(`arsip-timer-${snap.key}`);
                const rt = document.getElementById(`ref-timer-${snap.key}`);
                if (at) at.textContent = sisa;
                if (rt) rt.textContent = sisa;
                if (sisa <= 0) {
                    clearInterval(interval);
                    liArsip.style.transition = "opacity 0.4s";
                    liArsip.style.opacity = "0";
                    setTimeout(() => { liArsip.remove(); updateArsipEmptyState(); }, 420);
                    document.querySelectorAll('#daftar-referensi li').forEach(li => {
                        if (li.textContent.includes(`"${teksAsli}"`)) {
                            li.style.transition = "opacity 0.3s"; li.style.opacity = "0";
                            setTimeout(() => li.remove(), 320);
                        }
                    });
                    if (isMe) chatRef.child(snap.key).remove();
                }
            }, 1000);
        }

    } else {
        if (pesanBaru || data.tipe === 'darurat_on') tampilkanNotifikasiSistem(teksAsli, data.tipe, pesanBaru, data.timestamp);
    }

    // Auto-scroll
    if (pesanBaru && !halamanRahasia.classList.contains('hidden')) {
        requestAnimationFrame(() => { if (mainScroll) mainScroll.scrollTo({ top:mainScroll.scrollHeight, behavior:'smooth' }); });
    }
}); // end child_added
} // end mulaiDengarkanChat

// =========================================================================
// 22. LOG ALERT DI ARSIP
// =========================================================================
function tampilkanLogAlertDiArsip(teks, waktu, isMe) {
    const li = document.createElement('li');
    li.className = "flex flex-col sm:flex-row gap-2 sm:gap-3 border-b-2 border-red-100 py-3 text-[13px] bg-red-50 animate-slide-in";
    const badge = isMe
        ? `<span class="inline-flex items-center bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ME (ALERT)</span>`
        : `<span class="inline-flex items-center bg-red-200 text-red-900 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ANON (ALERT)</span>`;
    li.innerHTML = `
        <div class="flex flex-col min-w-0 sm:min-w-[160px] text-gray-400 text-[11px] shrink-0 font-sans">
            <div><span class="text-[#0645ad] cursor-pointer">(skr | prb)</span></div>
            <div class="mt-0.5 whitespace-nowrap">${waktu}</div>
        </div>
        <div class="flex-1 flex items-start gap-2">${badge} <span class="text-red-950 font-bold break-words">"${escapeHtml(teks)}"</span></div>`;
    daftarArsipLengkap.appendChild(li);
    updateArsipEmptyState();
}

// =========================================================================
// 23. NOTIFIKASI SISTEM
// =========================================================================
function tampilkanNotifikasiSistem(pesan, tipe, pesanBaru, waktuTercatat) {
    let warna = "#72777d", ikon = "♦";
    if (tipe === 'join')        { warna = "#15803d"; ikon = "+"; }
    else if (tipe === 'leave')  { warna = "#b91c1c"; ikon = "−"; }
    else if (tipe === 'darurat_on') { warna = "#92400e"; ikon = "⚠"; }

    const liArsip = document.createElement('li');
    liArsip.className = "flex flex-col sm:flex-row gap-2 sm:gap-3 border-b border-gray-100 py-2 text-[12px] bg-gray-50 animate-fade-in";
    liArsip.innerHTML = `
        <div class="flex flex-col min-w-0 sm:min-w-[160px] text-gray-400 text-[11px] shrink-0 font-sans">
            <div><span>(log sistem)</span></div>
            <div class="mt-0.5 whitespace-nowrap">${formatWaktuWiki(waktuTercatat||Date.now())}</div>
        </div>
        <div class="flex items-center gap-2 flex-1" style="color:${warna};">
            <span class="font-bold text-sm shrink-0">${ikon}</span>
            <span class="italic">${escapeHtml(pesan)}</span>
        </div>`;
    daftarArsipLengkap.appendChild(liArsip);
    updateArsipEmptyState();

    if (pesanBaru) {
        const li = document.createElement('li');
        li.className = "italic text-[12px] flex items-center gap-2 font-sans animate-fade-in";
        li.style.color = warna;
        li.innerHTML = `<span class="font-bold">${ikon}</span> <span>${escapeHtml(pesan)}</span>`;
        daftarReferensi.appendChild(li);
        while (daftarReferensi.children.length > 8) daftarReferensi.removeChild(daftarReferensi.firstElementChild);
    }
}

// =========================================================================
// 24. ESCAPE HTML (ANTI XSS)
// =========================================================================
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
