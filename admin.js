/* Jubeli POS: antarmuka admin (kasir, servis, stok, jual, kas, jam masuk, opname, tebus, artikel). Dimuat oleh admin.html;
   skrip dipisah dari HTML supaya Content-Security-Policy bisa melarang skrip inline. */
(function () {
    var L = Layanan, C = L.C, A = L.api, E = L.esc, app = document.getElementById('app');
    var WA_IKON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.3.7a2.8 2.8 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>';
    var cache = { servis: [], artikel: [], tebus: [], stok: [], jual: [], absen: [], opname: [], kas: [], sewa: [], titip: [] }, dimuat = false, ed = null, ae = null, te = null, sk = null, filterTb = 'aktif', filterSk = 'tersedia', cariSk = '', dirty = false, filter = 'aktif', cari = '', menyimpan = false;
    var AKTIF = ['menunggu_dp', 'antri', 'dikerjakan', 'selesai'];
    var SEWA_AKTIF = false; /* sewa jam tangan belum dipakai: tombol "Rent" dan menu Rental disembunyikan (data & halaman #sewa tetap ada) */

    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
    function toast(msg, err) {
        var t = $('#toast'); t.textContent = msg; t.className = 'ly-toast on' + (err ? ' err' : '');
        clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = 'ly-toast'; }, err ? 8000 : 4000);
    }
    function pesanError(e) { return (e && e.message) || String(e); }
    function gagal(e) { if (window.console) console.error(e); toast(pesanError(e), true); }
    function sibuk(btn, on, teks) {
        if (!btn) return;
        if (on) { if (btn._asli == null) btn._asli = btn.innerHTML; if (!btn.classList.contains('ly-btn--ikon')) btn.textContent = teks || 'Saving…'; btn.disabled = true; } /* tombol ikon tetap berikon, hanya dinonaktifkan */
        else { if (btn._asli != null) { btn.innerHTML = btn._asli; btn._asli = null; } btn.disabled = false; }
    }
    /* ---------- tombol aksi seragam: baris WhatsApp (judul + keterangan + panah) dan kartu aksi berikon ---------- */
    var IKON = {
        kontak: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
        lihat: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
        cetak: '<path d="M7 9V4h10v5"/><path d="M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17"/><path d="M7 14h10v6H7z"/>',
        nota: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
        artikel: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
        hapus: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
        unduh: '<path d="M12 4v11"/><path d="M8 11.5l4 4 4-4"/><path d="M5 19.5h14"/>',
        buka: '<path d="M12 20V9"/><path d="M8 12.5l4-4 4 4"/><path d="M5 4.5h14"/>',
        kunci: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
        kirim: '<path d="M12 15V4"/><path d="M8 7.5 12 3.5l4 4"/><path d="M6.5 11H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-.5"/>',
        tautan: '<path d="M10.5 8H8a4 4 0 0 0 0 8h2.5"/><path d="M13.5 8H16a4 4 0 0 1 0 8h-2.5"/><path d="M8.5 12h7"/>',
        bagikan: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
        luar: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
        stok: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
        surat: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h4"/>',
        tanggal: '<path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>',
        uang: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M5.5 9v.01M18.5 15v.01"/>',
        jam: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5V12l3.5 2"/>',
        lonceng: '<path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 6 2 7H4c.5-1 2-2.5 2-7z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
        amplop: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>',
        awas: '<path d="M12 4 3 20h18z"/><path d="M12 10v5M12 17.5v.01"/>'
    };
    function ikon(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IKON[n] + '</svg>'; }
    /* tombol kecil hanya berikon (kirim = bagikan poster/penawaran, tautan = salin/bagikan link); label untuk pembaca layar dan tooltip */
    function tombolIkon(atr, id, nama, label) { return '<button type="button" class="ly-btn ly-btn--sm ly-btn--ikon" data-' + atr + '="' + E(id) + '" aria-label="' + E(label) + '" title="' + E(label) + '">' + ikon(nama) + '</button>'; }
    var PANAH = '<svg class="ly-wa__go" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    /* baris WhatsApp: w = [kunci, judul, keterangan]; atr = nama atribut data (data-wa / data-wat) */
    function barisWa(daftar, atr) {
        return '<div class="ly-wa">' + daftar.map(function (w) {
            return '<button type="button" class="ly-wa__b" data-' + atr + '="' + w[0] + '"><span class="ly-wa__i" aria-hidden="true">' + WA_IKON + '</span><span class="ly-wa__t"><b>' + w[1] + '</b><small>' + w[2] + '</small></span>' + PANAH + '</button>';
        }).join('') + '</div>';
    }
    /* kartu aksi: o.href (tautan; o.luar = tab baru) atau o.id (tombol); o.kelas: 'ly-akt--pri' | 'ly-akt--del' */
    function aksi(o) {
        var isi = '<span class="ly-akt__i">' + ikon(o.ikon) + '</span><span class="ly-akt__t">' + o.teks + '</span>', kls = 'ly-akt' + (o.kelas ? ' ' + o.kelas : '');
        if (o.href) return '<a class="' + kls + '"' + (o.luar ? ' target="_blank"' : '') + ' href="' + o.href + '">' + isi + '</a>';
        return '<button type="button" class="' + kls + '" id="' + o.id + '">' + isi + '</button>';
    }
    /* Isian rupiah (input[data-rp]): tampil dengan titik ribuan saat diketik (100000 -> 100.000). Kode lain tetap membaca/menulis
       .value sebagai angka polos ("100000"), jadi hitungan, simpan, dan data tidak berubah. Dipasang otomatis pada isian baru. */
    var NILAI_IN = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    function titikRp(v) { var d = String(v == null ? '' : typeof v === 'number' ? Math.round(v) : v).replace(/\D/g, '').replace(/^0+(?=\d)/, ''); return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    function pasangRp(el) {
        if (el._rp) return; el._rp = true;
        Object.defineProperty(el, 'value', { configurable: true, get: function () { return NILAI_IN.get.call(el).replace(/\D/g, ''); }, set: function (v) { NILAI_IN.set.call(el, titikRp(v)); } });
        NILAI_IN.set.call(el, titikRp(NILAI_IN.get.call(el)));
    }
    function pasangSemuaRp(root) { (root.querySelectorAll ? root.querySelectorAll('input[data-rp]') : []).forEach(pasangRp); }
    new MutationObserver(function (m) { m.forEach(function (x) { x.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches('input[data-rp]')) pasangRp(n); pasangSemuaRp(n); } }); }); })
        .observe(document.documentElement, { childList: true, subtree: true });
    pasangSemuaRp(document);
    /* fase tangkap: titik dirapikan lebih dulu, posisi kursor dijaga (dihitung dari jumlah angka di depannya) */
    document.addEventListener('input', function (e) {
        var el = e.target; if (!el || !el._rp) return;
        var mentah = NILAI_IN.get.call(el), pos = el.selectionStart == null ? mentah.length : el.selectionStart, n = mentah.slice(0, pos).replace(/\D/g, '').length, baru = titikRp(mentah);
        if (baru === mentah) return;
        NILAI_IN.set.call(el, baru);
        var i = 0; for (var k = 0; i < baru.length && k < n; i++) if (/\d/.test(baru.charAt(i))) k++;
        try { el.setSelectionRange(i, i); } catch (x) { /* abaikan */ }
    }, true);
    /* Penjelasan isian: ikon ⓘ di samping label, teksnya baru tampil saat diketuk (lebih ringkas daripada paragraf yang selalu terlihat) */
    function bantu(id) { return ' <button type="button" class="ly-i" data-tip="' + id + '" aria-label="Explanation" aria-expanded="false">i</button>'; }
    function tip(id, teks) { return '<p class="ly-hint ly-tip" id="' + id + '" hidden>' + teks + '</p>'; }
    app.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('.ly-i'); if (!b) return;
        e.preventDefault(); var t = document.getElementById(b.dataset.tip); if (!t) return;
        t.hidden = !t.hidden; b.setAttribute('aria-expanded', String(!t.hidden));
    });
    /* Form edit: di PC (layar lebar) dibagi 2 kolom - kartu isian di kiri, kartu status/pembayaran/aksi + tombol Simpan (menempel saat scroll) di kanan.
       kananJudul = awal judul kartu (legend) yang pindah ke kanan. Urutan semula dijaga lewat CSS order, jadi di HP tetap satu kolom seperti biasa. */
    function susunDua(kananJudul) {
        var root = app.firstElementChild; if (!root) return;
        var anak = Array.prototype.slice.call(root.children);
        anak.forEach(function (el, i) { el.style.order = i; });
        var kartu = anak.filter(function (el) { return el.tagName === 'FIELDSET' && el.classList.contains('ly-card'); });
        var kanan = kartu.filter(function (el) { var g = el.querySelector('legend'), t = g ? g.textContent : ''; return kananJudul.some(function (k) { return t.indexOf(k) === 0; }); });
        if (!kanan.length || kanan.length === kartu.length) return;
        var simpan = anak.filter(function (el) { return el.classList.contains('ly-save'); })[0];
        var w = document.createElement('div'), a = document.createElement('div'), b = document.createElement('div');
        w.className = 'ly-dua'; a.className = 'ly-dua__kiri'; b.className = 'ly-dua__kanan';
        root.insertBefore(w, kartu[0]); w.style.order = kartu[0].style.order; /* judul, kode, dan label status (order lebih kecil) tetap di atas kolom */
        kartu.forEach(function (el) { if (kanan.indexOf(el) < 0) a.appendChild(el); });
        if (simpan) b.appendChild(simpan);
        kanan.forEach(function (el) { b.appendChild(el); });
        w.appendChild(a); w.appendChild(b);
    }
    function kisiAksi(daftar) { return '<div class="ly-aksi">' + daftar.join('') + '</div>'; }
    function owner() { return A.peran() === 'owner'; }
    function setDirty(v) { dirty = v; var d = $('#dirty'); if (d) d.hidden = !v; }
    function opsi(list, cur) { return list.map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return '<option value="' + E(v) + '"' + (String(v) === String(cur == null ? '' : cur) ? ' selected' : '') + '>' + E(t) + '</option>'; }).join(''); }
    /* pilih pelanggan dari kontak HP. Di browser: Contact Picker API (Chrome Android, HTTPS, dari ketukan). Di aplikasi AYRI POS 1.4.0 ke atas:
       pemilih kontak bawaan Android lewat jembatan (op pilihKontak), hasilnya datang sebagai peristiwa 'jubeli-kontak'. Hanya satu kontak yang dipilih yang terbaca. */
    function kontakAplikasi() {
        var m = /AyriApp\/(\d+)\.(\d+)/.exec(navigator.userAgent);
        return !!m && adaAplikasi() && typeof window.AyriApp.postMessage === 'function' && (+m[1] > 1 || (+m[1] === 1 && +m[2] >= 4));
    }
    function bisaPilihKontak() { return kontakAplikasi() || !!(navigator.contacts && typeof navigator.contacts.select === 'function' && window.ContactsManager); }
    function tombolKontak(selNama, selHp) {
        return bisaPilihKontak() ? '<div class="ly-btns ly-kontak"><button type="button" class="ly-btn ly-btn--sm" data-kn="' + E(selNama) + '" data-kh="' + E(selHp) + '">' + ikon('kontak') + 'Pick from contacts</button></div>' : '';
    }
    function bersihHp(t) { var n = String(t || '').replace(/[^\d+]/g, ''); return n.charAt(0) === '+' ? '+' + n.slice(1).replace(/\+/g, '') : n.replace(/\+/g, ''); }
    function isiKolom(sel, nilai) { var el = sel && $(sel); if (!el || !nilai) return; el.value = nilai; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    var tombolKontakAktif = null;
    function terapkanKontak(b, nama, hp) {
        nama = String(nama || '').trim(); hp = bersihHp(hp);
        if (!nama && !hp) return toast('That contact has no name or number.', true);
        isiKolom(b.dataset.kn, nama); isiKolom(b.dataset.kh, hp);
        toast(hp ? 'Contact selected: ' + (nama || hp) : 'Contact selected, but it has no number. Enter the number.', !hp);
    }
    window.addEventListener('jubeli-kontak', function (e) {
        var d = e.detail || {}, b = tombolKontakAktif; tombolKontakAktif = null;
        if (d.galat) return toast(d.galat, true);
        if (b && document.body.contains(b)) terapkanKontak(b, d.nama, d.hp);
    });
    document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-kn]'); if (!b) return;
        if (kontakAplikasi()) { tombolKontakAktif = b; kirimKeAplikasi('pilihKontak', {}); return; }
        navigator.contacts.select(['name', 'tel'], { multiple: false }).then(function (daftar) {
            var k = daftar && daftar[0]; if (k) terapkanKontak(b, (k.name || [])[0], (k.tel || [])[0]);
        }).catch(function (err) { if (err && err.name !== 'AbortError') toast('Could not open contacts: ' + (err.message || err), true); });
    });
    function bukaWa(hp, teks) { window.open(L.waLink(hp, teks), '_blank', 'noopener'); }
    var salin = AYRI_UTIL.salin;
    function idAcak() { var r = new Uint8Array(6); crypto.getRandomValues(r); return Date.now().toString(36) + [].map.call(r, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
    function pindah(h) { hashLama = h; location.hash = h; }
    /* data di memori: cari satu catatan, atau taruh hasil simpan (catatan baru paling atas) */
    function cariId(jenis, id) { return cache[jenis].filter(function (x) { return x.id === id; })[0]; }
    function taruh(jenis, row) {
        var i = cache[jenis].map(function (x) { return x.id; }).indexOf(row.id);
        if (i > -1) cache[jenis][i] = row; else cache[jenis].unshift(row);
    }
    /* salinan catatan untuk diedit, atau catatan kosong bila id null. Data yang dibuat dari perangkat lain belum ada
       di memori: muat ulang dari GitHub sekali sebelum menyerah */
    function ambilCatatan(jenis, id, kosong, lanjut) {
        if (!id) return lanjut(kosong());
        if (cariId(jenis, id)) return lanjut(salin(cariId(jenis, id)));
        app.innerHTML = '<p class="ly-kosong">Loading the latest data…</p>';
        A.muat().then(function (d) {
            cache = d; var x = cariId(jenis, id);
            if (x) lanjut(salin(x)); else app.innerHTML = '<p class="ly-kosong">Record not found. <a href="#' + jenis + '">Back to the list</a></p>';
        }).catch(gagal);
    }
    /* simpan lewat Layanan.api lalu perbarui data di memori. Gagal sebagian (satu repo sudah berubah, yang lain belum):
       form memakai catatan yang sudah dibuat, supaya Simpan berikutnya tidak membuat data ganda */
    function prosesSimpan(jenis, btn, teks, janji, berhasil, pulih) {
        sibuk(btn, true, teks); menyimpan = true;
        janji().then(function (row) { menyimpan = false; taruh(jenis, row); setDirty(false); berhasil(row); }, function (e) {
            menyimpan = false; sibuk(btn, false);
            if (e.bentrok) return tawarMuatUlang(e);
            if (e.sebagian && e.rec && pulih) { pulih(e.rec); setDirty(true); }
            gagal(e);
        });
    }
    function teksUnggah(antri) { return antri.length ? 'Uploading ' + antri.length + ' photo(s)…' : 'Saving…'; }
    function konfirmasiKode(pesan, kode) {
        var k = prompt(pesan + '\nType the code (' + kode + ') to confirm:');
        if (k == null) return false;
        if (k.trim().toUpperCase() !== kode) { toast('Code does not match. Nothing was deleted.', true); return false; }
        return true;
    }
    function hapusData(jenis, rec, btn, hapus, pesan) {
        sibuk(btn, true, 'Deleting…');
        hapus(rec).then(function () { cache[jenis] = cache[jenis].filter(function (x) { return x.id !== rec.id; }); setDirty(false); toast(pesan); location.hash = '#' + jenis; })
            .catch(function (e) { sibuk(btn, false); gagal(e); });
    }
    var NAMA_METODE = { tunai: 'tunai', transfer: 'transfer', qris: 'QRIS', tukar: 'exchange credit' };
    /* simpanan ditolak karena catatan sudah diubah di perangkat lain: tawarkan memuat data terbaru */
    function tawarMuatUlang(e) {
        if (confirm(e.message + '\n\nLoad the latest data now? Unsaved changes on this screen will be discarded.')) {
            setDirty(false); A.muat().then(function (d) { cache = d; rute(); toast('Latest data loaded. Please try again.'); }).catch(gagal);
        } else toast(e.message, true);
    }
    function simpanBerkas(nama, teks, mime) {
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([teks], { type: mime || 'application/json' }));
        a.download = nama; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 15000);
    }
    /* kotak isian sandi/PIN (kolom disamarkan). aksi(sandi) -> Promise; berhasil = kotak ditutup, gagal = pesan dan kotak tetap terbuka */
    function dialogSandi(o, aksi) {
        var m = document.createElement('div'); m.className = 'ly-modal';
        m.innerHTML = '<form class="ly-modal__in ks-m ly-f" role="dialog" aria-modal="true" aria-label="' + E(o.judul) + '" autocomplete="off">' +
            '<div class="ks-m__head"><b>' + E(o.judul) + '</b><button type="button" class="ly-x" data-tutup aria-label="Close">×</button></div>' +
            (o.ket ? '<p class="ly-hint" style="margin:0">' + E(o.ket) + '</p>' : '') +
            '<label>' + E(o.label || 'Password') + '<input type="password" name="sandi" autocomplete="new-password" required></label>' +
            (o.ulang ? '<label>Repeat<input type="password" name="sandi2" autocomplete="new-password" required></label>' : '') +
            '<div class="ly-btns ks-m__aksi"><button type="button" class="ly-btn" data-tutup>Cancel</button><button class="ly-btn ly-btn--pri">' + E(o.tombol || 'Continue') + '</button></div></form>';
        document.body.appendChild(m);
        var f = $('form', m); f.sandi.focus();
        function tutup() { m.remove(); }
        m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-tutup]')) tutup(); });
        m.addEventListener('keydown', function (e) { if (e.key === 'Escape') tutup(); });
        f.addEventListener('submit', function (e) {
            e.preventDefault(); var b = $('.ly-btn--pri', f);
            if (f.sandi.value.length < A.PIN_MIN) return toast('At least ' + A.PIN_MIN + ' characters.', true);
            if (o.ulang && f.sandi.value !== f.sandi2.value) return toast('The two entries do not match.', true);
            sibuk(b, true, o.sibuk || 'Processing…');
            Promise.resolve(aksi(f.sandi.value)).then(tutup, function (err) { sibuk(b, false); gagal(err); });
        });
    }
    /* jembatan ke aplikasi Android (APK). APK baru memakai AyriApp.postMessage (hanya diterima dari jubeliwatch.github.io); APK lama memakai fungsi langsung */
    function adaAplikasi() { var a = window.AyriApp; return !!(a && (typeof a.postMessage === 'function' || typeof a.bagikan === 'function')); }
    function kirimKeAplikasi(op, d) {
        var a = window.AyriApp;
        if (typeof a.postMessage === 'function') a.postMessage(JSON.stringify(Object.assign({ op: op }, d)));
        else if (op === 'bagikan') a.bagikan(d.nama, d.mime, d.b64, d.teks);
    }
    /* cetak langsung ke printer thermal Bluetooth: aplikasi Jubeli POS, semua versi (penomorannya mulai dari 1.0.0, beda dengan AYRI POS) */
    function bisaCetakBt() {
        var m = /AyriApp\/(\d+)\.(\d+)/.exec(navigator.userAgent);
        return !!m && adaAplikasi() && typeof window.AyriApp.postMessage === 'function' && +m[1] >= 1;
    }
    /* cetak baris struk 58 mm (Layanan.strukThermal / strukServis): ke printer Bluetooth lewat aplikasi, atau lewat dialog cetak browser */
    function cetakBaris(baris) {
        if (bisaCetakBt()) { kirimKeAplikasi('cetakStruk', { baris: baris }); toast('Printing…'); return; }
        var el = $('#struk-cetak'); if (!el) { el = document.createElement('div'); el.id = 'struk-cetak'; document.body.appendChild(el); }
        el.innerHTML = '<div class="struk struk-pre">' + baris.map(function (x) {
            return '<div class="' + (x.a === 'c' ? 'c' : '') + (x.besar ? ' besar' : '') + '">' + (x.b ? '<b>' + E(x.t) + '</b>' : E(x.t)) + '&nbsp;</div>';
        }).join('') + '</div>';
        document.body.classList.add('cetak-struk');
        var lepas = function () { document.body.classList.remove('cetak-struk'); window.removeEventListener('afterprint', lepas); };
        window.addEventListener('afterprint', lepas); window.print();
        if (!window.AyriApp) setTimeout(lepas, 1500);
    }
    /* hasil cetak dari aplikasi (berhasil, printer mati, belum dipasangkan, dll.) */
    window.addEventListener('jubeli-cetak', function (e) { var d = e.detail || {}; if (d.pesan) toast(d.pesan, !d.ok); });
    /* gambar produk yang gagal dimuat dihapus (pengganti atribut onerror, supaya Content-Security-Policy bisa melarang skrip inline) */
    document.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.ks-p__img')) t.remove(); }, true);
    function kodeBaris(x, lain) { return '<div class="ly-kode">' + E(x.kode) + (lain == null ? ' <small>· last 4 phone digits: ' + E(L.hp4(x.hp)) + '</small>' : lain) + '</div>'; }

    /* ---------- foto di form (servis, tebus, stok) ----------
       foto baru langsung dikecilkan di HP dan menunggu di antrian; diunggah bersama data saat Simpan */
    var qn = 0;
    function antriFoto(antri, files, isi, gambar) {
        if (!files.length) return;
        var baru = files.map(function (file) { return Object.assign({ qid: 'q' + (++qn), pratinjau: URL.createObjectURL(file), file: file }, isi); });
        [].push.apply(antri, baru); gambar(); setDirty(true);
        baru.reduce(function (p, q) {
            return p.then(function () {
                return L.kompres(q.file).then(function (h) { URL.revokeObjectURL(q.pratinjau); q.hasil = h; q.file = null; q.pratinjau = URL.createObjectURL(h.kecil); gambar(); });
            });
        }, Promise.resolve()).catch(gagal);
    }
    function lepasAntri(antri) { antri.forEach(function (q) { URL.revokeObjectURL(q.pratinjau); }); return []; }
    function buangQ(antri, qid) { return antri.filter(function (q) { if (q.qid !== qid) return true; URL.revokeObjectURL(q.pratinjau); }); }
    function tombolTampil(on, attr, id) { return '<button type="button" class="ly-ft" ' + attr + '="' + E(id) + '" aria-pressed="' + !!on + '">' + (on ? 'Shown' : 'Hidden') + '</button>'; }
    /* satu grup foto: yang tersimpan (img data-foto = indeks, diisi L.isiFoto) + antrian. tahap null = semua foto */
    function grupFoto(judul, tahap, foto, antri, tampil) {
        var ada = [], tunggu = antri.filter(function (q) { return !tahap || q.tahap === tahap; });
        foto.forEach(function (f, i) { if (!tahap || L.tahapFoto(f) === tahap) ada.push([f, i]); });
        return '<div class="ly-fgrup"><h3>' + judul + '<label class="ly-btn ly-btn--sm ly-file">+ Photo<input type="file" accept="image/*" multiple' + (tahap ? ' data-tahap="' + tahap + '"' : '') + '></label></h3>' +
            (ada.length || tunggu.length ? '<div class="ly-foto">' + ada.map(function (x) {
                return '<figure><img data-foto="' + x[1] + '" alt="">' + (tampil ? tombolTampil(x[0].tampil, 'data-tampil', x[0].id) : '') + '<button type="button" class="ly-fx" data-hapusfoto="' + E(x[0].id) + '" aria-label="Delete photo">×</button></figure>';
            }).join('') + tunggu.map(function (q) {
                return '<figure' + (q.hasil ? '' : ' class="ly-up"') + '><img src="' + q.pratinjau + '" alt="">' + (tampil ? tombolTampil(q.tampil, 'data-tampilq', q.qid) : '') + '<button type="button" class="ly-fx" data-hapusq="' + q.qid + '" aria-label="Cancel">×</button></figure>';
            }).join('') + '</div>' : '<p class="ly-muted">No photos yet.</p>') + '</div>';
    }
    function pilihFoto(el, tambah) { el.addEventListener('change', function (e) { if (e.target.type === 'file') { tambah(e.target.dataset.tahap, [].slice.call(e.target.files)); e.target.value = ''; } }); }
    /* buka WA dulu (harus langsung dari ketukan), lalu catat tanggal pengingat di data */
    function catatPengingat(jenis, id, btn) {
        var x = cariId(jenis, id), servis = jenis === 'servis'; if (!x) return;
        bukaWa(x.hp, (servis ? L.pesan : L.pesanTebus).pengingat(x));
        var rec = salin(x); rec.pengingat = (rec.pengingat || []).concat(L.hariIni());
        if (btn) sibuk(btn, true, 'Recording…');
        (servis ? A.simpanServis : A.simpanTebus)(rec).then(function (row) {
            taruh(jenis, row);
            var f = servis ? ed && ed.s : te && te.t;
            if (f && f.id === row.id) { f.pengingat = row.pengingat; f.updated_at = row.updated_at; if (servis && $('#sv-titip')) gambarStatus(); }
            toast('Reminder logged (' + L.tgl(L.hariIni()) + ').');
            if (servis) gambarDaftar(); else gambarDaftarTebus();
        }).catch(function (e) { if (btn) sibuk(btn, false); gagal(e); });
    }

    /* tindak lanjut pelanggan (terima kasih / garansi): buka WA dulu (harus langsung dari ketukan), lalu catat tanggalnya di data supaya tidak muncul lagi */
    function catatTindak(tipe, id, jenis, btn) {
        var servis = tipe === 'servis', x = cariId(servis ? 'servis' : 'jual', id); if (!x) return;
        var pesan = servis ? (jenis === 'garansi' ? L.pesanTindak.servisGaransi(x) : L.pesanTindak.servisTerimaKasih(x)) : L.pesanTindak.jualTerimaKasih(x);
        bukaWa(x.hp, pesan);
        var rec = salin(x); rec.tindak = Object.assign({}, rec.tindak); rec.tindak[jenis] = L.hariIni();
        if (btn) sibuk(btn, true, 'Recording…');
        (servis ? A.simpanServis : A.simpanJual)(rec).then(function (row) { taruh(servis ? 'servis' : 'jual', row); toast('Logged: ' + (jenis === 'garansi' ? 'warranty' : 'thank-you') + ' message was sent.'); halamanHari(); })
            .catch(function (e) { if (btn) sibuk(btn, false); gagal(e); });
    }

    /* ================= token & PIN ================= */
    function mulai() {
        if (!L.siapAdmin) { app.innerHTML = '<section class="ly-login"><div class="ly-card"><h2>Setup is incomplete</h2><p class="ly-muted">Fill in the <b>github</b> section of <code>layanan-config.js</code>.</p></div></section>'; return; }
        if (!A.adaToken()) return layarPasang();
        if (!A.terbuka()) return layarPin();
        masukOk();
    }
    function layarPasang() {
        app.innerHTML = '<section class="ly-login"><form class="ly-card ly-f" id="f-pasang" autocomplete="off"><h2>Set up the POS on this device</h2>' +
            '<p class="ly-muted">Paste your GitHub token (see <b>README.md</b>, step 2), then create a PIN to open the POS on this device. The token is stored only on this device, locked by the PIN.</p>' +
            '<label>GitHub token<input type="password" name="token" placeholder="github_pat_…" autocomplete="off" spellcheck="false" required></label>' +
            '<div class="ly-row2"><label>New PIN (at least ' + A.PIN_MIN + ' characters)<input type="password" name="pin" autocomplete="new-password" minlength="' + A.PIN_MIN + '" required></label>' +
            '<label>Repeat PIN<input type="password" name="pin2" autocomplete="new-password" minlength="' + A.PIN_MIN + '" required></label></div>' +
            '<p class="ly-hint" style="margin:0">The PIN can use numbers or letters. Longer is safer. Five wrong PINs in a row lock the POS for a while.</p>' +
            '<button class="ly-btn ly-btn--pri">Set up</button></form></section>';
        $('#f-pasang').addEventListener('submit', function (e) {
            e.preventDefault(); var f = e.target, b = $('button', f);
            if (f.pin.value !== f.pin2.value) return toast('The PIN and its confirmation do not match.', true);
            if (f.pin.value.length < A.PIN_MIN) return toast('PIN needs at least ' + A.PIN_MIN + ' characters.', true);
            sibuk(b, true, 'Checking token…');
            A.pasangToken(f.token.value, f.pin.value).then(function () { f.token.value = ''; toast('The POS is ready on this device.'); masukOk(); })
                .catch(function (err) { sibuk(b, false); gagal(err); });
        });
    }
    function layarPin() {
        app.innerHTML = '<section class="ly-login"><form class="ly-card ly-f" id="f-pin" autocomplete="off"><h2>Open the POS</h2>' +
            '<label>PIN<input type="password" name="pin" autocomplete="current-password" autofocus required></label>' +
            '<button class="ly-btn ly-btn--pri">Open</button>' +
            '<p class="ly-hint">Forgot your PIN? <button type="button" class="ly-btn ly-btn--sm" id="b-ulang">Set up the token again</button></p></form></section>';
        $('#f-pin').addEventListener('submit', function (e) {
            e.preventDefault(); var b = $('button', e.target); sibuk(b, true, 'Opening…');
            var pin = e.target.pin.value;
            A.buka(pin).then(function () {
                masukOk();
                if (pin.length < A.PIN_MIN) toast('Your PIN is shorter than ' + A.PIN_MIN + ' characters. Change it with the "Change PIN" button at the bottom of the Service page.', true);
            }).catch(function (err) { sibuk(b, false); e.target.pin.value = ''; gagal(err); });
        });
        $('#b-ulang').addEventListener('click', function () { if (confirm('Remove the token from this device and set it up again?' + peringatanAntri())) A.lupakan().then(layarPasang); });
    }
    function masukOk() {
        $('#tabs').hidden = false; $('#kunci').hidden = false; $('#sinkron').hidden = false;
        app.innerHTML = '<p class="ly-kosong">Loading data…</p>';
        A.muat().then(function (d) { cache = d; dimuat = true; terapkanPeran(); if (!layarPisah()) rute(); }).catch(function (e) {
            app.innerHTML = '<section class="ly-login"><div class="ly-card"><h2>Could not load data</h2><p class="ly-muted">' + E(pesanError(e)) + '</p><div class="ly-btns"><button type="button" class="ly-btn ly-btn--pri" id="b-coba">Try again</button><button type="button" class="ly-btn" id="b-ulang2">Set up the token again</button></div></div></section>';
            $('#b-coba').addEventListener('click', masukOk);
            $('#b-ulang2').addEventListener('click', function () { if (peringatanAntri() && !confirm('Remove the token from this device?' + peringatanAntri())) return; A.lupakan().then(function () { $('#tabs').hidden = true; $('#kunci').hidden = true; $('#sinkron').hidden = true; layarPasang(); }); });
        });
    }
    /* owner / karyawan: karyawan tidak melihat tebus, artikel, harga modal, untung, dan tombol hapus */
    function terapkanPeran() {
        var k = !owner(), el = $('#peran');
        document.body.classList.toggle('ly-karyawan', k);
        el.hidden = !A.pisah(); el.textContent = k ? 'Staff' : 'Owner'; el.className = 'ly-peran' + (k ? ' staff' : '');
    }
    function layarPisah() {
        var st = A.statusPisah();
        if (st === 'pindah') {
            app.innerHTML = '<section class="ly-login"><div class="ly-card ly-f"><h2>Separate owner &amp; staff data</h2>' +
                '<p class="ly-muted">The shared repo <b>' + E(C.github.repoBersama) + '</b> is ready. Service, stock (without cost prices), sales, and journal data will be copied there so staff devices can use it.</p>' +
                '<p class="ly-muted">Buybacks, ID card photos, and cost prices stay in the repo <b>' + E(C.github.repoData) + '</b>, which only the owner can open. Older data stays in that repo’s history.</p>' +
                '<button type="button" class="ly-btn ly-btn--pri" id="b-pindah">Move it now</button></div></section>';
            $('#b-pindah').addEventListener('click', function () {
                var b = this; sibuk(b, true, 'Moving…'); menyimpan = true;
                A.pindahkanData().then(function () { return A.muat(); }).then(function (d) { menyimpan = false; cache = d; toast('Data separated. Staff devices can now be set up.'); rute(); })
                    .catch(function (e) { menyimpan = false; sibuk(b, false); gagal(e); });
            });
            return true;
        }
        if (st === 'kosong' && !owner()) {
            app.innerHTML = '<section class="ly-login"><div class="ly-card"><h2>Waiting for the owner</h2><p class="ly-muted">Shop data has not been moved to the shared repo yet. Ask the owner to open the POS on their device once, then tap reload above.</p></div></section>';
            return true;
        }
        return false;
    }
    $('#kunci').addEventListener('click', function () {
        if (dirty && !confirm('Changes are not saved. Lock anyway?')) return;
        A.kunci().then(function () { setDirty(false); $('#tabs').hidden = true; $('#kunci').hidden = true; $('#sinkron').hidden = true; $('#peran').hidden = true; layarPin(); });
    });
    /* muat ulang data dari GitHub (mis. setelah perangkat lain menyimpan) */
    $('#sinkron').addEventListener('click', function () {
        if (dirty || menyimpan) return toast('Save your changes before reloading.', true);
        var b = this; b.classList.add('putar'); b.disabled = true;
        A.muat().then(function (d) { cache = d; b.classList.remove('putar'); b.disabled = false; terapkanPeran(); if (!layarPisah()) rute(); toast(A.statusOffline().offline ? 'No internet: using the last data saved on this device.' : 'Latest data loaded.', A.statusOffline().offline); }).catch(function (e) { b.classList.remove('putar'); b.disabled = false; gagal(e); });
    });
    $('#b-lainnya').addEventListener('click', function () { $('#lainnya').hidden = !$('#lainnya').hidden; });
    $('#lainnya').addEventListener('click', function (e) { if (e.target === this || e.target.closest('a')) this.hidden = true; });
    /* status internet + antrian transaksi offline (dikirim otomatis saat online) */
    function net() {
        var s = A.statusOffline(), el = $('#net'), putus = navigator.onLine === false || s.offline;
        var teks = s.gagal.length ? s.gagal.length + ' failed to send' : s.antri ? (putus ? 'Offline · ' : 'Sending · ') + s.antri + ' queued' : putus ? 'Offline' : '';
        el.hidden = !teks; el.textContent = teks; el.classList.toggle('err', !!s.gagal.length);
    }
    function peringatanAntri() { var n = A.statusOffline().antri; return n ? '\n\nPERHATIAN: ' + n + ' offline transaction(s) have not been sent and will be lost.' : ''; }
    A.pantauOffline(function (s) {
        net();
        if (!s.terkirim) return;
        toast(s.terkirim + ' offline transaction(s) sent to GitHub.');
        if (dimuat && !menyimpan) A.muat().then(function (d) { cache = d; }).catch(function () {});
    });
    $('#net').addEventListener('click', function () {
        var s = A.statusOffline();
        if (s.gagal.length) {
            alert('These transactions FAILED to send and are not saved on GitHub. Record them again after checking:\n\n' + s.gagal.map(function (g) { return '• ' + g.jenis + (g.ket ? ' ' + g.ket : '') + '\n  ' + g.pesan; }).join('\n'));
            if (confirm('Recorded them again? Clear this failed list.')) A.buangGagal().then(function () { return A.muat(); }).then(function (d) { cache = d; rute(); }).catch(gagal);
            return;
        }
        if (s.antri) {
            var isi = s.daftar.map(function (x) { return x.jenis + (x.ket ? ' ' + x.ket : ''); }).join(', ');
            if (navigator.onLine === false) return toast(s.antri + ' waiting for internet: ' + isi + '. Sent automatically when back online.');
            toast('Sending ' + s.antri + ' transaction(s)…'); A.kirimAntrian().catch(function () { toast('Still not connected. Retrying automatically.', true); });
            return;
        }
        toast('No internet. You are seeing the last data saved on this device; checkout sales can still be recorded.');
    });
    window.addEventListener('online', net); window.addEventListener('offline', net); net();

    /* ================= rute: #servis, #servis/<id>, #servis/baru, #artikel, ... ================= */
    var hashLama = location.hash;
    function rute() {
        if (!A.terbuka()) return layarPin();
        var p = (location.hash.replace(/^#/, '') || 'hari').split('/');
        $$('#tabs a').forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + p[0] ? 'page' : 'false'); });
        document.body.classList.toggle('ly-detail', !!p[1] || p[0] === 'opname'); document.body.classList.remove('ly-kunci-gulir');
        app.classList.toggle('ly-lebar', (!p[1] && ['hari', 'kasir', 'servis', 'jam', 'opname', 'rekap', 'kas'].indexOf(p[0]) > -1) || (p[0] === 'opname' && !!p[1]));
        window.scrollTo(0, 0);
        if (!owner() && (p[0] === 'tebus' || p[0] === 'titip' || p[0] === 'artikel' || p[0] === 'rekap' || (p[0] === 'jam' && p[1] === 'atur'))) { toast('This menu is for the owner only.', true); pindah('#kasir'); return; }
        $('#lainnya').hidden = true; app.onclick = app.oninput = app.onchange = null; clearInterval(detikJam);
        $('#b-lainnya').setAttribute('aria-current', ['jam', 'opname', 'tebus', 'titip', 'artikel', 'rekap', 'kas', 'sewa'].indexOf(p[0]) > -1 ? 'page' : 'false');
        if (p[0] === 'hari') return halamanHari();
        if (p[0] === 'kas') return halamanKas();
        if (p[0] === 'jam') return p[1] === 'atur' ? aturKaryawan() : halamanJam();
        if (p[0] === 'opname') return opname(p[1]);
        if (p[0] === 'rekap') return rekap();
        if (p[0] === 'kasir') return kasir();
        if (p[0] === 'titip') return p[1] ? bukaTitip(p[1] === 'baru' ? null : p[1]) : daftarTitip();
        if (p[0] === 'tebus') return p[1] ? bukaTebus(p[1] === 'baru' ? null : p[1]) : daftarTebus();
        if (p[0] === 'stok') return p[1] ? bukaStok(p[1] === 'baru' ? null : p[1]) : daftarStok();
        if (p[0] === 'jual') return p[1] === 'baru' ? jualBaru(p[2]) : p[1] ? bukaJual(p[1]) : daftarJual();
        if (p[0] === 'sewa') return p[1] === 'baru' ? sewaBaru(p[2]) : p[1] ? bukaSewa(p[1]) : daftarSewa();
        if (p[0] === 'artikel') return p[1] ? bukaArtikel(p[1] === 'baru' ? null : p[1]) : daftarArtikel();
        return p[1] ? bukaServis(p[1] === 'baru' ? null : p[1]) : daftarServis();
    }
    window.addEventListener('hashchange', function () {
        if ((dirty && !confirm('Changes are not saved. Leave this page?')) || menyimpan) { history.replaceState(null, '', hashLama || '#servis'); return; }
        setDirty(false); hashLama = location.hash; if (dimuat) rute();
    });
    window.addEventListener('beforeunload', function (e) { if (dirty || menyimpan) { e.preventDefault(); e.returnValue = ''; } });

    /* ================= kasir (POS): jual barang stok + terima pelunasan servis dalam satu struk ================= */
    var kr = { items: [] }, filterKs = 'semua', cariKs = '', strukAkhir = null;
    var SVG = {
        cari: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
        troli: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/></svg>',
        gitar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2.5h6l.8 4.2M9 2.5l-.8 4.2M9 21.5h6l.8-4.2M9 21.5l-.8-4.2"/><circle cx="12" cy="12" r="5.6"/><path d="M12 9v3l2 1.2M18.6 11v2"/></svg>',
        kunci: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
        ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16.5 9.5"/></svg>'
    };
    function siapBayar(s) { return s.status === 'selesai' && L.hitung(s, s.items, s.bayar).sisa > 0; }
    function bisaDijual(s) { return +s.jumlah > 0 && s.status !== 'ditarik' && !L.sewaAktifStok(s.id, cache.sewa) && !L.titipanTerkunci(s); }
    function namaBarang(s) { return L.judulStok(s) + (s.warna ? ' (' + s.warna + ')' : '') + (s.kondisi === 'bekas' ? ' – Used' + (L.tingkatStok(s) ? ' ' + L.tingkatStok(s) : '') : ''); }
    function totalKr() { return kr.items.reduce(function (t, i) { return t + i.harga * i.qty; }, 0); }
    function nKr() { return kr.items.reduce(function (t, i) { return t + i.qty; }, 0); }
    function kasir() {
        app.innerHTML = '<section class="ks">' +
            '<div class="ks-kiri"><div class="ly-card ks-atas"><div class="ks-cari-baris"><label class="ks-cari">' + SVG.cari + '<input id="ks-cari" type="search" placeholder="Search item, brand, dial, serial no., service code…" autocomplete="off"></label><button type="button" class="ly-btn ks-jasa" data-jasa aria-haspopup="dialog">+ Jasa cepat</button></div>' +
            '<div class="ly-filter" id="ks-filter"></div></div><div class="ks-grid" id="ks-grid"></div></div>' +
            '<aside class="ks-kanan" id="ks-kanan"><div class="ly-card ks-inv">' +
            '<div class="ks-inv__head"><span class="ks-bulat">' + SVG.troli + '</span><div><b>Checkout invoice</b><small>' + L.tgl(L.hariIni()) + '</small></div><button type="button" class="ly-x ks-tutup" id="ks-tutup" aria-label="Close">×</button></div>' +
            '<div class="ks-pel"><input class="ly-in" id="ks-nama" placeholder="Customer name (optional)" autocomplete="off"><input class="ly-in" id="ks-hp" type="tel" inputmode="tel" placeholder="Phone / WhatsApp (optional)" autocomplete="off"></div>' +
            '<div class="ks-isi" id="ks-isi"></div><div class="ks-tot" id="ks-tot"></div>' +
            '<button type="button" class="ly-btn ly-btn--pri ks-bayar" id="ks-bayar"></button></div></aside>' +
            '<button type="button" class="ks-bar" id="ks-bar"></button></section>' +
            '<div class="ly-modal" id="ks-modal" hidden></div>';
        $('#ks-cari').value = cariKs; $('#ks-nama').value = kr.nama || ''; $('#ks-hp').value = kr.hp || '';
        $('#ks-cari').addEventListener('input', function () { cariKs = this.value; gambarProduk(); });
        $('.ks-atas').addEventListener('click', function (e) { if (e.target.closest('[data-jasa]')) bukaJasaCepat(); });
        $('#ks-filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { filterKs = b.dataset.f; gambarProduk(); } });
        $('#ks-grid').addEventListener('click', function (e) { var b = e.target.closest('[data-tambah]'); if (b) tambahKr(b.dataset.tambah); });
        $('#ks-nama').addEventListener('input', function () { kr.nama = this.value; });
        $('#ks-hp').addEventListener('input', function () { kr.hp = this.value; });
        $('#ks-isi').addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return; var i = +b.dataset.i, it = kr.items[i]; if (!it) return;
            if (b.dataset.q) { if (it.qty + +b.dataset.q < 1) kr.items.splice(i, 1); else it.qty = Math.min(it.maks, it.qty + +b.dataset.q); }
            else if (b.hasAttribute('data-hapus')) kr.items.splice(i, 1);
            gambarKeranjang(); gambarProduk();
        });
        $('#ks-isi').addEventListener('change', function (e) {
            var i = +e.target.dataset.i, it = kr.items[i]; if (!it) return;
            if (e.target.dataset.harga != null) it.harga = Math.max(0, Math.round(+e.target.value || 0));
            if (e.target.dataset.ambil != null) it.ambil = e.target.checked;
            gambarKeranjang();
        });
        $('#ks-bayar').addEventListener('click', bukaBayar);
        $('#ks-bar').addEventListener('click', function () { $('#ks-kanan').classList.add('buka'); document.body.classList.add('ly-kunci-gulir'); });
        $('#ks-tutup').addEventListener('click', tutupLembar);
        $('#ks-kanan').addEventListener('click', function (e) { if (e.target === this) tutupLembar(); });
        gambarProduk(); gambarKeranjang();
    }
    function tutupLembar() { var k = $('#ks-kanan'); if (k) k.classList.remove('buka'); document.body.classList.remove('ly-kunci-gulir'); }
    function gambarProduk() {
        if (!$('#ks-grid')) return;
        var stok = cache.stok.filter(bisaDijual), sv = cache.servis.filter(siapBayar), c = cariKs.trim().toLowerCase();
        var n = { semua: stok.length, baru: 0, bekas: 0, aksesoris: 0, servis: sv.length };
        stok.forEach(function (s) { n[kelStok(s)]++; });
        $('#ks-filter').innerHTML = [['semua', 'All items'], ['baru', 'New watches'], ['bekas', 'Pre-owned watches'], ['aksesoris', 'Accessories'], ['servis', '🔧 Service ready to pay']].map(function (x) {
            return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (filterKs === x[0]) + '">' + x[1] + '<b>' + n[x[0]] + '</b></button>';
        }).join('');
        function cocok(teks) { return !c || teks.toLowerCase().indexOf(c) > -1; }
        var html = '';
        if (filterKs === 'servis' || (c && filterKs === 'semua')) html += sv.filter(function (s) { return cocok([s.kode, s.nama, s.hp, s.arloji_jenis, s.arloji_merk].join(' ')); }).map(function (s) {
            var h = L.hitung(s, s.items, s.bayar), ada = kr.items.some(function (i) { return i.jenis === 'servis' && i.id === s.id; });
            return '<button type="button" class="ks-p ks-p--sv" data-tambah="servis:' + E(s.id) + '"' + (ada ? ' aria-pressed="true"' : '') + '>' +
                '<span class="ks-p__top"><span class="ks-tag ks-tag--servis">' + SVG.kunci + 'Service</span><span class="ks-p__kode">' + E(s.kode) + '</span></span>' +
                '<b class="ks-p__nama">' + E(L.namaGitar(s, 'Watch')) + '</b><small>' + E(s.nama) + ' · done ' + L.tgl(s.tgl_selesai) + '</small>' +
                '<span class="ks-p__harga"><small>Balance due</small>' + L.rupiah(h.sisa) + '</span>' + (ada ? '<span class="ks-p__n">✓</span>' : '') + '</button>';
        }).join('');
        if (filterKs !== 'servis') html += stok.filter(function (s) {
            return (filterKs === 'semua' || kelStok(s) === filterKs) && cocok([s.kode, s.nama, s.sub, s.arloji_jenis, s.arloji_merk, s.warna, s.no_seri].join(' '));
        }).map(function (s) {
            var kel = kelStok(s), f = (s.foto || []).filter(function (x) { return x.repo === 'publik'; })[0], di = kr.items.filter(function (i) { return i.jenis === 'stok' && i.id === s.id; })[0];
            var habis = di && di.qty >= +s.jumlah, tanpaHarga = !(+s.harga_jual > 0);
            return '<button type="button" class="ks-p' + (habis ? ' habis' : '') + '" data-tambah="stok:' + E(s.id) + '"' + (di ? ' aria-pressed="true"' : '') + (habis && +s.jumlah === 1 ? ' title="Tap again to cancel"' : '') + '>' +
                '<span class="ks-p__img">' + (f ? '<img src="' + E(f.thumb_path || f.path) + '" alt="" loading="lazy">' : '') + SVG.gitar + '</span>' +
                '<span class="ks-p__top"><span class="ks-tag ks-tag--' + kel + '">' + (kel === 'aksesoris' ? E(s.sub || 'Accessories') : kel === 'baru' ? 'New' : 'Pre-owned') + '</span><span class="ks-p__stok' + (+s.jumlah <= 1 ? ' sedikit' : '') + '">Stock ' + s.jumlah + (s.status === 'dipesan' ? ' · deposit paid' : '') + '</span></span>' +
                '<b class="ks-p__nama">' + E(L.namaStok(s)) + '</b>' +
                '<small>' + E([s.warna, s.no_seri ? 'SN ' + s.no_seri : ''].filter(Boolean).join(' · ') || s.kode) + '</small>' +
                '<span class="ks-p__harga">' + (tanpaHarga ? '<span class="ly-warn">No price yet</span>' : L.rupiah(s.harga_jual)) + '</span>' + (di ? '<span class="ks-p__n">' + di.qty + '</span>' : '') + '</button>';
        }).join('');
        $('#ks-grid').innerHTML = html || '<p class="ly-kosong">' + (filterKs === 'servis' ? 'No finished service jobs with a balance due.' : cache.stok.length ? 'No matching items.' : 'No stock yet. Add items in the Stock menu.') + '</p>';
    }
    function tambahKr(kunci) {
        var p = kunci.split(':'), jenis = p[0], id = p[1];
        if (jenis === 'servis') {
            if (kr.items.some(function (i) { return i.jenis === 'servis' && i.id === id; })) { kr.items = kr.items.filter(function (i) { return !(i.jenis === 'servis' && i.id === id); }); toast('Removed from the cart.'); gambarKeranjang(); gambarProduk(); return; }
            var s = cariId('servis', id), h = L.hitung(s, s.items, s.bayar);
            kr.items.push({ jenis: 'servis', id: id, kode: s.kode, nama: 'Service payment ' + L.namaGitar(s, 'arloji'), qty: 1, maks: 1, harga: h.sisa, ambil: true });
            if (!kr.nama && !kr.hp) { kr.nama = s.nama; kr.hp = s.hp; if ($('#ks-nama')) { $('#ks-nama').value = s.nama; $('#ks-hp').value = s.hp; } }
        } else {
            var st = cariId('stok', id), ada = kr.items.filter(function (i) { return i.jenis === 'stok' && i.id === id; })[0];
            if (ada && ada.qty >= ada.maks) {
                /* stok sudah habis di keranjang: ketuk lagi = batalkan (barang 1 unit), atau beri tahu sisa stok */
                if (ada.maks === 1) { kr.items = kr.items.filter(function (i) { return i !== ada; }); toast('Removed from the cart.'); }
                else toast('Stock ' + st.kode + ' only ' + ada.maks + ' unit.', true);
            } else if (ada) ada.qty += 1;
            else kr.items.push({ jenis: 'stok', id: id, kode: st.kode, nama: namaBarang(st), qty: 1, maks: +st.jumlah, harga: +st.harga_jual || 0, modal: +st.harga_beli || 0 });
        }
        gambarKeranjang(); gambarProduk();
    }
    /* dari papan antrian: servis selesai langsung masuk keranjang kasir */
    function keKasir(id) { if (!kr.items.some(function (i) { return i.jenis === 'servis' && i.id === id; })) tambahKr('servis:' + id); filterKs = 'servis'; pindah('#kasir'); }
    function gambarKeranjang() {
        if (!$('#ks-isi')) return;
        var tot = totalKr(), n = nKr();
        $('#ks-isi').innerHTML = kr.items.length ? kr.items.map(function (it, i) {
            return '<div class="ks-it"><div class="ks-it__a"><b>' + E(it.nama) + '</b><small>' + E(it.jenis === 'jasa' ? 'Quick service' : it.kode) + '</small></div><button type="button" class="ly-x" data-hapus data-i="' + i + '" aria-label="Remove from cart">×</button>' +
                '<div class="ks-it__b">' + (it.jenis !== 'servis' ? '<span class="ks-qty"><button type="button" data-q="-1" data-i="' + i + '" aria-label="' + (it.qty > 1 ? 'Decrease' : 'Remove from cart') + '">' + (it.qty > 1 ? '−' : '🗑') + '</button><b>' + it.qty + '</b><button type="button" data-q="1" data-i="' + i + '" aria-label="Add"' + (it.qty >= it.maks ? ' disabled' : '') + '>+</button></span>' +
                    '<label class="ks-harga">@<input type="text" inputmode="numeric" autocomplete="off" data-rp data-harga data-i="' + i + '" value="' + it.harga + '" aria-label="Unit price"></label>'
                    : '<label class="ks-ambil"><input type="checkbox" data-ambil data-i="' + i + '"' + (it.ambil ? ' checked' : '') + '> Watch collected now</label>') +
                '<b class="ks-it__sub">' + L.rupiah(it.harga * it.qty) + '</b></div></div>';
        }).join('') : '<div class="ks-kosong">' + SVG.troli + '<b>The cart is empty</b><span>Tap an item or a service ready to pay on the left to start an invoice.</span></div>';
        $('#ks-tot').innerHTML = '<div><span>' + n + ' item</span><span>' + L.rupiah(tot) + '</span></div><div class="t"><span>Total to pay</span><span>' + L.rupiah(tot) + '</span></div>';
        var b = $('#ks-bayar'); b.textContent = 'Process payment (' + L.rupiah(tot) + ')'; b.disabled = !kr.items.length;
        var bar = $('#ks-bar'); bar.hidden = !kr.items.length; bar.innerHTML = '<span class="ks-bulat">' + SVG.troli + '<i>' + n + '</i></span><span>' + L.rupiah(tot) + '</span><b>Review &amp; pay ›</b>';
    }

    /* ---------- jasa cepat ----------
       Pekerjaan yang selesai sambil pelanggan menunggu (pasang senar, setel ringan, ganti baterai, dll.): tidak lewat menu Servis.
       Nama bebas diketik (saran dari daftar jasa + jasa yang pernah dicatat), tanpa garansi. Masuk keranjang dan satu nota dengan barang. */
    function saranJasa() {
        var peta = {}, daftar = [];
        cache.jual.slice().sort(function (a, b) { return String(b.tgl).localeCompare(String(a.tgl)); }).forEach(function (j) { (j.items || []).forEach(function (i) { if (i.jenis === 'jasa' && !peta[i.nama.toLowerCase()]) { peta[i.nama.toLowerCase()] = 1; daftar.push({ nama: i.nama, harga: i.harga }); } }); });
        (C.katalogJasa || []).forEach(function (k) { if (!peta[k.nama.toLowerCase()]) { peta[k.nama.toLowerCase()] = 1; daftar.push({ nama: k.nama, harga: k.harga || 0 }); } });
        return daftar;
    }
    function bukaJasaCepat() {
        var m = $('#ks-modal'), saran = saranJasa();
        m.innerHTML = '<div class="ly-modal__in ks-m" role="dialog" aria-modal="true" aria-label="Quick service">' +
            '<div class="ks-m__head"><b>Quick service</b><button type="button" class="ly-x" data-tutup aria-label="Close">×</button></div>' +
            '<p class="ly-hint" style="margin:0 0 10px">For work finished while the customer waits. No warranty, and it does not appear in the Service menu.</p>' +
            '<div class="ks-jasa-f"><label>Service name<input class="ly-in" id="kj-nama" list="kj-saran" maxlength="80" autocomplete="off" placeholder="e.g. Battery replacement, Strap fitting"></label>' +
            '<datalist id="kj-saran">' + saran.map(function (x) { return '<option value="' + E(x.nama) + '"></option>'; }).join('') + '</datalist>' +
            '<label>Price (Rp)<input class="ly-in" id="kj-harga" type="text" inputmode="numeric" autocomplete="off" data-rp></label></div>' +
            '<div class="ly-btns ks-m__aksi"><button type="button" class="ly-btn" data-tutup>Cancel</button><button type="button" class="ly-btn ly-btn--pri" id="kj-ok">Add to cart</button></div></div>';
        m.hidden = false;
        var nama = $('#kj-nama'), harga = $('#kj-harga'), terakhir = '';
        nama.focus();
        nama.addEventListener('input', function () {
            var cocok = saran.filter(function (x) { return x.nama.toLowerCase() === nama.value.trim().toLowerCase(); })[0];
            if (cocok && cocok.harga && (!harga.value || harga.value === terakhir)) { harga.value = cocok.harga; terakhir = String(cocok.harga); }
        });
        m.onclick = function (e) {
            var b = e.target.closest('button');
            if (e.target === m || (b && b.hasAttribute('data-tutup'))) { m.hidden = true; return; }
            if (!b || b.id !== 'kj-ok') return;
            var n = nama.value.replace(/\s+/g, ' ').trim(), h = Math.max(0, Math.round(+harga.value || 0));
            if (!n) return toast('Enter the service name.', true);
            if (!(h > 0)) return toast('Enter the service price.', true);
            kr.items.push({ jenis: 'jasa', id: idAcak(), kode: '', nama: n, qty: 1, maks: 99, harga: h });
            m.hidden = true; m.onclick = null; toast('Service added to the cart.'); gambarKeranjang();
        };
    }

    /* ---------- pembayaran ---------- */
    function bukaBayar() {
        if (!kr.items.length) return;
        var tanpaHarga = kr.items.filter(function (i) { return !(i.harga > 0); })[0];
        if (tanpaHarga) return toast('Enter a price for ' + tanpaHarga.nama + '.', true);
        var tot = totalKr(), hanyaStok = kr.items.some(function (i) { return i.jenis === 'stok'; }) && kr.items.every(function (i) { return i.jenis !== 'servis'; }), m = $('#ks-modal');
        var kreditList = hanyaStok ? cache.jual.map(function (j) { var k = L.kreditTukar(j); return k && k.sisa > 0 ? { id: j.id, kode: j.kode, nama: j.nama, sisa: k.sisa } : null; }).filter(Boolean) : [];
        var bayar = { metode: 'tunai', dp: false, diterima: tot, jumlahDp: '', batas: L.tambahHari(L.hariIni(), C.jual.batasHari), kredit: kreditList.length ? kreditList[0].id : '', pakaiKredit: false };
        function kreditDipilih() { return bayar.pakaiKredit ? kreditList.filter(function (k) { return k.id === bayar.kredit; })[0] || null : null; }
        /* yang masih harus dibayar uang (setelah kredit tukar, bila dipakai) */
        function perlu() { var k = kreditDipilih(); return Math.max(0, tot - (k ? k.sisa : 0)); }
        function pecahan() { var n = perlu(), p = [n]; [50000, 100000].forEach(function (k) { var x = Math.ceil(n / k) * k; if (p.indexOf(x) < 0) p.push(x); }); return p.slice(0, 3); }
        function gambar() {
            var dp = bayar.dp, kembali = bayar.diterima - perlu(), uji = { items: [{ harga: tot, qty: 1 }], bayar: [{ jumlah: +bayar.jumlahDp || 0 }] }, hh = L.hitungJual(uji);
            m.innerHTML = '<div class="ly-modal__in ks-m" role="dialog" aria-modal="true" aria-label="Payment">' +
                '<div class="ks-m__head"><b>Payment</b><button type="button" class="ly-x" data-tutup aria-label="Close">×</button></div>' +
                '<div class="ks-m__total"><small>Total to pay</small><b>' + L.rupiah(tot) + '</b></div>' +
                (kreditList.length && !dp ? '<label class="ly-cek"><input type="checkbox" id="km-pakai-kredit"' + (bayar.pakaiKredit ? ' checked' : '') + '><span>Use <b>exchange credit</b> (the buyer exchanged a watch)</span></label>' +
                    (bayar.pakaiKredit ? '<div class="ly-f"><label>Credit from<select id="km-kredit">' + kreditList.map(function (k) { return '<option value="' + E(k.id) + '"' + (k.id === bayar.kredit ? ' selected' : '') + '>' + E(k.kode + (k.nama ? ' · ' + k.nama : '') + ' · remaining ' + L.rupiah(k.sisa)) + '</option>'; }).join('') + '</select></label></div>' +
                        '<div class="ly-sum"><div><span>Deducted from credit</span><span>' + L.rupiah(Math.min(tot, (kreditDipilih() || { sisa: 0 }).sisa)) + '</span></div><div class="ly-total"><span>Still to pay</span><span>' + L.rupiah(Math.max(0, tot - (kreditDipilih() || { sisa: 0 }).sisa)) + '</span></div></div>' : '') : '') +
                (hanyaStok ? '<div class="ly-status ks-seg"><button type="button" data-dp="0" aria-pressed="' + !dp + '">Pay in full</button><button type="button" data-dp="1" aria-pressed="' + dp + '">Deposit (part payment)</button></div>' : '') +
                '<div class="ly-status ks-seg"><button type="button" data-metode="tunai" aria-pressed="' + (bayar.metode === 'tunai') + '">Cash</button><button type="button" data-metode="transfer" aria-pressed="' + (bayar.metode === 'transfer') + '">Transfer</button></div>' +
                (dp ? '<div class="ly-f"><label>Deposit amount (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="km-dp" value="' + E(bayar.jumlahDp) + '"></label>' +
                    '<label>Pay balance by<input type="date" id="km-batas" value="' + E(bayar.batas) + '"></label></div>' +
                    '<div class="ly-sum"><div><span>Balance after deposit</span><span>' + L.rupiah(Math.max(0, tot - (+bayar.jumlahDp || 0))) + '</span></div><div><span>If cancelled: fee ' + C.jual.potonganPersen + '% (no more than the deposit)</span><span>' + L.rupiah(hh.potongan) + '</span></div></div>' +
                    '<p class="ly-hint" style="margin:0">A deposit needs the buyer’s name and WhatsApp number. The item is held until paid in full; the deposit receipt is sent by WhatsApp next.</p>'
                    : bayar.metode === 'tunai' && perlu() > 0 ? '<div class="ly-f"><label>Cash received (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="km-terima" value="' + bayar.diterima + '"></label></div>' +
                        '<div class="ks-pecahan">' + pecahan().map(function (x) { return '<button type="button" class="ly-btn ly-btn--sm" data-terima="' + x + '">' + (x === perlu() ? 'Exact amount' : L.rupiah(x)) + '</button>'; }).join('') + '</div>' +
                        '<div class="ly-sum"><div class="ly-total"><span>Change</span><span' + (kembali < 0 ? ' class="ly-telat"' : '') + '>' + (kembali < 0 ? 'short ' + L.rupiah(-kembali) : L.rupiah(kembali)) + '</span></div></div>' : '') +
                '<div class="ly-btns ks-m__aksi"><button type="button" class="ly-btn" data-tutup>Cancel</button><button type="button" class="ly-btn ly-btn--pri" id="km-ok">' + (dp ? 'Save deposit' : 'Confirm payment') + '</button></div></div>';
        }
        gambar(); m.hidden = false;
        m.onclick = function (e) {
            var b = e.target.closest('button');
            if (e.target === m || (b && b.hasAttribute('data-tutup'))) { m.hidden = true; return; }
            if (!b) return;
            if (b.dataset.dp != null) { bayar.dp = b.dataset.dp === '1'; gambar(); }
            else if (b.dataset.metode) { bayar.metode = b.dataset.metode; gambar(); }
            else if (b.dataset.terima) { bayar.diterima = +b.dataset.terima; gambar(); }
            else if (b.id === 'km-ok') {
                if (bayar.dp) {
                    kr.nama = $('#ks-nama').value.trim(); kr.hp = $('#ks-hp').value.trim();
                    if (!kr.nama || L.hp4(kr.hp).length < 4) return toast('For a deposit, enter the customer’s name and WhatsApp number on the invoice.', true);
                    var j = +bayar.jumlahDp || 0; if (j >= tot) return toast('The deposit equals the total: choose Pay in full.', true);
                    if (!bayar.batas || bayar.batas < L.hariIni()) return toast('The pay-by date is not valid.', true);
                    if (!j && !confirm('No deposit yet. Hold the item for this customer anyway?')) return;
                } else if (bayar.pakaiKredit && !kreditDipilih()) return toast('Choose which exchange credit to use.', true);
                else if (bayar.metode === 'tunai' && perlu() > 0 && bayar.diterima < perlu()) return toast('Cash received is less than the amount due.', true);
                prosesBayar(bayar, b);
            }
        };
        m.oninput = function (e) {
            if (e.target.id === 'km-terima') { bayar.diterima = Math.round(+e.target.value || 0); var k = bayar.diterima - perlu(), el = $('.ks-m .ly-total span:last-child'); el.textContent = k < 0 ? 'short ' + L.rupiah(-k) : L.rupiah(k); el.className = k < 0 ? 'ly-telat' : ''; }
            else if (e.target.id === 'km-dp') { bayar.jumlahDp = e.target.value; }
            else if (e.target.id === 'km-batas') bayar.batas = e.target.value;
        };
        m.onchange = function (e) {
            if (e.target.id === 'km-dp') gambar();
            else if (e.target.id === 'km-pakai-kredit') { bayar.pakaiKredit = e.target.checked; bayar.diterima = perlu(); gambar(); }
            else if (e.target.id === 'km-kredit') { bayar.kredit = e.target.value; bayar.diterima = perlu(); gambar(); }
        };
    }
    /* simpan: barang stok jadi satu transaksi jual, tiap servis dicatat pelunasannya. Yang sudah tersimpan dikeluarkan dari
       keranjang, supaya bila langkah berikutnya gagal, Bayar diulang tanpa mencatat dua kali */
    function prosesBayar(bayar, btn) {
        var stokIt = kr.items.filter(function (i) { return i.jenis === 'stok' || i.jenis === 'jasa'; }), svIt = kr.items.filter(function (i) { return i.jenis === 'servis'; });
        var nama = $('#ks-nama').value.trim(), hp = $('#ks-hp').value.trim(), tgl = L.hariIni(), tot = totalKr();
        var struk = { waktu: new Date(), nama: nama, hp: hp, items: kr.items.map(function (i) { return { nama: i.nama, kode: i.kode, qty: i.qty, harga: i.harga }; }), total: tot, metode: bayar.metode, dp: bayar.dp,
            dibayar: bayar.dp ? +bayar.jumlahDp || 0 : tot, diterima: !bayar.dp && bayar.metode === 'tunai' ? bayar.diterima : null, kode: [], nota: [] };
        sibuk(btn, true, 'Saving…'); menyimpan = true;
        var p = Promise.resolve();
        if (stokIt.length) p = p.then(function () {
            var tStok = stokIt.reduce(function (t, i) { return t + i.harga * i.qty; }, 0), dibayar = bayar.dp ? +bayar.jumlahDp || 0 : tStok;
            /* kredit tukar (pembeli menukar unit dalam 1x24 jam): dipotong dulu, sisanya dibayar uang */
            var asalKredit = !bayar.dp && bayar.pakaiKredit ? cariId('jual', bayar.kredit) : null, kreditPakai = asalKredit ? Math.min(tStok, (L.kreditTukar(asalKredit) || { sisa: 0 }).sisa) : 0;
            var bayarBaru = []; if (kreditPakai) bayarBaru.push({ id: idAcak(), tgl: tgl, jumlah: kreditPakai, jenis: 'pelunasan', metode: 'tukar' });
            if (dibayar - kreditPakai > 0) bayarBaru.push({ id: idAcak(), tgl: tgl, jumlah: dibayar - kreditPakai, jenis: bayar.dp ? 'dp' : 'pelunasan', metode: bayar.metode });
            struk.kredit = kreditPakai;
            var rec = { nama: nama, hp: hp, tgl: tgl, catatan: 'Checkout', items: stokIt.map(function (i) { return i.jenis === 'jasa' ? { jenis: 'jasa', kode: '', nama: i.nama, qty: i.qty, harga: i.harga } : { stok_id: i.id, kode: i.kode, nama: i.nama, qty: i.qty, harga: i.harga }; }),
                bayar: bayarBaru };
            if (bayar.dp) rec.batas_lunas = bayar.batas; else rec.status = 'selesai';
            return A.simpanJual(rec).then(function (row) {
                taruh('jual', row); cache.stok = A.daftar('stok'); struk.kode.push(row.kode); struk.jual = row;
                if (L.hp4(row.hp).length === 4) struk.nota.push(L.urlNotaJual(row.kode));
                kr.items = kr.items.filter(function (i) { return i.jenis !== 'stok' && i.jenis !== 'jasa'; });
                if (!kreditPakai) return;
                /* catat pemakaian kredit di transaksi yang ditukar (supaya sisanya benar) */
                var asal = salin(asalKredit); asal.kredit = Object.assign({}, asal.kredit, { dipakai: ((asal.kredit || {}).dipakai || []).concat([{ kode: row.kode, jumlah: kreditPakai, tgl: tgl }]) });
                return A.simpanJual(asal).then(function (r2) { taruh('jual', r2); }).catch(function (e) { toast('The sale was saved, but the credit use was not recorded on ' + asal.kode + ': open that sale and record it manually. ' + (e.message || ''), true); });
            });
        });
        svIt.forEach(function (it) {
            p = p.then(function () {
                var s = salin(cariId('servis', it.id));
                s.bayar = (s.bayar || []).concat([{ id: idAcak(), tgl: tgl, jumlah: it.harga, jenis: 'pelunasan', metode: bayar.metode }]);
                if (it.ambil) s.status = 'diambil';
                return A.simpanServis(s, []).then(function (row) {
                    taruh('servis', row); struk.kode.push(row.kode); struk.nota.push(L.urlNota(row.kode));
                    kr.items = kr.items.filter(function (i) { return !(i.jenis === 'servis' && i.id === it.id); });
                });
            });
        });
        p.then(function () {
            menyimpan = false; kr = { items: [] }; strukAkhir = struk; tutupLembar();
            if ($('#ks-nama')) { $('#ks-nama').value = ''; $('#ks-hp').value = ''; }
            gambarProduk(); gambarKeranjang(); tampilStruk(struk);
        }, function (e) {
            menyimpan = false; sibuk(btn, false); gambarProduk(); gambarKeranjang();
            gagal(e); if (struk.kode.length) toast('Partly saved (' + struk.kode.join(', ') + '). For the rest of the cart, tap pay again.', true);
        });
    }

    /* ---------- struk: layar, printer thermal 58 mm / PDF, dan WhatsApp ---------- */
    var METODE_STRUK = { tunai: 'Cash', transfer: 'Transfer', qris: 'QRIS', tukar: 'Exchange credit' };
    function jamStruk(d) { return L.tgl(L.tglStr(d)) + ' ' + ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2); }
    function htmlStruk(s) {
        var t = C.toko, sisa = s.total - s.dibayar;
        return '<div class="struk"><div class="struk-c"><b>' + E(t.nama.toUpperCase()) + '</b><span>' + E(t.alamat) + '</span><span>WA +' + E(t.wa) + '</span></div>' +
            '<div class="struk-g"></div><div class="struk-r"><span>' + E(s.kode.join(', ')) + '</span><span>' + jamStruk(s.waktu) + '</span></div>' + (s.nama ? '<div class="struk-r"><span>Customer</span><span>' + E(s.nama) + '</span></div>' : '') +
            '<div class="struk-g"></div>' + s.items.map(function (i) { return '<div class="struk-i"><span>' + E(i.nama) + '</span><div class="struk-r"><span>' + i.qty + ' x ' + L.rupiah(i.harga) + '</span><span>' + L.rupiah(i.qty * i.harga) + '</span></div></div>'; }).join('') +
            '<div class="struk-g"></div><div class="struk-r t"><span>TOTAL</span><span>' + L.rupiah(s.total) + '</span></div>' +
            (s.dp ? '<div class="struk-r"><span>Deposit (' + METODE_STRUK[s.metode] + ')</span><span>' + L.rupiah(s.dibayar) + '</span></div><div class="struk-r t"><span>BALANCE</span><span>' + L.rupiah(sisa) + '</span></div>' +
                (s.jual && s.jual.batas_lunas ? '<div class="struk-r"><span>Pay by</span><span>' + L.tgl(s.jual.batas_lunas) + '</span></div>' : '')
                : (s.kredit ? '<div class="struk-r"><span>Exchange credit</span><span>-' + L.rupiah(s.kredit) + '</span></div>' : '') + (s.total - (s.kredit || 0) > 0 ? '<div class="struk-r"><span>Paid (' + METODE_STRUK[s.metode] + ')</span><span>' + L.rupiah(s.diterima != null ? s.diterima : s.total - (s.kredit || 0)) + '</span></div>' + (s.diterima != null ? '<div class="struk-r"><span>Change</span><span>' + L.rupiah(s.diterima - (s.total - (s.kredit || 0))) + '</span></div>' : '') : '')) +
            '<div class="struk-g"></div><div class="struk-c"><span>Thank you for shopping with us!</span>' + (s.nota.length ? '<span>Online receipt: jubeliwatch.github.io (code + last 4 phone digits)</span>' : '') + '<span>jubeliwatch.github.io</span></div></div>';
    }
    function teksStruk(s) {
        var t = 'Hi' + (s.nama ? ' ' + s.nama : '') + ', thank you for shopping at ' + C.toko.nama + ' 🙏\n\nReceipt ' + s.kode.join(', ') + ' · ' + jamStruk(s.waktu) + '\n';
        t += s.items.map(function (i) { return '• ' + i.nama + (i.qty > 1 ? ' ×' + i.qty : '') + ' – ' + L.rupiah(i.harga * i.qty); }).join('\n');
        t += '\n\nTotal: *' + L.rupiah(s.total) + '*\n' + (s.dp ? 'Deposit (' + METODE_STRUK[s.metode].toLowerCase() + '): ' + L.rupiah(s.dibayar) + '\nSisa: *' + L.rupiah(s.total - s.dibayar) + '*' + (s.jual ? ' (pay the balance by ' + L.tgl(s.jual.batas_lunas) + ')' : '') : (s.kredit ? 'Exchange credit: ' + L.rupiah(s.kredit) + '\n' : '') + (s.total - (s.kredit || 0) > 0 ? 'Paid (' + METODE_STRUK[s.metode].toLowerCase() + '): ' + L.rupiah(s.total - (s.kredit || 0)) + ' ✅' : 'Paid ✅'));
        if (s.nota.length) t += '\n\nOnline receipt:\n' + s.nota.join('\n') + '\n(enter the last 4 digits of your phone number)';
        if (s.dp) t += '\n\nDeposit terms (pay-by date, cancellation fee ' + C.jual.potonganPersen + '%) are on the receipt. Please reply *AGREE* if everything is correct.';
        return t;
    }
    function cetakStruk(s) {
        var el = $('#struk-cetak'); if (!el) { el = document.createElement('div'); el.id = 'struk-cetak'; document.body.appendChild(el); }
        el.innerHTML = htmlStruk(s); document.body.classList.add('cetak-struk');
        var lepas = function () { document.body.classList.remove('cetak-struk'); window.removeEventListener('afterprint', lepas); };
        window.addEventListener('afterprint', lepas); window.print();
        if (!window.AyriApp) setTimeout(lepas, 1500); /* di aplikasi Android: dilepas saat cetak selesai (event afterprint) */
    }
    /* struk dari transaksi jual yang sudah tersimpan (cetak ulang / bagikan nota dari tab Jual, termasuk pembeli tanpa nomor WhatsApp) */
    function strukDariJual(j) {
        var h = L.hitungJual(j), bayar = (j.bayar || []).filter(function (b) { return b.jenis !== 'refund' && b.metode !== 'tukar'; }), metode = (bayar.slice(-1)[0] || {}).metode || 'tunai';
        var kredit = (j.bayar || []).filter(function (b) { return b.metode === 'tukar'; }).reduce(function (t, b) { return t + (+b.jumlah || 0); }, 0);
        return { waktu: new Date(j.created_at || j.tgl), nama: j.nama || '', hp: j.hp || '', items: (j.items || []).map(function (i) { return { nama: i.nama, kode: i.kode, qty: i.qty, harga: i.harga }; }),
            total: h.total, metode: metode, dp: j.status === 'dp', dibayar: h.dibayar, kredit: kredit, diterima: null, kode: [j.kode], nota: L.hp4(j.hp).length === 4 ? [L.urlNotaJual(j.kode)] : [], jual: j };
    }
    /* menu bagikan HP yang universal untuk teks (WhatsApp, Instagram, Telegram, SMS, dll): aplikasi 1.4.1+, menu bagikan browser, atau WhatsApp tanpa nomor */
    function bagikanTeks(teks) {
        if (bisaBagikanTeksApp()) kirimKeAplikasi('bagikanTeks', { teks: teks });
        else if (navigator.share) navigator.share({ text: teks }).catch(function (e) { if (!e || e.name !== 'AbortError') bukaWa('', teks); });
        else bukaWa('', teks);
    }
    function tampilStruk(s) {
        var m = $('#ks-modal'); if (!m) return;
        var adaHp = L.hp4(s.hp).length === 4;
        m.innerHTML = '<div class="ly-modal__in ks-m" role="dialog" aria-modal="true" aria-label="Transaksi berhasil">' +
            '<div class="ks-m__ok">' + SVG.ok + '<b>' + (s.dp ? 'Deposit saved!' : 'Sale complete!') + '</b><small>' + E(s.kode.join(', ')) + '</small></div>' + htmlStruk(s) +
            '<div class="ly-btns ks-m__aksi"><button type="button" class="ly-btn" id="st-cetak">Print 58 mm receipt</button>' +
            (bisaCetakBt() ? '<button type="button" class="ly-btn" id="st-printer">Change printer</button>' : '') + '<button type="button" class="ly-btn" id="st-pdf">Save PDF</button>' +
            (adaHp ? '<button type="button" class="ly-btn ly-btn--wa" id="st-wa">Send WhatsApp</button>' : '') +
            '<button type="button" class="ly-btn ly-btn--pri" id="st-baru">New sale</button></div>' +
            (s.dp && s.jual ? '<p class="ly-hint" style="margin:0;text-align:center"><a href="#jual/' + E(s.jual.id) + '">Open the deposit sale</a> for reminders &amp; final payment.</p>' : '') + '</div>';
        m.hidden = false;
        m.onclick = function (e) {
            var b = e.target.closest('button'); if (!b) return;
            if (b.id === 'st-cetak' && bisaCetakBt()) { kirimKeAplikasi('cetakStruk', { baris: L.strukThermal(s) }); toast('Printing…'); }
            else if (b.id === 'st-cetak' || b.id === 'st-pdf') cetakStruk(s);
            else if (b.id === 'st-printer') kirimKeAplikasi('pilihPrinter', {});
            else if (b.id === 'st-wa') bukaWa(s.hp, teksStruk(s));
            else if (b.id === 'st-baru') m.hidden = true;
        };
        m.oninput = m.onchange = null;
    }

    /* ---------- antrian servis: papan kanban per status (tampilan lain dari daftar yang sama) ---------- */
    var tampilSv = (function () { try { return localStorage.getItem('jubeli-admin-tampilan') || 'papan'; } catch (e) { return 'papan'; } })();
    var KOLOM = [['menunggu_dp', 'Awaiting deposit'], ['antri', 'Queued'], ['dikerjakan', 'In progress'], ['selesai', 'Done · ready to collect'], ['diambil', 'Collected']];
    function gambarPapan(rows, c, hari) {
        var batasAmbil = L.tambahHari(hari, -30);
        function cocok(s) { return !c || [s.kode, s.nama, s.hp, s.arloji_jenis, s.arloji_merk, s.keluhan].join(' ').toLowerCase().indexOf(c) > -1; }
        return '<div class="kb">' + KOLOM.map(function (k, ki) {
            var isi = rows.filter(function (s) { return s.status === k[0] && cocok(s) && (k[0] !== 'diambil' || (s.tgl_diambil || s.updated_at || '').slice(0, 10) >= batasAmbil); });
            if (k[0] === 'selesai') isi.sort(function (a, b) { return (a.tgl_selesai || '') < (b.tgl_selesai || '') ? -1 : 1; });
            if (k[0] === 'diambil') isi.sort(function (a, b) { return (a.tgl_diambil || '') < (b.tgl_diambil || '') ? 1 : -1; });
            var lebih = k[0] === 'diambil' && isi.length > 12 ? isi.length - 12 : 0; if (lebih) isi = isi.slice(0, 12);
            return '<div class="kb-kol kb-' + k[0] + '"><div class="kb-head"><b>' + k[1] + '</b><span>' + isi.length + (lebih ? '+' : '') + '</span></div><div class="kb-isi">' + (isi.length ? isi.map(function (s) {
                var h = L.hitung(s, s.items, s.bayar), beres = L.beres(s), telat = s.estimasi && s.estimasi < hari && !beres, part = (s.items || []).filter(function (i) { return i.jenis === 'part'; }).length;
                var bayar = !h.total ? '<small class="ly-warn">No cost entered</small>' : h.lunas ? '<small class="kb-lunas">Paid</small>' : h.kurangAwal && !beres ? '<small class="ly-warn">Deposit short ' + L.rupiah(h.kurangAwal) + '</small>' : '<small>Balance ' + L.rupiah(h.sisa) + '</small>';
                var t = k[0] === 'selesai' && L.titip(s, hari);
                return '<div class="kb-k" data-id="' + E(s.id) + '"><a class="kb-k__a" href="#servis/' + E(s.id) + '">' +
                    '<span class="kb-k__top"><span class="kb-kode">' + E(s.kode) + '</span><span class="kb-jenis">' + E(s.arloji_jenis || 'Watch') + '</span></span>' +
                    '<b class="kb-gitar">' + E(s.arloji_merk || s.arloji_jenis || 'Watch') + '</b><span class="kb-org">' + E(s.nama) + '</span>' +
                    (s.keluhan ? '<p><span>' + E(s.keluhan) + '</span></p>' : '') +
                    '<span class="kb-meta">' + (part ? '<span>' + part + ' part</span>' : '') + (s.estimasi && !beres ? '<span' + (telat ? ' class="ly-telat"' : '') + '>Estimate ' + L.tgl(s.estimasi) + (telat ? ' (overdue)' : '') + '</span>' : '') +
                    (t ? (t.hariBiaya ? '<span class="ly-telat">Stored ' + t.hariBiaya + ' days</span>' : '<span>Free storage until ' + L.tgl(t.batasGratis) + '</span>') : '') + '</span></a>' +
                    '<div class="kb-k__b"><div class="kb-biaya"><small>Cost</small><b>' + L.rupiah(h.total) + '</b>' + bayar + '</div><div class="kb-nav">' +
                    (ki > 0 ? '<button type="button" data-geser="-1" aria-label="Move to ' + E(KOLOM[ki - 1][1]) + '" title="To ' + E(KOLOM[ki - 1][1]) + '">‹</button>' : '') +
                    (ki < KOLOM.length - 1 ? '<button type="button" data-geser="1" aria-label="Move to ' + E(KOLOM[ki + 1][1]) + '" title="To ' + E(KOLOM[ki + 1][1]) + '">›</button>' : '') + '</div></div>' +
                    (k[0] === 'selesai' ? '<div class="kb-k__c">' + (h.sisa ? '<a class="ly-btn ly-btn--sm" href="#kasir" data-kasir="' + E(s.id) + '">Pay at checkout</a>' : '') +
                        '<button type="button" class="ly-btn ly-btn--sm' + (L.perluIngat(s, hari) ? ' ly-btn--wa' : '') + '" data-ingat="' + E(s.id) + '">' + (L.perluIngat(s, hari) ? 'Remind via WhatsApp' : 'Reminder') + '</button>' + tombolPosterServis(s) + '</div>' : tombolPosterServis(s) ? '<div class="kb-k__c">' + tombolPosterServis(s) + '</div>' : '') + '</div>';
            }).join('') : '<p class="kb-kosong">None</p>') + (lebih ? '<p class="kb-kosong">+' + lebih + ' more in List view</p>' : '') + '</div></div>';
        }).join('') + '</div>';
    }
    /* pindah status dari papan: aturan & konfirmasi sama dengan form servis */
    function geserServis(id, arah, kartu) {
        var s = salin(cariId('servis', id)), i = L.URUT_STATUS.indexOf(s.status), st = L.URUT_STATUS[i + arah], h = L.hitung(s, s.items, s.bayar);
        if (!st) return;
        if ((st === 'dikerjakan' || st === 'antri') && arah > 0 && h.kurangAwal > 0 && !confirm('The upfront payment is still short by ' + L.rupiah(h.kurangAwal) + '. Shop rule: work starts after the deposit and parts are paid.\n\nChange the status anyway?')) return;
        if (st === 'diambil' && h.sisa > 0 && !confirm('There is still a balance of ' + L.rupiah(h.sisa) + '. It is best to take payment at Checkout.\n\nMark as collected anyway?')) return;
        if (st === 'menunggu_dp' && h.total > 0 && h.kurangAwal === 0) return toast('The upfront payment is already met, so the status cannot go back to Awaiting deposit.', true);
        s.status = st; if (arah < 0 && st !== 'selesai' && st !== 'diambil') { delete s.tgl_selesai; } if (arah < 0 && st !== 'diambil') delete s.tgl_diambil;
        kartu.classList.add('sibuk'); menyimpan = true;
        A.simpanServis(s, []).then(function (row) {
            menyimpan = false; taruh('servis', row); gambarDaftar();
            toast(st === 'selesai' ? 'Moved to Done. Add after photos and advice, then let the customer know by WhatsApp.' : 'Status: ' + L.STATUS[st].label + '.');
        }).catch(function (e) { menyimpan = false; kartu.classList.remove('sibuk'); gagal(e); });
    }

    /* ================= cadangan (dicatat per perangkat, untuk pengingat) ================= */
    function unduhCadangan(lalu) {
        dialogSandi({ judul: 'Download backup', label: 'Backup password', ulang: true, tombol: 'Download', sibuk: 'Locking the backup…',
            ket: 'The backup contains customer data, so it is locked with a password you choose. Keep this password safe: without it, the backup cannot be opened.' }, function (sandi) {
            return A.cadanganTerenkripsi(sandi).then(function (teks) {
                simpanBerkas('jubeliwatch-backup-' + L.hariIni() + '.ayri.json', teks);
                try { localStorage.setItem('jubeli-cadangan-terakhir', L.hariIni()); } catch (e) {}
                if (lalu) lalu();
            });
        });
    }
    function bukaCadanganUi() {
        var pilih = document.createElement('input'); pilih.type = 'file'; pilih.accept = '.json,application/json';
        pilih.addEventListener('change', function () {
            var file = pilih.files[0]; if (!file) return;
            file.text().then(function (teks) {
                dialogSandi({ judul: 'Open backup', label: 'Backup password', tombol: 'Open', sibuk: 'Opening…',
                    ket: 'The result is a plain .json file with customer data. Keep it somewhere safe and delete it when you no longer need it.' }, function (sandi) {
                    return A.bukaCadangan(teks, sandi).then(function (isi) { simpanBerkas('jubeliwatch-backup-opened-' + L.hariIni() + '.json', isi); toast('Backup opened: a plain .json file was downloaded.'); });
                });
            }).catch(gagal);
        });
        pilih.click();
    }
    function gantiPinUi() {
        dialogSandi({ judul: 'Change PIN', label: 'New PIN', ulang: true, tombol: 'Save PIN', sibuk: 'Saving…',
            ket: 'At least ' + A.PIN_MIN + ' characters, numbers or letters. This PIN only works on this device.' }, function (pin) {
            return A.gantiPin(pin).then(function () { toast('PIN changed.'); });
        });
    }
    function cadanganTerakhir() { try { return localStorage.getItem('jubeli-cadangan-terakhir') || ''; } catch (e) { return ''; } }

    /* ================= kas harian ================= */
    function kasHari(tgl) { return cache.kas.filter(function (k) { return k.tgl === tgl; })[0] || null; }
    /* tunai masuk bersih hari itu dari semua transaksi (penjualan, servis, tebus), tanpa pengeluaran operasional */
    function hitungKas(k, tgl) {
        var masuk = 0; arusKas().forEach(function (x) { if (x.tgl === tgl && (x.metode || 'tunai') === 'tunai' && x.sumber !== 'operasional') masuk += x.jumlah; });
        var keluar = (k && k.pengeluaran || []).filter(function (p) { return (p.metode || 'tunai') === 'tunai'; }).reduce(function (t, p) { return t + (+p.jumlah || 0); }, 0);
        var awal = k ? +k.saldo_awal || 0 : 0;
        return { awal: awal, masuk: masuk, keluar: keluar, harus: awal + masuk - keluar };
    }
    function namaTerakhir() { try { return localStorage.getItem('jubeli-nama-kasir') || ''; } catch (e) { return ''; } }
    function ingatNama(n) { try { localStorage.setItem('jubeli-nama-kasir', n); } catch (e) {} }
    function jamKini() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
    function badgeSelisih(x) { return x === 0 ? '<span class="jm-badge">Exact</span>' : '<span class="jm-badge telat">' + (x < 0 ? 'Short ' : 'Over ') + L.rupiah(Math.abs(x)) + '</span>'; }
    /* kartu kas hari ini: buka / pengeluaran / tutup (dipakai di layar Hari ini) */
    function kartuKas(el, lalu) {
        var h = L.hariIni(), k = kasHari(h), n = hitungKas(k, h), staf = (A.pengaturan().staf || []).filter(function (s) { return s.aktif !== false; });
        var dl = '<datalist id="kas-nama">' + staf.map(function (s) { return '<option value="' + E(s.nama) + '">'; }).join('') + '<option value="Owner"></datalist>';
        if (!k || !k.buka_jam) {
            el.innerHTML = '<div class="kas-head"><h2>Today’s cash</h2><span class="st-chip st-menunggu_dp">Not opened</span></div>' +
                '<p class="ly-muted" style="margin:0">Count the cash in the drawer before serving customers, then open the register.</p>' +
                '<div class="ly-f"><div class="ly-row2"><label>Opening drawer cash (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="kas-awal" value="' + (k && k.saldo_awal || '') + '"></label>' +
                '<label>Opened by<input id="kas-oleh" list="kas-nama" value="' + E(namaTerakhir()) + '"></label></div>' + dl +
                '<button type="button" class="ly-btn ly-btn--pri" id="kas-buka">Open register</button></div>';
        } else if (!k.tutup_jam) {
            el.innerHTML = '<div class="kas-head"><h2>Today’s cash</h2><span class="st-chip st-selesai">Open since ' + E(k.buka_jam) + '</span></div>' +
                '<div class="ly-sum" style="margin:0;padding:0;border:0"><div><span>Opening cash (' + E(k.buka_oleh || '-') + ')</span><span>' + L.rupiah(n.awal) + '</span></div>' +
                '<div><span>Cash in from sales</span><span>' + L.rupiah(n.masuk) + '</span></div><div><span>Cash expenses</span><span class="ly-telat">−' + L.rupiah(n.keluar) + '</span></div>' +
                '<div class="ly-total"><span>Expected in drawer</span><span>' + L.rupiah(n.harus) + '</span></div></div>' +
                (k.pengeluaran.length ? '<div class="kas-keluar">' + k.pengeluaran.map(function (p) { return '<div><span><b>' + E(p.ket) + '</b><small>' + E(p.jam) + ' · ' + E(p.kategori) + ' · ' + E(p.metode === 'transfer' ? 'transfer' : 'tunai') + ' · ' + E(p.oleh || '') + '</small></span><b>−' + L.rupiah(p.jumlah) + '</b></div>'; }).join('') + '</div>' : '') +
                '<details class="kas-form" id="kas-f-keluar"><summary class="ly-btn">+ Record an expense</summary><div class="ly-f">' +
                '<label>What for<input id="kp-ket" placeholder="e.g. watch batteries, fuel, lunch"></label>' +
                '<div class="ly-row2"><label>Amount (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="kp-jml"></label><label>Category<select id="kp-kat">' + opsi(L.KATEGORI_KELUAR, L.KATEGORI_KELUAR[0]) + '</select></label></div>' +
                '<div class="ly-row2"><label>Paid from<select id="kp-metode">' + opsi([['tunai', 'Drawer (cash)'], ['transfer', 'Bank account (transfer)']], 'tunai') + '</select></label><label>Recorded by<input id="kp-oleh" list="kas-nama" value="' + E(namaTerakhir()) + '"></label></div>' + dl +
                '<button type="button" class="ly-btn ly-btn--pri" id="kas-keluar">Save expense</button></div></details>' +
                '<details class="kas-form" id="kas-f-tutup"><summary class="ly-btn">Close register</summary><div class="ly-f">' +
                '<p class="ly-muted" style="margin:0">Count all the cash in the drawer, then enter the amount. Expected: <b>' + L.rupiah(n.harus) + '</b>.</p>' +
                '<div class="ly-row2"><label>Cash in drawer (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="kt-hitung"></label><label>Closed by<input id="kt-oleh" list="kas-nama" value="' + E(namaTerakhir()) + '"></label></div>' +
                '<label>Note (optional)<input id="kt-cat" placeholder="e.g. small change swapped, Rp… deposited to the bank"></label><div id="kt-selisih"></div>' +
                '<button type="button" class="ly-btn ly-btn--pri" id="kas-tutup">Close register</button></div></details>';
        } else {
            var r = k.ringkas || {};
            el.innerHTML = '<div class="kas-head"><h2>Today’s cash</h2><span class="st-chip st-diambil">Closed ' + E(k.tutup_jam) + '</span></div>' +
                '<div class="ly-sum" style="margin:0;padding:0;border:0"><div><span>Expected</span><span>' + L.rupiah(r.harus_ada) + '</span></div><div><span>Counted (' + E(k.tutup_oleh || '-') + ')</span><span>' + L.rupiah(k.uang_laci) + '</span></div>' +
                '<div class="ly-total"><span>Difference</span><span>' + badgeSelisih(r.selisih || 0) + '</span></div></div>' + (k.catatan ? '<p class="ly-hint" style="margin:0">' + E(k.catatan) + '</p>' : '') +
                (owner() ? '<button type="button" class="ly-btn ly-btn--sm" id="kas-bukaulang" style="justify-self:start">Reopen</button>' : '');
        }
        el.oninput = function (e) {
            if (e.target.id !== 'kt-hitung') return;
            var x = Math.round(+e.target.value || 0) - hitungKas(kasHari(h), h).harus; $('#kt-selisih').innerHTML = e.target.value === '' ? '' : '<div class="ly-sum" style="margin:0;padding:0;border:0"><div class="ly-total"><span>Difference</span><span>' + badgeSelisih(x) + '</span></div></div>';
        };
        el.onclick = function (e) {
            var b = e.target.closest('button'); if (!b) return;
            function simpan(fn, pesan) {
                sibuk(b, true, 'Saving…'); menyimpan = true;
                A.ubahKas(h, fn).then(function () { menyimpan = false; cache.kas = A.daftar('kas'); toast(pesan); lalu(); }).catch(function (err) { menyimpan = false; sibuk(b, false); gagal(err); });
            }
            if (b.id === 'kas-buka') {
                var awal = Math.round(+$('#kas-awal').value || 0), oleh = $('#kas-oleh').value.trim();
                if ($('#kas-awal').value === '') return toast('Enter the opening drawer cash (0 is fine).', true);
                if (!oleh) return toast('Enter who is opening the register.', true);
                ingatNama(oleh);
                simpan(function (rec) { if (rec.buka_jam && !rec.tutup_jam) throw new Error('The register was already opened on another device. Reload.'); rec.saldo_awal = awal; rec.buka_jam = jamKini(); rec.buka_oleh = oleh; delete rec.tutup_jam; }, 'Register opened.');
            } else if (b.id === 'kas-keluar') {
                var p = { id: idAcak(), jam: jamKini(), ket: $('#kp-ket').value.trim(), jumlah: Math.round(+$('#kp-jml').value || 0), kategori: $('#kp-kat').value, metode: $('#kp-metode').value, oleh: $('#kp-oleh').value.trim() };
                if (!p.ket) return toast('Enter what the expense was for.', true);
                if (p.jumlah <= 0) return toast('Enter the expense amount.', true);
                if (p.oleh) ingatNama(p.oleh);
                simpan(function (rec) { rec.pengeluaran.push(p); }, 'Expense recorded.');
            } else if (b.id === 'kas-tutup') {
                if ($('#kt-hitung').value === '') return toast('Enter the cash in the drawer.', true);
                var dihitung = Math.round(+$('#kt-hitung').value || 0), ol = $('#kt-oleh').value.trim(), cat = $('#kt-cat').value.trim();
                if (!ol) return toast('Enter who is closing the register.', true);
                ingatNama(ol);
                /* hitungan "seharusnya" memakai transaksi dari SEMUA perangkat: muat data terbaru dulu, dan beri tahu bila angkanya berubah */
                var harusTadi = hitungKas(kasHari(h), h).harus;
                sibuk(b, true, 'Checking the latest transactions…'); menyimpan = true;
                A.muat().then(function (d) {
                    cache = d; menyimpan = false; sibuk(b, false);
                    var harusKini = hitungKas(kasHari(h), h).harus;
                    if (harusKini !== harusTadi && !confirm('There are new sales from another device. The cash expected in the drawer is now ' + L.rupiah(harusKini) + ' (earlier ' + L.rupiah(harusTadi) + ').\n\nClose the register with a count of ' + L.rupiah(dihitung) + ' (difference ' + L.rupiah(dihitung - harusKini) + ')?')) { lalu(); return; }
                    simpan(function (rec) {
                        var nn = hitungKas(rec, h);
                        rec.tutup_jam = jamKini(); rec.tutup_oleh = ol; rec.uang_laci = dihitung; rec.catatan = cat;
                        rec.ringkas = { saldo_awal: nn.awal, tunai_masuk: nn.masuk, pengeluaran_tunai: nn.keluar, harus_ada: nn.harus, selisih: dihitung - nn.harus };
                    }, 'Register closed.');
                }).catch(function (err) { menyimpan = false; sibuk(b, false); gagal(err); });
            } else if (b.id === 'kas-bukaulang') {
                if (!confirm('Reopen today’s register? The previous close-out will be removed.')) return;
                simpan(function (rec) { delete rec.tutup_jam; delete rec.tutup_oleh; delete rec.uang_laci; delete rec.ringkas; }, 'Register reopened.');
            }
        };
    }

    /* ================= layar Hari ini: ringkasan + yang perlu ditindak ================= */
    function halamanHari() {
        var h = L.hariIni(), log = arusKas().filter(function (x) { return x.tgl === h && x.sumber !== 'operasional'; }), d = new Date();
        var masuk = { tunai: 0, transfer: 0, qris: 0 }; log.forEach(function (x) { if (x.jumlah > 0) masuk[x.metode || 'tunai'] = (masuk[x.metode || 'tunai'] || 0) + x.jumlah; });
        var trans = cache.jual.filter(function (j) { return j.tgl === h && j.status !== 'batal'; }).length;
        var svMasuk = cache.servis.filter(function (s) { return s.tgl_masuk === h; }).length, svSelesai = cache.servis.filter(function (s) { return s.tgl_selesai === h; }).length;
        var t = [];
        /* DP barang mendekati / lewat batas pelunasan */
        cache.jual.forEach(function (j) { var i = L.infoJual(j); if (i.sisa != null && i.sisa <= 3) t.push({ g: 'Item deposit', u: i.lewat ? 0 : 1, h: '#jual/' + j.id, t: (j.nama || 'Buyer') + ' · ' + L.namaJual(j), m: 'Balance ' + L.rupiah(L.hitungJual(j).sisa) + ' · due ' + L.tgl(j.batas_lunas) + (i.lewat ? ' (overdue ' + -i.sisa + ' days)' : i.sisa ? ' (' + i.sisa + ' days left)' : ' (today)'), merah: i.lewat }); });
        /* sewa gitar: kembali besok / hari ini / telat */
        cache.sewa.forEach(function (w) { if (L.perluIngatSewa(w, h)) { var i = L.infoSewa(w, h); t.push({ g: 'Watch rental', u: i.lewat ? 0 : 1, h: '#sewa/' + w.id, t: w.nama + ' · ' + w.nama_barang, m: i.lewat ? 'Late ' + i.hariTelat + ' days (due ' + L.tgl(L.batasSewa(w)) + ')' : i.sisa ? 'Due back tomorrow' : 'Due back today', merah: i.lewat }); } });
        /* servis lewat estimasi */
        cache.servis.forEach(function (s) { if (['menunggu_dp', 'antri', 'dikerjakan'].indexOf(s.status) > -1 && s.estimasi && s.estimasi < h) t.push({ g: 'Service past its estimate', u: 1, h: '#servis/' + s.id, t: L.namaGitar(s, 'Watch') + ' · ' + s.nama, m: L.STATUS[s.status].label + ' · estimate ' + L.tgl(s.estimasi), merah: true }); });
        /* gitar selesai belum diambil */
        cache.servis.forEach(function (s) { if (L.perluIngat(s, h)) { var tt = L.titip(s, h); t.push({ g: 'Watch not collected yet', u: 2, h: '#servis/' + s.id, t: L.namaGitar(s, 'Watch') + ' · ' + s.nama, m: 'Done ' + tt.lama + ' days ago' + (tt.hariBiaya ? ' · storage ' + L.rupiah(tt.biaya) : '') + ' · send a WhatsApp reminder' }); } });
        /* kredit tukar belum dipakai (pembeli menukar unit): merah bila sudah lewat 1x24 jam */
        cache.jual.forEach(function (j) { var k = L.kreditTukar(j); if (k && k.sisa > 0) { var lama = L.hariAntara(k.tgl || j.tgl_batal || j.tgl, h); t.push({ g: 'Exchange credit', u: lama > 1 ? 0 : 2, h: '#jual/' + j.id, t: (j.nama || 'Buyer') + ' · remaining ' + L.rupiah(k.sisa), m: L.namaJual(j) + ' · exchanged ' + L.tgl(k.tgl) + (lama > 1 ? ' (over 24 hours)' : ''), merah: lama > 1 }); } });
        /* tindak lanjut pelanggan: terima kasih + minta ulasan, garansi servis hampir habis */
        cache.servis.forEach(function (s) { L.tindakServis(s, h).forEach(function (jn) {
            var g = L.garansiServis(s);
            t.push({ g: 'Contact customer', u: 3, tl: ['servis', s.id, jn], t: (jn === 'garansi' ? 'Warranty ending soon' : 'Thank you') + ' · ' + s.nama, m: L.namaGitar(s, 'Watch') + (jn === 'garansi' ? ' · warranty until ' + L.tgl(g.akhir) : ' · collected ' + L.tgl(s.tgl_diambil)) });
        }); });
        cache.jual.forEach(function (j) { L.tindakJual(j, h).forEach(function (jn) { t.push({ g: 'Contact customer', u: 3, tl: ['jual', j.id, jn], t: 'Thank you · ' + (j.nama || 'Buyer'), m: L.namaJual(j) + ' · done ' + L.tgl(j.tgl_selesai || j.tgl_lunas) }); }); });
        /* tebus jatuh tempo (owner) */
        if (owner()) cache.tebus.forEach(function (tb) { if (L.perluIngatTebus(tb, h)) { var i = L.infoTebus(tb, h); t.push({ g: 'Buyback', u: i.lewat ? 0 : 2, h: '#tebus/' + tb.id, t: L.namaGitar(tb, 'Watch') + ' · ' + tb.nama, m: 'Buyback deadline ' + L.tgl(tb.batas_tebus) + (i.lewat ? ' (overdue)' : ' (' + i.sisa + ' days left)'), merah: i.lewat }); } });
        /* gitar titipan belum terjual lama (owner): tinjau harga dengan pemilik */
        if (owner()) cache.titip.forEach(function (tj) { if (L.perluTinjauTitip(tj, h)) t.push({ g: 'Consignment', u: 2, h: '#titip/' + tj.id, t: L.namaGitar(tj, 'Watch') + ' · ' + tj.nama, m: 'Already ' + L.hariTitip(tj, h) + ' days unsold · review the price with the owner' }); });
        /* karyawan belum absen padahal jadwal masuk sudah lewat */
        var menitKini = d.getHours() * 60 + d.getMinutes(), tol = +A.pengaturan().toleransi || 0;
        (A.pengaturan().staf || []).filter(function (s) { return s.aktif !== false; }).forEach(function (s) {
            var jd = L.jadwalStaf(s, h), m = /^(\d{1,2}):(\d{2})/.exec(jd.masuk), mm = m ? +m[1] * 60 + +m[2] : 0;
            if (menitKini > mm + tol && !cache.absen.some(function (a) { return a.tgl === h && a.staf_id === s.id; })) t.push({ g: 'Not clocked in', u: 3, h: '#jam', t: s.nama, m: 'Scheduled start ' + jd.masuk });
        });
        /* laporan opname menunggu (owner) */
        if (owner()) cache.opname.forEach(function (o) { if (o.status === 'menunggu') t.push({ g: 'Stocktake waiting', u: 2, h: '#opname/' + o.id, t: o.kode + ' by ' + (o.oleh || '-'), m: 'Approve & adjust stock' }); });
        /* aksesoris hampir habis */
        cache.stok.forEach(function (s) { if (s.kategori === 'aksesoris' && s.status !== 'ditarik' && +s.jumlah > 0 && +s.jumlah <= 2) t.push({ g: 'Low stock', u: 4, h: '#stok/' + s.id, t: L.namaStok(s), m: 'Balance ' + s.jumlah }); });
        /* cadangan (owner, per perangkat) */
        var cd = cadanganTerakhir(), lamaCd = cd ? L.hariAntara(cd, h) : null;
        if (owner() && (lamaCd == null || lamaCd >= 7)) t.push({ g: 'Backup', u: 4, cad: true, t: 'Download a data backup', m: cd ? 'Last ' + L.tgl(cd) + ' (' + lamaCd + ' days ago)' : 'Never from this device' });
        t.sort(function (a, b) { return a.u - b.u; });
        var grup = {}; t.forEach(function (x) { (grup[x.g] = grup[x.g] || []).push(x); });
        var jamH = d.getHours(), sapa = jamH < 11 ? 'Good morning' : jamH < 15 ? 'Good afternoon' : jamH < 18 ? 'Good afternoon' : 'Good evening';
        app.innerHTML = '<section class="hr"><div class="ly-head"><div style="flex:1"><h1>Today</h1><p class="ly-muted" style="margin:2px 0 0">' + sapa + ' · ' + L.tglPanjang(h) + '</p></div><a class="ly-btn ly-btn--pri" href="#kasir">Open checkout</a></div>' +
            '<div class="hr-grid"><div class="hr-kiri"><div class="ly-card ly-f kas" id="kas"></div>' +
            '<div class="ly-card"><h2 class="hr-h2">Summary</h2><div class="op-kartu hr-ring">' +
            '<div><small>Cash in</small><b>' + L.rupiah(masuk.tunai || 0) + '</b></div><div><small>Transfers in</small><b>' + L.rupiah((masuk.transfer || 0) + (masuk.qris || 0)) + '</b></div>' +
            '<div><small>Item sales</small><b>' + trans + '</b></div><div><small>Service in · done</small><b>' + svMasuk + ' · ' + svSelesai + '</b></div></div>' +
            '<a class="ly-btn ly-btn--sm" href="#kas" style="justify-self:start;margin-top:10px">Cash &amp; expense history</a></div></div>' +
            '<div class="ly-card hr-tindak"><h2 class="hr-h2">Needs action <span>' + t.length + '</span></h2>' +
            (t.length ? Object.keys(grup).map(function (k) {
                return '<div class="hr-grup"><h3>' + E(k) + '</h3>' + grup[k].map(function (x) {
                    return x.tl ? '<button type="button" class="hr-it" data-tl="' + E(x.tl.join('|')) + '"><span><b>' + E(x.t) + '</b><small>' + E(x.m) + '</small></span><i>Send WhatsApp ›</i></button>'
                        : x.cad ? '<button type="button" class="hr-it" id="hr-cadang"><span><b>' + E(x.t) + '</b><small>' + E(x.m) + '</small></span><i>Download ›</i></button>'
                        : '<a class="hr-it' + (x.merah ? ' merah' : '') + '" href="' + E(x.h) + '"><span><b>' + E(x.t) + '</b><small>' + E(x.m) + '</small></span><i>›</i></a>';
                }).join('') + '</div>';
            }).join('') : '<div class="ks-kosong" style="border-style:solid"><b>All clear 👍</b><span>No deposits due, late service jobs, watches that need a reminder, or customers to contact.</span></div>') + '</div></div></section>';
        kartuKas($('#kas'), halamanHari);
        $$('[data-tl]', app).forEach(function (b) { b.addEventListener('click', function () { var p = this.dataset.tl.split('|'); catatTindak(p[0], p[1], p[2], this); }); });
        if ($('#hr-cadang')) $('#hr-cadang').addEventListener('click', function () { unduhCadangan(function () { toast('Backup downloaded. Save a copy to Google Drive too.'); halamanHari(); }); });
    }

    /* ================= riwayat kas & pengeluaran ================= */
    var bulanKas = '';
    function halamanKas() {
        if (!bulanKas) bulanKas = L.hariIni().slice(0, 7);
        var list = cache.kas.filter(function (k) { return String(k.tgl).slice(0, 7) === bulanKas; }), kat = {}, totKeluar = 0, totSelisih = 0;
        list.forEach(function (k) { (k.pengeluaran || []).forEach(function (p) { kat[p.kategori] = (kat[p.kategori] || 0) + (+p.jumlah || 0); totKeluar += +p.jumlah || 0; }); if (k.ringkas) totSelisih += k.ringkas.selisih || 0; });
        app.innerHTML = '<section class="hr"><div class="ly-head"><a class="ly-back" href="#hari">‹ Today</a></div><div class="ly-head"><h1 style="flex:1">Cash &amp; expenses</h1><input type="month" class="ly-in rk-bln" id="kas-bln" value="' + bulanKas + '"></div>' +
            '<div class="op-kartu"><div><small>Days the register was open</small><b>' + list.filter(function (k) { return k.buka_jam; }).length + '</b></div><div><small>Total expenses</small><b class="ly-telat">' + L.rupiah(totKeluar) + '</b></div>' +
            '<div><small>Total drawer difference</small><b>' + (totSelisih ? (totSelisih < 0 ? '−' : '+') + L.rupiah(Math.abs(totSelisih)) : 'Rp0') + '</b></div></div>' +
            (Object.keys(kat).length ? '<div class="ly-card"><h2 class="hr-h2">Expenses by category</h2>' + batang(Object.keys(kat).sort(function (a, b) { return kat[b] - kat[a]; }).map(function (k) { return [k, kat[k], '#B42318']; })) + '</div>' : '') +
            '<div class="ly-card tb-wrap"><table class="ly-tabel"><thead><tr><th>Date</th><th>Opened</th><th class="r">Opening cash</th><th class="r">Cash in</th><th class="r">Expenses</th><th class="r">Expected</th><th class="r">Counted</th><th>Difference</th></tr></thead><tbody>' +
            (list.length ? list.map(function (k) {
                var n = k.ringkas || (function () { var x = hitungKas(k, k.tgl); return { saldo_awal: x.awal, tunai_masuk: x.masuk, pengeluaran_tunai: x.keluar, harus_ada: x.harus }; })();
                return '<tr><td>' + L.tgl(k.tgl) + '</td><td>' + E(k.buka_jam || '–') + (k.buka_oleh ? '<small style="color:var(--ink-3);font-family:inherit">' + E(k.buka_oleh) + '</small>' : '') + '</td><td class="r">' + L.rupiah(n.saldo_awal) + '</td><td class="r">' + L.rupiah(n.tunai_masuk) + '</td><td class="r">' + L.rupiah(n.pengeluaran_tunai) + '</td><td class="r">' + L.rupiah(n.harus_ada) + '</td>' +
                    '<td class="r">' + (k.tutup_jam ? L.rupiah(k.uang_laci) : '<span class="ly-muted">not closed</span>') + '</td><td>' + (k.ringkas ? badgeSelisih(k.ringkas.selisih) : '') + '</td></tr>' +
                    ((k.pengeluaran || []).length ? '<tr class="kas-detail"><td colspan="8">' + k.pengeluaran.map(function (p) { return '<span>' + E(p.jam) + ' · ' + E(p.ket) + ' (' + E(p.kategori) + (p.metode === 'transfer' ? ', transfer' : '') + ') <b>−' + L.rupiah(p.jumlah) + '</b></span>'; }).join('') + '</td></tr>' : '');
            }).join('') : '<tr><td colspan="8" class="ly-muted">No cash records this month yet.</td></tr>') + '</tbody></table></div></section>';
        $('#kas-bln').addEventListener('change', function () { if (this.value) { bulanKas = this.value; halamanKas(); } });
    }

    /* ================= jam masuk karyawan ================= */
    var detikJam = 0, stafPilih = '';
    function jamSekarang() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
    function stafAktif() { return (A.pengaturan().staf || []).filter(function (s) { return s.aktif !== false; }); }
    function absenHariIni(id) { var h = L.hariIni(); return cache.absen.filter(function (a) { return a.tgl === h && a.staf_id === id; })[0]; }
    function halamanJam() {
        var atur = A.pengaturan(), staf = stafAktif(), tol = +atur.toleransi || 0;
        if (staf.length && !staf.some(function (s) { return s.id === stafPilih; })) stafPilih = staf[0].id;
        app.innerHTML = '<section class="jm"><div class="ly-head"><h1>Clock-in</h1>' + (owner() ? '<a class="ly-btn" href="#jam/atur">Staff &amp; shifts</a>' : '') + '</div>' +
            (staf.length ? '<div class="jm-grid"><div class="ly-card jm-jam"><div class="jm-tgl">' + L.tglPanjang(L.hariIni()) + '</div><div class="jm-waktu" id="jm-waktu"></div>' +
                '<div class="ly-filter jm-staf" id="jm-staf">' + staf.map(function (s) { return '<button type="button" data-staf="' + E(s.id) + '" aria-pressed="' + (s.id === stafPilih) + '">' + E(s.nama) + '</button>'; }).join('') + '</div>' +
                '<div id="jm-aksi"></div></div>' +
                '<div class="ly-card jm-hari"><h2>In today</h2><div id="jm-hadir"></div></div></div>' +
                '<div class="ly-card"><div class="ly-head" style="margin-bottom:10px"><h2 style="flex:1;margin:0;font:700 1.0625rem var(--font-display)">Riwayat</h2><input type="month" class="ly-in jm-bln" id="jm-bln"></div><div id="jm-rekap"></div><div class="tb-wrap"><table class="ly-tabel" id="jm-tabel"></table></div></div>'
                : '<div class="ly-card"><p class="ly-muted" style="margin:0">No staff yet. ' + (owner() ? 'Add them under <a href="#jam/atur">Staff &amp; shifts</a>.' : 'Ask the owner to add your name in the Clock-in menu.') + '</p></div>') + '</section>';
        if (!staf.length) return;
        $('#jm-bln').value = L.hariIni().slice(0, 7);
        function detik() { var el = $('#jm-waktu'); if (!el) { clearInterval(detikJam); return; } var d = new Date(); el.textContent = ('0' + d.getHours()).slice(-2) + '.' + ('0' + d.getMinutes()).slice(-2) + '.' + ('0' + d.getSeconds()).slice(-2); }
        clearInterval(detikJam); detikJam = setInterval(detik, 1000); detik();
        function gambarAksi() {
            var s = staf.filter(function (x) { return x.id === stafPilih; })[0], a = absenHariIni(stafPilih), jd = L.jadwalStaf(s, L.hariIni());
            $$('#jm-staf button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.staf === stafPilih); });
            var st = a ? L.statusAbsen(a, tol) : null;
            $('#jm-aksi').innerHTML = '<div class="jm-info"><div><span>Schedule</span><b>' + E(jd.masuk) + ' – ' + E(jd.pulang) + '</b></div>' +
                '<div><span>In</span><b>' + (a ? E(a.masuk) : '–') + '</b></div><div><span>Out</span><b>' + (a && a.keluar ? E(a.keluar) : '–') + '</b></div>' +
                (st ? '<div><span>Status</span><b class="' + (st.telat ? 'ly-telat' : 'jm-ok') + '">' + st.label + '</b></div>' : '') + '</div>' +
                (!a || !a.keluar ? '<input class="ly-in" id="jm-cat" placeholder="Note (optional), e.g. traffic, leaving early">' : '') +
                (!a ? '<button type="button" class="ly-btn ly-btn--pri jm-btn" id="jm-masuk">Clock in now</button>'
                    : !a.keluar ? '<button type="button" class="ly-btn jm-btn jm-keluar" id="jm-keluar">Clock out</button>'
                        : '<p class="ly-muted" style="margin:0;text-align:center">Clocked in and out for today. Thank you!</p>');
        }
        function gambarHadir() {
            var h = L.hariIni(), list = cache.absen.filter(function (a) { return a.tgl === h; });
            $('#jm-hadir').innerHTML = list.length ? list.map(function (a) {
                var st = L.statusAbsen(a, tol);
                return '<div class="jm-row"><div><b>' + E(a.nama) + '</b><small>In ' + E(a.masuk) + (a.keluar ? ' · out ' + E(a.keluar) : ' · on shift') + (a.catatan ? ' · “' + E(a.catatan) + '”' : '') + '</small></div><span class="jm-badge' + (st.telat ? ' telat' : '') + '">' + (st.telat ? 'Late ' + a.telat + 'm' : 'On time') + '</span></div>';
            }).join('') : '<p class="ly-muted" style="margin:0">Nobody has clocked in today.</p>';
        }
        function gambarRiwayat() {
            var bln = $('#jm-bln').value, list = cache.absen.filter(function (a) { return String(a.tgl).slice(0, 7) === bln; }).sort(function (a, b) { return a.tgl < b.tgl ? 1 : a.tgl > b.tgl ? -1 : (a.masuk < b.masuk ? 1 : -1); });
            var per = {};
            list.forEach(function (a) { var p = per[a.staf_id] = per[a.staf_id] || { nama: a.nama, hadir: 0, telat: 0, menit: 0 }; p.hadir++; if (L.statusAbsen(a, tol).telat) { p.telat++; p.menit += a.telat; } });
            $('#jm-rekap').innerHTML = Object.keys(per).length ? '<div class="jm-sum">' + Object.keys(per).map(function (k) { var p = per[k]; return '<div><b>' + E(p.nama) + '</b><span>' + p.hadir + ' days present · ' + p.telat + '× late' + (p.menit ? ' (' + p.menit + ' min)' : '') + '</span></div>'; }).join('') + '</div>' : '';
            $('#jm-tabel').innerHTML = '<thead><tr><th>Date</th><th>Name</th><th>Schedule</th><th>In</th><th>Out</th><th>Status</th><th>Note</th></tr></thead><tbody>' + (list.length ? list.map(function (a) {
                var st = L.statusAbsen(a, tol);
                return '<tr><td>' + L.tgl(a.tgl) + '</td><td>' + E(a.nama) + '</td><td>' + E(a.jadwal_masuk || '') + '</td><td>' + E(a.masuk) + '</td><td>' + E(a.keluar || '–') + '</td><td><span class="jm-badge' + (st.telat ? ' telat' : '') + '">' + st.label + '</span></td><td>' + E(a.catatan || '') + '</td></tr>';
            }).join('') : '<tr><td colspan="7" class="ly-muted">No records this month yet.</td></tr>') + '</tbody>';
        }
        gambarAksi(); gambarHadir(); gambarRiwayat();
        $('#jm-bln').addEventListener('change', gambarRiwayat);
        $('#jm-staf').addEventListener('click', function (e) { var b = e.target.closest('[data-staf]'); if (b) { stafPilih = b.dataset.staf; gambarAksi(); } });
        $('#jm-aksi').addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return;
            var s = staf.filter(function (x) { return x.id === stafPilih; })[0], a = absenHariIni(stafPilih), jam = jamSekarang(), cat = ($('#jm-cat') || {}).value || '';
            var rec;
            if (b.id === 'jm-masuk') {
                var jd = L.jadwalStaf(s, L.hariIni());
                if (!confirm(s.nama + ' clocked in at ' + jam + '?')) return;
                rec = { tgl: L.hariIni(), staf_id: s.id, nama: s.nama, jadwal_masuk: jd.masuk, jadwal_pulang: jd.pulang, masuk: jam, keluar: null, telat: L.telatMenit(jam, jd.masuk), catatan: cat.trim() };
            } else if (b.id === 'jm-keluar') {
                if (!confirm(s.nama + ' clocked out at ' + jam + '?')) return;
                rec = Object.assign(salin(a), { keluar: jam, catatan: [a.catatan, cat.trim()].filter(Boolean).join(' · ') });
            } else return;
            sibuk(b, true, 'Saving…'); menyimpan = true;
            A.simpanAbsen(rec).then(function (row) {
                menyimpan = false; cache.absen = A.daftar('absen');
                var st = L.statusAbsen(row, tol);
                toast(b.id === 'jm-masuk' ? 'Clocked in ' + row.masuk + ' · ' + st.label + '.' : 'Clocked out ' + row.keluar + '.');
                gambarAksi(); gambarHadir(); gambarRiwayat();
            }).catch(function (err) { menyimpan = false; sibuk(b, false); gagal(err); });
        });
    }
    /* owner: daftar karyawan, jam shift, toleransi */
    function aturKaryawan() {
        var atur = A.pengaturan(); atur.staf = atur.staf || []; if (atur.toleransi == null) atur.toleransi = 5;
        function baris(s, i) {
            return '<div class="jm-it"><div class="ly-row2"><label>Name<input data-i="' + i + '" data-k="nama" value="' + E(s.nama) + '"></label><label class="ly-cek" style="align-self:end"><input type="checkbox" data-i="' + i + '" data-k="aktif"' + (s.aktif !== false ? ' checked' : '') + '><span>Active</span></label></div>' +
                '<div class="ly-row3"><label>Start time<input type="time" data-i="' + i + '" data-k="masuk" value="' + E(s.masuk || '12:00') + '"></label><label>End time<input type="time" data-i="' + i + '" data-k="pulang" value="' + E(s.pulang || '19:00') + '"></label>' +
                '<label>Friday start<input type="time" data-i="' + i + '" data-k="masuk_jumat" value="' + E(s.masuk_jumat || '') + '"></label></div>' +
                '<button type="button" class="ly-btn ly-btn--sm ly-btn--del" data-hapus="' + i + '">Remove from list</button></div>';
        }
        function gambar() {
            app.innerHTML = '<section id="ak" class="ly-f"><div class="ly-head"><a class="ly-back" href="#jam">‹ Clock-in</a></div><div class="ly-head"><h1>Staff &amp; shifts</h1></div>' +
                '<fieldset class="ly-card ly-f"><legend>Rules</legend><label>Late tolerance (minutes)<input type="number" min="0" max="120" id="ak-tol" value="' + (+atur.toleransi || 0) + '"></label>' +
                '<p class="ly-hint" style="margin:0">Clock-in times are compared with each person’s schedule; past the tolerance counts as Late. Leave "Friday start" empty if it is the same as other days.</p></fieldset>' +
                '<fieldset class="ly-card ly-f"><legend>Staff</legend><button type="button" class="ly-btn ly-btn--pri" id="ak-tambah" style="justify-self:start">+ Add staff</button>' +
                '<div class="ly-f" id="ak-list">' + (atur.staf.length ? atur.staf.map(baris).join('') : '<p class="ly-muted" style="margin:0">No staff yet.</p>') + '</div></fieldset>' +
                '<div class="ly-save"><span class="ly-dirty" id="dirty" hidden>Not saved</span><button type="button" class="ly-btn ly-btn--pri" id="ak-simpan">Save</button></div></section>';
        }
        gambar(); setDirty(false);
        app.oninput = app.onchange = function (e) {
            var t = e.target; if (!t.dataset || t.dataset.i == null) { if (t.id === 'ak-tol') { atur.toleransi = Math.max(0, Math.round(+t.value || 0)); setDirty(true); } return; }
            var s = atur.staf[+t.dataset.i]; s[t.dataset.k] = t.type === 'checkbox' ? t.checked : t.value; setDirty(true);
        };
        app.onclick = function (e) {
            var b = e.target.closest('button'); if (!b) return;
            if (b.id === 'ak-tambah') {
                atur.staf.push({ id: idAcak(), nama: '', masuk: '12:00', pulang: '19:00', masuk_jumat: '13:00', aktif: true }); gambar(); setDirty(true);
                var baru = $('[data-i="' + (atur.staf.length - 1) + '"][data-k="nama"]'); if (baru) { baru.scrollIntoView({ block: 'center', behavior: 'smooth' }); baru.focus({ preventScroll: true }); }
            }
            else if (b.dataset.hapus != null) { var s = atur.staf[+b.dataset.hapus]; if (confirm('Delete ' + (s.nama || 'this staff member') + ' from the list? Their attendance history is kept.')) { atur.staf.splice(+b.dataset.hapus, 1); gambar(); setDirty(true); } }
            else if (b.id === 'ak-simpan') {
                atur.staf = atur.staf.map(function (s) { return Object.assign(s, { nama: String(s.nama || '').trim() }); });
                if (atur.staf.some(function (s) { return !s.nama; })) return toast('A staff member has no name.', true);
                sibuk(b, true); menyimpan = true;
                A.simpanPengaturan(atur).then(function () { menyimpan = false; setDirty(false); toast('Saved.'); pindah('#jam'); }).catch(function (err) { menyimpan = false; sibuk(b, false); gagal(err); });
            }
        };
    }

    /* ================= stock opname ================= */
    var opDraf = null, opCari = '', opTab = 'hitung';
    function barangOpname() { return cache.stok.filter(function (s) { return s.status !== 'ditarik' && !(s.status === 'terjual' && !(+s.jumlah > 0)); }); }
    function ringkasOpname(items) {
        var r = { n: items.length, pas: 0, minus: 0, plus: 0, nilai: 0, tanpaModal: 0 };
        items.forEach(function (it) {
            var d = it.fisik - it.sistem; if (!d) { r.pas++; return; }
            if (d < 0) r.minus += -d; else r.plus += d;
            var s = cariId('stok', it.stok_id), m = s && +s.harga_beli; if (m) r.nilai += d * m; else r.tanpaModal++;
        });
        return r;
    }
    function kartuRingkas(r) {
        return '<div class="op-kartu"><div><small>Items checked</small><b>' + r.n + '</b></div><div><small>Matching</small><b class="jm-ok">' + r.pas + '</b></div>' +
            '<div><small>Unit difference</small><b' + (r.minus || r.plus ? ' class="ly-warn"' : '') + '>' + (r.plus - r.minus) + '</b><small>−' + r.minus + ' / +' + r.plus + '</small></div>' +
            (owner() ? '<div><small>Difference value (cost)</small><b' + (r.nilai < 0 ? ' class="ly-telat"' : '') + '>' + L.rupiah(r.nilai) + '</b>' + (r.tanpaModal ? '<small>' + r.tanpaModal + ' item(s) without a cost price</small>' : '') + '</div>' : '') + '</div>';
    }
    function opname(id) {
        var pending = cache.opname.filter(function (o) { return o.status === 'menunggu'; }).length;
        if (id) return lihatOpname(id);
        if (!opDraf) opDraf = { oleh: '', items: barangOpname().map(function (s) { return { stok_id: s.id, kode: s.kode, nama: namaBarang(s), sistem: +s.jumlah || 0, fisik: +s.jumlah || 0, catatan: '' }; }) };
        app.innerHTML = '<section class="op"><div class="ly-head"><h1>Stocktake</h1><div class="ly-seg" id="op-tab"><button type="button" data-t="hitung" aria-pressed="' + (opTab === 'hitung') + '">Physical count</button><button type="button" data-t="riwayat" aria-pressed="' + (opTab === 'riwayat') + '">Riwayat (' + cache.opname.length + ')</button></div></div>' +
            (pending && owner() ? '<div class="ly-ingat"><span>📋 <b>' + pending + ' report(s)</b> from staff waiting for approval.</span><button type="button" class="ly-btn ly-btn--sm" data-t="riwayat">View</button></div>' : '') +
            '<div id="op-isi"></div></section>';
        $('.op').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (b) { opTab = b.dataset.t; opname(); } });
        if (opTab === 'riwayat') return riwayatOpname();
        var el = $('#op-isi');
        el.innerHTML = '<div id="op-ring"></div><div class="ly-card ly-f"><div class="ly-row2"><input class="ly-in" type="search" id="op-cari" placeholder="Search code / item name…"><input class="ly-in" id="op-oleh" placeholder="Counted by (name)"></div>' +
            '<p class="ly-hint" style="margin:0">Fill in the <b>Counted</b> column from the shelves or storeroom. It starts with the system quantity, so only change what differs.</p></div>' +
            '<div class="ly-card tb-wrap"><table class="ly-tabel op-tabel" id="op-tabel"></table></div>' +
            '<div class="ly-save"><button type="button" class="ly-btn" id="op-ulang">Start over</button><button type="button" class="ly-btn ly-btn--pri" id="op-simpan">' + (owner() ? 'Save &amp; adjust stock' : 'Send report to the owner') + '</button></div>';
        $('#op-cari').value = opCari; $('#op-oleh').value = opDraf.oleh;
        function gambar() {
            var c = opCari.trim().toLowerCase();
            $('#op-ring').innerHTML = kartuRingkas(ringkasOpname(opDraf.items));
            $('#op-tabel').innerHTML = '<thead><tr><th>Item</th><th class="r">System</th><th class="r">Counted</th><th class="r">Difference</th><th>Note</th></tr></thead><tbody>' + opDraf.items.map(function (it, i) {
                if (c && (it.kode + ' ' + it.nama).toLowerCase().indexOf(c) < 0) return '';
                var d = it.fisik - it.sistem;
                return '<tr' + (d ? ' class="beda"' : '') + '><td><b>' + E(it.nama) + '</b><small>' + E(it.kode) + '</small></td><td class="r">' + it.sistem + '</td>' +
                    '<td class="r"><input type="number" inputmode="numeric" min="0" data-fisik="' + i + '" value="' + it.fisik + '" aria-label="Counted quantity ' + E(it.nama) + '"></td>' +
                    '<td class="r"><span class="op-d' + (d < 0 ? ' minus' : d > 0 ? ' plus' : '') + '">' + (d ? (d > 0 ? '+' : '') + d : '✓ exact') + '</span></td>' +
                    '<td><input data-cat="' + i + '" value="' + E(it.catatan) + '" placeholder="' + (d ? 'Reason for difference' : '') + '"></td></tr>';
            }).join('') + '</tbody>';
        }
        gambar();
        $('#op-cari').addEventListener('input', function () { opCari = this.value; gambar(); });
        $('#op-oleh').addEventListener('input', function () { opDraf.oleh = this.value; });
        $('#op-tabel').addEventListener('change', function (e) {
            var t = e.target;
            if (t.dataset.fisik != null) { opDraf.items[+t.dataset.fisik].fisik = Math.max(0, Math.round(+t.value || 0)); gambar(); }
            if (t.dataset.cat != null) opDraf.items[+t.dataset.cat].catatan = t.value;
        });
        $('#op-ulang').addEventListener('click', function () { if (confirm('Discard this count and start from the system quantities?')) { opDraf = null; opname(); } });
        $('#op-simpan').addEventListener('click', function () {
            var r = ringkasOpname(opDraf.items), b = this;
            if (!opDraf.oleh.trim()) return toast('Enter who did the count.', true);
            var tanpaAlasan = opDraf.items.filter(function (it) { return it.fisik !== it.sistem && !String(it.catatan).trim(); }).length;
            if (tanpaAlasan && !confirm(tanpaAlasan + ' item(s) differ without a reason. Save anyway?')) return;
            if (owner() && (r.minus || r.plus) && !confirm('Stock for ' + (r.n - r.pas) + ' item(s) will be adjusted to the physical count. Continue?')) return;
            sibuk(b, true, 'Saving…'); menyimpan = true;
            var rec = { oleh: opDraf.oleh.trim(), peran: A.peran(), items: opDraf.items };
            A.simpanOpname(rec, owner()).then(function (row) {
                menyimpan = false; cache.opname = A.daftar('opname'); cache.stok = A.daftar('stok'); opDraf = null; opTab = 'riwayat';
                toast(owner() ? 'Stocktake ' + row.kode + ' saved, stock adjusted.' : 'Report ' + row.kode + ' sent. The owner will adjust the stock.');
                pindah('#opname/' + row.id);
            }).catch(function (err) { menyimpan = false; sibuk(b, false); gagal(err); });
        });
    }
    function riwayatOpname() {
        $('#op-isi').innerHTML = '<div class="ly-list">' + (cache.opname.length ? cache.opname.map(function (o) {
            var r = ringkasOpname(o.items || []);
            return '<a class="ly-item" href="#opname/' + E(o.id) + '"><span class="ly-item__k">' + E(o.kode) + '</span><span class="st-chip ' + (o.status === 'menunggu' ? 'st-menunggu_dp' : 'st-selesai') + '">' + (o.status === 'menunggu' ? 'Waiting for the owner' : 'Adjusted') + '</span>' +
                '<span class="ly-item__t">' + L.tgl(o.tgl) + ' · by ' + E(o.oleh || '-') + '</span><span class="ly-item__m"><span>' + r.n + ' item(s)</span><span>' + r.pas + ' match</span><span>Different ' + (r.plus - r.minus) + ' unit (−' + r.minus + ' / +' + r.plus + ')</span>' + (owner() ? '<span>Value ' + L.rupiah(r.nilai) + '</span>' : '') + '</span></a>';
        }).join('') : '<p class="ly-kosong">No stocktake reports yet.</p>') + '</div>';
    }
    function lihatOpname(id) {
        var o = cariId('opname', id);
        if (!o) { app.innerHTML = '<p class="ly-kosong">Report not found. <a href="#opname">Back</a></p>'; return; }
        var beda = o.items.filter(function (it) { return it.fisik !== it.sistem; });
        app.innerHTML = '<section class="op"><div class="ly-head"><a class="ly-back" href="#opname">‹ Stocktake</a></div><div class="ly-head"><h1>' + E(o.kode) + '</h1><span class="st-chip ' + (o.status === 'menunggu' ? 'st-menunggu_dp' : 'st-selesai') + '">' + (o.status === 'menunggu' ? 'Waiting for the owner' : 'Adjusted ' + L.tgl(o.tgl_sesuai)) + '</span></div>' +
            '<p class="ly-muted" style="margin:0">Counted ' + L.tgl(o.tgl) + ' by ' + E(o.oleh || '-') + ' (' + E(o.peran === 'karyawan' ? 'karyawan' : 'owner') + ').</p>' + kartuRingkas(ringkasOpname(o.items)) +
            '<div class="ly-card tb-wrap"><h2 style="margin:0 0 10px;font:700 1.0625rem var(--font-display)">Items with differences (' + beda.length + ')</h2><table class="ly-tabel op-tabel"><thead><tr><th>Item</th><th class="r">System</th><th class="r">Counted</th><th class="r">Difference</th>' + (owner() ? '<th class="r">Value</th>' : '') + '<th>Note</th></tr></thead><tbody>' +
            (beda.length ? beda.map(function (it) { var d = it.fisik - it.sistem, s = cariId('stok', it.stok_id), m = s && +s.harga_beli;
                return '<tr class="beda"><td><b>' + E(it.nama) + '</b><small>' + E(it.kode) + '</small></td><td class="r">' + it.sistem + '</td><td class="r">' + it.fisik + '</td><td class="r"><span class="op-d ' + (d < 0 ? 'minus' : 'plus') + '">' + (d > 0 ? '+' : '') + d + '</span></td>' + (owner() ? '<td class="r">' + (m ? L.rupiah(d * m) : '–') + '</td>' : '') + '<td>' + E(it.catatan || '') + '</td></tr>'; }).join('')
                : '<tr><td colspan="6" class="ly-muted">Every item matches the system. 👍</td></tr>') + '</tbody></table></div>' +
            (o.status === 'menunggu' && owner() ? '<div class="ly-save"><button type="button" class="ly-btn ly-btn--pri" id="op-setuju">Approve &amp; adjust stock</button></div>' : '') + '</section>';
        if ($('#op-setuju')) $('#op-setuju').addEventListener('click', function () {
            var b = this; if (!confirm('Adjust stock for ' + beda.length + ' item(s) to match this report? Sales since the count day are still taken into account.')) return;
            sibuk(b, true, 'Adjusting…'); menyimpan = true;
            A.simpanOpname(o, true).then(function () { menyimpan = false; cache.opname = A.daftar('opname'); cache.stok = A.daftar('stok'); toast('Stock adjusted.'); lihatOpname(id); })
                .catch(function (err) { menyimpan = false; sibuk(b, false); gagal(err); });
        });
    }

    /* ================= rekap bulanan (khusus owner) ================= */
    var bulanRk = '';
    function bulanLalu(b) { var d = new Date(+b.slice(0, 4), +b.slice(5, 7) - 2, 1); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
    /* semua uang masuk/keluar menurut tanggal pembayaran */
    function arusKas() {
        var log = [];
        cache.servis.forEach(function (s) { (s.bayar || []).forEach(function (b) { log.push({ tgl: b.tgl, jumlah: +b.jumlah || 0, metode: b.metode, sumber: 'servis', kode: s.kode, nama: s.nama, ket: ({ dp: 'Service deposit', tambahan: 'Service payment', pelunasan: 'Service final payment' })[b.jenis] || 'Service payment' }); }); });
        cache.jual.forEach(function (j) { (j.bayar || []).forEach(function (b) { if (b.metode === 'tukar') return; /* kredit tukar: uangnya sudah tercatat di transaksi yang ditukar */ var r = b.jenis === 'refund'; log.push({ tgl: b.tgl, jumlah: (r ? -1 : 1) * (+b.jumlah || 0), metode: b.metode, sumber: 'barang', kode: j.kode, nama: j.nama || 'Walk-in customer', ket: r ? 'Refund (cancelled)' : ({ dp: 'Item deposit', tambahan: 'Item payment', pelunasan: j.status === 'dp' ? 'Item payment' : 'Item sale' })[b.jenis] || 'Item sale' }); }); });
        cache.sewa.forEach(function (w) {
            var depMetode = (w.bayar || []).filter(function (b) { return b.jenis === 'deposit'; }).map(function (b) { return b.metode; })[0] || 'tunai';
            (w.bayar || []).forEach(function (b) {
                var j = +b.jumlah || 0, dasar = { tgl: b.tgl, metode: b.metode, kode: w.kode, nama: w.nama };
                if (b.jenis === 'deposit') log.push(Object.assign({ jumlah: j, sumber: 'deposit', ket: 'Watch rental deposit (held)' }, dasar));
                else if (b.jenis === 'deposit_kembali') log.push(Object.assign({ jumlah: -j, sumber: 'deposit', ket: 'Rental deposit returned' }, dasar));
                else if (b.jenis === 'deposit_potong') { /* deposit dipakai membayar sewa/ganti rugi: tanpa uang bergerak, titipan jadi pendapatan */
                    log.push(Object.assign({}, dasar, { metode: depMetode, jumlah: j, sumber: 'sewa', ket: 'Watch rental (from deposit)' }), Object.assign({}, dasar, { metode: depMetode, jumlah: -j, sumber: 'deposit', ket: 'Rental deposit used' }));
                } else log.push(Object.assign({ jumlah: j, sumber: 'sewa', ket: 'Watch rental' }, dasar));
            });
        });
        cache.kas.forEach(function (k) { (k.pengeluaran || []).forEach(function (p) { log.push({ tgl: k.tgl, jumlah: -(+p.jumlah || 0), metode: p.metode || 'tunai', sumber: 'operasional', kode: p.kategori, nama: p.oleh || '', ket: 'Expense: ' + p.ket }); }); });
        cache.tebus.forEach(function (t) {
            if (t.status !== 'batal' && t.tgl_beli) log.push({ tgl: t.tgl_beli, jumlah: -(+t.harga_beli || 0), metode: t.metode, sumber: 'tebus', kode: t.kode, nama: t.nama, ket: 'Watch bought (buyback right)' });
            if (t.status === 'ditebus' && t.tgl_tebus) log.push({ tgl: t.tgl_tebus, jumlah: L.hargaTebus(t), metode: 'tunai', sumber: 'tebus', kode: t.kode, nama: t.nama, ket: 'Bought back (buyback)' });
        });
        return log;
    }
    function hitungBulan(bln, log) {
        var r = { masuk: 0, keluar: 0, barang: 0, servis: 0, sewa: 0, deposit: 0, tebus: 0, operasional: 0, metode: {}, harian: {}, log: [] };
        log.forEach(function (x) {
            if (String(x.tgl).slice(0, 7) !== bln) return; r.log.push(x);
            if (x.jumlah >= 0) r.masuk += x.jumlah; else r.keluar += -x.jumlah;
            if (x.sumber === 'barang') r.barang += x.jumlah; else if (x.sumber === 'servis') r.servis += x.jumlah; else if (x.sumber === 'sewa') r.sewa += x.jumlah; else if (x.sumber === 'deposit') r.deposit += x.jumlah; else if (x.sumber === 'operasional') r.operasional += x.jumlah; else r.tebus += x.jumlah;
            var m = x.metode || 'tunai'; r.metode[m] = (r.metode[m] || 0) + x.jumlah;
            var h = r.harian[x.tgl] = r.harian[x.tgl] || { barang: 0, servis: 0 }; if (h[x.sumber] != null && x.jumlah > 0) h[x.sumber] += x.jumlah;
        });
        /* untung kotor barang: transaksi jual bulan itu (bukan batal), harga deal − modal saat ini */
        r.untung = 0; r.tanpaModal = 0; r.terjual = 0; r.jasa = 0; var laris = {};
        cache.jual.forEach(function (j) {
            if (j.status === 'batal' || String(j.tgl).slice(0, 7) !== bln) return;
            (j.items || []).forEach(function (i) {
                if (i.jenis === 'jasa') { r.jasa += i.harga * i.qty; return; } /* jasa cepat: dihitung terpisah, bukan unit barang terjual */
                var s = cariId('stok', i.stok_id), m = s && +s.harga_beli; r.terjual += i.qty;
                if (m) r.untung += (i.harga - m) * i.qty; else r.tanpaModal++;
                var k = i.kode + '|' + i.nama, l = laris[k] = laris[k] || { nama: i.nama, kode: i.kode, qty: 0, omzet: 0 }; l.qty += i.qty; l.omzet += i.harga * i.qty;
            });
        });
        /* part dari stok yang dipakai servis (catatan penjualan servis_id di stok) */
        cache.stok.forEach(function (s) {
            (s.penjualan || []).forEach(function (p) {
                if (!p.servis_id || String(p.tgl).slice(0, 7) !== bln) return;
                var m = +s.harga_beli; r.terjual += p.qty;
                if (m) r.untung += (p.harga - m) * p.qty; else r.tanpaModal++;
                var k = s.kode + '|' + L.namaStok(s), l = laris[k] = laris[k] || { nama: L.namaStok(s), kode: s.kode, qty: 0, omzet: 0 }; l.qty += p.qty; l.omzet += p.harga * p.qty;
            });
        });
        r.laris = Object.keys(laris).map(function (k) { return laris[k]; }).sort(function (a, b) { return b.qty - a.qty || b.omzet - a.omzet; }).slice(0, 8);
        r.svMasuk = cache.servis.filter(function (s) { return String(s.tgl_masuk).slice(0, 7) === bln && s.status !== 'batal'; });
        r.svSelesai = cache.servis.filter(function (s) { return String(s.tgl_selesai || '').slice(0, 7) === bln; }).length;
        return r;
    }
    function persen(a, b) { if (!b) return a ? '<small class="rk-naik">new</small>' : ''; var p = Math.round((a - b) / Math.abs(b) * 100); return '<small class="' + (p >= 0 ? 'rk-naik' : 'rk-turun') + '">' + (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p) + '% vs last month</small>'; }
    function batang(data, warna) {
        var maks = Math.max.apply(null, data.map(function (d) { return d[1]; }).concat([1]));
        return '<div class="rk-bar">' + data.map(function (d) { return '<div class="rk-bar__r"><span>' + E(d[0]) + '</span><i style="--w:' + (d[1] / maks * 100).toFixed(1) + '%;--c:' + (d[2] || warna) + '"></i><b>' + E(d[3] != null ? d[3] : L.rupiah(d[1])) + '</b></div>'; }).join('') + '</div>';
    }
    function grafikHarian(bln, harian) {
        var hari = new Date(+bln.slice(0, 4), +bln.slice(5, 7), 0).getDate(), maks = 1, x, w = 100 / hari;
        for (x = 1; x <= hari; x++) { var h = harian[bln + '-' + ('0' + x).slice(-2)]; if (h) maks = Math.max(maks, h.barang + h.servis); }
        var svg = '<svg viewBox="0 0 100 40" preserveAspectRatio="none" class="rk-svg" role="img" aria-label="Money in per day">';
        for (x = 1; x <= hari; x++) {
            var hh = harian[bln + '-' + ('0' + x).slice(-2)] || { barang: 0, servis: 0 }, tb = hh.barang / maks * 38, ts = hh.servis / maks * 38, px = (x - 1) * w + w * .15;
            if (ts) svg += '<rect x="' + px.toFixed(2) + '" y="' + (40 - ts).toFixed(2) + '" width="' + (w * .7).toFixed(2) + '" height="' + ts.toFixed(2) + '" class="rk-s"><title>' + x + ': service ' + L.rupiah(hh.servis) + '</title></rect>';
            if (tb) svg += '<rect x="' + px.toFixed(2) + '" y="' + (40 - ts - tb).toFixed(2) + '" width="' + (w * .7).toFixed(2) + '" height="' + tb.toFixed(2) + '" class="rk-b"><title>' + x + ': items ' + L.rupiah(hh.barang) + '</title></rect>';
        }
        return svg + '</svg><div class="rk-sumbu"><span>1</span><span>' + Math.ceil(hari / 2) + '</span><span>' + hari + '</span></div><div class="rk-leg"><span><i class="rk-b"></i>Items</span><span><i class="rk-s"></i>Service</span><span>Highest ' + L.rupiah(maks) + '/day</span></div>';
    }
    function rekap() {
        if (!bulanRk) bulanRk = L.hariIni().slice(0, 7);
        var log = arusKas(), r = hitungBulan(bulanRk, log), p = hitungBulan(bulanLalu(bulanRk), log);
        var dp = cache.jual.filter(function (j) { return j.status === 'dp'; }), dpUang = dp.reduce(function (t, j) { return t + L.hitungJual(j).dibayar; }, 0);
        var jenis = {}; r.svMasuk.forEach(function (s) { var k = s.arloji_jenis || 'Other'; jenis[k] = (jenis[k] || 0) + 1; });
        /* stok mengendap: barang tersedia yang sudah lebih dari 90 hari di toko (modal tertahan) */
        var hariRk = L.hariIni(), endap = cache.stok.filter(function (s) { return adaStok(s) && +s.jumlah > 0 && s.tgl_masuk && L.hariAntara(s.tgl_masuk, hariRk) > 90; })
            .sort(function (a, b) { return a.tgl_masuk < b.tgl_masuk ? -1 : 1; });
        var modalEndap = endap.reduce(function (t, s) { return t + (+s.harga_beli || 0) * (+s.jumlah || 0); }, 0);
        /* jasa servis terbanyak: pekerjaan (bukan part) pada servis yang masuk bulan ini */
        var jasa = {}; r.svMasuk.forEach(function (s) { (s.items || []).forEach(function (i) { if (i.jenis === 'part') return; var k = String(i.nama || 'Work').replace(/\s*\+\s*Basic Setup/i, '').trim(), q = +i.qty || 1, x = jasa[k] = jasa[k] || { n: 0, uang: 0 }; x.n += q; x.uang += (+i.harga || 0) * q; }); });
        var jasaUrut = Object.keys(jasa).sort(function (a, b) { return jasa[b].n - jasa[a].n || jasa[b].uang - jasa[a].uang; }).slice(0, 6);
        var bersih = r.masuk - r.keluar, depSewa = cache.sewa.reduce(function (t, w) { return t + (w.status === 'aktif' || w.status === 'selesai' ? L.hitungSewa(w).ditahan : 0); }, 0);
        app.innerHTML = '<section class="rk"><div class="ly-head"><h1>Monthly report</h1><span class="ly-peran">Owner only</span><input type="month" class="ly-in rk-bln" id="rk-bln" value="' + bulanRk + '"></div>' +
            '<div class="rk-kartu">' +
            '<div class="ly-card"><small>Money in</small><b>' + L.rupiah(r.masuk) + '</b>' + persen(r.masuk, p.masuk) + '<small>' + r.log.filter(function (x) { return x.jumlah > 0; }).length + ' payment(s)</small></div>' +
            '<div class="ly-card"><small>Item sales</small><b class="rk-c1">' + L.rupiah(r.barang) + '</b>' + persen(r.barang, p.barang) + '<small>' + r.terjual + ' unit(s) sold' + (r.jasa ? ' · incl. quick service ' + L.rupiah(r.jasa) : '') + '</small></div>' +
            '<div class="ly-card"><small>Service income</small><b class="rk-c2">' + L.rupiah(r.servis) + '</b>' + persen(r.servis, p.servis) + '<small>' + r.svMasuk.length + ' in · ' + r.svSelesai + ' done</small></div>' +
            (r.sewa || r.deposit ? '<div class="ly-card"><small>Watch rental income</small><b class="rk-c2">' + L.rupiah(r.sewa) + '</b>' + persen(r.sewa, p.sewa) + '<small>net deposits ' + L.rupiah(r.deposit) + '</small></div>' : '') +
            '<div class="ly-card"><small>Gross profit on items</small><b class="rk-c3">' + L.rupiah(r.untung) + '</b>' + persen(r.untung, p.untung) + (r.tanpaModal ? '<small class="ly-warn">' + r.tanpaModal + ' item(s) without a cost price</small>' : '<small>sale price − cost</small>') + '</div>' +
            '</div>' +
            '<div class="rk-dua"><div class="ly-card"><h2>Money in per day</h2>' + grafikHarian(bulanRk, r.harian) + '</div>' +
            '<div class="ly-card"><h2>Cash summary</h2><div class="ly-sum" style="margin:0;padding:0;border:0">' +
            '<div><span>Money in</span><span>' + L.rupiah(r.masuk) + '</span></div>' +
            (r.keluar ? '<div><span>Money out (expenses, buyback purchases, refunds)</span><span class="ly-telat">−' + L.rupiah(r.keluar) + '</span></div>' : '') +
            (r.operasional ? '<div><span>&nbsp; including operating expenses</span><span>−' + L.rupiah(-r.operasional) + '</span></div>' : '') +
            '<div class="ly-total"><span>Net</span><span>' + L.rupiah(bersih) + '</span></div>' +
            Object.keys(r.metode).map(function (m) { return '<div><span>&nbsp; ' + ({ tunai: 'Cash (match with the drawer)', transfer: 'Transfer (match with the bank statement)', qris: 'QRIS' })[m] + '</span><span>' + L.rupiah(r.metode[m]) + '</span></div>'; }).join('') +
            '<div><span>Item deposits still held (now)</span><span>' + L.rupiah(dpUang) + ' · ' + dp.length + ' order(s)</span></div>' +
            (depSewa ? '<div><span>Rental deposits held (now, not income)</span><span>' + L.rupiah(depSewa) + '</span></div>' : '') +
            '<div class="ly-total"><span>Estimated profit (item profit + service − expenses)</span><span>' + L.rupiah(r.untung + r.servis + r.operasional) + '</span></div></div></div></div>' +
            '<div class="rk-dua"><div class="ly-card"><h2>Income mix</h2>' + batang([['Items', Math.max(0, r.barang), 'var(--accent)'], ['Service', Math.max(0, r.servis), '#2659A8']].concat(r.sewa > 0 ? [['Watch rental', r.sewa, '#B5651D']] : []).concat(r.tebus > 0 ? [['Bought back', r.tebus, '#0E6B40']] : [])) + '</div>' +
            '<div class="ly-card"><h2>Service jobs by watch type</h2>' + (Object.keys(jenis).length ? batang(Object.keys(jenis).sort(function (a, b) { return jenis[b] - jenis[a]; }).map(function (k) { return [k, jenis[k], '#6B3FA0', jenis[k] + ' watch(es)']; })) : '<p class="ly-muted">No service jobs this month yet.</p>') + '</div></div>' +
            '<div class="rk-dua"><div class="ly-card"><h2>Slow-moving stock (over 90 days)</h2>' + (endap.length ? '<p class="ly-muted" style="margin:0 0 8px">' + endap.length + ' item(s) · cost tied up <b>' + L.rupiah(modalEndap) + '</b>. Consider a price drop, bundling, or a Story promo.</p><ol class="rk-laris">' +
            endap.slice(0, 6).map(function (s) { return '<li><span><b><a href="#stok/' + E(s.id) + '">' + E(L.namaStok(s)) + '</a></b><small>' + E(s.kode) + ' · in stock ' + L.hariAntara(s.tgl_masuk, hariRk) + ' days</small></span><span><b>' + L.rupiah(s.harga_jual || 0) + '</b><small>cost ' + L.rupiah(s.harga_beli || 0) + '</small></span></li>'; }).join('') + '</ol>' + (endap.length > 6 ? '<p class="ly-muted" style="margin:8px 0 0">+ ' + (endap.length - 6) + ' more item(s) in the Stock menu.</p>' : '') : '<p class="ly-muted">None. Every item in stock arrived less than 90 days ago. 👍</p>') + '</div>' +
            '<div class="ly-card"><h2>Top service work this month</h2>' + (jasaUrut.length ? batang(jasaUrut.map(function (k) { return [k, jasa[k].n, '#2659A8', jasa[k].n + 'x · ' + L.rupiah(jasa[k].uang)]; })) : '<p class="ly-muted">No service jobs this month yet.</p>') + '</div></div>' +
            '<div class="rk-dua"><div class="ly-card"><h2>Best sellers</h2>' + (r.laris.length ? '<ol class="rk-laris">' + r.laris.map(function (l) { return '<li><span><b>' + E(l.nama) + '</b><small>' + E(l.kode) + '</small></span><span><b>' + l.qty + ' unit</b><small>' + L.rupiah(l.omzet) + '</small></span></li>'; }).join('') + '</ol>' : '<p class="ly-muted">No sales this month yet.</p>') + '</div>' +
            '<div class="ly-card"><div class="ly-head" style="margin-bottom:8px"><h2 style="flex:1;margin:0">Transaction log</h2><button type="button" class="ly-btn ly-btn--sm" id="rk-csv">Download CSV (Excel)</button></div>' +
            '<div class="rk-log">' + (r.log.length ? r.log.slice().sort(function (a, b) { return a.tgl < b.tgl ? 1 : -1; }).map(function (x) {
                return '<div><span><b>' + E(x.ket) + '</b><small>' + L.tgl(x.tgl) + ' · ' + E(x.kode) + ' · ' + E(x.nama || '') + ' · ' + E(x.metode || '') + '</small></span><b class="' + (x.jumlah < 0 ? 'ly-telat' : '') + '">' + (x.jumlah < 0 ? '−' : '') + L.rupiah(Math.abs(x.jumlah)) + '</b></div>';
            }).join('') : '<p class="ly-muted">No transactions this month yet.</p>') + '</div></div></div></section>';
        $('#rk-bln').addEventListener('change', function () { if (this.value) { bulanRk = this.value; rekap(); } });
        $('#rk-csv').addEventListener('click', function () {
            /* teks yang diawali = + - @ dianggap rumus oleh Excel/Sheets: diberi tanda ' di depan supaya tampil sebagai teks */
            var aman = function (v) { v = String(v); return /^[=+\-@\t\r]/.test(v) ? "'" + v : v; };
            var baris = [['Date', 'Description', 'Code', 'Name', 'Metode', 'Amount']].concat(r.log.slice().sort(function (a, b) { return a.tgl < b.tgl ? -1 : 1; }).map(function (x) { return [x.tgl, aman(x.ket), aman(x.kode), aman(x.nama || ''), aman(x.metode || ''), x.jumlah]; }));
            var csv = '﻿' + baris.map(function (b) { return b.map(function (v) { v = String(v); return /[;"\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\r\n');
            simpanBerkas('jubeliwatch-report-' + bulanRk + '.csv', csv, 'text/csv');
        });
    }

    /* ================= daftar servis ================= */
    function daftarServis() {
        app.innerHTML = '<section><div class="ly-head"><h1>Service queue</h1><div class="ly-seg" id="tampilan" role="group" aria-label="View"><button type="button" data-v="papan">Board</button><button type="button" data-v="daftar">List</button></div><a class="ly-btn ly-btn--pri" href="#servis/baru">+ Watch in</a></div>' +
            '<div class="ly-cari"><input class="ly-in" id="cari" type="search" placeholder="Search code, name, phone, brand…" autocomplete="off"></div>' +
            '<div id="ingat"></div><div class="ly-filter" id="filter"></div><div class="ly-list" id="list"></div>' +
            '<fieldset class="ly-card" style="margin-top:18px"><legend>Backup &amp; security</legend>' + kisiAksi([
                aksi({ id: 'b-cadang', ikon: 'unduh', teks: 'Download backup' }), aksi({ id: 'b-buka-cad', ikon: 'buka', teks: 'Open backup' }),
                aksi({ id: 'b-pin', ikon: 'kunci', teks: 'Change PIN', kelas: 'ly-akt--lebar' }),
                aksi({ id: 'b-lupa', ikon: 'hapus', teks: 'Remove token from this device', kelas: 'ly-akt--del' })]) + '</fieldset></section>';
        $('#cari').value = cari;
        $('#cari').addEventListener('input', function () { cari = this.value; gambarDaftar(); });
        $('#filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; gambarDaftar(); } });
        $('#ingat').addEventListener('click', function (e) { if (e.target.closest('[data-lihat]')) { filter = 'selesai'; cari = ''; $('#cari').value = ''; tampilSv = 'daftar'; gambarDaftar(); } });
        $('#list').addEventListener('click', function (e) {
            var b = e.target.closest('[data-ingat]'); if (b) { e.preventDefault(); catatPengingat('servis', b.dataset.ingat, b); return; }
            var g = e.target.closest('[data-geser]'); if (g) { e.preventDefault(); geserServis(g.closest('[data-id]').dataset.id, +g.dataset.geser, g.closest('.kb-k')); return; }
            var ps = e.target.closest('[data-poster-sv]'); if (ps) { e.preventDefault(); bagikanServis(cariId('servis', ps.dataset.posterSv), ps); return; }
            var k = e.target.closest('[data-kasir]'); if (k) { e.preventDefault(); keKasir(k.dataset.kasir); }
        });
        $('#tampilan').addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (!b) return; tampilSv = b.dataset.v; try { localStorage.setItem('jubeli-admin-tampilan', tampilSv); } catch (x) {} gambarDaftar(); });
        $('#b-cadang').addEventListener('click', function () { unduhCadangan(); });
        $('#b-buka-cad').addEventListener('click', bukaCadanganUi);
        $('#b-pin').addEventListener('click', gantiPinUi);
        $('#b-lupa').addEventListener('click', function () { if (confirm('Remove the token from this device? Your data stays safe on GitHub; you will need to set up the token again to use the POS here.' + peringatanAntri())) A.lupakan().then(function () { location.hash = ''; location.reload(); }); });
        gambarDaftar();
    }
    function gambarDaftar() {
        if (!$('#list')) return;
        var rows = cache.servis, n = {}, hari = L.hariIni(), c = cari.trim().toLowerCase();
        rows.forEach(function (s) { n[s.status] = (n[s.status] || 0) + 1; });
        var f = [['aktif', 'Active', rows.filter(function (s) { return AKTIF.indexOf(s.status) > -1; }).length]]
            .concat(L.URUT_STATUS.concat('batal').map(function (k) { return [k, L.STATUS[k].label.replace(/ – .*/, ''), n[k] || 0]; }))
            .concat([['semua', 'All', rows.length]]);
        $('#filter').innerHTML = f.map(function (x) { return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (filter === x[0]) + '">' + E(x[1]) + '<b>' + x[2] + '</b></button>'; }).join('');
        var hasil = rows.filter(function (s) {
            if (filter === 'aktif' ? AKTIF.indexOf(s.status) < 0 : filter !== 'semua' && s.status !== filter) return false;
            return !c || [s.kode, s.nama, s.hp, s.arloji_jenis, s.arloji_merk, s.keluhan].join(' ').toLowerCase().indexOf(c) > -1;
        });
        /* gitar yang belum diambil: paling lama di atas */
        if (filter === 'selesai') hasil.sort(function (a, b) { return (a.tgl_selesai || '') < (b.tgl_selesai || '') ? -1 : 1; });
        var perlu = rows.filter(function (s) { return L.perluIngat(s, hari); }).length;
        $('#ingat').innerHTML = perlu ? '<div class="ly-ingat"><span>🔔 <b>' + perlu + ' watch(es)</b> are done but not collected and need a reminder.</span><button type="button" class="ly-btn ly-btn--sm" data-lihat>View</button></div>' : '';
        $$('#tampilan button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === tampilSv); });
        $('#filter').hidden = tampilSv === 'papan';
        if (tampilSv === 'papan') { $('#list').innerHTML = gambarPapan(rows, c, hari); return; }
        $('#list').innerHTML = hasil.length ? hasil.map(function (s) { return kartuServis(s, hari); }).join('') : '<p class="ly-kosong">' + (rows.length ? 'Nothing matches.' : 'No service jobs yet. Tap “+ Watch in”.') + '</p>';
    }
    /* kartu servis (tampilan Daftar): nama pelanggan sebagai judul, baris berikon (tanggal masuk, tagihan, estimasi, penitipan, pengingat) hanya bila relevan,
       lalu tombol utama (pengingat) dan ikon bagikan poster sesuai status */
    /* kartu daftar seragam (Servis, Jual, Tebus, Titip jual, Sewa, Stok): o = { href, kode (HTML aman), kodeIkon, chip (HTML), judul, sub, foto (alamat gambar | true = kotak kosong),
       baris: [[kelas, ikon, isi HTML], ...] atau info (HTML <li> jadi), aksi (HTML tombol) } */
    function kartuIkon(o) {
        var info = o.info || (o.baris || []).map(function (b) { return baris(b[0], b[1], b[2]); }).join('');
        var foto = o.foto ? '<span class="sv-foto">' + (o.foto === true ? '' : '<img src="' + E(o.foto) + '" alt="" loading="lazy" decoding="async">') + '</span>' : '';
        return '<div class="sv-k"><a class="sv-k__a" href="' + o.href + '"><span class="sv-k__top"><span class="sv-kode"><span class="sv-i" aria-hidden="true">' + ikon(o.kodeIkon || 'surat') + '</span>' + o.kode + '</span>' + o.chip + '</span>' +
            '<span class="sv-k__kepala">' + foto + '<span class="sv-k__teks"><b class="sv-k__nama">' + E(o.judul) + '</b>' + (o.sub ? '<span class="sv-k__gitar">' + E(o.sub) + '</span>' : '') + '</span></span></a>' +
            (info ? '<ul class="sv-k__info">' + info + '</ul>' : '') + (o.aksi ? '<div class="sv-k__aksi">' + o.aksi + '</div>' : '') + '</div>';
    }
    function baris(kls, ik, isi) { return '<li' + (kls ? ' class="' + kls + '"' : '') + '><span class="sv-i" aria-hidden="true">' + ikon(ik) + '</span><span>' + isi + '</span></li>'; }
    function kartuServis(s, hari) {
        var h = L.hitung(s, s.items, s.bayar), beres = L.beres(s), telat = s.estimasi && s.estimasi < hari && ['menunggu_dp', 'antri', 'dikerjakan'].indexOf(s.status) > -1;
        var t = s.status === 'selesai' ? L.titip(s, hari) : null, akhir = (s.pengingat || []).slice(-1)[0], perlu = t && L.perluIngat(s, hari);
        var info = baris('', 'tanggal', 'In: <b>' + L.tgl(s.tgl_masuk) + '</b>');
        if (!h.total) info += baris('sv-warn', 'uang', 'No cost entered');
        else if (h.lunas) info += baris('sv-ok', 'uang', '<b>Paid</b>');
        else if (h.kurangAwal && !beres) info += baris('sv-warn', 'uang', 'Upfront short <b>' + L.rupiah(h.kurangAwal) + '</b>');
        else info += baris('sv-bad', 'uang', 'Balance due: <b>' + L.rupiah(h.sisa) + '</b>');
        if (s.estimasi && !beres) info += baris(telat ? 'sv-bad' : '', 'jam', 'Estimasi ' + L.tgl(s.estimasi) + (telat ? ' <b>(overdue)</b>' : ''));
        if (t) {
            info += baris(t.hariBiaya || t.lepas || t.garansiHangus ? 'sv-bad' : 'sv-warn', 'jam', 'Done ' + t.lama + ' days ago · ' + (t.hariBiaya ? '<b>Storage fee ' + t.hariBiaya + ' days = ' + L.rupiah(t.biaya) + '</b>' : 'Free storage until ' + L.tgl(t.batasGratis) + ' (' + t.sisaGratis + ' days left)') +
                (t.garansiHangus ? ' · <b>Warranty void</b>' : '') + (t.lepas ? ' · <b>Over ' + C.penyimpananLamaHari + ' days</b>' : ''));
            if (akhir) info += baris('sv-muted', 'lonceng', 'Diingatkan: ' + L.tgl(akhir));
        }
        var aksi = (t ? '<button type="button" class="ly-btn ' + (perlu ? 'ly-btn--wa' : 'ly-btn--pri') + '" data-ingat="' + E(s.id) + '">' + ikon('amplop') + (perlu ? 'Remind via WhatsApp' : 'Send reminder') + '</button>' : '') + tombolPosterServis(s);
        return kartuIkon({ href: '#servis/' + E(s.id), kode: E(s.kode), chip: '<span class="st-chip st-' + s.status + '">' + E(L.STATUS[s.status].label) + '</span>', judul: s.nama || 'No name', sub: L.namaGitar(s, 'Watch'), info: info, aksi: aksi });
    }
    /* baris penitipan + tombol pengingat untuk gitar yang sudah selesai (dipakai tampilan lama; kartu Daftar memakai kartuServis) */
    function infoTitip(s, hari) {
        var t = L.titip(s, hari); if (!t) return '';
        var teks = t.hariBiaya ? '<span class="ly-telat">Storage fee ' + t.hariBiaya + ' days = ' + L.rupiah(t.biaya) + '</span>' : '<span>Free storage until ' + L.tgl(t.batasGratis) + ' (' + t.sisaGratis + ' days left)</span>';
        if (t.garansiHangus) teks += '<span class="ly-telat">Warranty void</span>';
        if (t.lepas) teks += '<span class="ly-telat">Overdue ' + C.penyimpananLamaHari + ' days</span>';
        var akhir = (s.pengingat || []).slice(-1)[0], perlu = L.perluIngat(s, hari);
        return '<span class="ly-item__m"><span>Done ' + t.lama + ' days ago</span>' + teks + (akhir ? '<span>Reminded ' + L.tgl(akhir) + '</span>' : '') + '</span>' +
            '<span class="ly-item__b"><button type="button" class="ly-btn ly-btn--sm ' + (perlu ? 'ly-btn--wa' : '') + '" data-ingat="' + E(s.id) + '">' + (perlu ? 'Remind via WhatsApp' : 'Send reminder') + '</button></span>';
    }

    /* ================= form servis (semua perubahan baru dikirim ke GitHub saat Simpan) ================= */
    function servisKosong() {
        return { nama: '', hp: '', tgl_masuk: L.hariIni(), arloji_jenis: C.jenisArloji[0], arloji_merk: '', keluhan: '', status: 'menunggu_dp', estimasi: '', diskon: 0, saran: '', catatan_publik: '', catatan_admin: '', izin_publikasi: false, items: [], bayar: [], foto: [] };
    }
    function bukaServis(id) {
        ambilCatatan('servis', id, servisKosong, function (s) {
            s.items = s.items || []; s.bayar = s.bayar || []; s.foto = s.foto || [];
            ed = { baru: !id, s: s, antri: [] }; gambarServis();
        });
    }
    /* tombol WhatsApp servis: tanda terima, SATU tombol kabar yang berubah mengikuti status, nota, (pengingat bila Selesai) */
    function waServis() {
        var k = L.kabarServis(ed.s);
        return barisWa([['tandaTerima', 'Drop-off receipt', 'We have received the watch'], ['kabar', k.judul, k.ket], ['nota', 'Send receipt', 'Receipt link & cost breakdown']]
            .concat(ed.s.status === 'selesai' ? [['pengingat', 'Collection reminder', 'Watch not collected yet']] : []), 'wa');
    }
    function gambarServis() {
        var s = ed.s, katalog = {}, kat = '';
        C.katalogJasa.forEach(function (k, i) { (katalog[k.grup] = katalog[k.grup] || []).push('<option value="' + i + '">' + E(k.nama) + (k.harga ? ' – ' + L.rupiah(k.harga) : '') + '</option>'); });
        for (var g in katalog) kat += '<optgroup label="' + E(g) + '">' + katalog[g].join('') + '</optgroup>';
        var jenis = C.jenisArloji.slice(); if (s.arloji_jenis && jenis.indexOf(s.arloji_jenis) < 0) jenis.push(s.arloji_jenis);
        app.innerHTML = '<section id="sv" class="ly-f">' +
            '<div class="ly-head"><a class="ly-back" href="#servis">‹ Service list</a></div>' +
            '<div class="ly-head"><h1>' + (ed.baru ? 'Watch in' : E(L.namaGitar(s, 'Watch'))) + '</h1>' + (ed.baru ? '' : '<span class="st-chip st-' + s.status + '" id="sv-chip">' + E(L.STATUS[s.status].label) + '</span>') + '</div>' +
            (ed.baru ? '<p class="ly-muted">The service code is created automatically when you save.</p>' : kodeBaris(s)) +

            '<fieldset class="ly-card ly-f ly-grid ly-grid--2"><legend>Customer</legend>' +
            '<label>Name<input data-f="nama" autocomplete="off" required></label>' +
            '<label><span class="ly-lt">Phone / WhatsApp' + (ed.baru ? '' : bantu('tip-hp')) + '</span><input data-f="hp" type="tel" inputmode="tel" autocomplete="off" placeholder="08xxxxxxxxxx" required></label>' +
            (ed.baru ? '' : tip('tip-hp', 'Changing the phone number changes the 4 digits used to check status; send the link to the customer again.')) + tombolKontak('[data-f="nama"]', '[data-f="hp"]') + '</fieldset>' +

            '<fieldset class="ly-card ly-f ly-grid"><legend>Watch</legend>' +
            '<div class="ly-row2"><label>Movement<select data-f="arloji_jenis">' + opsi(jenis, s.arloji_jenis) + '</select></label>' +
            '<label>Brand / model<input data-f="arloji_merk" placeholder="e.g. Seiko 5 SNK809"></label></div>' +
            '<label>Problem / damage<textarea data-f="keluhan" rows="3" placeholder="e.g. stops overnight, gains 2 minutes a day, fog under the crystal"></textarea></label>' +
            '<div class="ly-row2"><label>Date in<input type="date" data-f="tgl_masuk"></label><label>Estimated ready<input type="date" data-f="estimasi"></label></div>' +
            '<label class="ly-cek"><input type="checkbox" data-f="izin_publikasi"> Customer agrees that photos of their watch can be used in the Journal (without name or phone number)</label></fieldset>' +

            '<fieldset class="ly-card"><legend>Work &amp; parts</legend><div class="ly-items" id="sv-items"></div>' +
            '<div class="ly-add"><select class="ly-in" id="sv-katalog"><option value="">+ Add work from the list…</option>' + kat + '</select>' +
            '<select class="ly-in" id="sv-stok" aria-label="Add part from stock"></select>' +
            '<button type="button" class="ly-btn ly-btn--sm" data-act="jasa">+ Other work</button><button type="button" class="ly-btn ly-btn--sm" data-act="part">+ Part</button></div>' +
            '<div class="ly-f" style="margin-top:12px"><label style="max-width:220px">Discount (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-f="diskon"></label></div>' +
            '<div class="ly-sum" id="sv-sum"></div></fieldset>' +

            '<fieldset class="ly-card"><legend>Payments</legend><div class="ly-bayar" id="sv-bayar"></div>' +
            '<div class="ly-f" style="margin-top:10px"><div class="ly-row2"><label>Amount (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="by-jml"></label>' +
            '<label>Type<select id="by-jenis">' + opsi([['dp', 'Deposit / upfront'], ['tambahan', 'Extra'], ['pelunasan', 'Final payment']], 'dp') + '</select></label></div>' +
            '<div class="ly-row2"><label>Metode<select id="by-metode">' + opsi([['tunai', 'Cash'], ['transfer', 'Transfer'], ['qris', 'QRIS']], 'tunai') + '</select></label><label>Date<input type="date" id="by-tgl"></label></div>' +
            '<button type="button" class="ly-btn" id="by-tambah">Record payment</button></div></fieldset>' +

            '<fieldset class="ly-card"><legend>Status</legend><div class="ly-status" id="sv-status"></div><div id="sv-titip"></div><p class="ly-hint" style="margin-top:8px">The status moves to <b>Queued</b> automatically once the upfront payment is met.</p>' +
            '<h3 class="ly-judul2">Internal note</h3><textarea class="ly-in" data-f="catatan_admin" rows="2" placeholder="Only visible in the POS" aria-label="Internal note (only visible in the POS)"></textarea></fieldset>' +

            '<fieldset class="ly-card"><legend>Photos</legend><div id="sv-foto"></div><p class="ly-hint" style="margin-top:10px">Photos are shrunk automatically (WebP ±150 KB) and encrypted before upload. The <b>Shown</b> label means the customer can see it; tap to hide. After-service photos appear to the customer only once the status is Done, side by side with the before photos.</p></fieldset>' +

            '<fieldset class="ly-card ly-f"><legend>For the customer</legend>' +
            '<label>Message / update (shown on the status page)<textarea data-f="catatan_publik" rows="3" placeholder="e.g. The mainspring is worn and needs replacing. Estimate moves back 2 days."></textarea></label>' +
            '<label>Advice after service (shown when the status is Done)<textarea data-f="saran" rows="3" placeholder="e.g. The gaskets are ageing; avoid swimming until they are replaced. The strap is worn and can be swapped."></textarea></label></fieldset>' +


            (ed.baru ? '<fieldset class="ly-card"><legend>Send to a prospective customer</legend>' + barisWa([['estimasi', 'Send cost estimate', 'Selected work & parts + total + deposit'], ['ketentuan', 'Send service terms', 'One time: deposit, warranty, storage']], 'wc') + '<p class="ly-hint ly-hint--c">No number yet: pick the contact in WhatsApp.</p></fieldset>' : '<fieldset class="ly-card"><legend>Send &amp; more</legend>' +
                '<div id="sv-wa">' + waServis() + '</div>' +
                '</fieldset><fieldset class="ly-card"><legend>More actions</legend>' +
                kisiAksi([
                    aksi({ href: 'repair-status.html?k=' + encodeURIComponent(s.kode) + '&amp;h=' + encodeURIComponent(L.hp4(s.hp)), luar: true, ikon: 'lihat', teks: 'View customer page' }),
                    aksi({ id: 'sv-cetak', ikon: 'cetak', teks: 'Print drop-off receipt + tag' }),
                    aksi({ href: 'receipt.html?k=' + encodeURIComponent(s.kode) + '&amp;h=' + encodeURIComponent(L.hp4(s.hp)), luar: true, ikon: 'nota', teks: 'Open / print receipt' })
                ].concat(owner() ? [aksi({ id: 'sv-artikel', ikon: 'artikel', teks: 'Turn into a Journal article' }), aksi({ id: 'sv-hapus', ikon: 'hapus', teks: 'Delete service job', kelas: 'ly-akt--del' })] : [])) +
                '<p class="ly-hint ly-hint--c">The customer page updates about 1 minute after saving.</p></fieldset>') +

            '<div class="ly-save"><span class="ly-dirty" id="dirty" hidden>Not saved</span><button type="button" class="ly-btn ly-btn--pri" id="sv-simpan">' + (ed.baru ? 'Save &amp; create code' : 'Save changes') + '</button></div></section>';
        susunDua(['Payments', 'Status', 'Kirim', 'More actions', 'More']);

        $$('[data-f]', app).forEach(function (el) {
            var v = s[el.dataset.f];
            if (el.type === 'checkbox') el.checked = !!v; else el.value = v == null ? '' : v;
        });
        $('#by-tgl').value = L.hariIni();
        gambarItems(); gambarRingkas(); gambarBayar(); gambarStatus(); gambarFoto();
        setDirty(false);

        var sv = $('#sv');
        sv.addEventListener('input', ubahField); sv.addEventListener('change', ubahField);
        sv.addEventListener('click', klikServis);
        $('#sv-stok').addEventListener('change', function () { var id = this.value; this.value = ''; if (id) tambahPartStok(id); });
        $('#sv-katalog').addEventListener('change', function () {
            var k = C.katalogJasa[+this.value]; this.value = ''; if (!k) return;
            ed.s.items.push({ jenis: 'jasa', nama: k.nama, harga: k.harga || 0, qty: 1, garansi: k.garansi || '', garansi_syarat: k.jatuh ? C.syaratJatuh : '' });
            gambarItems(); gambarRingkas(); setDirty(true);
            if (!k.harga) { var ins = $$('#sv-items [data-k="harga"]'); ins[ins.length - 1].focus(); }
        });
        $('#by-tambah').addEventListener('click', tambahBayar);
        $('#sv-simpan').addEventListener('click', simpanServis);
        pilihFoto($('#sv-foto'), function (tahap, files) { antriFoto(ed.antri, files, { tahap: tahap, tampil: true }, gambarFoto); });
        if (!ed.baru && owner()) { $('#sv-artikel').addEventListener('click', jadikanArtikel); $('#sv-hapus').addEventListener('click', hapusServis); }
        if (!ed.baru) $('#sv-cetak').addEventListener('click', function () {
            if (dirty) return toast('Save your changes first so the printout is up to date.', true);
            cetakTandaTerima(ed.s);
        });
    }
    function cetakTandaTerima(s) { cetakBaris(L.strukServis(s, { label: true })); }
    function ubahField(e) {
        var t = e.target;
        if (t.dataset.f) {
            ed.s[t.dataset.f] = t.type === 'checkbox' ? t.checked : t.dataset.f === 'diskon' ? Math.max(0, Math.round(+t.value || 0)) : t.value;
            setDirty(true); if (t.dataset.f === 'diskon') gambarRingkas();
        } else if (t.dataset.k) {
            var it = ed.s.items[+t.closest('[data-i]').dataset.i], k = t.dataset.k;
            if (k === 'jatuh') it.garansi_syarat = t.checked ? C.syaratJatuh : '';
            else it[k] = k === 'harga' || k === 'qty' ? Math.max(k === 'qty' ? 1 : 0, Math.round(+t.value || 0)) : t.value;
            if (k === 'qty' && it.stok_id) {
                var sk1 = cariId('stok', it.stok_id), lebih = sk1 ? qtyDiForm(it.stok_id) - batasStokServis(sk1) : 0;
                if (lebih > 0) { it.qty = Math.max(1, it.qty - lebih); if (e.type === 'change') t.value = it.qty; toast('Stock ' + it.nama + ' only has enough for ' + it.qty + '.', true); }
                if (e.type === 'change') opsiStokServis();
            }
            setDirty(true); if (k === 'harga' || k === 'qty') gambarRingkas();
        }
    }
    /* ---- part dari stok (mis. senar): stok berkurang saat servis disimpan, kembali bila part dihapus / servis batal ---- */
    function qtyDiForm(id) { return ed.s.items.reduce(function (n, i) { return n + (i.jenis === 'part' && i.stok_id === id ? Math.max(1, +i.qty || 1) : 0); }, 0); }
    /* batas untuk servis ini = stok sekarang + yang sudah terpakai versi tersimpan (stok itu sudah dikurangi saat disimpan dulu) */
    function batasStokServis(s) { return (+s.jumlah || 0) + (ed.baru ? 0 : L.qtyStokServis(cariId('servis', ed.s.id), s.id)); }
    function opsiStokServis() {
        var el = $('#sv-stok'); if (!el) return;
        var grup = {}, ada = 0;
        cache.stok.filter(function (s) { return s.kategori !== 'arloji' && s.status !== 'ditarik'; }).forEach(function (s) {
            var sisa = batasStokServis(s) - qtyDiForm(s.id); if (sisa <= 0 && !qtyDiForm(s.id)) return;
            ada++;
            (grup[L.jenisStok(s)] = grup[L.jenisStok(s)] || []).push('<option value="' + E(s.id) + '"' + (sisa <= 0 ? ' disabled' : '') + '>' + E(L.namaStok(s)) + (s.harga_jual ? ' – ' + L.rupiah(s.harga_jual) : '') + ' · remaining ' + Math.max(0, sisa) + '</option>');
        });
        el.innerHTML = '<option value="">' + (ada ? '+ Part from stock…' : 'Part from stock: no accessories in stock yet') + '</option>' + Object.keys(grup).sort().map(function (g) { return '<optgroup label="' + E(g) + '">' + grup[g].join('') + '</optgroup>'; }).join('');
        el.disabled = !ada;
    }
    function tambahPartStok(id) {
        var s = cariId('stok', id); if (!s) return;
        if (batasStokServis(s) - qtyDiForm(id) <= 0) return toast('Stock ' + L.namaStok(s) + ' habis.', true);
        var it = ed.s.items.filter(function (i) { return i.jenis === 'part' && i.stok_id === id; })[0];
        if (it) it.qty = Math.max(1, +it.qty || 1) + 1;
        else ed.s.items.push({ jenis: 'part', nama: L.namaStok(s), harga: +s.harga_jual || 0, qty: 1, stok_id: s.id, kode: s.kode, garansi: '', garansi_syarat: '' });
        gambarItems(); gambarRingkas(); setDirty(true);
        if (!s.harga_jual) { var ins = $$('#sv-items [data-k="harga"]'); ins[ins.length - 1].focus(); toast('This item has no selling price in Stock yet. Enter the price here.'); }
    }
    function gambarItems() {
        opsiStokServis();
        $('#sv-items').innerHTML = ed.s.items.length ? ed.s.items.map(function (it, i) {
            var hapus = '<button type="button" class="ly-x" data-del="' + i + '" aria-label="Delete">×</button>';
            if (it.jenis === 'part') return '<div class="ly-it ly-it--part" data-i="' + i + '"><div class="ly-it__tag">' + (it.stok_id ? 'Part · stock ' + E(it.kode || '') : 'Part') + hapus + '</div>' +
                '<input class="ly-in ly-it__n" data-k="nama" placeholder="Part name, e.g. Renata 377 battery" value="' + E(it.nama) + '" aria-label="Part name">' +
                '<label class="ly-lbl">Qty<input class="ly-in" data-k="qty" type="number" inputmode="numeric" min="1" value="' + (it.qty || 1) + '"></label>' +
                '<label class="ly-lbl">Unit price (Rp)<input class="ly-in" data-k="harga" type="text" inputmode="numeric" autocomplete="off" data-rp value="' + (it.harga || 0) + '"></label></div>';
            return '<div class="ly-it" data-i="' + i + '"><div class="ly-it__tag">Work' + hapus + '</div>' +
                '<input class="ly-in ly-it__n" data-k="nama" placeholder="Work description" value="' + E(it.nama) + '" aria-label="Work description">' +
                '<label class="ly-lbl">Price (Rp)<input class="ly-in" data-k="harga" type="text" inputmode="numeric" autocomplete="off" data-rp value="' + (it.harga || 0) + '"></label>' +
                '<label class="ly-lbl">Warranty<select class="ly-in" data-k="garansi">' + opsi(L.GARANSI_PILIHAN, it.garansi || '') + '</select></label>' +
                '<label class="ly-cek ly-it__n" style="font-size:.75rem"><input type="checkbox" data-k="jatuh"' + (it.garansi_syarat ? ' checked' : '') + '> Warranty condition: the watch is not dropped or knocked again</label></div>';
        }).join('') : '<p class="ly-muted">No work added yet. Pick from the list below.</p>';
    }
    function gambarRingkas() {
        var h = L.hitung(ed.s, ed.s.items, ed.s.bayar);
        $('#sv-sum').innerHTML = '<div><span>Work</span><span>' + L.rupiah(h.jasa) + '</span></div>' + (h.part ? '<div><span>Part</span><span>' + L.rupiah(h.part) + '</span></div>' : '') +
            (h.diskon ? '<div><span>Discount</span><span>' + L.rupiah(-h.diskon) + '</span></div>' : '') +
            '<div class="ly-total"><span>Total</span><span>' + L.rupiah(h.total) + '</span></div>' +
            /* aturan DP hanya relevan sebelum gitar selesai dikerjakan */
            (L.beres(ed.s) ? '' : '<div><span>Upfront before work starts<br><small class="ly-muted">Deposit ' + L.dpPersen() + '% of work + parts in full</small></span><span>' + L.rupiah(h.wajibAwal) + '</span></div>') +
            '<div><span>Paid so far</span><span>' + L.rupiah(h.dibayar) + '</span></div>' +
            (h.total && !L.beres(ed.s) ? (h.kurangAwal ? '<div class="ly-warn"><span>Upfront payment still short</span><span>' + L.rupiah(h.kurangAwal) + '</span></div>' : '<div class="ly-ok"><span>Upfront payment met ✓</span><span></span></div>') : '') +
            '<div class="ly-total"><span>Balance' + (h.lebih ? ' (overpaid ' + L.rupiah(h.lebih) + ')' : '') + '</span><span>' + L.rupiah(h.sisa) + '</span></div>';
        var j = $('#by-jml'); if (j && !j.dataset.manual) j.value = h.kurangAwal || h.sisa || '';
        var bj = $('#by-jenis'); if (bj && !bj.dataset.manual) bj.value = h.kurangAwal ? 'dp' : h.sisa ? 'pelunasan' : 'tambahan';
    }
    function gambarBayar() {
        $('#sv-bayar').innerHTML = ed.s.bayar.length ? ed.s.bayar.map(function (b, i) {
            return '<div><span>' + L.tgl(b.tgl) + ' · ' + ({ dp: 'Deposit', pelunasan: 'Final payment', tambahan: 'Extra' })[b.jenis] + ' · ' + ({ tunai: 'Cash', transfer: 'Transfer', qris: 'QRIS' })[b.metode] + (b.baru ? ' <small class="ly-muted">(not saved)</small>' : '') + '</span><b>' + L.rupiah(b.jumlah) + '</b>' +
                '<button type="button" class="ly-x" data-delbayar="' + i + '" aria-label="Delete payment">×</button></div>';
        }).join('') : '<p class="ly-muted">No payments yet.</p>';
    }
    function gambarStatus() {
        $('#sv-status').innerHTML = L.URUT_STATUS.concat('batal').map(function (k) { return '<button type="button" data-status="' + k + '" aria-pressed="' + (ed.s.status === k) + '">' + E(L.STATUS[k].label) + '</button>'; }).join('');
        /* penitipan: hanya untuk data yang sudah tersimpan sebagai Selesai/Diambil */
        var el = $('#sv-titip'), t = !ed.baru && ed.s.tgl_selesai && L.titip(ed.s); if (!el) return;
        if (!t) { el.innerHTML = ''; return; }
        var sudah = ed.s.items.some(function (i) { return /^(Biaya penitipan|Storage fee)/i.test(i.nama); });
        el.innerHTML = '<div class="ly-ingat ly-ingat--info"><span>Done ' + L.tgl(ed.s.tgl_selesai) + ' (' + t.lama + ' days' + (ed.s.status === 'diambil' ? ' until collected' : ' ago') + '). ' +
            (t.hariBiaya ? '<b>Storage fee ' + t.hariBiaya + ' days × ' + L.rupiah(L.biayaTitip()) + ' = ' + L.rupiah(t.biaya) + '</b>.' : 'Free storage until ' + L.tgl(t.batasGratis) + '.') +
            (t.garansiHangus ? ' <b class="ly-telat">Warranty void</b> (over ' + C.garansiHangusHari + ' days).' : '') +
            ((ed.s.pengingat || []).length ? ' Reminded: ' + ed.s.pengingat.map(L.tgl).join(', ') + '.' : '') + '</span>' +
            (t.hariBiaya && !sudah ? '<button type="button" class="ly-btn ly-btn--sm" data-titip>+ Add storage fee</button>' : '') + '</div>';
    }
    function gambarFoto() {
        var el = $('#sv-foto'); if (!el) return;
        el.innerHTML = ['arloji', 'sebelum', 'sesudah'].map(function (t) { return grupFoto(L.TAHAP[t], t, ed.s.foto, ed.antri, true); }).join('');
        L.isiFoto(el, ed.s, A.fotoAdmin);
    }
    function klikServis(e) {
        var t = e.target.closest('button, [data-act]'); if (!t) return;
        var d = t.dataset;
        if (d.act) { ed.s.items.push({ jenis: d.act === 'part' ? 'part' : 'jasa', nama: '', harga: 0, qty: 1, garansi: '', garansi_syarat: '' }); gambarItems(); gambarRingkas(); setDirty(true); var n = $$('#sv-items [data-k="nama"]'); n[n.length - 1].focus(); }
        else if (d.del != null) { ed.s.items.splice(+d.del, 1); gambarItems(); gambarRingkas(); setDirty(true); }  /* part dari stok: stoknya kembali saat Simpan */
        else if (d.status) ubahStatus(d.status);
        else if (d.delbayar != null) hapusBayar(+d.delbayar);
        else if (d.tampil || d.tampilq) {
            /* cukup ganti tombolnya, foto tidak perlu digambar ulang */
            var f = d.tampil ? ed.s.foto.filter(function (x) { return x.id === d.tampil; })[0] : ed.antri.filter(function (x) { return x.qid === d.tampilq; })[0];
            f.tampil = !f.tampil; t.setAttribute('aria-pressed', f.tampil); t.textContent = f.tampil ? 'Shown' : 'Hidden'; if (d.tampil) setDirty(true);
        }
        else if (d.hapusfoto) { if (confirm('Delete this photo? (removed permanently when you Save)')) { ed.s.foto = ed.s.foto.filter(function (f) { return f.id !== d.hapusfoto; }); gambarFoto(); setDirty(true); } }
        else if (d.hapusq) { ed.antri = buangQ(ed.antri, d.hapusq); gambarFoto(); setDirty(ed.antri.length > 0 || dirty); }
        else if (d.wa) kirimWa(d.wa);
        else if (d.wc) kirimCalonServis(d.wc);
        else if (t.hasAttribute('data-titip')) {
            var tt = L.titip(ed.s);
            ed.s.items.push({ jenis: 'jasa', nama: 'Storage fee (' + tt.hariBiaya + ' days)', harga: tt.biaya, qty: 1, garansi: '', garansi_syarat: '' });
            gambarItems(); gambarRingkas(); gambarStatus(); setDirty(true); toast('Storage fee added to the breakdown. Tap Save.');
        }
    }
    function ubahStatus(st) {
        var h = L.hitung(ed.s, ed.s.items, ed.s.bayar);
        if (st === ed.s.status) return;
        if ((st === 'dikerjakan' || st === 'antri') && h.kurangAwal > 0 && !confirm('The upfront payment is still short by ' + L.rupiah(h.kurangAwal) + '. Shop rule: work starts after the deposit and parts are paid.\n\nChange the status anyway?')) return;
        if (st === 'diambil' && h.sisa > 0 && !confirm('There is still a balance of ' + L.rupiah(h.sisa) + '. Mark as collected?')) return;
        if (st === 'batal' && !confirm('Mark this service job as cancelled? The customer will no longer be able to open its status and receipt.')) return;
        ed.s.status = st; gambarStatus(); gambarRingkas(); setDirty(true);
        var wa = $('#sv-wa'); if (wa) wa.innerHTML = waServis();
        if (st === 'selesai' && !ed.s.foto.concat(ed.antri).some(function (f) { return f.tahap === 'sesudah'; })) toast('Remember to add after-service photos and advice for the customer.');
    }
    function tambahBayar() {
        var jml = Math.round(+$('#by-jml').value || 0); if (jml <= 0) return toast('Enter the payment amount.', true);
        ed.s.bayar.push({ id: idAcak(), tgl: $('#by-tgl').value || L.hariIni(), jumlah: jml, jenis: $('#by-jenis').value, metode: $('#by-metode').value, baru: true });
        delete $('#by-jml').dataset.manual; delete $('#by-jenis').dataset.manual;
        gambarBayar(); gambarRingkas(); setDirty(true);
        toast('Payment recorded. Tap Save to keep it.');
    }
    function hapusBayar(i) {
        var by = ed.s.bayar[i]; if (!confirm('Delete payment ' + L.rupiah(by.jumlah) + ' dated ' + L.tgl(by.tgl) + '?')) return;
        ed.s.bayar.splice(i, 1); gambarBayar(); gambarRingkas(); setDirty(true);
    }
    document.addEventListener('input', function (e) { if (e.target.id === 'by-jml' || e.target.id === 'by-jenis') e.target.dataset.manual = '1'; });


    /* ---------- simpan ---------- */
    function validasi() {
        var s = ed.s;
        if (!String(s.nama).trim()) return 'Customer name is missing.';
        if (String(s.hp).replace(/\D/g, '').length < 8) return 'Phone number is not valid (at least 8 digits).';
        if (ed.s.items.some(function (i) { return !String(i.nama).trim(); })) return 'A work or part line has no name.';
        if (ed.antri.some(function (q) { return !q.hasil; })) return 'Photos are still processing. Please wait a moment.';
        return '';
    }
    function simpanServis() {
        var err = validasi(); if (err) return toast(err, true);
        var baru = ed.baru, statusAwal = ed.s.status;
        var rec = Object.assign({}, ed.s, { nama: String(ed.s.nama).trim(), hp: String(ed.s.hp).trim(), bayar: ed.s.bayar.map(function (x) { var y = Object.assign({}, x); delete y.baru; return y; }) });
        var h = L.hitung(rec, rec.items, rec.bayar);
        if (rec.status === 'menunggu_dp' && h.total > 0 && h.kurangAwal === 0) rec.status = 'antri';
        var fotoBaru = ed.antri.map(function (q) { return { hasil: q.hasil, tahap: q.tahap, tampil: q.tampil }; });
        prosesSimpan('servis', $('#sv-simpan'), teksUnggah(fotoBaru), function () { return A.simpanServis(rec, fotoBaru); }, function (row) {
            lepasAntri(ed.antri); ed = { baru: false, s: salin(row), antri: [] }; cache.stok = A.daftar('stok');
            var pesan = baru ? 'Saved. Service code: ' + row.kode + '. The drop-off receipt can be printed or sent by WhatsApp.' : 'Saved. The customer page updates in about 1 minute.';
            if (statusAwal === 'menunggu_dp' && row.status === 'antri') pesan += ' The status changed to Queued automatically.';
            toast(pesan);
            if (baru) { pindah('#servis/' + row.id); setTimeout(function () { if (confirm('Service code ' + row.kode + '. Print the drop-off receipt + watch tag now?')) cetakTandaTerima(row); }, 300); }
            else gambarServis();
        }, function (r) { lepasAntri(ed.antri); ed = { baru: false, s: r, antri: [] }; cache.stok = A.daftar('stok'); gambarFoto(); });
    }

    /* ---------- kirim WA, artikel, hapus ---------- */
    /* pesan untuk calon pelanggan, dari isian formulir (belum disimpan, tanpa nomor) */
    function kirimCalonServis(jenis) {
        if (jenis === 'estimasi' && !(ed.s.items || []).length) return toast('Add work or parts in the cost section first.', true);
        bukaWa('', L.pesan.calon[jenis](ed.s));
    }
    function kirimWa(jenis) {
        if (dirty) return toast('Save your changes first so the customer sees the latest version.', true);
        if (jenis === 'pengingat') {
            if (ed.s.status !== 'selesai') return toast('Collection reminders are only for jobs marked Done.', true);
            return catatPengingat('servis', ed.s.id);
        }
        bukaWa(ed.s.hp, jenis === 'kabar' ? L.kabarServis(ed.s).pesan : L.pesan[jenis](ed.s));
    }
    function jadikanArtikel() {
        if (dirty) return toast('Save your changes first.', true);
        if (!ed.s.izin_publikasi && !confirm('The customer has not agreed to photos being used in the Journal. Create a draft anyway?')) return;
        var s = ed.s, jasa = s.items.filter(function (i) { return i.jenis !== 'part'; }).map(function (i) { return i.nama.replace(/\s*\+\s*Basic Setup/i, ''); }),
            part = s.items.filter(function (i) { return i.jenis === 'part'; }).map(function (i) { return i.nama; }), gitar = L.namaGitar(s, 'Watch');
        var judul = (jasa[0] || 'Watch Service') + ' ' + (s.arloji_merk || s.arloji_jenis || '') + (s.keluhan ? ': ' + s.keluhan.split(/[.,;\n]/)[0].trim() : '');
        judul = judul.replace(/\s+/g, ' ').trim().slice(0, 110);
        var isi = ['## Condition when it came in', s.keluhan || '(Describe the customer’s problem and the watch’s condition on arrival.)', '', '## What we did']
            .concat(jasa.map(function (x) { return '- ' + x; }), part.map(function (x) { return '- Fitted/replaced: ' + x; }))
            .concat(['', '## Hasil', '(Describe the result: for example, keeps time within spec again, strong power reserve, crystal clear of fog.)'])
            .concat(s.saran ? ['', '## Our advice', s.saran] : [])
            .concat(['', '> Is your watch having a similar problem? Ask us for free on WhatsApp.']).join('\n');
        var urutan = ['arloji', 'sebelum', 'sesudah'], slug = ArtikelMd.slug(judul), n = 1;
        while (cache.artikel.some(function (a) { return a.slug === slug; })) slug = ArtikelMd.slug(judul) + '-' + (++n);
        var peranPoster = {};
        var draf = {
            judul: judul, slug: slug, tag: 'Service Story', status: 'draf', servis_id: s.id, isi: isi,
            ringkasan: ('Result ' + (jasa.join(', ') || 'servis') + ' watch ' + gitar + ' at Jubeliwatch, with before and after photos.').slice(0, 160),
            foto: s.foto.slice().sort(function (a, b) { return urutan.indexOf(L.tahapFoto(a)) - urutan.indexOf(L.tahapFoto(b)); })
                .map(function (f) {
                    var t = L.tahapFoto(f), o = { servis: s.id, foto: f.id, alt: L.TAHAP[t] + ': ' + gitar };
                    if (!peranPoster[t]) { peranPoster[t] = 1; o.poster = t; } /* foto pertama tiap tahap (gitar, sebelum, sesudah) dipakai di poster Story */
                    return o;
                })
        };
        var b = $('#sv-artikel'); sibuk(b, true, 'Creating draft…');
        A.simpanArtikel(draf).then(function (row) {
            taruh('artikel', row); toast('Journal draft created. Polish the text, then publish.');
            pindah('#artikel/' + row.id);
        }).catch(function (e) { sibuk(b, false); gagal(e); });
    }
    function hapusServis() {
        if (konfirmasiKode('Deleting a service job also deletes all its photos and cannot be undone.', ed.s.kode)) hapusData('servis', ed.s, $('#sv-hapus'), function (r) { return A.hapusServis(r).then(function () { cache.stok = A.daftar('stok'); }); }, 'Service job deleted.' + (L.adaStokServis(ed.s) ? ' Parts from stock were returned.' : ''));
    }

    /* ================= beli dengan hak tebus ================= */
    var TB = C.tebus;
    function chipTebus(t) {
        var lewat = t.status === 'aktif' && L.infoTebus(t).lewat;
        var k = lewat ? 'st-menunggu_dp' : ({ aktif: 'st-antri', ditebus: 'st-selesai', milik_toko: 'st-diambil', batal: 'st-batal' })[t.status];
        return '<span class="st-chip ' + k + '">' + (lewat ? 'Past buyback deadline' : E(L.STATUS_TEBUS[t.status].label)) + '</span>';
    }
    function daftarTebus() {
        app.innerHTML = '<section><div class="ly-head"><h1>Buy with buyback right</h1><a class="ly-btn ly-btn--pri" href="#tebus/baru">+ Buy a watch</a></div>' +
            '<p class="ly-muted">The shop <b>buys</b> the watch; the seller may buy it back until the buyback deadline for <b>the same price the shop paid</b> (buyback price = purchase price). The shop earns from watches that are not bought back, never from interest.</p>' +
            '<div id="ingat"></div><div class="ly-filter" id="filter"></div><div class="ly-list" id="list"></div></section>';
        $('#filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { filterTb = b.dataset.f; gambarDaftarTebus(); } });
        $('#ingat').addEventListener('click', function (e) {
            if (e.target.closest('[data-lihat]')) { filterTb = 'aktif'; gambarDaftarTebus(); }
            else if (e.target.closest('[data-lihatktp]')) { filterTb = 'semua'; gambarDaftarTebus(); }
        });
        $('#list').addEventListener('click', function (e) {
            var b = e.target.closest('[data-ingat]'); if (b) { e.preventDefault(); catatPengingat('tebus', b.dataset.ingat, b); return; }
            var k = e.target.closest('[data-hapusktp]'); if (k) { e.preventDefault(); var t = cariId('tebus', k.dataset.hapusktp); if (t) hapusKtp(t, k, gambarDaftarTebus); }
        });
        gambarDaftarTebus();
    }
    function gambarDaftarTebus() {
        if (!$('#list')) return;
        var rows = cache.tebus, n = {}, hari = L.hariIni();
        rows.forEach(function (t) { n[t.status] = (n[t.status] || 0) + 1; });
        $('#filter').innerHTML = [['aktif', 'Buyback period'], ['ditebus', 'Bought back'], ['milik_toko', 'Owned by the shop'], ['batal', 'Cancelled'], ['semua', 'All']].map(function (x) {
            return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (filterTb === x[0]) + '">' + x[1] + '<b>' + (x[0] === 'semua' ? rows.length : n[x[0]] || 0) + '</b></button>';
        }).join('');
        var perlu = rows.filter(function (t) { return L.perluIngatTebus(t, hari); }).length, ktp = rows.filter(function (t) { return L.ktpBisaDihapus(t, hari); });
        $('#ingat').innerHTML = (perlu ? '<div class="ly-ingat"><span>🔔 <b>' + perlu + ' watch(es)</b> are near or past the buyback deadline.</span><button type="button" class="ly-btn ly-btn--sm" data-lihat>View</button></div>' : '') +
            (ktp.length ? '<div class="ly-ingat ly-ingat--info" style="margin-top:8px"><span>🪪 <b>' + ktp.length + ' ID card photo(s)</b> are no longer needed (deal finished or cancelled) and should be deleted.</span><button type="button" class="ly-btn ly-btn--sm" data-lihatktp>View</button></div>' : '');
        var hasil = rows.filter(function (t) { return filterTb === 'semua' || t.status === filterTb; });
        if (filterTb === 'aktif') hasil.sort(function (a, b) { return a.batas_tebus < b.batas_tebus ? -1 : 1; });
        $('#list').innerHTML = hasil.length ? hasil.map(function (t) {
            var i = L.infoTebus(t, hari), akhir = (t.pengingat || []).slice(-1)[0], perluIngat = L.perluIngatTebus(t, hari), ktpHapus = ktp.indexOf(t) > -1;
            var b = [['', 'tanggal', 'Bought: <b>' + L.tgl(t.tgl_beli) + '</b>'], ['', 'uang', 'Purchase price <b>' + L.rupiah(t.harga_beli) + '</b>']];
            if (t.status === 'aktif') b.push([i.lewat ? 'sv-bad' : 'sv-warn', 'jam', i.lewat ? 'Past deadline <b>' + (-i.sisa) + ' days</b> (' + L.tgl(t.batas_tebus) + ')' : 'Buyback deadline ' + L.tgl(t.batas_tebus) + ' (' + i.sisa + ' days left)']);
            if (!t.disetujui) b.push(['sv-warn', 'awas', 'No AGREE reply yet']);
            if (akhir) b.push(['sv-muted', 'lonceng', 'Diingatkan: ' + L.tgl(akhir)]);
            var aksi = (t.status === 'aktif' ? '<button type="button" class="ly-btn ' + (perluIngat ? 'ly-btn--wa' : 'ly-btn--pri') + '" data-ingat="' + E(t.id) + '">' + ikon('amplop') + (perluIngat ? 'Remind via WhatsApp' : 'Send reminder') + '</button>' : '') +
                (ktpHapus ? '<button type="button" class="ly-btn ly-btn--del" data-hapusktp="' + E(t.id) + '">Delete ID photo</button>' : '');
            return kartuIkon({ href: '#tebus/' + E(t.id), kode: E(t.kode), chip: chipTebus(t), judul: t.nama, sub: L.namaGitar(t, 'Watch'), baris: b, aksi: aksi });
        }).join('') : '<p class="ly-kosong">' + (rows.length ? 'Nothing in this category.' : 'No records yet. Tap “+ Buy a watch”.') + '</p>';
    }
    function tebusKosong() {
        var h = L.hariIni();
        return { nama: '', hp: '', nik: '', arloji_jenis: C.jenisArloji[0], arloji_merk: '', warna: '', no_seri: '', kelengkapan: '', tgl_beli: h, harga_beli: 0, batas_tebus: L.tambahHari(h, TB.batasHari), metode: 'tunai', status: 'aktif', disetujui: null, catatan_admin: '', foto: [], pengingat: [] };
    }
    function bukaTebus(id) { ambilCatatan('tebus', id, tebusKosong, function (t) { t.foto = t.foto || []; te = { baru: !id, t: t, antri: [] }; gambarTebus(); }); }
    function gambarTebus() {
        var t = te.t, jenis = C.jenisArloji.slice(); if (t.arloji_jenis && jenis.indexOf(t.arloji_jenis) < 0) jenis.push(t.arloji_jenis);
        app.innerHTML = '<section id="tb" class="ly-f"><div class="ly-head"><a class="ly-back" href="#tebus">‹ Buyback list</a></div>' +
            '<div class="ly-head"><h1>' + (te.baru ? 'Watch bought (buyback right)' : E(L.namaGitar(t, 'Watch'))) + '</h1>' + (te.baru ? '' : chipTebus(t)) + '</div>' +
            (te.baru ? '<p class="ly-muted">The code is created automatically when you save.</p>' : kodeBaris(t)) +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Seller</legend>' +
            '<label>Name (as on ID card)<input data-t="nama" autocomplete="off" required></label>' +
            '<div class="ly-row2"><label>Phone / WhatsApp<input data-t="hp" type="tel" inputmode="tel" autocomplete="off" required></label><label>NIK (KTP number, optional)<input data-t="nik" inputmode="numeric" maxlength="16" autocomplete="off"></label></div>' + tombolKontak('[data-t="nama"]', '[data-t="hp"]') +
            '<p class="ly-hint">On the agreement, only the last 4 digits of the NIK and phone are shown.</p></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Watch</legend>' +
            '<div class="ly-row2"><label>Movement<select data-t="arloji_jenis">' + opsi(jenis, t.arloji_jenis) + '</select></label><label>Brand / model<input data-t="arloji_merk" placeholder="e.g. Tissot PRX"></label></div>' +
            '<div class="ly-row2"><label>Dial colour<input data-t="warna"></label><label>Serial number<input data-t="no_seri" autocapitalize="characters"></label></div>' +
            '<label>Condition &amp; inclusions<textarea data-t="kelengkapan" rows="2" placeholder="e.g. light scratches on the case, original box, papers"></textarea></label></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Price &amp; buyback deadline</legend>' +
            '<div class="ly-row2"><label>Purchase date<input type="date" data-t="tgl_beli"></label><label>Paid by<select data-t="metode">' + opsi([['tunai', 'Cash'], ['transfer', 'Transfer']], t.metode) + '</select></label></div>' +
            '<label>Purchase price = buyback price (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-t="harga_beli"></label>' +
            '<label>Buyback deadline<input type="date" data-t="batas_tebus"></label>' +
            '<div class="ly-btns"><button type="button" class="ly-btn ly-btn--sm" data-batas="30">30 days</button><button type="button" class="ly-btn ly-btn--sm" data-batas="60">60 days</button>' + (TB.maksHari >= 90 ? '<button type="button" class="ly-btn ly-btn--sm" data-batas="90">90 days</button>' : '') + '</div>' +
            '<div class="ly-sum" id="tb-sum"></div></fieldset>' +
            '<fieldset class="ly-card"><legend>Photos</legend><div id="tb-foto"></div><p class="ly-hint" id="tb-ktp-saran" style="margin-top:10px"></p><p class="ly-hint" style="margin-top:6px">Watch photos: dial, caseback, and serial number. ID card photo (optional) for sellers you don’t know or purchases above ' + L.rupiah(TB.fotoKtpMinHarga) + '; delete it ' + Math.round(TB.hapusKtpHari / 30) + ' month(s) after the watch is bought back. All photos are encrypted in the private repo and never appear on the website.</p></fieldset>' +
            '<fieldset class="ly-card ly-f"><legend>Agreement &amp; status</legend>' +
            '<label class="ly-cek"><input type="checkbox" id="tb-setuju"><span>The seller replied <b>AGREE</b> on WhatsApp</span></label>' +
            '<div class="ly-status" id="tb-status"></div>' +
            '<label>Internal note<textarea data-t="catatan_admin" rows="2"></textarea></label></fieldset>' +
            (te.baru ? '' : '<fieldset class="ly-card"><legend>Send &amp; more</legend>' +
                barisWa([['konfirmasi', 'Proof & ask for AGREE', 'Send purchase proof to the seller']]
                    .concat(t.status === 'aktif' ? [['pengingat', 'Buyback reminder', 'Remind them of the buyback deadline']] : [])
                    .concat(t.status === 'ditebus' ? [['ditebus', 'Thank you (bought back)', 'Confirm the watch was bought back']] : [])
                    .concat(t.status === 'milik_toko' ? [['berakhir', 'Buyback period ended', 'Tell them the watch now belongs to the shop']] : []), 'wat') +
                '</fieldset><fieldset class="ly-card"><legend>More actions</legend>' +
                kisiAksi([].concat(t.status === 'milik_toko' && !t.stok_id ? [aksi({ id: 'tb-kestok', ikon: 'stok', teks: 'Add to stock', kelas: 'ly-akt--pri' })] : [])
                    .concat(t.stok_id ? [aksi({ href: '#stok/' + E(t.stok_id), ikon: 'stok', teks: 'View in stock' })] : [])
                    .concat([aksi({ href: 'agreement.html?k=' + encodeURIComponent(t.kode) + '&amp;h=' + encodeURIComponent(L.hp4(t.hp)), luar: true, ikon: 'surat', teks: 'Open / print agreement' }),
                        aksi({ id: 'tb-hapus', ikon: 'hapus', teks: 'Delete record', kelas: 'ly-akt--del' })])) +
                '<p class="ly-hint ly-hint--c">The agreement on the website updates about 1 minute after saving.</p></fieldset>') +
            '<div class="ly-save"><span class="ly-dirty" id="dirty" hidden>Not saved</span><button type="button" class="ly-btn ly-btn--pri" id="tb-simpan">' + (te.baru ? 'Save &amp; create code' : 'Save changes') + '</button></div></section>';
        susunDua(['Persetujuan', 'Kirim', 'More actions']);
        $$('[data-t]', app).forEach(function (el) { var v = t[el.dataset.t]; el.value = v == null ? '' : v; });
        $('#tb-setuju').checked = !!t.disetujui;
        gambarSumTebus(); gambarStatusTebus(); gambarFotoTebus(); setDirty(false);
        var tb = $('#tb');
        function ubah(e) {
            var el = e.target, k = el.dataset.t;
            if (k) { t[k] = k === 'harga_beli' ? Math.max(0, Math.round(+el.value || 0)) : el.value; setDirty(true); if (/harga|batas|tgl_beli/.test(k)) { gambarSumTebus(); saranKtp(); } }
            else if (el.id === 'tb-setuju') { t.disetujui = el.checked ? (t.disetujui || L.hariIni()) : null; setDirty(true); }
        }
        tb.addEventListener('input', ubah); tb.addEventListener('change', ubah);
        tb.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return; var d = b.dataset;
            if (d.batas) { t.batas_tebus = L.tambahHari(t.tgl_beli, +d.batas); $('[data-t="batas_tebus"]').value = t.batas_tebus; gambarSumTebus(); setDirty(true); }
            else if (d.st) ubahStatusTebus(d.st);
            else if (d.wat) { if (dirty) return toast('Save your changes first.', true); if (d.wat === 'pengingat') catatPengingat('tebus', t.id); else bukaWa(t.hp, L.pesanTebus[d.wat](t)); }
            else if (d.hapusfoto) { if (confirm('Delete this photo? (removed permanently when you Save)')) { t.foto = t.foto.filter(function (f) { return f.id !== d.hapusfoto; }); gambarFotoTebus(); setDirty(true); } }
            else if (d.hapusq) { te.antri = buangQ(te.antri, d.hapusq); gambarFotoTebus(); }
            else if (b.hasAttribute('data-hapusktp')) { if (dirty) return toast('Save your changes first.', true); hapusKtp(te.t, b, function (row) { te = { baru: false, t: salin(row), antri: [] }; gambarTebus(); }); }
            else if (b.id === 'tb-kestok') { if (dirty) return toast('Save your changes first.', true); tebusKeStok(te.t, b); }
        });
        pilihFoto($('#tb-foto'), function (tahap, files) { antriFoto(te.antri, files, { tahap: tahap }, gambarFotoTebus); });
        $('#tb-simpan').addEventListener('click', simpanTebus);
        if (!te.baru) $('#tb-hapus').addEventListener('click', hapusTebus);
    }
    function gambarSumTebus() {
        var t = te.t, batasMaks = L.tambahHari(t.tgl_beli, TB.maksHari);
        $('#tb-sum').innerHTML = '<div><span>Buyback period</span><span>' + (t.batas_tebus ? L.hariAntara(t.tgl_beli, t.batas_tebus) + ' days (until ' + L.tgl(t.batas_tebus) + ')' : '–') + '</span></div>' +
            (t.batas_tebus > batasMaks ? '<div class="ly-warn"><span>The buyback deadline is more than ' + TB.maksHari + ' days.</span><span></span></div>' : '');
    }
    function gambarStatusTebus() {
        $('#tb-status').innerHTML = ['aktif', 'ditebus', 'milik_toko', 'batal'].map(function (k) { return '<button type="button" data-st="' + k + '" aria-pressed="' + (te.t.status === k) + '">' + E(L.STATUS_TEBUS[k].label) + '</button>'; }).join('');
    }
    function ubahStatusTebus(st) {
        var t = te.t; if (st === t.status) return;
        if (st === 'milik_toko' && !L.infoTebus(t).lewat && !confirm('The buyback deadline (' + L.tgl(t.batas_tebus) + ') has not passed. Only make it shop property if the seller has said in writing that they won’t buy it back. Continue?')) return;
        if (st === 'ditebus' && !confirm('Has the seller paid ' + L.rupiah(L.hargaTebus(t)) + ' and taken the watch back?')) return;
        if (st === 'batal' && !confirm('Cancel this deal? The agreement on the website will be removed.')) return;
        t.status = st; gambarStatusTebus(); setDirty(true);
    }
    function gambarFotoTebus() {
        var el = $('#tb-foto'); if (!el) return;
        el.innerHTML = [['arloji', 'Watch photos'], ['ktp', 'ID card photo (optional)']].map(function (x) { return grupFoto(x[1], x[0], te.t.foto, te.antri, false); }).join('');
        L.isiFoto(el, te.t, A.fotoAdmin);
        saranKtp();
    }
    /* saran foto KTP untuk harga besar; tawaran hapus foto KTP setelah masa simpannya lewat */
    function saranKtp() {
        var el = $('#tb-ktp-saran'), t = te.t; if (!el) return;
        var adaKtp = L.adaKtp(t) || te.antri.some(function (q) { return q.tahap === 'ktp'; });
        if (!te.baru && L.ktpBisaDihapus(t)) {
            el.innerHTML = '<span class="ly-warn">' + (t.status === 'batal' ? 'Deal cancelled' : 'Already ' + L.hariAntara(t.tgl_tebus, L.hariIni()) + ' days since it was bought back') + ': the ID card photo is no longer needed.</span> <button type="button" class="ly-btn ly-btn--sm" data-hapusktp>Delete ID photo</button>';
        } else if (!adaKtp && t.harga_beli > TB.fotoKtpMinHarga) {
            el.innerHTML = '<span class="ly-warn">Purchase price above ' + L.rupiah(TB.fotoKtpMinHarga) + ': photograph the seller’s ID card.</span>';
        } else el.innerHTML = '';
    }
    function hapusKtp(t, btn, selesai) {
        if (!confirm('Delete ID card photo ' + t.nama + ' (' + t.kode + ')? The name and NIK stay on record.')) return;
        var rec = salin(t); rec.foto = (rec.foto || []).filter(function (f) { return f.tahap !== 'ktp'; });
        if (btn) sibuk(btn, true, 'Deleting…');
        A.simpanTebus(rec).then(function (row) {
            taruh('tebus', row); toast('ID card photo deleted.'); selesai(row);
        }).catch(function (e) { if (btn) sibuk(btn, false); gagal(e); });
    }
    function simpanTebus() {
        var t = te.t;
        t.nama = String(t.nama).trim(); t.hp = String(t.hp).trim();
        if (!t.nama) return toast('Seller name is missing.', true);
        if (t.hp.replace(/\D/g, '').length < 8) return toast('Phone number is not valid (at least 8 digits).', true);
        if (!(t.harga_beli > 0)) return toast('Purchase price is missing.', true);
        if (!t.batas_tebus || t.batas_tebus < t.tgl_beli) return toast('The buyback deadline must be after the purchase date.', true);
        if (te.antri.some(function (q) { return !q.hasil; })) return toast('Photos are still processing. Please wait a moment.', true);
        var baru = te.baru, fotoBaru = te.antri.map(function (q) { return { hasil: q.hasil, tahap: q.tahap }; });
        prosesSimpan('tebus', $('#tb-simpan'), teksUnggah(fotoBaru), function () { return A.simpanTebus(t, fotoBaru); }, function (row) {
            lepasAntri(te.antri); te = { baru: false, t: salin(row), antri: [] };
            toast(baru ? 'Saved. Code: ' + row.kode + '. Send the proof to the seller with the WhatsApp button.' : 'Saved.');
            if (baru) pindah('#tebus/' + row.id); else gambarTebus();
        }, function (r) { lepasAntri(te.antri); te = { baru: false, t: r, antri: [] }; gambarFotoTebus(); });
    }
    function hapusTebus() {
        if (konfirmasiKode('Deleting this record also deletes the watch and ID photos and the agreement. This cannot be undone.', te.t.kode)) hapusData('tebus', te.t, $('#tb-hapus'), A.hapusTebus, 'Record deleted.');
    }

    /* ================= titip jual: gitar milik orang lain yang kita jualkan (owner saja) =================
       Tahap 1: terima titipan, surat (WA + cetak), foto kondisi, masuk ke stok. Gitar titipan belum bisa dijual lewat Kasir (L.titipanTerkunci). */
    var tp = null, filterTp = 'aktif';
    var ANGKA_TP = { harga_jual: 1, harga_min: 1, komisi_min: 1, batas_mahal: 1, komisi_persen: 2, persen_mahal: 2 };
    function chipTitip(t) {
        var tinjau = t.status === 'aktif' && L.perluTinjauTitip(t);
        var k = tinjau ? 'st-menunggu_dp' : ({ aktif: 'st-antri', diambil: 'st-diambil', batal: 'st-batal' })[t.status];
        return '<span class="st-chip ' + k + '">' + (tinjau ? 'Review price' : E(L.STATUS_TITIP[t.status] || t.status)) + '</span>';
    }
    function daftarTitip() {
        app.innerHTML = '<section><div class="ly-head"><h1>Consignment</h1><a class="ly-btn ly-btn--pri" href="#titip/baru">+ Take in a consignment</a></div>' +
            '<p class="ly-muted">Watches owned by others that we sell for them. Shop commission: ' + E(L.ringkasKomisiTitip(L.komisiBawaanTitip())) + ' (can be changed per owner). Owner details and minimum prices are only visible to the shop owner.</p>' +
            '<div class="ly-filter" id="filter"></div><div class="ly-list" id="list"></div></section>';
        $('#filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { filterTp = b.dataset.f; gambarDaftarTitip(); } });
        gambarDaftarTitip();
    }
    function gambarDaftarTitip() {
        if (!$('#list')) return;
        var rows = cache.titip, hari = L.hariIni(), n = { aktif: 0, tinjau: 0, diambil: 0, batal: 0 };
        rows.forEach(function (t) { n[t.status] = (n[t.status] || 0) + 1; if (L.perluTinjauTitip(t, hari)) n.tinjau++; });
        $('#filter').innerHTML = [['aktif', 'On consignment'], ['tinjau', 'Needs review'], ['diambil', 'Collected'], ['batal', 'Cancelled'], ['semua', 'All']].map(function (x) {
            return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (filterTp === x[0]) + '">' + x[1] + '<b>' + (x[0] === 'semua' ? rows.length : n[x[0]] || 0) + '</b></button>';
        }).join('');
        var hasil = rows.filter(function (t) { return filterTp === 'semua' ? true : filterTp === 'tinjau' ? L.perluTinjauTitip(t, hari) : t.status === filterTp; });
        $('#list').innerHTML = hasil.length ? hasil.map(function (t) {
            return kartuIkon({ href: '#titip/' + E(t.id), kode: E(t.kode), chip: chipTitip(t), judul: t.nama, sub: L.namaGitar(t, 'Watch'),
                baris: [['', 'tanggal', 'In: <b>' + L.tgl(t.tgl_masuk) + '</b>' + (t.status === 'aktif' ? ' (' + L.hariTitip(t, hari) + ' days)' : '')], ['', 'uang', 'Price <b>' + L.rupiah(t.harga_jual) + '</b>']] });
        }).join('') : '<p class="ly-kosong">' + (rows.length ? 'Nothing in this category.' : 'No consignments yet. Tap “+ Take in a consignment”.') + '</p>';
    }
    function titipKosong() {
        return Object.assign({ nama: '', hp: '', nik: '', arloji_jenis: C.jenisArloji[0], arloji_merk: '', warna: '', no_seri: '', kelengkapan: '', tgl_masuk: L.hariIni(), harga_jual: 0, harga_min: 0,
            status: 'aktif', disetujui: null, catatan_admin: '', foto: [], pengingat: [] }, L.komisiBawaanTitip());
    }
    function bukaTitip(id) { ambilCatatan('titip', id, titipKosong, function (t) { t.foto = t.foto || []; tp = { baru: !id, t: t, antri: [] }; gambarTitip(); }); }
    function gambarTitip() {
        var t = tp.t, jenis = C.jenisArloji.slice(); if (t.arloji_jenis && jenis.indexOf(t.arloji_jenis) < 0) jenis.push(t.arloji_jenis);
        app.innerHTML = '<section id="tp" class="ly-f"><div class="ly-head"><a class="ly-back" href="#titip">‹ Consignment</a></div>' +
            '<div class="ly-head"><h1>' + (tp.baru ? 'Take in a consignment' : E(L.namaGitar(t, 'Watch'))) + '</h1>' + (tp.baru ? '' : chipTitip(t)) + '</div>' +
            (tp.baru ? '<p class="ly-muted">The code is created automatically when you save.</p>' : kodeBaris(t, '')) +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Owner</legend>' +
            '<label>Name<input data-t="nama" autocomplete="off" required></label>' +
            '<div class="ly-row2"><label>Phone / WhatsApp<input data-t="hp" type="tel" inputmode="tel" autocomplete="off" required></label><label>NIK / KTP number (optional)<input data-t="nik" inputmode="numeric" maxlength="16" autocomplete="off"></label></div>' + tombolKontak('[data-t="nama"]', '[data-t="hp"]') +
            '<p class="ly-hint">The NIK and ID card photo are optional. If entered, they are stored only in the owner repo and never appear on the website.</p></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Watch</legend>' +
            '<div class="ly-row2"><label>Movement<select data-t="arloji_jenis">' + opsi(jenis, t.arloji_jenis) + '</select></label><label>Brand / model<input data-t="arloji_merk" placeholder="e.g. Tissot PRX"></label></div>' +
            '<div class="ly-row2"><label>Dial colour<input data-t="warna"></label><label>Serial number<input data-t="no_seri" autocapitalize="characters"></label></div>' +
            '<label>Condition &amp; inclusions (becomes the catalogue description)<textarea data-t="kelengkapan" rows="2" placeholder="e.g. light scratches on the case, original box, papers"></textarea></label></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Price &amp; commission</legend>' +
            '<label>Consignment date<input type="date" data-t="tgl_masuk"></label>' +
            '<div class="ly-row2"><label>Selling price (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-t="harga_jual"></label><label>Minimum price (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-t="harga_min"></label></div>' +
            '<p class="ly-hint">Only the shop owner sees the minimum price. The shop never sells below it, and it is the compensation amount if the watch is damaged or lost through the shop’s negligence.</p>' +
            '<div class="ly-row2"><label>Shop commission (%)<input type="number" inputmode="decimal" min="0" max="100" step="0.5" data-t="komisi_persen"></label><label>Minimum commission (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-t="komisi_min"></label></div>' +
            '<div class="ly-row2"><label>Selling price above (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-t="batas_mahal"></label><label>Commission above that (%)<input type="number" inputmode="decimal" min="0" max="100" step="0.5" data-t="persen_mahal"></label></div>' +
            '<div class="ly-sum" id="tp-sum"></div></fieldset>' +
            '<fieldset class="ly-card"><legend>Photos</legend><div id="tp-foto"></div><p class="ly-hint" style="margin-top:10px">Condition photos (dial, caseback, any existing marks) are taken when the watch arrives as proof of condition. The watch photos are reused as product photos when it is added to stock. The ID card photo is optional. All photos are encrypted in the owner repo.</p></fieldset>' +
            '<fieldset class="ly-card ly-f"><legend>Agreement &amp; status</legend>' +
            '<label class="ly-cek"><input type="checkbox" id="tp-setuju"><span>The owner replied <b>AGREE</b> on WhatsApp</span></label>' +
            '<div class="ly-status" id="tp-status"></div>' +
            '<label>Internal note<textarea data-t="catatan_admin" rows="2"></textarea></label></fieldset>' +
            (tp.baru ? '' : '<fieldset class="ly-card"><legend>Send &amp; more</legend>' +
                barisWa([['konfirmasi', 'Consignment terms & ask for AGREE', 'Send the consignment terms to the owner']]
                    .concat(t.status === 'aktif' ? [['pengingat', 'Review price', 'Ask the owner about the selling price']] : [])
                    .concat(t.status === 'diambil' ? [['diambil', 'Watch returned to owner', 'Confirm the owner has collected the watch']] : []), 'wat') +
                '</fieldset><fieldset class="ly-card"><legend>More actions</legend>' +
                kisiAksi([].concat(t.status === 'aktif' && !t.stok_id ? [aksi({ id: 'tp-kestok', ikon: 'stok', teks: 'Add to stock &amp; catalogue', kelas: 'ly-akt--pri' })] : [])
                    .concat(t.stok_id ? [aksi({ href: '#stok/' + E(t.stok_id), ikon: 'stok', teks: 'View in stock' })] : [])
                    .concat([aksi({ id: 'tp-cetak', ikon: 'cetak', teks: 'Print consignment receipt' }), aksi({ id: 'tp-hapus', ikon: 'hapus', teks: 'Delete record', kelas: 'ly-akt--del' })])) +
                '<p class="ly-hint ly-hint--c">Selling through Checkout and paying the owner are coming soon.</p></fieldset>') +
            '<div class="ly-save"><span class="ly-dirty" id="dirty" hidden>Not saved</span><button type="button" class="ly-btn ly-btn--pri" id="tp-simpan">' + (tp.baru ? 'Save &amp; create code' : 'Save changes') + '</button></div></section>';
        susunDua(['Persetujuan', 'Kirim', 'More actions']);
        $$('[data-t]', app).forEach(function (el) { var v = t[el.dataset.t]; el.value = v == null ? '' : v; });
        $('#tp-setuju').checked = !!t.disetujui;
        gambarSumTitip(); gambarStatusTitip(); gambarFotoTitip(); setDirty(false);
        var f = $('#tp');
        function ubah(e) {
            var el = e.target, k = el.dataset.t;
            if (k) {
                var m = ANGKA_TP[k];
                t[k] = m === 1 ? Math.max(0, Math.round(+el.value || 0)) : m === 2 ? Math.max(0, Math.min(100, +el.value || 0)) : el.value;
                setDirty(true); if (m) gambarSumTitip();
            } else if (el.id === 'tp-setuju') { t.disetujui = el.checked ? (t.disetujui || L.hariIni()) : null; setDirty(true); }
        }
        f.addEventListener('input', ubah); f.addEventListener('change', ubah);
        f.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return; var d = b.dataset;
            if (d.st) ubahStatusTitip(d.st);
            else if (d.wat) { if (dirty) return toast('Save your changes first.', true); if (d.wat === 'pengingat') ingatTitip(b); else bukaWa(t.hp, L.pesanTitip[d.wat](t)); }
            else if (d.hapusfoto) { if (confirm('Delete this photo? (removed permanently when you Save)')) { t.foto = t.foto.filter(function (x) { return x.id !== d.hapusfoto; }); gambarFotoTitip(); setDirty(true); } }
            else if (d.hapusq) { tp.antri = buangQ(tp.antri, d.hapusq); gambarFotoTitip(); }
            else if (b.id === 'tp-kestok') { if (dirty) return toast('Save your changes first.', true); titipKeStok(tp.t, b); }
            else if (b.id === 'tp-cetak') { if (dirty) return toast('Save your changes first.', true); cetakBaris(L.strukTitip(t)); }
        });
        pilihFoto($('#tp-foto'), function (tahap, files) { antriFoto(tp.antri, files, { tahap: tahap }, gambarFotoTitip); });
        $('#tp-simpan').addEventListener('click', simpanTitip);
        if (!tp.baru) $('#tp-hapus').addEventListener('click', hapusTitip);
    }
    function gambarSumTitip() {
        var t = tp.t, el = $('#tp-sum'); if (!el) return;
        var baris = [['Sold at the selling price', t.harga_jual]];
        if (t.harga_min > 0 && t.harga_min < t.harga_jual) baris.push(['Sold at the minimum price', t.harga_min]);
        el.innerHTML = baris.filter(function (b) { return b[1] > 0; }).map(function (b) {
            var h = L.hitungKomisiTitip(t, b[1]);
            return '<div><span>' + b[0] + ' ' + L.rupiah(b[1]) + ': shop commission</span><span>' + L.rupiah(h.komisi) + '</span></div><div><span>Owner’s share</span><span>' + L.rupiah(h.bagianPemilik) + '</span></div>';
        }).join('') + (t.harga_min > t.harga_jual && t.harga_jual > 0 ? '<div class="ly-warn"><span>The minimum price is higher than the selling price.</span><span></span></div>' : '');
    }
    function gambarStatusTitip() {
        $('#tp-status').innerHTML = ['aktif', 'diambil', 'batal'].map(function (k) { return '<button type="button" data-st="' + k + '" aria-pressed="' + (tp.t.status === k) + '">' + E(L.STATUS_TITIP[k]) + '</button>'; }).join('');
    }
    function ubahStatusTitip(st) {
        var t = tp.t; if (st === t.status) return;
        if (st === 'diambil' && !confirm('Has the owner taken their watch back? It will be removed from stock and the catalogue.')) return;
        if (st === 'batal' && !confirm('Cancel this consignment? The watch will be removed from stock and the catalogue.')) return;
        t.status = st; gambarStatusTitip(); setDirty(true);
    }
    function gambarFotoTitip() {
        var el = $('#tp-foto'); if (!el) return;
        el.innerHTML = [['arloji', 'Watch condition photos'], ['ktp', 'ID card photo (optional)']].map(function (x) { return grupFoto(x[1], x[0], tp.t.foto, tp.antri, false); }).join('');
        L.isiFoto(el, tp.t, A.fotoAdmin);
    }
    /* titipan yang sudah diambil atau dibatalkan: gitarnya ditarik dari stok (hilang dari katalog). Gagal di sini tidak menggagalkan simpanan titipan */
    function tarikStokTitip(row) {
        var s = row.status !== 'aktif' && row.stok_id && cariId('stok', row.stok_id);
        if (!s || s.status === 'ditarik') return Promise.resolve(row);
        var r = salin(s); r.status = 'ditarik'; r.tampil = false;
        return A.simpanStok(r).then(function (x) { taruh('stok', x); return row; }, function (e) { toast('Consignment saved, but the stock item was not removed from the catalogue: ' + (e.message || e) + ' Remove it manually in the Stock menu.', true); return row; });
    }
    function simpanTitip() {
        var t = tp.t;
        t.nama = String(t.nama).trim(); t.hp = String(t.hp).trim(); t.nik = String(t.nik || '').replace(/\D/g, '');
        if (!t.nama) return toast('Owner name is missing.', true);
        if (t.hp.replace(/\D/g, '').length < 8) return toast('Phone number is not valid (at least 8 digits).', true);
        if (!String(t.arloji_merk).trim()) return toast('Watch brand / model is missing.', true);
        if (!(t.harga_jual > 0)) return toast('Selling price is missing.', true);
        if (!(t.harga_min > 0) || t.harga_min > t.harga_jual) return toast('The minimum price is required and cannot be higher than the selling price.', true);
        if (tp.antri.some(function (q) { return !q.hasil; })) return toast('Photos are still processing. Please wait a moment.', true);
        var baru = tp.baru, fotoBaru = tp.antri.map(function (q) { return { hasil: q.hasil, tahap: q.tahap }; });
        prosesSimpan('titip', $('#tp-simpan'), teksUnggah(fotoBaru), function () { return A.simpanTitip(t, fotoBaru).then(tarikStokTitip); }, function (row) {
            lepasAntri(tp.antri); tp = { baru: false, t: salin(row), antri: [] };
            toast(baru ? 'Saved. Code: ' + row.kode + '. Send the consignment terms to the owner with the WhatsApp button.' : 'Saved.');
            if (baru) pindah('#titip/' + row.id); else gambarTitip();
        }, function (r) { lepasAntri(tp.antri); tp = { baru: false, t: r, antri: [] }; gambarFotoTitip(); });
    }
    /* buka WA dulu (harus langsung dari ketukan), lalu catat tanggal tinjau di data */
    function ingatTitip(btn) {
        var t = tp.t; bukaWa(t.hp, L.pesanTitip.pengingat(t));
        var rec = salin(t); rec.pengingat = (rec.pengingat || []).concat(L.hariIni());
        sibuk(btn, true, 'Recording…');
        A.simpanTitip(rec).then(function (row) { taruh('titip', row); toast('Price review logged (' + L.tgl(L.hariIni()) + ').'); tp = { baru: false, t: salin(row), antri: [] }; gambarTitip(); })
            .catch(function (e) { sibuk(btn, false); if (e.bentrok) return tawarMuatUlang(e); gagal(e); });
    }
    function hapusTitip() {
        if (konfirmasiKode('Deleting this record also deletes the condition and ID photos. Stock already created from this consignment is not deleted. This cannot be undone.', tp.t.kode)) hapusData('titip', tp.t, $('#tp-hapus'), A.hapusTitip, 'Record deleted.');
    }
    /* titipan -> stok bekas (foto gitar ikut dipindah, KTP tidak). Stok hanya membawa penanda sumber_titip: tanpa nama, HP, atau harga minimum, dan modal 0 karena gitar bukan milik toko */
    function titipKeStok(t, btn) {
        var fotoGitar = (t.foto || []).filter(function (f) { return f.tahap === 'arloji'; });
        sibuk(btn, true, 'Moving…');
        /* bila langkah kedua (menautkan ke data titipan) pernah gagal, stoknya sudah ada: cukup ditautkan, jangan dibuat dua kali */
        var sudah = cache.stok.filter(function (x) { return x.sumber_titip === t.id; })[0];
        (sudah ? Promise.resolve(sudah) : Promise.all(fotoGitar.map(function (f) { return Promise.all([A.fotoBlob(t, f, true), A.fotoBlob(t, f, false)]).then(function (b) { return { hasil: { besar: b[0], kecil: b[1] } }; }); }))
            .then(function (fotoBaru) {
                var rec = Object.assign(stokKosong(), { kondisi: 'bekas', arloji_jenis: t.arloji_jenis, arloji_merk: t.arloji_merk, warna: t.warna, no_seri: t.no_seri, deskripsi: t.kelengkapan, harga_jual: t.harga_jual, harga_beli: 0, asal: 'Consignment ' + t.kode, sumber_titip: t.id, tgl_masuk: t.tgl_masuk });
                return A.simpanStok(rec, fotoBaru);
            })).then(function (row) {
                taruh('stok', row);
                var tr = salin(t); tr.stok_id = row.id;
                return A.simpanTitip(tr).then(function (t2) {
                    taruh('titip', t2);
                    setDirty(false); toast('Added to stock (' + row.kode + '). Set the condition grade and description there.'); pindah('#stok/' + row.id);
                });
            }).catch(function (e) { sibuk(btn, false); gagal(e); });
    }

    /* ================= jual stok: lunas, atau DP lalu pelunasan ================= */
    var jl = null, filterJl = 'aktif', cariJl = '';
    var CHIP_JUAL = { dp: 'st-menunggu_dp', lunas: 'st-selesai', selesai: 'st-diambil', batal: 'st-batal' };
    function chipJual(j) { return '<span class="st-chip ' + CHIP_JUAL[j.status] + '">' + E(j.status === 'batal' && j.batal_oleh === 'tukar' ? 'Ditukar' : L.STATUS_JUAL[j.status] || j.status) + '</span>'; }
    function daftarJual() {
        app.innerHTML = '<section><div class="ly-head"><h1>Sales</h1><a class="ly-btn ly-btn--pri" href="#stok">+ Sell from stock</a></div>' +
            '<p class="ly-muted">Pick an item in <a href="#stok">Stock</a> and tap “Sell / reserve with deposit”. Items with a deposit are held (stock goes down and they leave the catalogue) until paid in full or cancelled.</p>' +
            '<div class="ly-cari"><input class="ly-in" id="cari" type="search" placeholder="Search code, buyer, item…" autocomplete="off"></div>' +
            '<div class="ly-filter" id="filter"></div><div class="ly-list" id="list"></div></section>';
        $('#cari').value = cariJl;
        $('#cari').addEventListener('input', function () { cariJl = this.value; gambarDaftarJual(); });
        $('#filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { filterJl = b.dataset.f; gambarDaftarJual(); } });
        gambarDaftarJual();
    }
    function gambarDaftarJual() {
        if (!$('#list')) return;
        var rows = cache.jual, c = cariJl.trim().toLowerCase(), n = { aktif: 0, dp: 0, lunas: 0, selesai: 0, batal: 0, ingat: 0 };
        rows.forEach(function (j) { n[j.status] = (n[j.status] || 0) + 1; if (j.status === 'dp' || j.status === 'lunas') n.aktif++; if (L.perluIngatJual(j)) n.ingat++; });
        $('#filter').innerHTML = [['aktif', 'Ongoing'], ['ingat', 'Needs a reminder'], ['dp', 'Deposit'], ['lunas', 'Paid, not collected'], ['selesai', 'Done'], ['batal', 'Cancelled'], ['semua', 'All']].map(function (x) {
            return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (filterJl === x[0]) + '">' + x[1] + '<b>' + (x[0] === 'semua' ? rows.length : n[x[0]] || 0) + '</b></button>';
        }).join('');
        var hasil = rows.filter(function (j) {
            var ok = filterJl === 'semua' ? true : filterJl === 'aktif' ? (j.status === 'dp' || j.status === 'lunas') : filterJl === 'ingat' ? L.perluIngatJual(j) : j.status === filterJl;
            return ok && (!c || [j.kode, j.nama, j.hp, L.namaJual(j)].join(' ').toLowerCase().indexOf(c) > -1);
        });
        $('#list').innerHTML = hasil.length ? hasil.map(function (j) {
            var h = L.hitungJual(j), i = L.infoJual(j), b = [['', 'tanggal', 'Date: <b>' + L.tgl(j.tgl) + '</b>'], ['', 'uang', 'Total <b>' + L.rupiah(h.total) + '</b>']];
            if (j.status === 'dp') {
                b.push(['sv-bad', 'uang', 'Balance <b>' + L.rupiah(h.sisa) + '</b>']);
                b.push([i.lewat ? 'sv-bad' : 'sv-warn', 'jam', 'Pay by ' + L.tgl(j.batas_lunas) + (i.lewat ? ' <b>(overdue)</b>' : i.sisa != null ? ' (' + i.sisa + ' days left)' : '')]);
                if (!j.disetujui && j.hp) b.push(['sv-warn', 'awas', 'No AGREE reply yet']);
            }
            return kartuIkon({ href: '#jual/' + E(j.id), kode: E(j.kode), kodeIkon: 'nota', chip: chipJual(j), judul: j.nama || 'Walk-in customer', sub: L.namaJual(j), baris: b });
        }).join('') : '<p class="ly-kosong">' + (rows.length ? 'Nothing in this category.' : 'No sales yet. Pick an item in Stock and tap “Sell / reserve with deposit”.') + '</p>';
    }
    /* transaksi baru dari satu barang stok (#jual/baru/<id stok>) */
    function jualBaru(stokId) { ambilCatatan('stok', stokId, function () { return null; }, formJual); }
    function formJual(s) {
        if (L.titipanTerkunci(s)) { app.innerHTML = '<p class="ly-kosong">Stock item ' + E(s.kode) + ' is a consigned watch. Selling consigned watches through Checkout is not available yet (coming soon). <a href="#stok/' + E(s.id) + '">Back</a></p>'; return; }
        if (!(+s.jumlah > 0) || s.status === 'ditarik' || L.sewaAktifStok(s.id, cache.sewa)) { app.innerHTML = '<p class="ly-kosong">Stock item ' + E(s.kode) + ' is not available right now (sold out, withdrawn, or rented out). <a href="#stok/' + E(s.id) + '">Back</a></p>'; return; }
        var h = L.hariIni(), nama = L.judulStok(s) + (s.warna ? ' (' + s.warna + ')' : '') + (s.kondisi === 'bekas' ? ' – Used' + (L.tingkatStok(s) ? ' ' + L.tingkatStok(s) : '') : '');
        jl = { baru: true, stok: s, j: { nama: '', hp: '', tgl: h, items: [{ stok_id: s.id, kode: s.kode, nama: nama, qty: 1, harga: +s.harga_jual || 0 }], bayar: [], catatan: '', batas_lunas: L.tambahHari(h, C.jual.batasHari) } };
        app.innerHTML = '<section id="jl" class="ly-f"><div class="ly-head"><a class="ly-back" href="#stok/' + E(s.id) + '">‹ ' + E(s.kode) + '</a></div>' +
            '<div class="ly-head"><h1>Sell / reserve with deposit</h1></div>' +
            '<fieldset class="ly-card ly-f"><legend>Item</legend><p style="margin:0"><b>' + E(nama) + '</b><br><small class="ly-muted">' + E(s.kode) + ' · stock ' + s.jumlah + ' · price ' + L.rupiah(s.harga_jual) + '</small></p>' +
            '<div class="ly-row2"><label>Qty<input type="number" inputmode="numeric" min="1" max="' + s.jumlah + '" id="jb-qty" value="1"' + (+s.jumlah > 1 ? '' : ' disabled') + '></label>' +
            '<label>Agreed price per unit (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="jb-harga"></label></div></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid ly-grid--2"><legend>Buyer</legend><div class="ly-row2"><label>Name<input id="jb-nama" autocomplete="off"></label>' +
            '<label>WhatsApp number<input id="jb-hp" type="tel" inputmode="tel" autocomplete="off" placeholder="08…"></label></div>' + tombolKontak('#jb-nama', '#jb-hp') +
            '<p class="ly-hint" style="margin:0">Required for a deposit (receipt and reminders go by WhatsApp). Can be left empty for a sale paid in full.</p></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Payment now</legend><div class="ly-row2"><label>Amount paid (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="jb-bayar"></label>' +
            '<label>Metode<select id="jb-metode">' + opsi([['tunai', 'Cash'], ['transfer', 'Transfer'], ['qris', 'QRIS']], 'tunai') + '</select></label></div>' +
            '<div class="ly-row2"><label>Date<input type="date" id="jb-tgl"></label><label id="jb-batas-l">Pay balance by<input type="date" id="jb-batas"></label></div>' +
            '<label>Note (optional)<input id="jb-ket" placeholder="e.g. free spare strap, shipped by courier"></label>' +
            '<div id="jb-ambil-l"><label class="ly-cek"><input type="checkbox" id="jb-ambil" checked><span>Item taken or shipped now (sale complete)</span></label></div>' +
            '<div class="ly-sum" id="jb-sum"></div></fieldset>' +
            '<div class="ly-save"><button type="button" class="ly-btn ly-btn--pri" id="jb-simpan">Save</button></div></section>';
        susunDua(['Payments']);
        $('#jb-harga').value = jl.j.items[0].harga || ''; $('#jb-tgl').value = h; $('#jb-batas').value = jl.j.batas_lunas; $('#jb-bayar').value = jl.j.items[0].harga || '';
        function baca() {
            var j = jl.j, it = j.items[0];
            it.qty = Math.max(1, Math.min(+s.jumlah, Math.round(+$('#jb-qty').value || 1))); it.harga = Math.max(0, Math.round(+$('#jb-harga').value || 0));
            j.nama = $('#jb-nama').value.trim(); j.hp = $('#jb-hp').value.trim(); j.tgl = $('#jb-tgl').value || h; j.batas_lunas = $('#jb-batas').value; j.catatan = $('#jb-ket').value.trim();
            var bayar = Math.max(0, Math.round(+$('#jb-bayar').value || 0));
            j.bayar = bayar ? [{ id: idAcak(), tgl: j.tgl, jumlah: bayar, jenis: 'dp', metode: $('#jb-metode').value }] : [];
            var hh = L.hitungJual(j), dp = !hh.lunas;
            if (!dp && j.bayar[0]) j.bayar[0].jenis = 'pelunasan';
            $('#jb-batas-l').hidden = !dp; $('#jb-ambil-l').hidden = dp;
            if (dp) delete j.status; else if ($('#jb-ambil').checked) j.status = 'selesai'; else delete j.status;
            $('#jb-sum').innerHTML = '<div><span>Total</span><span>' + L.rupiah(hh.total) + '</span></div><div><span>Paid now</span><span>' + L.rupiah(hh.dibayar) + '</span></div>' +
                (dp ? '<div class="ly-total"><span>Balance (deposit, item held until ' + L.tgl(j.batas_lunas) + ')</span><span>' + L.rupiah(hh.sisa) + '</span></div>' +
                    '<div><span>If cancelled: fee ' + C.jual.potonganPersen + '% (no more than the deposit)</span><span>' + L.rupiah(hh.potongan) + '</span></div>'
                    : '<div class="ly-total"><span>Paid in full' + (hh.dibayar > hh.total ? ' (change ' + L.rupiah(hh.dibayar - hh.total) + ')' : '') + '</span><span>✅</span></div>');
            setDirty(true);
        }
        $('#jl').addEventListener('input', baca); $('#jl').addEventListener('change', baca); baca(); setDirty(false);
        $('#jb-simpan').addEventListener('click', function () {
            baca(); var j = jl.j, hh = L.hitungJual(j);
            if (!hh.total) return toast('Enter the agreed price.', true);
            if (!hh.lunas && (!j.nama || L.hp4(j.hp).length < 4)) return toast('For a deposit, enter the buyer’s name and WhatsApp number.', true);
            if (!hh.lunas && !hh.dibayar && !confirm('No payment yet. Hold the item for this buyer anyway?')) return;
            if (!hh.lunas && (!j.batas_lunas || j.batas_lunas < j.tgl)) return toast('The pay-by date is not valid.', true);
            if (hh.dibayar > hh.total) { j.bayar[0].jumlah = hh.total; }
            if (j.items[0].harga < (+s.harga_beli || 0) && !confirm('The agreed price is below cost. Save anyway?')) return;
            prosesSimpan('jual', $('#jb-simpan'), 'Saving…', function () { return A.simpanJual(j); }, function (row) {
                cache.stok = A.daftar('stok');
                toast(row.status === 'dp' ? 'Order saved (' + row.kode + '). Send the deposit receipt to the buyer.' : 'Sale saved (' + row.kode + ').');
                pindah('#jual/' + row.id);
            }, function (r) { jl.j = r; });
        });
    }
    function bukaJual(id) { ambilCatatan('jual', id, function () { return null; }, function (j) { j.bayar = j.bayar || []; jl = { baru: false, j: j }; gambarJual2(); }); }
    function gambarJual2() {
        var j = jl.j, h = L.hitungJual(j), i = L.infoJual(j), aktif = j.status === 'dp' || j.status === 'lunas', adaHp = L.hp4(j.hp).length === 4, kt = L.kreditTukar(j);
        app.innerHTML = '<section id="jl" class="ly-f"><div class="ly-head"><a class="ly-back" href="#jual">‹ Sales</a></div>' +
            '<div class="ly-head"><h1>' + E(j.nama || 'Walk-in customer') + '</h1>' + chipJual(j) + '</div>' + kodeBaris(j, adaHp ? null : '') +
            '<fieldset class="ly-card"><legend>Items</legend><div class="ly-bayar">' + j.items.map(function (it) {
                return '<div><span>' + (it.stok_id ? '<a href="#stok/' + E(it.stok_id) + '">' + E(it.kode) + '</a>' : '<i>Service</i>') + ' · ' + E(it.nama) + (it.qty > 1 ? ' ×' + it.qty : '') + '</span><b>' + L.rupiah(it.harga * it.qty) + '</b></div>';
            }).join('') + '</div>' + (j.catatan ? '<p class="ly-hint" style="margin:8px 0 0">' + E(j.catatan) + '</p>' : '') + '</fieldset>' +
            '<fieldset class="ly-card"><legend>Payments</legend><div class="ly-sum">' +
            '<div><span>Total</span><span>' + L.rupiah(h.total) + '</span></div><div><span>Paid so far</span><span>' + L.rupiah(h.dibayar) + '</span></div>' +
            (j.status === 'batal' && j.batal_oleh === 'tukar' ? '<div class="ly-total"><span>Exchanged: the money becomes exchange credit (not refunded)</span><span>' + L.rupiah(h.dibayar) + '</span></div>' : j.status === 'batal' ? '<div><span>Cancellation fee' + (j.batal_oleh === 'toko' ? ' (cancelled by shop)' : '') + '</span><span>' + L.rupiah(h.potongan) + '</span></div><div class="ly-total"><span>Refunded</span><span>' + L.rupiah(h.kembali) + '</span></div>'
                : '<div class="ly-total"><span>Balance</span><span>' + L.rupiah(h.sisa) + '</span></div>') +
            (j.status === 'dp' ? '<div><span>Pay balance by</span><span' + (i.lewat ? ' class="ly-telat"' : '') + '>' + L.tgl(j.batas_lunas) + (i.lewat ? ' (overdue ' + -i.sisa + ' days)' : ' (' + i.sisa + ' days left)') + '</span></div>' : '') + '</div>' +
            '<div class="ly-bayar" id="jl-bayar" style="margin-top:10px"></div>' +
            (j.status === 'dp' ? '<div class="ly-f" style="margin-top:10px"><div class="ly-row2"><label>Amount (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="by-jml"></label>' +
                '<label>Metode<select id="by-metode">' + opsi([['tunai', 'Cash'], ['transfer', 'Transfer'], ['qris', 'QRIS']], 'transfer') + '</select></label></div>' +
                '<div class="ly-row2"><label>Date<input type="date" id="by-tgl"></label><label>Pay balance by<input type="date" id="jl-batas"></label></div>' +
                '<button type="button" class="ly-btn" id="by-tambah">Record payment</button></div>' : '') + '</fieldset>' +
            (j.status !== 'batal' ? '<fieldset class="ly-card"><legend>Receipt &amp; invoice</legend>' + kisiAksi([aksi({ id: 'jl-cetak', ikon: 'cetak', teks: 'Reprint 58 mm receipt' }), aksi({ id: 'jl-pdf', ikon: 'nota', teks: 'Save PDF' }),
                aksi({ id: 'jl-bagikan', ikon: 'kirim', teks: 'Share receipt (WhatsApp, etc.)', kelas: 'ly-akt--pri ly-akt--lebar' })]) +
                '<p class="ly-hint" style="margin:8px 0 0">Works any time, also for buyers without a WhatsApp number. The receipt text is sent through the phone’s share menu.</p></fieldset>' : '') +
            '<fieldset class="ly-card"><legend>WhatsApp to the buyer</legend>' + (adaHp && j.status !== 'batal' ? '<label class="ly-cek" style="margin-bottom:12px"><input type="checkbox" id="jl-setuju"><span>The buyer replied <b>AGREE</b> to the terms on WhatsApp</span></label>' : '') + (adaHp ?
                barisWa([].concat(j.status === 'dp' ? [['dp', 'Send deposit receipt', 'Order proof + ask for AGREE'], ['pengingat', 'Balance reminder', 'Remind them of the balance and due date']] : [])
                    .concat(j.status === 'lunas' || j.status === 'selesai' ? [['lunas', 'Send paid receipt', 'Online receipt link']] : [])
                    .concat(j.status === 'batal' && j.batal_oleh !== 'tukar' ? [['batal', 'Send cancellation notice', 'Refund breakdown']] : []), 'wa') +
                kisiAksi([aksi({ href: E(L.urlNotaJual(j.kode)), luar: true, ikon: 'nota', teks: 'Open receipt' })])
                : '<p class="ly-muted" style="margin:0">Without a WhatsApp number (sale paid in full), no online receipt is created. Use <b>Receipt &amp; invoice</b> above to reprint or share the receipt.</p>') +
            ((j.pengingat || []).length ? '<p class="ly-hint" style="margin:8px 0 0">Reminded: ' + j.pengingat.map(L.tgl).join(', ') + '</p>' : '') + '</fieldset>' +
            (aktif || j.status === 'selesai' ? '<fieldset class="ly-card"><legend>Status</legend><div class="ly-btns">' +
                (j.status === 'lunas' ? '<button type="button" class="ly-btn ly-btn--pri" id="jl-selesai">Item collected / shipped</button>' : '') +
                (j.status === 'dp' ? '<button type="button" class="ly-btn" id="jl-batal-p">Cancel (buyer)</button><button type="button" class="ly-btn" id="jl-batal-t">Cancel (shop)</button>'
                    : '<button type="button" class="ly-btn ly-btn--pri" id="jl-tukar">Exchange watch (within 24 h)</button><button type="button" class="ly-btn" id="jl-batal-t">Cancelled by shop</button>') + '</div>' +
                (j.status === 'dp' ? '<p class="ly-hint" style="margin:8px 0 0">Deposit/instalment order cancelled by the buyer (or past the due date): a fee of ' + C.jual.potonganPersen + '% of the item price (no more than what was paid). Cancelled by the shop: full refund. The item goes back into stock.</p>'
                    : '<p class="ly-hint" style="margin:8px 0 0"><b>Paid in full: the money is not refunded.</b> If the buyer exchanges it for another watch (within 24 hours), use <b>Exchange watch</b>: the item returns to stock and the money becomes <b>exchange credit</b> toward another watch at Checkout. Use <b>Cancelled by shop</b> only when the shop is at fault (full refund). Do not use Delete.</p>') + '</fieldset>' : '') +
            (kt ? '<fieldset class="ly-card"><legend>Exchange credit</legend><div class="ly-sum"><div><span>Money already paid (not refunded)</span><span>' + L.rupiah(kt.jumlah) + '</span></div>' +
                ((j.kredit.dipakai || []).map(function (p) { return '<div><span>&nbsp; used ' + L.tgl(p.tgl) + ' · ' + E(p.kode) + '</span><span>−' + L.rupiah(p.jumlah) + '</span></div>'; }).join('')) +
                '<div class="ly-total"><span>' + (kt.sisa ? 'Credit left' : 'Credit fully used') + '</span><span>' + L.rupiah(kt.sisa) + '</span></div></div>' +
                (kt.sisa ? '<a class="ly-btn ly-btn--pri" href="#kasir" style="margin-top:10px">Open Checkout to use the credit</a>' : '') + '</fieldset>' : '') +
            (owner() ? '<fieldset class="ly-card"><legend>More</legend>' + kisiAksi([aksi({ id: 'jl-hapus', ikon: 'hapus', teks: 'Delete sale', kelas: 'ly-akt--del' })]) +
            '<p class="ly-hint ly-hint--c">Delete only for data-entry mistakes; stock is returned. For cancelled orders, use the Cancel buttons so it is recorded.</p></fieldset>' : '') +
            '<div class="ly-save"><span class="ly-dirty" id="dirty" hidden>Not saved</span><button type="button" class="ly-btn ly-btn--pri" id="jl-simpan">Save changes</button></div></section>';
        susunDua(['Status', 'Struk', 'WhatsApp', 'Kredit', 'More']);
        if ($('#by-tgl')) { $('#by-tgl').value = L.hariIni(); $('#by-jml').value = h.sisa || ''; $('#jl-batas').value = j.batas_lunas || ''; }
        if ($('#jl-setuju')) $('#jl-setuju').checked = !!j.disetujui;
        gambarBayarJual(); setDirty(false);
        var el = $('#jl');
        el.addEventListener('change', function (e) {
            if (e.target.id === 'jl-setuju') { j.disetujui = e.target.checked ? (j.disetujui || L.hariIni()) : null; setDirty(true); }
            else if (e.target.id === 'jl-batas') { j.batas_lunas = e.target.value; setDirty(true); }
        });
        el.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return; var d = b.dataset;
            if (d.wa) kirimWaJual(d.wa, b);
            else if (b.id === 'jl-cetak' || b.id === 'jl-pdf') { var sj = strukDariJual(j); if (b.id === 'jl-cetak' && bisaCetakBt()) { kirimKeAplikasi('cetakStruk', { baris: L.strukThermal(sj) }); toast('Printing…'); } else cetakStruk(sj); }
            else if (b.id === 'jl-bagikan') bagikanTeks(teksStruk(strukDariJual(j)));
            else if (d.delbayar != null) { var by = j.bayar[+d.delbayar]; if (confirm('Delete payment ' + L.rupiah(by.jumlah) + ' dated ' + L.tgl(by.tgl) + '?')) { j.bayar.splice(+d.delbayar, 1); gambarBayarJual(); setDirty(true); } }
            else if (b.id === 'by-tambah') {
                var jml = Math.round(+$('#by-jml').value || 0); if (jml <= 0) return toast('Enter the payment amount.', true);
                var lunas = L.hitungJual(j).dibayar + jml >= L.hitungJual(j).total;
                j.bayar.push({ id: idAcak(), tgl: $('#by-tgl').value || L.hariIni(), jumlah: jml, jenis: lunas ? 'pelunasan' : 'tambahan', metode: $('#by-metode').value, baru: true });
                gambarBayarJual(); setDirty(true); toast(lunas ? 'Paid in full! Tap Save, then send the paid receipt.' : 'Payment recorded. Tap Save.');
            }
            else if (b.id === 'jl-selesai') { if (L.hitungJual(j).sisa > 0 && !confirm('There is still a balance. Mark as done anyway?')) return; j.status = 'selesai'; simpanJualIni(); }
            else if (b.id === 'jl-tukar') tukarUnit();
            else if (b.id === 'jl-batal-p' || b.id === 'jl-batal-t') batalJual(b.id === 'jl-batal-t' ? 'toko' : 'pembeli');
            else if (b.id === 'jl-simpan') simpanJualIni();
            else if (b.id === 'jl-hapus') { if (konfirmasiKode((j.status === 'selesai' ? 'This item was ALREADY handed to the buyer. Delete only if this sale was entered by mistake: stock will go back up. ' : 'Delete this sale? Stock will be returned. ') + 'The online receipt is deleted too.', j.kode)) hapusData('jual', j, b, function (r) { return A.hapusJual(r).then(function () { cache.stok = A.daftar('stok'); }); }, 'Sale deleted.'); }
        });
    }
    function gambarBayarJual() {
        var j = jl.j, el = $('#jl-bayar'); if (!el) return;
        var NAMA = { dp: 'Deposit', tambahan: 'Payments', pelunasan: 'Final payment', refund: 'Refunded' }, METODE = NAMA_METODE;
        el.innerHTML = j.bayar.length ? j.bayar.map(function (b, n) {
            return '<div><span>' + NAMA[b.jenis] + ' · ' + L.tgl(b.tgl) + ' · ' + (METODE[b.metode] || b.metode) + (b.baru ? ' <small class="ly-muted">(not saved)</small>' : '') + '</span><b>' + (b.jenis === 'refund' ? '−' : '') + L.rupiah(b.jumlah) + '</b>' +
                (j.status === 'dp' || b.baru ? '<button type="button" class="ly-x" data-delbayar="' + n + '" aria-label="Delete payment">×</button>' : '') + '</div>';
        }).join('') : '<p class="ly-muted">No payments yet.</p>';
    }
    /* tukar unit (kebijakan 1x24 jam, sudah bayar penuh): barang kembali ke stok, uang TIDAK dikembalikan tetapi jadi kredit tukar untuk unit lain */
    function tukarUnit() {
        var j = jl.j, h = L.hitungJual(j), tglBeli = j.tgl_selesai || j.tgl_lunas || j.tgl, lama = L.hariAntara(tglBeli, L.hariIni());
        if (lama > 1 && !confirm('This purchase was on ' + L.tgl(tglBeli) + ', more than 24 hours ago. Process the exchange anyway?')) return;
        if (!confirm('Exchange ' + j.kode + '?\n\n• The item returns to stock (available again).\n• The money ' + L.rupiah(h.dibayar) + ' is NOT refunded: it becomes exchange credit toward another watch at Checkout.\n• This sale is marked Exchanged.')) return;
        j.status = 'batal'; j.batal_oleh = 'tukar'; j.kredit = { jumlah: h.dibayar, tgl: L.hariIni(), dipakai: [] };
        simpanJualIni(function () { toast('The item is back in stock. Exchange credit ' + L.rupiah(h.dibayar) + ' can be used at Checkout.'); });
    }
    function batalJual(oleh) {
        var j = jl.j, uji = Object.assign({}, j, { batal_oleh: oleh }), h = L.hitungJual(uji);
        /* uang dikembalikan lewat cara yang sama dengan pembayaran terakhir (tunai/transfer/QRIS), supaya hitungan kas laci tetap benar */
        var metodeAsal = (j.bayar.filter(function (b) { return b.jenis !== 'refund'; }).slice(-1)[0] || {}).metode || 'tunai';
        if (!confirm('Cancel order ' + j.kode + ' (' + (oleh === 'toko' ? 'by the shop' : 'by the buyer') + ')?\n\nPaid so far: ' + L.rupiah(h.dibayar) + '\nPotongan: ' + L.rupiah(h.potongan) + '\nRefund to the buyer: ' + L.rupiah(h.harusKembali) + (h.harusKembali ? ' (overdue ' + (NAMA_METODE[metodeAsal] || metodeAsal) + ')' : '') + '\n\nThe item goes back into stock.')) return;
        j.status = 'batal'; j.batal_oleh = oleh;
        if (h.harusKembali) j.bayar.push({ id: idAcak(), tgl: L.hariIni(), jumlah: h.harusKembali, jenis: 'refund', metode: metodeAsal, baru: true });
        simpanJualIni(function (row) { if (L.hp4(row.hp).length === 4) toast('Order cancelled. Let the buyer know with the WhatsApp button.'); });
    }
    function simpanJualIni(lalu) {
        var j = jl.j, rec = Object.assign({}, j, { bayar: j.bayar.map(function (b) { var x = Object.assign({}, b); delete x.baru; return x; }) });
        prosesSimpan('jual', $('#jl-simpan'), 'Saving…', function () { return A.simpanJual(rec); }, function (row) {
            cache.stok = A.daftar('stok'); jl = { baru: false, j: salin(row) }; gambarJual2(); if (lalu) lalu(row); else toast('Saved.');
        }, function (r) { jl.j = r; });
    }
    /* WA: buka dulu (harus langsung dari ketukan); pengingat dicatat di data */
    function kirimWaJual(jenis, btn) {
        if (dirty) return toast('Save your changes first so the buyer sees the latest receipt.', true);
        var j = jl.j; bukaWa(j.hp, L.pesanJual[jenis](j));
        if (jenis !== 'pengingat') return;
        var rec = salin(j); rec.pengingat = (rec.pengingat || []).concat(L.hariIni());
        sibuk(btn, true, 'Recording…');
        A.simpanJual(rec).then(function (row) { taruh('jual', row); jl = { baru: false, j: salin(row) }; gambarJual2(); }).catch(function (e) { sibuk(btn, false); gagal(e); });
    }

    /* ================= sewa gitar (unit used dari stok) ================= */
    var sw = null, filterSw = 'aktif', cariSw = '';
    var SWC = C.sewa;
    function statusSewa(w) { return w.status === 'aktif' && L.infoSewa(w).lewat ? 'telat' : w.status; }
    var CHIP_SEWA = { aktif: 'st-antri', telat: 'st-menunggu_dp', selesai: 'st-selesai', batal: 'st-batal' };
    function chipSewa(w) { var k = statusSewa(w); return '<span class="st-chip ' + CHIP_SEWA[k] + '">' + (k === 'telat' ? 'Late ' + L.infoSewa(w).hariTelat + ' days' : E(L.STATUS_SEWA[k] || k)) + '</span>'; }
    function daftarSewa() {
        app.innerHTML = '<section><div class="ly-head"><h1>Watch rental</h1><a class="ly-btn ly-btn--pri" href="#sewa/baru">+ New rental</a></div>' +
            '<p class="ly-muted">Pre-owned watches in <a href="#stok">Stock</a> can be rented out. Rented watches do not appear at checkout; returns and deposits are recorded here.</p>' +
            '<div class="ly-cari"><input class="ly-in" id="cari" type="search" placeholder="Search code, renter, watch…" autocomplete="off"></div>' +
            '<div class="ly-filter" id="filter"></div><div class="ly-list" id="list"></div>' +
            '</section>';
        $('#cari').value = cariSw;
        $('#cari').addEventListener('input', function () { cariSw = this.value; gambarDaftarSewa(); });
        $('#filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { filterSw = b.dataset.f; gambarDaftarSewa(); } });
        gambarDaftarSewa();
    }
    function gambarDaftarSewa() {
        if (!$('#list')) return;
        var rows = cache.sewa, c = cariSw.trim().toLowerCase(), n = { aktif: 0, telat: 0, selesai: 0, semua: rows.length };
        rows.forEach(function (w) { var k = statusSewa(w); if (k === 'aktif' || k === 'telat') n.aktif++; if (k === 'telat') n.telat++; if (k === 'selesai') n.selesai++; });
        $('#filter').innerHTML = [['aktif', 'Rented out'], ['telat', 'Late'], ['selesai', 'Done'], ['semua', 'All']].map(function (x) {
            return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (filterSw === x[0]) + '">' + x[1] + ' <span class="ly-n">' + n[x[0]] + '</span></button>';
        }).join('');
        var tampil = rows.filter(function (w) {
            var k = statusSewa(w), ok = filterSw === 'semua' ? true : filterSw === 'aktif' ? (k === 'aktif' || k === 'telat') : k === filterSw;
            return ok && (!c || [w.kode, w.nama, w.hp, w.nama_barang].join(' ').toLowerCase().indexOf(c) > -1);
        });
        $('#list').innerHTML = tampil.length ? tampil.map(function (w) {
            var h = L.hitungSewa(w), i = L.infoSewa(w);
            var b = [['', 'tanggal', L.tgl(w.tgl_mulai) + ' → <b>' + L.tgl(L.batasSewa(w)) + '</b>'], ['', 'uang', 'Rental <b>' + L.rupiah(h.tarif) + '</b>' + (w.status === 'aktif' ? ' · Deposit ' + L.rupiah(h.ditahan) : '')]];
            if (h.masihHutang) b.push(['sv-bad', 'uang', 'Short <b>' + L.rupiah(h.masihHutang) + '</b>']);
            if (i.sisa != null && !i.lewat) b.push(['sv-warn', 'jam', i.sisa ? i.sisa + ' days left' : 'Due back today']);
            return kartuIkon({ href: '#sewa/' + E(w.id), kode: E(w.kode), chip: chipSewa(w), judul: w.nama, sub: w.nama_barang, baris: b });
        }).join('') : '<p class="ly-kosong">' + (rows.length ? 'Nothing in this category.' : 'No rentals yet. Tap “+ New rental”.') + '</p>';
    }
    /* sewa baru: pilih unit (jika belum), lalu isi formulir (#sewa/baru/<id stok>) */
    function sewaBaru(stokId) {
        if (!stokId) return pilihUnitSewa();
        ambilCatatan('stok', stokId, function () { return null; }, formSewa);
    }
    function pilihUnitSewa() {
        var unit = cache.stok.filter(function (s) { return L.bisaDisewa(s, cache.sewa); });
        app.innerHTML = '<section><div class="ly-head"><a class="ly-back" href="#sewa">‹ Watch rental</a></div><div class="ly-head"><h1>Choose a watch</h1></div>' +
            '<p class="ly-muted">Only <b>pre-owned</b> watches that are in stock and not rented out.</p><div class="ly-list">' +
            (unit.length ? unit.map(function (s) {
                return '<div class="ly-item"><a class="ly-item__a" href="#sewa/baru/' + E(s.id) + '"><span class="ly-item__k">' + E(s.kode) + '</span></a><span class="ly-item__t">' + E(L.judulStok(s)) + (L.tingkatStok(s) ? ' · ' + E(L.tingkatStok(s)) : '') + '</span>' +
                    '<span class="ly-item__m"><span>Price ' + (s.harga_jual ? L.rupiah(s.harga_jual) : '–') + '</span></span></div>';
            }).join('') : '<p class="ly-kosong">No pre-owned watches available to rent. Add them in <a href="#stok">Stock</a>.</p>') + '</div></section>';
    }
    function formSewa(s) {
        if (!L.bisaDisewa(s, cache.sewa)) { app.innerHTML = '<p class="ly-kosong">Stock item ' + E(s.kode) + ' cannot be rented (not pre-owned, sold out, withdrawn, or already rented). <a href="#sewa">Back</a></p>'; return; }
        var h = L.hariIni(), nama = L.judulStok(s) + (s.warna ? ' (' + s.warna + ')' : '') + ' – Used' + (L.tingkatStok(s) ? ' ' + L.tingkatStok(s) : '');
        sw = { baru: true, antri: [], w: { nama: '', hp: '', stok_id: s.id, stok_kode: s.kode, nama_barang: nama, tgl_mulai: h, hari: 3, biaya_custom: L.tarifStandarUnit(s) ? L.tarifSewa(3) : 0, deposit_rencana: L.depositAwal(s.harga_jual), kondisi_keluar: '', status: 'aktif', bayar: [], foto: [] }, metode: 'tunai', bayarSewa: null, bayarDep: null };
        app.innerHTML = '<section id="sw" class="ly-f"><div class="ly-head"><a class="ly-back" href="#sewa">‹ Watch rental</a></div><div class="ly-head"><h1>New rental</h1></div>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Watch</legend><p style="margin:0"><b>' + E(nama) + '</b><br><small class="ly-muted">' + E(s.kode) + ' · price ' + (s.harga_jual ? L.rupiah(s.harga_jual) : 'not set') + '</small></p></fieldset>' +
            barisWa([['unit', 'Send watch &amp; cost estimate', 'Photo poster + rental estimate, deposit, photo link'], ['ketentuan', 'Send rental terms', 'Send once, not for every watch'], ['formulir', 'Send sign-up form', 'Name, WhatsApp, date & rental length'], ['bayar', 'Send payment info', 'Total upfront + bank account']], 'wa') +
            '<fieldset class="ly-card ly-f ly-grid ly-grid--2"><legend>Renter</legend><div class="ly-row2"><label>Name<input data-w="nama" autocomplete="off"></label><label>WhatsApp number<input data-w="hp" type="tel" inputmode="tel" autocomplete="off" placeholder="08…"></label></div>' + tombolKontak('[data-w="nama"]', '[data-w="hp"]') +
            '<p class="ly-hint" style="margin:0">Required: the rental receipt and reminders go by WhatsApp.</p></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Rental</legend><div class="ly-row2"><label>Start<input type="date" data-w="tgl_mulai"></label><label>Length (days)<input type="number" inputmode="numeric" min="1" max="' + SWC.maksHari + '" data-w="hari"></label></div>' +
            '<div class="ly-btns" id="sw-cepat">' + [1, 2, 3, 7, 14].map(function (d) { return '<button type="button" class="ly-btn ly-btn--sm" data-hari="' + d + '">' + d + ' days</button>'; }).join('') + '</div>' +
            '<div class="ly-row2"><label>Rental fee (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-w="biaya_custom"></label><label>Deposit (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-w="deposit_rencana"></label></div>' +
            '<label>Payment method<select id="sw-metode">' + opsi([['tunai', 'Cash'], ['transfer', 'Transfer'], ['qris', 'QRIS']], 'tunai') + '</select></label>' +
            '<p class="ly-hint" style="margin:0">' + (L.tarifStandarUnit(s) ? 'Standard rate: ' + L.ringkasTarifSewa() + '.' : '<b class="ly-warn">Unit ' + L.rupiah(SWC.batasUnitStandar) + ' and above: enter the rental fee yourself.</b>') + ' Deposit awal ' + SWC.depositPersen + '% of the watch price. Both can be changed. The rental fee and deposit are paid upfront.</p>' +
            '<div class="ly-row2"><label>Rental paid now (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="sw-bs"></label><label>Deposit received (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="sw-bd"></label></div>' +
            '<div class="ly-sum" id="sw-sum"></div></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Condition when it leaves</legend><label>Condition notes (scratches, box, extra strap, etc.)<textarea data-w="kondisi_keluar" rows="2"></textarea></label><div id="sw-foto"></div>' +
            '<p class="ly-hint" style="margin:0">Photograph the watch from several sides before handing it over, in case of a dispute.' + (owner() ? ' The ID card photo (optional) is stored only in the owner repo and never appears on the website.' : '') + '</p></fieldset>' +
            '<div class="ly-save"><button type="button" class="ly-btn ly-btn--pri" id="sw-simpan">Save rental</button></div></section>';
        susunDua(['Condition when it leaves']);
        var el = $('#sw'), w = sw.w;
        $$('[data-w]', el).forEach(function (i) { i.value = w[i.dataset.w] == null ? '' : w[i.dataset.w]; });
        function angka(x) { return Math.max(0, Math.round(+x || 0)); }
        function sinkron(dariUbah) {
            if (dariUbah) {
                $$('[data-w]', el).forEach(function (i) { var k = i.dataset.w; w[k] = /^(hari|biaya_custom|deposit_rencana)$/.test(k) ? angka(i.value) : i.value; });
                w.hari = Math.min(+SWC.maksHari || 365, Math.max(1, w.hari || 1)); w.nama = w.nama.trim(); w.hp = w.hp.trim();
            }
            /* biaya & deposit mengikuti tarif standar sampai diubah manual (unit mahal: kosong sampai diisi) */
            if (!sw.biayaManual && L.tarifStandarUnit(s)) w.biaya_custom = L.tarifSewa(w.hari);
            if (!sw.depManual) w.deposit_rencana = L.depositAwal(s.harga_jual);
            ['biaya_custom', 'deposit_rencana'].forEach(function (k) { var i = $('[data-w="' + k + '"]'); if (i !== document.activeElement) i.value = w[k] || ''; });
            var tarif = w.biaya_custom;
            if (sw.bayarSewa == null) $('#sw-bs').value = tarif; if (sw.bayarDep == null) $('#sw-bd').value = w.deposit_rencana;
            $('#sw-sum').innerHTML = '<div><span>' + w.hari + ' days · due back by</span><span>' + L.tgl(L.batasSewa(w)) + '</span></div><div><span>Rental fee</span><span>' + L.rupiah(tarif) + '</span></div>' +
                '<div><span>Deposit (returned)</span><span>' + L.rupiah(w.deposit_rencana) + '</span></div><div class="ly-total"><span>Total the renter pays now</span><span>' + L.rupiah(angka($('#sw-bs').value) + angka($('#sw-bd').value)) + '</span></div>';
            setDirty(true);
        }
        el.addEventListener('input', function (e) {
            if (e.target.id === 'sw-bs') sw.bayarSewa = angka(e.target.value); else if (e.target.id === 'sw-bd') sw.bayarDep = angka(e.target.value);
            else {
                var kk = e.target.dataset.w;
                if (kk === 'hari') { sw.bayarSewa = null; sw.bayarDep = null; }
                else if (kk === 'biaya_custom') { sw.biayaManual = true; sw.bayarSewa = null; sw.bayarDep = null; }
                else if (kk === 'deposit_rencana') { sw.depManual = true; sw.bayarDep = null; }
            }
            sinkron(true);
        });
        el.addEventListener('change', function (e) { if (e.target.id === 'sw-metode') sw.metode = e.target.value; });
        el.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return;
            if (b.dataset.wa === 'unit') bagikanPoster(s, L.pesanSewa.calon.unit(s, w), { sewa: { harian: L.tarifStandarUnit(s) ? L.tarifSewa(1) : 0, deposit: w.deposit_rencana } }, b); /* poster foto unit + teks lewat menu bagikan */
            else if (b.dataset.wa) bukaWa('', L.pesanSewa.calon[b.dataset.wa](s, w)); /* tanpa nomor: kontaknya dipilih di WhatsApp */
            else if (b.dataset.hari) { $('[data-w="hari"]').value = b.dataset.hari; sw.bayarSewa = null; sw.bayarDep = null; sinkron(true); }
            else if (b.dataset.hapusq) { sw.antri = buangQ(sw.antri, b.dataset.hapusq); gambarFotoSewa(); }
            else if (b.id === 'sw-simpan') simpanSewaBaru();
        });
        pilihFoto($('#sw-foto'), function (tahap, files) { antriFoto(sw.antri, files, { tahap: tahap }, gambarFotoSewa); });
        gambarFotoSewa(); sinkron(true); setDirty(false);
    }
    function grupFotoSewa(w, antri) {
        var grup = [['keluar', 'Condition photos when it leaves'], ['kembali', 'Condition photos when it returns']];
        if (owner()) grup.push(['ktp', 'ID card photo (optional)']);
        /* foto KTP hanya terbaca oleh owner (disimpan di repo owner); karyawan tidak melihatnya */
        return grup.map(function (x) { return grupFoto(x[1], x[0], w.foto, antri, false); }).join('');
    }
    function gambarFotoSewa() {
        var el = $('#sw-foto'); if (!el) return;
        el.innerHTML = grupFotoSewa(sw.w, sw.antri); L.isiFoto(el, sw.w, A.fotoAdmin);
    }
    function simpanSewaBaru() {
        var w = sw.w, bs = Math.max(0, Math.round(+$('#sw-bs').value || 0)), bd = Math.max(0, Math.round(+$('#sw-bd').value || 0)), t = L.tgl(w.tgl_mulai);
        if (!w.nama) return toast('Enter the renter’s name.', true);
        if (L.hp4(w.hp).length < 4) return toast('Enter the renter’s WhatsApp number.', true);
        if (!(w.biaya_custom > 0)) return toast('Enter the rental fee.', true);
        if (bs < w.biaya_custom && !confirm('Rental fee paid (' + L.rupiah(bs) + ') is less than ' + L.rupiah(w.biaya_custom) + '. Shop rule: rentals are paid upfront. Save anyway?')) return;
        if (!w.tgl_mulai) return toast('Enter the start date.', true);
        if (sw.antri.some(function (q) { return !q.hasil; })) return toast('Photos are still processing. Please wait a moment.', true);
        if (!w.deposit_rencana && !confirm('Deposit is Rp0. Rent it out without a deposit?')) return;
        if (bd < w.deposit_rencana && !confirm('Deposit received (' + L.rupiah(bd) + ') is less than planned (' + L.rupiah(w.deposit_rencana) + '). Save anyway?')) return;
        var rec = salin(w); rec.bayar = [];
        if (bs) rec.bayar.push({ id: idAcak(), tgl: w.tgl_mulai, jumlah: bs, jenis: 'sewa', metode: sw.metode });
        if (bd) rec.bayar.push({ id: idAcak(), tgl: w.tgl_mulai, jumlah: bd, jenis: 'deposit', metode: sw.metode });
        var fotoBaru = sw.antri.map(function (q) { return { hasil: q.hasil, tahap: q.tahap }; });
        prosesSimpan('sewa', $('#sw-simpan'), teksUnggah(sw.antri), function () { return A.simpanSewa(rec, fotoBaru); }, function (row) {
            lepasAntri(sw.antri); toast('Rental saved (' + row.kode + ') starting ' + t + '. Send the receipt & terms to the renter by WhatsApp.'); pindah('#sewa/' + row.id);
        }, function (r) { sw.w = r; });
    }

    function bukaSewa(id) { ambilCatatan('sewa', id, function () { return null; }, function (w) { w.bayar = w.bayar || []; w.foto = w.foto || []; sw = { baru: false, w: w, antri: [], selesai: false }; gambarSewa2(); }); }
    function gambarSewa2() {
        var w = sw.w, h = L.hitungSewa(w), i = L.infoSewa(w), aktif = w.status === 'aktif', stok = cariId('stok', w.stok_id);
        app.innerHTML = '<section id="sw" class="ly-f"><div class="ly-head"><a class="ly-back" href="#sewa">‹ Watch rental</a></div>' +
            '<div class="ly-head"><h1>' + E(w.nama) + '</h1>' + chipSewa(w) + '</div>' + kodeBaris(w) +
            '<fieldset class="ly-card"><legend>Watch &amp; schedule</legend><div class="ly-sum">' +
            '<div><span>Watch</span><span>' + (stok ? '<a href="#stok/' + E(stok.id) + '">' + E(w.nama_barang) + '</a>' : E(w.nama_barang)) + '</span></div>' +
            '<div><span>Start</span><span>' + L.tgl(w.tgl_mulai) + '</span></div>' +
            (aktif ? '<div><span>Due back by</span><span' + (i.lewat ? ' class="ly-telat"' : '') + '>' + L.tgl(L.batasSewa(w)) + (i.lewat ? ' (late ' + i.hariTelat + ' days)' : i.sisa ? ' (' + i.sisa + ' days left)' : ' (today)') + '</span></div>'
                : '<div><span>Returned</span><span>' + L.tgl(w.tgl_kembali) + '</span></div>') +
            '<div><span>Days charged</span><span>' + h.hari + ' days' + (h.hari > w.hari ? ' (booked ' + w.hari + ')' : '') + '</span></div>' +
            '<div><span>Booked rental fee (' + w.hari + ' days)</span><span>' + L.rupiah(w.biaya_custom != null ? w.biaya_custom : L.tarifSewa(w.hari)) + '</span></div>' +
            '<div><span>WhatsApp</span><span>' + E(w.hp) + '</span></div></div>' +
            (aktif ? '<div class="ly-row2" style="margin-top:10px;align-items:end"><label>Extend (days)<input type="number" inputmode="numeric" min="1" max="' + SWC.maksHari + '" id="sw-perp" value="1"></label><button type="button" class="ly-btn" id="sw-perpanjang">Extend</button></div>' : '') + '</fieldset>' +
            '<fieldset class="ly-card"><legend>Money</legend><div class="ly-sum">' +
            '<div><span>Rental fee (' + h.hari + ' days)</span><span>' + L.rupiah(h.tarif) + '</span></div>' +
            (h.gantiRugi ? '<div><span>Penalties &amp; damages' + (w.ket_ganti_rugi ? '<br><small>' + E(w.ket_ganti_rugi) + '</small>' : '') + '</span><span>' + L.rupiah(h.gantiRugi) + '</span></div>' : '') +
            '<div><span>Paid so far (rental)</span><span>' + L.rupiah(h.dibayar) + '</span></div>' +
            '<div><span>Deposit ' + (aktif ? 'ditahan' : 'diterima') + '</span><span>' + L.rupiah(aktif ? h.ditahan : h.deposit) + '</span></div>' +
            '<div class="ly-total"><span>' + (aktif ? 'Rental currently underpaid' : 'Renter still owes') + '</span><span' + ((aktif ? h.kurang : h.masihHutang) ? ' class="ly-telat"' : '') + '>' + L.rupiah(aktif ? h.kurang : h.masihHutang) + '</span></div></div>' +
            '<div class="ly-bayar" id="sw-bayar" style="margin-top:10px"></div>' +
            (aktif || h.masihHutang ? '<div class="ly-f" style="margin-top:10px"><div class="ly-row2"><label>Amount (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="by-jml"></label>' +
                '<label>Type<select id="by-jenis">' + opsi(aktif ? [['sewa', 'Rental fee'], ['deposit', 'Deposit']] : [['sewa', 'Rental fee']], 'sewa') + '</select></label></div>' +
                '<div class="ly-row2"><label>Metode<select id="by-metode">' + opsi([['tunai', 'Cash'], ['transfer', 'Transfer'], ['qris', 'QRIS']], 'tunai') + '</select></label><label>Date<input type="date" id="by-tgl"></label></div>' +
                '<button type="button" class="ly-btn" id="by-tambah">Record payment</button></div>' : '') + '</fieldset>' +
            '<fieldset class="ly-card ly-f"><legend>Condition &amp; photos</legend>' +
            '<label>Condition when it left<textarea data-w="kondisi_keluar" rows="2"></textarea></label>' + '<label>Condition when it returned<textarea data-w="kondisi_kembali" rows="2"></textarea></label>' +
            '<div id="sw-foto"></div>' + (owner() ? '' : '<p class="ly-hint" style="margin:0">ID card photos are visible only to the owner.</p>') + '</fieldset>' +
            '<fieldset class="ly-card"><legend>WhatsApp to the renter</legend>' + barisWa([['mulai', 'Send receipt &amp; terms', 'Rental details + ask for AGREE']].concat(aktif ? [['pengingat', 'Return reminder', i.lewat ? 'Overdue, send a reminder' : 'Remind them of the return date']] : [['selesai', 'Send return confirmation', 'Deposit refund breakdown']]), 'wa') +
            ((w.pengingat || []).length ? '<p class="ly-hint" style="margin:8px 0 0">Reminded: ' + w.pengingat.map(L.tgl).join(', ') + '</p>' : '') +
            kisiAksi([aksi({ id: 'sw-cetak', ikon: 'cetak', teks: 'Print 58 mm rental receipt' })]) + '</fieldset>' +
            (aktif ? '<fieldset class="ly-card" id="sw-selesai-box"><legend>Watch returned</legend>' + (sw.selesai ? '' : '<button type="button" class="ly-btn ly-btn--pri" id="sw-selesai">Watch has been returned</button>' +
                '<p class="ly-hint" style="margin:8px 0 0">Check the watch’s condition first, then work out the deposit to return.</p>') + '<div id="sw-selesai-isi"></div></fieldset>' : '') +
            (owner() ? '<fieldset class="ly-card"><legend>More</legend>' + kisiAksi([aksi({ id: 'sw-hapus', ikon: 'hapus', teks: 'Delete rental record', kelas: 'ly-akt--del' })]) +
                '<p class="ly-hint ly-hint--c">Delete only for data-entry mistakes; photos are deleted too.</p></fieldset>' : '') +
            '<div class="ly-save"><span class="ly-dirty" id="dirty" hidden>Not saved</span><button type="button" class="ly-btn ly-btn--pri" id="sw-simpan">Save changes</button></div></section>';
        susunDua(['WhatsApp', 'Watch returned', 'More']);
        $$('[data-w]', $('#sw')).forEach(function (x) { x.value = w[x.dataset.w] || ''; });
        if ($('#by-tgl')) { $('#by-tgl').value = L.hariIni(); $('#by-jml').value = (aktif ? h.kurang : h.masihHutang) || ''; }
        gambarBayarSewa(); gambarFotoSewa(); setDirty(false);
        if (sw.selesai) panelSelesaiSewa();
        var el = $('#sw');
        el.addEventListener('input', function (e) { var k = e.target.dataset.w; if (k) { w[k] = e.target.value; setDirty(true); } });
        pilihFoto($('#sw-foto'), function (tahap, files) { antriFoto(sw.antri, files, { tahap: tahap }, gambarFotoSewa); });
        el.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return; var d = b.dataset;
            if (d.wa) kirimWaSewa(d.wa, b);
            else if (d.hapusfoto) { if (confirm('Delete this photo? (removed permanently when you Save)')) { w.foto = w.foto.filter(function (f) { return f.id !== d.hapusfoto; }); gambarFotoSewa(); setDirty(true); } }
            else if (d.hapusq) { sw.antri = buangQ(sw.antri, d.hapusq); gambarFotoSewa(); }
            else if (d.delbayar != null) { var by = w.bayar[+d.delbayar]; if (confirm('Delete payment ' + L.rupiah(by.jumlah) + ' dated ' + L.tgl(by.tgl) + '?')) { w.bayar.splice(+d.delbayar, 1); gambarBayarSewa(); setDirty(true); } }
            else if (b.id === 'by-tambah') {
                var jml = Math.round(+$('#by-jml').value || 0); if (jml <= 0) return toast('Enter the payment amount.', true);
                w.bayar.push({ id: idAcak(), tgl: $('#by-tgl').value || L.hariIni(), jumlah: jml, jenis: $('#by-jenis').value, metode: $('#by-metode').value, baru: true });
                gambarBayarSewa(); setDirty(true); toast('Payment recorded. Tap Save.');
            }
            else if (b.id === 'sw-perpanjang') {
                var n = Math.round(+$('#sw-perp').value || 0); if (n < 1) return toast('Enter the number of extra days.', true);
                var tambah = L.tarifSewa(w.hari + n) - L.tarifSewa(w.hari);
                if (!confirm('Extend ' + n + ' days? The new return date is ' + L.tgl(L.tambahHari(L.batasSewa(w), n)) + '. Extra fee ' + L.rupiah(tambah) + '.')) return;
                w.hari += n; if (w.biaya_custom != null) w.biaya_custom = (+w.biaya_custom || 0) + tambah; simpanSewaIni(function () { toast('Extended. Record the extra payment once it is paid.'); });
            }
            else if (b.id === 'sw-selesai') { if (dirty) return toast('Save your changes first.', true); sw.selesai = true; b.hidden = true; panelSelesaiSewa(); }
            else if (b.id === 'sw-cetak') cetakBaris(L.strukSewa(w));
            else if (b.id === 'sw-simpan') simpanSewaIni();
            else if (b.id === 'sw-hapus') { if (konfirmasiKode('Delete this rental record and its photos? Only for data-entry mistakes.', w.kode)) hapusData('sewa', w, b, A.hapusSewa, 'Rental record deleted.'); }
        });
    }
    function gambarBayarSewa() {
        var w = sw.w, el = $('#sw-bayar'); if (!el) return;
        var NAMA = { sewa: 'Rental fee', deposit: 'Deposit', deposit_potong: 'Deposit deducted', deposit_kembali: 'Deposit returned' };
        el.innerHTML = w.bayar.length ? w.bayar.map(function (b, n) {
            return '<div><span>' + NAMA[b.jenis] + ' · ' + L.tgl(b.tgl) + ' · ' + (NAMA_METODE[b.metode] || b.metode) + (b.baru ? ' <small class="ly-muted">(not saved)</small>' : '') + '</span><b>' + (b.jenis === 'deposit_kembali' ? '−' : '') + L.rupiah(b.jumlah) + '</b>' +
                (b.baru ? '<button type="button" class="ly-x" data-delbayar="' + n + '" aria-label="Delete payment">×</button>' : '') + '</div>';
        }).join('') : '<p class="ly-muted">No payments yet.</p>';
    }
    /* hitung penutupan sewa: tagihan yang belum terbayar & ganti rugi diambil dari deposit, sisanya dikembalikan */
    function panelSelesaiSewa() {
        var w = sw.w, el = $('#sw-selesai-isi'); if (!el) return;
        var metodeDep = (w.bayar.filter(function (b) { return b.jenis === 'deposit'; })[0] || {}).metode || 'tunai';
        el.innerHTML = '<div class="ly-f"><div class="ly-row2"><label>Return date<input type="date" id="sl-tgl"></label><label>Damaged parts (count, ' + L.rupiah(SWC.dendaSenar) + ' each, max ' + SWC.senarCadangan + ' = ' + L.rupiah(SWC.dendaSenar * SWC.senarCadangan) + ')<input type="number" inputmode="numeric" min="0" max="' + SWC.senarCadangan + '" id="sl-senar" value="0"></label></div>' +
            '<div class="ly-row2"><label>Other damage (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp id="sl-rugi"></label><label>Other damage details<input id="sl-ket" placeholder="e.g. scratch on the bezel"></label></div>' +
            '<label>Deposit returned by<select id="sl-metode">' + opsi([['tunai', 'Cash'], ['transfer', 'Transfer'], ['qris', 'QRIS']], metodeDep) + '</select></label>' +
            '<div class="ly-sum" id="sl-sum"></div><button type="button" class="ly-btn ly-btn--pri" id="sl-ok">Finish rental</button></div>';
        $('#sl-tgl').value = L.hariIni();
        function hitung() {
            var t = Object.assign({}, w, { status: 'selesai', tgl_kembali: $('#sl-tgl').value || L.hariIni(), ganti_rugi: Math.max(0, Math.round(+$('#sl-senar').value || 0)) * (+SWC.dendaSenar || 0) + Math.max(0, Math.round(+$('#sl-rugi').value || 0)) }), h = L.hitungSewa(t);
            $('#sl-sum').innerHTML = '<div><span>Rental fee (' + h.hari + ' days)</span><span>' + L.rupiah(h.tarif) + '</span></div>' + (h.gantiRugi ? '<div><span>Penalties &amp; damages</span><span>' + L.rupiah(h.gantiRugi) + '</span></div>' : '') +
                '<div><span>Paid so far</span><span>' + L.rupiah(h.dibayar) + '</span></div><div><span>Deposit held</span><span>' + L.rupiah(h.ditahan) + '</span></div>' +
                '<div><span>Taken from the deposit</span><span>' + L.rupiah(h.potongDeposit) + '</span></div>' +
                '<div class="ly-total"><span>Deposit returned to the renter</span><span>' + L.rupiah(h.harusKembali) + '</span></div>' +
                (h.masihHutang ? '<div><span class="ly-warn">Renter still owes</span><span class="ly-telat">' + L.rupiah(h.masihHutang) + '</span></div>' : '');
            return { t: t, h: h };
        }
        ['#sl-tgl', '#sl-senar', '#sl-rugi'].forEach(function (id) { $(id).addEventListener('input', hitung); }); hitung();
        $('#sl-ok').addEventListener('click', function () {
            var x = hitung(), t = x.t, h = x.h;
            if (t.tgl_kembali < w.tgl_mulai) return toast('The return date is not valid.', true);
            if (!confirm('Finish rental ' + w.kode + '? Deposit returned ' + L.rupiah(h.harusKembali) + (h.potongDeposit ? ', minus ' + L.rupiah(h.potongDeposit) : '') + '.')) return;
            w.status = 'selesai'; w.tgl_kembali = t.tgl_kembali; w.ganti_rugi = t.ganti_rugi; w.senar_putus = Math.max(0, Math.round(+$('#sl-senar').value || 0));
            w.ket_ganti_rugi = [w.senar_putus ? 'damaged parts ' + w.senar_putus : '', $('#sl-ket').value.trim()].filter(Boolean).join(', ');
            if (h.potongDeposit > 0) w.bayar.push({ id: idAcak(), tgl: t.tgl_kembali, jumlah: h.potongDeposit, jenis: 'deposit_potong', metode: metodeDep });
            if (h.harusKembali > 0) w.bayar.push({ id: idAcak(), tgl: t.tgl_kembali, jumlah: h.harusKembali, jenis: 'deposit_kembali', metode: $('#sl-metode').value });
            sw.selesai = false; simpanSewaIni(function () { toast('Rental finished. Let the renter know with the WhatsApp button.'); });
        });
    }
    function simpanSewaIni(lalu) {
        if (sw.antri.some(function (q) { return !q.hasil; })) return toast('Photos are still processing. Please wait a moment.', true);
        var w = sw.w, rec = Object.assign({}, w, { bayar: w.bayar.map(function (b) { var x = Object.assign({}, b); delete x.baru; return x; }) });
        var fotoBaru = sw.antri.map(function (q) { return { hasil: q.hasil, tahap: q.tahap }; });
        prosesSimpan('sewa', $('#sw-simpan'), teksUnggah(sw.antri), function () { return A.simpanSewa(rec, fotoBaru); }, function (row) {
            lepasAntri(sw.antri); sw = { baru: false, w: salin(row), antri: [], selesai: false }; gambarSewa2(); if (lalu) lalu(row); else toast('Saved.');
        }, function (r) { sw.w = r; });
    }
    /* WA: buka dulu (harus langsung dari ketukan); pengingat dicatat di data */
    function kirimWaSewa(jenis, btn) {
        if (dirty) return toast('Save your changes first so the message is up to date.', true);
        var w = sw.w; bukaWa(w.hp, L.pesanSewa[jenis](w));
        if (jenis !== 'pengingat') return;
        var rec = salin(w); rec.pengingat = (rec.pengingat || []).concat(L.hariIni());
        sibuk(btn, true, 'Recording…');
        A.simpanSewa(rec).then(function (row) { taruh('sewa', row); sw = { baru: false, w: salin(row), antri: [], selesai: false }; gambarSewa2(); }).catch(function (e) { sibuk(btn, false); gagal(e); });
    }

    /* ================= stok gitar (baru & bekas) ================= */
    function bulanIni() { return L.hariIni().slice(0, 7); }
    /* tombol di kartu stok: Sewa (gitar used yang bisa disewa) dan Bagikan (poster & penawaran jual) */
    /* aksesoris: kolom "warna" dipakai untuk varian (tipe, ukuran, tension, warna); semua aksesoris baru */
    var LBL_VARIAN = 'Variant / reference (optional)', PH_VARIAN = 'e.g. 20 mm, brown leather';
    function tombolKartuStok(s) {
        var b = (SEWA_AKTIF && L.bisaDisewa(s, cache.sewa) ? '<button type="button" class="ly-btn ly-btn--sm" data-sewa="' + E(s.id) + '">Rent</button>' : '') +
            (L.diKatalog(s) ? tombolIkon('tautan-sk', s.id, 'tautan', 'Share item link') : '') +
            (adaStok(s) && s.harga_jual ? tombolIkon('tawar', s.id, 'kirim', 'Share poster & offer') : '') +
            (bisaPosterSold(s) ? tombolIkon('sold', s.id, 'kirim', 'Share SOLD poster') : '');
        return b;
    }
    function daftarStok() {
        app.innerHTML = '<section><div class="ly-head"><h1>Stock</h1><a class="ly-btn" href="#opname">Stocktake</a><a class="ly-btn ly-btn--pri" href="#stok/baru">+ Add stock</a></div>' +
            '<p class="ly-muted">Items in stock with a price and the 🌐 label appear in the <a href="' + E(L.situs()) + 'collection.html" target="_blank">website collection</a> (about 1 minute after saving).</p>' +
            '<div class="ly-sum ly-card" id="sk-rekap" style="margin:0"></div>' +
            '<div class="ly-cari"><input class="ly-in" id="cari" type="search" placeholder="Search code, name, brand, dial, serial no.…" autocomplete="off"></div>' +
            '<div class="ly-filter" id="filter"></div><div class="ly-list" id="list"></div></section>';
        $('#cari').value = cariSk;
        $('#cari').addEventListener('input', function () { cariSk = this.value; gambarDaftarStok(); });
        /* foto kecil di kartu belum terbit di situs (±1 menit setelah diunggah): sembunyikan, jangan tampilkan ikon gambar rusak */
        $('#list').addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG' && e.target.closest('.sv-foto')) e.target.hidden = true; }, true);
        $('#filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { filterSk = b.dataset.f; gambarDaftarStok(); } });
        $('#list').addEventListener('click', function (e) { var sb = e.target.closest('[data-sewa]'); if (sb) { e.preventDefault(); pindah('#sewa/baru/' + sb.dataset.sewa); return; } var b = e.target.closest('[data-tawar]'); if (b) { e.preventDefault(); bagikanStok(cariId('stok', b.dataset.tawar), b); return; } var so = e.target.closest('[data-sold]'); if (so) { e.preventDefault(); bagikanTerjual(cariId('stok', so.dataset.sold), so); return; } var tl = e.target.closest('[data-tautan-sk]'); if (tl) { e.preventDefault(); var st = cariId('stok', tl.dataset.tautanSk); bagikanTautan(L.judulStok(st), L.urlUnit(st.kode)); } });
        gambarDaftarStok();
    }
    function adaStok(s) { return s.status === 'tersedia' || s.status === 'dipesan'; }
    function kelStok(s) { return s.kategori === 'aksesoris' ? 'aksesoris' : s.kondisi; }
    function chipStok(s) {
        var aks = s.kategori === 'aksesoris';
        return '<span class="st-chip ' + (aks ? 'st-menunggu_dp' : s.kondisi === 'baru' ? 'st-antri' : 'st-dikerjakan') + '">' + (aks ? 'Accessories' : L.KONDISI[s.kondisi] + (L.tingkatStok(s) ? ' ' + L.tingkatStok(s) : '')) + ' · ' + L.STATUS_STOK[s.status] + '</span>';
    }
    function gambarDaftarStok() {
        if (!$('#list')) return;
        var rows = cache.stok, bln = bulanIni(), hari = L.hariIni(), c = cariSk.trim().toLowerCase();
        var unit = { baru: 0, bekas: 0, aksesoris: 0 }, n = { tersedia: 0, baru: 0, bekas: 0, aksesoris: 0, terjual: 0 }, modal = 0, potensi = 0, tanpaHarga = 0, terjualUnit = 0, untung = 0, diWeb = 0;
        rows.forEach(function (s) {
            if (adaStok(s)) {
                var kel = kelStok(s);
                n.tersedia++; n[kel] = (n[kel] || 0) + 1;
                unit[kel] = (unit[kel] || 0) + (+s.jumlah || 0); modal += (+s.jumlah || 0) * (+s.harga_beli || 0); if (L.diKatalog(s)) diWeb++;
                if (+s.harga_jual > 0) potensi += (+s.jumlah || 0) * (s.harga_jual - (+s.harga_beli || 0)); else tanpaHarga++;
            }
            if ((s.penjualan || []).length) n.terjual++;
            (s.penjualan || []).forEach(function (p) { if (String(p.tgl).slice(0, 7) === bln) { terjualUnit += p.qty; untung += (p.harga - (+s.harga_beli || 0)) * p.qty; } });
        });
        $('#sk-rekap').innerHTML = '<div><span>In stock</span><span>' + (unit.baru + unit.bekas + unit.aksesoris) + ' unit</span></div>' +
            '<div><span>&nbsp; new / pre-owned watches / accessories</span><span>' + unit.baru + ' / ' + unit.bekas + ' / ' + unit.aksesoris + '</span></div>' +
            '<div><span>Shown in the website collection</span><span>' + diWeb + ' item(s)</span></div>' +
            (owner() ? '<div><span>Cost of stock</span><span>' + L.rupiah(modal) + '</span></div><div><span>Estimated profit if everything sells' + (tanpaHarga ? '<br><small class="ly-warn">' + tanpaHarga + ' item(s) have no price yet</small>' : '') + '</span><span>' + L.rupiah(potensi) + '</span></div>' : '') +
            '<div class="ly-total"><span>Sold this month</span><span>' + terjualUnit + ' unit' + (owner() ? ' · profit ' + L.rupiah(untung) : '') + '</span></div>';
        $('#filter').innerHTML = [['tersedia', 'In stock'], ['baru', 'New watches'], ['bekas', 'Pre-owned watches'], ['aksesoris', 'Accessories'], ['terjual', 'Sold'], ['semua', 'All']].map(function (x) {
            return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (filterSk === x[0]) + '">' + x[1] + '<b>' + (x[0] === 'semua' ? rows.length : n[x[0]] || 0) + '</b></button>';
        }).join('');
        var hasil = rows.filter(function (s) {
            var ok = filterSk === 'semua' ? true : filterSk === 'terjual' ? (s.penjualan || []).length > 0 : filterSk === 'tersedia' ? adaStok(s) : adaStok(s) && kelStok(s) === filterSk;
            return ok && (!c || [s.kode, s.nama, s.sub, s.arloji_jenis, s.arloji_merk, s.warna, s.no_seri, s.deskripsi].join(' ').toLowerCase().indexOf(c) > -1);
        });
        function kartu(s) {
            var u = L.untungStok(s), lama = L.hariAntara(s.tgl_masuk, hari), f = (s.foto || []).filter(function (x) { return x.repo === 'publik'; })[0], ada = adaStok(s), b = [];
            b.push(s.harga_jual > 0 ? ['', 'uang', 'Price <b>' + L.rupiah(s.harga_jual) + '</b>' + (ada ? ' · Stock <b>' + s.jumlah + '</b>' : '')] : ['sv-warn', 'uang', 'Selling price not set' + (ada ? ' · Stock <b>' + s.jumlah + '</b>' : '')]);
            b.push([ada && lama > 90 ? 'sv-warn' : 'sv-muted', 'tanggal', (owner() ? 'Cost ' + L.rupiah(s.harga_beli) + ' · ' : '') + (ada ? 'In ' + (lama > 0 ? lama + ' days ago' : 'today') : 'In ' + L.tgl(s.tgl_masuk))]);
            if (u.unitTerjual) b.push(['sv-ok', 'uang', 'Sold ' + u.unitTerjual + (owner() ? ' · profit ' + L.rupiah(u.untung) : '')]);
            return kartuIkon({ href: '#stok/' + E(s.id), kode: E(s.kode) + (L.diKatalog(s) ? ' 🌐' : ''), kodeIkon: 'stok', chip: chipStok(s), judul: L.namaStok(s), sub: L.jenisStok(s) + (s.warna ? ' · ' + s.warna : ''), foto: f ? (f.thumb_path || f.path) : true, baris: b, aksi: tombolKartuStok(s) });
        }
        $('#list').innerHTML = hasil.length ? hasil.map(kartu).join('') : '<p class="ly-kosong">' + (rows.length ? 'Nothing in this category.' : 'No stock yet. Tap “+ Add stock”.') + '</p>';
    }
    function teksTawar(s) {
        var judul = L.judulStok(s);
        return judul + (s.warna ? ' (' + s.warna + ')' : '') + ' – ' + (s.kondisi === 'bekas' ? 'USED' + (L.tingkatStok(s) ? ' (' + L.tingkatStok(s) + ')' : '') : 'NEW') + '\n' +
            (s.deskripsi ? s.deskripsi + '\n' : '') + 'Price: ' + L.rupiah(s.harga_jual) + '\n\nAvailable at ' + C.toko.nama + ', ' + C.toko.alamat +
            (L.diKatalog(s) ? '\nPhotos & details: ' + L.urlUnit(s.kode) : '') +
            '\nAsk / order: https://wa.me/' + C.toko.wa;
    }
    /* ---------- poster penawaran (gambar 1080×1920, pas untuk Story) + menu Bagikan ---------- */
    function gambarDari(b) { return new Promise(function (ok, gagal) { var u = URL.createObjectURL(b), im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { gagal(new Error('broken photo')); }; im.src = u; }); }
    function muatGambar(url, cache) {
        return fetch(url, { cache: cache || 'force-cache' }).then(function (r) { if (!r.ok) throw new Error('Photo ' + r.status); return r.blob(); }).then(gambarDari);
    }
    /* foto produk untuk poster: dibaca lewat GitHub (langsung benar begitu diunggah, tanpa menunggu situs selesai dibangun);
       bila gagal, dicoba dari situs dengan pengecekan ulang (cache 'force-cache' bisa menyimpan 404 dari sebelum situs selesai dibangun) */
    function muatFotoPoster(s, f) {
        return A.fotoBlob(s, f, true).then(gambarDari).catch(function () { return muatGambar(L.situs() + f.path, 'no-cache'); })
            .catch(function () { throw new Error('The product photo could not be loaded. Check your internet and try again.'); });
    }
    function barisTeks(c, teks, lebar, maks) {
        var kata = String(teks || '').replace(/\s+/g, ' ').trim().split(' '), baris = [], cur = '';
        kata.forEach(function (k) { var t = cur ? cur + ' ' + k : k; if (c.measureText(t).width > lebar && cur) { baris.push(cur); cur = k; } else cur = t; });
        if (cur) baris.push(cur);
        if (baris.length > maks) { baris = baris.slice(0, maks); var l = baris[maks - 1]; while (l.length > 1 && c.measureText(l + '…').width > lebar) l = l.slice(0, -1); baris[maks - 1] = l + '…'; }
        return baris;
    }
    function rect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    /* ---------- bagikan artikel yang sudah terbit (Story WhatsApp / Instagram, dll.): poster 1080×1920 + teks + tautan ---------- */
    function ringkasArtikel(a) {
        var r = String(a.ringkasan || '').trim();
        if (r) return r;
        return String(a.isi || '').replace(/^#+\s.*$/gm, '').replace(/[*_`>\[\]()-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    }
    function urlArtikel(a) { return L.situs() + 'journal-' + a.slug + '.html'; }
    function teksArtikel(a) { return a.judul + '\n\n' + ringkasArtikel(a) + '\n\nRead more: ' + urlArtikel(a); }
    /* Poster Story memuat sampai 3 foto TANPA dipotong: gitar (besar), sebelum, sesudah. Peran tiap foto dipilih di editor artikel (f.poster);
       bila belum dipilih, foto sebelum & sesudah dikenali dari keterangannya; selain itu satu foto sampul. */
    var PERAN_POSTER = { arloji: '', sebelum: 'SEBELUM', sesudah: 'SESUDAH' }; /* foto gitar tanpa tulisan; hanya sebelum & sesudah yang berlabel */
    function fotoArtikelPublik(a) { return (a.foto || []).filter(function (f) { return f.path; }); }
    function fotoPosterArtikel(a) {
        var f = fotoArtikelPublik(a), hasil = [];
        ['arloji', 'sebelum', 'sesudah'].forEach(function (p) {
            var x = f.filter(function (y) { return y.poster === p; })[0];
            if (x) hasil.push({ f: x, peran: p, label: PERAN_POSTER[p] });
        });
        if (hasil.length) return hasil;
        function cari(re) { return f.filter(function (x) { return re.test(String(x.alt || '')); })[0]; }
        var sb = cari(/sebelum|before/i), ss = cari(/sesudah|after/i);
        return sb && ss && sb !== ss ? [{ f: sb, peran: 'sebelum', label: 'SEBELUM' }, { f: ss, peran: 'sesudah', label: 'SESUDAH' }] : [];
    }
    /* tata letak area foto (960 x 760): 1 foto = penuh; 2 foto = berdampingan; 3 foto = gitar besar di kiri, sebelum & sesudah bertumpuk di kanan */
    function selFotoPoster(n) {
        if (n === 1) return [{ x: 60, y: 235, w: 960, h: 760 }];
        if (n === 2) return [{ x: 60, y: 235, w: 470, h: 760 }, { x: 550, y: 235, w: 470, h: 760 }];
        return [{ x: 60, y: 235, w: 570, h: 760 }, { x: 650, y: 235, w: 370, h: 370 }, { x: 650, y: 625, w: 370, h: 370 }];
    }
    /* Poster foto Jubeliwatch (Story 1080x1920): dipakai poster artikel dan poster servis.
       o: daftar [{f,label}], muat(d) -> Promise gambar, tag, judul, maksJudul, ringkas (paragraf) ATAU butir (baris pendek), ajakan.
       Sisi kanan (x 640-1020, y 1538-1628) dikosongkan untuk stiker tautan Instagram yang ditambahkan manual. */
    function susunPosterFoto(o) {
        var fonts = Promise.all(['700 70px "Playfair Display"', '700 40px "DM Sans"'].map(function (f) { return document.fonts && document.fonts.load ? document.fonts.load(f) : null; }));
        fonts = Promise.race([fonts, new Promise(function (ok) { setTimeout(ok, 1200); })]).catch(function () {});
        return Promise.all([Promise.all(o.daftar.map(o.muat)), muatGambar(L.situs() + 'logo/jubeli-logo-putih.svg').catch(function () { return null; }), fonts]).then(function (r) {
            var im = r[0], logo = r[1];
            var cv = document.createElement('canvas'), W = 1080, H = 1920, EMAS = '#D2B27A', SERIF = 'Playfair Display, Georgia, serif', SANS = '"DM Sans", system-ui, sans-serif';
            cv.width = W; cv.height = H;
            var c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, H), wa = '0' + String(C.toko.wa).slice(2);
            wa = wa.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3'); c.textBaseline = 'alphabetic';
            g.addColorStop(0, '#5a6650'); g.addColorStop(1, '#262b1f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
            c.fillStyle = '#f4f0e8'; c.font = '600 54px ' + SERIF; c.textAlign = 'center'; c.fillText('jubeli', W / 2 - c.measureText('watch').width / 2, 170); c.fillStyle = EMAS; c.fillText('watch', W / 2 + c.measureText('jubeli').width / 2, 170); c.textAlign = 'left';
            var gl = c.createRadialGradient(W / 2, 620, 60, W / 2, 620, 760); gl.addColorStop(0, 'rgba(210,178,122,.22)'); gl.addColorStop(1, 'rgba(210,178,122,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, 1300);
            /* foto utuh (tidak dipotong), dipusatkan di selnya; bingkai mengikuti ukuran foto */
            function bingkai(foto, sel, label) {
                var k = Math.min(sel.w / foto.width, sel.h / foto.height), w = foto.width * k, h = foto.height * k, x = sel.x + (sel.w - w) / 2, y = sel.y + (sel.h - h) / 2;
                c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 36; c.shadowOffsetY = 12; rect(c, x, y, w, h, 28); c.fillStyle = '#000'; c.fill(); c.restore();
                c.save(); rect(c, x, y, w, h, 28); c.clip(); c.drawImage(foto, x, y, w, h); c.restore();
                rect(c, x, y, w, h, 28); c.strokeStyle = 'rgba(210,178,122,.55)'; c.lineWidth = 3; c.stroke();
                if (label) {
                    c.font = '800 ' + (w < 300 ? 20 : 24) + 'px ' + SANS; var lw = c.measureText(label).width + 36; rect(c, x + 14, y + 14, lw, 42, 21); c.fillStyle = 'rgba(38,43,31,.85)'; c.fill();
                    c.fillStyle = EMAS; c.fillText(label, x + 32, y + 43);
                }
            }
            var sel = selFotoPoster(Math.max(1, o.daftar.length)), ada = 0;
            im.forEach(function (foto, n) { if (foto) { bingkai(foto, sel[n], o.daftar[n].label); ada++; } });
            if (!ada && logo) { var lw0 = 240, lh0 = lw0 * logo.height / logo.width; c.globalAlpha = .25; c.drawImage(logo, 60 + (960 - lw0) / 2, 235 + (760 - lh0) / 2, lw0, lh0); c.globalAlpha = 1; }
            /* label + judul + isi */
            var cy = 1020, tag = String(o.tag).toUpperCase(); c.font = '800 28px ' + SANS;
            var bw = c.measureText(tag).width + 52; rect(c, 60, cy, bw, 56, 28); c.fillStyle = EMAS; c.fill(); c.fillStyle = '#262b1f'; c.fillText(tag, 86, cy + 38);
            c.fillStyle = '#fff'; c.font = '700 64px ' + SERIF;
            var y = 1156; barisTeks(c, o.judul, 960, o.maksJudul || 3).forEach(function (b) { c.fillText(b, 60, y); y += 74; });
            if (o.ringkas) { c.fillStyle = '#d8cfc3'; c.font = '500 32px ' + SANS; barisTeks(c, o.ringkas, 960, Math.max(0, Math.min(4, Math.floor((1500 - y) / 44)))).forEach(function (b) { y += 44; c.fillText(b, 60, y); }); }
            if (o.butir) { c.fillStyle = '#d8cfc3'; c.font = '600 34px ' + SANS; o.butir.slice(0, Math.max(0, Math.floor((1500 - y) / 46))).forEach(function (b) { y += 46; c.fillText(barisTeks(c, b, 960, 1)[0], 60, y); }); }
            /* penutup: logo, ajakan, WhatsApp, alamat */
            c.fillStyle = 'rgba(210,178,122,.35)'; c.fillRect(60, 1528, 960, 2);
            var tx = 60; if (logo) { var lh1 = 120, lw1 = lh1 * logo.width / logo.height; c.drawImage(logo, 60, 1546, lw1, lh1); tx = 60 + lw1 + 32; }
            c.fillStyle = '#25D366'; c.beginPath(); c.arc(tx + 24, 1584, 24, 0, 7); c.fill();
            c.save(); c.translate(tx + 24 - 14, 1584 - 14); c.scale(28 / 24, 28 / 24); c.fillStyle = '#fff'; c.fill(new Path2D(WA_IKON.match(/ d="([^"]+)"/)[1])); c.restore();
            c.fillStyle = '#fff'; c.font = '800 42px ' + SANS; c.fillText(wa, tx + 64, 1598);
            var web = L.situs().replace(/^https?:\/\//, '').replace(/\/$/, '');
            c.fillStyle = EMAS; c.font = '700 30px ' + SANS; c.fillText(o.ajakan + web, tx, 1642);
            c.fillStyle = '#b9ad9d'; c.font = '500 24px ' + SANS; c.fillText(barisTeks(c, C.toko.alamat, 1020 - tx, 1)[0], tx, 1672);
            return new Promise(function (ok, gagal) { cv.toBlob(function (b) { b ? ok(b) : gagal(new Error('Could not create the image.')); }, 'image/jpeg', .85); });
        });
    }
    function buatPosterArtikel(a) {
        var pilihan = fotoPosterArtikel(a), sampul = fotoArtikelPublik(a)[0];
        var daftar = pilihan.length ? pilihan : sampul ? [{ f: sampul, label: '' }] : [];
        return susunPosterFoto({
            daftar: daftar, muat: function (d) { return muatGambar(L.situs() + d.f.path, 'no-cache').catch(function () { return null; }); },
            tag: a.tag || 'Journal', judul: a.judul, ringkas: ringkasArtikel(a), ajakan: 'Read at '
        });
    }
    /* ---------- poster servis untuk pemasaran (Story WhatsApp / Instagram) ----------
       Hanya dua jenis, sesuai status: "Sedang dikerjakan" (status Dikerjakan) dan "Hasil servis" (Selesai / Diambil, sebelum & sesudah).
       Publik: TANPA nama, nomor HP, kode, dan harga; hanya nama jasa. Wajib centang "Pelanggan setuju foto gitarnya dipakai" di form servis.
       Untuk kabar ke pelanggan sudah ada draf WhatsApp, jadi poster ini khusus pemasaran. */
    function modePosterServis(s) { return s.status === 'dikerjakan' ? 'proses' : (s.status === 'selesai' || s.status === 'diambil') ? 'hasil' : null; }
    function jasaPoster(s) {
        var ada = {}, hasil = [];
        (s.items || []).forEach(function (i) {
            var n = String(i.nama || '').replace(/\s+/g, ' ').trim();
            if (i.jenis !== 'jasa' || !n || /^(biaya penitipan|storage fee)/i.test(n) || ada[n.toLowerCase()]) return;
            ada[n.toLowerCase()] = 1; hasil.push(n);
        });
        return hasil;
    }
    /* foto poster servis: urutan gitar, sebelum, sesudah (cocok dengan selFotoPoster); "sedang dikerjakan" cukup satu foto */
    function fotoPosterServis(s, mode) {
        var f = s.foto || [], ambil = function (t) { return f.filter(function (x) { return L.tahapFoto(x) === t; })[0]; };
        var g = ambil('arloji'), sb = ambil('sebelum'), ss = ambil('sesudah');
        if (mode === 'proses') { var satu = g || sb || ss; return satu ? [{ f: satu, label: '' }] : []; }
        var d = []; if (g) d.push({ f: g, label: '' }); if (sb) d.push({ f: sb, label: 'SEBELUM' }); if (ss) d.push({ f: ss, label: 'SESUDAH' });
        return d;
    }
    function buatPosterServis(o) {
        var s = o.s, mode = o.mode, daftar = fotoPosterServis(s, mode), jasa = jasaPoster(s);
        var butir = jasa.length > 5 ? jasa.slice(0, 4).concat('and ' + (jasa.length - 4) + ' other jobs') : jasa;
        return susunPosterFoto({
            daftar: daftar, muat: function (d) { return muatFotoPoster(s, d.f).catch(function () { return null; }); },
            tag: mode === 'proses' ? 'In progress' : 'Service result', judul: L.namaGitar(s, 'Watch'), maksJudul: 2,
            butir: butir.map(function (n) { return '•  ' + n; }), ajakan: 'Watch service at '
        });
    }
    function teksPosterServis(s, mode) {
        var jasa = jasaPoster(s), judul = L.namaGitar(s, 'Watch');
        return (mode === 'proses' ? 'On the bench at ' + C.toko.nama + ': ' + judul : 'Service result ' + judul + ' at ' + C.toko.nama) +
            (jasa.length ? '\nWork: ' + jasa.join(', ') : '') + '\n\nWatch service at ' + C.toko.nama + ', ' + C.toko.alamat + '\nAsk / book: https://wa.me/' + C.toko.wa;
    }
    function bagikanServis(s, tombol) {
        var mode = s && modePosterServis(s); if (!mode) return;
        if (!s.izin_publikasi) return toast('The customer has not agreed to the photos being used. Tick the customer-consent box in the service form first.', true);
        if (!fotoPosterServis(s, mode).length) return toast('There are no service photos yet. Add photos (Watch / Before / After) in the service form first.', true);
        bagikanPoster(s, teksPosterServis(s, mode), { servis: { s: s, mode: mode } }, tombol);
    }
    function tombolPosterServis(s) { var m = modePosterServis(s); return m ? tombolIkon('poster-sv', s.id, 'kirim', m === 'proses' ? 'Share poster: in progress' : 'Share poster: service result') : ''; }
    /* WhatsApp / chat: cukup TAUTAN (tampil sebagai kartu pratinjau yang bisa diketuk). Di browser lewat menu bagikan; di aplikasi & PC lewat WhatsApp tanpa nomor */
    function bagikanLinkArtikel(a) {
        if (a.status !== 'terbit') return toast('Only published articles can be shared.', true);
        bagikanTautan(a.judul, urlArtikel(a));
    }
    /* menu bagikan HP yang universal (WhatsApp, Instagram, Telegram, SMS, dll): lewat aplikasi AYRI POS 1.4.1+ atau menu bagikan browser; bila tidak ada, tautan disalin */
    function bagikanTautan(judul, url) {
        if (bisaBagikanTeksApp()) kirimKeAplikasi('bagikanTeks', { teks: judul + '\n' + url });
        else if (navigator.share) navigator.share({ title: judul, url: url }).catch(function (e) { if (!e || e.name !== 'AbortError') salinLink(url); });
        else salinLink(url);
    }
    function bisaBagikanTeksApp() {
        /* op bagikanTeks ada sejak AYRI POS 1.4.1 (1.4.0 hanya punya pilihKontak) */
        var m = /AyriApp\/(\d+)\.(\d+)(?:\.(\d+))?/.exec(navigator.userAgent);
        return !!m && adaAplikasi() && typeof window.AyriApp.postMessage === 'function' && (+m[1] > 1 || (+m[1] === 1 && (+m[2] > 4 || (+m[2] === 4 && +(m[3] || 0) >= 1))));
    }
    function salinLink(url) {
        function ok() { toast('Link copied. Paste it into any app.'); }
        function cadangan() {
            var t = document.createElement('textarea'); t.value = url; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
            var berhasil = false; try { berhasil = document.execCommand('copy'); } catch (e) {} document.body.removeChild(t);
            if (berhasil) ok(); else toast('Link: ' + url, true);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, cadangan); else cadangan();
    }
    function bagikanArtikel(a, tombol) {
        if (a.status !== 'terbit') return toast('Only published articles can be shared.', true);
        bagikanPoster(null, teksArtikel(a), { artikel: a }, tombol);
    }
    /* opsi.sewa = { harian: tarif 1 hari (0 = sesuai lama sewa), deposit } membuat poster penawaran SEWA dengan foto unit */
    function buatPoster(s, opsi) {
        if (opsi && opsi.artikel) return buatPosterArtikel(opsi.artikel);
        if (opsi && opsi.servis) return buatPosterServis(opsi.servis);
        var sewa = opsi && opsi.sewa, sold = opsi && opsi.terjual; /* sold = poster gitar yang sudah terjual: cap SOLD, tanpa harga dan tanpa data pembeli */
        var fp = (s.foto || []).filter(function (f) { return f.repo === 'publik'; })[0];
        var judul = L.judulStok(s);
        var fonts = Promise.all(['700 70px Playfair Display', '700 40px "DM Sans"'].map(function (f) { return document.fonts && document.fonts.load ? document.fonts.load(f) : null; }));
        fonts = Promise.race([fonts, new Promise(function (ok) { setTimeout(ok, 1200); })]).catch(function () {});
        var foto = fp ? muatFotoPoster(s, fp) : Promise.resolve(null);
        return Promise.all([foto, muatGambar(L.situs() + 'logo/jubeli-logo-putih.svg').catch(function () { return null; }), fonts]).then(function (r) {
            var cv = document.createElement('canvas'), W = 1080, H = 1920, EMAS = '#D2B27A', SERIF = 'Playfair Display, Georgia, serif', SANS = '"DM Sans", system-ui, sans-serif';
            cv.width = W; cv.height = H;
            var c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, H), wa = '0' + String(C.toko.wa).slice(2), jenis = s.kategori === 'aksesoris' ? (s.sub || 'Accessories') : (L.tingkatStok(s) || (sewa ? 'PRE-OWNED' : ''));
            wa = wa.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3'); c.textBaseline = 'alphabetic';
            g.addColorStop(0, '#5a6650'); g.addColorStop(1, '#262b1f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
            c.fillStyle = '#f4f0e8'; c.font = '600 54px ' + SERIF; c.textAlign = 'center'; c.fillText('jubeli', W / 2 - c.measureText('watch').width / 2, 170); c.fillStyle = EMAS; c.fillText('watch', W / 2 + c.measureText('jubeli').width / 2, 170); c.textAlign = 'left';
            var gl = c.createRadialGradient(W / 2, 620, 60, W / 2, 620, 760); gl.addColorStop(0, 'rgba(210,178,122,.22)'); gl.addColorStop(1, 'rgba(210,178,122,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, 1300);
            /* foto: muat utuh (tidak terpotong), dipusatkan. Area teks Story: sisakan ±250 px atas & bawah */
            var fx = 60, fy = 250, fw = 960, fh = 740;
            if (r[0]) {
                var im = r[0], k = Math.min(fw / im.width, fh / im.height), w = im.width * k, h = im.height * k, x0 = fx + (fw - w) / 2, y0 = fy + (fh - h) / 2;
                c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 50; c.shadowOffsetY = 18; rect(c, x0, y0, w, h, 40); c.fillStyle = '#000'; c.fill(); c.restore();
                c.save(); rect(c, x0, y0, w, h, 40); c.clip(); c.drawImage(im, x0, y0, w, h); c.restore();
                rect(c, x0, y0, w, h, 40); c.strokeStyle = 'rgba(210,178,122,.55)'; c.lineWidth = 3; c.stroke();
            }
            else if (r[1]) { var lw = 240, lh = lw * r[1].height / r[1].width; c.globalAlpha = .25; c.drawImage(r[1], fx + (fw - lw) / 2, fy + (fh - lh) / 2, lw, lh); c.globalAlpha = 1; }
            /* cap SOLD: pelat gelap + bingkai ganda merah, miring, di tengah area foto */
            if (sold) {
                var sw = 600, sh = 210;
                c.save(); c.translate(fx + fw / 2, fy + fh / 2); c.rotate(-0.2);
                c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; rect(c, -sw / 2, -sh / 2, sw, sh, 26); c.fillStyle = 'rgba(13,10,7,.62)'; c.fill(); c.shadowBlur = 0;
                c.strokeStyle = '#E5373F'; c.lineWidth = 12; rect(c, -sw / 2, -sh / 2, sw, sh, 26); c.stroke();
                c.lineWidth = 4; rect(c, -sw / 2 + 24, -sh / 2 + 24, sw - 48, sh - 48, 14); c.stroke();
                c.fillStyle = '#E5373F'; c.font = '800 150px ' + SANS; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SOLD', 0, 8);
                c.restore();
            }
            /* lencana: kondisi (isi emas) + tingkat kondisi gitar bekas / kategori aksesoris (garis emas). Jenis gitar tidak diulang: sudah ada di judul */
            var kond = sewa ? 'RENT' : s.kondisi === 'bekas' ? 'PRE-OWNED' : 'NEW', cy = 1040; c.font = '800 28px ' + SANS;
            var bw = c.measureText(kond).width + 52; rect(c, 60, cy, bw, 56, 28); c.fillStyle = EMAS; c.fill(); c.fillStyle = '#262b1f'; c.fillText(kond, 86, cy + 38);
            if (jenis) { c.font = '700 28px ' + SANS; var jw = c.measureText(jenis.toUpperCase()).width + 52; rect(c, 60 + bw + 12, cy, jw, 56, 28); c.strokeStyle = 'rgba(210,178,122,.7)'; c.lineWidth = 2; c.stroke(); c.fillStyle = EMAS; c.fillText(jenis.toUpperCase(), 86 + bw + 12, cy + 38); }
            /* nama + warna */
            c.fillStyle = '#fff'; c.font = '700 66px ' + SERIF;
            var y = 1176; barisTeks(c, judul, 960, 2).forEach(function (b) { c.fillText(b, 60, y); y += 76; });
            if (String(s.warna || '').trim()) { c.fillStyle = '#c9bfb2'; c.font = '600 34px ' + SANS; c.fillText(s.warna, 60, y - 14); y += 40; }
            /* harga: "Rp" kecil + angka besar */
            if (sold) {
                c.fillStyle = EMAS; c.font = '700 66px ' + SERIF; c.fillText('Has a new owner', 60, y + 70); y += 100;
                c.fillStyle = '#d8cfc3'; c.font = '600 32px ' + SANS; c.fillText('Thank you for your trust.', 60, y + 14); y += 70;
            } else if (sewa) {
                if (sewa.harian > 0) {
                    var ang = L.rupiah(sewa.harian).replace(/^Rp\s*/, '');
                    c.fillStyle = EMAS; c.font = '600 46px ' + SERIF; c.fillText('Rp', 60, y + 62); var rw0 = c.measureText('Rp').width + 12;
                    c.font = '700 108px ' + SERIF; c.fillText(ang, 60 + rw0, y + 76); var aw = c.measureText(ang).width;
                    c.fillStyle = '#c9bfb2'; c.font = '600 40px ' + SANS; c.fillText('/ day', 60 + rw0 + aw + 18, y + 76);
                } else { c.fillStyle = EMAS; c.font = '700 66px ' + SERIF; c.fillText('Rate depends on rental length', 60, y + 70); }
                y += 100;
                c.fillStyle = '#d8cfc3'; c.font = '600 32px ' + SANS; c.fillText('Deposit ' + L.rupiah(sewa.deposit) + ' · returned when the watch comes back', 60, y + 14); y += 70;
            } else {
            var angka = L.rupiah(s.harga_jual).replace(/^Rp\s*/, '');
            c.fillStyle = EMAS; c.font = '600 46px ' + SERIF; c.fillText('Rp', 60, y + 62); var rw = c.measureText('Rp').width + 12;
            c.font = '700 108px ' + SERIF; c.fillText(angka, 60 + rw, y + 76); y += 100;
            }
            /* deskripsi */
            if (!sewa && !sold && String(s.deskripsi || '').trim()) { c.fillStyle = '#d8cfc3'; c.font = '500 32px ' + SANS; barisTeks(c, s.deskripsi, 960, Math.max(0, Math.min(2, Math.floor((1528 - y) / 44)))).forEach(function (b) { y += 44; c.fillText(b, 60, y + 6); }); }
            /* penutup: logo besar di kiri; di kanannya nomor WhatsApp, ajakan ke situs, dan alamat (gambar tidak bisa diketuk, jadi semuanya teks biasa) */
            c.fillStyle = 'rgba(210,178,122,.35)'; c.fillRect(60, 1528, 960, 2);
            var tx = 60; if (r[1]) { var lh1 = 120, lw1 = lh1 * r[1].width / r[1].height; c.drawImage(r[1], 60, 1546, lw1, lh1); tx = 60 + lw1 + 32; }
            c.fillStyle = '#25D366'; c.beginPath(); c.arc(tx + 24, 1584, 24, 0, 7); c.fill();
            c.save(); c.translate(tx + 24 - 14, 1584 - 14); c.scale(28 / 24, 28 / 24); c.fillStyle = '#fff'; c.fill(new Path2D(WA_IKON.match(/ d="([^"]+)"/)[1])); c.restore();
            c.fillStyle = '#fff'; c.font = '800 42px ' + SANS; c.fillText(wa, tx + 64, 1598);
            var web = L.situs().replace(/^https?:\/\//, '').replace(/\/$/, '');
            c.fillStyle = EMAS; c.font = '700 30px ' + SANS; c.fillText((sold ? 'Looking for a similar watch? See the collection at ' : 'See the full collection at ') + web, tx, 1642);
            c.fillStyle = '#b9ad9d'; c.font = '500 24px ' + SANS; c.fillText(barisTeks(c, C.toko.alamat, 1020 - tx, 1)[0], tx, 1672);
            return new Promise(function (ok, gagal) { cv.toBlob(function (b) { b ? ok(b) : gagal(new Error('Could not create the image.')); }, 'image/jpeg', .85); });
        });
    }
    function blobBase64(b) { return new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(String(f.result).split(',')[1] || ''); }; f.readAsDataURL(b); }); }
    /* Bagikan: poster + teks lewat menu bagikan HP (WA, Status WA, Instagram, Threads, X, dll). Di PC tanpa menu bagikan berkas: hanya teks, lewat menu bagikan atau WhatsApp. */
    function bagikanStok(s, tombol) { bagikanPoster(s, teksTawar(s), null, tombol); }
    /* poster SOLD untuk Story: gitar yang sudah terjual (cap SOLD, tanpa harga & tanpa data pembeli) */
    function bisaPosterSold(s) { return s.status === 'terjual' && s.kategori !== 'aksesoris' && (s.foto || []).some(function (f) { return f.repo === 'publik'; }); }
    function teksTerjual(s) { return L.judulStok(s) + (s.warna ? ' (' + s.warna + ')' : '') + ' – SOLD\nThank you for your trust!\nLooking for a similar watch? See the collection: ' + L.situs() + 'collection.html\nAsk / order: https://wa.me/' + C.toko.wa; }
    function bagikanTerjual(s, tombol) { bagikanPoster(s, teksTerjual(s), { terjual: true }, tombol); }
    function bagikanPoster(s, teks, opsi, tombol) {
        var nama = 'jubeliwatch-' + (opsi && opsi.artikel ? 'journal-' + String(opsi.artikel.slug || 'artikel').slice(0, 60) : opsi && opsi.servis ? 'servis-' + opsi.servis.mode + '-' + idAcak().slice(-5) : (opsi && opsi.sewa ? 'rental-' : opsi && opsi.terjual ? 'sold-' : '') + String(s.kode || 'barang').toLowerCase()) + '.jpg';
        if (tombol) sibuk(tombol, true, 'Preparing…');
        function lepas() { if (tombol) sibuk(tombol, false); }
        /* PC / browser tanpa menu bagikan berkas: tanpa unduhan gambar, kirim teks penawaran lewat WhatsApp */
        var cobaBerkas = adaAplikasi() || !!(navigator.canShare && navigator.canShare({ files: [new File([''], nama, { type: 'image/jpeg' })] }));
        if (!cobaBerkas) { lepas(); if (navigator.share) { navigator.share({ text: teks, title: C.toko.nama }).catch(function () {}); } else bukaWa('', teks); return; }
        buatPoster(s, opsi).then(function (blob) {
            if (adaAplikasi()) return blobBase64(blob).then(function (b64) { kirimKeAplikasi('bagikan', { nama: nama, mime: 'image/jpeg', b64: b64, teks: teks }); });
            return navigator.share({ files: [new File([blob], nama, { type: 'image/jpeg' })], text: teks, title: C.toko.nama });
        }).catch(function (e) { if (e && e.name !== 'AbortError') toast('Could not share: ' + (e.message || e), true); }).then(lepas);
    }
    function stokKosong() {
        return { kategori: 'arloji', kondisi: 'bekas', tingkat: '', arloji_jenis: C.jenisArloji[0], arloji_merk: '', sub: C.kategoriAksesoris[0], nama: '', warna: '', no_seri: '', deskripsi: '', jumlah: 1, harga_beli: 0, harga_jual: 0, tgl_masuk: L.hariIni(), asal: '', status: 'tersedia', tampil: true, penjualan: [], foto: [], catatan_admin: '' };
    }
    function bukaStok(id) { ambilCatatan('stok', id, stokKosong, function (s) { s.foto = s.foto || []; s.penjualan = s.penjualan || []; sk = { baru: !id, s: s, antri: [] }; gambarStok(); }); }
    function gambarStok() {
        var s = sk.s, jenis = C.jenisArloji.slice(), subs = C.kategoriAksesoris.slice();
        s.kategori = s.kategori || 'arloji';
        if (s.arloji_jenis && jenis.indexOf(s.arloji_jenis) < 0) jenis.push(s.arloji_jenis);
        if (s.sub && subs.indexOf(s.sub) < 0) subs.push(s.sub);
        var aks = s.kategori === 'aksesoris';
        app.innerHTML = '<section id="sk" class="ly-f"><div class="ly-head"><a class="ly-back" href="#stok">‹ Stock list</a></div>' +
            '<div class="ly-head"><h1>' + (sk.baru ? 'Add stock' : E(L.namaStok(s))) + '</h1>' + (sk.baru ? '' : chipStok(s)) + '</div>' +
            (sk.baru ? '' : kodeBaris(s, L.diKatalog(s) ? ' <a target="_blank" href="' + E(L.urlUnit(s.kode)) + '">🌐 view in collection</a>' : '')) +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Item</legend>' +
            '<div class="ly-status" id="sk-kategori">' + [['arloji', 'Watch'], ['aksesoris', 'Accessories']].map(function (k) { return '<button type="button" data-kategori="' + k[0] + '" aria-pressed="' + (s.kategori === k[0]) + '">' + k[1] + '</button>'; }).join('') + '</div>' +
            '<div class="ly-status" id="sk-kondisi"' + (aks ? ' hidden' : '') + '>' + ['baru', 'bekas'].map(function (k) { return '<button type="button" data-kondisi="' + k + '" aria-pressed="' + (s.kondisi === k) + '">' + L.KONDISI[k] + '</button>'; }).join('') + '</div>' +
            '<div id="sk-tingkat" class="ly-f"' + (!aks && s.kondisi === 'bekas' ? '' : ' hidden') + '><label><span class="ly-lt">Condition grade (poster &amp; collection)' + bantu('tip-tingkat') + '</span><select data-s="tingkat">' + opsi([['', 'Not graded']].concat(C.tingkatKondisi.map(function (t) { return [t[0], t[1]]; })), s.tingkat || '') + '</select></label>' +
            tip('tip-tingkat', C.tingkatKondisi.map(function (t) { return '<b>' + E(t[1]) + '</b>: ' + E(t[2]); }).join('. ') + '. Still list any flaws in the description.') + '</div>' +
            '<div id="sk-gitar"' + (aks ? ' hidden' : '') + ' class="ly-f"><div class="ly-row2"><label>Movement<select data-s="arloji_jenis">' + opsi(jenis, s.arloji_jenis) + '</select></label><label>Brand / model<input data-s="arloji_merk" placeholder="e.g. Seiko 5 SNK809"></label></div>' +
            '<label>Serial number (not shown on the website)<input data-s="no_seri" autocapitalize="characters"></label></div>' +
            '<div id="sk-aks"' + (aks ? '' : ' hidden') + ' class="ly-f"><div class="ly-row2"><label>Category<select data-s="sub">' + opsi(subs, s.sub) + '</select></label><label>Product name<input data-s="nama" placeholder="e.g. 20 mm leather strap, brown"></label></div></div>' +
            '<label><span id="sk-lbl-warna">' + (aks ? LBL_VARIAN : 'Dial colour') + '</span><input data-s="warna" placeholder="' + (aks ? PH_VARIAN : 'e.g. Silver sunburst') + '"></label>' +
            '<label>Description (condition, specs, inclusions)<textarea data-s="deskripsi" rows="3" placeholder="e.g. 36 mm case, recently serviced, box and papers"></textarea></label></fieldset>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Price &amp; quantity</legend>' +
            '<div class="ly-row2">' + (owner() ? '<label>Cost / purchase price per unit (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-s="harga_beli"></label>' : '') + '<label>Selling price (Rp)<input type="text" inputmode="numeric" autocomplete="off" data-rp data-s="harga_jual"></label></div>' +
            '<div class="ly-row2"><label>Quantity in stock<input type="number" inputmode="numeric" min="0" data-s="jumlah"></label><label>Date in (not shown on the website)<input type="date" data-s="tgl_masuk"></label></div>' +
            (owner() ? '<label>Source (optional, not shown on the website)<input data-s="asal" placeholder="e.g. bought from a customer / supplier / trade-in"></label>' : '') +
            '<label class="ly-cek"><input type="checkbox" id="sk-tampil"> 🌐 Show in the website collection (when in stock and priced)</label>' +
            '<div class="ly-sum owner-saja" id="sk-sum"></div></fieldset>' +
            '<fieldset class="ly-card"><legend>Photos</legend><div id="sk-foto"></div><p class="ly-hint" style="margin-top:10px">Product photos appear in the website collection (not encrypted). The first photo is the cover.</p></fieldset>' +
            (sk.baru ? '' : '<fieldset class="ly-card"><legend>Sales</legend><div class="ly-bayar" id="sk-jual"></div>' +
                (L.sewaAktifStok(s.id, cache.sewa) ? '<p class="ly-hint" style="margin:10px 0 0"><b>Rented out</b> to ' + E(L.sewaAktifStok(s.id, cache.sewa).nama) + ' until ' + L.tgl(L.batasSewa(L.sewaAktifStok(s.id, cache.sewa))) + '. <a href="#sewa/' + E(L.sewaAktifStok(s.id, cache.sewa).id) + '">Open rental</a></p>' : '') +
                (SEWA_AKTIF && L.bisaDisewa(s, cache.sewa) ? '<div class="ly-btns" style="margin-top:10px"><button type="button" class="ly-btn" id="sk-sewa-baru">Rent out this watch</button></div>' : '') +
                (L.titipanTerkunci(s) ? '<p class="ly-ingat ly-ingat--info"><span><b>Consigned watch.</b> Selling through Checkout is not available yet (coming soon).' + (owner() ? ' <a href="#titip/' + E(s.sumber_titip) + '">Open consignment record</a>' : '') + '</span></p>' : '') +
                (+s.jumlah > 0 && s.status !== 'ditarik' && !L.sewaAktifStok(s.id, cache.sewa) && !L.titipanTerkunci(s) ? '<div class="ly-btns" style="margin-top:10px"><button type="button" class="ly-btn ly-btn--pri" id="sk-jual-baru">Sell / reserve with deposit</button></div>' +
                    '<p class="ly-hint" style="margin:8px 0 0">Paid in full = sold right away. Part payment = deposit: the item is held for ' + C.jual.batasHari + ' days, and the receipt and balance reminders go by WhatsApp.</p>' : '') + '</fieldset>') +
            '<fieldset class="ly-card ly-f"><legend>Status</legend><div class="ly-status" id="sk-status"></div><p class="ly-hint" id="sk-status-info" hidden></p><label>Internal note<textarea data-s="catatan_admin" rows="2"></textarea></label></fieldset>' +
            (sk.baru ? '' : '<fieldset class="ly-card"><legend>More</legend>' + kisiAksi([].concat(s.harga_jual && adaStok(s) ? [aksi({ id: 'sk-tawar', ikon: 'kirim', teks: 'Share poster &amp; offer', kelas: 'ly-akt--pri ly-akt--lebar' })] : [])
                .concat(bisaPosterSold(s) ? [aksi({ id: 'sk-sold', ikon: 'kirim', teks: 'SOLD poster (Story)', kelas: 'ly-akt--pri ly-akt--lebar' })] : [])
                .concat(L.diKatalog(s) ? [aksi({ href: E(L.urlUnit(s.kode)), luar: true, ikon: 'lihat', teks: 'View item page' })] : [])
                .concat(owner() ? [aksi({ id: 'sk-hapus', ikon: 'hapus', teks: 'Delete record', kelas: 'ly-akt--del' })] : [])) + '</fieldset>') +
            '<div class="ly-save"><span class="ly-dirty" id="dirty" hidden>Not saved</span><button type="button" class="ly-btn ly-btn--pri" id="sk-simpan">' + (sk.baru ? 'Save stock' : 'Save changes') + '</button></div></section>';
        susunDua(['Sales', 'Status', 'More']);
        $$('[data-s]', app).forEach(function (el) { var v = s[el.dataset.s]; el.value = v == null ? '' : v; });
        $('#sk-tampil').checked = s.tampil !== false;
        gambarSumStok(); gambarStatusStok(); gambarJual(); gambarFotoStok(); setDirty(false);
        var el = $('#sk');
        function tampilTingkat() { $('#sk-tingkat').hidden = !(s.kategori !== 'aksesoris' && s.kondisi === 'bekas'); }
        function ubah(e) {
            var t = e.target, k = t.dataset.s;
            if (t.id === 'sk-tampil') { s.tampil = t.checked; setDirty(true); return; }
            if (!k) return;
            s[k] = /^(harga_beli|harga_jual|jumlah)$/.test(k) ? Math.max(0, Math.round(+t.value || 0)) : t.value; setDirty(true);
            if (/harga|jumlah/.test(k)) gambarSumStok();
        }
        el.addEventListener('input', ubah); el.addEventListener('change', ubah);
        el.addEventListener('click', function (e) {
            var b = e.target.closest('button'); if (!b) return; var d = b.dataset;
            if (d.kondisi) { s.kondisi = d.kondisi; $$('#sk-kondisi button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.kondisi === s.kondisi); }); tampilTingkat(); setDirty(true); }
            else if (d.kategori) {
                s.kategori = d.kategori; var aks = s.kategori === 'aksesoris';
                if (aks && sk.baru) { s.kondisi = 'baru'; $$('#sk-kondisi button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.kondisi === 'baru'); }); }
                $$('#sk-kategori button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.kategori === s.kategori); });
                $('#sk-gitar').hidden = aks; $('#sk-aks').hidden = !aks; $('#sk-kondisi').hidden = aks; if (aks) s.kondisi = 'baru'; tampilTingkat(); $('#sk-lbl-warna').textContent = aks ? LBL_VARIAN : 'Dial colour'; $('[data-s="warna"]').placeholder = aks ? PH_VARIAN : 'e.g. Silver sunburst'; setDirty(true);
            }
            else if (d.sts) { s.status = d.sts; gambarStatusStok(); setDirty(true); }
            else if (d.deljual != null) { var p = s.penjualan[+d.deljual]; if (confirm('Delete sale record ' + p.qty + ' unit(s) dated ' + L.tgl(p.tgl) + '? The stock quantity will be returned.')) { s.jumlah = (+s.jumlah || 0) + p.qty; s.penjualan.splice(+d.deljual, 1); if (s.status === 'terjual') s.status = 'tersedia'; $('[data-s="jumlah"]').value = s.jumlah; gambarJual(); gambarSumStok(); gambarStatusStok(); setDirty(true); } }
            else if (d.hapusfoto) { if (confirm('Delete this photo? (removed permanently when you Save)')) { s.foto = s.foto.filter(function (f) { return f.id !== d.hapusfoto; }); gambarFotoStok(); setDirty(true); } }
            else if (d.hapusq) { sk.antri = buangQ(sk.antri, d.hapusq); gambarFotoStok(); }
            else if (b.id === 'sk-sewa-baru') { if (dirty) return toast('Save the stock changes first.', true); pindah('#sewa/baru/' + s.id); }
            else if (b.id === 'sk-jual-baru') { if (dirty) return toast('Save the stock changes first.', true); pindah('#jual/baru/' + s.id); }
            else if (b.id === 'sk-tawar') { if (dirty) return toast('Save your changes first.', true); bagikanStok(s, b); }
            else if (b.id === 'sk-sold') { if (dirty) return toast('Save your changes first.', true); bagikanTerjual(s, b); }
        });
        pilihFoto($('#sk-foto'), function (tahap, files) { antriFoto(sk.antri, files, {}, gambarFotoStok); });
        $('#sk-simpan').addEventListener('click', simpanStok);
        if (!sk.baru && owner()) $('#sk-hapus').addEventListener('click', hapusStok);
    }
    function gambarSumStok() {
        var s = sk.s, u = L.untungStok(s), per = (+s.harga_jual || 0) - (+s.harga_beli || 0);
        $('#sk-sum').innerHTML = '<div><span>Profit per unit</span><span' + (per < 0 ? ' class="ly-telat"' : '') + '>' + L.rupiah(per) + (s.harga_beli && s.harga_jual ? ' (' + Math.round(per / s.harga_beli * 100) + '%)' : '') + '</span></div>' +
            '<div><span>Estimated profit on remaining stock</span><span>' + L.rupiah(u.potensi) + '</span></div>' +
            (u.unitTerjual ? '<div class="ly-total"><span>Sold so far ' + u.unitTerjual + ' unit(s)</span><span>profit ' + L.rupiah(u.untung) + '</span></div>' : '');
    }
    /* transaksi jual yang masih berlaku (belum batal) untuk barang ini */
    function jualAktifStok(s) { return cache.jual.filter(function (j) { return j.status !== 'batal' && (j.items || []).some(function (i) { return i.stok_id === s.id; }); }); }
    function gambarStatusStok() {
        var s = sk.s, info = $('#sk-status-info'), aktifJ = s.status === 'terjual' ? jualAktifStok(s) : [];
        if (info) { info.hidden = !aktifJ.length; info.innerHTML = aktifJ.length ? 'Sold via ' + aktifJ.map(function (j) { return '<a href="#jual/' + E(j.id) + '">' + E(j.kode) + '</a>'; }).join(', ') + '. <b>Buyer cancelled or the item came back?</b> Open that sale and tap Cancel: the stock becomes available again and the refund is recorded. Changing the status here alone does not cancel the sale.' : ''; }
        $('#sk-status').innerHTML = ['tersedia', 'dipesan', 'ditarik'].map(function (k) { return '<button type="button" data-sts="' + k + '" aria-pressed="' + (s.status === k) + '">' + L.STATUS_STOK[k] + '</button>'; }).join('') +
            (s.status === 'terjual' ? '<button type="button" aria-pressed="true" disabled>Sold</button>' : '');
    }
    function gambarJual() {
        var el = $('#sk-jual'); if (!el) return; var s = sk.s;
        el.innerHTML = s.penjualan.length ? s.penjualan.map(function (p, i) {
            /* penjualan dari transaksi (pembeli, DP) diatur di halaman transaksinya */
            if (p.servis_id) return '<div><span>' + L.tgl(p.tgl) + ' · ' + p.qty + ' unit(s) · <a href="#servis/' + E(p.servis_id) + '">' + E(p.catatan) + '</a></span><b>' + L.rupiah(p.harga * p.qty) + '</b></div>';
            if (p.jual_id) { var j = cariId('jual', p.jual_id); return '<div><span>' + L.tgl(p.tgl) + ' · ' + p.qty + ' unit · <a href="#jual/' + E(p.jual_id) + '">' + E(p.catatan) + '</a>' + (j ? ' · ' + E(L.STATUS_JUAL[j.status]) : '') + '</span><b>' + L.rupiah(p.harga * p.qty) + '</b></div>'; }
            return '<div><span>' + L.tgl(p.tgl) + ' · ' + p.qty + ' unit' + (p.catatan ? ' · ' + E(p.catatan) : '') + (p.baru ? ' <small class="ly-muted">(not saved)</small>' : '') + '</span><b>' + L.rupiah(p.harga * p.qty) + '</b><button type="button" class="ly-x" data-deljual="' + i + '" aria-label="Delete">×</button></div>';
        }).join('') : '<p class="ly-muted">No sales yet.</p>';
    }
    function gambarFotoStok() {
        var el = $('#sk-foto'); if (!el) return;
        el.innerHTML = grupFoto('Item photos', null, sk.s.foto, sk.antri, false);
        L.isiFoto(el, sk.s, A.fotoAdmin);
    }
    function simpanStok() {
        var s = sk.s, asli = !sk.baru && cariId('stok', s.id), aktifJ = asli ? jualAktifStok(s) : [];
        /* barang yang terjual lewat transaksi tidak dikembalikan dengan mengubah status/jumlah di sini: transaksinya yang harus dibatalkan */
        if (asli && asli.status === 'terjual' && aktifJ.length && (s.status === 'tersedia' || s.status === 'dipesan' || +s.jumlah > +asli.jumlah)) {
            if (confirm('This item is still recorded as sold in ' + aktifJ.map(function (j) { return j.kode; }).join(', ') + '. Changing the status or quantity here does not cancel the sale or its money.\n\nOpen the sale now to cancel it?')) pindah('#jual/' + aktifJ[0].id);
            return;
        }
        if (s.status === 'tersedia' && !(+s.jumlah > 0)) return toast('The available quantity is still 0, so the item stays Sold. Enter 1 if the item really is available again.', true);
        if (s.kategori === 'aksesoris' ? !String(s.nama || '').trim() : !String(s.arloji_merk || '').trim()) return toast(s.kategori === 'aksesoris' ? 'Enter the product name.' : 'Enter the watch brand / model.', true);
        if (s.tampil !== false && adaStok(s) && s.harga_jual > 0 && !s.foto.length && !sk.antri.length && !confirm('This item will appear in the website collection without a photo. Continue?')) return;
        if (sk.antri.some(function (q) { return !q.hasil; })) return toast('Photos are still processing. Please wait a moment.', true);
        if (s.harga_jual && s.harga_jual < s.harga_beli && !confirm('The selling price is lower than the cost. Save anyway?')) return;
        var baru = sk.baru, fotoBaru = sk.antri.map(function (q) { return { hasil: q.hasil }; });
        var rec = Object.assign({}, s, { penjualan: s.penjualan.map(function (p) { var x = Object.assign({}, p); delete x.baru; return x; }) });
        prosesSimpan('stok', $('#sk-simpan'), teksUnggah(fotoBaru), function () { return A.simpanStok(rec, fotoBaru); }, function (row) {
            lepasAntri(sk.antri); sk = { baru: false, s: salin(row), antri: [] };
            toast(baru ? 'Stock saved. Code: ' + row.kode + '.' : 'Saved.');
            if (baru) pindah('#stok/' + row.id); else gambarStok();
        }, function (r) { lepasAntri(sk.antri); sk = { baru: false, s: r, antri: [] }; gambarFotoStok(); });
    }
    function hapusStok() {
        if (confirm('Delete stock record ' + sk.s.kode + ' and its photos? Its sale records are deleted too.')) hapusData('stok', sk.s, $('#sk-hapus'), A.hapusStok, 'Stock record deleted.');
    }
    /* gitar tebus yang menjadi milik toko -> stok bekas (foto gitar ikut dipindah, KTP tidak) */
    function tebusKeStok(t, btn) {
        var fotoGitar = (t.foto || []).filter(function (f) { return f.tahap === 'arloji'; });
        sibuk(btn, true, 'Moving…');
        /* bila langkah kedua (menautkan ke data tebus) pernah gagal, stoknya sudah ada: cukup ditautkan, jangan dibuat dua kali */
        var sudah = cache.stok.filter(function (x) { return x.sumber_tebus === t.id; })[0];
        (sudah ? Promise.resolve(sudah) : Promise.all(fotoGitar.map(function (f) { return Promise.all([A.fotoBlob(t, f, true), A.fotoBlob(t, f, false)]).then(function (b) { return { hasil: { besar: b[0], kecil: b[1] } }; }); }))
            .then(function (fotoBaru) {
                var rec = Object.assign(stokKosong(), { kondisi: 'bekas', arloji_jenis: t.arloji_jenis, arloji_merk: t.arloji_merk, warna: t.warna, no_seri: t.no_seri, deskripsi: t.kelengkapan, harga_beli: t.harga_beli, asal: 'Buyback ' + t.kode + ' (' + t.nama + ')', sumber_tebus: t.id });
                return A.simpanStok(rec, fotoBaru);
            })).then(function (row) {
                taruh('stok', row);
                var tr = salin(t); tr.stok_id = row.id;
                return A.simpanTebus(tr).then(function (t2) {
                    taruh('tebus', t2);
                    setDirty(false); toast('Added to stock (' + row.kode + '). Enter its selling price.'); pindah('#stok/' + row.id);
                });
            }).catch(function (e) { sibuk(btn, false); gagal(e); });
    }

    /* ================= artikel ================= */
    function daftarArtikel() {
        app.innerHTML = '<section><div class="ly-head"><h1>Journal</h1><a class="ly-btn ly-btn--pri" href="#artikel/baru">+ New article</a></div>' +
            '<p class="ly-muted">Articles set to <b>Published</b> become a website page, a card on the homepage, and an entry in the Google sitemap (live about 1 minute after saving). Start one from a service job (the <b>Turn into a Journal article</b> button) so the photos and story are filled in for you.</p>' +
            '<div class="ly-list" id="list"></div></section>';
        var rows = cache.artikel;
        $('#list').innerHTML = rows.length ? rows.map(function (a) {
            return '<div class="ly-item"><a class="ly-item__a" href="#artikel/' + E(a.id) + '"><span class="ly-item__k">' + L.tgl((a.status === 'terbit' && a.terbit_at || a.created_at || '').slice(0, 10)) + '</span></a><span class="st-chip ' + (a.status === 'terbit' ? 'st-selesai' : 'st-menunggu_dp') + '">' + (a.status === 'terbit' ? 'Published' : 'Draft') + '</span>' +
                '<span class="ly-item__t">' + E(a.judul) + '</span><span class="ly-item__m"><span>journal-' + E(a.slug) + '.html</span><span>Edited ' + L.tgl((a.updated_at || '').slice(0, 10)) + '</span></span>' +
                (a.status === 'terbit' ? '<span class="ly-item__b">' + tombolIkon('link-ar', a.id, 'tautan', 'Share article link') + tombolIkon('bagikan-ar', a.id, 'kirim', 'Share Story poster') + '</span>' : '') + '</div>';
        }).join('') : '<p class="ly-kosong">No articles yet.</p>';
        $('#list').onclick = function (e) {
            var l = e.target.closest('[data-link-ar]'); if (l) { e.preventDefault(); bagikanLinkArtikel(cariId('artikel', l.dataset.linkAr)); return; }
            var b = e.target.closest('[data-bagikan-ar]'); if (b) { e.preventDefault(); bagikanArtikel(cariId('artikel', b.dataset.bagikanAr), b); }
        };
    }
    function artikelKosong() { return { judul: '', slug: '', ringkasan: '', isi: '', tag: 'Care Tips', foto: [], status: 'draf', servis_id: null }; }
    function bukaArtikel(id) {
        ambilCatatan('artikel', id, artikelKosong, function (a) {
            a.foto = a.foto || [];
            ae = { baru: !id, a: a, slugManual: !!id, servis: a.servis_id && cariId('servis', a.servis_id) || null }; gambarArtikel();
        });
    }
    function gambarArtikel() {
        var a = ae.a, url = L.situs() + 'journal-' + a.slug + '.html', terbit = !ae.baru && cache.artikel.some(function (x) { return x.id === a.id && x.status === 'terbit'; });
        app.innerHTML = '<section id="ar" class="ly-f"><div class="ly-head"><a class="ly-back" href="#artikel">‹ Journal</a></div>' +
            '<div class="ly-head"><h1>' + (ae.baru ? 'New article' : 'Edit article') + '</h1></div>' +
            '<fieldset class="ly-card ly-f ly-grid"><legend>Title &amp; address</legend>' +
            '<label>Judul<input data-a="judul" maxlength="140" placeholder="e.g. Seiko 5 full service"></label>' +
            '<label>Page address<input data-a="slug" pattern="[a-z0-9-]+" autocapitalize="off"><span class="ly-hint" id="ar-url"></span></label>' +
            '<div class="ly-row2"><label>Label<input data-a="tag" maxlength="40"></label><label>Status<select data-a="status">' + opsi([['draf', 'Draft'], ['terbit', 'Published']], a.status) + '</select></label></div>' +
            '<label>Summary for Google (max. 160 characters)<textarea data-a="ringkasan" rows="2" maxlength="160"></textarea><span class="ly-hint" id="ar-n"></span></label></fieldset>' +
            '<fieldset class="ly-card ly-f"><legend>Article text</legend>' +
            '<p class="ly-hint">Format: <b>## Section heading</b>, <b>- bullet</b>, <b>**bold**</b>, <b>_italic_</b>, <b>[text](https://address)</b>, blank line = new paragraph.</p>' +
            '<textarea data-a="isi" rows="16"></textarea><div class="ly-btns"><button type="button" class="ly-btn ly-btn--sm" id="ar-prev">Preview</button></div><div class="ly-prev" id="ar-pv" hidden></div></fieldset>' +
            '<fieldset class="ly-card"><legend>Photos</legend><div class="ly-afoto" id="ar-foto"></div><div id="ar-pick"></div>' +
            '<div class="ly-btns" style="margin-top:10px"><label class="ly-btn ly-btn--sm ly-file">+ Upload photo<input type="file" accept="image/*" multiple id="ar-file"></label></div>' +
            '<p class="ly-hint" style="margin-top:8px">The first photo is the cover. Add a short caption to each photo (it helps Google). Make sure there are no faces, receipts, or watch serial numbers. Journal photos are public.</p></fieldset>' +
            (ae.baru ? '' : '<fieldset class="ly-card"><legend>More</legend>' + kisiAksi([].concat(terbit ? [aksi({ href: E(url), luar: true, ikon: 'luar', teks: 'View on the website' })] : [])
                .concat(terbit ? [aksi({ id: 'ar-link', ikon: 'tautan', teks: 'Share link (WhatsApp)', kelas: 'ly-akt--pri' }), aksi({ id: 'ar-bagikan', ikon: 'kirim', teks: 'Story poster (Instagram / Status)' })] : [])
                .concat([aksi({ id: 'ar-hapus', ikon: 'hapus', teks: 'Delete article', kelas: 'ly-akt--del' })])) + '</fieldset>') +
            '<div class="ly-save"><span class="ly-dirty" id="dirty" hidden>Not saved</span><button type="button" class="ly-btn ly-btn--pri" id="ar-simpan">Save</button></div></section>';
        susunDua(['More']);
        $$('[data-a]', app).forEach(function (el) { el.value = a[el.dataset.a] == null ? '' : a[el.dataset.a]; });
        infoArtikel(); gambarAFoto(); setDirty(false);
        var ar = $('#ar');
        ar.addEventListener('input', function (e) {
            var t = e.target, k = t.dataset.a, i = t.dataset.alt;
            if (k) {
                a[k] = t.value; setDirty(true);
                if (k === 'judul' && !ae.slugManual) { a.slug = ArtikelMd.slug(t.value); $('[data-a="slug"]').value = a.slug; }
                if (k === 'slug') ae.slugManual = true;
                infoArtikel(); if (!$('#ar-pv').hidden) { clearTimeout(pratinjau.t); pratinjau.t = setTimeout(pratinjau, 300); }
            } else if (i != null) { a.foto[+i].alt = t.value; setDirty(true); }
        });
        ar.addEventListener('change', function (e) {
            if (e.target.dataset.a === 'status') { a.status = e.target.value; setDirty(true); }
            var pi = e.target.dataset.poster;
            if (pi != null) { /* tiap peran hanya untuk satu foto */
                var peran = e.target.value;
                if (peran) a.foto.forEach(function (x, j) { if (j !== +pi && x.poster === peran) delete x.poster; });
                if (peran) a.foto[+pi].poster = peran; else delete a.foto[+pi].poster;
                gambarAFoto(); setDirty(true);
            }
        });
        ar.addEventListener('click', function (e) {
            var t = e.target.closest('button'); if (!t) return; var d = t.dataset;
            if (t.id === 'ar-link') { if (dirty) return toast('Save your changes first.', true); bagikanLinkArtikel(cariId('artikel', a.id)); }
            else if (t.id === 'ar-bagikan') { if (dirty) return toast('Save your changes first.', true); bagikanArtikel(cariId('artikel', a.id), t); }
            else if (t.id === 'ar-prev') { var pv = $('#ar-pv'); pv.hidden = !pv.hidden; t.textContent = pv.hidden ? 'Preview' : 'Close preview'; if (!pv.hidden) pratinjau(); }
            else if (d.fdel != null) { a.foto.splice(+d.fdel, 1); gambarAFoto(); setDirty(true); }
            else if (d.fup != null) { var i = +d.fup; if (i > 0) { var x = a.foto[i]; a.foto[i] = a.foto[i - 1]; a.foto[i - 1] = x; gambarAFoto(); setDirty(true); } }
            else if (d.pick) {
                var f = ae.servis.foto.filter(function (x) { return x.id === d.pick; })[0], ada = -1;
                a.foto.forEach(function (x, j) { if (x.foto === f.id) ada = j; });
                if (ada > -1) a.foto.splice(ada, 1); else a.foto.push({ servis: ae.servis.id, foto: f.id, alt: L.TAHAP[L.tahapFoto(f)] });
                gambarAFoto(); setDirty(true);
            }
        });
        $('#ar-file').addEventListener('change', function () {
            var files = [].slice.call(this.files); this.value = ''; if (!files.length) return;
            toast('Uploading ' + files.length + ' photo(s)…');
            /* dikecilkan satu per satu (hemat memori HP), lalu diunggah sekaligus dalam satu commit */
            var hasil = [];
            files.reduce(function (p, file) { return p.then(function () { return L.kompres(file, { kecil: false }).then(function (h) { hasil.push(h); }); }); }, Promise.resolve())
                .then(function () { return A.unggahFotoArtikel(hasil, ArtikelMd.slug(a.slug || a.judul || '')); })
                .then(function (paths) { paths.forEach(function (p) { a.foto.push({ path: p, alt: a.judul ? a.judul + ' – photo ' + (a.foto.length + 1) : '' }); /* keterangan awal dari judul (bisa diubah) */ }); gambarAFoto(); setDirty(true); toast('Photo uploaded. Add its caption, then Save.'); }).catch(gagal);
        });
        $('#ar-simpan').addEventListener('click', simpanArtikel);
        if (!ae.baru) $('#ar-hapus').addEventListener('click', function () {
            if (confirm('Delete this article? If it is published, its page is removed from the website too.')) hapusData('artikel', a, this, A.hapusArtikel, 'Article deleted.');
        });
    }
    function infoArtikel() {
        var a = ae.a; $('#ar-url').textContent = 'jubeliwatch.github.io/journal-' + (a.slug || '…') + '.html';
        $('#ar-n').textContent = (a.ringkasan || '').length + '/160';
    }
    function isiGambar(el) { $$('img[data-af]', el).forEach(function (img) { var f = ae.a.foto[+img.dataset.af]; if (f) A.fotoArtikel(f).then(function (u) { img.src = u; }, function () { img.alt = 'Photo not found'; }); }); }
    function pratinjau() {
        var a = ae.a; if (!$('#ar-pv')) return;
        $('#ar-pv').innerHTML = '<p class="ly-muted">' + E(a.tag) + '</p><h2>' + E(a.judul || '(untitled)') + '</h2>' + (a.foto[0] ? '<img data-af="0" alt="" style="border-radius:12px;margin:10px 0">' : '') + ArtikelMd.keHtml(a.isi);
        isiGambar($('#ar-pv'));
    }
    function gambarAFoto() {
        if (!$('#ar-foto')) return;
        var a = ae.a;
        $('#ar-foto').innerHTML = a.foto.length ? a.foto.map(function (f, i) {
            return '<div><img data-af="' + i + '" alt=""><input class="ly-in" data-alt="' + i + '" value="' + E(f.alt) + '" placeholder="Photo caption"><span class="ly-btns" style="flex-wrap:nowrap">' +
                (i ? '<button type="button" class="ly-x" data-fup="' + i + '" aria-label="Move up">↑</button>' : '') + '<button type="button" class="ly-x" data-fdel="' + i + '" aria-label="Remove from article">×</button></span>' +
                '<select class="ly-in" data-poster="' + i + '" style="grid-column: 1 / -1" aria-label="Photo role on the Story poster">' + opsi([['', 'Poster: automatic'], ['arloji', 'Poster: watch'], ['sebelum', 'Poster: before'], ['sesudah', 'Poster: after']], f.poster || '') + '</select></div>';
        }).join('') : '<p class="ly-muted">No photos yet.</p>';
        isiGambar($('#ar-foto'));
        var pick = $('#ar-pick'), s = ae.servis, dipakai = a.foto.map(function (x) { return x.foto; });
        pick.innerHTML = s && s.foto && s.foto.length ? '<p class="ly-hint" style="margin:12px 0 6px">Photos from service job ' + E(s.kode) + ' (tap to use/remove):</p><div class="ly-pick">' + s.foto.map(function (f, i) {
            return '<button type="button" data-pick="' + E(f.id) + '" aria-pressed="' + (dipakai.indexOf(f.id) > -1) + '"><img data-foto="' + i + '" alt="' + E(L.TAHAP[L.tahapFoto(f)]) + '"></button>';
        }).join('') + '</div>' : '';
        if (s) L.isiFoto(pick, s, A.fotoAdmin);
    }
    function simpanArtikel() {
        var a = ae.a;
        a.judul = (a.judul || '').trim(); a.slug = ArtikelMd.slug(a.slug || a.judul);
        if (!a.judul) return toast('The title is missing.', true);
        if (!a.slug) return toast('The page address is not valid.', true);
        if (a.status === 'terbit') {
            if (!a.isi.trim()) return toast('The article text is empty.', true);
            if (/\((Describe|Write)[^)]*\)/.test(a.isi) && !confirm('There is still placeholder text in brackets (e.g. “(Describe the result…)”). Publish anyway?')) return;
            if (!a.ringkasan.trim()) a.ringkasan = ArtikelMd.teksPolos(a.isi).slice(0, 157) + '…';
            if (a.foto.some(function (f) { return !String(f.alt || '').trim(); })) return toast('Add a caption to every photo first.', true);
        }
        prosesSimpan('artikel', $('#ar-simpan'), a.status === 'terbit' ? 'Publishing…' : 'Saving…', function () { return A.simpanArtikel(a); }, function (row) {
            toast(row.status === 'terbit' ? 'Published! The article page will be live in about 1 minute.' : 'Draft saved.');
            if (ae.baru) pindah('#artikel/' + row.id); else { ae.a = salin(row); ae.slugManual = true; gambarArtikel(); }
        });
    }

    mulai();
})();
