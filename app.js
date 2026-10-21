// Платформа лекций М-Платформы: главная, рубрикатор курсов, курс, лекция, кабинет клиента.
// Работает и с сервером (server.js / Vercel), и статикой (GitHub Pages: window.MP_STATIC).
(function () {
  const app = document.getElementById('app');
  const BASE = String(window.MP_BASE || '').replace(/\/$/, '');
  const STATIC = !!window.MP_STATIC;
  const u = (p) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? BASE + p : p);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" style="width:100%;height:100%;display:block"><rect width="40" height="40" rx="6" fill="#1E40AF"/><g fill="#fff"><circle cx="6" cy="6" r="2.2"/><circle cx="34" cy="6" r="2.2"/><circle cx="6" cy="13" r="2.2"/><circle cx="13" cy="13" r="2.2"/><circle cx="27" cy="13" r="2.2"/><circle cx="34" cy="13" r="2.2"/><circle cx="6" cy="20" r="2.2"/><circle cx="20" cy="20" r="2.2"/><circle cx="34" cy="20" r="2.2"/><circle cx="6" cy="27" r="2.2"/><circle cx="34" cy="27" r="2.2"/><circle cx="6" cy="34" r="2.2"/><circle cx="34" cy="34" r="2.2"/></g><g fill="#fff" opacity="0.18"><circle cx="13" cy="6" r="2.2"/><circle cx="20" cy="6" r="2.2"/><circle cx="27" cy="6" r="2.2"/><circle cx="20" cy="13" r="2.2"/><circle cx="13" cy="20" r="2.2"/><circle cx="27" cy="20" r="2.2"/><circle cx="13" cy="27" r="2.2"/><circle cx="20" cy="27" r="2.2"/><circle cx="27" cy="27" r="2.2"/><circle cx="13" cy="34" r="2.2"/><circle cx="20" cy="34" r="2.2"/><circle cx="27" cy="34" r="2.2"/></g></svg>';
  document.querySelectorAll('.logo').forEach((el) => { el.innerHTML = LOGO; });

  const I = {
    play: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    playSm: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  };

  const mins = (s) => (s ? `${Math.max(1, Math.round(s / 60))} мин` : '');
  const clock = (s) => { s = Math.floor(s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
  const nLect = (n) => `${n} ${plural(n, 'лекция', 'лекции', 'лекций')}`;
  const nCourse = (n) => `${n} ${plural(n, 'курс', 'курса', 'курсов')}`;
  const mb = (b) => (b > 1048576 ? `${Math.round(b / 1048576)} МБ` : b > 0 ? `${Math.max(1, Math.round(b / 1024))} КБ` : '');
  const date = (iso) => { const [y, m, d] = String(iso || '').split('-'); return d ? `${d}.${m}.${y}` : iso || ''; };

  // ───── Прогресс просмотра (в этом браузере, без регистрации)
  const PKEY = 'mp_progress_v1';
  function progAll() { try { return JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch { return {}; } }
  function progSave(id, patch) {
    try { const all = progAll(); all[id] = { ...(all[id] || {}), ...patch, at: Date.now() }; localStorage.setItem(PKEY, JSON.stringify(all)); } catch {}
  }
  const progOf = (id) => progAll()[id] || null;
  const isDone = (id) => !!(progOf(id) || {}).done;

  // ───── Данные
  let pub = null;
  async function getPublic() {
    if (!pub) pub = await fetch(STATIC ? u('/data/public.json') : '/api/public').then((r) => r.json());
    return pub;
  }
  const lecturesOfCourse = (data, c) => c.modules.flatMap((m) => m.lectures).map((id) => data.lectures[id]).filter(Boolean);
  const dirOf = (data, id) => data.directions.find((d) => d.id === id) || { title: '', color: '#1E40AF' };
  const courseOfLecture = (data, lid) => data.courses.find((c) => c.modules.some((m) => m.lectures.includes(lid)));
  const watchable = (l) => !!(l && (l.video || l.placeholder));
  function nextToWatch(data, c) {
    const ls = lecturesOfCourse(data, c).filter(watchable);
    return ls.find((l) => !isDone(l.id)) || ls[0] || null;
  }
  function courseDone(data, c) {
    const ls = lecturesOfCourse(data, c).filter((l) => l.video);
    return { done: ls.filter((l) => isDone(l.id)).length, total: ls.length };
  }

  // ───── Обложки: картинка или типографская плашка цвета направления
  function cover(img, title, dir) {
    if (img) return `<img src="${esc(u(img))}" alt="" loading="lazy" />`;
    return `<div class="gen-cover" style="--c:${esc(dir.color)}"><span>${esc(dir.title)}</span><b>${esc(title)}</b></div>`;
  }

  // ───── Плеер
  let player = null;
  function destroyPlayer() { if (player) { try { player.destroy(); } catch (e) {} player = null; } }
  function mountPlayer(l) {
    const el = app.querySelector('video');
    if (!el) return;
    const p = progOf(l.id);
    el.addEventListener('loadedmetadata', () => {
      if (p && p.t > 10 && el.duration && p.t < el.duration * 0.95) {
        el.currentTime = p.t;
        const hint = app.querySelector('#resume-hint');
        if (hint) { hint.textContent = `Продолжаем с ${clock(p.t)}`; hint.classList.remove('hidden'); setTimeout(() => hint.classList.add('hidden'), 4000); }
      }
    }, { once: true });
    let last = 0;
    el.addEventListener('timeupdate', () => {
      if (Math.abs(el.currentTime - last) < 5) return;
      last = el.currentTime;
      const done = el.duration ? el.currentTime / el.duration > 0.9 : false;
      progSave(l.id, done ? { t: 0, d: el.duration, done: true } : { t: el.currentTime, d: el.duration });
    });
    el.addEventListener('ended', () => progSave(l.id, { t: 0, done: true }));
    if (!window.Plyr) return;
    player = new Plyr(el, {
      iconUrl: u('/vendor/plyr.svg'), blankVideo: '',
      controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'fullscreen'],
      settings: ['speed'], speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 1.75, 2] },
      i18n: {
        play: 'Смотреть', pause: 'Пауза', seek: 'Перемотка', played: 'Просмотрено', buffered: 'Загружено',
        currentTime: 'Текущее время', duration: 'Длительность', volume: 'Громкость', mute: 'Без звука', unmute: 'Со звуком',
        enterFullscreen: 'На весь экран', exitFullscreen: 'Свернуть', settings: 'Настройки', speed: 'Скорость', normal: 'Обычная',
        menuBack: 'Назад', restart: 'Сначала', rewind: 'Назад на {seektime} с', fastForward: 'Вперёд на {seektime} с',
      },
    });
  }

  // ───── Карточки
  function courseCard(data, c, base) {
    const d = dirOf(data, c.direction);
    const pr = courseDone(data, c);
    const meta = [nLect(c.lectureCount), c.duration ? mins(c.duration) : '', c.videoCount ? '' : 'готовится'].filter(Boolean).join(' · ');
    return `<a class="ccard" href="${u(base + '/course/' + c.id)}" data-link>
      <div class="cov">${cover(c.cover, c.title, d)}</div>
      <div class="body">
        <div class="dtag" style="--c:${esc(d.color)}">${esc(d.title)}</div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.short)}</p>
        <div class="meta">${esc(meta)}</div>
        ${pr.done ? `<div class="bar"><i style="width:${Math.round((pr.done / Math.max(1, pr.total)) * 100)}%"></i></div>` : ''}
      </div>
    </a>`;
  }
  function lectureRow(l, base, n) {
    const p = progOf(l.id);
    const st = isDone(l.id) ? 'done' : p ? 'started' : '';
    const right = !watchable(l) ? `<span class="tag-soon">Скоро · ${esc(l.soon || 'в подготовке')}</span>`
      : `<span class="mono">${st === 'done' ? 'просмотрено' : st === 'started' ? `с ${clock(p.t)}` : mins(l.duration)}</span>`;
    const inner = `<span class="num ${st}">${st === 'done' ? I.check : String(n).padStart(2, '0')}</span>
      <span class="t"><b>${esc(l.title)}</b><small>${esc(l.desc)}</small></span>${right}`;
    return watchable(l) ? `<a class="lrow" href="${u(base + '/lecture/' + l.id)}" data-link>${inner}</a>` : `<div class="lrow is-soon">${inner}</div>`;
  }

  // ───── Главная
  async function home() {
    const data = await getPublic();
    const featured = Object.values(data.lectures).find(watchable);
    const top = [...data.courses].sort((a, b) => b.videoCount - a.videoCount).slice(0, 3);
    const c = data.contacts || {};
    const total = Object.keys(data.lectures).length;
    app.innerHTML = `
      <div class="wrap">
        <section class="hero">
          <div>
            <div class="eyebrow">Образовательный контент для компаний</div>
            <h1>Видеолекции по вашим учебникам — <em>под ключ</em>.</h1>
            <p class="sub">Отдаёте учебник, методичку или регламент — получаете курс видеолекций с ведущим, презентации и тесты. Сотрудники смотрят их здесь, в два клика.</p>
            <div class="cta">
              <a class="btn primary" href="${u('/catalog')}" data-link>Смотреть каталог ${I.arrow}</a>
              <a class="btn" href="#contacts" data-link>Обсудить проект</a>
            </div>
          </div>
          ${featured ? `<a class="hero-shot" href="${u('/lecture/' + featured.id)}" data-link>
            <img src="${esc(u(featured.poster))}" alt="" />
            <span class="play"><span>${I.play}</span></span>
            <span class="lbl">Лекция · ${esc(featured.title)}</span>
          </a>` : ''}
        </section>

        <div class="facts">
          <div class="fact"><b>50+ лекций</b><span>за 2 месяца для корпоративного заказчика</span></div>
          <div class="fact"><b>${nCourse(data.courses.length)}</b><span>${nLect(total)} в открытом каталоге</span></div>
          <div class="fact"><b>По учебнику</b><span>каждый факт сверяем с источником</span></div>
        </div>

        <section class="section" id="directions">
          <div class="eyebrow">Направления</div>
          <h2>С чем мы работаем</h2>
          <div class="dir-tiles">
            ${data.directions.map((d) => `<a class="dtile" href="${u('/catalog?d=' + d.id)}" data-link style="--c:${esc(d.color)}">
              <b>${esc(d.title)}</b><span>${esc(d.short)}</span><small>${nCourse(d.courseCount)} ${I.arrow}</small>
            </a>`).join('')}
          </div>
        </section>

        <section class="section">
          <div class="row-head">
            <div><div class="eyebrow">Курсы</div><h2>С чего начать</h2></div>
            <a class="btn" href="${u('/catalog')}" data-link>Весь каталог ${I.arrow}</a>
          </div>
          <div class="cgrid">${top.map((x) => courseCard(data, x, '')).join('')}</div>
        </section>

        <section class="section" id="how">
          <div class="eyebrow">Как мы работаем</div>
          <h2>Три шага от учебника до курса</h2>
          <p class="lead">Эксперт заказчика не пишет сценарии — он принимает готовое.</p>
          <div class="steps">
            <div class="step"><div class="n">01</div><h3>Учебник</h3><p>Главы, методички, регламенты — в любом виде: docx, pdf, сканы.</p></div>
            <div class="step"><div class="n">02</div><h3>Лекция с ведущим</h3><p>Текст, слайды и видео. Каждый факт сверяем с учебником, 1–2 круга правок.</p></div>
            <div class="step accent"><div class="n">03</div><h3>Курс на платформе</h3><p>Видео, презентация и тест — в кабинете вашей компании.</p></div>
          </div>
        </section>

        <section class="section">
          <div class="closed">
            <div>
              <div class="eyebrow">Для заказчиков</div>
              <h2>Кабинет вашей компании — по ссылке и паролю</h2>
              <p class="lead" style="margin:0">Внутри — курсы по вашему контракту. Новые лекции появляются по мере выхода.</p>
            </div>
            <ul>
              <li>${I.check}<span>Смотреть онлайн — без регистрации и установки программ</span></li>
              <li>${I.check}<span>Продолжать с места, где остановились</span></li>
              <li>${I.check}<span>Скачивать видео и презентации для внутреннего обучения</span></li>
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

  // ───── Рубрикатор
  async function catalog() {
    const data = await getPublic();
    const qs = new URLSearchParams(location.search);
    let dir = qs.get('d') || '';
    let q = qs.get('q') || '';
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <div class="crumbs"><a href="${u('/')}" data-link>Главная</a><span class="sep">/</span><span>Каталог</span></div>
          <h1>Каталог курсов</h1>
          <p class="lead">${nCourse(data.courses.length)} · ${nLect(Object.keys(data.lectures).length)}. Выберите направление или найдите тему.</p>
        </div>
        <div class="cat-layout">
          <aside class="cat-side">
            <label class="search">${I.search}<input id="q" type="search" placeholder="Курс или тема лекции" value="${esc(q)}" /></label>
            <div class="side-label">Направления</div>
            <nav id="dirs"></nav>
          </aside>
          <section><div class="cgrid" id="grid"></div><div class="empty hidden" id="none">Ничего не нашлось. Попробуйте другое слово.</div></section>
        </div>
      </div>`;
    const draw = () => {
      const ql = q.trim().toLowerCase();
      const match = (c) => !ql || (c.title + ' ' + c.short + ' ' + lecturesOfCourse(data, c).map((l) => l.title).join(' ')).toLowerCase().includes(ql);
      const list = data.courses.filter((c) => (!dir || c.direction === dir) && match(c));
      document.getElementById('dirs').innerHTML = [{ id: '', title: 'Все направления', color: '#0E1410' }, ...data.directions].map((d) => {
        const n = data.courses.filter((c) => (!d.id || c.direction === d.id) && match(c)).length;
        return `<button class="dopt ${d.id === dir ? 'on' : ''}" data-dir="${esc(d.id)}" style="--c:${esc(d.color)}"><i></i><span>${esc(d.title)}</span><small>${n}</small></button>`;
      }).join('');
      document.getElementById('grid').innerHTML = list.map((c) => courseCard(data, c, '')).join('');
      document.getElementById('none').classList.toggle('hidden', list.length > 0);
      const p = new URLSearchParams(); if (dir) p.set('d', dir); if (q) p.set('q', q);
      history.replaceState(null, '', u('/catalog') + (p.toString() ? '?' + p : ''));
    };
    document.getElementById('dirs').addEventListener('click', (e) => { const b = e.target.closest('[data-dir]'); if (b) { dir = b.dataset.dir; draw(); } });
    document.getElementById('q').addEventListener('input', (e) => { q = e.target.value; draw(); });
    draw();
    document.title = 'Каталог курсов — М-Платформа';
  }

  // ───── Курс (публичный и в кабинете)
  function coursePage(data, id, base, crumbsHtml) {
    const c = data.courses.find((x) => x.id === id);
    if (!c) return notFound();
    const d = dirOf(data, c.direction);
    const next = nextToWatch(data, c);
    const pr = courseDone(data, c);
    const started = next && progOf(next.id);
    let n = 0;
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head" style="padding-bottom:12px">${crumbsHtml}</div>
        <section class="course-hero">
          <div>
            <div class="dtag" style="--c:${esc(d.color)}">${esc(d.title)}</div>
            <h1>${esc(c.title)}</h1>
            <p class="lead">${esc(c.short)}</p>
            <div class="meta">${[nLect(c.lectureCount), c.duration ? mins(c.duration) : '', pr.total && pr.done ? `просмотрено ${pr.done} из ${pr.total}` : ''].filter(Boolean).join(' · ')}</div>
            <div class="cta">
              ${next ? `<a class="btn primary" href="${u(base + '/lecture/' + next.id)}" data-link>${I.playSm} ${started ? 'Продолжить' : pr.done ? 'Следующая лекция' : 'Начать смотреть'}</a>`
                : '<span class="tag-soon">Лекции курса готовятся</span>'}
            </div>
          </div>
          <div class="course-cov">${cover(c.cover, c.title, d)}</div>
        </section>
        <section class="course-body">
          <div>
            <h2>Программа курса</h2>
            ${c.modules.map((m, mi) => `<div class="module">
              <div class="mhead"><span class="mono">Модуль ${mi + 1}</span><b>${esc(m.title)}</b></div>
              ${m.lectures.map((lid) => data.lectures[lid]).filter(Boolean).map((l) => lectureRow(l, base, ++n)).join('')}
            </div>`).join('')}
          </div>
          <aside class="course-side">
            ${c.outcomes.length ? `<div class="box"><h4>Чему научится сотрудник</h4><ul>${c.outcomes.map((o) => `<li>${I.check}<span>${esc(o)}</span></li>`).join('')}</ul></div>` : ''}
            ${c.audience ? `<div class="box"><h4>Для кого</h4><p>${esc(c.audience)}</p></div>` : ''}
            ${c.source ? `<div class="box"><h4>Источник</h4><p>${esc(c.source)}</p></div>` : ''}
          </aside>
        </section>
      </div>`;
    document.title = `${c.title} — М-Платформа`;
  }

  // ───── Лекция (публичная и в кабинете)
  function lecturePage(data, id, base, crumbsFor) {
    const l = data.lectures[id];
    if (!l) return notFound();
    const c = courseOfLecture(data, id);
    const ls = c ? lecturesOfCourse(data, c) : [l];
    const i = ls.findIndex((x) => x.id === id);
    const prev = ls.slice(0, i).reverse().find(watchable);
    const next = ls.slice(i + 1).find(watchable);
    const d = c ? dirOf(data, c.direction) : { title: '', color: '#1E40AF' };
    let n = 0;
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head" style="padding-bottom:0">${crumbsFor(c)}</div>
        <div class="watch">
          <div>
            ${l.video ? `<div class="player"><video playsinline preload="metadata" controlsList="nodownload" poster="${esc(u(l.poster))}" oncontextmenu="return false"><source src="${esc(u(l.video))}" type="video/mp4" /></video></div>
                <div class="resume hidden" id="resume-hint"></div>`
              : `<div class="player-soon">${cover(l.poster, l.title, d)}<div class="ps-note"><span>${esc(l.placeholder || ('Скоро · ' + (l.soon || 'в подготовке')))}</span></div></div>`}
            <div class="lec-nav">
              ${prev ? `<a class="btn sm" href="${u(base + '/lecture/' + prev.id)}" data-link>${I.back} Предыдущая</a>` : '<span></span>'}
              ${next ? `<a class="btn sm primary" href="${u(base + '/lecture/' + next.id)}" data-link>Следующая ${I.arrow}</a>` : (c ? `<a class="btn sm" href="${u(base + '/course/' + c.id)}" data-link>К программе курса</a>` : '')}
            </div>
            <h1>${esc(l.title)}</h1>
            <div class="meta">${esc(c ? c.title : '')}${l.duration ? ` · ${mins(l.duration)}` : ''}</div>
            <p class="desc">${esc(l.desc)}</p>
            ${(l.downloads || []).length ? `<div class="downloads">${l.downloads.map((f) =>
              `<a class="dl" href="${esc(u(f.url))}" download>${I.down}${esc(f.label)} <small>${esc(f.kind)}${f.size ? ' · ' + mb(f.size) : ''}</small></a>`).join('')}</div>` : ''}
            ${l.outline.length ? `<div class="outline"><h3>Содержание лекции</h3><ol>${l.outline.map((o) => `<li>${esc(o)}</li>`).join('')}</ol></div>` : ''}
          </div>
          <aside class="side">
            <h4>${esc(c ? c.title : 'Лекции')}</h4>
            ${ls.map((o) => {
              const st = isDone(o.id) ? 'done' : '';
              const inner = `<span class="num ${st}">${st ? I.check : String(++n).padStart(2, '0')}</span><span><b>${esc(o.title)}</b><span>${watchable(o) ? mins(o.duration) : 'скоро'}</span></span>`;
              return watchable(o) ? `<a class="side-item ${o.id === id ? 'cur' : ''}" href="${u(base + '/lecture/' + o.id)}" data-link>${inner}</a>` : `<div class="side-item is-soon ${o.id === id ? 'cur' : ''}">${inner}</div>`;
            }).join('')}
          </aside>
        </div>
      </div>`;
    if (l.video) mountPlayer(l);
    document.title = `${l.title} — М-Платформа`;
  }
  const pubCrumbs = (c) => `<div class="crumbs"><a href="${u('/catalog')}" data-link>Каталог</a>${c ? `<span class="sep">/</span><a href="${u('/course/' + c.id)}" data-link>${esc(c.title)}</a>` : ''}</div>`;

  // ───── Кабинет клиента
  const collCache = {};
  // Статическая сборка: кабинет лежит зашифрованным (AES-GCM, ключ из пароля через PBKDF2)
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

  async function loadCollection(slug) {
    const cached = collCache[slug] || (STATIC ? sessGet(slug) : null);
    if (cached) return (collCache[slug] = cached);
    if (STATIC) {
      const r = await fetch(u(`/data/c/${slug}.json`), { cache: 'no-store' });
      return r.ok ? 'locked' : 'missing';
    }
    const r = await fetch(`/api/c/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (r.status === 404) return 'missing';
    if (r.status === 401) return 'locked';
    return (collCache[slug] = await r.json());
  }

  async function cabinet(slug, sub, id) {
    const data = await loadCollection(slug);
    if (data === 'missing') return notFound('Кабинет не найден. Проверьте ссылку или напишите нам.');
    hideMarketingNav();
    if (data === 'locked') return gate(slug);
    const base = `/c/${slug}`;
    const homeLink = `<a href="${u(base)}" data-link>${esc(data.client)}</a>`;
    if (sub === 'course') return coursePage(data, id, base, `<div class="crumbs">${homeLink}<span class="sep">/</span><span>Курс</span></div>`);
    if (sub === 'lecture') return lecturePage(data, id, base, (c) => `<div class="crumbs">${homeLink}${c ? `<span class="sep">/</span><a href="${u(base + '/course/' + c.id)}" data-link>${esc(c.title)}</a>` : ''}</div>`);

    const all = Object.values(data.lectures);
    const progress = progAll();
    const resume = all.filter((l) => progress[l.id] && !progress[l.id].done && watchable(l)).sort((a, b) => progress[b.id].at - progress[a.id].at)[0];
    const firstCourse = data.courses.find((c) => nextToWatch(data, c));
    const start = resume || (firstCourse && nextToWatch(data, firstCourse));
    const startCourse = start && courseOfLecture(data, start.id);
    const fresh = all.filter((l) => l.added).sort((a, b) => b.added.localeCompare(a.added)).slice(0, 3);
    app.innerHTML = `
      <div class="wrap">
        <div class="coll-head">
          <div class="eyebrow">Кабинет компании</div>
          <div class="client">${esc(data.client)}</div>
          ${data.note ? `<p class="note">${esc(data.note)}</p>` : ''}
          <div class="meta">Обновлено ${esc(date(data.updated))} · ${nCourse(data.courses.length)} · ${nLect(all.length)}</div>
        </div>
        ${start ? `<a class="resume-card" href="${u(base + '/lecture/' + start.id)}" data-link>
          <div class="rc-cov">${cover(start.poster, start.title, dirOf(data, startCourse && startCourse.direction))}<span class="play"><span>${I.play}</span></span></div>
          <div class="rc-body">
            <div class="eyebrow">${resume ? `Продолжить с ${clock(progress[resume.id].t)}` : 'Начните отсюда'}</div>
            <h2>${esc(start.title)}</h2>
            <p>${esc(startCourse ? startCourse.title : '')}${start.duration ? ' · ' + mins(start.duration) : ''}</p>
            <span class="btn primary">${I.playSm} ${resume ? 'Продолжить' : 'Смотреть'}</span>
          </div>
        </a>` : ''}
        <section class="section" style="padding-top:44px">
          <h2 class="h2-sm">Курсы</h2>
          <div class="cgrid">${data.courses.map((c) => courseCard(data, c, base)).join('')}</div>
        </section>
        ${fresh.length ? `<section class="section" style="padding-top:44px">
          <h2 class="h2-sm">Новое</h2>
          <div class="fresh">${fresh.map((l) => {
            const c = courseOfLecture(data, l.id);
            const inner = `<span class="mono">${esc(date(l.added))}</span><b>${esc(l.title)}</b><span>${esc(c ? c.title : '')}</span>${!watchable(l) ? `<span class="tag-soon">Скоро · ${esc(l.soon || 'в подготовке')}</span>` : ''}`;
            return watchable(l) ? `<a class="fresh-item" href="${u(base + '/lecture/' + l.id)}" data-link>${inner}</a>` : `<div class="fresh-item">${inner}</div>`;
          }).join('')}</div>
        </section>` : ''}
        <footer class="foot"><span>М-Платформа · mplatforma.tech</span><span>Вопросы — ${esc((data.contacts || {}).email || '')}</span></footer>
      </div>`;
    document.title = `${data.client} — М-Платформа`;
  }

  function gate(slug) {
    app.innerHTML = `
      <div class="gate"><div class="gate-card">
        <div class="eyebrow">${I.lock} Кабинет компании</div>
        <h1>Лекции для вашей компании</h1>
        <p>Введите пароль, который вам передал менеджер М-Платформы.</p>
        <form id="gate-form" autocomplete="on">
          <input type="password" name="password" id="pw" placeholder="Пароль" autocomplete="current-password" required autofocus />
          <div class="err" id="gate-err"></div>
          <button class="btn primary" type="submit">Войти</button>
        </form>
        <div class="help">Нет пароля? Напишите менеджеру, который прислал ссылку.</div>
      </div></div>`;
    document.title = 'Кабинет компании — М-Платформа';
    const form = document.getElementById('gate-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('gate-err');
      const btn = form.querySelector('button');
      const pw = document.getElementById('pw').value;
      err.textContent = '';
      btn.disabled = true;
      try {
        if (STATIC) {
          const enc = await fetch(u(`/data/c/${slug}.json`), { cache: 'no-store' }).then((x) => x.json());
          let data;
          try { data = await decryptCollection(enc, pw); } catch { err.textContent = 'Пароль не подошёл. Проверьте раскладку и попробуйте ещё раз.'; return; }
          collCache[slug] = data; sessSet(slug, data);
        } else {
          const r = await fetch(`/api/c/${encodeURIComponent(slug)}/unlock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
          if (r.status === 429) { err.textContent = 'Слишком много попыток. Попробуйте через 10 минут.'; return; }
          if (!r.ok) { err.textContent = 'Пароль не подошёл. Проверьте раскладку и попробуйте ещё раз.'; return; }
          collCache[slug] = await r.json();
        }
        route();
      } catch {
        err.textContent = 'Нет связи с сервером. Попробуйте ещё раз.';
      } finally {
        btn.disabled = false;
      }
    });
  }

  function hideMarketingNav() {
    document.getElementById('top-cta').classList.add('hidden');
    document.getElementById('nav').classList.add('hidden');
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
    p = p.replace(/\/index\.html$/, '/').replace(/(.)\/$/, '$1');
    let m;
    try {
      if (p === '/' || p === '') { await home(); if (location.hash) document.querySelector(location.hash)?.scrollIntoView(); else window.scrollTo(0, 0); return; }
      window.scrollTo(0, 0);
      if (p === '/catalog') return await catalog();
      if ((m = /^\/d\/([a-z0-9-]+)$/.exec(p))) { history.replaceState(null, '', u('/catalog?d=' + m[1])); return await catalog(); }
      if ((m = /^\/course\/([a-z0-9-]+)$/.exec(p))) { const data = await getPublic(); return coursePage(data, m[1], '', pubCrumbs(null)); }
      if ((m = /^\/(?:lecture|l)\/([a-z0-9-]+)$/.exec(p))) { const data = await getPublic(); return lecturePage(data, m[1], '', pubCrumbs); }
      if ((m = /^\/c\/([a-z0-9-]+)(?:\/(course|lecture|l)\/([a-z0-9-]+))?$/.exec(p))) return await cabinet(m[1], m[2] === 'l' ? 'lecture' : m[2], m[3]);
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
    if (url.pathname === location.pathname && url.search === location.search && url.hash) {
      history.pushState(null, '', url.pathname + url.search + url.hash);
      document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    history.pushState(null, '', url.pathname + url.search + url.hash);
    route();
  });
  window.addEventListener('popstate', route);
  route();
})();
