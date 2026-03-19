// =========================================================================
// WIKIPEDIA GHOST CHAT (APP.JS) — REVISI UI SEMPURNA
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
const database   = firebase.database();
const chatRef    = database.ref('wiki_history');
const stateRef   = database.ref('status_global');
const typingRef  = database.ref('status_mengetik');

// --- ID Sesi ---
let myId = localStorage.getItem('wiki_agen_id');
if (!myId) {
    myId = "agen_" + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('wiki_agen_id', myId);
}
const waktuMulaiSesi = Date.now();
const KUNCI_ENKRIPSI = "ProtokolSandiNusantara2026";

// =========================================================================
// 1. ENKRIPSI & DEKRIPSI
// =========================================================================
function enkripsiPesan(teksAsli) {
    return CryptoJS.AES.encrypt(teksAsli, KUNCI_ENKRIPSI).toString();
}
function dekripsiPesan(teksEnkripsi) {
    try {
        const bytes = CryptoJS.AES.decrypt(teksEnkripsi, KUNCI_ENKRIPSI);
        const hasil = bytes.toString(CryptoJS.enc.Utf8);
        return hasil || teksEnkripsi;
    } catch (e) { return teksEnkripsi; }
}

// =========================================================================
// 2. PEMBERSIH OTOMATIS 24 JAM
// =========================================================================
function jalankanPembersihOtomatis() {
    const batasWaktu = Date.now() - (24 * 60 * 60 * 1000);
    chatRef.once('value', (snapshot) => {
        snapshot.forEach((child) => {
            if (child.val().timestamp < batasWaktu) chatRef.child(child.key).remove();
        });
    });
}
jalankanPembersihOtomatis();

// =========================================================================
// 3. ELEMEN DOM
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
const arsipEmpty         = document.getElementById('arsip-empty');
const cmdHelp            = document.getElementById('cmd-help');
const alertModal         = document.getElementById('global-alert-modal');
const layarProteksi      = document.getElementById('layar-proteksi');

// Sembunyikan menu rahasia di sidebar saat awal
if (menuRahasia) menuRahasia.style.display = "none";

// =========================================================================
// 4. TOAST NOTIFIKASI
// =========================================================================
const toastContainer = document.getElementById('toast-container');

function tampilkanToast(pesan, warna = '#374151', durasi = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.style.borderLeft = `3px solid ${warna}`;
    toast.textContent = pesan;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 350);
    }, durasi);
}

// =========================================================================
// 5. STATUS BADGE (ONLINE / TYPING / OFFLINE)
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

// =========================================================================
// 6. ALERT MODAL
// =========================================================================
document.getElementById('close-alert-btn').addEventListener('click', () => {
    alertModal.classList.add('opacity-0', 'scale-95', '-translate-y-8', 'pointer-events-none');
    alertModal.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
});

function pemicuGlobalAlertPopup(pesan) {
    document.getElementById('global-alert-text').textContent = pesan;
    alertModal.classList.remove('opacity-0', 'scale-95', '-translate-y-8', 'pointer-events-none');
    alertModal.classList.add('opacity-100', 'scale-100', 'translate-y-0');

    // Auto-tutup setelah 8 detik
    setTimeout(() => {
        alertModal.classList.add('opacity-0', 'scale-95', '-translate-y-8', 'pointer-events-none');
        alertModal.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    }, 8000);
}

// =========================================================================
// 7. FORMAT WAKTU
// =========================================================================
function formatWaktuWiki(timestamp) {
    const d = new Date(timestamp || Date.now());
    const tanggal = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    return `${jam}, ${tanggal}`;
}

// =========================================================================
// 8. GHOST ENTRY — DETEKSI SANDI RAHASIA
// =========================================================================
let keyBuffer = "";
const secretCode = "sandi";

document.addEventListener('keydown', (e) => {
    if (e.key.length === 1) {
        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > secretCode.length) keyBuffer = keyBuffer.slice(-secretCode.length);
        if (keyBuffer === secretCode && halamanRahasia.classList.contains('hidden')) {
            e.preventDefault();
            jalankanLoading(() => { gantiHalaman(halamanRahasia); chatInput.value = ""; });
            keyBuffer = "";
        }
    }
});

