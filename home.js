/* Beranda: pratinjau koleksi dari data/katalog.json (diperbarui POS). Halaman lengkap ada di collection.html. */
(function () {
    var box = document.getElementById('hm-koleksi');
    if (!box) return;
    var esc = AYRI_UTIL.esc, rupiah = AYRI_UTIL.rupiah;
    function lencana(x) {
        var jam = x.kategori === 'arloji';
        return '<span class="kat-badge kat-' + (jam ? x.kondisi : 'aks') + '">' + (jam ? (x.kondisi === 'baru' ? 'New' : 'Pre-owned') : esc(x.jenis)) + '</span>' +
            (x.tingkat ? '<span class="kat-badge kat-tingkat">' + esc(x.tingkat) + '</span>' : '');
    }
    function kartu(x) {
        var f = x.foto[0];
        return '<a class="kat-item" href="unit.html?k=' + encodeURIComponent(x.kode) + '">' +
            '<span class="kat-foto">' + (f ? '<img src="' + esc(f.kecil) + '" alt="' + esc(x.nama) + '" loading="lazy" decoding="async">' : '<span class="kat-nofoto">Photo coming soon</span>') +
            '<span class="kat-badges kat-badges--foto">' + lencana(x) + '</span>' +
            (x.status === 'dipesan' ? '<span class="kat-pita">Reserved</span>' : '') + '</span>' +
            '<span class="kat-isi"><span class="kat-harga">' + rupiah(x.harga) + '</span><b class="kat-nama">' + esc(x.nama) + '</b>' +
            '<small>' + esc([x.jenis, x.warna].filter(Boolean).join(' · ')) + '</small></span></a>';
    }
    fetch('data/katalog.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
        var item = (d.item || []).filter(function (x) { return x.kategori === 'arloji'; }).slice(0, 8);
        box.innerHTML = item.length ? item.map(kartu).join('') :
            '<p class="ly-muted">New pieces are being prepared. <a class="hm-link" href="https://wa.me/6285795738637" target="_blank" rel="noopener">Ask what’s coming ›</a></p>';
    }).catch(function () {
        box.innerHTML = '<p class="ly-muted">The collection could not be loaded. <a class="hm-link" href="collection.html">Try the collection page ›</a></p>';
    });
})();
