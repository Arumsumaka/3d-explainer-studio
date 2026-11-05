'use strict';
/*
 * Vercel Function: POST /api/generate
 * Meneruskan permintaan terstruktur ke Claude API (Anthropic Messages API).
 * API key hanya dibaca dari Environment Variables di server.
 *
 * Environment Variables:
 *   ANTHROPIC_API_KEY  (wajib)  API key dari console.anthropic.com
 *   ANTHROPIC_MODEL    (opsional) default: claude-sonnet-5-5
 *   ACCESS_CODE        (opsional) bila diisi, pengunjung harus memasukkan kode ini
 *   RATE_LIMIT_PER_10_MIN (opsional) batas permintaan per IP per 10 menit, default 120
 */
const crypto = require('crypto');
const { planRequest, sceneRequest, seoRequest } = require('../lib/prompts');

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const ACCESS_CODE = process.env.ACCESS_CODE || '';
const LIMIT = parseInt(process.env.RATE_LIMIT_PER_10_MIN || '120', 10);
const UPSTREAM_TIMEOUT_MS = 55000;

/* Pembatas laju sederhana di memori (per instance, upaya terbaik). */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return list.length > LIMIT;
}

function send(res, status, body) {
  res.status(status).json(body);
}
function fail(res, status, code, message) {
  send(res, status, { ok: false, error: { code, message } });
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const isStr = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function validatePlan(plan, n) {
  if (!plan || typeof plan !== 'object') return false;
  if (typeof plan.bible !== 'string' || plan.bible.length > 4000) return false;
  if (!Array.isArray(plan.scenes) || plan.scenes.length !== n) return false;
  return plan.scenes.every((s) => s && isStr(s.title, 400) && isStr(s.vo, 1200));
}

function parseBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

async function callClaude(spec) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), UPSTREAM_TIMEOUT_MS);
  let r;
  try {
    r = await fetch(API_URL, {
      method: 'POST',
      signal: ctl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: spec.maxTokens,
        messages: [{ role: 'user', content: spec.prompt }],
        tools: [spec.tool],
        tool_choice: { type: 'tool', name: spec.tool.name },
      }),
    });
  } catch (e) {
    if (e && e.name === 'AbortError') {
      const err = new Error('timeout'); err.code = 'timeout'; throw err;
    }
    const err = new Error('network'); err.code = 'upstream_error'; throw err;
  } finally {
    clearTimeout(timer);
  }
  if (!r.ok) {
    let detail = '';
    try { detail = JSON.stringify((await r.json()).error || {}); } catch (e) {}
    console.error('Anthropic API error', r.status, detail);
    const err = new Error('anthropic ' + r.status);
    err.code = r.status === 401 || r.status === 403 ? 'bad_key' : r.status === 429 ? 'rate_limited' : 'upstream_error';
    throw err;
  }
  const data = await r.json();
  if (data.stop_reason === 'max_tokens') { const err = new Error('truncated'); err.code = 'invalid_output'; throw err; }
  const block = (data.content || []).find((c) => c.type === 'tool_use' && c.name === spec.tool.name);
  if (!block || !block.input || typeof block.input !== 'object') { const err = new Error('no tool output'); err.code = 'invalid_output'; throw err; }
  return block.input;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') return send(res, 200, { accessRequired: !!ACCESS_CODE });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return fail(res, 405, 'method_not_allowed', 'Metode tidak diizinkan.');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(res, 500, 'server_not_configured', 'ANTHROPIC_API_KEY belum diatur.');
  }
  if (ACCESS_CODE) {
    const given = req.headers['x-access-code'];
    if (typeof given !== 'string' || !safeEqual(given, ACCESS_CODE)) {
      return fail(res, 401, 'unauthorized', 'Kode akses salah.');
    }
  }
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return fail(res, 429, 'rate_limited', 'Terlalu banyak permintaan.');

  const b = parseBody(req);
  if (!b) return fail(res, 400, 'bad_request', 'Body JSON tidak valid.');

  const n = b.n;
  if (!Number.isInteger(n) || n < 3 || n > 9) return fail(res, 400, 'bad_request', 'Jumlah scene harus 3 sampai 9.');
  if (!isStr(b.topic, 200)) return fail(res, 400, 'bad_request', 'Topik wajib diisi (maks. 200 karakter).');
  if (!isStr(b.lang, 60)) return fail(res, 400, 'bad_request', 'Bahasa wajib diisi (maks. 60 karakter).');
  const topic = b.topic.trim();
  const lang = b.lang.trim();

  let spec;
  let finish = (x) => x;
  if (b.task === 'plan') {
    spec = planRequest(topic, lang, n);
    finish = (out) => {
      if (!Array.isArray(out.scenes) || out.scenes.length < n) return null;
      const scenes = out.scenes.slice(0, n).map((s) => ({ title: String((s && s.title) || '').trim(), vo: String((s && s.vo) || '').trim() }));
      if (scenes.some((s) => !s.title || !s.vo)) return null;
      return { bible: String(out.bible || ''), scenes };
    };
  } else if (b.task === 'scene') {
    if (!validatePlan(b.plan, n)) return fail(res, 400, 'bad_request', 'Data naskah tidak valid.');
    if (!Number.isInteger(b.index) || b.index < 0 || b.index >= n) return fail(res, 400, 'bad_request', 'Nomor scene tidak valid.');
    spec = sceneRequest(topic, lang, n, b.plan, b.index);
    finish = (out) => {
      const image_prompt = String(out.image_prompt || '').trim();
      const video_prompt = String(out.video_prompt || '').trim();
      return image_prompt && video_prompt ? { image_prompt, video_prompt } : null;
    };
  } else if (b.task === 'seo') {
    if (!validatePlan(b.plan, n)) return fail(res, 400, 'bad_request', 'Data naskah tidak valid.');
    spec = seoRequest(topic, lang, n, b.plan);
    finish = (out) => {
      if (!Array.isArray(out.titles) || out.titles.length < 1) return null;
      const titles = out.titles.slice(0, 3).map((t) => ({ text: String((t && t.text) || '').trim(), best: !!(t && t.best) }));
      if (titles.some((t) => !t.text)) return null;
      if (!titles.some((t) => t.best)) titles[0].best = true;
      return Object.assign({}, out, { titles });
    };
  } else {
    return fail(res, 400, 'bad_request', 'Tugas tidak dikenal.');
  }

  try {
    const out = await callClaude(spec);
    const data = finish(out);
    if (!data) return fail(res, 502, 'invalid_output', 'Hasil dari Claude tidak lengkap.');
    return send(res, 200, { ok: true, data });
  } catch (e) {
    const code = e.code || 'server_error';
    const status = code === 'bad_key' ? 500 : code === 'rate_limited' ? 429 : code === 'timeout' ? 504 : 502;
    return fail(res, status, code, 'Permintaan ke Claude gagal.');
  }
};