chatInput.addEventListener('input', () => {
    const val = chatInput.value.toLowerCase();
    if (val.includes(secretCode) && halamanRahasia.classList.contains('hidden')) {
        jalankanLoading(() => { gantiHalaman(halamanRahasia); chatInput.value = ""; });
        keyBuffer = "";
    }
});

// =========================================================================
// 9. PRESENSI & KEHADIRAN
// =========================================================================
const presenceRef = database.ref('status_kehadiran');
let daftarUserOnline = {};

presenceRef.orderByChild('userId').equalTo(myId).once('value', snapshot => {
    snapshot.forEach(child => child.ref.remove());
});
const userStatusRef = presenceRef.push();

database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === false) return;
    userStatusRef.onDisconnect().remove().then(() => {
        userStatusRef.set({ status: 'online', userId: myId, timestamp: Date.now() });
    });
    typingRef.child(myId).onDisconnect().remove();
});

presenceRef.on('child_added', (snapshot) => {
    const data = snapshot.val();
    if (data && data.userId !== myId) {
        if (!daftarUserOnline[data.userId]) {
            daftarUserOnline[data.userId] = true;
            tampilkanNotifikasiSistem("Seorang kontributor bergabung.", "join", true, Date.now());
            tampilkanToast("👤 Kontributor baru bergabung", "#22c55e");
            updateLogoVisuals();
        }
    }
});

presenceRef.on('child_removed', (snapshot) => {
    const data = snapshot.val();
    if (data && data.userId !== myId) {
        if (daftarUserOnline[data.userId]) {
            delete daftarUserOnline[data.userId];
            tampilkanNotifikasiSistem("Seorang kontributor keluar.", "leave", true, Date.now());
            tampilkanToast("👤 Kontributor keluar", "#ef4444");
            updateLogoVisuals();
        }
    }
});

// =========================================================================
// 10. PANIC TAB — VISIBILITY CHANGE
// =========================================================================
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        document.title = "Google";
    } else {
        stateRef.once('value').then((snapshot) => {
            if (snapshot.val()?.diproteksi) document.title = "503 Service Unavailable";
            else updateJudulHalaman();
        });
    }
});

// =========================================================================
// 11. SIDEBAR TOGGLE (DESKTOP & MOBILE)
// =========================================================================
function bukaSidebar() {
    sidebarKiri.classList.remove('hidden');
    if (window.innerWidth < 768) {
        sidebarOverlay.classList.add('active');
    }
}
function tutupSidebar() {
    sidebarKiri.classList.add('hidden');
    sidebarOverlay.classList.remove('active');
}
function toggleSidebar() {
    if (sidebarKiri.classList.contains('hidden')) bukaSidebar();
    else tutupSidebar();
}

tombolMenu.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
sidebarOverlay.addEventListener('click', tutupSidebar);

// =========================================================================
// 12. IDLE TIMEOUT (5 MENIT)
// =========================================================================
let idleTimeout;
function resetIdleTimer() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        if (!halamanRahasia.classList.contains('hidden') || !halamanRiwayat.classList.contains('hidden')) {
            jalankanLoading(() => gantiHalaman(halamanUtama));
        }
    }, 300000);
}
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
});
resetIdleTimer();

// =========================================================================
// 13. PROTEKSI ESC & PANIC KEY
// =========================================================================
let escCount = 0, escTimer;

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        stateRef.once('value').then((snapshot) => {
            const isProtected = snapshot.val()?.diproteksi || false;
            if (!isProtected) {
                stateRef.set({ diproteksi: true });
            } else {
                escCount++;
                clearTimeout(escTimer);
                if (escCount >= 3) {
                    stateRef.set({ diproteksi: false });
                    escCount = 0;
                } else {
                    escTimer = setTimeout(() => { escCount = 0; }, 1500);
                }
            }
        });
    }
    // Redirect darurat
    if (e.key === '`' || e.key === '~' || (e.altKey && e.key.toLowerCase() === 'z')) {
        window.location.replace("https://classroom.google.com");
    }
});

