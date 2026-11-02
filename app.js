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
    const load = () => fetch(STATIC ? u('/data/public.json') : '/api/public').then((r) => r.json());
    if (!pub) pub = await load().catch(() => new Promise((ok) => setTimeout(ok, 800)).then(load)); // сеть моргнула — вторая попытка
    return pub;
  }
  const lecturesOfCourse = (data, c) => c.modules.flatMap((m) => m.lectures).map((id) => data.lectures[id]).filter(Boolean);
  const dirOf = (data, id) => data.directions.find((d) => d.id === id) || { title: '', color: '#1E40AF' };
  const courseOfLecture = (data, lid) => data.courses.find((c) => c.modules.some((m) => m.lectures.includes(lid)));
  const watchable = (l) => !!(l && (l.video || l.placeholder));
  // Открыть можно и лекцию без видео, если у неё готов комплект (конспект, тест)
  const openable = (l) => !!(l && (l.video || l.placeholder || l.kit));
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
    const meta = [nLect(c.lectureCount), c.duration ? mins(c.duration) : '', c.kitCount ? 'конспекты и тесты' : '', !c.videoCount && !c.kitCount ? 'готовится' : ''].filter(Boolean).join(' · ');
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
    const quiz = p && p.quiz ? ` · тест ${p.quiz.score}/${p.quiz.total}` : '';
    const right = watchable(l) ? `<span class="mono">${st === 'done' ? 'просмотрено' : st === 'started' ? `с ${clock(p.t)}` : mins(l.duration)}${quiz}</span>`
      : l.kit ? `<span class="mono">конспект и тест${quiz}</span>`
      : `<span class="tag-soon">Скоро · ${esc(l.soon || 'в подготовке')}</span>`;
    const inner = `<span class="num ${st}">${st === 'done' ? I.check : String(n).padStart(2, '0')}</span>
      <span class="t"><b>${esc(l.title)}</b><small>${esc(l.desc)}</small></span>${right}`;
    return openable(l) ? `<a class="lrow" href="${u(base + '/lecture/' + l.id)}" data-link>${inner}</a>` : `<div class="lrow is-soon">${inner}</div>`;
  }

  // ───── Главная: цифровое издательство учебных материалов

  // Анимация «было → стало»: абзац уходит со страницы учебника и становится кадром лекции
  function baStage(pairs) {
    const root = app.querySelector('.ba');
    if (!root) return;
    const $ = (s) => root.querySelector(s);
    const scene = $('.ba-scene'), page = $('.ba-page'), img = $('.ba-page img'), hl = $('.ba-hl'), frag = $('.ba-frag'), scr = $('.ba-screen'), shot = $('.ba-screen img');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const src = (f) => u('/img/cases/' + f + '.jpg');
    pairs.forEach((k) => { new Image().src = src(k.was); new Image().src = src(k.now); });
    let cur = 0, timers = [];
    const stop = () => { timers.forEach(clearTimeout); timers = []; };
    const later = (ms, f) => timers.push(setTimeout(() => (root.isConnected ? f() : stop()), ms));
    const STEPS = ['s1', 's2', 's3', 's4'];

    function fly() {
      const R = scene.getBoundingClientRect(), a = hl.getBoundingClientRect(), b = scr.getBoundingClientRect(), p = page.getBoundingClientRect();
      if (!a.width || !frag.animate) return;
      Object.assign(frag.style, {
        left: a.left - R.left + 'px', top: a.top - R.top + 'px', width: a.width + 'px', height: a.height + 'px',
        backgroundImage: `url("${img.src}")`, backgroundSize: `${p.width}px ${p.height}px`, backgroundPosition: `${p.left - a.left}px ${p.top - a.top}px`,
      });
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const k = Math.min(b.width / a.width, b.height / a.height) * 0.9;
      frag.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1, filter: 'blur(0)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(${(1 + k) / 2})`, opacity: 1, filter: 'blur(0)', offset: 0.6 },
        { transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: 0, filter: 'blur(8px)' },
      ], { duration: 900, easing: 'cubic-bezier(.55, 0, .25, 1)' });
    }

    function show(n, first) {
      stop();
      cur = n;
      root.querySelectorAll('[data-ba]').forEach((b) => b.classList.toggle('on', +b.dataset.ba === n));
      const go = () => {
        const k = pairs[n];
        root.classList.add('reset');
        root.classList.remove('out', ...STEPS);
        page.style.aspectRatio = k.ar[0] + ' / ' + k.ar[1];
        page.style.setProperty('--arh', k.ar[1] / k.ar[0]);
        img.src = src(k.was);
        shot.src = src(k.now);
        scr.setAttribute('href', u('/course/' + k.course));
        $('.ba-cap').textContent = k.page;
        const [x, y, w, h] = k.hl;
        Object.assign(hl.style, { left: x + '%', top: y + '%', width: w + '%', height: h + '%' });
        void root.offsetWidth;
        root.classList.remove('reset');
        if (still) { root.classList.add(...STEPS); return; }
        later(250, () => root.classList.add('s1'));   // по странице идёт сканер
        later(1650, () => root.classList.add('s2'));  // находит главное
        later(2300, fly);                              // абзац улетает в экран
        later(2900, () => root.classList.add('s3'));  // включается лекция
        later(3500, () => root.classList.add('s4'));  // и комплект к ней
        later(9500, () => show((cur + 1) % pairs.length));
      };
      if (first) go();
      else { root.classList.add('out'); later(300, go); }
    }

    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ba]');
      if (b && +b.dataset.ba !== cur) show(+b.dataset.ba);
    });
    show(0, true);
  }

  // Ниже первого экрана: сцены «доверие» сами листаются, год издания и пилот оживают при прокрутке
  function homeScenes() {
    const tr = app.querySelector('.tr');
    if (tr) {
      let cur = 0, timer;
      const go = (n) => {
        cur = n;
        tr.querySelectorAll('[data-tr]').forEach((b) => b.classList.toggle('on', +b.dataset.tr === n));
        tr.querySelectorAll('[data-sc]').forEach((s) => s.classList.toggle('on', +s.dataset.sc === n));
        clearTimeout(timer);
        timer = setTimeout(() => (tr.isConnected ? go((cur + 1) % 3) : null), 6500);
      };
      tr.addEventListener('click', (e) => { const b = e.target.closest('[data-tr]'); if (b) go(+b.dataset.tr); });
      tr._go = go;
    }
    const tz = app.querySelector('.tz-video');
    if (tz) {
      const v = tz.querySelector('video');
      tz.querySelector('.tz-play').addEventListener('click', () => { v.controls = true; tz.classList.add('on'); v.play(); });
      v.addEventListener('ended', () => { tz.classList.remove('on'); v.controls = false; v.load(); });
    }
    app.querySelector('.reel')?.addEventListener('click', (e) => {
      const b = e.target.closest('.reel-item');
      if (!b) return;
      const box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML = `<figure><img src="${b.dataset.src}" alt="" /><figcaption>${esc(b.dataset.cap)}</figcaption></figure>`;
      const close = () => { box.remove(); removeEventListener('keydown', onKey); };
      const onKey = (ev) => ev.key === 'Escape' && close();
      box.addEventListener('click', close);
      addEventListener('keydown', onKey);
      document.body.append(box);
    });
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target === tr) tr._go(0);
      io.unobserve(en.target);
    }), { threshold: 0.35 });
    app.querySelectorAll('.tr, .yr, .pilot').forEach((el) => io.observe(el));
  }

  async function home() {
    const data = await getPublic();
    const featured = data.lectures['svarka-istoriya-1'] || Object.values(data.lectures).find(watchable);
    const top = data.courses.filter((x) => x.direction !== 'triz').sort((a, b) => (b.videoCount * 2 + b.kitCount) - (a.videoCount * 2 + a.kitCount)).slice(0, 3);
    const c = data.contacts || {};
    const demo = data.demoCabinet;
    // Было → стало: настоящая страница учебника и кадр лекции по ней.
    // hl — абзац, из которого сделан кадр: left, top, width, height в % страницы
    const PAIRS = [
      { tab: 'Сварка', was: 'case_book_p45', ar: [700, 894], now: 'case_frame_temp', page: 'учебник по сварке, стр. 45', hl: [21, 10.8, 65, 10.2], course: 'svarka-tehnologiya' },
      { tab: 'Робототехника', was: 'case2_book_p23', ar: [700, 1024], now: 'case2_frame_types', page: 'учебник по робототехнике, стр. 23', hl: [9.5, 21.8, 82, 13.6], course: 'meh-osnovy' },
    ];
    const REEL = [['arc', 'Анатомия сварочной дуги'], ['types', 'Виды подобия роботов'], ['temp', 'Температура дуги'], ['asimo', 'Антропоморфный робот'], ['jet', 'Реактивная струя дуги'], ['primate', 'Приматоморфный робот'], ['blow', 'Магнитное дутьё'], ['snake', 'Серпентоморфные роботы']];
    app.innerHTML = `
      <div class="wrap">
        <section class="hero2">
          <h1>Учебники, которые не&nbsp;читают,&nbsp;— <em>в&nbsp;курсы, которые смотрят</em></h1>
          <p class="sub">Переиздаём учебные материалы вашей компании. К&nbsp;каждой главе&nbsp;— видеолекция, презентация, методичка и&nbsp;тест.</p>
        </section>

        <section class="ba" id="cases">
          <div class="ba-head">
            <div class="ba-tabs">${PAIRS.map((k, i) => `<button class="${i ? '' : 'on'}" data-ba="${i}">${esc(k.tab)}</button>`).join('')}</div>
            <span class="ba-note">настоящие страницы и кадры из наших курсов</span>
            <a class="ba-cta" href="#contacts" data-link>Хочу так с моим учебником ${I.arrow}</a>
          </div>
          <div class="ba-scene">
            <figure class="ba-was">
              <figcaption><span class="ba-tag">Было</span><span class="ba-cap"></span></figcaption>
              <div class="ba-page"><img alt="Страница учебника" /><i class="ba-hl"></i><i class="ba-scan"></i></div>
            </figure>
            <div class="ba-arr"><i></i><i></i><i></i></div>
            <figure class="ba-now">
              <figcaption><span class="ba-tag now">Стало</span><span>видеолекция по этой странице</span></figcaption>
              <a class="ba-screen" data-link><span class="ba-wait">собираем лекцию<b><i></i><i></i><i></i></b></span><img alt="Кадр видеолекции" /><span class="ba-play">${I.arrow} Смотреть курс</span><span class="ba-bar"><i></i></span></a>
              <div class="ba-kit">${['Видеолекция', 'Презентация', 'Методичка', 'Тест', 'SCORM для LMS'].map((x) => `<span>${I.check}${x}</span>`).join('')}</div>
            </figure>
            <div class="ba-frag"></div>
          </div>
        </section>

        <section class="ba-after" id="kit">
          <div class="facts">
            <div class="fact"><b>2–3 недели</b><span>на курс</span></div>
            <div class="fact"><b>В 3–10 раз</b><span>дешевле продакшна</span></div>
            <div class="fact"><b>50+ лекций</b><span>для Корпоративной академии Росатома</span></div>
          </div>
          <div class="cta">
            <a class="btn primary" href="#contacts" data-link>Обсудить проект</a>
            ${featured ? `<a class="btn" href="${u('/lecture/' + featured.id)}" data-link>Смотреть пример лекции</a>` : ''}
          </div>
        </section>

        <section class="section tz-sec">
          <div class="tz">
            <div class="tz-text">
              <div class="eyebrow">Послушайте</div>
              <h2>30 секунд настоящей лекции</h2>
              <p class="lead">Фрагмент из курса «Введение в сварку». Голос, слайды, темп — так лекция звучит для ваших сотрудников.</p>
              ${featured ? `<a class="btn" href="${u('/lecture/' + featured.id)}" data-link>Вся лекция ${I.arrow}</a>` : ''}
            </div>
            <div class="tz-video">
              <video src="${u('/teaser/teaser.mp4')}" poster="${u('/teaser/teaser.jpg')}" preload="none" playsinline></video>
              <button class="tz-play" aria-label="Включить фрагмент со звуком"><span><svg width="34" height="34" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span><b>Включить со звуком · 0:32</b></button>
            </div>
          </div>
        </section>

        <section class="reel" aria-label="Слайды наших лекций">
          <div class="reel-head"><div class="eyebrow">Кадры из лекций</div><span class="mono">наведите — остановится, нажмите — откроется</span></div>
          <div class="reel-track">${[0, 1].map((k) => `<div class="reel-row" ${k ? 'aria-hidden="true"' : ''}>${REEL.map(([f, cap]) => `<button class="reel-item" data-src="${u('/img/reel/' + f + '.jpg')}" data-cap="${esc(cap)}" ${k ? 'tabindex="-1"' : ''}><img src="${u('/img/reel/' + f + '.jpg')}" alt="${esc(cap)}" loading="lazy" /><span>${esc(cap)}</span></button>`).join('')}</div>`).join('')}</div>
        </section>

        <section class="section" id="trust">
          <div class="eyebrow">Почему нам доверяют учебники</div>
          <h2>Три вопроса, которые вы зададите</h2>
          <div class="tr">
            <div class="tr-tabs">
              <button class="on" data-tr="0"><b>А факты точные?</b><span>Каждый — со ссылкой на страницу вашего учебника</span><i></i></button>
              <button data-tr="1"><b>Кто проверяет?</b><span>Ваш эксперт принимает готовое: 1–2 круга правок</span><i></i></button>
              <button data-tr="2"><b>Как это попадёт к людям?</b><span>Пакет SCORM в вашу LMS — или наш кабинет</span><i></i></button>
            </div>
            <div class="tr-stage">
              <div class="tr-scene on" data-sc="0">
                <div class="tr-fact">
                  <div class="tr-crop frame"><span class="tr-mark" style="left:62%;top:24%;width:31%;height:13%"></span></div>
                  <svg class="tr-link" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M2 20 C 40 20, 60 20, 98 20"/></svg>
                  <div class="tr-crop book"><span class="tr-mark" style="left:21%;top:11%;width:65%;height:10%"></span></div>
                </div>
                <div class="tr-cap"><span class="chip-ok">${I.check} 7000 °C</span> кадр лекции ← учебник, стр. 45</div>
              </div>
              <div class="tr-scene" data-sc="1">
                <div class="tr-doc">
                  <div class="tr-line w90"></div><div class="tr-line w70"><em class="tr-note n1">термин: «катет шва»</em></div>
                  <div class="tr-line w80"></div><div class="tr-line w60"><em class="tr-note n2">уточнить по ГОСТ</em></div><div class="tr-line w85"></div>
                  <div class="tr-stamp">${I.check} Согласовано</div>
                </div>
                <div class="tr-cap"><span class="tr-round">круг 1</span><span class="tr-round r2">круг 2</span> эксперт не пишет — он проверяет</div>
              </div>
              <div class="tr-scene" data-sc="2">
                <div class="tr-lms">
                  <div class="tr-pkg">SCORM<br><small>лекция.zip</small></div>
                  <div class="tr-win">
                    <div class="tr-bar"><i></i><i></i><i></i><span>Ваша LMS</span></div>
                    ${[['Иванов А.', 92], ['Петрова Е.', 85], ['Сидоров К.', 64]].map(([n, v]) => `<div class="tr-row"><span>${n}</span><b><i style="--v:${v}%"></i></b><em>${v >= 80 ? 'сдал' : 'учится'}</em></div>`).join('')}
                  </div>
                </div>
                <div class="tr-cap">балл, статус и место остановки — сразу в вашей системе</div>
              </div>
            </div>
          </div>
        </section>

        <section class="section" id="pub">
          <div class="pub">
            <div>
              <div class="eyebrow">Издание, а не разовый заказ</div>
              <h2>Курс живёт вместе с&nbsp;производством</h2>
              <p class="lead" style="margin:0 0 22px">Новые лекции — по графику. Поменялся стандарт — обновляем.</p>
              ${demo ? `<a class="btn primary" href="${u('/c/' + demo.slug)}" data-link>Посмотреть кабинет ${I.arrow}</a>` : ''}
            </div>
            <div class="yr">
              <div class="yr-track"><i class="yr-fill"></i></div>
              <div class="yr-months">${['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'].map((m, i) => `<div class="yr-m" style="--i:${i}"><span class="yr-dot ${[2, 5, 8, 11].includes(i) ? 'rel' : ''} ${i === 6 ? 'upd' : ''}"></span><small>${m}</small></div>`).join('')}</div>
              <div class="yr-legend"><span><i class="lg rel"></i>новый выпуск</span><span><i class="lg upd"></i>изменился ГОСТ → лекция обновлена</span></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="row-head">
            <div><div class="eyebrow">Примеры</div><h2>Посмотрите курсы целиком</h2></div>
            <a class="btn" href="${u('/catalog')}" data-link>Весь каталог ${I.arrow}</a>
          </div>
          <div class="cgrid">${top.map((x) => courseCard(data, x, '')).join('')}</div>
        </section>

        <section class="section" id="contacts">
          <div class="eyebrow">Пилот без обязательств</div>
          <h2>Пришлите одну главу — через неделю лекция</h2>
          <div class="pilot">
            <div class="pl-step"><b>1</b><span>Глава или регламент</span></div>
            <div class="pl-arr"><i></i></div>
            <div class="pl-step"><b>7</b><span>дней — ваш эксперт не пишет сценарий</span></div>
            <div class="pl-arr"><i></i></div>
            <div class="pl-step on"><b>${I.check}</b><span>Лекция с полным комплектом</span></div>
          </div>
          <div class="contacts">
            <div><div class="name">${esc(c.name)}</div><div class="role">${esc(c.role)}</div></div>
            <div class="links">
              ${c.email ? `<a class="btn primary" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Пилотная лекция')}&body=${encodeURIComponent('Здравствуйте! Хотим пилотную лекцию.\n\nКомпания:\nТема и материал (глава, регламент):\nДля кого обучение:\nКонтакт:')}">Запросить пилот ${I.arrow}</a>` : ''}
              ${c.telegram ? `<a class="btn" href="https://t.me/${esc(c.telegram)}" target="_blank" rel="noopener">Telegram · @${esc(c.telegram)}</a>` : ''}
              ${c.phone ? `<a class="btn" href="tel:${esc(c.phone.replace(/[^+\d]/g, ''))}">${esc(c.phone)}</a>` : ''}
            </div>
          </div>
        </section>
        <footer class="foot"><span>mplatforma.tech</span><span>© М-Платформа, 2026</span></footer>
      </div>`;
    baStage(PAIRS);
    homeScenes();
    document.title = 'М-Платформа — цифровое издательство учебных материалов';
  }

  // ───── Для корпоративных университетов и учебных центров
  async function corpPage() {
    const data = await getPublic();
    const c = data.contacts || {};
    const sample = data.lectures['svarka-istoriya-1'];
    const mail = c.email ? `mailto:${c.email}?subject=${encodeURIComponent('Пилотная лекция М-Платформы')}&body=${encodeURIComponent('Здравствуйте! Хотим пилотную лекцию по нашему материалу.\n\nКомпания и учебный центр:\nТема и материал (глава, регламент):\nДля кого обучение:\nКакая LMS используется:\nКонтакт:')}` : '';
    const STEPS = [
      ['До старта', 'Бриф на 30 минут и NDA', 'Вы передаёте материалы: учебник или главы, регламенты, методички — в любом виде. Назначаете эксперта для согласования.'],
      ['Неделя 1', 'Пилотная лекция с комплектом', 'Видео, презентация, методичка, конспект и тест по одной главе. Согласуем стиль, ведущего, подачу.'],
      ['Недели 2–3', 'Серия лекций', 'Готовим остальные главы. Каждый факт сверяем с источником, эксперт проверяет — 1–2 круга правок.'],
      ['Сдача', 'Файлы и пакеты для LMS', 'Видео, презентации, методички и SCORM-пакеты — загружаете в свою LMS или открываете сотрудникам кабинет на платформе.'],
      ['Дальше', 'Издание по подписке', 'План выпусков на год, новые лекции по графику, обновления при изменении стандартов, оборудования и регламентов.'],
    ];
    const FILES = [
      ['Видеолекция с ведущим', 'MP4', 'Лекция по одной главе, ведущий-аватар, визуал к каждому блоку'],
      ['Презентация', 'PDF, PPTX', 'Слайды лекции — для очного занятия и повторения'],
      ['Методичка для преподавателя', 'DOCX, PDF', 'Цели и план занятия, понятия, вопросы для обсуждения, практика, проверка'],
      ['Конспект и термины', 'DOCX, PDF', 'Краткое содержание и словарь — чтобы вернуться к теме без видео'],
      ['Тест с пояснениями', 'в SCORM и DOCX', '10 вопросов к лекции, порог прохождения — 80%'],
      ['SCORM-пакет', 'SCORM 1.2, ZIP', 'Видео, конспект и тест одним модулем: балл, статус и место остановки уходят в вашу LMS'],
    ];
    app.innerHTML = `
      <div class="wrap">
        <section class="corp-hero">
          <div class="eyebrow">Для корпоративных университетов и учебных центров</div>
          <h1>Переиздаём ваши учебные материалы в курсы — и сдаём прямо в вашу LMS</h1>
          <p class="sub">Свежие и понятные форматы для сотрудников на основе того, что у вас уже есть: учебников, регламентов, методичек. За 2–3 недели и в 3–10 раз дешевле классического продакшна.</p>
          <div class="cta">
            ${mail ? `<a class="btn primary" href="${mail}">Запросить пилотную лекцию ${I.arrow}</a>` : ''}
            <a class="btn" href="${u('/scorm/svarka-istoriya-1.zip')}" download>${I.down} Пример SCORM-пакета</a>
          </div>
        </section>

        <section class="section" style="padding-top:20px">
          <div class="eyebrow">Как проходит проект</div>
          <h2>От брифа до курса в вашей LMS — за 2–3 недели</h2>
          <div class="timeline">${STEPS.map(([w, t, d], i) => `<div class="tl ${i === STEPS.length - 1 ? 'accent' : ''}"><span class="mono">${esc(w)}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join('')}</div>
        </section>

        <section class="section">
          <div class="eyebrow">Что вы получаете</div>
          <h2>Комплект к каждой лекции — в форматах, которые принимает ваша система</h2>
          <div class="files-table">
            ${FILES.map(([t, f, d]) => `<div class="ft-row"><b>${esc(t)}</b><span class="mono">${esc(f)}</span><span>${esc(d)}</span></div>`).join('')}
          </div>
          <p class="lead" style="margin-top:16px">SCORM 1.2 загружается в iSpring LMS, WebTutor, Mirapolis, Moodle и другие системы с поддержкой стандарта.
            ${sample ? `Посмотрите комплект целиком <a class="link" href="${u('/lecture/' + sample.id)}" data-link>на примере лекции</a>.` : ''}</p>
        </section>

        <section class="section">
          <div class="corp-grid">
            <div class="box-lg">
              <div class="eyebrow">Права и безопасность</div>
              <h3>Ваши материалы остаются вашими</h3>
              <ul>
                <li>${I.check}<span>NDA — до передачи материалов</span></li>
                <li>${I.check}<span>Все права на готовые материалы — у вас: курс выходит под вашим брендом</span></li>
                <li>${I.check}<span>Можем ничего не размещать у себя: сдаём файлами и SCORM-пакетами в вашу LMS</span></li>
                <li>${I.check}<span>Кабинет на платформе — по ссылке и паролю, закрыт от поисковиков</span></li>
              </ul>
            </div>
            <div class="box-lg accent">
              <div class="eyebrow">Издание, а не разовый заказ</div>
              <h3>Курсы обновляются вместе с вашим производством</h3>
              <ul>
                <li>${I.check}<span>Годовой план выпусков: новые лекции по графику</span></li>
                <li>${I.check}<span>Обновления при изменении стандартов, оборудования и регламентов — в согласованные сроки</span></li>
                <li>${I.check}<span>В кабинете видно, что вышло, что в работе и что обновлено</span></li>
                <li>${I.check}<span>Материалы становятся активом компании: их можно предлагать партнёрам и рынку</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section class="section" id="pilot">
          <div class="cta-band">
            <div><h2>Пилотная лекция за неделю — без обязательств</h2>
            <p>Пришлите одну главу или регламент: покажем лекцию с полным комплектом и SCORM-пакетом для вашей LMS.</p></div>
            <div class="cta">
              ${mail ? `<a class="btn primary" href="${mail}">Написать на почту</a>` : ''}
              ${c.telegram ? `<a class="btn" href="https://t.me/${esc(c.telegram)}" target="_blank" rel="noopener">Telegram · @${esc(c.telegram)}</a>` : ''}
              ${c.phone ? `<a class="btn" href="tel:${esc(c.phone.replace(/[^+\d]/g, ''))}">${esc(c.phone)}</a>` : ''}
            </div>
          </div>
        </section>
        <footer class="foot"><span>mplatforma.tech</span><span>© М-Платформа, 2026</span></footer>
      </div>`;
    document.title = 'Для корпоративных университетов — М-Платформа';
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
    const next = nextToWatch(data, c) || lecturesOfCourse(data, c).find(openable);
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
              ${next ? `<a class="btn primary" href="${u(base + '/lecture/' + next.id)}" data-link>${I.playSm} ${started ? 'Продолжить' : pr.done ? 'Следующая лекция' : watchable(next) ? 'Начать смотреть' : 'Открыть первую лекцию'}</a>`
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

  // ───── Комплект лекции: конспект, термины, тест (public/kit/<id>.json), слайды (public/slides/<id>/NN.jpg)
  const kitCache = {};
  async function getKit(id) {
    if (!(id in kitCache)) kitCache[id] = await fetch(u(`/kit/${id}.json`)).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    return kitCache[id];
  }
  const md = (s) => (window.marked && window.DOMPurify ? DOMPurify.sanitize(marked.parse(String(s || ''), { gfm: true, breaks: true })) : `<p>${esc(s)}</p>`);
  // Заголовок «# …» в конспекте повторяет название лекции — на странице он уже есть
  const dropTitle = (s) => String(s || '').replace(/^\s*#\s+[^\n]*\n+/, '');

  function quizView(id, test) {
    const best = (progOf(id) || {}).quiz;
    return `<div class="quiz" data-id="${esc(id)}">
      <div class="quiz-head"><b>Проверьте себя: ${test.length} ${plural(test.length, 'вопрос', 'вопроса', 'вопросов')}</b><span class="mono" id="quiz-score">${best ? `лучший результат ${best.score} из ${best.total}` : 'выберите ответ — сразу увидите, верно ли'}</span></div>
      ${test.map((q, qi) => `<div class="qq" data-q="${qi}">
        <div class="qt"><span class="mono">${qi + 1}.</span> ${esc(q.q)}</div>
        <div class="qo">${q.options.map((o, oi) => `<button class="qopt" data-q="${qi}" data-o="${oi}"><span>${'АБВГ'[oi] || oi + 1}</span>${esc(o)}</button>`).join('')}</div>
        <div class="qe hidden"></div>
      </div>`).join('')}
      <div class="quiz-res hidden" id="quiz-res"></div>
    </div>`;
  }
  function bindQuiz(id, test) {
    const box = app.querySelector('.quiz');
    if (!box) return;
    const answers = {};
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.qopt');
      if (b && !(b.dataset.q in answers)) {
        const qi = +b.dataset.q, oi = +b.dataset.o, q = test[qi];
        answers[qi] = oi === q.answer;
        const wrap = box.querySelector(`.qq[data-q="${qi}"]`);
        wrap.querySelectorAll('.qopt').forEach((x) => {
          x.disabled = true;
          if (+x.dataset.o === q.answer) x.classList.add('ok');
          else if (+x.dataset.o === oi) x.classList.add('bad');
        });
        const ex = wrap.querySelector('.qe');
        ex.innerHTML = `<b>${answers[qi] ? 'Верно.' : 'Неверно.'}</b> ${esc(q.explain || '')}`;
        ex.classList.remove('hidden');
        const n = Object.keys(answers).length, ok = Object.values(answers).filter(Boolean).length;
        box.querySelector('#quiz-score').textContent = `отвечено ${n} из ${test.length} · верно ${ok}`;
        if (n === test.length) {
          const prev = (progOf(id) || {}).quiz;
          if (!prev || ok > prev.score) progSave(id, { quiz: { score: ok, total: test.length } });
          const res = box.querySelector('#quiz-res');
          res.innerHTML = `<b>Результат: ${ok} из ${test.length}</b><span>${ok >= Math.ceil(test.length * 0.8) ? 'Материал усвоен.' : 'Стоит вернуться к конспекту и пройти ещё раз.'}</span><button class="btn sm" id="quiz-again">Пройти ещё раз</button>`;
          res.classList.remove('hidden');
          res.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (e.target.closest('#quiz-again')) showTab('test');
    });
  }

  // Документ комплекта (конспект, методичка) — в Word (.doc из HTML) или на печать / в PDF
  function docHtml(title, body) {
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>@page{size:A4;margin:2cm 1.5cm 2cm 2cm}body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.45;color:#111}h1{font-size:17pt}h2{font-size:13.5pt;margin-top:14pt}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:4pt 6pt;vertical-align:top;font-size:10pt}th{background:#eee}.mp{color:#1E40AF;font-size:9pt;letter-spacing:.06em;text-transform:uppercase}</style></head>
<body><div class="mp">М-Платформа · цифровое издательство учебных материалов</div><h1>${esc(title)}</h1>${body}</body></html>`;
  }
  function saveWord(title, body) {
    const blob = new Blob(['\ufeff', docHtml(title, body)], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/[\\/:*?"<>|«»]/g, '').slice(0, 90) + '.doc';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function printDoc(title, body) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(docHtml(title, body)); w.document.close(); w.focus();
    setTimeout(() => w.print(), 300);
  }
  const docActions = `<div class="doc-actions"><button class="btn sm" data-doc="word">${I.down} Скачать в Word</button><button class="btn sm" data-doc="print">Распечатать или PDF</button></div>`;
  function bindDocActions(title) {
    const box = app.querySelector('#tab-body');
    box.querySelector('.doc-actions')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-doc]'); if (!b) return;
      const body = box.querySelector('.doc').innerHTML;
      b.dataset.doc === 'word' ? saveWord(title, body) : printDoc(title, body);
    });
  }

  let tabState = null; // { l, kit, base }
  async function showTab(name) {
    if (!tabState) return;
    const { l } = tabState;
    app.querySelectorAll('.ltab').forEach((t) => t.classList.toggle('on', t.dataset.tab === name));
    const body = app.querySelector('#tab-body');
    if (name === 'about') {
      body.innerHTML = `<p class="desc">${esc(l.desc)}</p>
        ${l.outline.length ? `<div class="outline"><h3>Содержание лекции</h3><ol>${l.outline.map((o) => `<li>${esc(o)}</li>`).join('')}</ol></div>` : ''}`;
      return;
    }
    if (name === 'slides') {
      body.innerHTML = `<div class="slides">${Array.from({ length: l.slides }, (_, i) => {
        const src = u(`/slides/${l.id}/${String(i + 1).padStart(2, '0')}.jpg`);
        return `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="Слайд ${i + 1}" loading="lazy" /><span class="mono">${i + 1}</span></a>`;
      }).join('')}</div>`;
      return;
    }
    if (name === 'files') {
      body.innerHTML = `<div class="downloads">${l.downloads.map((f) =>
        `<a class="dl" href="${esc(u(f.url))}" download>${I.down}${esc(f.label)} <small>${esc(f.kind)}${f.size ? ' · ' + mb(f.size) : ''}</small></a>`).join('')}</div>`;
      return;
    }
    body.innerHTML = '<div class="empty" style="padding:40px 0">Загружаем…</div>';
    const kit = await getKit(l.id);
    if (!kit) { body.innerHTML = '<div class="empty">Материал готовится.</div>'; return; }
    if (name === 'notes') { body.innerHTML = `${docActions}<div class="doc">${md(dropTitle(kit.notes))}</div><p class="kit-note">Конспект собран по тексту лекции, подготовленному по учебнику.</p>`; bindDocActions(`Конспект — ${l.title}`); }
    if (name === 'guide') {
      if (!kit.guide) { body.innerHTML = '<div class="empty">Методичка готовится.</div>'; return; }
      body.innerHTML = `<div class="kit-lead">Для преподавателя или наставника: цели и план занятия, ключевые понятия, вопросы для обсуждения, практика и проверка.</div>${docActions}<div class="doc">${md(dropTitle(kit.guide))}</div>`;
      bindDocActions(`Методичка — ${l.title}`);
    }
    if (name === 'terms') body.innerHTML = `<div class="doc">${md(dropTitle(kit.glossary))}</div>`;
    if (name === 'test') { body.innerHTML = quizView(l.id, kit.test); bindQuiz(l.id, kit.test); }
  }

  // ───── Лекция (публичная и в кабинете)
  function lecturePage(data, id, base, crumbsFor) {
    const l = data.lectures[id];
    if (!l) return notFound();
    const c = courseOfLecture(data, id);
    const ls = c ? lecturesOfCourse(data, c) : [l];
    const i = ls.findIndex((x) => x.id === id);
    const prev = ls.slice(0, i).reverse().find(openable);
    const next = ls.slice(i + 1).find(openable);
    const d = c ? dirOf(data, c.direction) : { title: '', color: '#1E40AF' };
    const tabs = [['about', 'О лекции']];
    if (l.kit) tabs.push(['notes', 'Конспект'], ['test', 'Тест'], ['terms', 'Термины'], ['guide', 'Методичка']);
    if (l.slides) tabs.push(['slides', `Слайды · ${l.slides}`]);
    if ((l.downloads || []).length) tabs.push(['files', 'Скачать']);
    const note = l.placeholder || (l.kit ? 'Видео скоро · конспект и тест уже здесь' : 'Скоро · ' + (l.soon || 'в подготовке'));
    let n = 0;
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head" style="padding-bottom:0">${crumbsFor(c)}</div>
        <div class="watch">
          <div>
            ${l.video ? `<div class="player"><video playsinline preload="metadata" controlsList="nodownload" poster="${esc(u(l.poster))}" oncontextmenu="return false"><source src="${esc(u(l.video))}" type="video/mp4" /></video></div>
                <div class="resume hidden" id="resume-hint"></div>`
              : `<div class="player-soon ${l.poster ? '' : 'compact'}">${cover(l.poster, l.title, d)}<div class="ps-note"><span>${esc(note)}</span></div></div>`}
            <div class="lec-nav">
              ${prev ? `<a class="btn sm" href="${u(base + '/lecture/' + prev.id)}" data-link>${I.back} Предыдущая</a>` : '<span></span>'}
              ${next ? `<a class="btn sm primary" href="${u(base + '/lecture/' + next.id)}" data-link>Следующая ${I.arrow}</a>` : (c ? `<a class="btn sm" href="${u(base + '/course/' + c.id)}" data-link>К программе курса</a>` : '')}
            </div>
            <h1>${esc(l.title)}</h1>
            <div class="meta">${esc(c ? c.title : '')}${l.duration ? ` · ${mins(l.duration)}` : ''}</div>
            ${tabs.length > 1 ? `<div class="ltabs">${tabs.map(([k, t]) => `<button class="ltab" data-tab="${k}">${esc(t)}</button>`).join('')}</div>` : ''}
            <div id="tab-body"></div>
          </div>
          <aside class="side">
            <h4>${esc(c ? c.title : 'Лекции')}</h4>
            ${ls.map((o) => {
              const st = isDone(o.id) ? 'done' : '';
              const sub = watchable(o) ? mins(o.duration) : o.kit ? 'конспект и тест' : 'скоро';
              const inner = `<span class="num ${st}">${st ? I.check : String(++n).padStart(2, '0')}</span><span><b>${esc(o.title)}</b><span>${sub}</span></span>`;
              return openable(o) ? `<a class="side-item ${o.id === id ? 'cur' : ''}" href="${u(base + '/lecture/' + o.id)}" data-link>${inner}</a>` : `<div class="side-item is-soon ${o.id === id ? 'cur' : ''}">${inner}</div>`;
            }).join('')}
          </aside>
        </div>
      </div>`;
    tabState = { l };
    app.querySelector('.ltabs')?.addEventListener('click', (e) => { const t = e.target.closest('.ltab'); if (t) showTab(t.dataset.tab); });
    showTab(!l.video && l.kit ? 'notes' : 'about');
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
            const inner = `<span class="mono">${esc(date(l.added))}</span><b>${esc(l.title)}</b><span>${esc(c ? c.title : '')}</span>${!watchable(l) ? `<span class="tag-soon">${l.kit ? 'Конспект и тест · видео скоро' : 'Скоро · ' + esc(l.soon || 'в подготовке')}</span>` : ''}`;
            return openable(l) ? `<a class="fresh-item" href="${u(base + '/lecture/' + l.id)}" data-link>${inner}</a>` : `<div class="fresh-item">${inner}</div>`;
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
        <div class="help" id="gate-help">Нет пароля? Напишите менеджеру, который прислал ссылку.</div>
      </div></div>`;
    document.title = 'Кабинет компании — М-Платформа';
    getPublic().then((pd) => {
      const demo = pd && pd.demoCabinet;
      if (!demo || demo.slug !== slug || !demo.password) return;
      const h = document.getElementById('gate-help');
      if (!h) return;
      h.innerHTML = `Это демо-кабинет. Пароль: <b class="mono">${esc(demo.password)}</b> <button class="btn sm" id="gate-fill" type="button">Подставить</button>`;
      document.getElementById('gate-fill').addEventListener('click', () => { document.getElementById('pw').value = demo.password; document.getElementById('gate-form').requestSubmit(); });
    }).catch(() => {});
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
      if (p === '/corp') return await corpPage();
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
