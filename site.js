/* Skrip kecil situs publik: menu HP, tahun di footer, tombol bagikan dan waktu baca artikel. Setiap fitur aktif hanya bila elemennya ada. */
(function () {
    var btn = document.getElementById('menuBtn'), links = document.getElementById('siteLinks');
    if (btn && links) {
        btn.addEventListener('click', function () {
            var open = links.classList.toggle('open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        links.addEventListener('click', function (e) { if (e.target.closest('a')) { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
    }
    var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

    var body = document.querySelector('[data-read-body]'), rt = document.querySelector('[data-readtime]');
    if (body && rt) {
        var kata = (body.textContent || '').trim().split(/\s+/).length, menit = Math.max(1, Math.round(kata / 200));
        rt.textContent = menit + ' min read'; if (rt.parentElement) rt.parentElement.hidden = false;
    }
    var share = document.querySelector('[data-share]');
    if (share) {
        var label = share.querySelector('[data-share-label]');
        share.hidden = false;
        share.addEventListener('click', function () {
            var data = { title: document.title, url: location.href };
            if (navigator.share) { navigator.share(data).catch(function () {}); return; }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(location.href).then(function () {
                    if (label) { var t = label.textContent; label.textContent = 'Link copied'; setTimeout(function () { label.textContent = t; }, 2000); }
                }).catch(function () {});
            }
        });
    }
})();