// =========================================================================
// 14. PEMICU DARURAT (DOUBLE CLICK LOGO / 5x TAP)
// =========================================================================
function pemicuDarurat() {
    stateRef.once('value').then((snapshot) => {
        stateRef.set({ diproteksi: !(snapshot.val()?.diproteksi || false) });
    });
}
logoWiki.addEventListener('dblclick', pemicuDarurat);

let tapCount = 0, tapTimer;
document.addEventListener('touchstart', () => {
    tapCount++;
    clearTimeout(tapTimer);
    if (tapCount >= 5) { pemicuDarurat(); tapCount = 0; }
    else { tapTimer = setTimeout(() => { tapCount = 0; }, 1000); }
}, { passive: true });

// =========================================================================
// 15. STATE PROTEKSI REALTIME
// =========================================================================
stateRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.diproteksi) {
        layarProteksi.classList.remove('hidden');
        document.title = "503 Service Unavailable";
        chatInput.blur();
    } else {
        layarProteksi.classList.add('hidden');
        updateJudulHalaman();
    }
});

function updateJudulHalaman() {
    if (!halamanRahasia.classList.contains('hidden'))       document.title = "Sejarah Nusantara - Wikipedia";
    else if (!halamanRiwayat.classList.contains('hidden'))  document.title = "Riwayat revisi: Sejarah Nusantara";
    else                                                    document.title = "Wikipedia bahasa Indonesia, ensiklopedia bebas";
}

// =========================================================================
// 16. NAVIGASI & LOADING
// =========================================================================
function jalankanLoading(callback) {
    chatInput.classList.add('opacity-50', 'loading');
    chatInput.placeholder = "Memuat…";
    setTimeout(() => {
        chatInput.classList.remove('opacity-50', 'loading');
        if (callback) callback();
    }, 380);
}

function gantiHalaman(tujuan) {
    // Sembunyikan semua halaman
    [halamanUtama, halamanRahasia, halamanRiwayat].forEach(h => h.classList.add('hidden'));
    tujuan.classList.remove('hidden');

    if (tujuan === halamanRahasia) {
        chatInput.placeholder = "Ketik pesan rahasia…";
        chatInput.focus();
        updateArsipEmptyState();
    } else {
        chatInput.placeholder = "Telusuri Wikipedia";
    }

    updateJudulHalaman();
    if (window.innerWidth < 768) tutupSidebar();
    if (mainScroll) mainScroll.scrollTo({ top: 0, behavior: 'smooth' });
}

menuUtama.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));
logoWiki.addEventListener('click', () => jalankanLoading(() => gantiHalaman(halamanUtama)));

// =========================================================================
// 17. CHIP PERINTAH — KLIK UNTUK MENGISI INPUT
// =========================================================================
// Chip perintah — hanya isi input, tidak ada chip untuk arsip/hapus
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
const RATE_LIMIT_MS = 800; // minimal jeda antar pesan (ms)

chatInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;

    const pesan = chatInput.value.trim();
    if (pesan === "") return;

    // Jika di halaman umum → redirect ke Wikipedia
    if (halamanRahasia.classList.contains('hidden')) {
        window.location.href = `https://id.wikipedia.org/wiki/Istimewa:Pencarian?search=${encodeURIComponent(pesan)}`;
        return;
    }

    // Rate limit sederhana (anti double-send)
    const now = Date.now();
    if (now - lastSentTime < RATE_LIMIT_MS) return;
    lastSentTime = now;

    // Perintah khusus
    if (pesan === "*#arsip#*") { gantiHalaman(halamanRiwayat); chatInput.value = ""; return; }
    if (pesan === "*#hapus#*") {
        chatRef.remove().then(() => {
            chatRef.push({
                teks: enkripsiPesan("Seluruh riwayat obrolan dibersihkan."),
                tipe: 'darurat_on',
                timestamp: Date.now(),
                senderId: "system"
            });
        });
        chatInput.value = "";
        return;
    }

    // Tipe pesan
    let tipePesan = 'chat', teksFinal = pesan;
    if      (pesan.startsWith("/alert ")) { tipePesan = 'alert';   teksFinal = pesan.slice(7); }
    else if (pesan.startsWith("/bom "))   { tipePesan = 'bom';     teksFinal = pesan.slice(5); }
    else if (pesan.startsWith("/img "))   { tipePesan = 'image';   teksFinal = pesan.slice(5); }
    else if (pesan.startsWith("/w "))     { tipePesan = 'whisper'; teksFinal = pesan.slice(3); }

    if (!teksFinal) return; // jangan kirim pesan kosong setelah prefix

    chatRef.push({
        senderId: myId,
        teks: enkripsiPesan(teksFinal),
        tipe: tipePesan,
        timestamp: Date.now()
    });

    chatInput.value = "";
    typingRef.child(myId).remove();
});

