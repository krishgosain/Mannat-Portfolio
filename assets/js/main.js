(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const body = document.body;
  const nav = $('#nav');
  body.dataset.theme = 'noir';
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  /* ---------- smooth scroll (never hijacks touch) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    lenis.stop();
    window.__mcLenis = lenis;
  }
  const lockScroll = () => { root.classList.add('is-locked'); lenis && lenis.stop(); };
  const unlockScroll = () => { root.classList.remove('is-locked'); lenis && lenis.start(); };
  const jumpTo = y => {
    if (lenis) { lenis.start(); lenis.scrollTo(y, { immediate: true, force: true }); }
    else scrollTo(0, y);
  };

  /* ---------- cover reveal ---------- */
  let coverShown = false;
  const showCover = () => {
    if (coverShown) return; coverShown = true;
    $$('.cover .line-mask, .cover .fade').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), i * 110));
  };

  /* =====================================================
     INTRO: a ~11s fashion-film title sequence
     ===================================================== */
  const intro = $('.intro');
  const inertTargets = [nav, $('main'), $('#menu')];
  const setInert = on => inertTargets.forEach(el => el && (on ? el.setAttribute('inert', '') : el.removeAttribute('inert')));
  let introDone = false, timers = [], anims = [];

  const endIntro = () => {
    root.classList.remove('intro-on', 'intro-hold');
    intro && intro.remove();
    setInert(false);
    $('#menu') && $('#menu').setAttribute('inert', '');
    unlockScroll();
  };

  const finish = (fadeMs = 520) => {
    if (introDone) return; introDone = true;
    timers.forEach(clearTimeout); anims.forEach(a => { try { a.cancel(); } catch (e) {} });
    showCover();
    root.classList.remove('intro-hold');
    const f = intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeMs, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => { setInert(false); unlockScroll(); }, Math.min(fadeMs, 300));
    f.onfinish = endIntro;
    setTimeout(endIntro, fadeMs + 200);
  };

  const runIntro = () => {
    const quick = root.classList.contains('intro-quick');
    try { sessionStorage.setItem('mc-intro', '1'); } catch (e) {}
    lockScroll(); setInert(true);
    const skip = $('.intro__skip', intro);
    skip.focus({ preventScroll: true });
    skip.addEventListener('click', e => { e.stopPropagation(); finish(); });
    intro.addEventListener('click', () => finish());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });

    if (quick) { timers.push(setTimeout(() => finish(800), 200)); return; }

    const IMGS = ['desk', 'tr-2', 'hands', 'glove', 'tr-3', 'silk-face', 'vera-hero'].map(n => `/assets/img/${n}.webp`);
    const loaders = IMGS.concat(['/assets/img/cover.webp']).map(src => new Promise(res => {
      const im = new Image(); im.decoding = 'async'; im.src = src;
      im.onload = () => (im.decode ? im.decode().catch(() => {}).then(() => res(im)) : res(im));
      im.onerror = () => res(null);
    }));
    const fontsReady = document.fonts ? Promise.all([document.fonts.load('400 100px "Bodoni Moda"'), document.fonts.load('italic 400 100px "Bodoni Moda"')]).catch(() => {}) : Promise.resolve();
    const ready = Promise.race([Promise.all([...loaders, fontsReady]), new Promise(r => setTimeout(r, 2500))]);
    ready.then(() => { if (!introDone) timeline(); });
  };

  function timeline() {
    const IMGS = ['desk', 'tr-2', 'hands', 'glove', 'tr-3', 'silk-face', 'vera-hero'].map(n => `/assets/img/${n}.webp`);
    const WORDS = ['Strategy', 'Content', 'Culture', 'Story'];
    const q = s => $(s, intro);
    const cutsEl = q('.intro__cuts'), win = q('.intro__win'), wordsEl = q('.intro__words');
    const E = 'cubic-bezier(.16,1,.3,1)', E2 = 'cubic-bezier(.77,0,.18,1)';
    const A = (el, kf, o) => { const a = el.animate(kf, Object.assign({ fill: 'both', easing: E }, o)); anims.push(a); return a; };
    const tStart = performance.now();
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!introDone) fn(); }, Math.max(0, ms - (performance.now() - tStart))));
    const vw = innerWidth, vh = innerHeight;

    /* beat 1: name assembles letter by letter (0.3 - 2.9s) */
    const chars = [];
    $$('.ln', intro).forEach(ln => {
      const t = ln.dataset.ln, n = t.length;
      [...t].forEach((c, i) => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s._d = i - (n - 1) / 2; ln.appendChild(s); chars.push(s); });
    });
    chars.forEach((c, k) => A(c, [
      { opacity: 0, filter: 'blur(16px)', transform: `translate3d(${(c._d * 0.5).toFixed(2)}em,0,0)` },
      { opacity: 1, filter: 'blur(5px)', offset: .35 },
      { opacity: 1, filter: 'blur(0)', transform: 'translate3d(0,0,0)' }
    ], { duration: 1300, delay: 300 + k * 95 }));
    A(q('.intro__glow'), [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 2200, delay: 100 });

    /* gold line draws + tag (1.9 - 3.2s) */
    const nm = q('.intro__nm'), rule = q('.intro__rule'), tag = q('.intro__tag');
    const nr = nm.getBoundingClientRect();
    const ry = nr.bottom - vh / 2 + Math.max(10, nr.height * .06);
    const rw = rule.offsetWidth;
    const wr = win.getBoundingClientRect(), ww = wr.width, wh = wr.height;
    tag.style.top = (vh / 2 + ry + 16) + 'px';
    A(rule, [{ transform: `translateY(${ry}px) scaleX(0)` }, { transform: `translateY(${ry}px) scaleX(1)` }], { duration: 1100, delay: 1900, easing: E2 });
    A(tag, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: .9, transform: 'none' }], { duration: 800, delay: 2300 });

    /* beat 2: name recedes, line becomes the window (3.4 - 4.2s) */
    A(nm, [{ opacity: 1, filter: 'blur(0)', transform: 'scale(1)' }, { opacity: 0, filter: 'blur(10px)', transform: 'scale(.94)' }], { duration: 800, delay: 3400, easing: E2, fill: 'forwards' });
    A(tag, [{ opacity: .9 }, { opacity: 0 }], { duration: 400, delay: 3400, fill: 'forwards' });
    A(rule, [{ transform: `translateY(${ry}px) scaleX(1)` }, { transform: `translateY(0px) scaleX(${(ww / rw).toFixed(4)})` }], { duration: 800, delay: 3400, easing: E2, fill: 'forwards' });
    A(rule, [{ opacity: 0 }, { opacity: 0 }], { duration: 1, delay: 4200, fill: 'forwards' });
    A(win, [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0% 0 0% 0)' }], { duration: 650, delay: 4200, easing: E2 });
    A(q('.intro__frame'), [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 4500 });
    A(q('.intro__meta'), [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 4300 });

    /* beat 3: heartbeat cuts, quickening (4.2 - 7.4s) */
    const imgEls = IMGS.map(src => { const im = document.createElement('img'); im.src = src; im.alt = ''; im.decoding = 'async'; cutsEl.appendChild(im); return im; });
    const T = [4200, 4900, 5500, 6000, 6400, 6750, 7050]; // image cut times (ms); cover lands at 7300
    const count = q('.intro__count b');
    const showCut = k => {
      imgEls.forEach((im, i) => im.classList.toggle('on', i === k));
      count.textContent = '0' + (k + 1);
      if (k > 0) win.animate([{ transform: 'scale(1.035)' }, { transform: 'none' }], { duration: 340, easing: E });
    };
    T.forEach((ms, k) => at(ms, () => showCut(k)));

    /* word sequence */
    const wt = [4500, 5350, 6050, 6700];
    WORDS.forEach((w, i) => {
      const s = document.createElement('span'); s.className = 'intro__w'; s.textContent = w; wordsEl.appendChild(s);
      A(s, [{ transform: 'translateY(115%)' }, { transform: 'translateY(0)' }], { duration: 650, delay: wt[i] });
      A(s, [{ transform: 'translateY(0)' }, { transform: 'translateY(-115%)' }], { duration: 500, delay: i < 3 ? wt[i + 1] - 80 : 7350, easing: E2, fill: 'forwards' });
    });

    /* beat 4: her photo lands in the window, then opens to full bleed (7.3 - 9.0s) */
    at(6900, () => {
      const cp = $('.cover__photo');
      const R = cp.getBoundingClientRect();
      const hero = q('.intro__hero'), hin = q('.intro__heroin'), him = $('img', hero);
      Object.assign(hero.style, { left: R.left + 'px', top: R.top + 'px', width: R.width + 'px', height: R.height + 'px' });
      him.style.objectPosition = getComputedStyle($('img', cp)).objectPosition;
      const s = Math.max(vw / R.width, vh / R.height) * 1.002;
      const tx = vw / 2 - (R.left + R.width / 2), ty = vh / 2 - (R.top + R.height / 2);
      const T0 = `translate3d(${tx}px,${ty}px,0) scale(${s})`;
      const v = (R.height - wh / s) / 2, h = (R.width - ww / s) / 2;
      const winClip = `inset(${v}px ${h}px ${v}px ${h}px)`;
      hero.style.transform = T0; hero.style.clipPath = winClip;
      at(7300, () => {
        hero.style.visibility = 'visible';
        win.style.visibility = 'hidden';
        q('.intro__frame').style.opacity = 1;
        A(hero, [{ transform: T0, clipPath: winClip }, { transform: T0, clipPath: 'inset(0px 0px 0px 0px)' }], { duration: 1300, delay: 150, easing: E2 });
        A(hin, [{ transform: 'scale(1.0)' }, { transform: 'scale(1.06)' }], { duration: 2000, delay: 150, easing: 'linear' });
        A(q('.intro__frame'), [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
        A(q('.intro__meta'), [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
      });
      /* beat 5: curtain opens, photo settles into the cover layout (9.0 - 10.8s) */
      at(9150, () => {
        intro.style.background = 'transparent';
        $$('.intro__glow,.intro__name,.intro__rule,.intro__tag,.intro__frame,.intro__win,.intro__words,.intro__meta', intro).forEach(e => (e.style.display = 'none'));
        A(hero, [{ transform: T0, clipPath: 'inset(0px)' }, { transform: 'translate3d(0,0,0) scale(1)', clipPath: 'inset(0px)' }], { duration: 1650, easing: E2 });
        A(hin, [{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 1650, easing: E2 });
        root.classList.remove('intro-hold');
      });
      at(9700, showCover);
      at(10900, () => { introDone = true; endIntro(); });
    });
  }

  window.__mcReady = true;
  if (intro && root.classList.contains('intro-on')) runIntro();
  else { if (intro) intro.remove(); setTimeout(showCover, 150); unlockScroll(); }

  /* =====================================================
     MENU + CURTAIN NAVIGATION
     ===================================================== */
  const menu = $('#menu'), menuBtn = $('.nav__btn'), menuLabel = $('[data-menu-label]');
  $$('.menu__list li, .menu__more li').forEach((li, i) => li.style.setProperty('--i', i));
  $('.menu__k') && $('.menu__k').style.setProperty('--i', 0);
  const menuOpen = () => body.classList.contains('menu-open');
  const setMenu = on => {
    body.classList.toggle('menu-open', on);
    menuBtn.setAttribute('aria-expanded', on);
    menuLabel.textContent = on ? 'Close' : 'Menu';
    on ? menu.removeAttribute('inert') : menu.setAttribute('inert', '');
    on ? (lockScroll(), $('main').setAttribute('inert', ''), $('a', menu).focus({ preventScroll: true })) : (unlockScroll(), $('main').removeAttribute('inert'));
  };
  menuBtn.addEventListener('click', () => setMenu(!menuOpen()));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen()) { setMenu(false); menuBtn.focus(); } });
  matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches && menuOpen()) setMenu(false); });

  const curtain = $('.curtain'), cLabel = $('.curtain__label');
  let busy = false;
  const targetY = el => {
    if (el === null) return 0;
    const navH = nav.offsetHeight;
    const pt = parseFloat(getComputedStyle(el).paddingTop) || 0;
    return Math.max(0, el.getBoundingClientRect().top + scrollY + Math.max(0, navH + 10 - pt));
  };
  const goTo = (hash, label, fromMenu) => {
    const el = hash === '#top' ? null : $(hash);
    if (hash !== '#top' && !el) return;
    if (busy) return; busy = true;
    const done = () => { curtain.style.visibility = 'hidden'; busy = false; };
    const reveal = () => {
      jumpTo(targetY(el));
      history.replaceState(null, '', hash === '#top' ? location.pathname : hash);
      setTimeout(() => {
        cLabel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
        curtain.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 600, easing: 'cubic-bezier(.77,0,.18,1)', fill: 'forwards' }).onfinish = done;
      }, 140);
    };
    if (reduce) { if (fromMenu) setMenu(false); jumpTo(targetY(el)); busy = false; return; }
    cLabel.textContent = label;
    curtain.style.visibility = 'visible';
    if (fromMenu) {
      curtain.getAnimations().forEach(a => a.cancel());
      curtain.style.clipPath = 'inset(0 0 0 0)';
      cLabel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, fill: 'forwards' });
      setMenu(false); menu.style.transition = 'none'; requestAnimationFrame(() => (menu.style.transition = ''));
      setTimeout(reveal, 450);
    } else {
      curtain.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 450, easing: 'cubic-bezier(.77,0,.18,1)', fill: 'forwards' });
      cLabel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, delay: 200, fill: 'forwards' });
      setTimeout(reveal, 520);
    }
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const h = a.getAttribute('href');
    if (h.length < 2) return;
    e.preventDefault();
    const label = (el => el ? el.dataset.label : '')(h === '#top' ? null : $(h)) || (h === '#top' ? 'Cover' : a.textContent.trim());
    goTo(h, label.replace(/^\d+\s·\s/, ''), !!a.closest('.menu'));
  }));

  /* ---------- reveal on view ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('is-in');
    if (el.matches('.line-mask')) {
      const sibs = $$('.line-mask', el.parentElement);
      el.firstElementChild.style.transitionDelay = (sibs.indexOf(el) * 0.1) + 's';
    }
    io.unobserve(el);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.line-mask, .fade, .clip').forEach(el => { if (!el.closest('.cover')) io.observe(el); });
  $$('.findings, .mix, .roles, .kit').forEach(g => $$('.fade', g).forEach((el, i) => (el.style.transitionDelay = (i % 6) * 0.08 + 's')));

  /* ---------- count-up ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / 1400, 1);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3)))).padStart(2, '0');
      p < 1 && requestAnimationFrame(step);
    };
    reduce ? (el.textContent = String(to).padStart(2, '0')) : requestAnimationFrame(step);
    cio.unobserve(el);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- section themes + nav state ---------- */
  const themed = $$('[data-theme]').filter(el => el !== body);
  const labelled = $$('[data-label]');
  const here = $('[data-here]');
  let lastLabel = null;
  const setTheme = () => {
    const mid = innerHeight * 0.5;
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { if (body.dataset.theme !== s.dataset.theme) body.dataset.theme = s.dataset.theme; break; }
    }
    const probe = nav.offsetHeight + 24;
    let lab = '';
    for (const s of labelled) { const r = s.getBoundingClientRect(); if (r.top <= probe && r.bottom > probe) { lab = s.dataset.label; break; } }
    if (lab !== lastLabel) {
      lastLabel = lab;
      here.classList.remove('on');
      setTimeout(() => { here.textContent = lab; lab && here.classList.add('on'); }, 160);
    }
    nav.classList.toggle('is-solid', scrollY > 24);
  };

  /* ---------- scroll-linked: progress, parallax, reel bar ---------- */
  const bar = $('.progress');
  const par = $$('[data-speed]');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    setTheme();
    if (reduce) return;
    par.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const c = r.top + r.height / 2 - innerHeight / 2;
      img.style.transform = `translate3d(0,${(c * +img.dataset.speed).toFixed(1)}px,0)`;
    });
  };
  lenis ? lenis.on('scroll', onScroll) : addEventListener('scroll', onScroll, { passive: true });
  addEventListener('scroll', setTheme, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- cursor (fine pointers only) ---------- */
  const cur = $('.cursor'), label = $('.cursor__label');
  if (fine && !reduce) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { label.textContent = t.dataset.cursor; cur.classList.add('is-big'); }
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) cur.classList.remove('is-big');
    });
  } else cur.remove();

  /* ---------- contents: floating peek ---------- */
  const peek = $('.peek');
  if (fine) {
    let px = 0, py = 0, tx = 0, ty = 0, on = false;
    $$('.toc a').forEach(a => {
      a.addEventListener('pointerenter', () => {
        on = true; peek.classList.add('on');
        $$('img', peek).forEach(i => i.classList.toggle('on', i.dataset.k === a.dataset.peek));
      });
      a.addEventListener('pointerleave', () => { on = false; peek.classList.remove('on'); });
    });
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const ploop = () => {
      px += (tx - px) * 0.12; py += (ty - py) * 0.12;
      if (on || peek.classList.contains('on')) peek.style.left = '0', peek.style.translate = `${px + 30}px ${py - peek.offsetHeight / 2}px`;
      requestAnimationFrame(ploop);
    };
    ploop();
  } else peek.remove();

  /* ---------- reel: native swipe on touch, drag on desktop ---------- */
  $$('[data-reel]').forEach(reel => {
    const thumb = reel.nextElementSibling && $('i', reel.nextElementSibling);
    let down = false, sx = 0, sl = 0, moved = 0, v = 0, last = 0;
    const upd = () => {
      if (!thumb) return;
      const max = reel.scrollWidth - reel.clientWidth;
      const w = Math.max(reel.clientWidth / reel.scrollWidth, 0.1);
      thumb.style.width = w * 100 + '%';
      thumb.style.left = (max > 0 ? reel.scrollLeft / max : 0) * (1 - w) * 100 + '%';
    };
    reel.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    if (!fine) { reel.style.cursor = 'auto'; return; }
    reel.addEventListener('pointerdown', e => { down = true; moved = 0; sx = e.clientX; sl = reel.scrollLeft; last = e.clientX; v = 0; });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.abs(dx);
      if (moved > 4) reel.classList.add('dragging');
      reel.scrollLeft = sl - dx; v = e.clientX - last; last = e.clientX;
    });
    addEventListener('pointerup', () => {
      if (!down) return; down = false;
      setTimeout(() => reel.classList.remove('dragging'), 0);
      const glide = () => { if (Math.abs(v) < 0.5) return; reel.scrollLeft -= v; v *= 0.93; requestAnimationFrame(glide); };
      glide();
    });
    reel.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    $$('img', reel).forEach(i => i.draggable = false);
    reel.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
      e.stopPropagation();
    }, { passive: true });
    reel.setAttribute('data-lenis-prevent-horizontal', '');
  });

  /* ---------- VERA phone ---------- */
  const phone = $('[data-phone]');
  if (phone) {
    const shots = $$('.phone__screens img', phone), dots = $$('.phone__dots i', phone), plabel = $('.phone__label', phone);
    const names = ['Welcome', 'Style personality', 'Budget range', 'Personalised AI styling', 'Today’s picks', 'Community picks'];
    let i = 0;
    const go = () => {
      const prev = shots[i]; i = (i + 1) % shots.length;
      prev.classList.remove('on'); prev.classList.add('out');
      setTimeout(() => prev.classList.remove('out'), 700);
      shots[i].classList.add('on');
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      plabel.textContent = names[i];
    };
    phone.addEventListener('click', go);
    phone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    phone.dataset.cursor = 'Tap';
  }

  /* ---------- VERA launch steps ---------- */
  const copy = [
    ['Open on the fashion pain points the audience already recognises: nothing to wear, endless scrolling, styles that don’t fit.', 'Instagram · TikTok', 'Problem'],
    ['Teasers and styling conversations that hint at a smarter way to shop, without naming the product yet.', 'Teaser content · Styling talk', 'Curiosity'],
    ['Gradually reveal the personalised styling experience, and invite early interaction and feedback.', 'Founder-led communication', 'Reveal'],
    ['Selected creators get early access and share real styling experiences with their audiences.', 'Creator-led storytelling', 'Social proof'],
    ['A launch that feels native to where the audience already discovers fashion, built on organic momentum.', 'Community · Organic discovery', 'Launch']
  ];
  const roman = ['I', 'II', 'III', 'IV', 'V'];
  const steps = $$('.step'), panel = $('[data-panel]'), ptag = $('[data-panel-tag]'), ptitle = $('[data-panel-title]'), stepsBox = $('.steps');
  const pick = n => {
    steps.forEach((s, k) => s.setAttribute('aria-selected', k === n));
    stepsBox.style.setProperty('--p', (n + 1) * 20 + '%');
    panel.parentElement.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: reduce ? 1 : 600, easing: 'cubic-bezier(.16,1,.3,1)' });
    panel.textContent = copy[n][0]; ptag.textContent = copy[n][1];
    ptitle.innerHTML = `<span>${roman[n]}</span> ${copy[n][2]}`;
  };
  steps.forEach((s, k) => {
    s.addEventListener('click', () => pick(k));
    s.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = (k + (e.key === 'ArrowRight' ? 1 : steps.length - 1)) % steps.length;
        steps[n].focus(); pick(n);
      }
    });
  });

  /* ---------- Miu Miu board: drag to rearrange (desktop only) ---------- */
  const board = $('[data-board]');
  if (board && fine && matchMedia('(min-width: 900px)').matches) {
    let z = 10;
    $$('.board__pic', board).forEach(p => {
      const r = getComputedStyle(p).getPropertyValue('--r') || '0deg';
      let sx, sy, ox, oy, dragging = false;
      p.addEventListener('pointerdown', e => {
        dragging = true; p.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY; ox = p.offsetLeft; oy = p.offsetTop;
        p.style.zIndex = ++z; p.style.transition = 'transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s';
        p.style.transform = 'rotate(0deg) scale(1.03)';
        p.style.boxShadow = '0 50px 90px -30px rgba(75,15,27,.6)';
      });
      p.addEventListener('pointermove', e => {
        if (!dragging) return;
        const bw = board.clientWidth, bh = board.clientHeight;
        const nx = Math.max(-40, Math.min(bw - p.offsetWidth + 40, ox + e.clientX - sx));
        const ny = Math.max(-40, Math.min(bh - p.offsetHeight + 40, oy + e.clientY - sy));
        p.style.left = nx + 'px'; p.style.top = ny + 'px';
      });
      const end = () => { if (!dragging) return; dragging = false; p.style.transform = `rotate(${r})`; p.style.boxShadow = ''; };
      p.addEventListener('pointerup', end); p.addEventListener('pointercancel', end);
      p.dataset.cursor = 'Drag';
    });
  } else { const bh = $('.board-hint'); bh && (bh.textContent = 'The moodboard'); }

  /* ---------- Trend signals ---------- */
  const sigs = $$('[data-s]'), views = $$('.signals__view img'), scap = $('.signals__cap');
  const sCopy = [
    'How people build and express a self online.',
    'Virtual try-ons and AR experiences changing how fashion is discovered.',
    'Owning digital goods, and the value audiences give them.',
    'Niche spaces where new behaviours start before going mainstream.',
    'New tools reshaping how consumers find and join culture.'
  ];
  const sel = n => {
    sigs.forEach((b, k) => b.setAttribute('aria-pressed', k === n));
    views.forEach((v, k) => v.classList.toggle('on', k === n));
    scap.textContent = sCopy[n];
  };
  sigs.forEach((b, k) => { b.addEventListener('click', () => sel(k)); if (fine) b.addEventListener('pointerenter', () => sel(k)); });

  /* ---------- content mix (tap to flip) ---------- */
  $$('.fmt').forEach(f => { f.setAttribute('aria-expanded', 'false'); f.addEventListener('click', () => { const o = f.classList.contains('open'); $$('.fmt').forEach(x => { x.classList.remove('open'); x.setAttribute('aria-expanded', 'false'); }); if (!o) { f.classList.add('open'); f.setAttribute('aria-expanded', 'true'); } }); });

  /* ---------- copy email ---------- */
  const cp = $('[data-copy]');
  cp && cp.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(cp.dataset.copy); cp.textContent = 'Copied'; }
    catch { cp.textContent = 'Select & copy'; }
    setTimeout(() => (cp.textContent = 'Copy email'), 1800);
  });

  /* ---------- clock: the visitor's own city + time, New Delhi alongside ---------- */
  const lcl = $('[data-clock-local]'), ind = $('[data-clock-in]'), indWrap = $('.cover__clock-in');
  let tz = 'UTC';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}
  const isIST = /^Asia\/(Kolkata|Calcutta)$/.test(tz);
  const city = isIST ? 'New Delhi' : (/^(UTC|GMT|Etc\/)/.test(tz) ? 'Local time' : tz.split('/').pop().replace(/_/g, ' '));
  const fmt = zone => { try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zone }).format(new Date()); } catch (e) { return '--:--'; } };
  const tickClock = () => {
    lcl.textContent = `${city} ${fmt(tz)}`;
    ind.textContent = fmt('Asia/Kolkata');
    if (isIST) indWrap.remove();
  };
  tickClock(); setInterval(tickClock, 30000);
})();
