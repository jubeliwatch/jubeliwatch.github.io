/* AI relay for the Jubeli POS (Cloudflare Worker, free).
   The AI keys are stored as Secrets in Cloudflare, NEVER on the website or in the POS.
   Providers are tried in order: Groq (fast, generous free quota), then Gemini as backup; a provider without a key is skipped.
   Who may use it: POS devices whose token can open the shop data repo (owner & staff), checked against GitHub.
   Variables (Settings -> Variables and Secrets):
     GROQ_KEY           (Secret)  API key from console.groq.com             (recommended, main)
     GEMINI_KEY         (Secret)  API key from Google AI Studio             (optional, backup)
     REPO_CEK           (Text)    repo the POS token must be able to open, e.g. jubeliwatch/jubeliwatch-shop-data
     ORIGIN             (Text)    allowed origin(s), comma separated, e.g. https://jubeliwatch.github.io
     GROQ_MODEL         (Text)    optional; empty = the Worker picks the best chat model available for your Groq key
     GROQ_VISION_MODEL  (Text)    optional; empty = the Worker picks a Groq model that can read images
     MODEL              (Text)    optional, Gemini model, default gemini-3.8-flash
   Model names change often: if a provider rejects a model name, set it through the variables above without pasting code again.
   Request: POST { sistem, prompt, maks, gambar?: ["data:image/jpeg;base64,...", ...] } + header Authorization: Bearer <POS token>.
   Response: { teks, catatan? } or { error }. If no provider can read the photos, the answer is written from text only with a note. */

const IZIN_LAMA = 10 * 60 * 1000; /* token yang sudah lolos cek disimpan (sebagai hash) 10 menit, supaya tidak tiap kali bertanya ke GitHub */
const lolos = new Map();
const BATAS_WAKTU = 25000, BATAS_WAKTU_GAMBAR = 55000; /* teks: jangan menunggu lebih dari 25 detik, lebih baik pindah ke penyedia berikutnya; membaca foto lebih lama */
const MAKS_GAMBAR = 4, MAKS_GAMBAR_PANJANG = 2200000; /* karakter base64 per gambar (±1,6 MB) */
const POLA_GAMBAR = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

function jawab(isi, status, cors) { return new Response(JSON.stringify(isi), { status: status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors) }); }
async function sidik(teks) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(teks));
    return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
}
async function bolehPakai(token, env) {
    const k = await sidik(token), kini = Date.now(), t = lolos.get(k);
    if (t && kini - t < IZIN_LAMA) return true;
    const r = await fetch('https://api.github.com/repos/' + env.REPO_CEK, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'jubeli-ai-worker' } });
    if (!r.ok) return false;
    lolos.set(k, kini);
    return true;
}