// Update empty state arsip saat data berubah
chatRef.on('value', (snapshot) => {
    if (!snapshot.exists()) {
        daftarArsipLengkap.innerHTML = "";
        daftarReferensi.innerHTML = "";
        updateArsipEmptyState();
    }
});

function updateArsipEmptyState() {
    if (!arsipEmpty) return;
    if (daftarArsipLengkap.children.length === 0) {
        arsipEmpty.classList.remove('hidden');
    } else {
        arsipEmpty.classList.add('hidden');
    }
}

// =========================================================================
// 19. TYPING INDICATOR & HEARTBEAT LOGO
// =========================================================================
let isSomeoneTyping = false;

function updateLogoVisuals() {
    const isSomeoneOnline = Object.keys(daftarUserOnline).length > 0;
    logoWiki.style.transition = "all 0.3s ease";

    if (isSomeoneTyping) {
        logoWiki.style.animation = "heartbeatBlue 0.9s infinite ease-in-out";
        setStatusBadge('typing');
    } else if (isSomeoneOnline) {
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

typingRef.on('value', (snapshot) => {
    isSomeoneTyping = false;
    if (snapshot.val()) {
        Object.keys(snapshot.val()).forEach(id => { if (id !== myId) isSomeoneTyping = true; });
    }
    updateLogoVisuals();
});

// =========================================================================
// 20. AUDIO KLIK
// =========================================================================
function mainkanSuaraKlik() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(820, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.05);
    } catch (e) { /* AudioContext tidak tersedia */ }
}

