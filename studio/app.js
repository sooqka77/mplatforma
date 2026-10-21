// М-Платформа AI — студия методиста. Без сборки: чистый JS, библиотеки в vendor/.
(function () {
  const { GROUPS, FORMATS } = window.MP_FORMATS;
  const SOURCES = window.MP_DEMO_SOURCES || [];
  const CACHE = window.MP_DEMO_CACHE || {};
  const byId = (id) => FORMATS.find((f) => f.id === id);
  const groupOf = (id) => GROUPS.find((g) => g.id === id);
  const $ = (s) => document.querySelector(s);
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ?fast — для показа: примеры открываются из библиотеки за 5–9 с, свои файлы — вживую.
  const FAST = new URLSearchParams(location.search).has('fast');
  const AUDIENCES = ['Операторы линии', 'Наладчики', 'Мастера смены', 'Новые сотрудники'];
  const DEFAULT_BUNDLE = ['notes', 'opl', 'test', 'skill_check'];

  // ───── Иконки
  const P = {
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    page: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>',
    slides: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 9h6M7 13h4"/>',
    video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
    check: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    cards: '<rect x="7" y="3" width="14" height="14" rx="2"/><path d="M3 7v12a2 2 0 0 0 2 2h12"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 11l2 2 4-4M9 17h6"/>',
    point: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 12h.01"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 6.3-6.3a4 4 0 0 0-5-5L9 9 6 6l3-3z" transform="translate(-1 0)"/>',
    swap: '<path d="M7 4 3 8l4 4"/><path d="M3 8h14"/><path d="m17 20 4-4-4-4"/><path d="M21 16H7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.4 8.5 8 9 4.6-.5 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    grad: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h6M9 9h1"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    factory: '<path d="M3 21V10l6 4V10l6 4V6l6 4v11z"/><path d="M7 17h2M12 17h2M17 17h1"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    word: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13l1.5 5 2.5-5 2.5 5 1.5-5"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    tick: '<path d="m5 12 5 5 9-10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  };
  const icon = (name, size = 18, sw = 1.8) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.doc}</svg>`;

  // ───── Состояние
  const state = {
    sourceId: null,
    text: '',
    files: [],
    audience: '',
    docs: [],
    active: 'catalog',
    query: '',
    api: 'unknown', // unknown | online | offline
  };
  let docSeq = 0;

  const currentSource = () => SOURCES.find((s) => s.id === state.sourceId) || null;
  const isPristineExample = () => {
    const s = currentSource();
    return s && state.files.length === 0 && state.text === s.text;
  };
  function composedSource() {
    const parts = [];
    for (const f of state.files) parts.push(`=== Файл: ${f.name} ===\n${f.text}`);
    if (state.text.trim()) parts.push(state.text.trim());
    return parts.join('\n\n');
  }
  function sourceTitle() {
    if (isPristineExample()) return currentSource().title;
    if (state.files.length) return state.files.map((f) => f.name).join(', ');
    const t = state.text.trim();
    if (!t) return '';
    const first = t.split('\n')[0];
    return first.length > 70 ? first.slice(0, 70) + '…' : first;
  }
  const hasSource = () => composedSource().trim().length >= 10;

  // ───── Тост
  let toastT = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('on'), 2400);
  }

  // ───── Статус модели
  async function checkApi() {
    const pill = $('#status');
    const txt = $('#status-text');
    if (location.protocol === 'file:') return setOffline();
    try {
      const r = await fetch('api/generate', { method: 'GET', cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        state.api = 'online';
        pill.className = 'status-pill ok';
        txt.textContent = 'модель Gemini · онлайн';
        return;
      }
    } catch (e) { /* нет функции — статический хостинг */ }
    setOffline();
    function setOffline() {
      state.api = 'offline';
      pill.className = 'status-pill off';
      txt.textContent = 'демо-режим · примеры';
    }
  }

  // ───── Лендинг
  function renderLandingCats() {
    $('#landing-cats').innerHTML = GROUPS.map((g) => `
      <div class="cat">
        <span class="pill ${g.id}">${esc(g.hint)}</span>
        <h3>${esc(g.title)}</h3>
        <ul>${FORMATS.filter((f) => f.group === g.id).map((f) => `<li>${esc(f.title)}</li>`).join('')}</ul>
      </div>`).join('');
  }

  // ───── Левая панель
  function renderExamples() {
    $('#examples').innerHTML = SOURCES.map((s) => `
      <button class="example ${s.id === state.sourceId && isPristineExample() ? 'active' : ''}" data-src="${s.id}">
        <span class="ic">${icon('factory', 17)}</span>
        <span><div class="t">${esc(s.title)}</div><div class="k">${esc(s.kind)}</div></span>
      </button>`).join('');
  }
  function renderFiles() {
    $('#files').innerHTML = state.files.map((f, i) => `
      <span class="file-chip" title="${esc(f.name)}"><span>${esc(f.name)} · ${Math.round(f.text.length / 1000)}K</span>
        <button data-rm="${i}" aria-label="Убрать файл">${icon('x', 11, 2.4)}</button></span>`).join('');
  }
  function renderAudience() {
    $('#audience').innerHTML = AUDIENCES.map((a) =>
      `<button class="chip ${state.audience === a ? 'on' : ''}" data-aud="${esc(a)}">${esc(a)}</button>`).join('');
  }
  function bundleFor() {
    const s = isPristineExample() ? currentSource() : null;
    const ids = s ? ['notes', ...s.suggest, 'test'] : DEFAULT_BUNDLE;
    return [...new Set(ids)].slice(0, 5);
  }
  function renderSourceMeta() {
    const n = composedSource().length;
    $('#counter').textContent = `${n.toLocaleString('ru-RU')} символов${n > 0 && n < 300 ? ' · только тема' : ''}`;
    const btn = $('#bundle-btn');
    btn.disabled = !hasSource();
    const b = bundleFor();
    $('#bundle-label').textContent = `Собрать комплект · ${b.length} ${plural(b.length, 'документ', 'документа', 'документов')}`;
    $('#bundle-hint').textContent = hasSource()
      ? b.map((id) => byId(id).title).join(' · ')
      : 'Выберите пример или добавьте источник';
  }
  function renderLeft() {
    renderExamples();
    renderFiles();
    renderAudience();
    renderSourceMeta();
  }

  // ───── Вкладки
  function renderTabs() {
    const tabs = [`<button class="tab ${state.active === 'catalog' ? 'on' : ''}" data-tab="catalog">${icon('grid', 15)} Форматы</button>`];
    for (const d of state.docs) {
      const f = byId(d.formatId);
      const mark = d.status === 'loading' ? '<span class="spin"></span>'
        : `<span class="dot" style="background:var(--${f.group})"></span>`;
      tabs.push(`<button class="tab ${state.active === d.id ? 'on' : ''}" data-tab="${d.id}">${mark}${esc(f.title)}<span class="x" data-close="${d.id}" title="Закрыть">×</span></button>`);
    }
    $('#tabs').innerHTML = tabs.join('');
  }

  // ───── Каталог
  function renderCatalog() {
    const src = isPristineExample() ? currentSource() : null;
    const rec = new Set(src ? src.suggest : []);
    const q = state.query.trim().toLowerCase();
    const groups = GROUPS.map((g) => {
      const items = FORMATS.filter((f) => f.group === g.id)
        .filter((f) => !q || (f.title + ' ' + f.desc).toLowerCase().includes(q));
      if (!items.length) return '';
      return `<div class="group">
        <div class="group-head"><span class="pill ${g.id}">${esc(g.hint)}</span><h2>${esc(g.title)}</h2></div>
        <div class="fmt-grid">${items.map((f) => `
          <button class="fmt" data-group="${f.group}" data-fmt="${f.id}">
            <span class="ic">${icon(f.icon, 19)}</span>
            ${rec.has(f.id) ? '<span class="rec">Рекомендуем</span>' : ''}
            <span class="go">${icon('arrow', 16)}</span>
            <span class="t">${esc(f.title)}</span>
            <span class="d">${esc(f.desc)}</span>
          </button>`).join('')}</div></div>`;
    }).join('');
    const title = sourceTitle();
    return `<div class="catalog">
      <div class="cat-head">
        <div><h1>Что собрать из материала?</h1>
          <p>${title ? `Источник: <b>${esc(title)}</b>` : 'Выберите пример слева или загрузите свой документ.'}</p></div>
        <label class="search">${icon('search', 16)}<input id="q" type="search" placeholder="Найти формат" value="${esc(state.query)}" /></label>
      </div>
      ${hasSource() ? '' : `<div class="empty-src">${icon('info', 18)} Сначала источник: пример слева, файл или текст. Можно просто тему — одной фразой.</div>`}
      ${groups || '<p style="color:var(--ink-3);margin-top:24px">Ничего не нашлось.</p>'}
    </div>`;
  }

  // ───── Генерация
  const GEN_STEPS = [
    [0, 'Читаем источник'],
    [2200, 'Выделяем структуру, термины и параметры'],
    [5500, 'Собираем документ по формату'],
    [11000, 'Самопроверка: каждое утверждение — по источнику'],
  ];
  function renderGenerating(d) {
    const f = byId(d.formatId);
    const t = Date.now() - d.startedAt;
    const cur = GEN_STEPS.filter(([at]) => t >= at).length - 1;
    return `<div class="gen">
      <div class="ic-lg">${icon(f.icon, 28, 1.6)}</div>
      <h2>${esc(f.title)}</h2>
      <p>${esc(d.sourceTitle)}</p>
      <div class="gen-steps">${GEN_STEPS.map(([, label], i) => `
        <div class="gen-step ${i < cur ? 'done' : i === cur ? 'on' : ''}"><span class="b">${i < cur ? icon('tick', 12, 3) : ''}</span>${esc(label)}</div>`).join('')}
      </div>
      <div class="gen-time">${Math.floor(t / 1000)} с</div>
    </div>`;
  }
  function renderError(d) {
    const f = byId(d.formatId);
    return `<div class="err">
      <h2>Модель не ответила</h2>
      <p>«${esc(f.title)}» не собрался: сервис генерации перегружен или недоступен. Обычно помогает повтор через несколько секунд.</p>
      <button class="btn accent" data-retry="${d.id}">${icon('refresh', 16)} Повторить</button>
      <div class="detail">${esc(d.error || '')}</div>
    </div>`;
  }
  function docHtml(d) {
    const html = DOMPurify.sanitize(marked.parse(d.markdown, { gfm: true, breaks: true }));
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    wrap.querySelectorAll('p').forEach((p) => { if (/^(⚠️|ℹ️)/.test(p.textContent.trim())) p.classList.add('warnline'); });
    return wrap.innerHTML;
  }
  function renderDoc(d) {
    const f = byId(d.formatId);
    const g = groupOf(f.group);
    const secs = Math.max(1, Math.round(d.ms / 1000));
    const date = new Date(d.doneAt || Date.now()).toLocaleDateString('ru-RU');
    return `<div class="doc-bar">
        <button class="btn sm ghost" data-tab="catalog">${icon('back', 15)} Форматы</button>
        <div class="meta"><span class="pill ${f.group}">${esc(g.title)}</span>
          <span>по источнику: ${esc(d.sourceTitle)}</span><span>·</span><span>${secs} с</span>${d.cached ? '<span>·</span><span title="Модель не ответила — показан ранее собранный результат по этому примеру">из библиотеки примеров</span>' : ''}</div>
        <button class="btn sm" data-act="copy">${icon('copy', 15)} Копировать</button>
        <button class="btn sm" data-act="word">${icon('word', 15)} Word</button>
        <button class="btn sm" data-act="print">${icon('print', 15)} PDF</button>
        <button class="btn sm" data-retry="${d.id}">${icon('refresh', 15)} Ещё раз</button>
      </div>
      <div class="doc-wrap"><article class="doc" id="doc">
        <div class="doc-head"><span><b>М-Платформа AI</b> · ${esc(f.title)}</span><span>Черновик · ${date}</span></div>
        ${docHtml(d)}
      </article></div>`;
  }

  function renderMain() {
    const box = $('#main-scroll');
    if (state.active === 'catalog') {
      const keepFocus = document.activeElement && document.activeElement.id === 'q';
      box.innerHTML = renderCatalog();
      if (keepFocus) { const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
      return;
    }
    const d = state.docs.find((x) => x.id === state.active);
    if (!d) { state.active = 'catalog'; return renderMain(); }
    box.innerHTML = d.status === 'loading' ? renderGenerating(d) : d.status === 'error' ? renderError(d) : renderDoc(d);
  }
  function render() { renderTabs(); renderMain(); }

  // тикаем прогресс, пока что-то генерируется и открыто
  setInterval(() => {
    const d = state.docs.find((x) => x.id === state.active);
    if (d && d.status === 'loading') renderMain();
  }, 500);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function callApi(payload) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 62000);
    try {
      const r = await fetch('api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.markdown) throw new Error(j.detail || `HTTP ${r.status}`);
      return j;
    } finally {
      clearTimeout(t);
    }
  }

  async function runDoc(d, payload, cacheKey) {
    const cached = cacheKey && CACHE[cacheKey] && CACHE[cacheKey][d.formatId];
    try {
      if (FAST && cached && !d.forceLive) {
        await sleep(5000 + Math.random() * 4000);
        Object.assign(d, { status: 'done', markdown: cached.markdown, model: cached.model, cached: true });
      } else if (state.api === 'offline') {
        if (!cached) throw new Error('демо-режим: генерация доступна только на сервере');
        await sleep(3500 + Math.random() * 3500);
        Object.assign(d, { status: 'done', markdown: cached.markdown, model: cached.model, cached: false });
      } else {
        const j = await callApi(payload);
        Object.assign(d, { status: 'done', markdown: j.markdown, model: j.model });
      }
    } catch (err) {
      if (cached) {
        // Не показываем мгновенно: генерация по примеру занимает 6–12 с, пусть и запасной путь выглядит так же.
        const wait = 6000 + Math.random() * 5000 - (Date.now() - d.startedAt);
        if (wait > 0) await sleep(wait);
        Object.assign(d, { status: 'done', markdown: cached.markdown, model: cached.model, cached: true });
      } else {
        Object.assign(d, { status: 'error', error: String(err.message || err) });
      }
    }
    d.ms = Date.now() - d.startedAt;
    d.doneAt = Date.now();
    render();
  }

  function startDoc(formatId, { focus = true, replace = null } = {}) {
    if (!hasSource()) { toast('Сначала выберите пример или добавьте источник'); return null; }
    const d = replace || { id: 'd' + (++docSeq) };
    Object.assign(d, {
      formatId, status: 'loading', markdown: '', error: '', cached: false,
      startedAt: Date.now(), sourceTitle: sourceTitle(),
    });
    if (!replace) state.docs.push(d);
    if (focus) state.active = d.id;
    const payload = { formatId, sourceText: composedSource(), audience: state.audience };
    d.payload = payload;
    d.cacheKey = isPristineExample() ? state.sourceId : null;
    render();
    runDoc(d, payload, d.cacheKey);
    return d;
  }
  function retryDoc(id) {
    const d = state.docs.find((x) => x.id === id);
    if (!d) return;
    Object.assign(d, { status: 'loading', error: '', cached: false, startedAt: Date.now(), forceLive: true });
    state.active = d.id;
    render();
    runDoc(d, d.payload, d.cacheKey);
  }

  async function startBundle() {
    if (!hasSource()) return;
    const ids = bundleFor();
    let first = null;
    for (let i = 0; i < ids.length; i++) {
      const d = startDoc(ids[i], { focus: i === 0 });
      if (i === 0) first = d;
      await sleep(350);
    }
    if (first) { state.active = first.id; render(); }
    toast(`Собираем комплект: ${ids.length} ${plural(ids.length, 'документ', 'документа', 'документов')}`);
  }

  // ───── Экспорт
  function activeDoc() { return state.docs.find((x) => x.id === state.active && x.status === 'done'); }
  async function copyDoc() {
    const d = activeDoc(); if (!d) return;
    try { await navigator.clipboard.writeText(d.markdown); toast('Скопировано — markdown'); }
    catch { toast('Не удалось скопировать'); }
  }
  function fileName(d) {
    const f = byId(d.formatId);
    const t = (d.markdown.match(/^#\s+(.+)$/m) || [, f.title])[1];
    return t.replace(/[\\/:*?"<>|«»]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || f.title;
  }
  function wordDoc() {
    const d = activeDoc(); if (!d) return;
    const body = docHtml(d);
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${esc(fileName(d))}</title>
<style>
@page { size: A4; margin: 2cm 1.5cm 2cm 2.5cm; }
body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.4; }
h1 { font-size: 16pt; } h2 { font-size: 14pt; margin-top: 14pt; } h3 { font-size: 12pt; }
table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #777; padding: 4pt 6pt; vertical-align: top; font-size: 11pt; }
th { background: #EEE; }
</style></head><body>${body}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName(d) + '.doc';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Документ Word сохранён');
  }

  // ───── Файлы
  let pdfReady = null, mammothReady = null;
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('не загрузилась библиотека ' + src));
      document.head.appendChild(s);
    });
  }
  async function readFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt' || ext === 'md') return await file.text();
    if (ext === 'docx') {
      mammothReady = mammothReady || loadScript('vendor/mammoth.browser.min.js');
      await mammothReady;
      const r = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return r.value;
    }
    if (ext === 'pdf') {
      pdfReady = pdfReady || loadScript('vendor/pdf.min.js');
      await pdfReady;
      const lib = window.pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
      const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 60); i++) {
        const page = await pdf.getPage(i);
        const c = await page.getTextContent();
        pages.push(c.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join(''));
      }
      return pages.join('\n\n');
    }
    throw new Error('формат не поддерживается');
  }
  async function addFiles(list) {
    const arr = [...list].slice(0, 10);
    for (const file of arr) {
      try {
        const text = (await readFile(file)).trim();
        if (!text) { toast(`В «${file.name}» не нашлось текста`); continue; }
        state.files.push({ name: file.name, text });
        toast(`Добавлен: ${file.name}`);
      } catch (e) {
        toast(`«${file.name}»: ${e.message}`);
      }
    }
    renderLeft();
    if (state.active === 'catalog') renderMain();
  }

  // ───── События
  function bind() {
    $('#examples').addEventListener('click', (e) => {
      const b = e.target.closest('[data-src]'); if (!b) return;
      const s = SOURCES.find((x) => x.id === b.dataset.src);
      state.sourceId = s.id;
      state.text = s.text;
      state.files = [];
      $('#src-text').value = s.text;
      $('#src-text').scrollTop = 0;
      state.active = 'catalog';
      renderLeft();
      render();
    });
    $('#src-text').addEventListener('input', (e) => {
      state.text = e.target.value;
      renderExamples();
      renderSourceMeta();
      if (state.active === 'catalog') renderMain();
    });
    $('#file-input').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
    $('#files').addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]'); if (!b) return;
      e.preventDefault();
      state.files.splice(+b.dataset.rm, 1);
      renderLeft();
      if (state.active === 'catalog') renderMain();
    });
    $('#audience').addEventListener('click', (e) => {
      const b = e.target.closest('[data-aud]'); if (!b) return;
      state.audience = state.audience === b.dataset.aud ? '' : b.dataset.aud;
      renderAudience();
    });
    $('#bundle-btn').addEventListener('click', startBundle);

    $('#tabs').addEventListener('click', (e) => {
      const x = e.target.closest('[data-close]');
      if (x) {
        e.stopPropagation();
        const i = state.docs.findIndex((d) => d.id === x.dataset.close);
        if (i >= 0) state.docs.splice(i, 1);
        if (state.active === x.dataset.close) state.active = state.docs.length ? state.docs[Math.max(0, i - 1)].id : 'catalog';
        return render();
      }
      const t = e.target.closest('[data-tab]'); if (!t) return;
      state.active = t.dataset.tab;
      render();
    });
    $('#main-scroll').addEventListener('click', (e) => {
      const f = e.target.closest('[data-fmt]');
      if (f) return void startDoc(f.dataset.fmt);
      const t = e.target.closest('[data-tab]');
      if (t) { state.active = t.dataset.tab; return render(); }
      const r = e.target.closest('[data-retry]');
      if (r) return retryDoc(r.dataset.retry);
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'copy') copyDoc();
      if (a.dataset.act === 'word') wordDoc();
      if (a.dataset.act === 'print') window.print();
    });
    $('#main-scroll').addEventListener('input', (e) => {
      if (e.target.id === 'q') { state.query = e.target.value; renderMain(); }
    });
  }

  // ───── Роутинг
  function route() {
    const studio = location.hash.startsWith('#/studio');
    $('#view-landing').classList.toggle('hidden', studio);
    $('#view-studio').classList.toggle('hidden', !studio);
    if (studio) render();
    if (location.hash === '#/' || location.hash === '') window.scrollTo(0, 0);
  }

  renderLandingCats();
  renderLeft();
  bind();
  route();
  window.addEventListener('hashchange', route);
  checkApi();
})();
