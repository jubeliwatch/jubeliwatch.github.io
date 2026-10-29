/* Beranda: pratinjau koleksi dari data/katalog.json (diperbarui POS). Halaman lengkap ada di collection.html. */
(function () {
    var box = document.getElementById('catalog');
    if (!box) return;
    var esc = AYRI_UTIL.esc, rupiah = AYRI_UTIL.rupiah;
    function kartu(x) {
        var f = x.foto[0], meta = [x.kondisi === 'baru' ? 'New' : 'Pre-owned', x.tingkat, x.warna].filter(Boolean).join(' · ');
        return '<a class="card" href="unit.html?k=' + encodeURIComponent(x.kode) + '"><div class="card-img">' +
            (f ? '<img src="' + esc(f.kecil) + '" alt="' + esc(x.nama) + '" loading="lazy" decoding="async">' : '') +
            (x.status === 'dipesan' ? '<span class="tag">Reserved</span>' : '') +
            (x.foto.length > 1 ? '<span class="photo-count">' + x.foto.length + ' photos</span>' : '') + '</div>' +
            '<div class="card-body"><div class="card-maker">' + esc(x.jenis) + '</div><h3>' + esc(x.nama) + '</h3><div class="card-meta">' + esc(meta) + '</div><div class="price">' + rupiah(x.harga) + '</div></div></a>';
    }
    fetch('data/katalog.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
        var item = (d.item || []).filter(function (x) { return x.kategori === 'arloji'; }).slice(0, 4);
        box.innerHTML = item.length ? item.map(kartu).join('') :
            '<div class="empty">New pieces are being prepared. <a class="text-link" href="https://wa.me/6285795738637" target="_blank" rel="noopener">Ask what’s coming ↗</a></div>';
    }).catch(function () {
        box.innerHTML = '<div class="empty">The collection could not be loaded. <a class="text-link" href="collection.html">Open the collection page ↗</a></div>';
    });
})();