// =========================================================================
// 21. RENDER REALTIME — CHILD ADDED
// =========================================================================
chatRef.limitToLast(50).on('child_added', (snapshot) => {
    const data          = snapshot.val();
    const isMe          = data.senderId === myId;
    const pesanBaru     = data.timestamp >= waktuMulaiSesi;
    const waktuFormat   = formatWaktuWiki(data.timestamp);
    const teksAsli      = dekripsiPesan(data.teks);
    const classSensor   = isMe ? "teks-sensor-me" : "teks-sensor";

    // Notifikasi & getaran
    if (pesanBaru && !isMe) {
        if (data.tipe === 'alert') {
            if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 500]);
        } else if (document.hidden || data.tipe === 'bom') {
            mainkanSuaraKlik();
            if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
        }
    }

    // === TIPE: ALERT ===
    if (data.tipe === 'alert') {
        tampilkanLogAlertDiArsip(teksAsli, waktuFormat, isMe, snapshot.key);
        if (pesanBaru && !isMe) pemicuGlobalAlertPopup(teksAsli);
        updateArsipEmptyState();
        return;
    }

    // === TIPE: CHAT / BOM / IMAGE / WHISPER ===
    if (['chat', 'bom', 'image', 'whisper'].includes(data.tipe)) {

        // -- Baris di Arsip --
        const liArsip = document.createElement('li');
        liArsip.className = "flex flex-col sm:flex-row gap-2 sm:gap-3 border-b border-gray-200 py-3 text-[13px] animate-slide-in";

        const badge = isMe
            ? `<span class="inline-flex items-center bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ME</span>`
            : `<span class="inline-flex items-center bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ANON</span>`;

        let teksArsip;
        if (data.tipe === 'bom') {
            teksArsip = `<span class="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded bom-text">
                🔥 HANCUR: <span id="arsip-timer-${snapshot.key}">10</span>s — "${escapeHtml(teksAsli)}"
            </span>`;
        } else if (data.tipe === 'image') {
            teksArsip = `<span class="text-gray-800">📷 <a href="${escapeHtml(teksAsli)}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">Lihat Lampiran Gambar</a></span>`;
        } else if (data.tipe === 'whisper') {
            teksArsip = `<span class="${classSensor}" title="Tahan / arahkan kursor untuk membaca">${escapeHtml(teksAsli)}</span>`;
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
                <div class="min-w-0 flex-1">${teksArsip}</div>
            </div>`;
        daftarArsipLengkap.appendChild(liArsip);
        updateArsipEmptyState();

        // -- Baris di Referensi (hanya pesan baru) --
        if (pesanBaru) {
            const liRef = document.createElement('li');
            liRef.className = "animate-fade-in text-[13px] md:text-[14px]";

            if (data.tipe === 'bom') {
                liRef.innerHTML = `<span class="text-red-500 font-bold bom-text">
                    ^ [Terbakar: "${escapeHtml(teksAsli)}" — <span id="ref-timer-${snapshot.key}">10</span>s]
                </span>`;
            } else if (data.tipe === 'image') {
                const randNum = Math.floor(Math.random() * 99) + 1;
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span>
                    <span class="relative group cursor-pointer text-[#0645ad] font-mono hover:underline">
                        [${randNum}]
                        <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[100000]">
                            <div class="bg-white border border-gray-300 shadow-2xl p-1 rounded-sm w-max max-w-[240px]">
                                <img src="${escapeHtml(teksAsli)}" class="w-full h-auto" alt="Media Ref" loading="lazy">
                            </div>
                        </div>
                    </span>. <i>Media Arsip Eksternal</i>, 2026.`;
            } else if (data.tipe === 'whisper') {
                const sup = isMe ? 'a' : 'b';
                const label = isMe ? 'Arsip Pribadi (Terklasifikasi)' : 'Sumber Luar (Terklasifikasi)';
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>${sup}</sup></span>
                    <span class="${classSensor}">"${escapeHtml(teksAsli)}"</span>. <i>${label}</i>, 2026.`;
            } else if (isMe) {
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>a</sup></span>
                    <span class="text-gray-900 font-medium">"${escapeHtml(teksAsli)}"</span>. <i>Arsip Pribadi</i>, 2026.`;
            } else {
                liRef.innerHTML = `<span class="text-[#36c] cursor-pointer">^ <sup>b</sup></span>
                    <span class="text-[#0645ad] italic">"${escapeHtml(teksAsli)}"</span>. <i>Sumber Luar</i>, 2026.`;
            }

            daftarReferensi.appendChild(liRef);
            // Batasi referensi menjadi 8 entri terakhir
            while (daftarReferensi.children.length > 8) {
                daftarReferensi.removeChild(daftarReferensi.firstElementChild);
            }
        }

        // -- Logika BOM: hitung mundur & hapus --
        if (data.tipe === 'bom') {
            let sisaBom = 10;
            const bomInterval = setInterval(() => {
                sisaBom--;
                const aTimer = document.getElementById(`arsip-timer-${snapshot.key}`);
                const rTimer = document.getElementById(`ref-timer-${snapshot.key}`);
                if (aTimer) aTimer.textContent = sisaBom;
                if (rTimer) rTimer.textContent = sisaBom;

                if (sisaBom <= 0) {
                    clearInterval(bomInterval);
                    liArsip.style.transition = "opacity 0.4s";
                    liArsip.style.opacity    = "0";
                    setTimeout(() => { liArsip.remove(); updateArsipEmptyState(); }, 400);

                    // Hapus dari referensi
                    document.querySelectorAll('#daftar-referensi li').forEach(li => {
                        if (li.textContent.includes(`"${teksAsli}"`)) {
                            li.style.transition = "opacity 0.3s";
                            li.style.opacity    = "0";
                            setTimeout(() => li.remove(), 300);
                        }
                    });

                    if (isMe) chatRef.child(snapshot.key).remove();
                }
            }, 1000);
        }

    } else {
        // Notifikasi sistem (join/leave/darurat)
        if (pesanBaru || data.tipe === 'darurat_on') {
            tampilkanNotifikasiSistem(teksAsli, data.tipe, pesanBaru, data.timestamp);
        }
    }

    // Auto-scroll ke bawah jika di halaman rahasia
    if (pesanBaru && !halamanRahasia.classList.contains('hidden')) {
        requestAnimationFrame(() => {
            if (mainScroll) mainScroll.scrollTo({ top: mainScroll.scrollHeight, behavior: 'smooth' });
        });
    }
});