async function kirim(url, op, batas) {
    let r;
    try { r = await fetch(url, Object.assign({ signal: AbortSignal.timeout(batas || BATAS_WAKTU) }, op)); }
    catch (e) { throw new Error(e && e.name === 'TimeoutError' ? 'took too long to answer' : 'could not be reached'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((r.status === 429 ? 'quota 429 ' : r.status + ' ') + ((d.error && (d.error.message || d.error)) || ''));
    return d;
}

/* Groq: format OpenAI (chat completions). Nama model sering berganti, jadi bila GROQ_MODEL kosong Worker menanyakan daftar model yang
   tersedia untuk kunci ini dan memilih model chat terbaik (utamakan keluarga llama 70b, lalu gpt-oss, lalu lainnya); pilihan diingat sementara.
   Untuk permintaan dengan gambar dipilih model yang bisa membaca gambar (llama-4 scout/maverick, "vision", pixtral, qwen-vl). */
let modelGroq = null, modelGroqGambar = null;
async function daftarModelGroq(env) {
    const d = await kirim('https://api.groq.com/openai/v1/models', { method: 'GET', headers: { Authorization: 'Bearer ' + env.GROQ_KEY } });
    return (d.data || []).filter((m) => m.active !== false).map((m) => String(m.id)).filter((id) => !/whisper|guard|tts|playai|orpheus|embed|safeguard|transcri/i.test(id));
}
async function pilihModelGroq(env, ulang, gambar) {
    if (gambar && env.GROQ_VISION_MODEL) return env.GROQ_VISION_MODEL;
    if (!gambar && env.GROQ_MODEL) return env.GROQ_MODEL;
    if (!ulang && (gambar ? modelGroqGambar : modelGroq)) return gambar ? modelGroqGambar : modelGroq;
    const ids = await daftarModelGroq(env);
    if (gambar) {
        const h = ids.filter((id) => /llama-4|scout|maverick|vision|pixtral|qwen.*vl|-vl\b|qwen\/?qwen3/i.test(id)); /* qwen3.x multimodal (daftar Groq Okt 2026); bila model berganti lagi, isi GROQ_VISION_MODEL */
        if (!h.length) throw new Error('no image model available for this key');
        return (modelGroqGambar = h[0]);
    }
    const teks = ids.filter((id) => !/vision-preview/i.test(id));
    for (const p of [/llama.*70b/i, /gpt-oss-120b/i, /gpt-oss/i, /llama/i, /qwen/i, /kimi|mixtral|gemma/i]) {
        const h = teks.filter((id) => p.test(id));
        if (h.length) return (modelGroq = h[0]);
    }
    if (teks.length) return (modelGroq = teks[0]);
    throw new Error('no chat model available for this key');
}
async function groq(sistem, prompt, maks, env, gambar) {
    const ada = gambar.length > 0;
    const minta = async (model) => kirim('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.GROQ_KEY },
        body: JSON.stringify({
            model: model, temperature: 0.7, max_tokens: maks,
            messages: (sistem ? [{ role: 'system', content: sistem }] : []).concat([{
                role: 'user',
                content: ada ? [{ type: 'text', text: prompt }].concat(gambar.map((u) => ({ type: 'image_url', image_url: { url: u } }))) : prompt
            }])
        })
    }, ada ? BATAS_WAKTU_GAMBAR : undefined);
    const khusus = ada ? env.GROQ_VISION_MODEL : env.GROQ_MODEL;
    let d;
    try { d = await minta(await pilihModelGroq(env, false, ada)); }
    catch (e) {
        if (khusus || !/^404|does not exist|model/i.test(String(e && e.message)) || /no (image|chat) model/.test(String(e && e.message))) throw e;
        if (ada) modelGroqGambar = null; else modelGroq = null;
        d = await minta(await pilihModelGroq(env, true, ada)); /* model yang diingat sudah tidak ada: pilih ulang */
    }
    const teks = String((((d.choices || [])[0] || {}).message || {}).content || '').trim();
    if (!teks) throw new Error('empty answer');
    return teks;
}
/* Gemini: 2.5-flash boleh dimatikan "berpikir"-nya; seri 3.x hanya bisa dikecilkan (thinkingLevel low); semuanya diberi ruang token ekstra supaya jawaban tidak terpotong */
async function gemini(sistem, prompt, maks, env, gambar) {
    const model = env.MODEL || 'gemini-3.8-flash', lama = /^gemini-2\.5-flash/.test(model);
    const bagian = [{ text: prompt }].concat(gambar.map((u) => ({ inline_data: { mime_type: 'image/jpeg', data: u.slice(u.indexOf(',') + 1) } })));
    const baru = /^gemini-3/.test(model); /* seri 3.x: "berpikir" tidak bisa dimatikan, hanya dikecilkan (thinkingLevel low) supaya tidak kena batas waktu */
    const panggil = (pikir) => {
        const isi = { contents: [{ role: 'user', parts: bagian }],
            generationConfig: Object.assign({ temperature: 0.7, maxOutputTokens: lama ? maks : maks + 2048 }, pikir ? { thinkingConfig: pikir } : {}) };
        if (sistem) isi.systemInstruction = { parts: [{ text: sistem }] };
        return kirim('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY }, body: JSON.stringify(isi)
        }, gambar.length ? BATAS_WAKTU_GAMBAR : undefined);
    };
    let d;
    try { d = await panggil(lama ? { thinkingBudget: 0 } : baru ? { thinkingLevel: 'low' } : null); }
    catch (e) { if (!baru || !/thinking/i.test(String(e && e.message))) throw e; d = await panggil(null); } /* nama pengaturan ditolak: ulangi tanpa pengaturan */
    const c = (d.candidates || [])[0], teks = ((c && c.content && c.content.parts) || []).map((p) => p.text || '').join('').trim();
    if (!teks) throw new Error('empty answer');
    return teks;
}

