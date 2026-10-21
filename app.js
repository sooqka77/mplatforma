// Витрина лекций М-Платформы: главная, направления, лекция, закрытая подборка клиента.
(function () {
  const app = document.getElementById('app');
  // Статическая сборка (GitHub Pages) кладёт сайт в подпапку и работает без сервера.
  const BASE = String(window.MP_BASE || '').replace(/\/$/, '');
  const STATIC = !!window.MP_STATIC;
  const u = (p) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? BASE + p : p);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" style="width:100%;height:100%;display:block"><rect width="40" height="40" rx="6" fill="#1E40AF"/><g fill="#fff"><circle cx="6" cy="6" r="2.2"/><circle cx="34" cy="6" r="2.2"/><circle cx="6" cy="13" r="2.2"/><circle cx="13" cy="13" r="2.2"/><circle cx="27" cy="13" r="2.2"/><circle cx="34" cy="13" r="2.2"/><circle cx="6" cy="20" r="2.2"/><circle cx="20" cy="20" r="2.2"/><circle cx="34" cy="20" r="2.2"/><circle cx="6" cy="27" r="2.2"/><circle cx="34" cy="27" r="2.2"/><circle cx="6" cy="34" r="2.2"/><circle cx="34" cy="34" r="2.2"/></g><g fill="#fff" opacity="0.18"><circle cx="13" cy="6" r="2.2"/><circle cx="20" cy="6" r="2.2"/><circle cx="27" cy="6" r="2.2"/><circle cx="20" cy="13" r="2.2"/><circle cx="13" cy="20" r="2.2"/><circle cx="27" cy="20" r="2.2"/><circle cx="13" cy="27" r="2.2"/><circle cx="20" cy="27" r="2.2"/><circle cx="27" cy="27" r="2.2"/><circle cx="13" cy="34" r="2.2"/><circle cx="20" cy="34" r="2.2"/><circle cx="27" cy="34" r="2.2"/></g></svg>';
  document.querySelectorAll('.logo').forEach((el) => { el.innerHTML = LOGO; });

  const I = {
    play: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  };

  const mins = (s) => (s ? `${Math.max(1, Math.round(s / 60))} мин` : '');
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
  const lectWord = (n) => `${n} ${plural(n, 'лекция', 'лекции', 'лекций')}`;
  const mb = (b) => (b > 1048576 ? `${Math.round(b / 1048576)} МБ` : b > 0 ? `${Math.max(1, Math.round(b / 1024))} КБ` : '');
  const date = (iso) => { const [y, m, d] = String(iso).split('-'); return d ? `${d}.${m}.${y}` : iso; };

  // ───── Данные
  let pub = null;
  async function getPublic() {
    if (!pub) pub = await fetch(STATIC ? u('/data/public.json') : '/api/public').then((r) => r.json());
    return pub;
  }
  const allLectures = (dirs) => dirs.flatMap((d) => d.lectures);

  // ───── Плеер
  let player = null;
  function destroyPlayer() { if (player) { try { player.destroy(); } catch (e) {} player = null; } }
  function mountPlayer(el) {
    if (!window.Plyr || !el) return;
    player = new Plyr(el, {
      iconUrl: u('/vendor/plyr.svg'),
      blankVideo: '',
      controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen'],
      settings: ['speed'],
      speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 1.75, 2] },
      i18n: {
        play: 'Смотреть', pause: 'Пауза', seek: 'Перемотка', played: 'Просмотрено', buffered: 'Загружено',
        currentTime: 'Текущее время', duration: 'Длительность', volume: 'Громкость', mute: 'Без звука', unmute: 'Со звуком',
        enterFullscreen: 'На весь экран', exitFullscreen: 'Свернуть', settings: 'Настройки', speed: 'Скорость', normal: 'Обычная',
        menuBack: 'Назад', restart: 'Сначала', rewind: 'Назад на {seektime} с', fastForward: 'Вперёд на {seektime} с',
      },
    });
  }
  const videoTag = (l) => `<video playsinline preload="metadata" controlsList="nodownload" poster="${esc(u(l.poster))}" oncontextmenu="return false"><source src="${esc(u(l.video))}" type="video/mp4" /></video>`;

  // ───── Главная
  async function home() {
    const data = await getPublic();
    const lectures = allLectures(data.directions);
    const featured = lectures.find((l) => l.video) || lectures[0];
    const c = data.contacts || {};
    app.innerHTML = `
      <div class="wrap">
        <section class="hero">
          <div>
            <div class="eyebrow">Образовательный контент для компаний</div>
            <h1>Видеолекции по вашим учебникам — <em>под ключ</em>.</h1>
            <p class="sub">Отдаёте учебник, методичку или регламент — получаете курс видеолекций с ведущим, презентации и тесты. Для корпоративных академий и учебных центров.</p>
            <div class="cta">
              <a class="btn primary" href="#directions" data-link>Смотреть лекции ${I.arrow}</a>
              <a class="btn" href="#contacts" data-link>Обсудить проект</a>
            </div>
          </div>
          ${featured ? `<a class="hero-shot" href="${u('/l/' + featured.id)}" data-link>
            <img src="${esc(u(featured.poster))}" alt="" />
            <span class="play"><span>${I.play}</span></span>
            <span class="lbl">Лекция · ${esc(featured.title)}</span>
          </a>` : ''}
        </section>

        <div class="facts">
          <div class="fact"><b>50+ лекций</b><span>за 2 месяца для корпоративного заказчика</span></div>
          <div class="fact"><b>Комплект</b><span>видео, презентация и тест к каждой лекции</span></div>
          <div class="fact"><b>По учебнику</b><span>каждый факт сверяем с источником</span></div>
        </div>

        <section class="section" id="directions">
          <div class="eyebrow">Направления</div>
          <h2>Посмотрите, как выглядят наши лекции</h2>
          <p class="lead">Открытые примеры из наших курсов. Лекции по контракту заказчик получает в закрытой подборке.</p>
          <div class="dir-grid">
            ${data.directions.map((d) => {
              const first = d.lectures.find((l) => l.poster) || {};
              const total = d.lectures.reduce((s, l) => s + (l.duration || 0), 0);
              return `<a class="dir" href="${u('/d/' + d.id)}" data-link>
                <div class="cov">${first.poster ? `<img src="${esc(u(first.poster))}" alt="" loading="lazy" />` : ''}</div>
                <div class="body">
                  <h3>${esc(d.title)}</h3>
                  <p>${esc(d.desc)}</p>
                  <div class="meta">${lectWord(d.lectures.length)}${total ? ` · ${mins(total)}` : ''}</div>
                </div>
              </a>`;
            }).join('')}
          </div>
        </section>

        <section class="section" id="how">
          <div class="eyebrow">Как мы работаем</div>
          <h2>Три шага от учебника до курса</h2>
          <p class="lead">Эксперт заказчика не пишет сценарии — он принимает готовое.</p>
          <div class="steps">
            <div class="step"><div class="n">01</div><h3>Учебник</h3><p>Главы, методички, регламенты — в любом виде: docx, pdf, сканы.</p></div>
            <div class="step"><div class="n">02</div><h3>Лекция с ведущим</h3><p>Текст, слайды и видео. Каждый факт сверяем с учебником, 1–2 круга правок.</p></div>
            <div class="step accent"><div class="n">03</div><h3>Комплект для обучения</h3><p>Видео, презентация и тест — в закрытой подборке для вашей компании.</p></div>
          </div>
        </section>

        <section class="section">
          <div class="closed">
            <div>
              <div class="eyebrow">Для заказчиков</div>
              <h2>Ваши лекции — на отдельной странице с паролем</h2>
              <p class="lead" style="margin:0">Мы присылаем ссылку и пароль. Внутри — все лекции по вашему контракту, новые появляются по мере выхода.</p>
            </div>
            <ul>
              <li>${I.check}<span>Смотреть онлайн — без регистрации и установки программ</span></li>
              <li>${I.check}<span>Скачивать видео и презентации для внутреннего обучения</span></li>
              <li>${I.check}<span>Видеть, что вышло нового и что готовится</span></li>
            </ul>
          </div>
        </section>

        <section class="section" id="contacts">
          <div class="eyebrow">Контакты</div>
          <h2>Соберём пилотную лекцию по вашему материалу</h2>
          <p class="lead">Напишите — обсудим тему пилота за 15 минут.</p>
          <div class="contacts">
            <div><div class="name">${esc(c.name)}</div><div class="role">${esc(c.role)}</div></div>
            <div class="links">
              ${c.telegram ? `<a class="btn" href="https://t.me/${esc(c.telegram)}" target="_blank" rel="noopener">Telegram · @${esc(c.telegram)}</a>` : ''}
              ${c.email ? `<a class="btn" href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}
              ${c.phone ? `<a class="btn" href="tel:${esc(c.phone.replace(/[^+\d]/g, ''))}">${esc(c.phone)}</a>` : ''}
            </div>
          </div>
        </section>
        <footer class="foot"><span>mplatforma.tech</span><span>© М-Платформа, 2026</span></footer>
      </div>`;
    document.title = 'М-Платформа — видеолекции по вашим учебникам';
  }

  // ───── Карточка лекции
  function lecCard(l, base) {
    const inner = `
      <div class="cov">${l.poster ? `<img src="${esc(u(l.poster))}" alt="" loading="lazy" />` : ''}
        ${l.soon ? `<span class="soon">Скоро · ${esc(l.soon)}</span>` : l.duration ? `<span class="dur">${mins(l.duration)}</span>` : ''}
      </div>
      <div class="body"><h3>${esc(l.title)}</h3><p>${esc(l.desc)}</p></div>`;
    return l.soon && !l.video
      ? `<div class="lec is-soon">${inner}</div>`
      : `<a class="lec" href="${u(base + '/l/' + l.id)}" data-link>${inner}</a>`;
  }

  // ───── Направление
  async function direction(id) {
    const data = await getPublic();
    const d = data.directions.find((x) => x.id === id);
    if (!d) return notFound();
    const total = d.lectures.reduce((s, l) => s + (l.duration || 0), 0);
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <div class="crumbs"><a href="${u('/')}" data-link>Главная</a><span class="sep">/</span><a href="${u('/#directions')}" data-link>Направления</a></div>
          <h1>${esc(d.title)}</h1>
          <p class="lead">${esc(d.desc)}</p>
          <div class="meta">${lectWord(d.lectures.length)}${total ? ` · ${mins(total)}` : ''}</div>
        </div>
        <div class="lec-grid">${d.lectures.map((l) => lecCard(l, '')).join('')}</div>
      </div>`;
    document.title = `${d.title} — М-Платформа`;
  }

  // ───── Лекция (публичная или из подборки)
  function watchView(l, dir, crumbs, others, base) {
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head" style="padding-bottom:0">${crumbs}</div>
        <div class="watch">
          <div>
            ${l.video ? `<div class="player">${videoTag(l)}</div>`
              : `<div class="player-soon"><img src="${esc(u(l.poster))}" alt="" /><div>${l.placeholder ? esc(l.placeholder) : `Скоро · ${esc(l.soon || 'в подготовке')}`}</div></div>`}
            <h1>${esc(l.title)}</h1>
            <div class="meta">${esc(dir.title)}${l.duration ? ` · ${mins(l.duration)}` : ''}</div>
            <p class="desc">${esc(l.desc)}</p>
            ${(l.downloads || []).length ? `<div class="downloads">${l.downloads.map((f) =>
              `<a class="dl" href="${esc(u(f.url))}" download>${I.down}${esc(f.label)} <small>${esc(f.kind)}${f.size ? ' · ' + mb(f.size) : ''}</small></a>`).join('')}</div>` : ''}
          </div>
          <aside class="side">
            <h4>${esc(dir.title)}</h4>
            ${others.map((o) => `<a class="side-item ${o.id === l.id ? 'cur' : ''}" href="${u(base + '/l/' + o.id)}" data-link>
              <img src="${esc(u(o.poster))}" alt="" loading="lazy" />
              <span><b>${esc(o.title)}</b><span>${o.soon ? 'Скоро' : mins(o.duration)}</span></span>
            </a>`).join('')}
          </aside>
        </div>
      </div>`;
    mountPlayer(app.querySelector('video'));
    document.title = `${l.title} — М-Платформа`;
  }
  async function lecture(id) {
    const data = await getPublic();
    const d = data.directions.find((x) => x.lectures.some((l) => l.id === id));
    if (!d) return notFound();
    const l = d.lectures.find((x) => x.id === id);
    watchView(l, d, `<div class="crumbs"><a href="${u('/')}" data-link>Главная</a><span class="sep">/</span><a href="${u('/d/' + d.id)}" data-link>${esc(d.title)}</a></div>`, d.lectures, '');
  }

  // ───── Подборка клиента
  const collCache = {};

  // Статическая сборка: подборка лежит зашифрованной (AES-GCM, ключ из пароля через PBKDF2).
  // Без пароля не прочитать ни список лекций, ни ссылки на файлы.
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function decryptCollection(enc, password) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(enc.salt), iterations: enc.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(enc.iv) }, key, b64(enc.data));
    return JSON.parse(new TextDecoder().decode(plain));
  }
  const sessKey = (slug) => `mpc_${slug}`;
  function sessGet(slug) { try { return JSON.parse(sessionStorage.getItem(sessKey(slug)) || 'null'); } catch { return null; } }
  function sessSet(slug, data) { try { sessionStorage.setItem(sessKey(slug), JSON.stringify(data)); } catch {} }

  async function collection(slug, lectureId) {
    let data = collCache[slug] || (STATIC ? sessGet(slug) : null);
    if (data) collCache[slug] = data;
    if (!data && STATIC) {
      const r = await fetch(u(`/data/c/${slug}.json`), { cache: 'no-store' });
      if (!r.ok) return notFound('Подборка не найдена. Проверьте ссылку или напишите нам.');
      return gate(slug, lectureId);
    }
    if (!data) {
      const r = await fetch(`/api/c/${encodeURIComponent(slug)}`, { cache: 'no-store' });
      if (r.status === 404) return notFound('Подборка не найдена. Проверьте ссылку или напишите нам.');
      if (r.status === 401) return gate(slug, lectureId);
      data = collCache[slug] = await r.json();
    }
    document.getElementById('top-cta').classList.add('hidden');
    document.getElementById('nav').classList.add('hidden');
    const base = `/c/${slug}`;
    if (lectureId) {
      const d = data.directions.find((x) => x.lectures.some((l) => l.id === lectureId));
      if (!d) return notFound();
      const l = d.lectures.find((x) => x.id === lectureId);
      return watchView(l, d, `<div class="crumbs"><a href="${u(base)}" data-link>${esc(data.client)}</a><span class="sep">/</span><span>${esc(d.title)}</span></div>`, d.lectures, base);
    }
    const count = data.directions.reduce((s, d) => s + d.lectures.length, 0);
    app.innerHTML = `
      <div class="wrap">
        <div class="coll-head">
          <div class="eyebrow">Подборка для</div>
          <div class="client">${esc(data.client)}</div>
          ${data.note ? `<p class="note">${esc(data.note)}</p>` : ''}
          <div class="meta">Обновлено ${esc(date(data.updated))} · ${lectWord(count)}</div>
        </div>
        ${data.directions.map((d) => `
          <section class="coll-dir">
            <h2>${esc(d.title)}</h2>
            <p class="d">${esc(d.desc)}</p>
            ${d.lectures.map((l) => `
              <div class="row ${l.soon && !l.video ? 'is-soon' : ''}">
                <a class="cov" ${l.video || l.placeholder ? `href="${u(base + '/l/' + l.id)}" data-link` : ''}><img src="${esc(u(l.poster))}" alt="" loading="lazy" /></a>
                <div>
                  <h3>${esc(l.title)}</h3>
                  <p>${esc(l.desc)}</p>
                  <div style="margin-top:10px">${l.soon && !l.video ? `<span class="tag-soon">Скоро · ${esc(l.soon)}</span>` : `<span class="mono" style="font-size:13px;color:var(--ink-3)">${mins(l.duration)}</span>`}</div>
                </div>
                <div class="acts">
                  ${l.video || l.placeholder ? `<a class="btn sm primary" href="${u(base + '/l/' + l.id)}" data-link>Смотреть ${I.arrow}</a>` : ''}
                  ${(l.downloads || []).map((f) => `<a class="dl" href="${esc(u(f.url))}" download><span>${I.down} ${esc(f.label)}</span><small>${esc(f.kind)}${f.size ? ' · ' + mb(f.size) : ''}</small></a>`).join('')}
                </div>
              </div>`).join('')}
          </section>`).join('')}
        <footer class="foot"><span>М-Платформа · mplatforma.tech</span><span>Вопросы по подборке — ${esc((data.contacts || {}).email || '')}</span></footer>
      </div>`;
    document.title = `${data.client} — М-Платформа`;
  }

  function gate(slug, lectureId) {
    document.getElementById('top-cta').classList.add('hidden');
    document.getElementById('nav').classList.add('hidden');
    app.innerHTML = `
      <div class="gate"><div class="gate-card">
        <div class="eyebrow">${I.lock} Закрытая подборка</div>
        <h1>Лекции для вашей компании</h1>
        <p>Введите пароль, который вам передал менеджер М-Платформы.</p>
        <form id="gate-form" autocomplete="on">
          <input type="password" name="password" id="pw" placeholder="Пароль" autocomplete="current-password" required autofocus />
          <div class="err" id="gate-err"></div>
          <button class="btn primary" type="submit">Открыть подборку</button>
        </form>
        <div class="help">Нет пароля? Напишите менеджеру, который прислал ссылку.</div>
      </div></div>`;
    document.title = 'Закрытая подборка — М-Платформа';
    const form = document.getElementById('gate-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('gate-err');
      err.textContent = '';
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        if (STATIC) {
          const enc = await fetch(u(`/data/c/${slug}.json`), { cache: 'no-store' }).then((x) => x.json());
          let data;
          try { data = await decryptCollection(enc, document.getElementById('pw').value); }
          catch { err.textContent = 'Пароль не подошёл. Проверьте раскладку и попробуйте ещё раз.'; return; }
          collCache[slug] = data;
          sessSet(slug, data);
          return collection(slug, lectureId);
        }
        const r = await fetch(`/api/c/${encodeURIComponent(slug)}/unlock`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: document.getElementById('pw').value }),
        });
        if (r.status === 429) { err.textContent = 'Слишком много попыток. Попробуйте через 10 минут.'; return; }
        if (!r.ok) { err.textContent = 'Пароль не подошёл. Проверьте раскладку и попробуйте ещё раз.'; return; }
        collCache[slug] = await r.json();
        collection(slug, lectureId);
      } catch {
        err.textContent = 'Нет связи с сервером. Попробуйте ещё раз.';
      } finally {
        btn.disabled = false;
      }
    });
  }

  function notFound(msg) {
    app.innerHTML = `<div class="wrap"><div class="empty"><h2 style="font-weight:500">Страница не найдена</h2><p>${esc(msg || 'Возможно, ссылка устарела.')}</p><p><a class="btn" href="${u('/')}" data-link>На главную</a></p></div></div>`;
  }

  // ───── Роутер
  async function route() {
    destroyPlayer();
    document.getElementById('top-cta').classList.remove('hidden');
    document.getElementById('nav').classList.remove('hidden');
    let p = location.pathname;
    if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length) || '/';
    p = p.replace(/\/index\.html$/, '/');
    let m;
    try {
      if (p === '/' || p === '') { await home(); if (location.hash) document.querySelector(location.hash)?.scrollIntoView(); else window.scrollTo(0, 0); return; }
      if ((m = /^\/d\/([a-z0-9-]+)\/?$/.exec(p))) { await direction(m[1]); return window.scrollTo(0, 0); }
      if ((m = /^\/l\/([a-z0-9-]+)\/?$/.exec(p))) { await lecture(m[1]); return window.scrollTo(0, 0); }
      if ((m = /^\/c\/([a-z0-9-]+)(?:\/l\/([a-z0-9-]+))?\/?$/.exec(p))) { await collection(m[1], m[2]); return window.scrollTo(0, 0); }
      notFound();
    } catch (e) {
      console.error(e);
      app.innerHTML = '<div class="wrap"><div class="empty">Не удалось загрузить страницу. Обновите её через минуту.</div></div>';
    }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    if (url.pathname === location.pathname && url.hash) {
      history.pushState(null, '', url.pathname + url.hash);
      document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    history.pushState(null, '', url.pathname + url.hash);
    route();
  });
  window.addEventListener('popstate', route);
  route();
})();