// =========================================================================
// 22. LOG ALERT DI ARSIP
// =========================================================================
function tampilkanLogAlertDiArsip(teks, waktu, isMe, key) {
    const liArsip = document.createElement('li');
    liArsip.className = "flex flex-col sm:flex-row gap-2 sm:gap-3 border-b-2 border-red-100 py-3 text-[13px] bg-red-50 animate-slide-in";

    const badge = isMe
        ? `<span class="inline-flex items-center bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ME (ALERT)</span>`
        : `<span class="inline-flex items-center bg-red-200 text-red-900 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider shrink-0">ANON (ALERT)</span>`;

    liArsip.innerHTML = `
        <div class="flex flex-col min-w-0 sm:min-w-[160px] text-gray-400 text-[11px] shrink-0 font-sans">
            <div><span class="text-[#0645ad] cursor-pointer">(skr | prb)</span></div>
            <div class="mt-0.5 whitespace-nowrap">${waktu}</div>
        </div>
        <div class="flex-1 flex items-start gap-2">
            ${badge}
            <span class="text-red-950 font-bold break-words">"${escapeHtml(teks)}"</span>
        </div>`;
    daftarArsipLengkap.appendChild(liArsip);
    updateArsipEmptyState();
}

// =========================================================================
// 23. NOTIFIKASI SISTEM (JOIN / LEAVE / DARURAT)
// =========================================================================
function tampilkanNotifikasiSistem(pesanSistem, tipe, pesanBaru, waktuTercatat) {
    let warnaHex = "#72777d", ikon = "♦";
    if (tipe === 'join')        { warnaHex = "#15803d"; ikon = "+"; }
    else if (tipe === 'leave')  { warnaHex = "#b91c1c"; ikon = "−"; }
    else if (tipe === 'darurat_on') { warnaHex = "#92400e"; ikon = "⚠"; }

    // Di arsip
    const liArsip = document.createElement('li');
    liArsip.className = "flex flex-col sm:flex-row gap-2 sm:gap-3 border-b border-gray-100 py-2 text-[12px] bg-gray-50 animate-fade-in";
    liArsip.innerHTML = `
        <div class="flex flex-col min-w-0 sm:min-w-[160px] text-gray-400 text-[11px] shrink-0 font-sans">
            <div><span>(log sistem)</span></div>
            <div class="mt-0.5 whitespace-nowrap">${formatWaktuWiki(waktuTercatat || Date.now())}</div>
        </div>
        <div class="flex items-center gap-2 flex-1" style="color:${warnaHex};">
            <span class="font-bold text-sm shrink-0">${ikon}</span>
            <span class="italic">${escapeHtml(pesanSistem)}</span>
        </div>`;
    daftarArsipLengkap.appendChild(liArsip);
    updateArsipEmptyState();

    // Di referensi (hanya pesan baru)
    if (pesanBaru) {
        const li = document.createElement('li');
        li.className = "italic text-[12px] flex items-center gap-2 font-sans animate-fade-in";
        li.style.color = warnaHex;
        li.innerHTML = `<span class="font-bold">${ikon}</span> <span>${escapeHtml(pesanSistem)}</span>`;
        daftarReferensi.appendChild(li);
        while (daftarReferensi.children.length > 8) {
            daftarReferensi.removeChild(daftarReferensi.firstElementChild);
        }
    }
}

// =========================================================================
// 24. UTILITAS — ESCAPE HTML (KEAMANAN XSS)
// =========================================================================
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
