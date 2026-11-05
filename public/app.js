(function () {
  var TOPICS = [
    { t: "Mengapa kapal baja raksasa bisa mengapung di laut?", h: "Gaya apung dan massa jenis, dilihat dari irisan lambung kapal." },
    { t: "Bagaimana gempa bumi terbentuk dari pergeseran lempeng di bawah tanah?", h: "Penumpukan tekanan, patahan, lalu pelepasan energi gelombang seismik." },
    { t: "Bagaimana turbin angin mengubah hembusan angin menjadi listrik?", h: "Dari bilah baling-baling, poros, gearbox, sampai generator di dalam nasel." }
  ];
  var LANGS = [
    { id: "id", flag: "🇮🇩", name: "Bahasa Indonesia", val: "Bahasa Indonesia" },
    { id: "en", flag: "🇬🇧", name: "English", val: "English" },
    { id: "ms", flag: "🇲🇾", name: "Bahasa Melayu", val: "Bahasa Melayu" },
    { id: "custom", flag: null, name: "Custom", val: "" }
  ];
  var DURS = [30, 40, 50, 60, 70, 80, 90];

  var state = { topic: null, topicText: "", lang: null, langText: "", dur: null };
  var KEY = "3des-config-v22";
  try { var saved = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (saved && typeof saved === "object") state = Object.assign(state, saved); } catch (e) {}
  function persist() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var $ = function (id) { return document.getElementById(id); };
  var iconPencil = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var iconGlobe = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.7 5.7 3.7 9s-1.2 6.3-3.7 9c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3Z"/></svg>';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ================= FORM ================= */
  function render() {
    var th = TOPICS.map(function (x, i) {
      return '<button type="button" class="card" role="radio" aria-checked="' + (state.topic === i) + '" data-topic="' + i + '">' +
        '<span class="radio"></span><span class="topic-body"><span class="topic-label">Rekomendasi ' + (i + 1) + '</span>' +
        '<div class="topic-title">' + esc(x.t) + '</div><div class="topic-hint">' + esc(x.h) + '</div></span></button>';
    }).join("");
    th += '<button type="button" class="card custom" role="radio" aria-checked="' + (state.topic === "custom") + '" data-topic="custom">' +
      '<span class="radio"></span><span class="topic-body"><span class="topic-label">Custom</span>' +
      '<div class="topic-title">' + iconPencil + ' Tulis topik sendiri</div></span></button>';
    $("topics").innerHTML = th;

    $("langs").innerHTML = LANGS.map(function (l) {
      return '<button type="button" class="card lang" role="radio" aria-checked="' + (state.lang === l.id) + '" data-lang="' + l.id + '">' +
        '<span class="radio"></span><span class="flag">' + (l.flag || iconGlobe) + '</span><span class="name">' + l.name + '</span></button>';
    }).join("");

    $("durs").innerHTML = DURS.map(function (d) {
      return '<button type="button" class="card dur" role="radio" aria-checked="' + (state.dur === d) + '" data-dur="' + d + '">' +
        '<span class="num">' + d + '</span><span class="unit">detik</span><span class="sc">' + (d / 10) + ' scene</span></button>';
    }).join("");

    $("topicReveal").classList.toggle("open", state.topic === "custom");
    $("langReveal").classList.toggle("open", state.lang === "custom");
    $("topicInput").tabIndex = state.topic === "custom" ? 0 : -1;
    $("langInput").tabIndex = state.lang === "custom" ? 0 : -1;
    update();
  }
  function topicValue() {
    if (state.topic === null) return "";
    if (state.topic === "custom") return state.topicText.trim();
    return TOPICS[state.topic] ? TOPICS[state.topic].t : "";
  }
  function langValue() {
    if (state.lang === null) return "";
    if (state.lang === "custom") return state.langText.trim();
    var m = LANGS.filter(function (l) { return l.id === state.lang; })[0];
    return m ? m.val : "";
  }
  function setState(id, ok, okText, noText) {
    var el = $(id); el.className = "state" + (ok ? " done" : ""); el.textContent = ok ? "✓ " + okText : noText;
  }
  function update() {
    var tv = topicValue(), lv = langValue();
    setState("stTopik", !!tv, "Dipilih", state.topic === "custom" ? "Tulis topik Anda" : "Pilih satu");
    setState("stBahasa", !!lv, lv || "Dipilih", state.lang === "custom" ? "Tulis bahasa Anda" : "Pilih satu");
    setState("stDurasi", !!state.dur, state.dur + " detik", "Pilih satu");
    $("infoScenes").textContent = state.dur ? state.dur / 10 + " scene" : "—";
    var miss = [];
    if (!tv) miss.push("topik");
    if (!lv) miss.push("bahasa");
    if (!state.dur) miss.push("durasi");
    $("goBtn").disabled = miss.length > 0;
    $("missing").textContent = miss.length ? "Lengkapi dulu: " + miss.join(", ") : "Semua pilihan lengkap. Siap menghasilkan produksi.";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.topic !== undefined) {
      state.topic = b.dataset.topic === "custom" ? "custom" : parseInt(b.dataset.topic, 10);
      persist(); render();
      if (state.topic === "custom") setTimeout(function () { $("topicInput").focus(); }, 120);
    } else if (b.dataset.lang !== undefined) {
      state.lang = b.dataset.lang; persist(); render();
      if (state.lang === "custom") setTimeout(function () { $("langInput").focus(); }, 120);
    } else if (b.dataset.dur !== undefined) {
      state.dur = parseInt(b.dataset.dur, 10); persist(); render();
    }
  });
  $("topicInput").addEventListener("input", function (e) { state.topicText = e.target.value; persist(); update(); });
  $("langInput").addEventListener("input", function (e) { state.langText = e.target.value; persist(); update(); });
  $("topicInput").value = state.topicText || "";
  $("langInput").value = state.langText || "";

  /* ================= SALIN ================= */
  var toastT;
  function toast(msg, bad) {
    var t = $("toast"); t.textContent = msg; t.className = "toast show" + (bad ? " bad" : "");
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = "toast"; }, 2200);
  }
  function copyFrom(ta, btn) {
    var text = ta.value;
    function flash() {
      toast("Berhasil disalin!");
      if (btn) { var old = btn.dataset.label; btn.textContent = "✓ Disalin"; btn.classList.add("done"); setTimeout(function () { btn.textContent = old; btn.classList.remove("done"); }, 1500); }
    }
    function fb() {
      var ok = false;
      try { ta.focus(); ta.select(); ta.setSelectionRange(0, text.length); ok = document.execCommand("copy"); } catch (e) {}
      if (ok) flash(); else toast("Teks tidak berhasil disalin. Teks sudah terpilih, tekan Ctrl/Cmd+C.", true);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(flash, fb); else fb();
  }

  /* ================= BLOK TEKS ================= */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var allAreas = [];
  function fit(ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight + 2, 380) + "px"; }
  window.addEventListener("resize", function () { allAreas.forEach(fit); });

  // satu blok = satu area teks = satu jenis konten = satu tombol salin
  function makeBlock(o) {
    var root = el("div", "blk");
    var head = el("div", "blk-head");
    head.appendChild(el("h4", null, esc(o.label)));
    if (o.badge) head.appendChild(el("span", "badge", esc(o.badge)));
    var ta = document.createElement("textarea");
    ta.readOnly = true; ta.className = "area" + (o.mono ? " mono" : ""); ta.rows = o.rows || 2; ta.spellcheck = false;
    ta.setAttribute("aria-label", o.label);
    var foot = el("div", "blk-foot");
    var btn = el("button", "copy"); btn.type = "button"; btn.textContent = o.btn; btn.dataset.label = o.btn;
    btn.addEventListener("click", function () { copyFrom(ta, btn); });
    foot.appendChild(btn);
    if (o.noHead) { /* label hanya untuk aksesibilitas */ } else root.appendChild(head);
    root.appendChild(ta); root.appendChild(foot);
    allAreas.push(ta);
    var api = {
      root: root, ta: ta, btn: btn,
      pending: function () { root.classList.add("pending"); ta.value = ""; ta.placeholder = "Sedang disusun…"; btn.disabled = true; ta.style.height = ""; },
      set: function (t) { root.classList.remove("pending"); ta.placeholder = ""; ta.value = t; btn.disabled = !t; fit(ta); },
      clear: function (msg) { root.classList.remove("pending"); ta.value = ""; ta.placeholder = msg || ""; btn.disabled = true; ta.style.height = ""; }
    };
    api.pending();
    return api;
  }

  /* ================= TIMECODE ================= */
  function tc(n) { var m = Math.floor(n / 60), s = n % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function rng(i) { return tc(i * 10) + "–" + tc((i + 1) * 10); }

  /* ================= PEMBANGUN HASIL ================= */
  var FATAL = { unauthorized: 1, server_not_configured: 1, bad_key: 1 };
  function errCopy(e) {
    var c = e && e.code;
    if (c === "unauthorized") return "Kode akses salah atau belum diisi. Kembali ke form, isi kode akses, lalu coba lagi.";
    if (c === "server_not_configured") return "Server belum siap: ANTHROPIC_API_KEY belum diatur di Environment Variables Vercel.";
    if (c === "bad_key") return "API key Claude ditolak oleh Anthropic. Periksa ANTHROPIC_API_KEY di Vercel lalu deploy ulang.";
    if (c === "rate_limited") return "Terlalu banyak permintaan atau batas pemakaian tercapai. Tunggu sebentar, lalu klik Coba lagi.";
    if (c === "network") return "Tidak bisa terhubung ke server. Periksa koneksi internet, lalu klik Coba lagi.";
    if (c === "timeout") return "Waktu proses habis di server. Klik Coba lagi.";
    if (c === "cancelled") return "Dihentikan.";
    if (c === "invalid_output") return "Hasil dari Claude tidak lengkap. Klik Coba lagi.";
    return "Bagian ini gagal dibuat. Klik Coba lagi.";
  }

  var R = null; // sesi hasil aktif

  function setStatus(kind, text) {
    var m = $("statMsg");
    m.className = "msg" + (kind === "err" ? " err" : kind === "ok" ? " okk" : "");
    m.innerHTML = (kind === "run" ? '<span class="spin" aria-hidden="true"></span>' : "") + "<span>" + esc(text) + "</span>";
    $("stopBtn").hidden = kind !== "run";
    $("redoBtn").hidden = kind === "run";
  }

  function buildResult(topic, lang, n) {
    allAreas = [];
    var body = $("resultBody"); body.innerHTML = "";
    var nav = $("navChips"); nav.innerHTML = "";
    var sections = [];
    function addNav(label, target) {
      var b = el("button", "nchip"); b.type = "button"; b.textContent = label;
      b.addEventListener("click", function () { target.scrollIntoView({ behavior: "smooth", block: "start" }); });
      nav.appendChild(b); sections.push({ btn: b, target: target });
    }

    // 1. FULL NASKAH VO
    var voPanel = el("section", "panel"); voPanel.id = "sec-vo";
    var vh = el("div", "panel-head");
    vh.appendChild(el("div", "kicker", "BAGIAN 1"));
    vh.appendChild(el("h2", null, "FULL NASKAH VOICE OVER"));
    vh.appendChild(el("div", "note", "ESTIMASI DURASI VO — BELUM DIUJI AUDIO"));
    voPanel.appendChild(vh);
    var fullVo = makeBlock({ label: "Full naskah voice over", btn: "SALIN FULL NASKAH VO", rows: 10, noHead: true });
    voPanel.appendChild(fullVo.root);
    body.appendChild(voPanel); addNav("Full VO", voPanel);

    // 2. SCENE
    var h2 = el("h2", "section-h", "DETAIL PRODUKSI PER SCENE"); body.appendChild(h2);
    var scenes = [];
    for (var i = 0; i < n; i++) (function (i) {
      var p = el("section", "panel"); p.id = "sec-s" + (i + 1);
      var head = el("div", "panel-head");
      head.appendChild(el("div", "kicker", "SCENE " + (i + 1) + " | " + rng(i)));
      var h = el("h2", null, "SCENE " + (i + 1) + " | " + rng(i));
      var st = el("div", "sceneTitle", "Menunggu naskah…");
      head.appendChild(h); head.appendChild(st);
      var vo = makeBlock({ label: "A. Naskah Voice Over", btn: "SALIN VO SCENE " + (i + 1), rows: 3 });
      var img = makeBlock({ label: "B. Image Prompt", btn: "SALIN IMAGE PROMPT SCENE " + (i + 1), rows: 6, mono: true });
      var vid = makeBlock({ label: "C. Video Prompt", btn: "SALIN VIDEO PROMPT SCENE " + (i + 1), rows: 8, mono: true });
      var err = el("div", "perr"); err.hidden = true;
      err.innerHTML = "<span></span>"; var rb = el("button", "mini", "Coba lagi"); rb.type = "button"; err.appendChild(rb);
      p.appendChild(head); p.appendChild(vo.root); p.appendChild(el("hr", "sep")); p.appendChild(img.root); p.appendChild(el("hr", "sep")); p.appendChild(vid.root); p.appendChild(err);
      body.appendChild(p);
      scenes[i] = { panel: p, title: st, vo: vo, img: img, vid: vid, err: err, errMsg: err.firstChild, retry: rb };
      addNav("Scene " + (i + 1), p);
    })(i);

    // 3. SEO
    body.appendChild(el("h2", "section-h", "YOUTUBE SHORTS — SEO PACKAGE"));
    var seoPanel = el("section", "panel"); seoPanel.id = "sec-seo";
    var sh = el("div", "panel-head"); sh.appendChild(el("div", "kicker", "BAGIAN 3")); sh.appendChild(el("h2", null, "FULL SEO-FRIENDLY YOUTUBE SHORTS PACKAGE"));
    seoPanel.appendChild(sh);
    var seo = {
      t: [0, 1, 2].map(function (k) { return makeBlock({ label: (k === 0 ? "A. " : "") + "Alternatif judul " + (k + 1), btn: "SALIN JUDUL " + (k + 1), rows: 1 }); }),
      desc: makeBlock({ label: "B. Deskripsi video", btn: "SALIN DESKRIPSI", rows: 6 }),
      hash: makeBlock({ label: "C. Hashtags", btn: "SALIN HASHTAGS", rows: 1 }),
      tags: makeBlock({ label: "D. Tags / keywords", btn: "SALIN TAGS", rows: 2 }),
      concept: makeBlock({ label: "E. Konsep thumbnail", btn: "SALIN KONSEP THUMBNAIL", rows: 5 }),
      tprompt: makeBlock({ label: "F. Thumbnail prompt", btn: "SALIN THUMBNAIL PROMPT", rows: 5, mono: true }),
      pub: makeBlock({ label: "G. Info publikasi", btn: "SALIN INFO PUBLIKASI", rows: 5 }),
      pin: makeBlock({ label: "Pinned comment", btn: "SALIN PINNED COMMENT", rows: 2 }),
      cta: makeBlock({ label: "CTA", btn: "SALIN CTA", rows: 2 })
    };
    var seoErr = el("div", "perr"); seoErr.hidden = true; seoErr.innerHTML = "<span></span>"; var seoRetry = el("button", "mini", "Coba lagi"); seoRetry.type = "button"; seoErr.appendChild(seoRetry);
    [seo.t[0], seo.t[1], seo.t[2], seo.desc, seo.hash, seo.tags, seo.concept, seo.tprompt, seo.pub, seo.pin, seo.cta].forEach(function (b, idx) {
      if (idx > 0) seoPanel.appendChild(el("hr", "sep"));
      seoPanel.appendChild(b.root);
    });
    seoPanel.appendChild(seoErr);
    body.appendChild(seoPanel); addNav("SEO Package", seoPanel);

    // navigasi aktif
    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) sections.forEach(function (s) { s.btn.classList.toggle("on", s.target === en.target); });
        });
      }, { rootMargin: "-90px 0px -60% 0px" });
      sections.forEach(function (s) { io.observe(s.target); });
      R.io = io;
    } catch (e) {}

    return { fullVo: fullVo, scenes: scenes, seo: seo, seoErr: seoErr, seoRetry: seoRetry, seoPanel: seoPanel };
  }

  /* ================= PROSES GENERASI ================= */
  var active = new Set();
  function abortAll() { active.forEach(function (c) { try { c.abort(); } catch (e) {} }); }

  var ENDPOINT = "/api/generate";
  var accessRequired = false;
  function getCode() { try { return sessionStorage.getItem("3des-access") || ""; } catch (e) { return ""; } }

  // Semua pemanggilan Claude lewat backend (/api/generate). Tidak ada API key di sini.
  async function callApi(task, payload) {
    var ctl = new AbortController(); active.add(ctl);
    try {
      var headers = { "Content-Type": "application/json" };
      var code = getCode(); if (code) headers["x-access-code"] = code;
      var res;
      try {
        res = await fetch(ENDPOINT, { method: "POST", headers: headers, body: JSON.stringify(Object.assign({ task: task }, payload)), signal: ctl.signal });
      } catch (e) {
        if (e && e.name === "AbortError") throw { code: "cancelled" };
        throw { code: "network" };
      }
      var json = null;
      try { json = await res.json(); } catch (e) {}
      if (!res.ok || !json || !json.ok) {
        var c = (json && json.error && json.error.code) || (res.status === 504 || res.status === 408 ? "timeout" : "server_error");
        throw { code: c, message: json && json.error && json.error.message };
      }
      return json.data;
    } finally { active.delete(ctl); }
  }

  async function generate(refresh) {
    var topic = topicValue(), lang = langValue(), n = state.dur / 10;
    if (R && R.io) { try { R.io.disconnect(); } catch (e) {} }
    abortAll();
    var run = { id: Date.now(), halted: false, fatal: false, topic: topic, lang: lang, n: n, plan: null, done: 0, total: n + 2, refresh: !!refresh };
    R = run;
    $("sumChips").innerHTML = '<span><b>Topik:</b> ' + esc(topic) + '</span><span><b>Bahasa VO:</b> ' + esc(lang) + '</span><span><b>Durasi:</b> ' + state.dur + ' detik · ' + n + ' scene</span><span><b>Format:</b> 9:16 · 1080 × 1920</span>';
    var ui = buildResult(topic, lang, n);
    run.ui = ui;
    $("formView").hidden = true; $("resultView").hidden = false; window.scrollTo({ top: 0 });
    setStatus("run", "Menyusun naskah dan alur cerita…");

    // tahap 1: naskah + bible
    try {
      var plan = await callApi("plan", { topic: topic, lang: lang, n: n });
      if (run !== R) return;
      if (!plan || !Array.isArray(plan.scenes) || plan.scenes.length < n) throw { code: "invalid_output" };
      plan.scenes = plan.scenes.slice(0, n).map(function (s) { return { title: String(s.title || "").trim(), vo: String(s.vo || "").trim() }; });
      if (plan.scenes.some(function (s) { return !s.vo; })) throw { code: "invalid_output" };
      plan.bible = String(plan.bible || "");
      run.plan = plan;
    } catch (e) {
      if (run !== R) return;
      setStatus("err", errCopy(e));
      return;
    }

    ui.fullVo.set(plan_text(run.plan));
    run.plan.scenes.forEach(function (s, i) {
      var sc = ui.scenes[i];
      sc.title.textContent = s.title;
      sc.vo.set(s.vo);
    });
    run.done = 1;

    // tahap 2: prompt tiap scene + SEO
    var tasks = [];
    for (var k = 0; k < n; k++) (function (k) { tasks.push(function () { return runScene(run, k); }); })(k);
    tasks.push(function () { return runSeo(run); });
    await pool(tasks, 2);
    if (run !== R) return;
    finishStatus(run);
  }

  function plan_text(plan) {
    return plan.scenes.map(function (s, i) { return "SCENE " + (i + 1) + " | " + rng(i) + "\n" + s.vo; }).join("\n\n");
  }

  async function pool(tasks, limit) {
    var idx = 0, ws = [];
    for (var w = 0; w < limit; w++) ws.push((async function () {
      while (idx < tasks.length) { var t = tasks[idx++]; await t(); }
    })());
    await Promise.all(ws);
  }

  function progress(run) {
    if (run !== R) return;
    setStatus("run", "Menyusun prompt dan paket SEO… " + run.done + " dari " + run.total + " bagian selesai");
  }
  function finishStatus(run) {
    var bad = 0;
    run.ui.scenes.forEach(function (s) { if (!s.err.hidden) bad++; });
    if (!run.ui.seoErr.hidden) bad++;
    if (run.halted) setStatus("err", "Dihentikan. Bagian yang belum selesai bisa dilanjutkan dengan Coba lagi.");
    else if (run.fatal) setStatus("err", errCopy({ code: run.fatalCode }));
    else if (bad) setStatus("err", bad + " bagian gagal dibuat. Klik Coba lagi pada bagian tersebut.");
    else setStatus("ok", "Selesai. Semua bagian siap disalin.");
  }

  async function runScene(run, i) {
    var sc = run.ui.scenes[i];
    sc.err.hidden = true;
    sc.img.pending(); sc.vid.pending();
    if (run.halted || run.fatal) { failScene(run, i, { code: run.fatal ? run.fatalCode : "cancelled" }); return; }
    try {
      var out = await callApi("scene", { topic: run.topic, lang: run.lang, n: run.n, plan: run.plan, index: i });
      if (run !== R) return;
      var ip = out && String(out.image_prompt || "").trim(), vp = out && String(out.video_prompt || "").trim();
      if (!ip || !vp) throw { code: "invalid_output" };
      sc.img.set(ip); sc.vid.set(vp);
      run.done++; progress(run);
    } catch (e) {
      if (run !== R) return;
      if (e && FATAL[e.code]) { run.fatal = true; run.fatalCode = e.code; }
      if (e && e.code === "cancelled") run.halted = true;
      failScene(run, i, e);
    }
  }
  function failScene(run, i, e) {
    var sc = run.ui.scenes[i];
    sc.img.clear("Belum tersedia"); sc.vid.clear("Belum tersedia");
    sc.errMsg.textContent = errCopy(e); sc.err.hidden = false;
    sc.retry.onclick = async function () {
      if (run !== R) return;
      run.halted = false; run.fatal = false; run.refresh = false;
      setStatus("run", "Mengulang Scene " + (i + 1) + "…");
      await runScene(run, i);
      if (run === R) finishStatus(run);
    };
    run.done++; progress(run);
  }

  async function runSeo(run) {
    var u = run.ui, S = u.seo;
    u.seoErr.hidden = true;
    Object.keys(S).forEach(function (k) { (Array.isArray(S[k]) ? S[k] : [S[k]]).forEach(function (b) { b.pending(); }); });
    if (run.halted || run.fatal) { failSeo(run, { code: run.fatal ? run.fatalCode : "cancelled" }); return; }
    try {
      var d = await callApi("seo", { topic: run.topic, lang: run.lang, n: run.n, plan: run.plan });
      if (run !== R) return;
      if (!d || !Array.isArray(d.titles) || d.titles.length < 1) throw { code: "invalid_output" };
      var titles = d.titles.slice(0, 3);
      var bestIdx = titles.findIndex(function (t) { return t && t.best; }); if (bestIdx < 0) bestIdx = 0;
      for (var k = 0; k < 3; k++) {
        var t = titles[k];
        if (t) { S.t[k].set(String(t.text || "")); } else S.t[k].clear("—");
        var head = S.t[k].root.querySelector(".badge"); if (head) head.remove();
        if (k === bestIdx) { var bd = el("span", "badge", "Rekomendasi terbaik"); S.t[k].root.querySelector(".blk-head").appendChild(bd); }
      }
      S.desc.set(String(d.description || ""));
      S.hash.set(String(d.hashtags || ""));
      S.tags.set(String(d.tags || ""));
      S.concept.set("Konsep: " + String(d.thumbnail_concept || "") + "\n\nTeks thumbnail: " + String(d.thumbnail_text || ""));
      S.tprompt.set(String(d.thumbnail_prompt || ""));
      S.pub.set("Kategori: " + String(d.category || "") + "\nBahasa: " + String(d.language || run.lang) + "\nNama file video: " + String(d.video_file || "") + "\nNama file thumbnail: " + String(d.thumbnail_file || ""));
      S.pin.set(String(d.pinned_comment || ""));
      S.cta.set(String(d.cta || ""));
      run.done++; progress(run);
    } catch (e) {
      if (run !== R) return;
      if (e && FATAL[e.code]) { run.fatal = true; run.fatalCode = e.code; }
      if (e && e.code === "cancelled") run.halted = true;
      failSeo(run, e);
    }
  }
  function failSeo(run, e) {
    var u = run.ui, S = u.seo;
    Object.keys(S).forEach(function (k) { (Array.isArray(S[k]) ? S[k] : [S[k]]).forEach(function (b) { b.clear("Belum tersedia"); }); });
    u.seoErr.firstChild.textContent = errCopy(e); u.seoErr.hidden = false;
    u.seoRetry.onclick = async function () {
      if (run !== R) return;
      run.halted = false; run.fatal = false; run.refresh = false;
      setStatus("run", "Mengulang paket SEO…");
      await runSeo(run);
      if (run === R) finishStatus(run);
    };
    run.done++; progress(run);
  }

  /* ================= TOMBOL ================= */
  $("goBtn").addEventListener("click", function () { if (!$("goBtn").disabled) generate(false); });
  $("stopBtn").addEventListener("click", function () { if (R) { R.halted = true; } abortAll(); });
  $("redoBtn").addEventListener("click", function () { generate(true); });
  function back() {
    if (R) { R.halted = true; if (R.io) { try { R.io.disconnect(); } catch (e) {} } }
    abortAll();
    R = null;
    $("resultView").hidden = true; $("formView").hidden = false; window.scrollTo({ top: 0 });
  }
  $("backBtn").addEventListener("click", back);
  $("backBtn2").addEventListener("click", back);

  // kode akses opsional (hanya tampil bila server mewajibkannya)
  var codeInput = $("accessInput");
  if (codeInput) {
    codeInput.value = getCode();
    codeInput.addEventListener("input", function () { try { sessionStorage.setItem("3des-access", codeInput.value.trim()); } catch (e) {} });
    fetch(ENDPOINT, { method: "GET" }).then(function (r) { return r.json(); }).then(function (j) {
      accessRequired = !!(j && j.accessRequired);
      $("accessWrap").hidden = !accessRequired;
    }).catch(function () {});
  }

  render();
})();
