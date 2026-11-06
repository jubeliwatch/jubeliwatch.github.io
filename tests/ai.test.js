'use strict';
/* AI writer: the Cloudflare Worker (origin + token checks, answers) and the POS side (hidden until a Worker address is set, no personal data in prompts). */
const test = require('node:test'), assert = require('node:assert/strict');
const path = require('node:path'), { pathToFileURL } = require('node:url');
const { baca } = require('./helper');

const ENV = { GROQ_KEY: 'gsk-test', REPO_CEK: 'jubeliwatch/jubeliwatch-shop-data', ORIGIN: 'https://jubeliwatch.github.io' };
const URL_WORKER = pathToFileURL(path.join(__dirname, '..', 'ai-worker', 'worker.mjs')).href;

function palsu(opsi) {
    const panggilan = [];
    globalThis.fetch = async (url, op) => {
        panggilan.push(String(url));
        const ok = (isi, status) => ({ ok: (status || 200) < 400, status: status || 200, json: async () => isi });
        if (/api\.github\.com\/repos\//.test(url)) return ok({}, op.headers.Authorization === 'Bearer tok-staff' ? 200 : 404);
        if (/groq\.com\/openai\/v1\/models/.test(url)) return ok({ data: [{ id: 'whisper-large-v3' }, { id: 'llama-3.3-70b-versatile' }] });
        if (/groq\.com\/openai\/v1\/chat\/completions/.test(url)) { panggilan.body = JSON.parse(op.body); return ok(opsi && opsi.galat ? { error: { message: 'rate limit' } } : { choices: [{ message: { content: 'A fine watch.' } }] }, opsi && opsi.galat ? 429 : 200); }
        throw new Error('unexpected fetch ' + url);
    };
    return panggilan;
}
const minta = (o) => new Request('https://jubeli-ai.example.workers.dev/', {
    method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', Origin: 'https://jubeliwatch.github.io', Authorization: 'Bearer tok-staff' }, o && o.headers),
    body: JSON.stringify((o && o.body) || { sistem: 'Be brief.', prompt: 'Describe a watch.', maks: 100 })
});

test('worker: answers a POS device whose token can open the shop data repo', async () => {
    const w = (await import(URL_WORKER)).default, p = palsu();
    const r = await w.fetch(minta(), ENV), d = await r.json();
    assert.equal(r.status, 200); assert.equal(d.teks, 'A fine watch.');
    assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://jubeliwatch.github.io');
    assert.ok(p.some((u) => /repos\/jubeliwatch\/jubeliwatch-shop-data$/.test(u)), 'the token is checked against the shop data repo');
    assert.equal(p.body.model, 'llama-3.3-70b-versatile', 'picks a chat model, skipping whisper');
});

test('worker: refuses other origins, unknown tokens, and a missing setup', async () => {
    const w = (await import(URL_WORKER)).default; palsu();
    assert.equal((await w.fetch(minta({ headers: { Origin: 'https://evil.example' } }), ENV)).status, 403);
    const r = await w.fetch(minta({ headers: { Authorization: 'Bearer tok-someone-else' } }), ENV);
    assert.equal(r.status, 403); assert.match((await r.json()).error, /not allowed to use the AI/);
    const s = await w.fetch(minta(), { ORIGIN: ENV.ORIGIN });
    assert.equal(s.status, 500); assert.match((await s.json()).error, /not set up yet/);
});

test('worker: a provider that is out of quota gives a friendly busy message', async () => {
    const w = (await import(URL_WORKER)).default; palsu({ galat: true });
    const r = await w.fetch(minta(), ENV);
    assert.equal(r.status, 502); assert.match((await r.json()).error, /busy or the free quota is used up/);
});

test('POS: AI buttons stay hidden until a Worker address is set; the Worker allows the site origin', () => {
    assert.match(baca('layanan-config.js'), /ai: \{ url: '' \}|ai: \{ url: 'https:\/\/[^']+workers\.dev' \}/);
    assert.match(baca('layanan.js'), /aktif: !!\(C\.ai && C\.ai\.url\)/);
    const adm = baca('admin.js');
    assert.match(adm, /\(L\.ai\.aktif \? '<div class="ly-btns"><button type="button" class="ly-btn ly-btn--sm" id="sk-ai">/);
    assert.match(adm, /\(L\.ai\.aktif \? '<div class="ly-btns"><button type="button" class="ly-btn ly-btn--sm" id="ar-ai">[^\n]*'<\/fieldset>' \+\n\s+'<fieldset class="ly-card"><legend>Photos/, 'the article text card is closed after the AI button');
    assert.match(baca('ai-worker/worker.mjs'), /https:\/\/jubeliwatch\.github\.io/);
});

test('POS: prompts carry watch data only (no serial number, customer name or phone) and ask for a draft in English', () => {
    const vm = require('node:vm'), sb = { window: {}, document: {}, navigator: {}, localStorage: {}, console };
    sb.window = sb; vm.createContext(sb);
    const src = baca('layanan.js'), i = src.indexOf('L.ai = {'), j = src.indexOf('    L.api.ai = function'), blok = src.slice(i, j);
    const L = { judulStok: (s) => s.arloji_merk, namaGitar: () => 'Seiko 5' }, C = { toko: { nama: 'Jubeliwatch' }, tingkatKondisi: [['excellent', 'Excellent', 'very light signs of careful use']], ai: { url: 'https://x' } };
    vm.runInContext('var L = this.L, C = this.C;' + blok, Object.assign(sb, { L, C }));
    const stok = { kategori: 'arloji', arloji_jenis: 'Automatic', arloji_merk: 'Seiko 5 SNK809', warna: 'Blue', kondisi: 'bekas', tingkat: 'excellent', no_seri: 'SN-SECRET-1', deskripsi: 'box included', nama_pembeli: 'Budi', hp: '0812' };
    const m = L.ai.deskripsi(stok, 2);
    assert.match(m.prompt, /Brand \/ model: Seiko 5 SNK809/); assert.match(m.prompt, /grade Excellent/); assert.match(m.prompt, /box included/); assert.match(m.prompt, /2 photo\(s\)/);
    assert.ok(!/SN-SECRET|Budi|0812/.test(m.sistem + m.prompt));
    assert.match(m.sistem, /watch shop in Bogor/);
    const a = L.ai.artikel({ judul: 'Seiko service', isi: 'notes' }, { keluhan: 'runs fast', items: [{ nama: 'Full service' }], nama: 'Ani', hp: '0899' });
    assert.match(a.prompt, /Complaint: runs fast/); assert.match(a.prompt, /Work done: Full service/); assert.ok(!/Ani|0899/.test(a.prompt));
    assert.deepEqual({ ...L.ai.pisahArtikel('SUMMARY: Short.\n\n## Body') }, { ringkasan: 'Short.', isi: '## Body' });
});