/* coba penyedia berurutan dengan/tanpa gambar; mengembalikan teks atau melempar daftar galat */
async function jalankan(urutan, sistem, prompt, maks, env, gambar) {
    const galat = [];
    for (const [nama, panggil] of urutan) {
        try { return await panggil(sistem, prompt, maks, env, gambar); }
        catch (e) { galat.push(nama + ': ' + (e && e.message || e)); }
    }
    const err = new Error(galat.join(' · ')); err.galat = galat; throw err;
}

export default {
    async fetch(req, env) {
        const izin = String(env.ORIGIN || 'https://jubeliwatch.github.io').split(',').map((s) => s.trim()).filter(Boolean);
        const asal = req.headers.get('Origin') || '';
        const cors = { 'Access-Control-Allow-Origin': izin.indexOf(asal) > -1 ? asal : izin[0], 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
        if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
        if (req.method !== 'POST') return jawab({ error: 'Gunakan POST.' }, 405, cors);
        if (izin.indexOf(asal) < 0) return jawab({ error: 'This origin is not allowed.' }, 403, cors);
        if ((!env.GROQ_KEY && !env.GEMINI_KEY) || !env.REPO_CEK) return jawab({ error: 'The AI relay is not set up yet (GROQ_KEY or GEMINI_KEY, and REPO_CEK).' }, 500, cors);
        const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
        if (!token || !(await bolehPakai(token, env))) return jawab({ error: 'This device is not allowed to use the AI. Unlock the POS with the PIN first.' }, 403, cors);

        let b;
        try { b = await req.json(); } catch (e) { return jawab({ error: 'Invalid request.' }, 400, cors); }
        const prompt = String(b && b.prompt || '').slice(0, 12000), sistem = String(b && b.sistem || '').slice(0, 4000);
        if (!prompt.trim()) return jawab({ error: 'Empty request.' }, 400, cors);
        /* gambar: hanya JPEG data-URL yang wajar ukurannya; selebihnya dibuang */
        const gambar = (Array.isArray(b && b.gambar) ? b.gambar : []).filter((u) => typeof u === 'string' && u.length <= MAKS_GAMBAR_PANJANG && POLA_GAMBAR.test(u)).slice(0, MAKS_GAMBAR);
        const maks = Math.max(64, Math.min(4096, +(b && b.maks) || 1024)), urutan = [];
        if (env.GROQ_KEY) urutan.push(['Groq', groq]);
        if (env.GEMINI_KEY) urutan.push(['Gemini', gemini]);
        try {
            try { return jawab({ teks: await jalankan(urutan, sistem, prompt, maks, env, gambar) }, 200, cors); }
            catch (e) {
                if (!gambar.length) throw e;
                /* foto tidak bisa dibaca penyedia mana pun: tetap beri jawaban dari teks saja, dengan catatan */
                /* alasan tiap penyedia ikut dicatat (kunci disamarkan) supaya penyebabnya bisa diketahui: kuota, nama model, atau kunci cadangan belum dipasang */
                let sebab = ((e && e.galat) || [String(e && e.message || e)]).join(' · ');
                [env.GROQ_KEY, env.GEMINI_KEY].forEach((k) => { if (k) sebab = sebab.split(k).join('…'); });
                if (!env.GEMINI_KEY) sebab += ' · Gemini: key not set';
                return jawab({ teks: await jalankan(urutan, sistem, prompt, maks, env, []), catatan: 'The AI could not read the photos; the answer was written from the notes only. (' + sebab.slice(0, 280) + ')' }, 200, cors);
            }
        } catch (e) {
            const galat = e && e.galat || [String(e && e.message || e)];
            const sibuk = galat.some((g) => / 429|kuota|rate|quota/i.test(g));
            return jawab({ error: sibuk ? 'The AI is busy or the free quota is used up. Try again in a moment.' : 'The AI failed: ' + galat.join(' · ') }, 502, cors);
        }
    }
};
